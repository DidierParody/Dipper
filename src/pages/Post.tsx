import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPostBySlug, type Post as PostType } from '../lib/supabase';
import SubscribeButton from '../components/SubscribeButton';
import { readingTime } from '../lib/reading-time';

export default function Post() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostType | null | 'loading'>('loading');

  useEffect(() => {
    setPost('loading');
    if (slug) fetchPostBySlug(slug).then((p) => setPost(p)).catch(() => setPost(null));
  }, [slug]);

  if (post === 'loading') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px' }}>
        <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace" }}>Cargando...</p>
      </div>
    );
  }
  if (!post) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36 }}>404</h1>
        <p style={{ color: '#8b96b2', fontFamily: "'IBM Plex Mono',monospace" }}>Este post no existe.</p>
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

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const minutes = readingTime(post.content_md);

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

      {post.tags[0] && (
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
          {post.tags[0]}
        </span>
      )}
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.2,
          margin: '18px 0 16px',
          letterSpacing: '-0.5px',
          borderLeft: '3px solid #f0954c',
          paddingLeft: 16,
        }}
      >
        {post.title}
      </h1>

      <div
        className="back-link"
        onClick={() => navigate('/creador')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 36,
          paddingBottom: 24,
          borderBottom: '1px solid #1c2438',
        }}
      >
        <img
          src="https://github.com/DidierParody.png"
          alt=""
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #232d47' }}
        />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Didier Parody</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#5b6a8f' }}>
            {date}
            {date && ' · '}
            {minutes} min de lectura
          </div>
        </div>
      </div>

      {post.cover_url && (
        <img
          src={post.cover_url}
          alt=""
          style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}
        />
      )}

      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content_md}
        </ReactMarkdown>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 40, paddingTop: 24, borderTop: '1px solid #1c2438' }}>
        {post.tags.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              color: '#3b82f6',
              background: 'rgba(59,130,246,.12)',
              padding: '5px 12px',
              borderRadius: 5,
            }}
          >
            {t}
          </span>
        ))}
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            color: '#5b6a8f',
            background: '#111830',
            padding: '5px 12px',
            borderRadius: 5,
          }}
        >
          markdown
        </span>
      </div>

      <div
        style={{
          marginTop: 40,
          textAlign: 'center',
          background: '#0e1426',
          border: '1px solid #1c2438',
          borderRadius: 12,
          padding: 28,
        }}
      >
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, margin: '0 0 14px' }}>
          ¿Te sirvió? Recibe el próximo post en tu correo
        </p>
        <SubscribeButton />
      </div>
    </div>
  );
}
