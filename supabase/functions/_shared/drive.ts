import { SignJWT, importPKCS8 } from 'npm:jose@5';

export function driveConfigured(): boolean {
  const auth = Deno.env.get('GOOGLE_REFRESH_TOKEN') || Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  return !!(auth && Deno.env.get('DRIVE_FOLDER_ID'));
}

async function accessToken(): Promise<string> {
  // Preferir OAuth del autor: los archivos quedan a su nombre y usan su cuota.
  // Los service accounts ya no tienen cuota de almacenamiento en Drive (403 al subir).
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
  if (refreshToken) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error(`google token ${res.status}`);
    return (await res.json()).access_token;
  }
  const sa = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')!);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/drive' })
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

export async function uploadMdFile(name: string, content: string): Promise<string> {
  const token = await accessToken();
  const metadata = { name, parents: [Deno.env.get('DRIVE_FOLDER_ID')!], mimeType: 'text/markdown' };
  const boundary = 'dipper' + crypto.randomUUID();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: text/markdown\r\n\r\n` +
    content + `\r\n--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`drive upload ${res.status}: el service account necesita permiso de Editor en la carpeta`);
  return (await res.json()).id;
}

export async function updateMdFile(fileId: string, content: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/markdown' }, body: content }
  );
  if (!res.ok) throw new Error(`drive update ${res.status}`);
}

export async function trashFile(fileId: string): Promise<boolean> {
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
  return res.ok; // tolerante: archivos de Didier no pueden ser borrados por el SA
}
