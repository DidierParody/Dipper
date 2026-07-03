# Dipper Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blog personal pixel-art funcional y desplegado: posts en Markdown servidos desde Supabase, login Clerk (GitHub/Google), suscripción a newsletter con Resend, panel admin para subir MD, todo en producción en Vercel.

**Architecture:** SPA React+Vite que lee posts publicados directamente de Supabase con la clave publishable (RLS solo permite `status='published'`). Todas las escrituras pasan por dos Edge Functions de Supabase (`subscribe` y `admin-posts`) que verifican el JWT de Clerk contra su JWKS público y obtienen el email vía Clerk Backend API — sin configuración third-party manual. El newsletter se envía con la Batch API de Resend desde `admin-posts` al publicar.

**Tech Stack:** React 18 + Vite + TypeScript, react-router-dom, @clerk/clerk-react, @supabase/supabase-js, react-markdown + remark-gfm + rehype-highlight, Supabase Edge Functions (Deno + npm:jose), Resend API, Vercel CLI, Vitest.

**Valores fijos del proyecto (usar tal cual):**
- Supabase project ref: `xjssqrmmzfgeivotgxad`
- Supabase URL: `https://xjssqrmmzfgeivotgxad.supabase.co`
- Supabase publishable key: `sb_publishable_S4IPO5yOy3KtdpNMV7G-1g_ASGN-jP-`
- Clerk issuer: `https://closing-bass-58.clerk.accounts.dev` (decodificado de la publishable key)
- Admin email: `torresparodisdidierjose@gmail.com`
- Secretos disponibles en `.env` en la raíz del repo (SUPABASE_ACCESS_TOKEN, CLERK_SECRET_KEY, RESEND_API_KEY, VERCEL_TOKEN). **Nunca commitear valores de `.env` en código.**
- Paleta: fondo `#0A0E17`, superficie `#16213E`, acento `#E8A25E`, texto `#F2F2F0`, secundario `#8B93A7`.

**Dependencias entre tareas:** Task 1 primero. Luego Tasks 2–4 (backend) y Tasks 5–8 (frontend) pueden correr en paralelo en dos agentes. Task 9 (admin) requiere 4 y 5. Tasks 10–11 al final, secuenciales.

---

### Task 1: Scaffold Vite + tema pixel

**Files:**
- Create: proyecto Vite en la raíz del repo (package.json, vite.config.ts, src/, index.html)
- Create: `src/theme.css`
- Modify: `index.html`

- [ ] **Step 1: Scaffold y dependencias**

```bash
cd "C:\Users\djtor\OneDrive\Documentos\GitHub\DidierParody\Dipper"
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom @clerk/clerk-react @supabase/supabase-js react-markdown remark-gfm rehype-highlight highlight.js
npm install -D vitest
```

Nota: `npm create vite .` sobre carpeta no vacía pregunta — responder "Ignore files and continue". Si el flag interactivo falla, scaffoldear en `tmp-vite/` y mover contenido (sin sobreescribir README.md, docs/, .gitignore, .env*).

- [ ] **Step 2: Añadir script de test a package.json**

En `package.json`, en `"scripts"` añadir: `"test": "vitest run"`.

- [ ] **Step 3: index.html con fuentes y título**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Dipper — notas de un Ingeniero de Datos" />
    <title>Dipper — Notas de un Ingeniero de Datos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Crear `src/theme.css`** (borrar App.css e index.css de la plantilla y sus imports)

```css
:root {
  --bg: #0A0E17;
  --surface: #16213E;
  --accent: #E8A25E;
  --text: #F2F2F0;
  --muted: #8B93A7;
  --font-pixel: 'Press Start 2P', monospace;
  --font-body: 'VT323', monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 20px;
  line-height: 1.5;
}
h1, h2, h3, .px { font-family: var(--font-pixel); line-height: 1.8; }
h1 { font-size: 18px; }
h2 { font-size: 14px; }
h3 { font-size: 12px; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.container { max-width: 860px; margin: 0 auto; padding: 0 20px; }
.pixel-btn {
  font-family: var(--font-pixel);
  font-size: 10px;
  background: var(--accent);
  color: var(--bg);
  border: 2px solid var(--text);
  box-shadow: 3px 3px 0 #000;
  padding: 10px 14px;
  cursor: pointer;
}
.pixel-btn:hover { background: var(--text); }
.pixel-btn:active { box-shadow: 1px 1px 0 #000; transform: translate(2px, 2px); }
.pixel-btn.ghost { background: transparent; color: var(--text); border-color: var(--muted); box-shadow: none; }
.pixel-card {
  background: var(--surface);
  border: 2px solid var(--text);
  box-shadow: 4px 4px 0 #000;
  padding: 16px;
}
.tag {
  display: inline-block;
  border: 1px dashed var(--accent);
  color: var(--accent);
  font-size: 16px;
  padding: 1px 8px;
  margin-right: 6px;
}
.dashed-divider { border: none; border-top: 2px dashed var(--muted); margin: 20px 0; }
.markdown-body pre {
  background: var(--surface);
  border-left: 4px solid var(--accent);
  padding: 14px;
  overflow-x: auto;
  font-size: 15px;
}
.markdown-body code { font-family: ui-monospace, monospace; color: var(--accent); }
.markdown-body pre code { color: inherit; }
.markdown-body img { max-width: 100%; border: 2px solid var(--text); }
.markdown-body blockquote {
  border-left: 4px solid var(--muted);
  margin-left: 0;
  padding-left: 14px;
  color: var(--muted);
}
input, textarea, select {
  background: var(--bg);
  border: 2px solid var(--muted);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 18px;
  padding: 8px;
  width: 100%;
}
input:focus, textarea:focus { outline: none; border-color: var(--accent); }
label { color: var(--muted); font-size: 16px; display: block; margin: 10px 0 4px; }
```

