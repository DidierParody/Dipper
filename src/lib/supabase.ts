import { createClient } from '@supabase/supabase-js';

export interface PostTag {
  slug: string;
  name: string;
}

export interface PostSeriesRef {
  slug: string;
  title: string;
}

export interface PostSource {
  repo: string;
  path: string;
  commit_sha: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_path: string | null;
  reading_minutes: number;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  series: PostSeriesRef | null;
  series_order: number | null;
  tags: PostTag[];
  source: PostSource;
}

export interface SeriesInfo {
  slug: string;
  title: string;
  description: string | null;
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const POST_SELECT =
  'id,slug,title,summary,cover_path,reading_minutes,status,published_at,created_at,updated_at,series_order,' +
  'series(slug,title),post_tags(tags(slug,name)),post_sources(repo,path,commit_sha)';

interface RawTag {
  slug: string;
  name: string;
}

interface RawSeries {
  slug: string;
  title: string;
  description?: string | null;
}

interface RawPostSource {
  repo: string;
  path: string;
  commit_sha: string;
}

interface RawPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_path: string | null;
  reading_minutes: number;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  series_order: number | null;
  series: RawSeries | RawSeries[] | null;
  post_tags: { tags: RawTag | RawTag[] | null }[] | null;
  post_sources: RawPostSource | RawPostSource[] | null;
}

/**
 * Supabase embeds can come back as a single object or as an array depending
 * on how the relationship is inferred; this normalizes either shape to a
 * single value (or null).
 */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapPost(row: RawPost): Post | null {
  const source = one(row.post_sources);
  if (!source) return null; // a published post must have a source; guard against inconsistent rows

  const series = one(row.series);
  const tags = (row.post_tags ?? [])
    .map((pt) => one(pt.tags))
    .filter((t): t is RawTag => !!t);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cover_path: row.cover_path,
    reading_minutes: row.reading_minutes,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    series: series ? { slug: series.slug, title: series.title } : null,
    series_order: row.series_order,
    tags,
    source: { repo: source.repo, path: source.path, commit_sha: source.commit_sha },
  };
}

export async function fetchPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as RawPost[]).map(mapPost).filter((p): p is Post => !!p);
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapPost(data as unknown as RawPost);
}

export async function fetchSeriesPosts(
  seriesSlug: string
): Promise<{ series: SeriesInfo; posts: Post[] } | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id,slug,title,summary,cover_path,reading_minutes,status,published_at,created_at,updated_at,series_order,' +
        'series!inner(slug,title,description),post_tags(tags(slug,name)),post_sources(repo,path,commit_sha)'
    )
    .eq('status', 'published')
    .eq('series.slug', seriesSlug)
    .order('series_order', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const rows = data as unknown as RawPost[];
  const posts = rows.map(mapPost).filter((p): p is Post => !!p);
  const seriesRow = one(rows[0].series);
  if (!seriesRow) return null;

  return {
    series: { slug: seriesRow.slug, title: seriesRow.title, description: seriesRow.description ?? null },
    posts,
  };
}

export interface SeriesSummary extends SeriesInfo {
  posts: Pick<Post, 'slug' | 'title' | 'series_order' | 'reading_minutes' | 'published_at'>[];
  total_minutes: number;
  last_published_at: string | null;
}

interface RawSeriesPost {
  slug: string;
  title: string;
  series_order: number | null;
  reading_minutes: number;
  published_at: string | null;
  series: RawSeries | RawSeries[] | null;
}

// Agrupa los posts publicados por serie: partes en orden, minutos totales y fecha más reciente.
// Las series sin posts publicados no aparecen. Orden: la serie actualizada más recientemente primero.
export function groupSeries(rows: RawSeriesPost[]): SeriesSummary[] {
  const bySlug = new Map<string, SeriesSummary>();
  for (const row of rows) {
    const s = one(row.series);
    if (!s) continue;
    let entry = bySlug.get(s.slug);
    if (!entry) {
      entry = { slug: s.slug, title: s.title, description: s.description ?? null, posts: [], total_minutes: 0, last_published_at: null };
      bySlug.set(s.slug, entry);
    }
    entry.posts.push({
      slug: row.slug,
      title: row.title,
      series_order: row.series_order,
      reading_minutes: row.reading_minutes,
      published_at: row.published_at,
    });
    entry.total_minutes += row.reading_minutes;
    if (row.published_at && (!entry.last_published_at || row.published_at > entry.last_published_at)) {
      entry.last_published_at = row.published_at;
    }
  }
  const list = [...bySlug.values()];
  for (const s of list) s.posts.sort((a, b) => (a.series_order ?? 0) - (b.series_order ?? 0));
  return list.sort((a, b) => (b.last_published_at ?? '').localeCompare(a.last_published_at ?? ''));
}

export async function fetchSeriesList(): Promise<SeriesSummary[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug,title,series_order,reading_minutes,published_at,series!inner(slug,title,description)')
    .eq('status', 'published');
  if (error) throw error;
  return groupSeries((data ?? []) as unknown as RawSeriesPost[]);
}
