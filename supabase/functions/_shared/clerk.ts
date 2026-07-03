import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5';

const ISSUER = 'https://closing-bass-58.clerk.accounts.dev';
const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export async function verifyClerkToken(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('missing token');
  const token = authHeader.slice(7);
  const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
  if (!payload.sub) throw new Error('no sub');
  return payload.sub;
}

export async function getClerkEmail(userId: string): Promise<string> {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('CLERK_SECRET_KEY')}` },
  });
  if (!res.ok) throw new Error(`clerk api ${res.status}`);
  const user = await res.json();
  const primary = user.email_addresses?.find(
    (e: { id: string }) => e.id === user.primary_email_address_id
  );
  const email = primary?.email_address ?? user.email_addresses?.[0]?.email_address;
  if (!email) throw new Error('no email');
  return email.toLowerCase();
}
