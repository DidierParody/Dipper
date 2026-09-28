import { createClient } from 'npm:@supabase/supabase-js@2';
import { parse as parseYaml } from 'npm:yaml@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { verifyClerkToken, getClerkEmail } from '../_shared/clerk.ts';
import { makeUnsubToken } from '../_shared/unsub-token.ts';
import { parseContentLink, slugify } from '../_shared/content-link.ts';
import { resolveSha, fetchRaw } from '../_shared/github.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const CONTENT_REPO = Deno.env.get('CONTENT_REPO') || 'DidierParody/Dipper';
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function calcReadingMinutes(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('El archivo index.md no tiene frontmatter válido (debe empezar con "---")');
  }
  return { frontmatter: match[1], body: match[2] };
}

interface ValidatedFrontmatter {
  title: string;
  summary: string | null;
  cover_path: string | null;
  tags: { slug: string; name: string }[];
  seriesSlug: string | null;
  seriesOrder: number | null;
}

function validateFrontmatter(raw: unknown): ValidatedFrontmatter {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('El frontmatter debe ser un objeto YAML válido');
  }
  const fm = raw as Record<string, unknown>;

  const title = fm.title;
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('El campo "title" es requerido en el frontmatter');
  }

  let summary: string | null = null;
  if (fm.summary !== undefined && fm.summary !== null) {
    if (typeof fm.summary !== 'string') throw new Error('El campo "summary" debe ser texto');
    summary = fm.summary;
  }

  let cover_path: string | null = null;
  if (fm.cover !== undefined && fm.cover !== null) {
    if (typeof fm.cover !== 'string' || !fm.cover.trim()) {
      throw new Error('El campo "cover" debe ser una ruta de texto');
    }
    cover_path = fm.cover;
  }

  const tags: { slug: string; name: string }[] = [];
  if (fm.tags !== undefined && fm.tags !== null) {
    if (!Array.isArray(fm.tags)) throw new Error('El campo "tags" debe ser una lista');
    const seen = new Set<string>();
    for (const t of fm.tags) {
      if (typeof t !== 'string' || !t.trim()) {
        throw new Error('Cada tag debe ser texto no vacío');
      }
      const tslug = slugify(t);
      if (!tslug) throw new Error(`El tag "${t}" no genera un slug válido`);
      if (seen.has(tslug)) continue;
      seen.add(tslug);
      tags.push({ slug: tslug, name: t });
    }
  }

  let seriesSlug: string | null = null;
  if (fm.series !== undefined && fm.series !== null) {
    if (typeof fm.series !== 'string' || !fm.series.trim()) {
      throw new Error('El campo "series" debe ser el slug de la serie (texto)');
    }
    if (!SLUG_RE.test(fm.series)) {
      throw new Error(`El slug de la serie "${fm.series}" no es válido`);
    }
    seriesSlug = fm.series;
  }

  let seriesOrder: number | null = null;
  if (fm.series_order !== undefined && fm.series_order !== null) {
    const n = fm.series_order;
    if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
      throw new Error('El campo "series_order" debe ser un entero mayor a 0');
    }
    seriesOrder = n;
  }

  if (seriesSlug && seriesOrder === null) {
    throw new Error('El campo "series_order" es requerido cuando hay "series"');
  }
  if (!seriesSlug && seriesOrder !== null) {
    throw new Error('El campo "series_order" no tiene sentido sin "series"');
  }

  return { title: title.trim(), summary, cover_path, tags, seriesSlug, seriesOrder };
}

async function requireAdmin(req: Request): Promise<void> {
  const userId = await verifyClerkToken(req.headers.get('Authorization'));
  const email = await getClerkEmail(userId);
  if (email !== Deno.env.get('ADMIN_EMAIL')!.toLowerCase()) {
    throw new Error('forbidden: not admin');
  }
}

interface SyncResult {
  id: string;
  slug: string;
  title: string;
  created: boolean;
}

/**
 * Descarga index.md (y opcionalmente el frontmatter de la serie) desde
 * `repo` @ `ref`, en la carpeta `dir` (= content/posts/<slug>), valida el
 * frontmatter y hace upsert atómico vía rpc('sync_post', ...).
 */
