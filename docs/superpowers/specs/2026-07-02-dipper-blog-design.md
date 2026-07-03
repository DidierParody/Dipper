# Dipper — Blog personal de desarrollador (Spec de diseño)

**Fecha:** 2026-07-02
**Autor:** Didier Torres Parody (Ingeniero de Datos)
**Estado:** Borrador — pendiente de aprobación

## 1. Resumen

Blog personal de desarrollador donde Didier publica sus notas técnicas (originadas en Notion). Los visitantes pueden leer todo el contenido sin registrarse; quienes inicien sesión pueden suscribirse al newsletter y reciben un correo cada vez que se publica un post nuevo.

## 2. Decisión clave: Notion como fuente → Markdown como formato

**Decisión: subir archivos Markdown, no integrar la API de Notion.**

| Criterio | API de Notion (link) | Archivos MD (elegido) |
|---|---|---|
| Renderizado | Bloques propietarios, render complejo, difícil de tematizar en pixel art | `react-markdown` + resaltado de código, control total del estilo |
| Dependencia | Rate limits (3 req/s), token secreto, requiere proxy backend | Cero dependencia externa en runtime |
| Flujo de trabajo | Sincronización automática | Exportar de Notion (`⋯ → Export → Markdown`) y subir |
| Propiedad del contenido | Vive en Notion | Vive en tu base de datos |
| Velocidad de carga | Lenta o requiere jobs de sync | Instantánea desde Supabase |

Notion sigue siendo el editor: se escribe ahí, se exporta a MD (exportación nativa de Notion) y se sube por el panel de administración. Una integración con la API de Notion puede añadirse en una v2 si el paso manual resulta tedioso.

## 3. Stack

- **Frontend:** React + Vite (SPA), TypeScript, desplegado en Vercel.
- **Auth:** Clerk — social login con **Google y GitHub** (ambos soportados nativamente por Clerk).
- **Base de datos / backend:** Supabase (Postgres + Storage + Edge Functions).
- **Emails:** Resend, disparado desde una Edge Function de Supabase al publicar.
- **Integración Clerk ↔ Supabase:** integración third-party auth nativa de Supabase con Clerk (el JWT de Clerk se valida en Supabase y alimenta las políticas RLS).

## 4. Roles y permisos

| Rol | Quién | Puede |
|---|---|---|
| Visitante | Cualquiera, sin login | Leer todos los posts |
| Usuario | Login con Google/GitHub vía Clerk | Leer + suscribirse/desuscribirse al newsletter |
| Admin | Solo el Clerk user ID de Didier | Todo lo anterior + subir MD, publicar, gestionar posts |

El admin se identifica por `user_id` de Clerk almacenado como variable de entorno / claim; la ruta `/admin` se oculta y las escrituras se protegen con RLS.

## 5. Modelo de datos (Supabase)

```sql
-- Posts del blog
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,                     -- resumen para cards y meta tags
  content_md text not null,             -- markdown crudo
  cover_url text,                       -- imagen en Storage (opcional)
  tags text[] default '{}',
  status text not null default 'draft'  -- 'draft' | 'published'
    check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Suscriptores del newsletter
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz            -- null = activo
);
```

**RLS:**
- `posts`: SELECT público solo donde `status = 'published'`; INSERT/UPDATE/DELETE solo admin.
- `subscribers`: cada usuario solo ve/gestiona su propia fila (`clerk_user_id = auth.jwt()->>'sub'`); el admin puede listar.
- **Storage:** bucket `post-assets` (portadas e imágenes de posts), lectura pública, escritura solo admin.

## 6. Flujos

### Publicación
1. Didier escribe en Notion → exporta a Markdown.
2. En `/admin` sube el `.md` (+ imágenes opcionales), edita título/slug/tags/descripcón, guarda como borrador.
3. Al pulsar **Publicar**: se actualiza `status='published'`, y se invoca la Edge Function `send-newsletter`.

### Newsletter (Resend)
1. La Edge Function `send-newsletter` recibe el `post_id` (solo invocable por admin).
2. Consulta `subscribers` activos (`unsubscribed_at is null`).
3. Envía en lotes con la Batch API de Resend (hasta 100 por llamada) usando una plantilla HTML con la estética de la marca: título, descripción y link al post.
4. Cada correo incluye link de desuscripción (`/unsubscribe?token=...` firmado).

