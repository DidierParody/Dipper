import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPostBySlug, type Post as PostType } from '../lib/supabase';
import SubscribeButton from '../components/SubscribeButton';

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
        <Link to="/" className="pixel-btn ghost" style={{ display: 'inline-block', marginTop: 12 }}>
          &lt; VOLVER
        </Link>
      </div>
    );
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <article>
      <div style={{ marginBottom: 8 }}>
        {post.tags.map((t) => <Link key={t} to={`/tag/${t}`} className="tag">{t}</Link>)}
      </div>
      <h1 style={{ margin: '10px 0 6px' }}>{post.title}</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>{date}</p>
      {post.cover_url && (
        <img src={post.cover_url} alt="" style={{ width: '100%', border: '2px solid var(--text)', marginBottom: 16 }} />
      )}
      <hr className="dashed-divider" />
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content_md}
        </ReactMarkdown>
      </div>
      <div
        className="pixel-card"
        style={{ marginTop: 32, textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--accent)' }}
      >
        <p className="px" style={{ fontSize: 11, margin: '0 0 12px' }}>
          ¿Te sirvió? Recibe el próximo en tu correo
        </p>
        <SubscribeButton />
      </div>
    </article>
  );
}
