import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { adminApi, type AdminPost } from '../lib/api';

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

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return 'hace instantes';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour} h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `hace ${diffDay} d`;
  return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Admin() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [link, setLink] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgIsError, setMsgIsError] = useState(false);
  const [denied, setDenied] = useState(false);
  const [subscribers, setSubscribers] = useState<number | null>(null);

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

  useEffect(() => {
    if (isLoaded && isAdmin) {
      refresh();
      refreshStats();
    }
  }, [isLoaded, isAdmin, refresh, refreshStats]);

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

  async function doSync() {
    if (!link.trim()) return;
    setSyncing(true);
    setStatus('Sincronizando...');
    try {
      const token = await getToken();
      const r = await adminApi.sync(token!, link.trim());
      setStatus(r.created ? `Creado: ${r.title} (/${r.slug})` : `Actualizado: ${r.title} (/${r.slug})`);
      setLink('');
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setSyncing(false);
    }
  }

  async function doResync(id: string) {
    setBusyId(id);
    setStatus('Re-sincronizando...');
    try {
      const token = await getToken();
      const r = await adminApi.resync(token!, id);
      setStatus(`Actualizado: ${r.title} (/${r.slug})`);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setBusyId(null);
    }
  }

  async function doPublish(id: string) {
    const n = subscribers ?? 0;
    if (!confirm(`Esto enviará un email a ${n} suscriptor${n === 1 ? '' : 'es'}. ¿Publicar de todas formas?`)) return;
    setBusyId(id);
    setStatus('Publicando y enviando newsletter...');
    try {
      const token = await getToken();
      const r = await adminApi.publish(token!, id);
      setStatus(`Publicado. Newsletter: ${r.newsletter.sent} enviados, ${r.newsletter.failed} fallos.`);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setBusyId(null);
    }
  }

  async function doSendNewsletter(id: string) {
    const n = subscribers ?? 0;
    if (!confirm(`Se reenviará el correo a los suscriptores pendientes o fallidos (de ${n} totales). ¿Continuar?`)) return;
    setBusyId(id);
    setStatus('Reenviando newsletter...');
    try {
      const token = await getToken();
      const r = await adminApi.sendNewsletter(token!, id);
      setStatus(`Newsletter: ${r.newsletter.sent} enviados, ${r.newsletter.failed} fallos, ${r.newsletter.skipped} ya enviados.`);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setBusyId(null);
    }
  }

  async function doRemove(id: string) {
    if (!confirm('¿Eliminar este post del panel? Esto no borra el contenido del repo.')) return;
    setBusyId(id);
    try {
      const token = await getToken();
      await adminApi.remove(token!, id);
      refresh();
    } catch (e) {
      setStatus(`Error: ${e}`, true);
    } finally {
      setBusyId(null);
    }
  }

  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => p.status === 'published');

  function PostRow({ p }: { p: AdminPost }) {
    const firstTag = p.tags[0]?.name ?? 'sin tag';
    const seriesLabel = p.series ? `Parte ${p.series_order} · ${p.series.title}` : null;
    const shortSha = p.source ? p.source.commit_sha.slice(0, 7) : null;
    const newsletterLabel = p.newsletter
      ? `enviado ${p.newsletter.sent}${p.newsletter.failed ? ` / fallidos ${p.newsletter.failed}` : ''}`
      : 'sin enviar';
    const githubUrl = p.source
      ? `https://github.com/${p.source.repo}/tree/${p.source.commit_sha}/${p.source.path}`
      : null;
    const busy = busyId === p.id;

    return (
      <div className="admin-row" style={{ flexWrap: 'wrap' }}>
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
          {firstTag}
        </span>
        <span style={{ fontSize: 14, flex: 1, minWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.title} <span style={{ color: '#5b6a8f' }}>/{p.slug}</span>
          {seriesLabel && (
            <span style={{ color: '#5b6a8f', marginLeft: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>
              {seriesLabel}
            </span>
          )}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f' }}>
          {shortSha ? `${shortSha} · ${formatRelative(p.source!.synced_at)}` : 'sin fuente'}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f' }}>
          {newsletterLabel}
        </span>
        {p.status === 'published' && (
          <a href={`/post/${p.slug}`} className="admin-action" style={{ color: '#8fd0ff' }}>
            ver
          </a>
        )}
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noreferrer" className="admin-action">
            código
          </a>
        )}
        <button className="admin-action" onClick={() => doResync(p.id)} disabled={busy}>
          {busy ? '...' : 're-sincronizar'}
        </button>
        {p.status === 'draft' && (
          <button className="admin-action" onClick={() => doPublish(p.id)} disabled={busy} style={{ color: '#8fd0ff' }}>
            publicar + email
          </button>
        )}
        {p.status === 'published' && (
          <button className="admin-action" onClick={() => doSendNewsletter(p.id)} disabled={busy} style={{ color: '#8fd0ff' }}>
            reenviar newsletter
          </button>
        )}
        <button className="admin-action danger" onClick={() => doRemove(p.id)} disabled={busy}>
          eliminar
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 120px' }}>
      {/* 1. header */}
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
          {subscribers === null ? 'Cargando suscriptores…' : `${subscribers} suscriptor${subscribers === 1 ? '' : 'es'}`}
        </span>
      </div>

      {/* 2. link + sincronizar */}
      <div
        style={{
          border: '2px dashed #232d47',
          background: '#0e1426',
          borderRadius: 14,
          padding: '36px 24px',
          textAlign: 'center',
          marginBottom: 28,
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
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Pega el link del post</div>
        <div style={{ color: '#5b6a8f', fontSize: 13, marginBottom: 18 }}>
          link al <code>index.md</code> o a la carpeta del post en GitHub
        </div>
        <div style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
          <input
            value={link}
            placeholder="https://github.com/DidierParody/Dipper/tree/main/content/posts/mi-post"
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSync()}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={doSync}
            disabled={!link.trim() || syncing}
          >
            {syncing ? 'sincronizando…' : 'sincronizar'}
          </button>
        </div>
      </div>

      {msg && (
        <p style={{ color: msgIsError ? ERROR_COLOR : SUCCESS_COLOR, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, marginBottom: 20 }}>
          {msgIsError ? msg : `✓ ${msg}`}
        </p>
      )}

      {/* borradores */}
      <div style={{ marginTop: 44 }}>
        <SectionHeader>borradores ({drafts.length})</SectionHeader>
        {drafts.length === 0 && <p style={{ color: '#5b6a8f', fontSize: 13.5 }}>No hay borradores.</p>}
        {drafts.length > 0 && (
          <div style={{ border: '1px solid #1c2438', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
            {drafts.map((p) => (
              <PostRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* posts publicados */}
      <div>
        <SectionHeader>posts publicados ({published.length})</SectionHeader>
        {published.length === 0 && <p style={{ color: '#5b6a8f', fontSize: 13.5 }}>No hay posts publicados.</p>}
        {published.length > 0 && (
          <div style={{ border: '1px solid #1c2438', borderRadius: 10, overflow: 'hidden' }}>
            {published.map((p) => (
              <PostRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
