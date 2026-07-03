import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

export default function Header() {
  const { user } = useUser();
  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}
      >
        <Link
          to="/"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text)' }}
        >
          didier<span style={{ color: 'var(--accent)' }}>.log</span>
        </Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          <Link to="/" style={{ color: 'var(--text-2)' }}>posts</Link>
          <SignedIn>
            <Link to="/perfil" style={{ color: 'var(--text-2)' }}>perfil</Link>
          </SignedIn>
          {isAdmin && (
            <Link to="/admin" style={{ color: 'var(--muted)' }}>admin</Link>
          )}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-secondary">Ingresar</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
