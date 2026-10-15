// ¿El service worker de la PWA enreda las llamadas del proxy de canales?
//
// Todas las llamadas van a la MISMA URL (/api/canales) y la ruta real viaja
// en la cabecera x-path. Si el SW cachea esa URL, la segunda llamada recibe
// la respuesta VIEJA de la primera (p. ej. la de /profiles) y "Conectar"
// ve un JSON sin authUrl → "No se pudo abrir la conexión".
//
// Este prueba monta un servidor con el sw.js REAL de public/ y comprueba:
//   1. con el sw.js actual, /profiles y /connect/whatsapp devuelven distinto
//   2. y además, con la lógica ANTIGUA (sin /api/), se reproduce el fallo
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const raiz = process.cwd();
const swActual = fs.readFileSync(path.join(raiz, "public", "sw.js"), "utf8");
const swViejo = swActual
  .replace('const CACHE = "stokly-pwa-v3";', 'const CACHE = "stokly-pwa-v2";')
  .replace("  if (url.pathname.startsWith(\"/api/\")) return; // proxy de canales: siempre de la red\n", "");

const PAGINA = `<!doctype html><html><body><script>
window.__r1 = null; window.__r2 = null;
navigator.serviceWorker.register("./sw.js").then(() => {
  navigator.serviceWorker.ready.then(async () => {
    const pedir = async (xp) => {
      const r = await fetch("/api/canales", { headers: { "x-path": xp } });
      return r.text();
    };
    window.__r1 = await pedir("/profiles");
    await new Promise(r => setTimeout(r, 1500)); // como en la app: profiles al abrir, connect al pulsar
    window.__r2 = await pedir("/connect/whatsapp");
    window.__listo = true;
  });
}).catch(e => { window.__error = String(e); window.__listo = true; });
</script></body></html>`;

function montar(swTexto, puerto) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/sw.js") { res.setHeader("Content-Type", "text/javascript"); res.end(swTexto); return; }
    if (u.pathname === "/api/canales") {
      const xp = req.headers["x-path"] || "";
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(xp.includes("connect") ? { authUrl: "https://facebook.com/dialog/oauth", state: "abc" } : { profiles: [{ _id: "p1" }] }));
      return;
    }
    res.setHeader("Content-Type", "text/html"); res.end(PAGINA);
  });
  return new Promise((ok) => srv.listen(puerto, "127.0.0.1", () => ok(srv)));
}

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
async function probar(swTexto, etiqueta, puerto, depu) {
  const srv = await montar(swTexto, puerto);
  const PERFIL = "C:\\Users\\pc\\AppData\\Local\\Temp\\opencode\\perfil-sw-" + Date.now();
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${depu}`, `--user-data-dir=${PERFIL}`, "about:blank"], { stdio: "ignore" });
  let ws, id = 0; const pend = new Map();
  const enviar = (m, p = {}) => new Promise((res) => { const mid = ++id; pend.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  let paginas = null, i = 0;
  while (i++ < 40) {
    try { paginas = await (await fetch(`http://127.0.0.1:${depu}/json/list`)).json(); if (paginas.some((p) => p.type === "page")) break; } catch {}
    await sleep(400);
  }
  const pagina = paginas.find((p) => p.type === "page");
  ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
  await enviar("Page.enable");
  await enviar("Page.navigate", { url: `http://127.0.0.1:${puerto}/` });
  let d = null;
  for (let s = 0; s < 30; s++) {
    await sleep(500);
    const r = await enviar("Runtime.evaluate", { expression: "window.__listo ? JSON.stringify({r1:window.__r1,r2:window.__r2,e:window.__error||null}) : null", returnByValue: true });
    if (r.result && r.result.value) { d = JSON.parse(r.result.value); break; }
  }
  ws.close(); chrome.kill(); srv.close();
  if (!d) { console.log(`${etiqueta}: no completó`); return null; }
  const r2tieneAuth = (d.r2 || "").includes("authUrl");
  console.log(`${etiqueta}:\n   llamada 1 (/profiles)      → ${(d.r1 || "").slice(0, 60)}\n   llamada 2 (/connect/wa)    → ${(d.r2 || "").slice(0, 60)}\n   ¿la 2 trae authUrl?        → ${r2tieneAuth ? "SÍ (correcto)" : "NO (¡fallo! devolvió la respuesta vieja)"}\n`);
  return r2tieneAuth;
}

const okActual = await probar(swActual, "sw.js ACTUAL (con el nuevo /api/)", 8231, 9831);
const okViejo = await probar(swViejo, "sw.js ANTERIOR (sin el /api/, cómo estaba)", 8232, 9832);

console.log("Resultado:");
console.log(`  · sw actual deja pasar /api/ → ${okActual ? "SÍ ✓" : "NO ✗"}`);
console.log(`  · sw viejo enreda las respuestas (bug reproducido) → ${okViejo === false ? "SÍ ✓" : "no se pudo reproducir"}`);
process.exit(okActual === true && okViejo === false ? 0 : 1);
