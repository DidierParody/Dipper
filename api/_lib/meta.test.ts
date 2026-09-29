import { describe, it, expect } from 'vitest';
import { injectMeta, postPageMeta, metaTags, type PostMeta } from './meta';

const html = `<!doctype html>
<html lang="es">
  <head>
    <title>Dipper — Notas de un Ingeniero de Datos</title>
    <!-- meta:start -->
    <meta property="og:title" content="default" />
    <!-- meta:end -->
  </head>
  <body><div id="root"></div></body>
</html>`;

const post: PostMeta = {
  slug: 'modelo-entidad-relacion',
  title: 'Modelo Entidad-Relación',
  summary: 'Entidades, atributos & "cardinalidades"',
  reading_minutes: 10,
  updated_at: '2026-09-29T14:43:46.183Z',
  series_order: 2,
  series: { title: 'Modelado de bases de datos' },
  tags: ['Bases de datos', 'MER'],
};

describe('meta de previsualización', () => {
  it('arma las etiquetas del post con url absoluta e imagen versionada', () => {
    const m = postPageMeta(post, 'https://dipper-one.vercel.app');
    expect(m.url).toBe('https://dipper-one.vercel.app/post/modelo-entidad-relacion');
    expect(m.image).toBe(
      `https://dipper-one.vercel.app/api/og?slug=modelo-entidad-relacion&v=${Date.parse(post.updated_at)}`,
    );
    expect(m.type).toBe('article');
  });

  it('usa una descripción por defecto si el post no tiene summary', () => {
    const m = postPageMeta({ ...post, summary: null }, 'https://x.dev');
    expect(m.description).toBe('Cloud, datos & sistemas escritos en producción.');
  });

  it('reemplaza el bloque por defecto y el title, escapando comillas y &', () => {
    const out = injectMeta(html, postPageMeta(post, 'https://x.dev'));
    expect(out).not.toContain('content="default"');
    expect(out).toContain('<title>Modelo Entidad-Relación · didier.log</title>');
    expect(out).toContain('og:description" content="Entidades, atributos &amp; &quot;cardinalidades&quot;"');
    expect(out).toContain('twitter:card" content="summary_large_image"');
    expect(out.match(/<!-- meta:start -->/g)).toHaveLength(1);
    expect(out).toContain('<div id="root"></div>');
  });

  it('no toca el HTML si faltan los marcadores', () => {
    const plain = '<html><head><title>x</title></head></html>';
    expect(injectMeta(plain, postPageMeta(post, 'https://x.dev'))).toBe(plain);
  });

  it('un título con < no inyecta HTML', () => {
    const tags = metaTags({ ...postPageMeta({ ...post, title: '<script>x</script>' }, 'https://x.dev') });
    expect(tags).not.toContain('<script>');
  });
});
