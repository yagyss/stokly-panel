// ============================================================
// stokly · Proxy de canales (WhatsApp / redes sociales / agente IA)
//
// ¿Por qué existe? La app es 100% estática (se arma en el navegador),
// así que si la llave del proveedor viajara dentro del bundle quedaría
// a la vista de cualquiera. Este archivo corre en el servidor de
// Vercel: ahí vive la llave (variable de entorno ZERNIO_API_KEY, que
// NUNCA se sube a git) y el navegador solo le pide "pásame lo que
// diga esta ruta".
//
// Protecciones:
//   1. Solo acepta peticiones de un usuario con sesión válida en Supabase
//      (mismo criterio que la función "invite" que ya usa stokly).
//   2. Lista blanca de rutas: no deja pasar cualquier URL.
//   3. Límite de peticiones por minuto (evita abuso si alguien lo descubre).
//
// El navegador llama:  POST/GET  /api/canales   con cabecera x-path
// que indica la ruta real, p. ej.  /inbox/conversations?platform=whatsapp
// ============================================================

const PROVEEDOR_BASE = "https://zernio.com/api/v1";

// Credenciales del proyecto (la publishable es pública por diseño)
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://rquddcbkaovqplcobifd.supabase.co";
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_5K0PvBiJYNhBtBGDO3wVSg_Xn1nm8ll";

// Rutas que el panel está autorizado a usar (lista blanca).
const RUTAS_PERMITIDAS = [
  /^\/profiles$/,
  /^\/accounts$/,
  /^\/accounts\/[^/]+$/,
  /^\/usage-stats$/,
  /^\/connect\//,
  /^\/inbox\/conversations/,
  /^\/whatsapp\/templates/,
  /^\/messages$/,
  /^\/accounts\/[^/]+\/business-agent/,
];

const ORIGENES_OK = [
  "https://yagyss.github.io",
  "https://stokly-panel.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];

const CORS = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type,x-path",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Origin": "*",
};

const json = (res, status, obj, extra = {}) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries({ ...CORS, ...extra })) res.setHeader(k, v);
  res.end(typeof obj === "string" ? obj : JSON.stringify(obj));
};

// --- Límite suave de peticiones por minuto (por IP) -------------
const CUPOS = new Map();
const cuposDe = (ip) => {
  const ahora = Date.now();
  const c = CUPOS.get(ip);
  if (!c || ahora - c.t > 60000) {
    const nuevo = { n: 0, t: ahora };
    CUPOS.set(ip, nuevo);
    if (CUPOS.size > 5000) CUPOS.clear(); // memoria acotada
    return nuevo;
  }
  return c;
};

// --- ¿Hay una sesión válida de Supabase? ------------------------
async function usuarioDe(req) {
  const cabecera = req.headers.authorization || "";
  const jwt = String(cabecera).replace(/^Bearer\s+/i, "").trim();
  if (!jwt || jwt.length < 20) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch {
    return null;
  }
}

async function cuerpoTexto(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
    return JSON.stringify(req.body);
  }
  const trozos = [];
  for await (const trozo of req) trozos.push(trozo);
  return Buffer.concat(trozos).toString("utf8");
}

export default async function handler(req, res) {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "desconocida";

  // Preflight del navegador (la petición lleva Authorization)
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.end();
  }

  const origen = req.headers.origin;
  if (origen && !ORIGENES_OK.includes(origen) && !/^http:\/\/localhost:\d+$/.test(origen)) {
    // Origen desconocido: no es el panel de stokly. Se responde igual
    // (el navegador del intruso lo bloquearía igualmente por CORS),
    // pero se corta antes de gastar llamadas al proveedor.
    console.log(`[canales] 403 origen no permitido · ${req.method} · ${origen || "(sin origin)"}`);
    return json(res, 403, { error: "Origen no permitido" });
  }

  const cupo = cuposDe(ip);
  if (cupo.n >= 240) {
    console.log(`[canales] 429 límite de peticiones · ${req.method}`);
    return json(res, 429, { error: "Demasiadas peticiones, espera un minuto" });
  }
  cupo.n += 1;

  // --- 1) ¿Quién llama? (sesión de stokly) ----------------------
  const usuario = await usuarioDe(req);
  if (!usuario) {
    console.log(`[canales] 401 sin sesión válida · ${req.method} · origen=${origen || "-"}`);
    return json(res, 401, { error: "No autorizado" });
  }

  // --- 2) ¿Qué ruta pide? --------------------------------------
  let ruta = req.headers["x-path"];
  if (!ruta) {
    try {
      ruta = new URL(req.url, "http://local").searchParams.get("path");
    } catch {
      ruta = null;
    }
  }
  ruta = String(ruta || "").trim();
  if (!ruta.startsWith("/") || /[\r\n]/.test(ruta)) {
    return json(res, 400, { error: "Falta la ruta (cabecera x-path)" });
  }
  // La lista blanca compara solo la ruta; la query (?…) viaja aparte.
  const soloRuta = ruta.split("?")[0];
  if (!RUTAS_PERMITIDAS.some((re) => re.test(soloRuta))) {
    return json(res, 403, { error: "Ruta no permitida" });
  }

  const llave = process.env.ZERNIO_API_KEY;
  if (!llave) {
    return json(res, 500, { error: "Canal sin configurar en el servidor" });
  }

  // --- 3) Reenviar al proveedor y devolver tal cual -------------
  const cuerpo = ["GET", "HEAD"].includes(req.method) ? undefined : await cuerpoTexto(req);
  try {
    const r = await fetch(PROVEEDOR_BASE + ruta, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${llave}`,
        Accept: "application/json",
        ...(cuerpo ? { "Content-Type": "application/json" } : {}),
      },
      body: cuerpo,
    });
    const texto = await r.text();
    // Diagnóstico para los logs del servidor: qué se pidió y qué forma
    // devolvió (sólo claves y longitudes, nunca valores: así no se
    // filtran tokens). El origen indica desde qué host abrieron la app.
    let forma = "vacío";
    try {
      const j = JSON.parse(texto);
      forma = Array.isArray(j) ? `array(${j.length})` : Object.keys(j).join(",");
      // En /connect/* el navegador necesita authUrl: si llegó presente pero
      // vacío el usuario ve "no se pudo abrir la conexión" — aquí se nota
      // (sólo la longitud, nunca el enlace).
      if (soloRuta.startsWith("/connect/") && j && typeof j === "object" && !Array.isArray(j) && "authUrl" in j) {
        forma += ` authUrl=${j.authUrl ? String(j.authUrl).length + "ch" : "VACÍA"}`;
      }
    } catch {
      if (texto) forma = "no-json";
    }
    console.log(`[canales] ${req.method} ${soloRuta} → ${r.status} ${forma} · origen=${origen || "-"}`);
    res.statusCode = r.status;
    res.setHeader(
      "Content-Type",
      r.headers.get("content-type") || "application/json; charset=utf-8"
    );
    res.setHeader("Cache-Control", "no-store");
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.end(texto);
  } catch (e) {
    return json(res, 502, { error: "No se pudo contactar al proveedor" });
  }
}