- [ ] **Step 5: Verificar que compila**

Run: `npm run build`
Expected: build exitoso sin errores TS (la plantilla default compila; si App.tsx referencia los css borrados, limpiar imports).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold Vite React TS con tema pixel art"
```

---

### Task 2: Esquema de base de datos + RLS (Supabase Management API)

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `scripts/db-apply.mjs`

- [ ] **Step 1: Escribir `supabase/migrations/0001_init.sql`**

```sql
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  content_md text not null,
  cover_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (status, published_at desc);

alter table public.posts enable row level security;

drop policy if exists "public read published" on public.posts;
create policy "public read published" on public.posts
  for select using (status = 'published');

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.subscribers enable row level security;
-- Sin policies: solo service_role (Edge Functions) accede a subscribers.

insert into storage.buckets (id, name, public)
values ('post-assets', 'post-assets', true)
on conflict (id) do nothing;
```

- [ ] **Step 2: Escribir `scripts/db-apply.mjs`** (aplica un .sql vía Management API; lee token de .env)

```js
import { readFileSync } from 'node:fs';

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const token = envText.match(/SUPABASE_ACCESS_TOKEN=(\S+)/)[1];
const sql = readFileSync(process.argv[2], 'utf8');

const res = await fetch(
  'https://api.supabase.com/v1/projects/xjssqrmmzfgeivotgxad/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  }
);
const body = await res.text();
if (!res.ok) {
  console.error('FAILED', res.status, body);
  process.exit(1);
}
console.log('OK', body.slice(0, 500));
```

- [ ] **Step 3: Aplicar la migración**

Run: `node scripts/db-apply.mjs supabase/migrations/0001_init.sql`
Expected: `OK ...`

- [ ] **Step 4: Verificar tablas y RLS**

Crear archivo temporal `scratch-verify.sql` (NO commitear) con:

```sql
select tablename, rowsecurity from pg_tables where schemaname='public';
```

Run: `node scripts/db-apply.mjs scratch-verify.sql`
Expected: JSON con `posts` y `subscribers`, ambos `rowsecurity: true`. Borrar `scratch-verify.sql` después.

- [ ] **Step 5: Commit**

```bash
git add supabase scripts && git commit -m "feat: esquema posts/subscribers con RLS y bucket post-assets"
```

---

### Task 3: Edge Function `subscribe`

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/clerk.ts`
- Create: `supabase/functions/_shared/unsub-token.ts`
- Create: `supabase/functions/subscribe/index.ts`

- [ ] **Step 1: `supabase/functions/_shared/cors.ts`**

```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: `supabase/functions/_shared/clerk.ts`**

```ts
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5';

const ISSUER = 'https://closing-bass-58.clerk.accounts.dev';
const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export async function verifyClerkToken(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('missing token');
  const token = authHeader.slice(7);
  const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
  if (!payload.sub) throw new Error('no sub');
  return payload.sub;
}

export async function getClerkEmail(userId: string): Promise<string> {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('CLERK_SECRET_KEY')}` },
  });
  if (!res.ok) throw new Error(`clerk api ${res.status}`);
  const user = await res.json();
  const primary = user.email_addresses?.find(
    (e: { id: string }) => e.id === user.primary_email_address_id
  );
  const email = primary?.email_address ?? user.email_addresses?.[0]?.email_address;
  if (!email) throw new Error('no email');
  return email.toLowerCase();
}
```

- [ ] **Step 3: `supabase/functions/_shared/unsub-token.ts`** (HMAC-SHA256 sobre el id del suscriptor)

