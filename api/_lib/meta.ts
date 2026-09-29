// Metadatos de previsualización (Open Graph / Twitter) para los links del blog.
// Los bots de WhatsApp, LinkedIn, X, etc. no ejecutan JS: necesitan las etiquetas
// en el HTML que devuelve el servidor. index.html trae unas por defecto entre
// los marcadores <!-- meta:start --> y <!-- meta:end -->, y aquí se reemplazan.

export const SITE_NAME = 'didier.log';
export const DEFAULT_TITLE = 'Dipper — Notas de un Ingeniero de Datos';
export const DEFAULT_DESCRIPTION = 'Cloud, datos & sistemas escritos en producción.';

export interface PostMeta {
  slug: string;
  title: string;
  summary: string | null;
  reading_minutes: number;
  updated_at: string;
  series_order: number | null;
  series: { title: string } | null;
  tags: string[];
}

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: 'website' | 'article';
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function postPageMeta(post: PostMeta, origin: string): PageMeta {
  const version = Date.parse(post.updated_at) || 0;
  return {
    title: `${post.title} · ${SITE_NAME}`,
    description: post.summary?.trim() || DEFAULT_DESCRIPTION,
    url: `${origin}/post/${post.slug}`,
    // v cambia con cada sync/publicación: invalida la imagen cacheada por el CDN y los bots.
    image: `${origin}/api/og?slug=${encodeURIComponent(post.slug)}&v=${version}`,
    type: 'article',
  };
}

export function metaTags(m: PageMeta): string {
  const e = escapeHtml;
  return [
    `<meta name="description" content="${e(m.description)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${e(m.title)}" />`,
    `<meta property="og:description" content="${e(m.description)}" />`,
    `<meta property="og:url" content="${e(m.url)}" />`,
    `<meta property="og:image" content="${e(m.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(m.title)}" />`,
    `<meta name="twitter:description" content="${e(m.description)}" />`,
    `<meta name="twitter:image" content="${e(m.image)}" />`,
  ].join('\n    ');
}

const BLOCK_RE = /<!-- meta:start -->[\s\S]*?<!-- meta:end -->/;
const TITLE_RE = /<title>[\s\S]*?<\/title>/;

// Reemplaza el bloque de metadatos por defecto y el <title> de index.html.
export function injectMeta(html: string, m: PageMeta): string {
  if (!BLOCK_RE.test(html)) return html;
  return html
    .replace(BLOCK_RE, `<!-- meta:start -->\n    ${metaTags(m)}\n    <!-- meta:end -->`)
    .replace(TITLE_RE, `<title>${escapeHtml(m.title)}</title>`);
}

// Lee el post publicado desde Supabase con la anon key (solo ve posts publicados por RLS).
export async function fetchPostMeta(slug: string): Promise<PostMeta | null> {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const select = 'slug,title,summary,reading_minutes,updated_at,series_order,series(title),post_tags(tags(name))';
  const res = await fetch(
    `${base}/rest/v1/posts?select=${select}&slug=eq.${slug}&status=eq.published&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return null;
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  const postTags = (row.post_tags as Array<{ tags: { name: string } | { name: string }[] | null }>) ?? [];
  return {
    slug: row.slug as string,
    title: row.title as string,
    summary: (row.summary as string | null) ?? null,
    reading_minutes: (row.reading_minutes as number) ?? 1,
    updated_at: row.updated_at as string,
    series_order: (row.series_order as number | null) ?? null,
    series: one(row.series as { title: string } | { title: string }[] | null),
    tags: postTags.map((pt) => one(pt.tags)?.name).filter((n): n is string => !!n),
  };
}
