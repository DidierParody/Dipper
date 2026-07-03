# Dipper v1.1 — Drive import, rediseño pixel-acento, perfil y UX

> **For agentic workers:** ejecutar tarea por tarea. El código base v1 ya existe y funciona en producción — leer los archivos existentes antes de modificarlos. Mantener los contratos existentes salvo donde este plan diga lo contrario.

**Goal:** (1) Importar posts .md desde una carpeta de Google Drive en /admin; (2) bajar lo retro: pixel solo como acento (Press Start 2P solo en el logo; Space Grotesk títulos, Inter cuerpo); (3) página de perfil con avatar del proveedor OAuth (GitHub/Google); (4) UX más intuitiva en vistas de usuario y admin.

**Decisiones tomadas con el usuario:** Drive = fuente con importación manual desde /admin vía service account de Google (secrets `GOOGLE_SERVICE_ACCOUNT_JSON` y `DRIVE_FOLDER_ID`, aún NO configurados — la feature debe degradar con gracia mostrando instrucciones si faltan). Estética = "pixel solo como acento".

**Valores fijos:** ver plan v1 (`2026-07-02-dipper-blog-implementation.md`). Producción: https://dipper-one.vercel.app. Los mismos límites: nunca commitear `.env*`, commits atómicos por paths explícitos.

---

## Task A (backend): Drive import + stats en `admin-posts`

**Files:** Create `supabase/functions/_shared/drive.ts`; Modify `supabase/functions/admin-posts/index.ts`.

**`_shared/drive.ts`:**

```ts
import { SignJWT, importPKCS8 } from 'npm:jose@5';

export function driveConfigured(): boolean {
  return !!(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') && Deno.env.get('DRIVE_FOLDER_ID'));
}

async function accessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')!);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/drive.readonly' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token;
}

export interface DriveFile { id: string; name: string; modifiedTime: string; size?: string }

export async function listMdFiles(): Promise<DriveFile[]> {
  const folder = Deno.env.get('DRIVE_FOLDER_ID')!;
  const token = await accessToken();
  const q = encodeURIComponent(`'${folder}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`drive list ${res.status}`);
  const { files } = await res.json();
  return (files ?? []).filter(
    (f: { name: string; mimeType: string }) =>
      f.name.endsWith('.md') || f.mimeType === 'text/markdown'
  );
}

export async function downloadFile(fileId: string): Promise<string> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`drive download ${res.status}`);
  return await res.text();
}
```

**Nuevas actions en `admin-posts/index.ts`** (dentro del try, tras requireAdmin, siguiendo el patrón existente):

- `drive_status` → `json({ configured: driveConfigured() })`
- `drive_list` → si no configurado: `json({ error: 'drive no configurado' }, 400)`; si sí: `json({ files: await listMdFiles() })`
- `drive_import` → body `{ file_id, name }`; descarga el contenido, valida tamaño ≤ 1MB, extrae título del primer H1 (regex `^# (?!#)` por líneas — replicar lógica de `parseNotionMd` del frontend en una función local `parseMd`), genera slug (replicar `slugify`: NFD, sin diacríticos, kebab-case; si colisiona con slug existente, sufijar `-2`, `-3`...), inserta post draft con `tags: []` y `description: null`. Responde `json({ id, slug, title })`.
- `stats` → `json({ subscribers: N })` donde N = count de subscribers activos (`unsubscribed_at is null`, usar `{ count: 'exact', head: true }`).

**Verificación:** redeploy con `--no-verify-jwt --use-api`; probar con token admin de Clerk (mint vía API como en v1): `drive_status` → `{"configured":false}`, `drive_list` → 400 `drive no configurado`, `stats` → `{"subscribers":1}`. Sin token → 401. Commit: `feat: import desde google drive y stats en admin-posts`.

---

## Task B (frontend design): tema pixel-acento + perfil + UX usuario

**Files:** Modify `index.html`, `src/theme.css`, `src/components/{Header,Footer,PostCard,SubscribeButton}.tsx`, `src/pages/{Home,Post,Unsubscribe}.tsx`, `src/App.tsx`; Create `src/pages/Profile.tsx`, `src/lib/reading-time.ts` (+ test en `src/lib/reading-time.test.ts`).

