// Módulo puro: sin imports. Debe poder usarse tanto desde Deno (Edge Functions)
// como desde Node/Vitest sin depender de ningún runtime específico.

export interface ParsedContentLink {
  repo: string;
  ref: string;
  dir: string;
  slug: string;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

function stripIndexMd(path: string): string {
  return path.replace(/\/index\.md$/, '');
}

function extractSlugFromDir(dir: string): string {
  const m = dir.match(/^content\/posts\/([^/]+)$/);
  if (!m) {
    throw new Error(
      `Ruta de contenido inválida: se esperaba "content/posts/<slug>", se recibió "${dir}"`
    );
  }
  const slug = m[1];
  if (!SLUG_RE.test(slug)) {
    throw new Error(`El slug "${slug}" no es válido (debe ser minúsculas, números y guiones)`);
  }
  return slug;
}

/**
 * Acepta las 4 formas de link descritas en el spec y las normaliza a
 * { repo, ref, dir, slug }. Lanza Error con mensaje en español si el link
 * no es válido o si el repo no coincide con `expectedRepo`.
 */
export function parseContentLink(input: string, expectedRepo: string): ParsedContentLink {
  const raw = (input ?? '').trim();
  if (!raw) throw new Error('El link no puede estar vacío');

  let repo: string;
  let ref: string;
  let path: string;

  let url: URL | null = null;
  try {
    url = new URL(raw);
  } catch {
    url = null;
  }

  if (url && (url.hostname === 'github.com' || url.hostname === 'www.github.com')) {
    const segments = normalizePath(url.pathname).split('/').filter(Boolean);
    if (segments.length < 5 || (segments[2] !== 'blob' && segments[2] !== 'tree')) {
      throw new Error(
        'Link de GitHub inválido: se esperaba una URL de tipo .../blob/<ref>/... o .../tree/<ref>/...'
      );
    }
    repo = `${segments[0]}/${segments[1]}`;
    ref = segments[3];
    path = segments.slice(4).join('/');
  } else if (url && url.hostname === 'raw.githubusercontent.com') {
    const segments = normalizePath(url.pathname).split('/').filter(Boolean);
    if (segments.length < 4) {
      throw new Error('Link raw.githubusercontent.com inválido');
    }
    repo = `${segments[0]}/${segments[1]}`;
    ref = segments[2];
    path = segments.slice(3).join('/');
  } else if (!url) {
    // Ruta relativa: content/posts/<slug> o content/posts/<slug>/index.md (ref = main)
    repo = expectedRepo;
    ref = 'main';
    path = normalizePath(raw);
  } else {
    throw new Error(
      `Host no soportado: "${url.hostname}". Se espera github.com, raw.githubusercontent.com, o una ruta relativa`
    );
  }

  if (!ref) {
    throw new Error('No se pudo determinar la referencia (branch/tag/sha)');
  }
  if (ref.includes('/')) {
    throw new Error(`La referencia ("${ref}") no puede contener "/"`);
  }
  if (repo !== expectedRepo) {
    throw new Error(`El repo "${repo}" no coincide con el repo configurado ("${expectedRepo}")`);
  }

  path = normalizePath(stripIndexMd(path));
  const slug = extractSlugFromDir(path);
  const dir = `content/posts/${slug}`;

  return { repo, ref, dir, slug };
}
