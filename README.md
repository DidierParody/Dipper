# Dipper

Blog personal de desarrollador de [Didier Torres Parody](https://github.com/DidierParody) — Ingeniero de Datos.

Publico mis notas técnicas escritas en Notion, exportadas a Markdown, con una estética pixel art acorde a la marca.

**Producción:** [https://dipper-one.vercel.app](https://dipper-one.vercel.app)

## Stack

- **Frontend:** React + Vite (TypeScript), desplegado en Vercel
- **Auth:** Clerk (login con GitHub y Google)
- **Base de datos / backend:** Supabase (Postgres + Edge Functions)
- **Contenido:** vive en este repo (`content/posts/<slug>/index.md` + imágenes), servido públicamente vía jsDelivr — sin Supabase Storage
- **Newsletter:** Resend (correo a suscriptores en cada publicación)

## Diseño

El spec completo del proyecto vive en [`docs/superpowers/specs/2026-07-02-dipper-blog-design.md`](docs/superpowers/specs/2026-07-02-dipper-blog-design.md). El rediseño de storage y modelo de datos está en [`docs/superpowers/specs/2026-09-27-repo-storage-modelo-4fn-design.md`](docs/superpowers/specs/2026-09-27-repo-storage-modelo-4fn-design.md).

## Cómo publicar

1. Creo la carpeta `content/posts/<slug>/` con su `index.md` (frontmatter + cuerpo) y, si aplica, `images/` con las imágenes referenciadas con rutas relativas (`./images/foo.png`).
2. Hago `git push` a `main`.
3. Entro a [`/admin`](https://dipper-one.vercel.app/admin) con mi cuenta (login Clerk con el email admin), pego el link al `index.md` o a la carpeta del post en GitHub, y doy click en **SINCRONIZAR**. El post queda en `draft`, anclado al commit sincronizado.
4. Doy click en **PUBLICAR + EMAIL**: el post pasa a `published` y se dispara el newsletter a todos los suscriptores activos vía Resend.
5. Para editar un post: hago `push` de los cambios y pulso **RE-SINCRONIZAR** en su fila — toma el commit nuevo sin tocar el estado de publicación.

### Formato del frontmatter

`content/posts/<slug>/index.md`:

```yaml
---
title: Spark desde cero          # requerido
summary: Particiones y shuffles  # opcional
tags: [Spark, Data Engineering]  # opcional
series: spark-desde-cero         # opcional; slug de la serie
series_order: 1                  # requerido si hay series; entero > 0
cover: ./images/cover.png        # opcional; relativo a la carpeta del post
---
```

`content/series/<slug>.md` (opcional, solo si el post pertenece a una serie):

```yaml
---
title: Spark desde cero
description: ...                 # opcional
---
```
