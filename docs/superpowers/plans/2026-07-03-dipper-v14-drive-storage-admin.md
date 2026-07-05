# Dipper v1.4 — Drive como storage de contenido + refactor admin

**Goal:** (1) Los `.md` viven en Google Drive (carpeta `markdowns`, id `1eTW_hfX-AOod9cu3FSVYFTVYkd2sT9Wm`), la BD guarda SOLO metadatos + referencia (`drive_file_id`). El upload manual del admin también escribe el archivo a Drive. (2) `/admin` refactorizado al layout EXACTO del mockup (`docs/reference/mockup-templates.html`, sección ADMIN).

**Precondición externa:** Didier debe subir el permiso del SA (`dipper-drive@dipper-501302.iam.gserviceaccount.com`) de Lector a **Editor** en la carpeta. Hasta entonces los uploads a Drive devolverán 403 — manejar el error con mensaje claro ("el service account necesita permiso de Editor").

## Task A — Backend

**Schema (nueva migración `supabase/migrations/0002_drive_storage.sql`, aplicar con `scripts/db-apply.mjs`):**

```sql
alter table public.posts add column if not exists drive_file_id text;
alter table public.posts add column if not exists reading_minutes int not null default 1;
alter table public.posts drop column if exists content_md;
-- tabla prácticamente vacía (solo el draft de prueba "Hola desde Drive", que ya
-- existe en Drive con file id 1NmPJsPtNdV8wr0TXJDdPxWam_nJe0IrE) — backfill manual:
update public.posts set drive_file_id = '1NmPJsPtNdV8wr0TXJDdPxWam_nJe0IrE'
  where slug = 'hola-desde-drive' and drive_file_id is null;
delete from public.posts where drive_file_id is null; -- huérfanos sin contenido
```

**`_shared/drive.ts`** — añadir (mismo patrón de accessToken existente, pero scope pasa de `drive.readonly` a `https://www.googleapis.com/auth/drive`):

```ts
export async function uploadMdFile(name: string, content: string): Promise<string> {
  const token = await accessToken();
  const metadata = { name, parents: [Deno.env.get('DRIVE_FOLDER_ID')!], mimeType: 'text/markdown' };
  const boundary = 'dipper' + crypto.randomUUID();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: text/markdown\r\n\r\n` +
    content + `\r\n--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`drive upload ${res.status}: el service account necesita permiso de Editor en la carpeta`);
  return (await res.json()).id;
}

export async function updateMdFile(fileId: string, content: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/markdown' }, body: content }
  );
  if (!res.ok) throw new Error(`drive update ${res.status}`);
}

export async function trashFile(fileId: string): Promise<boolean> {
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
  return res.ok; // tolerante: archivos de Didier no pueden ser borrados por el SA
}
```

**`admin-posts/index.ts`:**
- `create`: recibe `content_md` en el body como antes PERO ya no lo inserta en la BD → `uploadMdFile(slug + '.md', content_md)` → inserta metadatos con `drive_file_id` y `reading_minutes` (palabras/220, min 1 — helper local `calcReadingMinutes`).
- `update`: si viene `content_md` no vacío → `updateMdFile(drive_file_id del post, content)` + recalcular `reading_minutes`; el patch a BD solo lleva metadatos (title/slug/description/tags/cover_url/reading_minutes).
- `get_content` (nueva): body `{id}` → busca `drive_file_id`, `downloadFile`, devuelve `{content}` (para editar/vista previa).
- `drive_import`: ya no copia contenido a BD → descarga solo para extraer título y calcular reading_minutes, inserta metadatos con `drive_file_id` del archivo original. Evitar duplicados: si ya existe post con ese `drive_file_id`, devolver error `"ya importado"` (400).
- `delete`: borra fila y hace `trashFile(drive_file_id)` best-effort (ignora fallo).
- `list`: incluir `drive_file_id, reading_minutes` en el select.
- El límite 1MB se valida sobre `content_md` recibido, igual que antes.

