// Genera public/og-default.png: la tarjeta de previsualización del sitio (home, creador, series).
// Es estática para que WhatsApp/LinkedIn la carguen al instante (la función /api/og arranca en frío).
// Uso: npx tsx scripts/og-default.mts   (re-ejecutar si cambia el diseño de la tarjeta)
import { writeFileSync } from 'node:fs';
import { GET } from '../api/og.ts';

const res = await GET(new Request('https://dipper-one.vercel.app/api/og'));
if (!res.ok) throw new Error(`og ${res.status}`);
writeFileSync('public/og-default.png', Buffer.from(await res.arrayBuffer()));
console.log('public/og-default.png listo');
