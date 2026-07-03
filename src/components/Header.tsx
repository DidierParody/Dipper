import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

export default function Header() {
  const { user } = useUser();
  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  return (
    <header style={{ borderBottom: '2px dashed var(--muted)' }}>
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}
      >
        <Link to="/" className="px" style={{ color: 'var(--text)', fontSize: 14 }}>
          DIPPER<span style={{ color: 'var(--accent)' }}>.DEV</span>
        </Link>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text)', fontWeight: 500 }}>Posts</Link>
          <SignedIn>
            <Link to="/perfil" style={{ color: 'var(--text)', fontWeight: 500 }}>Perfil</Link>
          </SignedIn>
          {isAdmin && (
            <Link to="/admin" style={{ color: 'var(--muted)' }}>admin</Link>
          )}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="pixel-btn">Login</button>
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