### Suscripción
1. Usuario pulsa **Suscribirse** → si no tiene sesión, Clerk abre el modal de login (Google/GitHub).
2. Con sesión activa, se inserta/reactiva su fila en `subscribers` con el email de Clerk.
3. Estado visible en la UI (botón cambia a "Suscrito ✓" / permite desuscribirse).

## 7. Páginas

| Ruta | Contenido |
|---|---|
| `/` | Home: hero con avatar pixel + tagline, lista de posts (cards), CTA de suscripción |
| `/post/:slug` | Post: markdown renderizado con resaltado de código, tags, CTA de suscripción al final |
| `/tag/:tag` | Lista filtrada por tag |
| `/admin` | Panel: subir MD, lista de posts con estado, botón publicar (solo admin) |
| `/unsubscribe` | Confirmación de desuscripción vía token del email |

## 8. Estética (basada en el logo)

Pixel art oscuro derivado del logo de marca:

- **Fondo:** azul-negro `#0A0E17`, con azul profundo `#16213E` para superficies elevadas.
- **Acento cálido:** naranja piel `#E8A25E` (color del personaje) para links, botones primarios y highlights.
- **Blanco roto** `#F2F2F0` para texto; gris azulado `#8B93A7` para secundario.
- **Motivo del anillo:** bordes punteados/segmentados (como el círculo del logo) en cards y separadores.
- **Tipografía:** `Press Start 2P` para logo, headings y botones; monoespaciada/sans legible (p. ej. `IBM Plex Mono` / `Inter`) para cuerpo — el pixel font completo cansa en textos largos.
- **Detalles:** bordes duros de 2–3px, sombras desplazadas sólidas (`4px 4px 0`), sin gradientes ni blur, esquinas rectas, hover con inversión de color.

## 9. Componentes principales (frontend)

- `PixelCard` — card de post con borde pixel y sombra dura.
- `PostRenderer` — `react-markdown` + `rehype-highlight` (o shiki) tematizado.
- `SubscribeButton` — estado según sesión Clerk + fila en `subscribers`.
- `AdminUpload` — dropzone de `.md`, parse de frontmatter opcional, preview.
- `Header/Footer` — navegación, avatar del logo, links sociales.

## 10. Manejo de errores

- Fallo al enviar newsletter: la publicación NO se revierte; la Edge Function registra fallos por lote y expone reintento desde `/admin`.
- Suscripción duplicada: upsert sobre `clerk_user_id` (reactiva si estaba desuscrito).
- MD inválido/gigante: límite de tamaño en el upload (p. ej. 1 MB) y preview antes de guardar.
- Rutas admin: doble protección (UI oculta + RLS en servidor). La UI nunca es la única barrera.

## 11. Testing

- Unit: parser/frontmatter, lógica de suscripción (estados), render de markdown con casos borde (código, tablas, imágenes).
- Integración: políticas RLS (usuario no puede leer drafts ni tocar suscriptores ajenos).
- Manual/E2E ligero: flujo login → suscribir → publicar → correo recibido (con email de prueba de Resend).

## 12. Fuera de alcance (v1)

- Comentarios, likes, contadores de vistas.
- Sync automático con la API de Notion.
- Búsqueda full-text.
- Modo claro (el blog es dark-only, coherente con la marca).

## 13. Preguntas resueltas

- **¿Control total de Supabase con credenciales?** Sí, casi al 100%: con un Personal Access Token (Management API / CLI de Supabase) se puede crear el proyecto, correr migraciones SQL, configurar auth, desplegar Edge Functions, crear buckets y setear secrets sin trabajo manual. Lo único manual: crear la cuenta/organización y aspectos de billing. Alternativa: conectar el MCP oficial de Supabase.
- **¿Login con GitHub además de Google?** Sí. Clerk soporta GitHub como social connection nativa: en desarrollo es un toggle en el dashboard; en producción se crea una GitHub OAuth App y se pegan las credenciales en Clerk. Para un blog de desarrollador, GitHub debería ser incluso el login principal.
