# Dipper

Blog personal de desarrollador de [Didier Torres Parody](https://github.com/DidierParody) — Ingeniero de Datos.

Publico mis notas técnicas escritas en Notion, exportadas a Markdown, con una estética pixel art acorde a la marca.

**Producción:** [https://dipper-one.vercel.app](https://dipper-one.vercel.app)

## Stack

- **Frontend:** React + Vite (TypeScript), desplegado en Vercel
- **Auth:** Clerk (login con GitHub y Google)
- **Base de datos / backend:** Supabase (Postgres + Storage + Edge Functions)
- **Newsletter:** Resend (correo a suscriptores en cada publicación)

## Diseño

El spec completo del proyecto vive en [`docs/superpowers/specs/2026-07-02-dipper-blog-design.md`](docs/superpowers/specs/2026-07-02-dipper-blog-design.md).

## Cómo publicar

1. Escribo la nota en Notion y la exporto como Markdown (`Export` → `Markdown & CSV`).
2. Entro a [`/admin`](https://dipper-one.vercel.app/admin) con mi cuenta (login Clerk con el email admin).
3. Arrastro el `.md` exportado al panel — extrae automáticamente el título (primer `# H1`) y genera el slug.
4. Completo descripción y tags, y guardo el borrador.
5. Doy click en **PUBLICAR + EMAIL**: el post pasa a `published` y se dispara el newsletter a todos los suscriptores activos vía Resend.
