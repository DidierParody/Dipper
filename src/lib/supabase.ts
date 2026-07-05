import { createClient } from '@supabase/supabase-js';

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  reading_minutes: number;
  cover_url: string | null;
  tags: string[];
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function fetchPublishedPosts(tag?: string): Promise<Post[]> {
  let q = supabase
    .from('posts')
    .select('id,slug,title,description,cover_url,tags,status,published_at,created_at,reading_minutes')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (tag) q = q.contains('tags', [tag]);
  const { data, error } = await q;
  if (error) throw error;
  return data as Post[];
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('id,slug,title,description,cover_url,tags,status,published_at,created_at,reading_minutes')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function fetchPostContent(slug: string): Promise<string> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-content?slug=${encodeURIComponent(slug)}`
  );
  if (!res.ok) throw new Error(`content ${res.status}`);
  return res.text();
}
