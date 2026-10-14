// ¿Qué muestra Facebook al abrir el enlace del flujo por defecto?
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
const rr = await fetch(`http://127.0.0.1:${proxy.address().port}/api/canales`, {
  headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/connect/whatsapp" + q({ profileId: perfil, redirect_url: "https://yagyss.github.io/stokly-panel/#canales?seccion=whatsapp" }) },
});
const url = (await rr.json()).authUrl;
console.log("URL (flujo por defecto):\n" + url + "\n");
const u = new URL(url);
console.log("redirect_uri: " + u.searchParams.get("redirect_uri"));
console.log("display:      " + u.searchParams.get("display"));
console.log("scope:        " + (u.searchParams.get("scope") || "").slice(0, 200));
console.log("config_id:    " + u.searchParams.get("config_id"));
console.log("extras:       " + [...u.searchParams.keys()].filter((k) => !["client_id", "redirect_uri", "response_type", "scope", "config_id"].includes(k)).join(",") + "\n");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PERFIL = "C:\\Users\\pc\\AppData\\Local\\Temp\\opencode\\perfil-fb-" + Date.now();
const PUERTO = 9870;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${PERFIL}`, "--window-size=390,844", "about:blank"], { stdio: "ignore" });

let ws, id = 0; const pend = new Map();
const enviar = (m, p = {}) => new Promise((res) => { const mid = ++id; pend.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
let paginas = null, i = 0;
while (i++ < 40) {
  try { paginas = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json(); if (paginas.some((p) => p.type === "page")) break; } catch {}
  await sleep(400);
}
const pagina = paginas.find((p) => p.type === "page");
ws = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await enviar("Page.enable"); await enviar("Runtime.enable");
await enviar("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await enviar("Page.navigate", { url });
await sleep(8000);
const r2 = await enviar("Runtime.evaluate", { expression: `JSON.stringify({ url: location.href, titulo: document.title, texto: (document.body ? document.body.innerText : "").replace(/\\s+/g," ").slice(0, 600) })`, returnByValue: true });
const d = JSON.parse(r2.result.value);
console.log("url final: " + d.url.slice(0, 160));
console.log("título:    " + d.titulo);
console.log("pantalla:  " + d.texto);
ws.close(); chrome.kill(); proxy.close(); fakeSupa.close();
