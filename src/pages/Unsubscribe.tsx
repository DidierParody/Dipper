import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { subscriptionApi } from '../lib/api';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');

  useEffect(() => {
    const token = params.get('token');
    if (!token) return setState('error');
    subscriptionApi.unsubscribeByToken(token)
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [params]);

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      {state === 'working' && <p style={{ color: 'var(--muted)' }}>Procesando...</p>}
      {state === 'done' && (
        <>
          <h1>Listo</h1>
          <p style={{ color: 'var(--muted)' }}>Ya no recibirás correos de Dipper.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1>Link inválido</h1>
          <p style={{ color: 'var(--muted)' }}>El link de desuscripción no es válido o ya expiró.</p>
        </>
      )}
      <Link to="/" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: 12 }}>
        Volver al blog
      </Link>
    </div>
  );
}
