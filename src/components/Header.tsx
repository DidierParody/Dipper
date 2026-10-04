import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, useClerk, useUser } from '@clerk/clerk-react';

interface HeaderProps {
  search: string;
  onSearch: (value: string) => void;
}

export default function Header({ search, onSearch }: HeaderProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  const isHome = location.pathname === '/' || location.pathname.startsWith('/tag/');
  const isCreator = location.pathname === '/creador';
  const isSeries = location.pathname.startsWith('/series');

  // Se oculta al bajar y reaparece al subir, para no tapar contenido al leer.
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const height = headerRef.current?.offsetHeight ?? 72;
      if (y <= height) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(y - lastY) > 6) {
        // Mientras se escribe en el buscador no se oculta.
        setHidden(y > lastY && document.activeElement !== searchRef.current);
        lastY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Al cambiar de página el encabezado vuelve a verse.
  useEffect(() => setHidden(false), [location.pathname]);

  function handleSearchChange(value: string) {
    onSearch(value);
    if (location.pathname !== '/') navigate('/');
  }

  return (
    <div
      ref={headerRef}
      className="site-header"
      style={{
        position: 'sticky',
        top: 0,
        transform: hidden ? 'translateY(-100%)' : 'none',
        transition: 'transform .25s ease',
        willChange: 'transform',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '14px 32px',
        background: 'rgba(10,14,24,.88)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1c2438',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate('/')}
      >
        <div style={{ width: 26, height: 26, background: '#3b82f6', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 5, background: '#0a0e18' }} />
          <div style={{ position: 'absolute', right: 4, bottom: 4, width: 6, height: 6, background: '#f0954c' }} />
        </div>
        <span className="nav-brand-text" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>
          didier<span style={{ color: '#3b82f6' }}>.log</span>
        </span>
      </div>

      <div
        className="nav-search"
        style={{
          flex: 1,
          maxWidth: 460,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#111830',
          borderRadius: 8,
          padding: '9px 14px',
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: '#5b6a8f', fontSize: 13 }}>/</span>
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar posts, tags, tecnologías..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#e9ecf4',
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 13,
            width: '100%',
            padding: 0,
            borderRadius: 0,
          }}
        />
      </div>

      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto', flexShrink: 0 }}>
        <span
          className="nav-link"
          onClick={() => navigate('/')}
          style={{ color: isHome ? '#e9ecf4' : '#8b96b2' }}
        >
          Posts
        </span>
        <span
          className="nav-link"
          onClick={() => navigate('/series')}
          style={{ color: isSeries ? '#e9ecf4' : '#8b96b2' }}
        >
          Series
        </span>
        <span
          className="nav-link"
          onClick={() => navigate('/creador')}
          style={{ color: isCreator ? '#e9ecf4' : '#8b96b2' }}
        >
          Creador
        </span>

        <SignedIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="nav-pill"
              onClick={() => navigate(isAdmin ? '/admin' : '/perfil')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#111830',
                border: '1px solid #232d47',
                padding: '6px 12px 6px 6px',
                borderRadius: 20,
              }}
            >
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
                {isAdmin ? 'Admin' : 'Perfil'}
              </span>
            </div>
            <span
              className="nav-logout"
              onClick={() => signOut(() => navigate('/'))}
              style={{ cursor: 'pointer', fontSize: 13, color: '#5b6a8f' }}
            >
              Salir
            </span>
          </div>
        </SignedIn>
        <SignedOut>
          <div
            className="nav-ingresar"
            onClick={() => navigate('/login')}
            style={{
              cursor: 'pointer',
              background: '#3b82f6',
              color: '#06101f',
              fontWeight: 600,
              fontSize: 13,
              padding: '9px 18px',
              borderRadius: 8,
            }}
          >
            Ingresar
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
