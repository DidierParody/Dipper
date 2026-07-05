import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { downloadFile } from '../_shared/drive.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  const { data: post } = await db.from('posts')
    .select('drive_file_id').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (!post?.drive_file_id) {
    return new Response('not found', { status: 404, headers: corsHeaders });
  }
  try {
    const md = await downloadFile(post.drive_file_id);
    return new Response(md, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch {
    return new Response('drive error', { status: 502, headers: corsHeaders });
  }
});
