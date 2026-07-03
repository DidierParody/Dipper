import { SignedIn, SignedOut, SignInButton, useClerk, useUser } from '@clerk/clerk-react';
import SubscribeButton from '../components/SubscribeButton';

export default function Profile() {
  return (
    <div>
      <SignedOut>
        <div
          style={{
            maxWidth: 420,
            margin: '40px auto',
            textAlign: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            padding: 32,
          }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Bienvenido de vuelta</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
            Ingresa para suscribirte al newsletter y recibir cada post nuevo.
          </p>
          <SignInButton mode="modal">
            <button
              className="btn"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
            >
              Ingresar
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <ProfileCard />
      </SignedIn>
    </div>
  );
}

function ProfileCard() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  if (!user) return null;

  const providers = user.externalAccounts.map((a) => a.provider);

  return (
    <div className="card" style={{ maxWidth: 480, margin: '24px auto', textAlign: 'center' }}>
      <img
        src={user.imageUrl}
        alt=""
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: '2px solid var(--accent)',
          objectFit: 'cover',
          margin: '0 auto 16px',
          display: 'block',
        }}
      />
      <h1 style={{ margin: '0 0 4px' }}>{user.fullName || 'Sin nombre'}</h1>
      {user.username && (
        <p style={{ color: 'var(--muted)', margin: '0 0 4px' }}>@{user.username}</p>
      )}
      {user.primaryEmailAddress && (
        <p style={{ color: 'var(--muted)', margin: '0 0 12px' }}>
          {user.primaryEmailAddress.emailAddress}
        </p>
      )}
      {providers.length > 0 && (
        <div style={{ margin: '0 0 16px' }}>
          {providers.map((p) => (
            <span key={p} className="tag">{p}</span>
          ))}
        </div>
      )}
      <hr className="divider" />
      <div style={{ margin: '16px 0' }}>
        <SubscribeButton />
      </div>
      <button className="btn btn-secondary" onClick={() => openUserProfile()}>
        gestionar cuenta
      </button>
    </div>
  );
}
