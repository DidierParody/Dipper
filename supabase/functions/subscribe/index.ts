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