async function performSync(repo: string, dir: string, ref: string): Promise<SyncResult> {
  const slugMatch = dir.match(/^content\/posts\/([^/]+)$/);
  if (!slugMatch) throw new Error(`Ruta de contenido inválida: "${dir}"`);
  const slug = slugMatch[1];

  const sha = await resolveSha(repo, ref);

  const indexPath = `${dir}/index.md`;
  const raw = await fetchRaw(repo, sha, indexPath);
  if (raw === null) {
    throw new Error(`No se encontró "${indexPath}" en ${repo}@${ref} (sha ${sha})`);
  }

  const { frontmatter, body } = splitFrontmatter(raw);
  let fmData: unknown;
  try {
    fmData = parseYaml(frontmatter);
  } catch (e) {
    throw new Error(`El frontmatter de "${indexPath}" no es YAML válido: ${String(e)}`);
  }
  const validated = validateFrontmatter(fmData);

  let series: { slug: string; title: string; description: string | null } | null = null;
  if (validated.seriesSlug) {
    const seriesPath = `content/series/${validated.seriesSlug}.md`;
    const seriesRaw = await fetchRaw(repo, sha, seriesPath);
    if (seriesRaw === null) {
      series = { slug: validated.seriesSlug, title: humanizeSlug(validated.seriesSlug), description: null };
    } else {
      let seriesTitle = humanizeSlug(validated.seriesSlug);
      let seriesDescription: string | null = null;
      try {
        const { frontmatter: seriesFm } = splitFrontmatter(seriesRaw);
        const parsed = parseYaml(seriesFm) as Record<string, unknown> | null;
        if (parsed && typeof parsed.title === 'string' && parsed.title.trim()) {
          seriesTitle = parsed.title.trim();
        }
        if (parsed && typeof parsed.description === 'string') {
          seriesDescription = parsed.description;
        }
      } catch {
        // frontmatter de la serie inválido: se usa el título humanizado
      }
      series = { slug: validated.seriesSlug, title: seriesTitle, description: seriesDescription };
    }
  }

  const reading_minutes = calcReadingMinutes(body);

  const { data: existing, error: existingErr } = await db.from('posts')
    .select('id').eq('slug', slug).maybeSingle();
  if (existingErr) throw existingErr;

  const payload = {
    slug,
    title: validated.title,
    summary: validated.summary,
    cover_path: validated.cover_path,
    reading_minutes,
    tags: validated.tags,
    series,
    series_order: validated.seriesOrder,
    repo,
    path: dir,
    commit_sha: sha,
  };

  const { data: postId, error: rpcErr } = await db.rpc('sync_post', { p: payload });
  if (rpcErr) throw rpcErr;

  return { id: postId as string, slug, title: validated.title, created: !existing };
}

