import { readFileSync } from 'node:fs';

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const token = envText.match(/SUPABASE_ACCESS_TOKEN=(\S+)/)[1];
const sql = readFileSync(process.argv[2], 'utf8');

const res = await fetch(
  'https://api.supabase.com/v1/projects/xjssqrmmzfgeivotgxad/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  }
);
const body = await res.text();
if (!res.ok) {
  console.error('FAILED', res.status, body);
  process.exit(1);
}
console.log('OK', body.slice(0, 500));
