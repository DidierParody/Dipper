import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { adminApi } from '../lib/api';
import { parseNotionMd, slugify } from '../lib/md';

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
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

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

const emptyDraft: Draft = { title: '', slug: '', description: '', tags: '', content_md: '' };

const SUCCESS_COLOR = '#E8A25E';
const ERROR_COLOR = '#E24B4A';

export default function Admin() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgIsError, setMsgIsError] = useState(false);
  const [denied, setDenied] = useState(false);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [driveConfigured, setDriveConfigured] = useState<boolean | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[] | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  function setStatus(text: string, isError = false) {
    setMsg(text);
    setMsgIsError(isError);
  }

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      const { posts } = await adminApi.list(token!);
      setPosts(posts);
    } catch (e) {
      if (String(e).includes('forbidden')) setDenied(true);
      else setStatus(`Error: ${e}`, true);
    }
  }, [getToken]);

  const refreshStats = useCallback(async () => {
    try {
      const token = await getToken();
      const { subscribers } = await adminApi.stats(token!);
      setSubscribers(subscribers);
    } catch {
      // no bloquea el panel si stats falla
    }
  }, [getToken]);

  const refreshDriveStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const { configured } = await adminApi.driveStatus(token!);
      setDriveConfigured(configured);
    } catch {
      setDriveConfigured(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isAdmin) {
      refresh();
      refreshStats();
      refreshDriveStatus();
    }
  }, [isLoaded, isAdmin, refresh, refreshStats, refreshDriveStatus]);

  if (!isLoaded) return null;
  if (!isAdmin || denied) {
    return <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Zona restringida.</p>;
  }

  function onFile(file: File) {
    if (file.size > 1_000_000) return setStatus('Archivo demasiado grande (máx 1 MB).', true);
    file.text().then((text) => {
      const { title, body } = parseNotionMd(text);
      setEditingId(null);
      setDraft({
        title,
        slug: slugify(title || file.name.replace(/\.md$/, '')),
        description: '',
        tags: '',
        content_md: body,
      });
      setShowPreview(false);
      setStatus(`Cargado: ${file.name}`);
    });
  }

  function startEdit(p: AdminPost) {
    setEditingId(p.id);
    setDraft({
      title: p.title,
      slug: p.slug,
      description: p.description ?? '',
      tags: (p.tags ?? []).join(', '),
      content_md: '',
    });
    setShowPreview(false);
    setStatus('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowPreview(false);
    setStatus('');
  }

  async function loadDriveFiles() {
    setDriveBusy(true);
    setStatus('');
    try {
      const token = await getToken();
      const { files } = await adminApi.driveList(token!);
      setDriveFiles(files);
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setDriveBusy(false);
    }
  }

  async function importFromDrive(f: DriveFile) {
    setImportingId(f.id);
    setStatus('');
    try {
      const token = await getToken();
      const r = await adminApi.driveImport(token!, f.id, f.name);
      setStatus(`Importado: ${r.title}`);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setImportingId(null);
    }
  }

  async function saveDraft() {
    setStatus('Guardando...');
    try {
      const token = await getToken();
      const tags = draft.tags.split(',').map((t) => t.trim()).filter(Boolean);

      if (editingId) {
        const patch: Record<string, unknown> = {
          id: editingId,
          title: draft.title,
          slug: draft.slug,
          description: draft.description,
          tags,
        };
        if (draft.content_md.trim()) patch.content_md = draft.content_md;
        await adminApi.update(token!, patch);
        setStatus('Cambios guardados.');
      } else {
        await adminApi.create(token!, {
          title: draft.title,
          slug: draft.slug,
          description: draft.description,
          content_md: draft.content_md,
          tags,
        });
        setStatus('Borrador guardado.');
      }
      setEditingId(null);
      setDraft(emptyDraft);
      setShowPreview(false);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    }
  }

  async function publish(id: string) {
    const n = subscribers ?? 0;
    if (!confirm(`Esto enviará un email a ${n} suscriptor${n === 1 ? '' : 'es'}. ¿Publicar de todas formas?`)) return;
    setStatus('Publicando y enviando newsletter...');
    try {
      const token = await getToken();
      const r = await adminApi.publish(token!, id);
      setStatus(`Publicado. Newsletter: ${r.newsletter.sent} enviados, ${r.newsletter.failed} fallos.`);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este post?')) return;
    const token = await getToken();
    await adminApi.remove(token!, id);
    refresh();
  }

  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => (p.status as string) === 'published');
  const isFormOpen = editingId !== null || draft.content_md !== '' || draft.title !== '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>
          Admin <span style={{ color: 'var(--accent)' }}>· gestor de posts</span>
        </h1>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {subscribers === null ? 'Cargando suscriptores…' : `${subscribers} suscriptor${subscribers === 1 ? '' : 'es'} activo${subscribers === 1 ? '' : 's'}`}
        </span>
      </div>

      <h2>Importar desde Drive</h2>
      {driveConfigured === false && (
        <div className="pixel-card" style={{ marginBottom: 20, borderStyle: 'dashed', borderColor: 'var(--muted)' }}>
          <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>
            La importación desde Google Drive todavía no está configurada. Para activarla:
          </p>
          <ol style={{ color: 'var(--muted)', margin: 0, paddingLeft: 18 }}>
            <li>Crear una service account de Google con acceso a la API de Drive.</li>
            <li>Compartir la carpeta de Drive con el email de esa service account.</li>
            <li>Pasarle el JSON de la service account a Claude para configurar los secrets.</li>
          </ol>
        </div>
      )}
      {driveConfigured === true && (
        <div className="pixel-card" style={{ marginBottom: 20 }}>
          <button className="pixel-btn" onClick={loadDriveFiles} disabled={driveBusy}>
            {driveBusy ? 'Listando…' : 'Listar archivos de Drive'}
          </button>
          {driveFiles && driveFiles.length === 0 && (
            <p style={{ color: 'var(--muted)', marginTop: 12 }}>No hay archivos .md en la carpeta.</p>
          )}
          {driveFiles && driveFiles.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {driveFiles.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, borderBottom: '1px dashed var(--muted)', paddingBottom: 8,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}{' '}
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {new Date(f.modifiedTime).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                  <button
                    className="pixel-btn ghost"
                    style={{ flexShrink: 0 }}
                    onClick={() => importFromDrive(f)}
                    disabled={importingId === f.id}
                  >
                    {importingId === f.id ? 'Importando…' : 'Importar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        style={{ border: '2px dashed var(--muted)', padding: 24, textAlign: 'center', marginBottom: 20 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
      >
        <p style={{ margin: '0 0 8px' }}>Arrastra tu .md exportado de Notion, o sube un .md manualmente</p>
        <input
          type="file"
          accept=".md,.markdown,text/markdown"
          style={{ width: 'auto' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      {isFormOpen && (
        <div className="pixel-card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar post' : 'Nuevo borrador'}</h2>
          <label>Título</label>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} />
          <label>Slug</label>
          <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          <label>Descripción (para cards y el correo)</label>
          <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <label>Tags (separados por coma)</label>
          <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          <label>
            Contenido ({draft.content_md.length} caracteres)
            {editingId && (
              <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                Deja el contenido vacío para conservar el actual.
              </span>
            )}
          </label>
          <textarea rows={6} value={draft.content_md} onChange={(e) => setDraft({ ...draft, content_md: e.target.value })} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="pixel-btn" onClick={saveDraft} disabled={!draft.title || !draft.slug}>
              {editingId ? 'Guardar cambios' : 'Guardar borrador'}
            </button>
            <button className="pixel-btn ghost" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
            </button>
            {editingId && (
              <button className="pixel-btn ghost" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>

          {showPreview && (
            <div className="markdown-body" style={{ marginTop: 16, borderTop: '2px dashed var(--muted)', paddingTop: 16 }}>
              {draft.content_md.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {draft.content_md}
                </ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Deja el contenido vacío para conservar el actual.</p>
              )}
            </div>
          )}
        </div>
      )}

      {msg && <p style={{ color: msgIsError ? ERROR_COLOR : SUCCESS_COLOR }}>{msg}</p>}

      <h2>Borradores</h2>
      {drafts.length === 0 && <p style={{ color: 'var(--muted)' }}>No hay borradores.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {drafts.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '2px solid var(--text)', padding: '10px 14px', gap: 10, flexWrap: 'wrap',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title} <span style={{ color: 'var(--muted)' }}>/{p.slug}</span>
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span className="tag" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>Borrador</span>
              <button className="pixel-btn ghost" onClick={() => startEdit(p)}>Editar</button>
              <button className="pixel-btn" onClick={() => publish(p.id)}>Publicar + email</button>
              <button className="pixel-btn ghost" onClick={() => remove(p.id)}>Eliminar</button>
            </span>
          </div>
        ))}
      </div>

      <h2>Publicados</h2>
      {published.length === 0 && <p style={{ color: 'var(--muted)' }}>No hay posts publicados.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {published.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '2px solid var(--text)', padding: '10px 14px', gap: 10, flexWrap: 'wrap',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title} <span style={{ color: 'var(--muted)' }}>/{p.slug}</span>
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span style={{ background: 'var(--accent)', color: 'var(--bg)', fontSize: 13, padding: '2px 8px' }}>
                Publicado
              </span>
              <button className="pixel-btn ghost" onClick={() => startEdit(p)}>Editar</button>
              <button className="pixel-btn ghost" onClick={() => remove(p.id)}>Eliminar</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
