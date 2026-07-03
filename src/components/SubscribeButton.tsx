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
          <button className="btn btn-primary">Suscribirme</button>
        </SignInButton>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          Inicia sesión con GitHub o Google. Sin spam.
        </p>
      </div>
    );
  }

  return (
    <div>
      {state === 'subscribed' ? (
        <button className="btn btn-secondary" onClick={toggle} disabled={(state as string) === 'busy'}>
          Suscrito ✓ (clic para salir)
        </button>
      ) : (
        <button className="btn btn-primary" onClick={toggle} disabled={state === 'busy' || state === 'unknown'}>
          {state === 'busy' ? '...' : 'Suscribirme'}
        </button>
      )}
      {error && <p style={{ color: 'var(--error)', fontSize: 14, marginTop: 8, fontFamily: 'var(--font-mono)' }}>{error}</p>}
    </div>
  );
}
