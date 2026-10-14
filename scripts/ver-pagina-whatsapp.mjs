// Abre la página real de conexión de WhatsApp (la misma que ve el usuario)
// y captura qué dice, qué pide y si hay errores.
import { spawn } from "node:child_process";
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

const perfil = (await (await fetch("https://zernio.com/api/v1/profiles", { headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` } })).json()).profiles[0]._id;
const q = (o) => "?" + new URLSearchParams(o).toString();
const r = await fetch(`http://127.0.0.1:${proxy.address().port}/api/canales`, {
  headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/connect/whatsapp" + q({ signup: "hosted", profileId: perfil, redirect_url: "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp", brandName: "Mi negocio", language: "es" }) },
});
const url = (await r.json()).authUrl;
console.log("URL que abre el usuario:\n" + url + "\n");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PERFIL = "C:\\Users\\pc\\AppData\\Local\\Temp\\opencode\\perfil-wa-" + Date.now();
const PUERTO = 9850;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${PERFIL}`, "--window-size=390,844", "about:blank"], { stdio: "ignore" });

let ws, id = 0; const pend = new Map(); const errores = []; const red = [];
const enviar = (m, p = {}) => new Promise((res) => { const mid = ++id; pend.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
let paginas = null, i = 0;
while (i++ < 40) {
  try { paginas = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json(); if (paginas.some((p) => p.type === "page")) break; } catch {}
  await sleep(400);
}
const pagina = paginas.find((p) => p.type === "page");
ws = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); return; }
  if (m.method === "Runtime.exceptionThrown") errores.push("excepción: " + (m.params.exceptionDetails?.exception?.description || "").slice(0, 200));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errores.push("console: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  if (m.method === "Network.requestWillBeSent") red.push(m.params.request.url.slice(0, 120));
};
await enviar("Page.enable"); await enviar("Runtime.enable"); await enviar("Network.enable");
await enviar("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await enviar("Page.navigate", { url });

for (const espera of [4000, 6000]) {
  await sleep(espera);
  const r2 = await enviar("Runtime.evaluate", { expression: `JSON.stringify({ url: location.href, titulo: document.title, texto: (document.body ? document.body.innerText : "").replace(/\\s+/g," ").slice(0, 700) })`, returnByValue: true });
  const d = JSON.parse(r2.result.value);
  console.log(`--- tras ${espera / 1000}s ---`);
  console.log("url:    " + d.url);
  console.log("título: " + d.titulo);
  console.log("texto:  " + d.texto + "\n");
}
console.log("red: " + red.slice(0, 12).join("\n     "));
console.log("\nerrores: " + (errores.length ? errores.slice(0, 5).join("\n") : "ninguno"));
ws.close(); chrome.kill(); proxy.close(); fakeSupa.close();
