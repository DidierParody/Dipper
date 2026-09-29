// /api/og?slug=… → imagen 1200×630 de previsualización con la estética del blog.
// Sin slug (o post no publicado) genera la tarjeta general del sitio.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { ReactNode } from 'react';
import { DEFAULT_DESCRIPTION, fetchPostMeta, type PostMeta } from './_lib/meta.js';

type Style = Record<string, string | number>;
type Child = Node | string | null | false;
interface Node {
  type: string;
  props: { style?: Style; children?: Child | Child[] };
}

// Satori acepta elementos con forma de React; así se evita compilar JSX en la función.
const h = (style: Style, ...children: Child[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.filter((c) => c !== null && c !== false) },
});

const C = {
  bg: '#0a0e18',
  card: '#0e1426',
  border: '#1c2438',
  text: '#e9ecf4',
  muted: '#8b96b2',
  blue: '#3b82f6',
  orange: '#f0954c',
};

async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error(`font ${family} ${weight}`);
  return (await fetch(src[1])).arrayBuffer();
}

// Emojis (p. ej. 🛡️ en un título) como SVG de Twemoji.
function emojiCode(segment: string): string {
  const cps = [...(segment.includes('‍') ? segment : segment.replace(/️/g, ''))];
  return cps.map((c) => c.codePointAt(0)!.toString(16)).join('-');
}

async function loadAsset(code: string, segment: string): Promise<string> {
  if (code !== 'emoji') return '';
  const res = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${emojiCode(segment)}.svg`);
  if (!res.ok) return '';
  return `data:image/svg+xml;base64,${Buffer.from(await res.text()).toString('base64')}`;
}

function titleSize(title: string): number {
  if (title.length > 70) return 48;
  if (title.length > 40) return 58;
  return 68;
}

function card(post: PostMeta | null): Node {
  const title = post?.title ?? 'Notas de ingeniería de datos';
  const kicker = post
    ? post.series
      ? `PARTE ${post.series_order} · ${post.series.title.toUpperCase()}`
      : 'POST'
    : '// DIDIER.LOG';
  const logo = h(
    { alignItems: 'center', gap: 16 },
    h(
      { width: 44, height: 44, background: C.blue, position: 'relative' },
      h({ position: 'absolute', top: 9, left: 9, right: 9, bottom: 9, background: C.bg }),
      h({ position: 'absolute', right: 8, bottom: 8, width: 10, height: 10, background: C.orange }),
    ),
    h({ fontFamily: 'Plex', fontWeight: 600, fontSize: 30, color: C.text }, 'didier', h({ color: C.blue }, '.log')),
  );
  const footer = post
    ? h(
        { justifyContent: 'space-between', alignItems: 'center', width: '100%' },
        h(
          { gap: 12 },
          ...post.tags.slice(0, 3).map((t) =>
            h(
              { fontFamily: 'Plex', fontSize: 22, color: C.blue, background: 'rgba(59,130,246,.14)', padding: '8px 18px', borderRadius: 8 },
              t,
            ),
          ),
        ),
        h({ fontFamily: 'Plex', fontSize: 22, color: C.muted }, `Didier Parody · ${post.reading_minutes} min de lectura`),
      )
    : h({ fontFamily: 'Plex', fontSize: 24, color: C.muted }, DEFAULT_DESCRIPTION);

  return h(
    {
      width: '100%',
      height: '100%',
      background: C.bg,
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      borderTop: `8px solid ${C.blue}`,
    },
    logo,
    h(
      { flexDirection: 'column', gap: 20, borderLeft: `6px solid ${C.orange}`, paddingLeft: 32 },
      h({ fontFamily: 'Plex', fontSize: 24, letterSpacing: 2, color: C.orange }, kicker),
      h(
        { fontFamily: 'Grotesk', fontWeight: 700, fontSize: titleSize(title), lineHeight: 1.1, color: C.text, maxWidth: 1000 },
        title,
      ),
    ),
    footer,
  );
}

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug') ?? '';
  const post = slug ? await fetchPostMeta(slug).catch(() => null) : null;
  const tree = card(post);

  // Subconjunto de glifos: solo los caracteres que aparecen en la tarjeta.
  const text = JSON.stringify(tree) + 'didier.log0123456789';
  const [grotesk, plex, plexBold] = await Promise.all([
    googleFont('Space Grotesk', 700, text),
    googleFont('IBM Plex Mono', 400, text),
    googleFont('IBM Plex Mono', 600, text),
  ]);

  const svg = await satori(tree as unknown as ReactNode, {
    width: 1200,
    height: 630,
    loadAdditionalAsset: loadAsset,
    fonts: [
      { name: 'Grotesk', data: grotesk, weight: 700, style: 'normal' },
      { name: 'Plex', data: plex, weight: 400, style: 'normal' },
      { name: 'Plex', data: plexBold, weight: 600, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      // La URL lleva ?v=<updated_at>: cada versión es inmutable.
      'cache-control': post
        ? 'public, immutable, no-transform, max-age=31536000'
        : 'public, max-age=0, s-maxage=86400',
    },
  });
}
