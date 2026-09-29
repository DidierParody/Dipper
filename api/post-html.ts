// /post/:slug → index.html con las etiquetas Open Graph del post.
// La SPA carga igual; los bots de previsualización leen título, resumen e imagen.
import { fetchPostMeta, injectMeta, postPageMeta } from './_lib/meta.js';

let indexCache: { html: string; at: number } | null = null;

async function indexHtml(origin: string): Promise<string> {
  if (indexCache && Date.now() - indexCache.at < 60_000) return indexCache.html;
  const res = await fetch(`${origin}/index.html`);
  if (!res.ok) throw new Error(`index.html ${res.status}`);
  indexCache = { html: await res.text(), at: Date.now() };
  return indexCache.html;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') ?? url.host;
  const origin = `https://${host}`;
  const slug = url.searchParams.get('slug') ?? '';

  const [html, post] = await Promise.all([indexHtml(origin), fetchPostMeta(slug).catch(() => null)]);
  // Post inexistente o en borrador: la SPA muestra su propio 404 con el HTML por defecto.
  const body = post ? injectMeta(html, postPageMeta(post, origin)) : html;

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
