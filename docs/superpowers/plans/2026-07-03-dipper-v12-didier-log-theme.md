# Dipper v1.2 — Tema "didier.log" (según mockup de referencia)

**Goal:** Adoptar la estética del mockup "Blog de Didier Parody.html" (Downloads): terminal-moderno, sin pixel font, azul primario + naranja secundario, IBM Plex Mono + Space Grotesk. Solo frontend (src/ + index.html); sin features nuevas.

## Tokens (extraídos del mockup — usar tal cual)

```css
--bg: #0a0e18;            /* fondo página */
--surface-1: #111830;     /* superficies suaves */
--surface-2: #151b2e;     /* cards de login/CTA */
--border: #1c2438;        /* borde default 1px */
--border-strong: #232d47; /* borde enfatizado */
--text: #e9ecf4;
--text-2: #c7cfe2;
--muted: #8b96b2;
--muted-2: #5b6a8f;       /* micro-labels, meta */
--accent: #3b82f6;        /* PRIMARIO azul */
--accent-2: #f0954c;      /* secundario naranja: highlights, cuadritos */
--error: #e05252;
```

- Fuentes: `IBM Plex Mono` (400;500;600) para UI/nav/labels/tags/meta/botones; `Space Grotesk` (400;500;700) títulos y cuerpo de lectura. Quitar `Press Start 2P` de index.html y todo uso de `.px`.
- Formas: bordes 1px sólidos (#1c2438 / #232d47 hover), border-radius 6px (pills/botones) a 10px (cards), SIN box-shadows, sin sombras duras. Hover: cambiar borde a `--border-strong` o `--accent`, no transform.
- Micro-labels: mono 11-13px uppercase letter-spacing 1.5-2px color `--muted-2`, patrón `// texto` o cuadrito naranja 7x7px inline.

## Cambios por vista (mantener TODA la funcionalidad existente)

**Header:** logo `didier<span azul>.log</span>` (IBM Plex Mono 17px 600, letter-spacing -0.3px). Nav mono minúsculas: `posts`, `perfil` (con sesión), `admin` (solo admin), botón `Ingresar` (borde 1px, mono) / UserButton. Border-bottom 1px sólido `--border` (ya no dashed).

**Home:** micro-label `// notas de ingeniería de datos` → H1 44px (mobile 32px) `Cloud, datos <span naranja>&</span> sistemas — escritos en producción.` → párrafo muted → CTA suscripción (botón azul sólido, texto blanco, radius 6). Después: **fila de filtro de tags** (pill `Todos` + pill por tag única de los posts; activa = fondo azul suave/borde azul; filtra client-side la lista, ruta /tag/:tag sigue funcionando). Lista de posts: cards fondo transparente/`--surface-1`, borde 1px, radius 10, hover borde azul; meta en mono 12px (fecha · X min); título Space Grotesk 20px; tags chips mono 11px borde 1px.

**Sección "el autor" (Home, tras la lista):** heading con cuadrito naranja `■ el autor` (mono uppercase), texto corto, "Áreas de foco" con chips mono, y links sociales `GitHub ↗` (https://github.com/DidierParody). LinkedIn/X: NO incluir hasta tener URLs (dejar comentario TODO).

**Post:** `← volver al blog` mono; título 36px; meta mono; markdown: código con fondo `--surface-1` borde 1px (mantener rehype-highlight); CTA final estilo card `--surface-2` borde 2px `--border-strong` radius 10 (patrón "Bienvenido de vuelta").

**Perfil:** signed-out = card "Bienvenido de vuelta" (H2 22px, copy: "Ingresa para suscribirte al newsletter y recibir cada post nuevo." — adaptado, NO mencionar comentar/guardar) + botón de login estilo mockup (fondo `--surface-2`, borde 1px `--border-strong`, radius, abre modal Clerk). Signed-in: card con avatar 96px borde 2px AZUL, resto igual que ahora pero con tokens nuevos.

**Admin:** micro-label `panel admin` + H1 28px `Publicar nuevo post`. Dropzone 2px dashed (`--border-strong`; azul al arrastrar encima) radius 10, copy "Arrastra tu archivo .md aquí" + "o haz clic para seleccionar desde tu equipo" (toda la zona clickeable → abre file picker). Secciones Drive/borradores/publicados con headings mono uppercase. Botones: primario azul sólido ("Publicar + email", "Guardar borrador"), secundarios borde 1px mono ("editar", "borrar", "Importar", "Cancelar", "Vista previa" en minúsculas mono como el mockup). Mensajes éxito azul `#8fd0ff`, error `#e05252`.

**SubscribeButton/Unsubscribe:** botón primario azul sólido; estados actuales intactos; copy actual OK.

## Verificación

`npm run build` + `npm test` (7/7) + dev server: `/`, `/perfil`, `/post/no-existe`, `/unsubscribe?token=x`, `/admin` (Zona restringida) — luego deploy prod. Commits atómicos: 1) `feat: tokens y tipografia didier.log`, 2) `feat: home con hero, filtro de tags y seccion autor`, 3) `feat: restyle de post, perfil, admin y suscripcion`.
