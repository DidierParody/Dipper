import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useClerk, useUser } from '@clerk/clerk-react';
import SubscribeButton from '../components/SubscribeButton';

export default function Profile() {
  return (
    <div>
      <SignedOut>
        <RedirectToLogin />
      </SignedOut>
      <SignedIn>
        <ProfileCard />
      </SignedIn>
    </div>
  );
}

function RedirectToLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  return null;
}

function ProfileCard() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const navigate = useNavigate();

  if (!user) return null;

  const providers = user.externalAccounts.map((a) => a.provider);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#0e1426',
          border: '1px solid #1c2438',
          borderRadius: 16,
          padding: '40px 36px',
          textAlign: 'center',
          animation: 'fadeUp .4s ease both',
        }}
      >
        <img
          src={user.imageUrl}
          alt=""
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: 18,
            border: '2px solid #232d47',
          }}
        />
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{user.fullName || 'Sin nombre'}</h2>
        {user.primaryEmailAddress && (
          <p style={{ color: '#8b96b2', fontSize: 13.5, margin: '0 0 16px' }}>
            {user.primaryEmailAddress.emailAddress}
          </p>
        )}

        {providers.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {providers.map((p) => (
              <span
                key={p}
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 12,
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #232d47',
                  background: '#111830',
                  color: '#c7cfe2',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <SubscribeButton />
        </div>

        <div
          className="oauth-btn"
          onClick={() => openUserProfile()}
          style={{ marginBottom: 12 }}
        >
          Gestionar cuenta
        </div>

        <div
          className="back-to-blog"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', marginTop: 8, color: '#5b6a8f', fontSize: 12.5 }}
        >
          volver al blog
        </div>
      </div>
    </div>
  );
}
