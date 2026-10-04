// Genera los íconos del sitio a partir de scripts/assets/avatar-source.jpg (avatar pixel art).
// Uso: node scripts/brand-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const src = readFileSync('scripts/assets/avatar-source.jpg').toString('base64');
const S = 1254; // tamaño de la imagen fuente

// round: recorte circular con fondo transparente (favicon, avatar de las tarjetas).
// square: fondo oscuro del blog, sin transparencia (apple-touch-icon).
// face: encuadre de la cara, legible en tamaños de pestaña (16-48 px).
function render(size, round, face = false) {
  const [cx, cy, r] = face ? [627, 470, 300] : [S / 2, S / 2, S / 2 - 8];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${2 * r}" height="${2 * r}" viewBox="${cx - r} ${cy - r} ${2 * r} ${2 * r}">
    <defs><clipPath id="c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
    ${round ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0a0e18"/>` : `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#0a0e18"/>`}
    <image xlink:href="data:image/jpeg;base64,${src}" width="${S}" height="${S}" ${round ? 'clip-path="url(#c)"' : ''}/>
  </svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

// .ico con PNGs embebidos (formato aceptado por todos los navegadores modernos).
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e); head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(data.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.data)]);
}

const out = {
  'public/favicon-32.png': render(32, true, true),
  'public/favicon-192.png': render(192, true),
  'public/apple-touch-icon.png': render(180, false),
  'public/brand/avatar-160.png': render(160, true),
};
for (const [p, d] of Object.entries(out)) writeFileSync(p, d);
writeFileSync('public/favicon.ico', ico([16, 32, 48].map((size) => ({ size, data: render(size, true, true) }))));
// Avatar embebido para las imágenes Open Graph (evita una petición extra en la función).
writeFileSync('api/_lib/avatar.ts', `// Generado por scripts/brand-icons.mjs — no editar a mano.\nexport const AVATAR_DATA_URL =\n  'data:image/png;base64,${out['public/brand/avatar-160.png'].toString('base64')}';\n`);
console.log('ok', Object.keys(out).join(', '), 'public/favicon.ico', 'api/_lib/avatar.ts');
