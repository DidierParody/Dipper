import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionApi } from '../lib/api';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');

  useEffect(() => {
    const token = params.get('token');
    if (!token) return setState('error');
    subscriptionApi.unsubscribeByToken(token)
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [params]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
      {state === 'working' && (
        <p style={{ color: '#5b6a8f', fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>
          Procesando...
        </p>
      )}
      {state === 'done' && (
        <>
          <h1 style={{ fontSize: 28, margin: '0 0 10px' }}>Listo</h1>
          <p style={{ color: '#8b96b2', fontSize: 14 }}>Ya no recibirás correos de Dipper.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 style={{ fontSize: 28, margin: '0 0 10px' }}>Link inválido</h1>
          <p style={{ color: '#8b96b2', fontSize: 14 }}>El link de desuscripción no es válido o ya expiró.</p>
        </>
      )}
      <div
        className="back-link"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          color: '#5b6a8f',
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 13,
          marginTop: 16,
        }}
      >
        ← volver al blog
      </div>
    </div>
  );
}
