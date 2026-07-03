const enc = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(Deno.env.get('UNSUBSCRIBE_SECRET')!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export async function makeUnsubToken(subscriberId: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(subscriberId));
  return `${subscriberId}.${b64url(sig)}`;
}

export async function verifyUnsubToken(token: string): Promise<string | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const id = token.slice(0, dot);
  const expected = await makeUnsubToken(id);
  return expected === token ? id : null;
}