**Nueva función pública `supabase/functions/post-content/index.ts`** (desplegar con `--no-verify-jwt`):

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { downloadFile } from '../_shared/drive.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  const { data: post } = await db.from('posts')
    .select('drive_file_id').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (!post?.drive_file_id) {
    return new Response('not found', { status: 404, headers: corsHeaders });
  }
  try {
    const md = await downloadFile(post.drive_file_id);
    return new Response(md, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch {
    return new Response('drive error', { status: 502, headers: corsHeaders });
  }
});
```

(Solo sirve posts `published` → los drafts siguen privados. GET además de POST: aceptar ambos.)

**Verificación A:** migración aplicada (tabla sin content_md, draft de prueba backfilleado); deploy de ambas funciones; con token admin: `get_content` del draft devuelve el markdown; `stats` sigue OK; `post-content?slug=hola-desde-drive` → 404 (es draft: correcto). Publicar temporalmente el draft → `post-content` devuelve el MD con Cache-Control → volver a draft (update status vía SQL directo `update posts set status='draft', published_at=null where slug='hola-desde-drive'`). Upload manual: si el SA sigue Lector, `create` debe devolver el error claro de Editor (verificarlo y reportarlo, no es fallo del código).

## Task B — Frontend

**`src/lib/supabase.ts`:** `Post` type: quitar `content_md`, añadir `reading_minutes: number` (y `drive_file_id?: string | null` solo si se necesita en admin vía api). `fetchPublishedPosts`/`fetchPostBySlug` ajustan el select (sin content_md). Nueva `fetchPostContent(slug)`:

```ts
export async function fetchPostContent(slug: string): Promise<string> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-content?slug=${encodeURIComponent(slug)}`
  );
  if (!res.ok) throw new Error(`content ${res.status}`);
  return res.text();
}
```

**`Home.tsx`:** tiempo de lectura ahora `post.reading_minutes` (eliminar uso de readingTime/content_md; `src/lib/reading-time.ts` y su test SE MANTIENEN solo si el admin los usa para preview local — si nada los usa, borrarlos junto con su test).

**`Post.tsx`:** metadata de fetchPostBySlug + contenido de fetchPostContent en paralelo; estado de carga del cuerpo ("Cargando..." mono muted); error de contenido → mensaje mono con retry link. `reading_minutes` del post para el meta.

**`src/lib/api.ts`:** añadir `getContent: (token, id) => call('admin-posts', { action: 'get_content', id }, token)`.

**`Admin.tsx` — REFACTOR ESTRUCTURAL al mockup (sección ADMIN de `docs/reference/mockup-templates.html`):** la página debe leerse como el mockup, en este orden exacto:
1. micro-label `panel admin` (naranja, mono, uppercase) + H1 28px "Publicar nuevo post" + al lado derecho del H1 un mono-text muted con `N suscriptores`.
2. Dropzone EXACTO del template (icono .md 44px borde naranja, "Arrastra tu archivo .md aquí", "o haz clic para seleccionar desde tu equipo", chip "Seleccionar archivo"; al cargar archivo: chip azul con nombre + ✕). Al soltar/seleccionar → parseNotionMd rellena el form.
3. Grid 2 col: Título | Etiquetas (input tags separados por coma, mismo estilo del select del mockup) y debajo fila Descripción (full width) + textarea Contenido con toggle `vista previa` (mono link) — el textarea muestra el md cargado; en modo edición carga el contenido REAL vía adminApi.getContent (ya no hay hint de "vacío para conservar").
4. Botón "Publicar post" estilo mockup (azul si hay archivo/contenido listo, #1c2438 si no) → en flujo real: "Guardar borrador" (secundario) + "Publicar post" (primario, con confirm de newsletter). Mensaje éxito mono azul `✓ publicado — ...` / error `#e05252`.
5. `■ importar desde drive` — botón chip "Listar archivos de Drive" + filas del patrón del mockup (nombre mono, fecha, acción `importar`). Si no configurado, card discreta con instrucciones.
6. `■ borradores (N)` — filas: chip tag azul, título, fecha, acciones `publicar` `editar` `borrar`.
7. `■ posts publicados (N)` — filas: chip tag, título, fecha, `editar` `borrar`.
Todo dentro de max-width 900, padding 56px 32px 120px, contenedores de lista con border 1px #1c2438 radius 10 overflow hidden.

**Verificación B:** build + tests; dev server: home muestra reading_minutes, post carga contenido desde la función pública (probar con el draft publicado temporalmente si A lo dejó publicado, o mock), /admin sin sesión "Zona restringida.". Commits atómicos. No push (el controlador hace push/deploy).
