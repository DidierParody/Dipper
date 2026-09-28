import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSeriesPosts, type Post, type SeriesInfo } from '../lib/supabase';

export default function Series() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ series: SeriesInfo; posts: Post[] } | null | 'loading'>('loading');

  useEffect(() => {
    setData('loading');
    if (!slug) return;
    fetchSeriesPosts(slug)
      .then((res) => setData(res))
      .catch(() => setData(null));
  }, [slug]);

  if (data === 'loading') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px' }}>
        <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace" }}>Cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36 }}>404</h1>
        <p style={{ color: '#8b96b2', fontFamily: "'IBM Plex Mono',monospace" }}>Esta serie no existe.</p>
        <span
          className="back-link"
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#5b6a8f',
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 13,
            marginTop: 12,
          }}
        >
          ← volver a posts
        </span>
      </div>
    );
  }

  const { series, posts } = data;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px' }}>
      <div
        className="back-link"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#5b6a8f',
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 13,
          marginBottom: 28,
        }}
      >
        ← volver a posts
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          color: '#f0954c',
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        // serie
      </div>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.2,
          margin: '0 0 16px',
          letterSpacing: '-0.5px',
        }}
      >
        {series.title}
      </h1>
      {series.description && (
        <p style={{ color: '#8b96b2', fontSize: 15, lineHeight: 1.7, maxWidth: 640, margin: '0 0 32px' }}>
          {series.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {posts.map((post, i) => {
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
          return (
            <div
              key={post.id}
              className="post-card"
              onClick={() => navigate(`/post/${post.slug}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                    color: '#3b82f6',
                    background: 'rgba(59,130,246,.12)',
                    padding: '4px 10px',
                    borderRadius: 5,
                  }}
                >
                  Parte {i + 1}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f' }}>
                  {date}
                </span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>{post.title}</h3>
              {post.summary && (
                <p style={{ color: '#8b96b2', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{post.summary}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
