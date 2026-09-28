const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function call(fn: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${FN_BASE}/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export const subscriptionApi = {
  status: (token: string) => call('subscribe', { action: 'status' }, token),
  subscribe: (token: string) => call('subscribe', { action: 'subscribe' }, token),
  unsubscribe: (token: string) => call('subscribe', { action: 'unsubscribe' }, token),
  unsubscribeByToken: (unsubToken: string) =>
    call('subscribe', { action: 'unsubscribe_token', token: unsubToken }),
};

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reading_minutes: number;
  series: { slug: string; title: string } | null;
  series_order: number | null;
  tags: { slug: string; name: string }[];
  source: { repo: string; path: string; commit_sha: string; synced_at: string } | null;
  newsletter: { sent_at: string; sent: number; failed: number } | null;
}

export const adminApi = {
  list: (token: string): Promise<{ posts: AdminPost[] }> => call('admin-posts', { action: 'list' }, token),
  sync: (token: string, url: string): Promise<{ id: string; slug: string; title: string; created: boolean }> =>
    call('admin-posts', { action: 'sync', url }, token),
  resync: (token: string, id: string): Promise<{ id: string; slug: string; title: string; created: false }> =>
    call('admin-posts', { action: 'resync', id }, token),
  publish: (token: string, id: string): Promise<{ ok: boolean; newsletter: { sent: number; failed: number; skipped: number } }> =>
    call('admin-posts', { action: 'publish', id }, token),
  sendNewsletter: (token: string, id: string): Promise<{ ok: boolean; newsletter: { sent: number; failed: number; skipped: number } }> =>
    call('admin-posts', { action: 'send_newsletter', id }, token),
  remove: (token: string, id: string): Promise<{ ok: boolean }> => call('admin-posts', { action: 'delete', id }, token),
  stats: (token: string): Promise<{ subscribers: number }> => call('admin-posts', { action: 'stats' }, token),
};
