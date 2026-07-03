import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { verifyClerkToken, getClerkEmail } from '../_shared/clerk.ts';
import { makeUnsubToken } from '../_shared/unsub-token.ts';
import { driveConfigured, listMdFiles, downloadFile } from '../_shared/drive.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function parseMd(md: string): { title: string; body: string } {
  const lines = md.split('\n');
  const h1Index = lines.findIndex((l) => /^# (?!#)/.test(l));
  if (h1Index === -1) return { title: '', body: md.trim() };
  const title = lines[h1Index].replace(/^# /, '').trim();
  const body = [...lines.slice(0, h1Index), ...lines.slice(h1Index + 1)]
    .join('\n')
    .trim();
  return { title, body };
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

async function uniqueSlug(base: string): Promise<string> {
  const { data, error } = await db.from('posts').select('slug').like('slug', `${base}%`);
  if (error) throw error;
  const existing = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

async function requireAdmin(req: Request): Promise<void> {
  const userId = await verifyClerkToken(req.headers.get('Authorization'));
  const email = await getClerkEmail(userId);
  if (email !== Deno.env.get('ADMIN_EMAIL')!.toLowerCase()) {
    throw new Error('forbidden: not admin');
  }
}

async function sendNewsletter(postId: string): Promise<{ sent: number; failed: number }> {
  const { data: post, error: postErr } = await db.from('posts')
    .select('slug,title,description').eq('id', postId).single();
  if (postErr || !post) throw new Error('post not found');

  const { data: subs, error: subErr } = await db.from('subscribers')
    .select('id,email').is('unsubscribed_at', null);
  if (subErr) throw subErr;
  if (!subs?.length) return { sent: 0, failed: 0 };

  const site = Deno.env.get('SITE_URL')!;
  const emails = await Promise.all(subs.map(async (s) => ({
    from: 'Dipper <onboarding@resend.dev>',
    to: [s.email],
    subject: `Nuevo post: ${post.title}`,
    html: `
      <div style="background:#0A0E17;color:#F2F2F0;padding:32px;font-family:monospace;">
        <p style="color:#E8A25E;font-size:12px;margin:0 0 8px;">DIPPER.DEV</p>
        <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
        <p style="color:#8B93A7;margin:0 0 20px;">${escapeHtml(post.description ?? '')}</p>
        <a href="${site}/post/${post.slug}"
           style="background:#E8A25E;color:#0A0E17;padding:10px 16px;text-decoration:none;font-weight:bold;">
          &gt; LEER POST_</a>
        <p style="margin-top:28px;font-size:12px;color:#8B93A7;">
          <a href="${site}/unsubscribe?token=${await makeUnsubToken(s.id)}"
             style="color:#8B93A7;">Desuscribirme</a></p>
      </div>`,
  })));

  let sent = 0, failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emails.slice(i, i + 100)),
    });
    if (res.ok) sent += Math.min(100, emails.length - i);
    else {
      failed += Math.min(100, emails.length - i);
      console.error('resend batch failed', res.status, await res.text());
    }
  }
  return { sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  try {
    await requireAdmin(req);
    const body = await req.json();

    if (body.action === 'drive_status') {
      return json({ configured: driveConfigured() });
    }

    if (body.action === 'drive_list') {
      if (!driveConfigured()) return json({ error: 'drive no configurado' }, 400);
      return json({ files: await listMdFiles() });
    }

    if (body.action === 'drive_import') {
      if (!driveConfigured()) return json({ error: 'drive no configurado' }, 400);
      const { file_id, name } = body;
      if (!file_id) return json({ error: 'file_id requerido' }, 400);
      const raw = await downloadFile(file_id);
      if (raw.length > 1_000_000) return json({ error: 'md demasiado grande (max 1MB)' }, 400);
      const { title: h1Title, body: content_md } = parseMd(raw);
      const title = h1Title || (name ?? '').replace(/\.md$/i, '') || 'sin-titulo';
      const baseSlug = slugify(title) || 'post';
      const slug = await uniqueSlug(baseSlug);
      const { data, error } = await db.from('posts')
        .insert({ title, slug, description: null, content_md, tags: [] })
        .select('id').single();
      if (error) throw error;
      return json({ id: data.id, slug, title });
    }

    if (body.action === 'stats') {
      const { count, error } = await db.from('subscribers')
        .select('id', { count: 'exact', head: true })
        .is('unsubscribed_at', null);
      if (error) throw error;
      return json({ subscribers: count ?? 0 });
    }

    if (body.action === 'list') {
      const { data, error } = await db.from('posts')
        .select('id,slug,title,description,tags,status,published_at,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json({ posts: data });
    }

    if (body.action === 'create') {
      const { title, slug, description, content_md, tags, cover_url } = body.post ?? {};
      if (!title || !slug || !content_md) return json({ error: 'title, slug y content_md requeridos' }, 400);
      if (content_md.length > 1_000_000) return json({ error: 'md demasiado grande (max 1MB)' }, 400);
      const { data, error } = await db.from('posts')
        .insert({ title, slug, description, content_md, tags: tags ?? [], cover_url })
        .select('id').single();
      if (error) throw error;
      return json({ id: data.id });
    }

    if (body.action === 'update') {
      const { id, ...fields } = body.post ?? {};
      if (!id) return json({ error: 'id requerido' }, 400);
      const allowed = ['title', 'slug', 'description', 'content_md', 'tags', 'cover_url'];
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([k]) => allowed.includes(k))
      );
      if (typeof patch.content_md === 'string' && patch.content_md.length > 1_000_000) {
        return json({ error: 'md demasiado grande (max 1MB)' }, 400);
      }
      const { error } = await db.from('posts').update(patch).eq('id', id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === 'publish') {
      const { error } = await db.from('posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', body.id);
      if (error) throw error;
      const stats = await sendNewsletter(body.id);
      return json({ ok: true, newsletter: stats });
    }

    if (body.action === 'send_newsletter') {
      return json({ ok: true, newsletter: await sendNewsletter(body.id) });
    }

    if (body.action === 'delete') {
      const { error } = await db.from('posts').delete().eq('id', body.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === 'upload_asset') {
      const { filename, base64 } = body;
      if (!filename || !base64) return json({ error: 'filename y base64 requeridos' }, 400);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const { error } = await db.storage.from('post-assets').upload(path, bytes, {
        contentType: body.content_type ?? 'application/octet-stream',
      });
      if (error) throw error;
      const { data } = db.storage.from('post-assets').getPublicUrl(path);
      return json({ url: data.publicUrl });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    const msg = String(e);
    const status = msg.includes('forbidden') ? 403
      : msg.includes('token') || msg.includes('JW') ? 401 : 500;
    return json({ error: msg }, status);
  }
});
