import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublishedPosts, type Post } from '../lib/supabase';
import PostCard from '../components/PostCard';
import SubscribeButton from '../components/SubscribeButton';

export default function Home() {
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
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return posts;
    if (!tag) return posts;
    return posts.filter((p) => p.tags.includes(tag));
  }, [posts, tag]);

  function selectTag(t: string | null) {
    navigate(t ? `/tag/${t}` : '/');
  }

  return (
    <>
      <section style={{ padding: '24px 0 20px' }}>
        <p className="micro-label" style={{ margin: '0 0 12px' }}>// notas de ingeniería de datos</p>
        <h1 style={{ margin: '0 0 14px', fontSize: 44, lineHeight: 1.15 }}>
          Cloud, datos <span style={{ color: 'var(--accent-2)' }}>&</span> sistemas — escritos en producción.
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px', maxWidth: 640 }}>
          Pipelines, SQL, cloud y experimentos — directo desde mis notas de Notion.
        </p>
        <SubscribeButton />
      </section>

      <hr className="divider" />

      {allTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 24px' }}>
          <button
            type="button"
            className={`pill${!tag ? ' active' : ''}`}
            onClick={() => selectTag(null)}
          >
            Todos
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill${tag === t ? ' active' : ''}`}
              onClick={() => selectTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filteredPosts && filteredPosts.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 12px', fontFamily: 'var(--font-mono)' }}>
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post publicado' : 'posts publicados'}
        </p>
      )}
      {error && <p style={{ color: 'var(--error)' }}>Error cargando posts. Recarga la página.</p>}
      {posts === null && !error && <p style={{ color: 'var(--muted)' }}>Cargando...</p>}
      {filteredPosts?.length === 0 && <p style={{ color: 'var(--muted)' }}>Todavía no hay posts publicados.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {filteredPosts?.map((p) => <PostCard key={p.id} post={p} />)}
      </div>

      <hr className="divider" style={{ marginTop: 40 }} />

      <section style={{ padding: '20px 0 40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-2)', margin: '0 0 14px' }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, background: 'var(--accent-2)' }} />
          el autor
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: 640, margin: '0 0 16px' }}>
          Ingeniero de Datos construyendo pipelines, modelos y plataformas cloud. Escribo sobre lo que
          aprendo en producción: SQL, orquestación, arquitectura de datos y las decisiones que no salen
          en la documentación oficial.
        </p>
        <p className="micro-label" style={{ margin: '0 0 8px' }}>Áreas de foco</p>
        <div style={{ marginBottom: 16 }}>
          {['cloud', 'data engineering', 'sql', 'pipelines'].map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
        {/* TODO: agregar LinkedIn/X cuando tengamos las URLs definitivas */}
        <a href="https://github.com/DidierParody" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          GitHub ↗
        </a>
      </section>
    </>
  );
}