```ts
const enc = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(Deno.env.get('UNSUBSCRIBE_SECRET')!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export async function makeUnsubToken(subscriberId: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(subscriberId));
  return `${subscriberId}.${b64url(sig)}`;
}

export async function verifyUnsubToken(token: string): Promise<string | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const id = token.slice(0, dot);
  const expected = await makeUnsubToken(id);
  return expected === token ? id : null;
}
```

- [ ] **Step 4: `supabase/functions/subscribe/index.ts`**

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { verifyClerkToken, getClerkEmail } from '../_shared/clerk.ts';
import { verifyUnsubToken } from '../_shared/unsub-token.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  try {
    const body = await req.json();

    if (body.action === 'unsubscribe_token') {
      const id = await verifyUnsubToken(body.token ?? '');
      if (!id) return json({ error: 'invalid token' }, 400);
      const { error } = await db.from('subscribers')
        .update({ unsubscribed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return json({ ok: true });
    }

    const userId = await verifyClerkToken(req.headers.get('Authorization'));

    if (body.action === 'status') {
      const { data } = await db.from('subscribers')
        .select('unsubscribed_at').eq('clerk_user_id', userId).maybeSingle();
      return json({ subscribed: !!data && data.unsubscribed_at === null });
    }

    if (body.action === 'subscribe') {
      const email = await getClerkEmail(userId);
      const { error } = await db.from('subscribers').upsert(
        {
          clerk_user_id: userId,
          email,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'clerk_user_id' }
      );
      if (error) throw error;
      return json({ subscribed: true });
    }

    if (body.action === 'unsubscribe') {
      const { error } = await db.from('subscribers')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('clerk_user_id', userId);
      if (error) throw error;
      return json({ subscribed: false });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    const msg = String(e);
    const auth = msg.includes('token') || msg.includes('JW');
    return json({ error: msg }, auth ? 401 : 500);
  }
});
```

- [ ] **Step 5: Setear secrets y desplegar**

Leer valores de `.env` (raíz del repo). Generar UNSUBSCRIBE_SECRET aleatorio (`openssl rand -hex 32` o equivalente node) y AÑADIRLO a `.env` como `UNSUBSCRIBE_SECRET=...` para reuso.

```bash
export SUPABASE_ACCESS_TOKEN=<de .env>
npx supabase secrets set --project-ref xjssqrmmzfgeivotgxad \
  CLERK_SECRET_KEY=<de .env> \
  RESEND_API_KEY=<de .env> \
  ADMIN_EMAIL=torresparodisdidierjose@gmail.com \
  UNSUBSCRIBE_SECRET=<generado> \
  SITE_URL=https://dipper.vercel.app
npx supabase functions deploy subscribe --project-ref xjssqrmmzfgeivotgxad --no-verify-jwt --use-api
```

**CRÍTICO:** `--no-verify-jwt` es obligatorio (el gateway rechazaría el JWT de Clerk). Si `--use-api` no existe en la versión de CLI, omitirlo (el default actual ya bundlea sin Docker).

- [ ] **Step 6: Verificar rechazo sin token y token inválido**

```bash
curl -s -X POST https://xjssqrmmzfgeivotgxad.supabase.co/functions/v1/subscribe \
  -H "Content-Type: application/json" -d '{"action":"status"}'
```
Expected: `{"error":"..."}` con status 401 (usar `-w '%{http_code}'` para confirmar).

- [ ] **Step 7: Verificar flujo completo con usuario de prueba de Clerk** (instancia dev permite crear sesiones por API)

```bash
# 1. Crear usuario de prueba
curl -s -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"email_address":["e2e-test@dipper.test"],"skip_password_requirement":true}'
# guardar "id" => USER_ID
# 2. Crear sesión
curl -s -X POST https://api.clerk.com/v1/sessions \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID"}'
# guardar "id" => SESSION_ID
# 3. Mint token
curl -s -X POST https://api.clerk.com/v1/sessions/SESSION_ID/tokens \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
# guardar "jwt" => TOKEN (expira en ~60s, usarlo rápido)
# 4. Suscribir
curl -s -X POST https://xjssqrmmzfgeivotgxad.supabase.co/functions/v1/subscribe \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"subscribe"}'
```
Expected: `{"subscribed":true}`. Verificar con action `status` → `{"subscribed":true}` y `unsubscribe` → `{"subscribed":false}`.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions && git commit -m "feat: edge function subscribe con verificacion JWT de Clerk"
```

---

### Task 4: Edge Function `admin-posts` + newsletter

**Files:**
- Create: `supabase/functions/admin-posts/index.ts`
- Uses: `_shared/cors.ts`, `_shared/clerk.ts`, `_shared/unsub-token.ts` (de Task 3)

