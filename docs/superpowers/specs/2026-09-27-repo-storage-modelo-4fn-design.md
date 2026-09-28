# Dipper v2 — Repo como storage + modelo normalizado (4FN)

Fecha: 2026-09-27 · Estado: aprobado

## Objetivo

1. Eliminar Google Drive por completo (código, secrets, scripts, columnas).
2. El contenido de cada post vive en este mismo repo (`DidierParody/Dipper`), en una carpeta con su `index.md` e imágenes.
3. Publicar = pegar en `/admin` el link del md o de la carpeta del post.
4. Normalizar el modelo de datos hasta 4FN, con desnormalización solo donde sea deliberada.

## Convención de contenido

```
content/
  posts/<slug>/
    index.md
    images/*.png|jpg|webp|gif|svg
  series/<series-slug>.md        # opcional, solo frontmatter
```

- `<slug>` = nombre de la carpeta. Debe cumplir `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Las imágenes se referencian con rutas relativas a la carpeta del post: `![alt](./images/x.png)`.

### Frontmatter de `index.md` (fuente de verdad de la metadata)

```yaml
---
title: Spark desde cero          # requerido
summary: Particiones y shuffles   # opcional
tags: [Spark, Data Engineering]   # opcional; name = texto, slug = slugify(texto)
series: spark-desde-cero          # opcional; slug de la serie
series_order: 1                   # requerido si hay series; entero > 0
cover: ./images/cover.png         # opcional; relativo a la carpeta del post
---
```

El cuerpo (todo lo que va después del frontmatter) se renderiza tal cual; el título NO se toma de un `# H1`.

### Frontmatter de `content/series/<slug>.md`

```yaml
---
title: Spark desde cero     # si el archivo no existe: title = slug humanizado
description: ...            # opcional
---
```

## Links aceptados en /admin

| Forma | Ejemplo |
|---|---|
| blob | `https://github.com/DidierParody/Dipper/blob/main/content/posts/x/index.md` |
| tree | `https://github.com/DidierParody/Dipper/tree/main/content/posts/x` |
| raw | `https://raw.githubusercontent.com/DidierParody/Dipper/main/content/posts/x/index.md` |
| ruta | `content/posts/x` o `content/posts/x/index.md` (ref = `main`) |

Se normaliza a `{ repo, ref, dir }` con `dir = content/posts/<slug>`. El repo debe coincidir con el env `CONTENT_REPO` (default `DidierParody/Dipper`). Refs con `/` no se aceptan.

## Modelo de datos

```
series(id PK, slug UQ, title, description?, created_at)
tags(id PK, slug UQ, name)
posts(id PK, slug UQ, title, summary?, cover_path?, reading_minutes, status,
      published_at?, created_at, updated_at, series_id FK?→series, series_order?)
  UQ(series_id, series_order); CHECK (series_id IS NULL) = (series_order IS NULL)
  CHECK status = 'draft' OR published_at IS NOT NULL
post_tags(post_id FK→posts, tag_id FK→tags, PK(post_id, tag_id))
post_sources(post_id PK FK→posts, repo, path, commit_sha[40 hex], synced_at, UQ(repo, path))
subscribers(id PK, clerk_user_id UQ, email, subscribed_at, unsubscribed_at?)   -- sin cambios
newsletter_sends(id PK, post_id FK UQ→posts, sent_at)
newsletter_deliveries(send_id FK, subscriber_id FK, status sent|failed, error?, attempted_at,
                      PK(send_id, subscriber_id))
```

Todas las FK hacia `posts` y `newsletter_sends` son `ON DELETE CASCADE`; `posts.series_id` es `ON DELETE SET NULL`.

Decisiones:
- **1FN:** `tags text[]` → `tags` + `post_tags`.
- **3FN:** `series_order` depende solo del post (1 post ∈ ≤1 serie) → vive en `posts`.
- **4FN:** tags, serie y entregas de newsletter son hechos independientes en relaciones separadas.
- **`post_sources` 1:1 separada:** aísla "dónde vive el contenido" del post editorial.
- **Sin contadores derivados:** enviados/fallidos = `count()` sobre `newsletter_deliveries`. `newsletter_sends.post_id` único evita doble envío; el reenvío solo alcanza a suscriptores activos sin entrega `sent`.
- **Desnormalización deliberada:** `reading_minutes` (se recalcula en cada sync) para no descargar cada md en el listado.
- **Sin `authors`/roles:** un solo autor, `ADMIN_EMAIL` basta.

`updated_at` se mantiene con trigger.

### RLS (lectura pública)
- `posts`: select donde `status = 'published'`.
- `post_sources`, `post_tags`: select si el post asociado está publicado.
- `tags`, `series`: select público.
- `subscribers`, `newsletter_*`: sin policies (solo service_role).

### Sync atómico
Función SQL `public.sync_post(p jsonb) returns uuid`, `security definer`, ejecutable solo por `service_role`. Payload:

```json
{ "slug": "...", "title": "...", "summary": null, "cover_path": null, "reading_minutes": 3,
  "tags": [{"slug": "spark", "name": "Spark"}],
  "series": {"slug": "...", "title": "...", "description": null} | null,
  "series_order": 1 | null,
  "repo": "DidierParody/Dipper", "path": "content/posts/x", "commit_sha": "<40 hex>" }
```

