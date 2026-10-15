// Muestra el CUERPO COMPLETO (valores) de /connect/whatsapp, igual que lo
// vería el navegador. El log del servidor sólo imprime claves, así que
// {authUrl: null} y {authUrl: "https://…"} se ven igual allí.
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

// Exactamente los parámetros que envía la app (WhatsApp.jsx → conectar()).
const redirect = "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp";
for (let i = 1; i <= 3; i++) {
  const q = "?" + new URLSearchParams({ profileId: perfil, headless: "true", redirect_url: redirect }).toString();
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/connect/whatsapp" + q } });
  const t = await r.text();
  console.log(`#${i} status=${r.status} cuerpo=${t.slice(0, 400)}\n`);
}
proxy.close();
fakeSupa.close();
