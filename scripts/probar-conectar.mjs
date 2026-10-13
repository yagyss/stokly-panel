// Reproduce exactamente lo que el navegador recibe al pulsar "Conectar"
// (a través del proxy local, con llamadas REALES al proveedor).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const envLocal = path.join(process.cwd(), ".env.local");
for (const linea of fs.readFileSync(envLocal, "utf8").split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const TOKEN_OK = "tok-de-prueba-para-la-sesion";
const fakeSupa = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ id: "usuario-de-prueba", aud: "authenticated" }));
});
await new Promise((r) => fakeSupa.listen(0, "127.0.0.1", r));
process.env.SUPABASE_URL = `http://127.0.0.1:${fakeSupa.address().port}`;
const { default: handler } = await import("../api/canales.js");
const proxy = http.createServer((req, res) => handler(req, res));
await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
const P = `http://127.0.0.1:${proxy.address().port}/api/canales`;

const llamada = async (xPath) => {
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": xPath } });
  const texto = await r.text();
  return { status: r.status, tipo: r.headers.get("content-type"), texto };
};

const perfil = (await (await fetch("https://zernio.com/api/v1/profiles", { headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` } })).json()).profiles[0]._id;
const RED = "https://yagyss.github.io/stokly-panel/#canales?redes=instagram";
const q = (o) => "?" + new URLSearchParams(o).toString();

const casos = [
  ["/profiles", "/profiles"],
  ["/connect/instagram" + q({ profileId: perfil, headless: "true", redirect_url: RED }), "/connect/instagram (headless)"],
  ["/connect/tiktok" + q({ profileId: perfil, headless: "true", redirect_url: "https://yagyss.github.io/stokly-panel/#canales?redes=tiktok" }), "/connect/tiktok (headless)"],
  ["/connect/telegram" + q({ profileId: perfil, headless: "true", redirect_url: "https://yagyss.github.io/stokly-panel/#canales?redes=telegram" }), "/connect/telegram (headless)"],
  ["/connect/facebook" + q({ profileId: perfil, redirect_url: "https://yagyss.github.io/stokly-panel/#canales?redes=facebook" }), "/connect/facebook (selector)"],
  ["/connect/whatsapp/sdk-config", "/connect/whatsapp/sdk-config"],
  ["/connect/whatsapp" + q({ signup: "hosted", profileId: perfil, redirect_url: "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp", brandName: "Mi negocio", language: "es" }), "/connect/whatsapp (hosted)"],
];

console.log("\nLo que recibe el navegador al pulsar Conectar\n");
for (const [ruta, etiqueta] of casos) {
  const r = await llamada(ruta);
  let resumen = r.texto.slice(0, 150);
  try { const j = JSON.parse(r.texto); resumen = "claves: [" + Object.keys(j).join(", ") + "] " + (j.authUrl ? "· authUrl sí (" + String(j.authUrl).slice(0, 60) + "…)" : j.code ? "· code " + j.code : ""); } catch {}
  console.log(`${r.status === 200 ? "✔" : "✘"} ${etiqueta}`);
  console.log(`   ${r.status} ${r.tipo} · ${resumen}`);
}

proxy.close(); fakeSupa.close();
