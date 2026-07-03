import { Link } from 'react-router-dom';
import type { Post } from '../lib/supabase';

export default function PostCard({ post }: { post: Post }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  return (
    <article className="pixel-card">
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 6px' }}>{date}</p>
      <h2 style={{ margin: '0 0 10px' }}>
        <Link to={`/post/${post.slug}`} style={{ color: 'var(--text)' }}>{post.title}</Link>
      </h2>
      {post.description && (
        <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>{post.description}</p>
      )}
      <div>
        {post.tags.map((t) => (
          <Link key={t} to={`/tag/${t}`} className="tag">{t}</Link>
        ))}
      </div>
    </article>
  );
}
