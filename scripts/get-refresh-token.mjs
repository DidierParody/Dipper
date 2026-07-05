// Uso: node scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
// Abre el navegador para autorizar acceso a Drive con la cuenta del autor,
// captura el codigo en localhost y anexa GOOGLE_REFRESH_TOKEN al .env.
import { createServer } from 'node:http';
import { exec } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error('Uso: node scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive';

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') return res.end();
  const code = url.searchParams.get('code');
  if (!code) {
    res.end('Error: sin codigo. Revisa la terminal.');
    console.error('Callback sin codigo:', url.search);
    process.exit(1);
  }
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
    }),
  });
  const data = await tr.json();
  if (!data.refresh_token) {
    res.end('Error obteniendo refresh token. Revisa la terminal.');
    console.error('Respuesta sin refresh_token:', JSON.stringify(data).slice(0, 300));
    process.exit(1);
  }
  appendFileSync(new URL('../.env', import.meta.url), `\nGOOGLE_OAUTH_CLIENT_ID=${clientId}\nGOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}\nGOOGLE_REFRESH_TOKEN=${data.refresh_token}\n`);
  res.end('Autorizado. Ya puedes cerrar esta pestana y volver con Claude.');
  console.log('OK: GOOGLE_REFRESH_TOKEN guardado en .env');
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log('Esperando autorizacion en el navegador. Abre esta URL:');
  console.log(authUrl);
});

setTimeout(() => {
  console.error('Timeout de 5 minutos esperando autorizacion.');
  process.exit(1);
}, 300000);
