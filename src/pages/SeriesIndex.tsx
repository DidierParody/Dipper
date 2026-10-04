import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSeriesList, type SeriesSummary } from '../lib/supabase';

const mono = "'IBM Plex Mono',monospace";

export default function SeriesIndex() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<SeriesSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSeriesList().then(setSeries).catch(() => setError(true));
  }, []);

  return (
    <div className="page" style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 32px 100px' }}>
      <div style={{ marginBottom: 44, animation: 'fadeUp .5s ease both' }}>
        <div
          style={{
            fontFamily: mono,
            color: '#f0954c',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          // series
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, margin: '0 0 14px', letterSpacing: '-1px' }}>
          Series de posts
        </h1>
        <p style={{ color: '#8b96b2', fontSize: 16, maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
          Temas que se explican por partes y se leen en orden.
        </p>
      </div>

      {error && <p style={{ color: 'var(--error)' }}>Error cargando las series. Recarga la página.</p>}
      {series === null && !error && <p style={{ color: '#5b6a8f', fontFamily: mono }}>Cargando...</p>}
      {series?.length === 0 && (
        <p style={{ color: '#5b6a8f', fontFamily: mono, textAlign: 'center', padding: '60px 0' }}>
          Todavía no hay series publicadas.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px,100%),1fr))', gap: 20 }}>
        {series?.map((s) => {
          const date = s.last_published_at
            ? new Date(s.last_published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
          return (
            <div key={s.slug} className="post-card" onClick={() => navigate(`/series/${s.slug}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: '#3b82f6',
                    background: 'rgba(59,130,246,.12)',
                    padding: '4px 10px',
                    borderRadius: 5,
                  }}
                >
                  {s.posts.length} {s.posts.length === 1 ? 'parte' : 'partes'}
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#5b6a8f' }}>{date}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>{s.title}</h3>
              {s.description && (
                <p style={{ color: '#8b96b2', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{s.description}</p>
              )}
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {s.posts.map((p, i) => (
                  <li key={p.slug}>
                    <span
                      className="back-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${p.slug}`);
                      }}
                      style={{ cursor: 'pointer', display: 'flex', gap: 10, fontSize: 14, color: '#c7cfe2' }}
                    >
                      <span style={{ fontFamily: mono, fontSize: 12, color: '#f0954c', minWidth: 18 }}>
                        {String(p.series_order ?? i + 1).padStart(2, '0')}
                      </span>
                      {p.title}
                    </span>
                  </li>
                ))}
              </ol>
              <div style={{ paddingTop: 10, borderTop: '1px solid #1c2438', fontFamily: mono, fontSize: 11.5, color: '#5b6a8f' }}>
                {s.total_minutes} min de lectura en total
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
