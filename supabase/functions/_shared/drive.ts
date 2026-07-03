import { SignJWT, importPKCS8 } from 'npm:jose@5';

export function driveConfigured(): boolean {
  return !!(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') && Deno.env.get('DRIVE_FOLDER_ID'));
}

async function accessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')!);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/drive.readonly' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token;
}

export interface DriveFile { id: string; name: string; modifiedTime: string; size?: string }

export async function listMdFiles(): Promise<DriveFile[]> {
  const folder = Deno.env.get('DRIVE_FOLDER_ID')!;
  const token = await accessToken();
  const q = encodeURIComponent(`'${folder}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`drive list ${res.status}`);
  const { files } = await res.json();
  return (files ?? []).filter(
    (f: { name: string; mimeType: string }) =>
      f.name.endsWith('.md') || f.mimeType === 'text/markdown'
  );
}

export async function downloadFile(fileId: string): Promise<string> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`drive download ${res.status}`);
  return await res.text();
}
