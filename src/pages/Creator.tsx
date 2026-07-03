import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedPosts, type Post } from '../lib/supabase';

const TAG_LIST_FALLBACK = [
  'Cloud Engineering',
  'Data Engineering',
  'AI/ML Engineering',
  'Data Warehousing',
  'Ciberseguridad',
  'Backend',
];

export default function Creator() {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const tags = useMemo(() => {
    if (!posts || posts.length === 0) return TAG_LIST_FALLBACK;
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const postsCount = posts?.length ?? 0;
  const tagsCount = tags.length;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '64px 32px 120px' }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
        <img
          src="https://github.com/DidierParody.png"
          alt=""
          style={{
            width: 112,
            height: 112,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #232d47',
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              color: '#f0954c',
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            el autor
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Didier Parody
          </h1>
          <p style={{ color: '#8b96b2', fontSize: 14.5, margin: 0 }}>
            Cloud &amp; Data Engineer · construyendo pipelines, plataformas y notas técnicas
          </p>
        </div>
      </div>

      <p style={{ fontSize: 15.5, lineHeight: 1.8, color: '#c7cfe2', maxWidth: 640, margin: '0 0 32px' }}>
        Llevo años trabajando en ingeniería de datos y arquitectura cloud — desde pipelines de ingestión
        hasta plataformas de ML en producción. Este blog es mi cuaderno público: lo que aprendo, lo que
        rompo y lo que finalmente funciona.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, maxWidth: 460, marginBottom: 36 }}>
        <div style={{ background: '#0e1426', border: '1px solid #1c2438', borderRadius: 10, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{postsCount}</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f', marginTop: 4 }}>
            posts
          </div>
        </div>
        <div style={{ background: '#0e1426', border: '1px solid #1c2438', borderRadius: 10, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{tagsCount}</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f', marginTop: 4 }}>
            etiquetas
          </div>
        </div>
        <div style={{ background: '#0e1426', border: '1px solid #1c2438', borderRadius: 10, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>8+</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f', marginTop: 4 }}>
            años exp.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 12,
            color: '#5b6a8f',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          <span style={{ width: 7, height: 7, background: '#f0954c', display: 'inline-block' }} />
          Áreas de foco
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tags.map((t) => (
            <div
              key={t}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 12,
                padding: '7px 14px',
                borderRadius: 6,
                border: '1px solid #232d47',
                background: '#111830',
                color: '#c7cfe2',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a
          className="social-chip"
          href="https://github.com/DidierParody"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
        {/* TODO: URL real */}
        <a className="social-chip" href="#">
          LinkedIn ↗
        </a>
        {/* TODO: URL real */}
        <a className="social-chip" href="#">
          X / Twitter ↗
        </a>
      </div>
    </div>
  );
}
