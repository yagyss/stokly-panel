// ¿El proveedor devuelve authUrl VACÍA (null) con algún redirect_url?
// (El proxy sólo registra las CLAVES de la respuesta: {authUrl: null, state}
//  se ve igual que {authUrl: "https://…"} en los logs, y eso produciría el
//  aviso "No se pudo abrir la conexión".)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const envLocal = path.join(process.cwd(), ".env.local");
for (const linea of fs.readFileSync(envLocal, "utf8").split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const TOKEN_OK = "tok-de-prueba-suficientemente-largo";
const fakeSupa = http.createServer((req, res) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ id: "u-prueba" })); });
await new Promise((r) => fakeSupa.listen(0, "127.0.0.1", r));
process.env.SUPABASE_URL = `http://127.0.0.1:${fakeSupa.address().port}`;
const { default: handler } = await import("../api/canales.js");
const proxy = http.createServer((req, res) => handler(req, res));
await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
const P = `http://127.0.0.1:${proxy.address().port}/api/canales`;

const perfil = (await (await fetch("https://zernio.com/api/v1/profiles", { headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` } })).json()).profiles[0]._id;

const llamar = async (etiqueta, ruta, params) => {
  const q = "?" + new URLSearchParams(params).toString();
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": ruta + q } });
  const t = await r.text();
  let resumen;
  try {
    const j = JSON.parse(t);
    const url = j.authUrl || j.url || "";
    resumen =
      `claves[${Object.keys(j).join(",")}] · ` +
      (url ? `authUrl=${String(url).slice(0, 60)}…` : "authUrl=VACÍA/NULA") +
      (j.error ? ` · error=${JSON.stringify(j.error).slice(0, 60)}` : "") +
      (j.error_message ? ` · msg=${String(j.error_message).slice(0, 60)}` : "");
  } catch {
    resumen = t.slice(0, 150);
  }
  console.log(`${r.status} ${etiqueta}\n   ${resumen}\n`);
};

console.log("WhatsApp · ¿el destino del redirect cambia la respuesta?\n");
const REDS = {
  "github pages": "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp",
  "vercel": "https://stokly-panel.vercel.app/#canales?seccion=whatsapp",
  "vercel sin /": "https://stokly-panel.vercel.app#canales?seccion=whatsapp",
  "localhost": "http://localhost:4173/#canales?seccion=whatsapp",
};
for (const [nombre, red] of Object.entries(REDS)) {
  await llamar(`headless=true · ${nombre}`, "/connect/whatsapp", { profileId: perfil, headless: "true", redirect_url: red });
  await llamar(`sin headless · ${nombre}`, "/connect/whatsapp", { profileId: perfil, redirect_url: red });
}

console.log("Facebook · misma prueba (para comparar)\n");
for (const [nombre, red] of Object.entries(REDS)) {
  await llamar(`sin headless · ${nombre}`, "/connect/facebook", { profileId: perfil, redirect_url: red });
}

proxy.close();
fakeSupa.close();
