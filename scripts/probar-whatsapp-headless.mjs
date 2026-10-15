// ¿Qué devuelve /connect/whatsapp con headless=true (lo que manda la app)?
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
const RED = "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp";

const probar = async (etiqueta, params) => {
  const q = "?" + new URLSearchParams(params).toString();
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/connect/whatsapp" + q } });
  const t = await r.text();
  let resumen = t.slice(0, 200);
  try {
    const j = JSON.parse(t);
    const url = j.authUrl || j.url || "";
    resumen = `claves [${Object.keys(j).join(",")}] · authUrl=${url ? "SÍ (" + String(url).slice(0, 70) + "…)" : "VACÍO/NULO"}` +
      (j.code ? ` · code=${j.code}` : "") + (j.error ? ` · error=${JSON.stringify(j.error).slice(0, 80)}` : "");
  } catch {}
  console.log(`${r.status} ${etiqueta}\n   ${resumen}\n`);
};

console.log("\nWhatsApp · el enlace con lo que manda la app de verdad\n");
await probar("con headless=true (la app)", { profileId: perfil, headless: "true", redirect_url: RED });
await probar("con headless=false", { profileId: perfil, headless: "false", redirect_url: RED });
await probar("sin headless (por defecto)", { profileId: perfil, redirect_url: RED });

console.log("── cinco seguidas, como el usuario ──");
for (let i = 1; i <= 5; i++) await probar(`intento ${i} (headless=true)`, { profileId: perfil, headless: "true", redirect_url: RED });

proxy.close(); fakeSupa.close();
