import { Link } from 'react-router-dom';
import type { Post } from '../lib/supabase';
import { readingTime } from '../lib/reading-time';

export default function PostCard({ post }: { post: Post }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const minutes = readingTime(post.content_md);
  return (
    <Link
      to={`/post/${post.slug}`}
      className="pixel-card"
      style={{ display: 'block', color: 'var(--text)' }}
    >
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 6px' }}>
        {date}
        {date && ' · '}
        {minutes} min de lectura
      </p>
      <h2 style={{ margin: '0 0 10px', color: 'var(--text)' }}>{post.title}</h2>
      {post.description && (
        <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>{post.description}</p>
      )}
      <div>
        {post.tags.map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
    </Link>
  );
}
