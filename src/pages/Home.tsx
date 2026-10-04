import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublishedPosts, type Post } from '../lib/supabase';

interface HomeProps {
  search: string;
}

export default function Home({ search }: HomeProps) {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPosts(null);
    fetchPublishedPosts().then(setPosts).catch((e) => setError(String(e)));
  }, []);

  const allTags = useMemo(() => {
    if (!posts) return [];
    const map = new Map<string, string>();
    posts.forEach((p) => p.tags.forEach((t) => map.set(t.slug, t.name)));
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return posts;
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => !tag || p.tags.some((t) => t.slug === tag))
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.name.toLowerCase().includes(q)) ||
          (p.summary ?? '').toLowerCase().includes(q)
      );
  }, [posts, tag, search]);

  function selectTag(slug: string | null) {
    navigate(slug ? `/tag/${slug}` : '/');
  }

  const noResults = posts !== null && filteredPosts !== null && filteredPosts.length === 0 && (search.trim() || tag);

  return (
    <div className="page" style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 32px 100px' }}>
      <div style={{ marginBottom: 44, animation: 'fadeUp .5s ease both' }}>
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
          // notas de ingeniería de datos
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, margin: '0 0 14px', letterSpacing: '-1px' }}>
          Cloud, datos <span style={{ color: '#f0954c' }}>&</span> sistemas
          <br />
          escritos en producción.
        </h1>
        <p style={{ color: '#8b96b2', fontSize: 16, maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
          Apuntes técnicos sobre data engineering, arquitectura cloud, IA/ML y seguridad — directo desde lo
          que construyo día a día.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
        <div className={`tag-pill${!tag ? ' active' : ''}`} onClick={() => selectTag(null)}>
          Todos
        </div>
        {allTags.map((t) => (
          <div key={t.slug} className={`tag-pill${tag === t.slug ? ' active' : ''}`} onClick={() => selectTag(t.slug)}>
            {t.name}
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'var(--error)' }}>Error cargando posts. Recarga la página.</p>}
      {posts === null && !error && (
        <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace" }}>Cargando...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))', gap: 20 }}>
        {filteredPosts?.map((post) => {
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
          const minutes = post.reading_minutes;
          return (
            <div key={post.id} className="post-card" onClick={() => navigate(`/post/${post.slug}`)}>
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
                  {post.tags[0]?.name ?? ''}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5b6a8f' }}>
                  {date}
                </span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>{post.title}</h3>
              <p style={{ color: '#8b96b2', fontSize: 13.5, lineHeight: 1.6, margin: 0, flex: 1 }}>
                {post.summary}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 10,
                  borderTop: '1px solid #1c2438',
                }}
              >
                <img
                  src="https://github.com/DidierParody.png"
                  alt=""
                  style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#5b6a8f' }}>
                  Didier Parody · {minutes} min de lectura
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPosts?.length === 0 && !error && posts !== null && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#5b6a8f',
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 14,
          }}
        >
          {noResults ? `No hay posts que coincidan con "${search}"` : 'Todavía no hay posts publicados.'}
        </div>
      )}
    </div>
  );
}
