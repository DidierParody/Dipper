import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useUser } from '@clerk/clerk-react';

type OAuthStrategy = 'oauth_github' | 'oauth_google';

export default function Login() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoaded && isSignedIn) navigate('/');
  }, [userLoaded, isSignedIn, navigate]);

  function loginWith(strategy: OAuthStrategy) {
    if (!isLoaded) return;
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  }

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
          maxWidth: 380,
          background: '#0e1426',
          border: '1px solid #1c2438',
          borderRadius: 16,
          padding: '40px 36px',
          textAlign: 'center',
          animation: 'fadeUp .4s ease both',
        }}
      >
        <img
          src="https://github.com/DidierParody.png"
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
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Bienvenido de vuelta</h2>
        <p style={{ color: '#8b96b2', fontSize: 13.5, margin: '0 0 30px' }}>
          Ingresa para comentar, guardar posts y (si eres el autor) publicar.
        </p>

        <div
          className="oauth-btn"
          onClick={() => loginWith('oauth_github')}
          style={{ marginBottom: 12 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-2.1c-3.16.69-3.83-1.36-3.83-1.36-.52-1.32-1.26-1.67-1.26-1.67-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.65 1.24 3.3.95.1-.73.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.8 1.17 1.8 1.17 3.04 0 4.35-2.66 5.31-5.19 5.59.41.35.77 1.04.77 2.11v3.13c0 .3.21.66.79.55A11.03 11.03 0 0 0 23.02 11.5C23.02 5.24 18.27.5 12 .5z" />
          </svg>
          Continuar con GitHub
        </div>
        <div className="oauth-btn" onClick={() => loginWith('oauth_google')}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.5-6.5C35.3 2.5 30 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.6 5.9C12.1 13 17.6 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.6 7.2l7.3 5.7c4.3-4 6.8-9.9 6.8-17.4z"
            />
            <path
              fill="#FBBC05"
              d="M10.2 28.1a14.5 14.5 0 0 1 0-8.2l-7.6-5.9a24 24 0 0 0 0 20l7.6-5.9z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.2-8.6 2.2-6.4 0-11.9-3.5-14-8.6l-7.6 5.9C6.5 42.6 14.6 48 24 48z"
            />
          </svg>
          Continuar con Google
        </div>

        <div
          className="back-to-blog"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', marginTop: 20, color: '#5b6a8f', fontSize: 12.5 }}
        >
          volver al blog
        </div>
      </div>
    </div>
  );
}
