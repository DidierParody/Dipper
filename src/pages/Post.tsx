import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPostBySlug, type Post as PostType } from '../lib/supabase';
import SubscribeButton from '../components/SubscribeButton';
import { readingTime } from '../lib/reading-time';

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState<PostType | null | 'loading'>('loading');

  useEffect(() => {
    setPost('loading');
    if (slug) fetchPostBySlug(slug).then((p) => setPost(p)).catch(() => setPost(null));
  }, [slug]);

  if (post === 'loading') return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;
  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1>404</h1>
        <p style={{ color: 'var(--muted)' }}>Este post no existe.</p>
        <Link to="/" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: 12 }}>
          ← Volver
        </Link>
      </div>
    );
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const minutes = readingTime(post.content_md);

  return (
    <article>
      <Link to="/" style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>← volver al blog</Link>
      <div style={{ marginBottom: 8, marginTop: 14 }}>
        {post.tags.map((t) => <Link key={t} to={`/tag/${t}`} className="tag">{t}</Link>)}
      </div>
      <h1 style={{ margin: '10px 0 6px', fontSize: 36 }}>{post.title}</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 16px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        {date}
        {date && ' · '}
        {minutes} min de lectura
      </p>
      {post.cover_url && (
        <img src={post.cover_url} alt="" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }} />
      )}
      <hr className="divider" />
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content_md}
        </ReactMarkdown>
      </div>
      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          background: 'var(--surface-2)',
          border: '2px solid var(--border-strong)',
          borderRadius: 10,
          padding: 24,
        }}
      >
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, margin: '0 0 12px' }}>
          Bienvenido de vuelta. ¿Te sirvió? Recibe el próximo en tu correo
        </p>
        <SubscribeButton />
      </div>
    </article>
  );
}