async function sendNewsletter(postId: string): Promise<{ sent: number; failed: number; skipped: number }> {
  const { data: post, error: postErr } = await db.from('posts')
    .select('slug,title,summary').eq('id', postId).single();
  if (postErr || !post) throw new Error('post no encontrado');

  const { data: sendRow, error: sendErr } = await db.from('newsletter_sends')
    .select('id').eq('post_id', postId).maybeSingle();
  if (sendErr) throw sendErr;

  let sendId: string;
  if (sendRow) {
    sendId = sendRow.id;
  } else {
    const { data: inserted, error: insErr } = await db.from('newsletter_sends')
      .insert({ post_id: postId }).select('id').single();
    if (insErr) throw insErr;
    sendId = inserted.id;
  }

  const { data: subs, error: subErr } = await db.from('subscribers')
    .select('id,email').is('unsubscribed_at', null);
  if (subErr) throw subErr;
  if (!subs?.length) return { sent: 0, failed: 0, skipped: 0 };

  const { data: sentDeliveries, error: delErr } = await db.from('newsletter_deliveries')
    .select('subscriber_id').eq('send_id', sendId).eq('status', 'sent');
  if (delErr) throw delErr;
  const alreadySent = new Set((sentDeliveries ?? []).map((d: { subscriber_id: string }) => d.subscriber_id));

  const targets = subs.filter((s: { id: string }) => !alreadySent.has(s.id));
  const skipped = subs.length - targets.length;
  if (!targets.length) return { sent: 0, failed: 0, skipped };

  const site = Deno.env.get('SITE_URL')!;
  const batchItems = await Promise.all(targets.map(async (s: { id: string; email: string }) => ({
    subscriber: s,
    payload: {
      from: 'Dipper <onboarding@resend.dev>',
      to: [s.email],
      subject: `Nuevo post: ${post.title}`,
      html: `
        <div style="background:#0A0E17;color:#F2F2F0;padding:32px;font-family:monospace;">
          <p style="color:#E8A25E;font-size:12px;margin:0 0 8px;">DIPPER.DEV</p>
          <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
          <p style="color:#8B93A7;margin:0 0 20px;">${escapeHtml(post.summary ?? '')}</p>
          <a href="${site}/post/${post.slug}"
             style="background:#E8A25E;color:#0A0E17;padding:10px 16px;text-decoration:none;font-weight:bold;">
            &gt; LEER POST_</a>
          <p style="margin-top:28px;font-size:12px;color:#8B93A7;">
            <a href="${site}/unsubscribe?token=${await makeUnsubToken(s.id)}"
               style="color:#8B93A7;">Desuscribirme</a></p>
        </div>`,
    },
  })));

  let sent = 0, failed = 0;
  for (let i = 0; i < batchItems.length; i += 100) {
    const batch = batchItems.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch.map((b) => b.payload)),
    });
    const ok = res.ok;
    let errorText: string | null = null;
    if (!ok) {
      errorText = await res.text().catch(() => 'error desconocido');
      console.error('resend batch failed', res.status, errorText);
    }
    const rows = batch.map((b) => ({
      send_id: sendId,
      subscriber_id: b.subscriber.id,
      status: ok ? 'sent' : 'failed',
      error: ok ? null : `HTTP ${res.status}: ${errorText}`,
      attempted_at: new Date().toISOString(),
    }));
    const { error: upErr } = await db.from('newsletter_deliveries')
      .upsert(rows, { onConflict: 'send_id,subscriber_id' });
    if (upErr) throw upErr;
    if (ok) sent += batch.length; else failed += batch.length;
  }
  return { sent, failed, skipped };
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  try {
    await requireAdmin(req);
    const body = await req.json();

    if (body.action === 'stats') {
      const { count, error } = await db.from('subscribers')
        .select('id', { count: 'exact', head: true })
        .is('unsubscribed_at', null);
      if (error) throw error;
      return json({ subscribers: count ?? 0 });
    }

    if (body.action === 'list') {
      const { data, error } = await db.from('posts')
        .select(`
          id, slug, title, summary, status, published_at, created_at, updated_at, reading_minutes,
          series_order,
          series:series_id ( slug, title ),
          post_tags ( tags ( slug, name ) ),
          post_sources ( repo, path, commit_sha, synced_at ),
          newsletter_sends ( sent_at, newsletter_deliveries ( status ) )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const posts = (data ?? []).map((row: any) => {
        const series = one(row.series);
        const source = one(row.post_sources);
        const send = one(row.newsletter_sends);
        const deliveries: { status: string }[] = send?.newsletter_deliveries ?? [];
        const tags = (row.post_tags ?? [])
          .map((pt: any) => one(pt.tags))
          .filter((t: any) => t != null);

        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          status: row.status,
          published_at: row.published_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          reading_minutes: row.reading_minutes,
          series: series ? { slug: series.slug, title: series.title } : null,
          series_order: row.series_order,
          tags,
          source: source
            ? { repo: source.repo, path: source.path, commit_sha: source.commit_sha, synced_at: source.synced_at }
            : null,
          newsletter: send
            ? {
                sent_at: send.sent_at,
                sent: deliveries.filter((d) => d.status === 'sent').length,
                failed: deliveries.filter((d) => d.status === 'failed').length,
              }
            : null,
        };
      });

      return json({ posts });
    }

    if (body.action === 'sync') {
      const { url } = body;
      if (!url || typeof url !== 'string') return json({ error: 'url requerida' }, 400);
      const { repo, ref, dir } = parseContentLink(url, CONTENT_REPO);
      const result = await performSync(repo, dir, ref);
      return json(result);
    }

    if (body.action === 'resync') {
      const { id } = body;
      if (!id) return json({ error: 'id requerido' }, 400);
      const { data: source, error: sourceErr } = await db.from('post_sources')
        .select('repo,path').eq('post_id', id).maybeSingle();
      if (sourceErr) throw sourceErr;
      if (!source) return json({ error: 'el post no tiene fuente para re-sincronizar' }, 400);
      const result = await performSync(source.repo, source.path, 'main');
      return json(result);
    }

    if (body.action === 'publish') {
      const { id } = body;
      if (!id) return json({ error: 'id requerido' }, 400);
      const { data: source, error: sourceErr } = await db.from('post_sources')
        .select('post_id').eq('post_id', id).maybeSingle();
      if (sourceErr) throw sourceErr;
      if (!source) return json({ error: 'el post no tiene fuente: sincronízalo primero' }, 400);

      const { error } = await db.from('posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      const newsletter = await sendNewsletter(id);
      return json({ ok: true, newsletter });
    }

    if (body.action === 'send_newsletter') {
      const { id } = body;
      if (!id) return json({ error: 'id requerido' }, 400);
      const newsletter = await sendNewsletter(id);
      return json({ ok: true, newsletter });
    }

    if (body.action === 'delete') {
      const { id } = body;
      if (!id) return json({ error: 'id requerido' }, 400);
      const { error } = await db.from('posts').delete().eq('id', id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    const status = msg.includes('forbidden') ? 403
      : msg.includes('token') || msg.includes('JW') ? 401 : 500;
    return json({ error: msg }, status);
  }
});