**Dirección de diseño (obligatoria):**
- Fuentes en index.html: `Press+Start+2P` (solo logo) + `Space+Grotesk:wght@400;500;700` (títulos) + `Inter:wght@400;500;600` (cuerpo). Quitar VT323.
- theme.css: body 16px Inter line-height 1.7; h1 28px / h2 20px / h3 17px Space Grotesk 700; `.px` (pixel font) queda SOLO para el logo del header. Paleta intacta (#0A0E17/#16213E/#E8A25E/#F2F2F0/#8B93A7).
- Botones `.pixel-btn`: Inter 600 14px sentence case, border 2px, sombra dura 3px 3px 0 #000 (identidad pixel sutil), padding 10px 18px. Textos de botones en sentence case: "Suscribirme", "Login", "Publicar + email" (fuera el `> ..._` y las MAYÚSCULAS).
- Cards `.pixel-card`: border 2px, sombra 3px 3px 0 rgba(0,0,0,.55), hover: translate(-2px,-2px) + sombra 5px — feedback táctil.
- Mantener el motivo de anillo punteado en separadores (`.dashed-divider`) y tags con borde dashed accent. Inputs/labels a Inter.

**UX usuario:**
- `PostCard`: toda la card clickeable (envolver en `<Link>` con estilos, no solo el título), mostrar tiempo de lectura ("X min"), hover claro.
- `src/lib/reading-time.ts`: `readingTime(md: string): number` → `Math.max(1, Math.round(palabras / 220))` con test (TDD: caso corto → 1 min, caso ~440 palabras → 2 min).
- `Post.tsx`: link "← Volver" arriba, tiempo de lectura junto a la fecha, mantener CTA de suscripción al final (restyled).
- `Header`: nav con links "Posts" (/) y, con sesión, "Perfil" (/perfil); mantener `<UserButton/>`; logo DIPPER.DEV sigue en Press Start 2P (único uso).
- `Home`: hero más compacto, mostrar contador de posts si > 0. Estados de carga/vacío/error existentes se conservan (textos actuales OK).

**Perfil (`/perfil`, nueva ruta en App.tsx):**
- Si no hay sesión: mensaje + botón de login (SignInButton modal).
- Con sesión: card con `user.imageUrl` (avatar del proveedor OAuth — GitHub o Google) en 96px con border 2px accent, nombre completo, username si existe, email primario, badges de proveedores conectados (`user.externalAccounts.map(a => a.provider)`), estado de suscripción con el `SubscribeButton` reutilizado, y botón "Gestionar cuenta" que abre `openUserProfile()` de Clerk (`useClerk()`).

**Verificación:** `npm run build` y `npm test` (los 5 tests v1 + nuevos de reading-time deben pasar). Dev server: rutas `/`, `/perfil`, `/post/x`, `/unsubscribe?token=x` responden. Commits atómicos: 1) `feat: tema pixel-acento con space grotesk e inter`, 2) `feat: pagina de perfil con avatar oauth`, 3) `feat: ux de cards clickeables y tiempo de lectura`.

**Boundaries:** NO tocar `src/pages/Admin.tsx` ni `src/lib/api.ts` (otro agente los trabaja).

---

## Task C (admin UX): rediseño de /admin + integración Drive

**Files:** Modify `src/pages/Admin.tsx`, `src/lib/api.ts`. Ejecutar DESPUÉS de A y B (usa el tema nuevo y las actions nuevas).

**`src/lib/api.ts`** — añadir a `adminApi`:
```ts
driveStatus: (token: string) => call('admin-posts', { action: 'drive_status' }, token),
driveList: (token: string) => call('admin-posts', { action: 'drive_list' }, token),
driveImport: (token: string, file_id: string, name: string) =>
  call('admin-posts', { action: 'drive_import', file_id, name }, token),
stats: (token: string) => call('admin-posts', { action: 'stats' }, token),
```

**Rediseño de Admin.tsx (mantener toda la funcionalidad existente):**
- Header del panel con contador de suscriptores activos (action `stats`).
- **Sección "Importar desde Drive":** si `drive_status.configured === false`, mostrar aviso con las instrucciones de configuración resumidas (crear service account, compartir carpeta, avisar a Claude para setear secrets) en un card discreto. Si configured: botón "Listar archivos de Drive" → tabla de .md (nombre, fecha modif.) con botón "Importar" por fila → crea borrador y refresca la lista de posts. Deshabilitar el botón mientras importa; errores visibles.
- **Sección upload manual** (drag & drop actual) se conserva, con copy claro: "…o sube un .md manualmente".
- **Editar posts existentes:** botón "Editar" por fila que carga el post en el formulario (necesita el contenido: usar action `list` actual que NO trae content_md — añadir en el backend NO; en su lugar cargarlo vía REST público no sirve para drafts... solución: al editar, pedir el post con una action nueva NO; usar `update`: el formulario de edición carga título/slug/descripción/tags de la fila que ya tiene, y el content_md se edita solo si se re-sube el archivo o se escribe en el textarea — si el textarea está vacío al guardar edición, NO incluir content_md en el patch). Guardar con `adminApi.update`. Mantenerlo simple y documentar este límite con un hint en la UI ("deja el contenido vacío para conservar el actual").
- **Publicar:** `confirm()` antes de publicar advirtiendo que envía el newsletter a N suscriptores.
- **Separar visualmente Borradores y Publicados** (dos listas con headings), botones con labels claros en sentence case, mensajes de estado con color (éxito accent, error rojo suave #E24B4A).
- **Vista previa:** toggle "Vista previa" en el formulario que renderiza `draft.content_md` con ReactMarkdown (imports ya disponibles).

**Verificación:** build + tests OK; dev server `/admin` sin sesión → "Zona restringida.". Commit: `feat: admin rediseñado con drive import, edicion y vista previa`.

---

## Task D: deploy + verificación

- `npx vercel deploy --prod --token <VERCEL_TOKEN de .env> --yes` (proyecto ya linkeado).
- Probes: `/` 200, `/perfil` 200, `/admin` 200.
- E2E con token admin Clerk: `stats` → subscribers ≥ 1; `drive_status` → configured false (hasta que Didier entregue el service account); crear+publicar+borrar un post de humo verificando newsletter sent ≥ 1 failed 0; tabla limpia al final.
- Commit README si cambia algo del flujo. Push final.
