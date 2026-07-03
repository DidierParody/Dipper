import { useEffect, useState } from 'react';
import { useAuth, SignInButton, useUser } from '@clerk/clerk-react';
import { subscriptionApi } from '../lib/api';

export default function SubscribeButton() {
  const { isSignedIn, getToken } = useAuth();
  const { isLoaded } = useUser();
  const [state, setState] = useState<'unknown' | 'subscribed' | 'unsubscribed' | 'busy'>('unknown');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const { subscribed } = await subscriptionApi.status(token!);
        setState(subscribed ? 'subscribed' : 'unsubscribed');
      } catch {
        setState('unsubscribed');
      }
    })();
  }, [isSignedIn, getToken]);

  async function toggle() {
    const prev = state;
    setState('busy');
    setError('');
    try {
      const token = await getToken();
      if (prev === 'subscribed') {
        await subscriptionApi.unsubscribe(token!);
        setState('unsubscribed');
      } else {
        await subscriptionApi.subscribe(token!);
        setState('subscribed');
      }
    } catch (e) {
      setError('No se pudo actualizar. Intenta de nuevo.');
      setState(prev);
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div>
        <SignInButton mode="modal">
          <button className="pixel-btn">Suscribirme</button>
        </SignInButton>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginTop: 8 }}>
          Inicia sesión con GitHub o Google. Sin spam.
        </p>
      </div>
    );
  }

  return (
    <div>
      {state === 'subscribed' ? (
        <button className="pixel-btn ghost" onClick={toggle} disabled={(state as string) === 'busy'}>
          Suscrito ✓ (clic para salir)
        </button>
      ) : (
        <button className="pixel-btn" onClick={toggle} disabled={state === 'busy' || state === 'unknown'}>
          {state === 'busy' ? '...' : 'Suscribirme'}
        </button>
      )}
      {error && <p style={{ color: 'var(--accent)', fontSize: 16, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
