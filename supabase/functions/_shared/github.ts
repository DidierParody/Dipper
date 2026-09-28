// Helpers para leer contenido público (o privado con GITHUB_TOKEN) de GitHub.

const MAX_BYTES = 1_000_000; // 1MB

function authHeaders(): Record<string, string> {
  const token = Deno.env.get('GITHUB_TOKEN');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Resuelve un ref (branch, tag o sha) al sha de commit completo (40 hex).
 */
export async function resolveSha(repo: string, ref: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`, {
    headers: {
      Accept: 'application/vnd.github.sha',
      'User-Agent': 'dipper-admin-posts',
      ...authHeaders(),
    },
  });
  if (res.status === 404) {
    throw new Error(`No se encontró el repo "${repo}" o la referencia "${ref}"`);
  }
  if (!res.ok) {
    throw new Error(`Error al resolver el sha de "${repo}@${ref}": HTTP ${res.status}`);
  }
  const sha = (await res.text()).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`Respuesta inesperada al resolver el sha de "${repo}@${ref}"`);
  }
  return sha;
}

/**
 * Descarga un archivo de texto desde raw.githubusercontent.com a un sha fijo.
 * Devuelve null si el archivo no existe (404). Lanza error en cualquier otro
 * caso, incluyendo si supera el límite de 1MB.
 */
export async function fetchRaw(repo: string, sha: string, path: string): Promise<string | null> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${sha}/${path}`, {
    headers: {
      'User-Agent': 'dipper-admin-posts',
      ...authHeaders(),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Error al descargar "${path}" de "${repo}@${sha}": HTTP ${res.status}`);
  }

  const lengthHeader = res.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
    throw new Error(`El archivo "${path}" supera el máximo permitido de 1MB`);
  }

  const text = await res.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) {
    throw new Error(`El archivo "${path}" supera el máximo permitido de 1MB`);
  }
  return text;
}