- [ ] **Step 1: `supabase/functions/admin-posts/index.ts`**

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { verifyClerkToken, getClerkEmail } from '../_shared/clerk.ts';
import { makeUnsubToken } from '../_shared/unsub-token.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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
        <h1 style="font-size:20px;margin:0 0 12px;">${post.title}</h1>
        <p style="color:#8B93A7;margin:0 0 20px;">${post.description ?? ''}</p>
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
```

- [ ] **Step 2: Desplegar**

```bash
npx supabase functions deploy admin-posts --project-ref xjssqrmmzfgeivotgxad --no-verify-jwt --use-api
```

- [ ] **Step 3: Verificar que un usuario NO admin recibe 403**

Con el usuario de prueba de Task 3 Step 7 (mint token fresco): llamar `admin-posts` con `{"action":"list"}`.
Expected: status 403, `{"error":"...forbidden..."}`.

- [ ] **Step 4: Verificar flujo admin con usuario admin de prueba**

La instancia dev de Clerk permite crear el usuario con el email admin real:

```bash
# crear usuario con email admin (si ya existe por login previo de Didier, usar GET /v1/users?email_address=... para obtener su id)
curl -s -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"email_address":["torresparodisdidierjose@gmail.com"],"skip_password_requirement":true}'
# sesión + token igual que Task 3 Step 7
```

Con ese token:
1. `{"action":"create","post":{"title":"Post de prueba E2E","slug":"post-prueba-e2e","description":"Verificacion del pipeline","content_md":"# Hola\n\nEsto es **markdown** con `codigo`.","tags":["test"]}}` → Expected: `{"id":"..."}`
2. `{"action":"list"}` → Expected: incluye el post con `status: "draft"`
3. `{"action":"publish","id":"<id>"}` → Expected: `{"ok":true,"newsletter":{"sent":N,"failed":0}}` (sent ≥ 0; con el suscriptor admin de prueba activo debería ser ≥ 1 — Resend en sandbox solo entrega al email del dueño de la cuenta, que es justamente el admin).
4. Leer como público (RLS): `curl "https://xjssqrmmzfgeivotgxad.supabase.co/rest/v1/posts?select=slug,title&status=eq.published" -H "apikey: sb_publishable_S4IPO5yOy3KtdpNMV7G-1g_ASGN-jP-"` → Expected: array con el post.
5. Confirmar que drafts NO se ven: mismo curl sin filtro status → solo publicados.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions && git commit -m "feat: edge function admin-posts con newsletter Resend"
```

---

### Task 5: Cliente de datos frontend + parser de Markdown de Notion (TDD)

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/api.ts`
- Create: `src/lib/md.ts`
- Test: `src/lib/md.test.ts`
- Create: `.env.local` (NO commitear; ya cubierto por .gitignore `.env.*`)

- [ ] **Step 1: `.env.local`**

```
VITE_SUPABASE_URL=https://xjssqrmmzfgeivotgxad.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_S4IPO5yOy3KtdpNMV7G-1g_ASGN-jP-
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xvc2luZy1iYXNzLTU4LmNsZXJrLmFjY291bnRzLmRldiQ
VITE_ADMIN_EMAIL=torresparodisdidierjose@gmail.com
```

- [ ] **Step 2: Test que falla — `src/lib/md.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseNotionMd, slugify } from './md';

describe('parseNotionMd', () => {
  it('extrae el primer H1 como titulo y lo quita del cuerpo', () => {
    const { title, body } = parseNotionMd('# Mi titulo\n\nParrafo uno.');
    expect(title).toBe('Mi titulo');
    expect(body).toBe('Parrafo uno.');
    expect(body).not.toContain('# Mi titulo');
  });

  it('sin H1 devuelve titulo vacio y cuerpo intacto', () => {
    const { title, body } = parseNotionMd('Solo texto plano.');
    expect(title).toBe('');
    expect(body).toBe('Solo texto plano.');
  });

  it('no confunde H2 con el titulo', () => {
    const { title } = parseNotionMd('## Seccion\n\ntexto');
    expect(title).toBe('');
  });
});

