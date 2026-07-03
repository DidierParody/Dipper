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

export const adminApi = {
  list: (token: string) => call('admin-posts', { action: 'list' }, token),
  create: (token: string, post: object) => call('admin-posts', { action: 'create', post }, token),
  update: (token: string, post: object) => call('admin-posts', { action: 'update', post }, token),
  publish: (token: string, id: string) => call('admin-posts', { action: 'publish', id }, token),
  sendNewsletter: (token: string, id: string) =>
    call('admin-posts', { action: 'send_newsletter', id }, token),
  remove: (token: string, id: string) => call('admin-posts', { action: 'delete', id }, token),
  uploadAsset: (token: string, filename: string, base64: string, content_type: string) =>
    call('admin-posts', { action: 'upload_asset', filename, base64, content_type }, token),
};
