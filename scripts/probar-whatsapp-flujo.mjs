// ¿Qué devuelve el flujo POR DEFECTO de WhatsApp (sin signup=hosted)?
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
const q = (o) => "?" + new URLSearchParams(o).toString();
const RED = "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp";

const llamada = async (xPath) => {
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": xPath } });
  const t = await r.text();
  let u = "", extra = "";
  try {
    const j = JSON.parse(t);
    u = j.authUrl || j.url || "";
    const claves = Object.keys(j).join(",");
    extra = u ? `· claves [${claves}]` : `· claves [${claves}] ${JSON.stringify(j).slice(0, 160)}`;
  } catch { extra = t.slice(0, 160); }
  return { est: r.status, u, extra };
};

const casos = [
  ["por defecto (misma pestaña)", "/connect/whatsapp" + q({ profileId: perfil, redirect_url: RED })],
  ["por defecto + onboarding=api", "/connect/whatsapp" + q({ profileId: perfil, redirect_url: RED, onboarding: "api" })],
  ["hosted (actual)", "/connect/whatsapp" + q({ signup: "hosted", profileId: perfil, redirect_url: RED, brandName: "Mi negocio", language: "es" })],
];

console.log("\nWhatsApp · ¿dónde acaba el enlace?\n");
for (const [etiqueta, ruta] of casos) {
  const r = await llamada(ruta);
  let destino = "(sin url)";
  if (r.u) {
    try {
      const h = new URL(r.u);
      destino = h.hostname + h.pathname;
      const que = ["client_id", "scope", "response_type", "wa_business_code", "config_id"].filter((k) => h.searchParams.has(k));
      destino += que.length ? "  [" + que.join(",") + "]" : "";
    } catch { destino = r.u.slice(0, 70); }
  }
  console.log(`${r.est === 200 ? "✔" : "✘"} ${etiqueta}`);
  console.log(`   destino: ${destino}`);
  console.log(`   ${r.extra}\n`);
}
proxy.close(); fakeSupa.close();
