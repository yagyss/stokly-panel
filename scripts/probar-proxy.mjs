// ============================================================
// Prueba local del proxy de canales (api/canales.js)
//
// Arranca el handler como si fuera Vercel, con un Supabase de mentiras
// para el paso de sesión, y hace llamadas REALES al proveedor.
//
// Uso (desde la carpeta del proyecto):  node scripts/probar-proxy.mjs
// ============================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// .env.local (gitignored) trae la llave del proveedor para pruebas en local.
const envLocal = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) {
  for (const linea of fs.readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.ZERNIO_API_KEY) {
  console.error("Falta ZERNIO_API_KEY en .env.local");
  process.exit(1);
}

const TOKEN_OK = "tok-de-prueba-para-la-sesion";
let avisos = 0;
let fallos = 0;
const ok = (n) => { avisos++; console.log(`  ✔ ${n}`); };
const mal = (n, extra = "") => { fallos++; console.log(`  ✘ ${n} ${extra}`); };
const chequea = (n, cond, extra = "") => (cond ? ok(n) : mal(n, extra));

// ── 1) Supabase falso: valida la sesión como lo haría el real ──
const fakeSupa = http.createServer((req, res) => {
  const auth = req.headers.authorization || "";
  const valido = auth === `Bearer ${TOKEN_OK}`;
  res.setHeader("Content-Type", "application/json");
  res.statusCode = valido ? 200 : 401;
  res.end(valido ? JSON.stringify({ id: "usuario-de-prueba", aud: "authenticated" }) : JSON.stringify({ message: "invalid token" }));
});

// ── 2) El proxy, servido en local (se importa cuando ya está el
//       Supabase falso apuntando a su puerto) ──

const llamada = async (opts) => {
  const r = await fetch(`http://127.0.0.1:${proxy.address().port}/api/canales`, opts);
  let body = null;
  try { body = await r.json(); } catch { body = await r.text().catch(() => null); }
  return { status: r.status, body, headers: r.headers };
};

await new Promise((r) => { fakeSupa.listen(0, "127.0.0.1", r); });
process.env.SUPABASE_URL = `http://127.0.0.1:${fakeSupa.address().port}`;
const { default: handler } = await import("../api/canales.js");
const proxy = http.createServer((req, res) => handler(req, res));
await new Promise((r) => { proxy.listen(0, "127.0.0.1", r); });

console.log("\nProxy de canales — prueba local\n");

// ── Preflight ──
{
  const r = await fetch(`http://127.0.0.1:${proxy.address().port}/api/canales`, { method: "OPTIONS" });
  chequea("preflight OPTIONS responde 204", r.status === 204, `→ ${r.status}`);
  chequea("preflight trae CORS", r.headers.get("access-control-allow-origin") === "*", `→ ${r.headers.get("access-control-allow-origin")}`);
}

// ── Sesión ──
{
  const r = await llamada({ method: "GET" });
  chequea("sin sesión responde 401", r.status === 401, `→ ${r.status}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: "Bearer token-falso-1234567890" } });
  chequea("sesión inválida responde 401", r.status === 401, `→ ${r.status}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/admin/usuarios" } });
  chequea("ruta fuera de la lista blanca responde 403", r.status === 403, `→ ${r.status} ${JSON.stringify(r.body)}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}` } });
  chequea("sin x-path responde 400", r.status === 400, `→ ${r.status}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/profiles", origin: "https://otro-sitio.com" } });
  chequea("origen desconocido responde 403", r.status === 403, `→ ${r.status}`);
}

// ── Llamadas REALES al proveedor, a través del proxy ──
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/profiles" } });
  chequea("GET /profiles llega al proveedor (200)", r.status === 200 && Array.isArray(r.body?.profiles), `→ ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/accounts" } });
  chequea("GET /accounts responde 200 con lista", r.status === 200 && Array.isArray(r.body?.accounts), `→ ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/whatsapp/templates?accountId=que-no-existe" } });
  chequea("GET de plantillas pasa la query (?…)", r.status >= 400, `→ ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
{
  const r = await llamada({
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/inbox/conversations", "Content-Type": "application/json" },
    body: JSON.stringify({}), // a propósito incompleto: el proveedor debe rechazarlo
  });
  chequea("POST con cuerpo reenvía el cuerpo (400 del proveedor)", r.status === 400, `→ ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/accounts?profileId=6ac86680af4959b76b846395" } });
  chequea("GET /accounts con query no lo bloquea la lista blanca", r.status === 200, `→ ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
{
  const r = await llamada({ method: "GET", headers: { Authorization: `Bearer ${TOKEN_OK}`, "x-path": "/inbox/conversations?limit=3" } });
  chequea("GET conversaciones responde 200 (aunque no haya cuentas conectadas)", r.status === 200, `→ ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
}

console.log(`\n${avisos} correctas, ${fallos} fallidas\n`);
fakeSupa.close();
proxy.close();
process.exit(fallos ? 1 : 0);
