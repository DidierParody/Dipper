import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublishedPosts, type Post } from '../lib/supabase';
import PostCard from '../components/PostCard';
import SubscribeButton from '../components/SubscribeButton';

export default function Home() {
  const { tag } = useParams();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPosts(null);
    fetchPublishedPosts(tag).then(setPosts).catch((e) => setError(String(e)));
  }, [tag]);

  return (
    <>
      <section style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <h1 style={{ margin: '0 0 12px' }}>
          Notas de un <span style={{ color: 'var(--accent)' }}>Ingeniero de Datos</span>
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
          Pipelines, SQL, cloud y experimentos — directo desde mis notas de Notion.
        </p>
        <SubscribeButton />
      </section>
      <hr className="dashed-divider" />
      {tag && <p style={{ color: 'var(--muted)' }}>Posts con tag <span className="tag">{tag}</span></p>}
      {error && <p style={{ color: 'var(--accent)' }}>Error cargando posts. Recarga la página.</p>}
      {posts === null && !error && <p style={{ color: 'var(--muted)' }}>Cargando...</p>}
      {posts?.length === 0 && <p style={{ color: 'var(--muted)' }}>Todavía no hay posts publicados.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {posts?.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}
