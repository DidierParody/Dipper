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
