import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPostBySlug, fetchSeriesPosts, type Post as PostType, type PostSource } from '../lib/supabase';
import { contentBaseUrl, fetchPostMarkdown, resolveAssetUrl } from '../lib/content';
import SubscribeButton from '../components/SubscribeButton';

interface SeriesNav {
  title: string;
  index: number;
  total: number;
  prevSlug: string | null;
  nextSlug: string | null;
}

export default function Post() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostType | null | 'loading'>('loading');
  const [content, setContent] = useState<string | null>(null);
  const [contentError, setContentError] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [seriesNav, setSeriesNav] = useState<SeriesNav | null>(null);

  const loadContent = useCallback((source: PostSource) => {
    setContentLoading(true);
    setContentError(false);
    setContent(null);
    fetchPostMarkdown(source)
      .then((md) => setContent(md))
      .catch(() => setContentError(true))
      .finally(() => setContentLoading(false));
  }, []);

  useEffect(() => {
    setPost('loading');
    setContent(null);
    setContentError(false);
    setSeriesNav(null);
    if (!slug) return;

    let cancelled = false;

    fetchPostBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        if (!p) return;

        loadContent(p.source);

        if (p.series) {
          fetchSeriesPosts(p.series.slug)
            .then((res) => {
              if (cancelled || !res) return;
              const idx = res.posts.findIndex((sp) => sp.slug === p.slug);
              if (idx === -1) return;
              setSeriesNav({
                title: res.series.title,
                index: idx + 1,
                total: res.posts.length,
                prevSlug: idx > 0 ? res.posts[idx - 1].slug : null,
                nextSlug: idx < res.posts.length - 1 ? res.posts[idx + 1].slug : null,
              });
            })
            .catch(() => {});
        }
      })
      .catch(() => !cancelled && setPost(null));

    return () => {
      cancelled = true;
    };
  }, [slug, loadContent]);

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
  const minutes = post.reading_minutes;
  const base = contentBaseUrl(post.source);
  const coverUrl = post.cover_path ? resolveAssetUrl(base, post.cover_path) : null;

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
          {post.tags[0].name}
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

      {seriesNav && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            background: '#0e1426',
            border: '1px solid #1c2438',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 12,
            color: '#8b96b2',
          }}
        >
          <Link to={`/series/${post.series?.slug}`} style={{ color: '#3b82f6' }}>
            Parte {seriesNav.index} de {seriesNav.total} · {seriesNav.title}
          </Link>
          <div style={{ display: 'flex', gap: 14 }}>
            {seriesNav.prevSlug && (
              <Link to={`/post/${seriesNav.prevSlug}`} style={{ color: '#5b6a8f' }}>
                ← anterior
              </Link>
            )}
            {seriesNav.nextSlug && (
              <Link to={`/post/${seriesNav.nextSlug}`} style={{ color: '#5b6a8f' }}>
                siguiente →
              </Link>
            )}
          </div>
        </div>
      )}

      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          style={{ width: '100%', maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}
        />
      )}

      <div className="markdown-body">
        {contentLoading && (
          <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace" }}>Cargando...</p>
        )}
        {contentError && (
          <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace" }}>
            No se pudo cargar el contenido.{' '}
            <span
              className="back-link"
              onClick={() => loadContent(post.source)}
              style={{ cursor: 'pointer', color: '#3b82f6' }}
            >
              reintentar
            </span>
          </p>
        )}
        {!contentLoading && !contentError && content !== null && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            urlTransform={(url) => defaultUrlTransform(resolveAssetUrl(base, url))}
            components={{
              img: (props) => (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img {...props} loading="lazy" style={{ maxWidth: '100%' }} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 40, paddingTop: 24, borderTop: '1px solid #1c2438' }}>
        {post.tags.map((t) => (
          <span
            key={t.slug}
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              color: '#3b82f6',
              background: 'rgba(59,130,246,.12)',
              padding: '5px 12px',
              borderRadius: 5,
            }}
          >
            {t.name}
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