describe('slugify', () => {
  it('convierte a kebab-case sin acentos', () => {
    expect(slugify('Particionar tablas en Postgres ¡sin dolor!')).toBe(
      'particionar-tablas-en-postgres-sin-dolor'
    );
  });
  it('colapsa espacios y guiones repetidos', () => {
    expect(slugify('a  b --- c')).toBe('a-b-c');
  });
});
```

- [ ] **Step 3: Verificar que falla**

Run: `npx vitest run src/lib/md.test.ts`
Expected: FAIL (módulo `./md` no existe).

- [ ] **Step 4: Implementar `src/lib/md.ts`**

```ts
export function parseNotionMd(md: string): { title: string; body: string } {
  const lines = md.split('\n');
  const h1Index = lines.findIndex((l) => /^# (?!#)/.test(l));
  if (h1Index === -1) return { title: '', body: md.trim() };
  const title = lines[h1Index].replace(/^# /, '').trim();
  const body = [...lines.slice(0, h1Index), ...lines.slice(h1Index + 1)]
    .join('\n')
    .trim();
  return { title, body };
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}
```

- [ ] **Step 5: Verificar que pasa**

Run: `npx vitest run src/lib/md.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
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
    .select('id,slug,title,description,cover_url,tags,status,published_at,created_at,content_md')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (tag) q = q.contains('tags', [tag]);
  const { data, error } = await q;
  if (error) throw error;
  return data as Post[];
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data as Post | null;
}
```

- [ ] **Step 7: `src/lib/api.ts`** (llamadas a Edge Functions con token de Clerk)

```ts
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
```

- [ ] **Step 8: Verificar build y tests**

Run: `npm run build && npm test`
Expected: build OK, 5 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib package.json && git commit -m "feat: cliente supabase, api de edge functions y parser md con tests"
```

---

### Task 6: Shell de la app — routing, Header, Footer, Home

**Files:**
- Create: `src/main.tsx` (reemplazar plantilla)
- Create: `src/App.tsx` (reemplazar plantilla)
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/components/PostCard.tsx`
- Create: `src/pages/Home.tsx`
- Delete: `src/App.css`, `src/index.css`, `src/assets/react.svg` (si existen)

- [ ] **Step 1: `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './theme.css';
import 'highlight.js/styles/base16/tomorrow-night.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: { colorPrimary: '#E8A25E', colorBackground: '#16213E', colorText: '#F2F2F0' },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: `src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Post from './pages/Post';
import Admin from './pages/Admin';
import Unsubscribe from './pages/Unsubscribe';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="container" style={{ flex: 1, width: '100%', paddingTop: 24, paddingBottom: 48 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

Nota: `Post`, `Admin`, `Unsubscribe` se crean en Tasks 7–9. Para que este task compile aislado, crear stubs mínimos `export default function X() { return null; }` en `src/pages/Post.tsx`, `src/pages/Admin.tsx`, `src/pages/Unsubscribe.tsx` (Tasks 7–9 los reemplazan).

- [ ] **Step 3: `src/components/Header.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

export default function Header() {
  const { user } = useUser();
  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  return (
    <header style={{ borderBottom: '2px dashed var(--muted)' }}>
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}
      >
        <Link to="/" className="px" style={{ color: 'var(--text)', fontSize: 14 }}>
          DIPPER<span style={{ color: 'var(--accent)' }}>.DEV</span>
        </Link>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {isAdmin && (
            <Link to="/admin" style={{ color: 'var(--muted)' }}>admin</Link>
          )}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="pixel-btn">LOGIN</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: `src/components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer style={{ borderTop: '2px dashed var(--muted)', padding: '18px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        © {new Date().getFullYear()} Didier Torres Parody ·{' '}
        <a href="https://github.com/DidierParody">GitHub</a>
      </p>
    </footer>
  );
}
```

- [ ] **Step 5: `src/components/PostCard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import type { Post } from '../lib/supabase';

export default function PostCard({ post }: { post: Post }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  return (
    <article className="pixel-card">
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 6px' }}>{date}</p>
      <h2 style={{ margin: '0 0 10px' }}>
        <Link to={`/post/${post.slug}`} style={{ color: 'var(--text)' }}>{post.title}</Link>
      </h2>
      {post.description && (
        <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>{post.description}</p>
      )}
      <div>
        {post.tags.map((t) => (
          <Link key={t} to={`/tag/${t}`} className="tag">{t}</Link>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 6: `src/pages/Home.tsx`** (usa SubscribeButton de Task 8; hasta entonces crear stub `src/components/SubscribeButton.tsx` con `export default function SubscribeButton() { return null; }`)

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublishedPosts, type Post } from '../lib/supabase';
import PostCard from '../components/PostCard';
import SubscribeButton from '../components/SubscribeButton';

export default function Home() {
  const { tag } = useParams();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPosts(null);
    fetchPublishedPosts(tag).then(setPosts).catch((e) => setError(String(e)));
  }, [tag]);

  return (
    <>
      <section style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <h1 style={{ margin: '0 0 12px' }}>
          Notas de un <span style={{ color: 'var(--accent)' }}>Ingeniero de Datos</span>
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
          Pipelines, SQL, cloud y experimentos — directo desde mis notas de Notion.
        </p>
        <SubscribeButton />
      </section>
      <hr className="dashed-divider" />
      {tag && <p style={{ color: 'var(--muted)' }}>Posts con tag <span className="tag">{tag}</span></p>}
      {error && <p style={{ color: 'var(--accent)' }}>Error cargando posts. Recarga la página.</p>}
      {posts === null && !error && <p style={{ color: 'var(--muted)' }}>Cargando...</p>}
      {posts?.length === 0 && <p style={{ color: 'var(--muted)' }}>Todavía no hay posts publicados.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {posts?.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}
```

- [ ] **Step 7: Verificar build + dev server**

Run: `npm run build` → OK. `npm run dev` y abrir `http://localhost:5173` → header pixel, hero, "Todavía no hay posts" o el post E2E de Task 4.

- [ ] **Step 8: Commit**

```bash
git add src && git commit -m "feat: shell de la app con header, footer, home y cards pixel"
```

---

### Task 7: Página de post con render Markdown

**Files:**
- Create: `src/pages/Post.tsx` (reemplaza stub)

- [ ] **Step 1: `src/pages/Post.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPostBySlug, type Post as PostType } from '../lib/supabase';
import SubscribeButton from '../components/SubscribeButton';

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState<PostType | null | 'loading'>('loading');

  useEffect(() => {
    setPost('loading');
    if (slug) fetchPostBySlug(slug).then((p) => setPost(p)).catch(() => setPost(null));
  }, [slug]);

  if (post === 'loading') return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;
  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1>404</h1>
        <p style={{ color: 'var(--muted)' }}>Este post no existe.</p>
        <Link to="/" className="pixel-btn ghost" style={{ display: 'inline-block', marginTop: 12 }}>
          &lt; VOLVER
        </Link>
      </div>
    );
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <article>
      <div style={{ marginBottom: 8 }}>
        {post.tags.map((t) => <Link key={t} to={`/tag/${t}`} className="tag">{t}</Link>)}
      </div>
      <h1 style={{ margin: '10px 0 6px' }}>{post.title}</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>{date}</p>
      {post.cover_url && (
        <img src={post.cover_url} alt="" style={{ width: '100%', border: '2px solid var(--text)', marginBottom: 16 }} />
      )}
      <hr className="dashed-divider" />
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content_md}
        </ReactMarkdown>
      </div>
      <div
        className="pixel-card"
        style={{ marginTop: 32, textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--accent)' }}
      >
        <p className="px" style={{ fontSize: 11, margin: '0 0 12px' }}>
          ¿Te sirvió? Recibe el próximo en tu correo
        </p>
        <SubscribeButton />
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` → OK. Con dev server, navegar a `/post/post-prueba-e2e` (el post de Task 4) → título, fecha, markdown renderizado con código resaltado. Navegar a `/post/no-existe` → 404 pixel.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Post.tsx && git commit -m "feat: pagina de post con markdown y resaltado de codigo"
```

---

### Task 8: SubscribeButton + página Unsubscribe

**Files:**
- Create: `src/components/SubscribeButton.tsx` (reemplaza stub)
- Create: `src/pages/Unsubscribe.tsx` (reemplaza stub)

- [ ] **Step 1: `src/components/SubscribeButton.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useAuth, SignInButton, useUser } from '@clerk/clerk-react';
import { subscriptionApi } from '../lib/api';

export default function SubscribeButton() {
  const { isSignedIn, getToken } = useAuth();
  const { isLoaded } = useUser();
  const [state, setState] = useState<'unknown' | 'subscribed' | 'unsubscribed' | 'busy'>('unknown');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const { subscribed } = await subscriptionApi.status(token!);
        setState(subscribed ? 'subscribed' : 'unsubscribed');
      } catch {
        setState('unsubscribed');
      }
    })();
  }, [isSignedIn, getToken]);

  async function toggle() {
    const prev = state;
    setState('busy');
    setError('');
    try {
      const token = await getToken();
      if (prev === 'subscribed') {
        await subscriptionApi.unsubscribe(token!);
        setState('unsubscribed');
      } else {
        await subscriptionApi.subscribe(token!);
        setState('subscribed');
      }
    } catch (e) {
      setError('No se pudo actualizar. Intenta de nuevo.');
      setState(prev);
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div>
        <SignInButton mode="modal">
          <button className="pixel-btn">&gt; SUSCRIBIRME_</button>
        </SignInButton>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginTop: 8 }}>
          Inicia sesión con GitHub o Google. Sin spam.
        </p>
      </div>
    );
  }

  return (
    <div>
      {state === 'subscribed' ? (
        <button className="pixel-btn ghost" onClick={toggle} disabled={state === 'busy'}>
          SUSCRITO ✓ (clic para salir)
        </button>
      ) : (
        <button className="pixel-btn" onClick={toggle} disabled={state === 'busy' || state === 'unknown'}>
          {state === 'busy' ? '...' : '> SUSCRIBIRME_'}
        </button>
      )}
      {error && <p style={{ color: 'var(--accent)', fontSize: 16, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `src/pages/Unsubscribe.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { subscriptionApi } from '../lib/api';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');

  useEffect(() => {
    const token = params.get('token');
    if (!token) return setState('error');
    subscriptionApi.unsubscribeByToken(token)
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [params]);

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      {state === 'working' && <p style={{ color: 'var(--muted)' }}>Procesando...</p>}
      {state === 'done' && (
        <>
          <h1>Listo</h1>
          <p style={{ color: 'var(--muted)' }}>Ya no recibirás correos de Dipper.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1>Link inválido</h1>
          <p style={{ color: 'var(--muted)' }}>El link de desuscripción no es válido o ya expiró.</p>
        </>
      )}
      <Link to="/" className="pixel-btn ghost" style={{ display: 'inline-block', marginTop: 12 }}>
        &lt; VOLVER AL BLOG
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` → OK. En dev server: botón "SUSCRIBIRME_" visible sin sesión y abre modal de Clerk al hacer clic. `/unsubscribe?token=basura` → "Link inválido".

- [ ] **Step 4: Commit**

```bash
git add src && git commit -m "feat: boton de suscripcion con Clerk y pagina de desuscripcion"
```

---

### Task 9: Panel Admin

**Files:**
- Create: `src/pages/Admin.tsx` (reemplaza stub)

- [ ] **Step 1: `src/pages/Admin.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { adminApi } from '../lib/api';
import { parseNotionMd, slugify } from '../lib/md';

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  published_at: string | null;
}

interface Draft {
  title: string;
  slug: string;
  description: string;
  tags: string;
  content_md: string;
}

const emptyDraft: Draft = { title: '', slug: '', description: '', tags: '', content_md: '' };

export default function Admin() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [msg, setMsg] = useState('');
  const [denied, setDenied] = useState(false);

  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      const { posts } = await adminApi.list(token!);
      setPosts(posts);
    } catch (e) {
      if (String(e).includes('forbidden')) setDenied(true);
      else setMsg(`Error: ${e}`);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isAdmin) refresh();
  }, [isLoaded, isAdmin, refresh]);

  if (!isLoaded) return null;
  if (!isAdmin || denied) {
    return <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Zona restringida.</p>;
  }

  function onFile(file: File) {
    if (file.size > 1_000_000) return setMsg('Archivo demasiado grande (máx 1 MB).');
    file.text().then((text) => {
      const { title, body } = parseNotionMd(text);
      setDraft({
        title,
        slug: slugify(title || file.name.replace(/\.md$/, '')),
        description: '',
        tags: '',
        content_md: body,
      });
      setMsg(`Cargado: ${file.name}`);
    });
  }

  async function saveDraft() {
    setMsg('Guardando...');
    try {
      const token = await getToken();
      await adminApi.create(token!, {
        title: draft.title,
        slug: draft.slug,
        description: draft.description,
        content_md: draft.content_md,
        tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setDraft(emptyDraft);
      setMsg('Borrador guardado.');
      refresh();
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
  }

  async function publish(id: string) {
    setMsg('Publicando y enviando newsletter...');
    try {
      const token = await getToken();
      const r = await adminApi.publish(token!, id);
      setMsg(`Publicado. Newsletter: ${r.newsletter.sent} enviados, ${r.newsletter.failed} fallos.`);
      refresh();
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este post?')) return;
    const token = await getToken();
    await adminApi.remove(token!, id);
    refresh();
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>
        ADMIN <span style={{ color: 'var(--accent)' }}>// gestor de posts</span>
      </h1>

      <div
        style={{ border: '2px dashed var(--muted)', padding: 24, textAlign: 'center', marginBottom: 20 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
      >
        <p style={{ margin: '0 0 8px' }}>Arrastra tu .md exportado de Notion, o</p>
        <input
          type="file"
          accept=".md,.markdown,text/markdown"
          style={{ width: 'auto' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      {draft.content_md && (
        <div className="pixel-card" style={{ marginBottom: 20 }}>
          <label>Título</label>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} />
          <label>Slug</label>
          <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          <label>Descripción (para cards y el correo)</label>
          <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <label>Tags (separados por coma)</label>
          <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          <label>Contenido ({draft.content_md.length} caracteres)</label>
          <textarea rows={6} value={draft.content_md} onChange={(e) => setDraft({ ...draft, content_md: e.target.value })} />
          <button className="pixel-btn" style={{ marginTop: 14 }} onClick={saveDraft} disabled={!draft.title || !draft.slug}>
            GUARDAR BORRADOR
          </button>
        </div>
      )}

      {msg && <p style={{ color: 'var(--accent)' }}>{msg}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '2px solid var(--text)', padding: '10px 14px', gap: 10,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title} <span style={{ color: 'var(--muted)' }}>/{p.slug}</span>
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {p.status === 'published' ? (
                <span style={{ background: 'var(--accent)', color: 'var(--bg)', fontSize: 15, padding: '1px 8px' }}>
                  PUBLICADO
                </span>
              ) : (
                <>
                  <span className="tag" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>BORRADOR</span>
                  <button className="pixel-btn" style={{ fontSize: 8 }} onClick={() => publish(p.id)}>
                    PUBLICAR + EMAIL
                  </button>
                </>
              )}
              <button className="pixel-btn ghost" style={{ fontSize: 8 }} onClick={() => remove(p.id)}>X</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` → OK. En dev server sin sesión: `/admin` muestra "Zona restringida."

- [ ] **Step 3: Commit**

```bash
git add src/pages/Admin.tsx && git commit -m "feat: panel admin con upload de md, publicar y newsletter"
```

---

### Task 10: Deploy a Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: `vercel.json`** (rewrite SPA)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Setear env vars y deploy** (token en `.env` como VERCEL_TOKEN; usar `--yes` para crear el proyecto `dipper`)

```bash
export VERCEL_TOKEN=<de .env>
printf 'https://xjssqrmmzfgeivotgxad.supabase.co' | npx vercel env add VITE_SUPABASE_URL production --token "$VERCEL_TOKEN" --yes 2>/dev/null || true
# (si env add falla porque el proyecto no existe aún, correr primero: npx vercel link --yes --project dipper --token "$VERCEL_TOKEN")
printf 'sb_publishable_S4IPO5yOy3KtdpNMV7G-1g_ASGN-jP-' | npx vercel env add VITE_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN" --yes
printf 'pk_test_Y2xvc2luZy1iYXNzLTU4LmNsZXJrLmFjY291bnRzLmRldiQ' | npx vercel env add VITE_CLERK_PUBLISHABLE_KEY production --token "$VERCEL_TOKEN" --yes
printf 'torresparodisdidierjose@gmail.com' | npx vercel env add VITE_ADMIN_EMAIL production --token "$VERCEL_TOKEN" --yes
npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
```

Guardar la URL de producción que devuelve el deploy (p. ej. `https://dipper-xxxx.vercel.app` o `https://dipper.vercel.app`).

- [ ] **Step 3: Actualizar SITE_URL en secrets de Supabase con la URL real**

```bash
npx supabase secrets set --project-ref xjssqrmmzfgeivotgxad SITE_URL=<url-de-produccion>
```

(Los links de desuscripción del newsletter usan SITE_URL; debe apuntar al dominio real.)

- [ ] **Step 4: Verificar producción**

```bash
curl -s -o /dev/null -w '%{http_code}' <url-produccion>          # Expected: 200
curl -s -o /dev/null -w '%{http_code}' <url-produccion>/post/post-prueba-e2e  # Expected: 200 (rewrite SPA)
```

- [ ] **Step 5: Commit**

```bash
git add vercel.json && git commit -m "feat: config de deploy Vercel con rewrite SPA" && git push
```

---

### Task 11: Verificación E2E final + limpieza

- [ ] **Step 1: E2E de producción vía API** (repetir con la URL de producción)

1. Token admin fresco (Clerk API, como Task 4 Step 4).
2. Crear post de prueba 2 → publicar → Expected: `newsletter.sent ≥ 1`, `failed: 0`.
3. `curl <url-produccion>` y confirmar en el HTML servido que carga (SPA — el contenido lo hidrata JS; verificar con browser preview local apuntando a datos de producción).
4. Extraer de la BD el token de desuscripción no es posible (HMAC) — verificar unsubscribe llamando a `subscribe` con `action: unsubscribe` y token del usuario de prueba → `{"subscribed":false}`.

- [ ] **Step 2: Verificación visual con browser** (preview local `npm run dev`, que usa los mismos datos de producción)

- Home renderiza posts publicados con estética pixel.
- Página de post renderiza markdown con código resaltado.
- `/admin` sin sesión → "Zona restringida".
- `/unsubscribe?token=basura` → "Link inválido".
- Modal de Clerk abre con opciones GitHub y Google.

- [ ] **Step 3: Limpieza de datos de prueba**

Borrar los posts de prueba E2E (action delete con token admin) y el usuario de prueba `e2e-test@dipper.test` de Clerk (`DELETE https://api.clerk.com/v1/users/{id}`). Mantener la fila de subscriber del admin si Didier quiere recibir los correos reales (dejarla).

- [ ] **Step 4: Actualizar README con URL de producción y flujo de publicación, commit final y push**

```bash
git add -A && git commit -m "docs: README con URL de produccion y guia de publicacion" && git push
```
