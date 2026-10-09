// ============================================================
//  stokly · generador de iconos del PWA (sin dependencias)
//  Uso:  node scripts/gen-iconos.mjs
//  Crea: public/icons/*.png  y  public/favicon.svg
//
//  Diseño (espacio de 512 px):
//    · fondo con degradado de marca  #00C896 → #4A90FF
//    · caja blanca (📦 paquete) con dos "cintas" cortadas
//      en el color del fondo: una vertical y una horizontal.
//  Tipos:
//    · any       → esquinas redondeadas (icono de app)
//    · maskable  → a sangre completa (Android recorta en círculo)
//    · apple     → cuadrado completo (iOS lo recorta solo)
// ============================================================
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "public", "icons");

// ── Diseño (coordenadas en un cuadro de 512) ─────────────────────────
const CAJA = { x0: 112, y0: 140, x1: 400, y1: 372, r: 30 };
// Cinta vertical sólo en la TAPA (arriba) y costura horizontal de la tapa:
// así el paquete se lee como una caja cerrada y no como una cuadrícula.
const TIRA_V = { x0: 240, x1: 272, y0: 140, y1: 224 };
const TIRA_H = { y0: 196, y1: 224 };
const MARCO = { x0: 0, y0: 0, x1: 512, y1: 512, r: 110 };

// ── PNG mínimo (RGBA, filtro 0, deflate) ─────────────────────────────
const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (tipo, data) => {
  const b = Buffer.alloc(8 + data.length + 4);
  b.writeUInt32BE(data.length, 0);
  b.write(tipo, 4, 4, "ascii");
  data.copy(b, 8);
  b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(tipo, "ascii"), data])), 8 + data.length);
  return b;
};

const png = (w, h, pix) => {
  const bruto = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    bruto[y * (w * 4 + 1)] = 0; // filtro "None"
    pix.copy(bruto, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(bruto, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

// ── Geometría ────────────────────────────────────────────────────────
const dentroRect = (x, y, r) => {
  if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) return false;
  const cx = Math.max(r.x0 + r.r, Math.min(r.x1 - r.r, x));
  const cy = Math.max(r.y0 + r.r, Math.min(r.y1 - r.r, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r.r * r.r;
};

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

// Degradado de marca en diagonal (arriba-izquierda → abajo-derecha)
const gradiente = (nx, ny) => {
  const t = Math.min(1, Math.max(0, (nx + ny) / 2));
  return [lerp(0x00, 0x4a, t), lerp(0xc8, 0x90, t), lerp(0x96, 0xff, t)];
};

// Cobertura (0..1) de la caja blanca en un píxel: dentro de la caja y
// FUERA de las dos cintas (que se quedan del color del fondo).
const coberturaCaja = (dx, dy) => {
  const K = 4;
  let dentro = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      const x = dx + (i + 0.5) / K;
      const y = dy + (j + 0.5) / K;
      if (!dentroRect(x, y, CAJA)) continue;
      if (x >= TIRA_V.x0 && x <= TIRA_V.x1 && y >= TIRA_V.y0 && y <= TIRA_V.y1) continue;
      if (y >= TIRA_H.y0 && y <= TIRA_H.y1) continue;
      dentro++;
    }
  }
  return dentro / (K * K);
};

const coberturaMarco = (dx, dy) => {
  const K = 4;
  let dentro = 0;
  for (let i = 0; i < K; i++)
    for (let j = 0; j < K; j++)
      if (dentroRect(dx + (i + 0.5) / K, dy + (j + 0.5) / K, MARCO)) dentro++;
  return dentro / (K * K);
};

// ── Render por tamaño ────────────────────────────────────────────────
const render = (tamaño, tipo) => {
  const esc = 512 / tamaño;
  const pix = Buffer.alloc(tamaño * tamaño * 4);
  for (let y = 0; y < tamaño; y++) {
    for (let x = 0; x < tamaño; x++) {
      const o = (y * tamaño + x) * 4;
      const dx = (x + 0.5) * esc;
      const dy = (y + 0.5) * esc;
      const marco = tipo === "any" ? coberturaMarco(dx, dy) : 1;
      if (marco <= 0) continue; // transparente
      const [r, g, b] = gradiente((x + 0.5) / tamaño, (y + 0.5) / tamaño);
      const c = coberturaCaja(dx, dy); // 0 = fondo · 1 = blanco
      pix[o] = Math.round(r + (255 - r) * c);
      pix[o + 1] = Math.round(g + (255 - g) * c);
      pix[o + 2] = Math.round(b + (255 - b) * c);
      pix[o + 3] = Math.round(marco * 255);
    }
  }
  return png(tamaño, tamaño, pix);
};

// ── Favicon vectorial (mismo diseño, nítido en la pestaña) ───────────
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="stokly">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00C896"/>
      <stop offset="1" stop-color="#4A90FF"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#g)"/>
  <path fill="#FFFFFF" fill-rule="evenodd" d="M142 140 H370 A30 30 0 0 1 400 170 V342 A30 30 0 0 1 370 372 H142 A30 30 0 0 1 112 342 V170 A30 30 0 0 1 142 140 Z M240 140 H272 V224 H240 Z M112 196 H400 V224 H112 Z"/>
</svg>
`;

// ── Generación ───────────────────────────────────────────────────────
mkdirSync(SALIDA, { recursive: true });

const ARCHIVOS = [
  ["icon-192.png", 192, "any"],
  ["icon-512.png", 512, "any"],
  ["maskable-192.png", 192, "maskable"],
  ["maskable-512.png", 512, "maskable"],
  ["apple-touch-icon.png", 180, "apple"],
];

for (const [nombre, tamaño, tipo] of ARCHIVOS) {
  const buf = render(tamaño, tipo);
  writeFileSync(join(SALIDA, nombre), buf);
  console.log(`  ✅ public/icons/${nombre}  ${tamaño}x${tamaño}  ${buf.length} bytes`);
}

writeFileSync(join(RAIZ, "public", "favicon.svg"), favicon, "utf8");
console.log("  ✅ public/favicon.svg");