Hace upsert de la serie (por slug) y de los tags (por slug), upsert del post por slug (post nuevo = `draft`; si ya existe, conserva `status`/`published_at`), reemplaza `post_tags` y hace upsert de `post_sources`. Todo en una sola transacción.

### Migración de datos existentes
- `description` → `summary`; `tags text[]` → `tags` + `post_tags`.
- Se eliminan `drive_file_id` y `cover_url`.
- Los posts existentes quedan en `draft` (no tienen fuente en el repo). Al sincronizar una carpeta cuyo slug coincida, se re-vinculan.
- El bucket `post-assets` NO se borra por SQL (queda para limpieza manual).

## Backend (Edge Function `admin-posts`)

Acciones (todas requieren admin):

| action | input | output |
|---|---|---|
| `list` | — | `{ posts: AdminPost[] }` |
| `sync` | `{ url }` | `{ id, slug, title, created }` |
| `resync` | `{ id }` | `{ id, slug, title, created: false }` |
| `publish` | `{ id }` | `{ ok, newsletter: { sent, failed, skipped } }`. Error si el post no tiene fuente. |
| `send_newsletter` | `{ id }` | `{ ok, newsletter: { sent, failed, skipped } }` |
| `delete` | `{ id }` | `{ ok }` (no toca el repo) |
| `stats` | — | `{ subscribers }` |

```ts
interface AdminPost {
  id: string; slug: string; title: string; summary: string | null;
  status: 'draft' | 'published'; published_at: string | null;
  created_at: string; updated_at: string; reading_minutes: number;
  series: { slug: string; title: string } | null; series_order: number | null;
  tags: { slug: string; name: string }[];
  source: { repo: string; path: string; commit_sha: string; synced_at: string } | null;
  newsletter: { sent_at: string; sent: number; failed: number } | null;
}
```

Se eliminan: `create`, `update`, `get_content`, `upload_asset`, `drive_*`, la función `post-content`, `_shared/drive.ts` y `scripts/get-refresh-token.mjs`.

Flujo de `sync`:
1. `parseContentLink(url)` → `{ repo, ref, dir }`.
2. SHA: `GET https://api.github.com/repos/{repo}/commits/{ref}` con `Accept: application/vnd.github.sha` (usa `GITHUB_TOKEN` opcional).
3. Descarga `https://raw.githubusercontent.com/{repo}/{sha}/{dir}/index.md` (máx. 1MB, 404 → error claro).
4. Parsea el frontmatter (`npm:yaml`) y lo valida. Si hay serie, descarga `content/series/<slug>.md` en el mismo SHA (404 → título humanizado).
5. Calcula `reading_minutes = max(1, round(palabras/220))` sobre el cuerpo.
6. `rpc('sync_post', payload)`.

Newsletter: crea o reutiliza `newsletter_sends` del post, envía por Resend (batch de 100) a los suscriptores activos sin entrega `sent` y registra cada entrega (`upsert` en `newsletter_deliveries`). `skipped` = los que ya tenían `sent`.

## Frontend

- `Post` (en `src/lib/supabase.ts`) usa la forma pública de `AdminPost`, sin `newsletter` y con `source` no nulo.
- Query con embedding: `series(slug,title), post_tags(tags(slug,name)), post_sources(repo,path,commit_sha)`, mapeado a la forma anterior.
- `src/lib/content.ts`:
  - `contentBaseUrl(source)` = `https://cdn.jsdelivr.net/gh/{repo}@{sha}/{path}`
  - `stripFrontmatter(md)`
  - `resolveAssetUrl(base, src)`: deja intactas URLs absolutas (`scheme:`, `//`, `/`, `#`, `data:`) y resuelve `./` y `../` contra `base`.
  - `fetchPostMarkdown(source)`
- `Post.tsx`: descarga el md desde jsDelivr y renderiza imágenes y links relativos con `resolveAssetUrl`. Portada = `resolveAssetUrl(base, cover_path)`. Si hay serie, muestra "Parte N de M · <serie>" con anterior/siguiente.
- `Series.tsx` en `/series/:slug`: lista ordenada de los posts publicados de la serie.
- `Home`/`Creator`: tags como objetos `{slug, name}`.
- `Admin.tsx`: mismo layout visual. El editor y el importador de Drive se reemplazan por un input "pegar link" + SINCRONIZAR. Cada fila muestra SHA corto, `synced_at`, estado del newsletter y las acciones re-sincronizar / publicar+email / reenviar / eliminar.

## Publicar un post (flujo final)

1. Crear `content/posts/<slug>/index.md` + `images/`, y hacer commit y push a `main`.
2. `/admin` → pegar el link → SINCRONIZAR (queda en draft, anclado al SHA).
3. PUBLICAR + EMAIL.
4. Para editar: push → RE-SINCRONIZAR (toma el SHA nuevo).

## Testing
- vitest: `parseContentLink`, `stripFrontmatter`, `resolveAssetUrl`, `contentBaseUrl`.
- Verificación manual: `sync` de un post de ejemplo en `content/posts/`, render con imagen en `/post/<slug>`.
