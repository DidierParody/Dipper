import type { PostSource } from './supabase';

/**
 * Builds the jsDelivr CDN base URL for a post's content directory, pinned to
 * the exact commit the post was synced from.
 */
export function contentBaseUrl(source: Pick<PostSource, 'repo' | 'path' | 'commit_sha'>): string {
  return `https://cdn.jsdelivr.net/gh/${source.repo}@${source.commit_sha}/${source.path}`;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\r?\n?/;

/**
 * Strips a leading YAML frontmatter block (delimited by `---` lines) from a
 * markdown document. Tolerates CRLF line endings. If the document does not
 * start with a frontmatter block, it is returned unchanged.
 */
export function stripFrontmatter(md: string): string {
  const normalized = md.replace(/\r\n/g, '\n');
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) return md;
  return normalized.slice(match[0].length).replace(/^\n+/, '');
}

const ABSOLUTE_RE = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Resolves an image/link `src` or `href` found in post markdown against the
 * post's content base URL. Absolute references (scheme:, protocol-relative
 * `//`, root-relative `/`, fragments `#`) are left untouched; everything
 * else (`./x`, `x`, `../x`) is resolved relative to `base`.
 */
export function resolveAssetUrl(base: string, src: string): string {
  if (!src) return src;
  if (ABSOLUTE_RE.test(src)) return src;
  if (src.startsWith('//')) return src;
  if (src.startsWith('/')) return src;
  if (src.startsWith('#')) return src;
  const baseUrl = base.endsWith('/') ? base : `${base}/`;
  return new URL(src, baseUrl).toString();
}

/**
 * Downloads a post's `index.md` from jsDelivr (pinned to its synced commit)
 * and returns the body with any frontmatter stripped.
 */
export async function fetchPostMarkdown(source: PostSource): Promise<string> {
  const url = `${contentBaseUrl(source)}/index.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`content ${res.status}`);
  const raw = await res.text();
  return stripFrontmatter(raw);
}
