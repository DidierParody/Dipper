import { useCallback, useEffect, useRef, useState } from 'react';
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

const SUCCESS_COLOR = '#8fd0ff';
const ERROR_COLOR = '#e05252';

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 12,
  color: '#5b6a8f',
  marginBottom: 14,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={{ width: 7, height: 7, background: '#f0954c', display: 'inline-block' }} />
      {children}
    </div>
  );
}

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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>
          Zona restringida.
        </p>
      </div>
    );
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
  const canPublish = !!draft.title && !!draft.slug;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 120px' }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          color: '#f0954c',
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        panel admin
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Publicar nuevo post</h1>
        <span style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}>
          {subscribers === null ? 'Cargando suscriptores…' : `${subscribers} suscriptor${subscribers === 1 ? '' : 'es'} activo${subscribers === 1 ? '' : 's'}`}
        </span>
      </div>

      <SectionHeader>importar desde drive</SectionHeader>
      {driveConfigured === false && (
        <div style={{ background: '#0e1426', border: '1px solid #1c2438', borderRadius: 10, padding: 18, marginBottom: 28 }}>
          <p style={{ margin: '0 0 8px', color: '#8b96b2', fontSize: 13.5 }}>
            La importación desde Google Drive todavía no está configurada. Para activarla:
          </p>
          <ol style={{ color: '#8b96b2', margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
            <li>Crear una service account de Google con acceso a la API de Drive.</li>
            <li>Compartir la carpeta de Drive con el email de esa service account.</li>
            <li>Pasarle el JSON de la service account a Claude para configurar los secrets.</li>
          </ol>
        </div>
      )}
      {driveConfigured === true && (
        <div style={{ background: '#0e1426', border: '1px solid #1c2438', borderRadius: 10, padding: 18, marginBottom: 28 }}>
          <button className="admin-chip-btn" onClick={loadDriveFiles} disabled={driveBusy}>
            {driveBusy ? 'Listando…' : 'Listar archivos de Drive'}
          </button>
          {driveFiles && driveFiles.length === 0 && (
            <p style={{ color: '#5b6a8f', marginTop: 12, fontSize: 13.5 }}>No hay archivos .md en la carpeta.</p>
          )}
          {driveFiles && driveFiles.length > 0 && (
            <div style={{ marginTop: 14, border: '1px solid #1c2438', borderRadius: 10, overflow: 'hidden' }}>
              {driveFiles.map((f) => (
                <div key={f.id} className="admin-row">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 14 }}>
                    {f.name}{' '}
                    <span style={{ color: '#5b6a8f', fontSize: 11.5, fontFamily: "'IBM Plex Mono',monospace" }}>
                      {new Date(f.modifiedTime).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                  <button
                    className="admin-chip-btn"
                    onClick={() => importFromDrive(f)}
                    disabled={importingId === f.id}
                  >
                    {importingId === f.id ? 'importando…' : 'importar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`dropzone${dragOver ? ' drag-active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
      >
        <div style={{ width: 44, height: 44, margin: '0 auto 16px', border: '2px solid #f0954c', borderRadius: 8, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 14,
              color: '#f0954c',
              fontWeight: 700,
            }}
          >
            .md
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Arrastra tu archivo .md aquí</div>
        <div style={{ color: '#5b6a8f', fontSize: 13, marginBottom: 18 }}>
          o haz clic para seleccionar desde tu equipo
        </div>
        <div className="dropzone-chip">Seleccionar archivo</div>

        {draft.content_md && (
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(59,130,246,.12)',
              border: '1px solid #3b82f6',
              padding: '9px 16px',
              borderRadius: 8,
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: '#8fd0ff' }}>
              {draft.slug || draft.title || 'archivo cargado'}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit();
              }}
              style={{ cursor: 'pointer', color: '#5b6a8f', fontSize: 14 }}
            >
              ✕
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          style={{ display: 'none' }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      {isFormOpen && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label>Título</label>
              <input
                value={draft.title}
                placeholder="ej. Diseñando un lakehouse desde cero"
                onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })}
              />
            </div>
            <div>
              <label>Etiqueta</label>
              <input
                value={draft.tags}
                placeholder="ej. Data Engineering, Cloud"
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Descripción (para cards y el correo)</label>
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              Contenido ({draft.content_md.length} caracteres)
              {editingId && (
                <span style={{ display: 'block', color: '#5b6a8f', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>
                  Deja el contenido vacío para conservar el actual.
                </span>
              )}
            </label>
            <textarea rows={8} value={draft.content_md} onChange={(e) => setDraft({ ...draft, content_md: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <div
              onClick={saveDraft}
              style={{
                cursor: canPublish ? 'pointer' : 'not-allowed',
                display: 'inline-block',
                background: canPublish ? '#3b82f6' : '#1c2438',
                color: canPublish ? '#06101f' : '#5b6a8f',
                fontWeight: 600,
                fontSize: 14,
                padding: '12px 26px',
                borderRadius: 8,
              }}
            >
              {editingId ? 'Guardar cambios' : 'Publicar post'}
            </div>
            <button className="admin-chip-btn" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'ocultar vista previa' : 'vista previa'}
            </button>
            {editingId && (
              <button className="admin-chip-btn" onClick={cancelEdit}>
                cancelar
              </button>
            )}
          </div>

          {showPreview && (
            <div className="markdown-body" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {draft.content_md.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {draft.content_md}
                </ReactMarkdown>
              ) : (
                <p style={{ color: '#5b6a8f' }}>Deja el contenido vacío para conservar el actual.</p>
              )}
            </div>
          )}
        </div>
      )}

      {msg && (
        <p style={{ color: msgIsError ? ERROR_COLOR : SUCCESS_COLOR, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, marginBottom: 20 }}>
          {msgIsError ? msg : `✓ ${msg}`}
        </p>
      )}

      <div style={{ marginTop: 44 }}>
        <SectionHeader>borradores ({drafts.length})</SectionHeader>
        {drafts.length === 0 && <p style={{ color: '#5b6a8f', fontSize: 13.5 }}>No hay borradores.</p>}
        {drafts.length > 0 && (
          <div style={{ border: '1px solid #1c2438', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
            {drafts.map((p) => (
              <div key={p.id} className="admin-row">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                    color: '#3b82f6',
                    background: 'rgba(59,130,246,.12)',
                    padding: '4px 10px',
                    borderRadius: 5,
                    flexShrink: 0,
                  }}
                >
                  {p.tags[0] ?? 'sin tag'}
                </span>
                <span style={{ fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title} <span style={{ color: '#5b6a8f' }}>/{p.slug}</span>
                </span>
                <button className="admin-action" onClick={() => publish(p.id)} style={{ color: '#8fd0ff' }}>
                  publicar
                </button>
                <button className="admin-action" onClick={() => startEdit(p)}>editar</button>
                <button className="admin-action danger" onClick={() => remove(p.id)}>borrar</button>
              </div>
            ))}
          </div>
        )}

        <SectionHeader>posts publicados ({published.length})</SectionHeader>
        {published.length === 0 && <p style={{ color: '#5b6a8f', fontSize: 13.5 }}>No hay posts publicados.</p>}
        {published.length > 0 && (
          <div style={{ border: '1px solid #1c2438', borderRadius: 10, overflow: 'hidden' }}>
            {published.map((p) => (
              <div key={p.id} className="admin-row">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                    color: '#3b82f6',
                    background: 'rgba(59,130,246,.12)',
                    padding: '4px 10px',
                    borderRadius: 5,
                    flexShrink: 0,
                  }}
                >
                  {p.tags[0] ?? 'sin tag'}
                </span>
                <span style={{ fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#5b6a8f' }}>
                  {p.published_at ? new Date(p.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                </span>
                <button className="admin-action" onClick={() => startEdit(p)}>editar</button>
                <button className="admin-action danger" onClick={() => remove(p.id)}>borrar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
