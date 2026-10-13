// ¿Se puede conectar sin profileId? (si sí, el botón no depende de la carga inicial)
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

const llamada = async (xPath) => {
  const r = await fetch(P, { headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": xPath } });
  const texto = await r.text();
  let claves = texto.slice(0, 120);
  try { const j = JSON.parse(texto); claves = "claves: [" + Object.keys(j).join(", ") + "] " + (j.authUrl ? "· authUrl SÍ" : ""); } catch {}
  return `${r.status} ${claves}`;
};

const RED = "https://yagyss.github.io/stokly-panel/#canales?redes=X";
const q = (o) => "?" + new URLSearchParams(o).toString();

console.log("\n¿Sin profileId? (a través del proxy, proveedor real)\n");
console.log("instagram sin profileId:      " + await llamada("/connect/instagram" + q({ headless: "true", redirect_url: RED.replace("X", "instagram") })));
console.log("telegram sin profileId:       " + await llamada("/connect/telegram" + q({ headless: "true", redirect_url: RED.replace("X", "telegram") })));
console.log("whatsapp hosted sin profileId:" + await llamada("/connect/whatsapp" + q({ signup: "hosted", redirect_url: RED.replace("X", "whatsapp"), brandName: "Mi negocio", language: "es" })));
console.log("facebook selector sin profile:" + await llamada("/connect/facebook" + q({ redirect_url: RED.replace("X", "facebook") })));
console.log("profiles:                     " + await llamada("/profiles"));

proxy.close(); fakeSupa.close();
