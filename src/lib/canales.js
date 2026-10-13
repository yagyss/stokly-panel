// ============================================================
// stokly · Canales (WhatsApp, redes sociales y agente IA)
//
// Todo pasa por el proxy que vive en Vercel (api/canales.js), así que
// el navegador NUNCA ve la llave del proveedor ni la palabra "Zernio":
// para el usuario esto es una función más de stokly.
//
//   canales("/inbox/conversations?limit=50")        → GET
//   canales("/whatsapp/templates", { método:"POST", cuerpo:{…} })
//
// Si algo falla lanza un Error con mensaje en español listo para mostrar.
// ============================================================
import { supabase } from "./supabase.js";

export const PROXY =
  import.meta.env.VITE_CANALES_PROXY ||
  "https://stokly-panel.vercel.app/api/canales";

const qs = (params = {}) => {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return p.length ? "?" + new URLSearchParams(p).toString() : "";
};

const mensajeDe = (d, estado) => {
  if (!d) return `El proveedor no respondió (código ${estado})`;
  if (typeof d === "string") return d;
  const candidatos = [
    d.message,
    typeof d.error === "string" ? d.error : null,
    d.error && d.error.message,
    d.error_description,
    d.detail,
    d.reason,
    Array.isArray(d.errors) ? d.errors[0]?.message || d.errors[0] : null,
    Array.isArray(d.manualSteps) && d.manualSteps[0]?.description,
  ].filter(Boolean);
  if (candidatos.length) return String(candidatos[0]);
  if (estado === 401) return "La sesión expiró: cierra sesión y vuelve a entrar";
  if (estado === 429) return "Demasiadas peticiones seguidas: espera un minuto";
  return `El proveedor respondió con error (${estado})`;
};

export async function canales(ruta, { método = "GET", cuerpo } = {}) {
  let token = "";
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || "";
  } catch {
    token = "";
  }
  if (!token) {
    const e = new Error("Tu sesión no está activa: cierra sesión y vuelve a entrar.");
    e.codigo = "sesion";
    throw e;
  }

  let r;
  try {
    r = await fetch(PROXY, {
      method: método,
      headers: {
        "x-path": ruta,
        Authorization: `Bearer ${token}`,
        ...(cuerpo ? { "Content-Type": "application/json" } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    const e = new Error("No se pudo contactar con el servidor de canales. Revisa tu conexión e inténtalo de nuevo.");
    e.codigo = "red";
    throw e;
  }

  const texto = await r.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = { mensaje: texto };
  }

  if (!r.ok) {
    const e = new Error(mensajeDe(datos, r.status));
    e.estado = r.status;
    e.datos = datos;
    throw e;
  }
  return datos;
}

// ── Perfiles y cuentas conectadas ──────────────────────────────
export const perfiles = () => canales("/profiles");
export const cuentas = (params) => canales("/accounts" + qs(params));
export const cuenta = (accountId) => canales(`/accounts/${accountId}`);

// ── Conectar una red social (flujo blanca: nunca se ve el proveedor) ──
// Devuelve la respuesta COMPLETA: para la mayoría de redes trae
// { authUrl } (hay que abrir ese enlace), pero Telegram devuelve
// { code, botUsername, instructions } (hay que enviarle el código al bot).
export const conectarRed = (plataforma, { perfilId, redirect, scopes, hosted, brandName, color, idioma } = {}) =>
  canales(
    `/connect/${plataforma}` +
      qs({
        profileId: perfilId,
        headless: hosted ? undefined : "true",
        redirect_url: redirect,
        scopes,
        // "hosted": página auxiliar con el nombre del negocio (solo WhatsApp)
        signup: hosted ? "hosted" : undefined,
        brandName,
        primaryColor: color,
        language: idioma,
      })
  );

export const urlConectar = async (plataforma, opciones) => {
  const d = await conectarRed(plataforma, opciones);
  return d?.authUrl || d?.url || "";
};
export const completarConectar = (plataforma, cuerpo) =>
  canales(`/connect/${plataforma}`, { método: "POST", cuerpo });

// ── WhatsApp: plantillas (se envían a aprobación de Meta) ─────
export const plantillas = (accountId, params) =>
  canales("/whatsapp/templates" + qs({ accountId, ...params }));
export const crearPlantilla = (cuerpo) =>
  canales("/whatsapp/templates", { método: "POST", cuerpo });

// ── Bandeja unificada ──────────────────────────────────────────
export const conversaciones = (params) => canales("/inbox/conversations" + qs(params));
export const nuevaConversacion = (cuerpo) =>
  canales("/inbox/conversations", { método: "POST", cuerpo });
export const mensajes = (conversationId, params) =>
  canales(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages` + qs(params));
export const enviarMensaje = (conversationId, cuerpo) =>
  canales(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    método: "POST",
    cuerpo,
  });
export const marcarLeido = (conversationId, cuerpo) =>
  canales(`/inbox/conversations/${encodeURIComponent(conversationId)}/read`, {
    método: "POST",
    cuerpo,
  });
export const aceptarConversacion = (conversationId, cuerpo) =>
  canales(`/inbox/conversations/${encodeURIComponent(conversationId)}/accept`, {
    método: "POST",
    cuerpo,
  });

// ── Agente IA de WhatsApp ─────────────────────────────────────
const AG = (accountId, resto = "") => `/accounts/${accountId}/business-agent${resto}`;
export const estadoAgente = (accountId) => canales(AG(accountId));
export const crearAgente = (accountId) => canales(AG(accountId, "/onboard"), { método: "POST", cuerpo: {} });
export const configurarAgente = (accountId, cuerpo) =>
  canales(AG(accountId, "/settings"), { método: "PATCH", cuerpo });
export const infoNegocio = (accountId) => canales(AG(accountId, "/business-information"));
export const guardarInfoNegocio = (accountId, cuerpo) =>
  canales(AG(accountId, "/business-information"), { método: "PUT", cuerpo });
export const faqs = (accountId) => canales(AG(accountId, "/faqs"));
export const crearFaq = (accountId, cuerpo) =>
  canales(AG(accountId, "/faqs"), { método: "POST", cuerpo });
export const borrarFaq = (accountId, faqId) =>
  canales(AG(accountId, `/faqs/${faqId}`), { método: "DELETE" });
export const skills = (accountId) => canales(AG(accountId, "/skills"));
export const crearSkill = (accountId, cuerpo) =>
  canales(AG(accountId, "/skills"), { método: "POST", cuerpo });
export const borrarSkill = (accountId, skillId) =>
  canales(AG(accountId, `/skills/${skillId}`), { método: "DELETE" });
export const permitidos = (accountId) => canales(AG(accountId, "/allowlist"));
export const permitirNumero = (accountId, cuerpo) =>
  canales(AG(accountId, "/allowlist"), { método: "POST", cuerpo });
export const quitarNumero = (accountId, entryId) =>
  canales(AG(accountId, `/allowlist/${entryId}`), { método: "DELETE" });
export const presupuesto = (accountId) => canales(AG(accountId, "/budget"));
export const guardarPresupuesto = (accountId, cuerpo) =>
  canales(AG(accountId, "/budget"), { método: "PUT", cuerpo });
export const probarAgente = (accountId, cuerpo) =>
  canales(AG(accountId, "/test-messages"), { método: "POST", cuerpo });
export const eventoAgente = (accountId, cuerpo) =>
  canales(AG(accountId, "/events"), { método: "POST", cuerpo });
export const estadoEvento = (accountId, eventId) => canales(AG(accountId, `/events/${eventId}`));

// ── Utilidades para la UI ──────────────────────────────────────
export const PLATAFORMAS = [
  { id: "whatsapp",    nombre: "WhatsApp",     emoji: "💬", color: "#25D366", msj: true },
  { id: "instagram",   nombre: "Instagram",    emoji: "📸", color: "#E1306C", msj: true },
  { id: "facebook",    nombre: "Facebook",     emoji: "👥", color: "#1877F2", msj: true },
  { id: "telegram",    nombre: "Telegram",     emoji: "✈️", color: "#229ED9", msj: true },
  { id: "twitter",     nombre: "X (Twitter)",  emoji: "𝕏",  color: "#111111", msj: true },
  { id: "tiktok",      nombre: "TikTok",       emoji: "🎵", color: "#111111", msj: false },
  { id: "youtube",     nombre: "YouTube",      emoji: "▶️", color: "#FF0000", msj: false },
  { id: "linkedin",    nombre: "LinkedIn",     emoji: "💼", color: "#0A66C2", msj: false },
  { id: "threads",     nombre: "Threads",      emoji: "@",  color: "#111111", msj: true },
  { id: "pinterest",   nombre: "Pinterest",    emoji: "📌", color: "#E60023", msj: false },
  { id: "reddit",      nombre: "Reddit",       emoji: "🤖", color: "#FF4500", msj: true },
  { id: "bluesky",     nombre: "Bluesky",      emoji: "🦋", color: "#0285FF", msj: true },
  { id: "googlebusiness", nombre: "Google Business", emoji: "📍", color: "#4285F4", msj: true },
  { id: "discord",     nombre: "Discord",      emoji: "🎮", color: "#5865F2", msj: false },
  { id: "slack",       nombre: "Slack",        emoji: "#",  color: "#4A154B", msj: false },
  { id: "snapchat",    nombre: "Snapchat",     emoji: "👻", color: "#FFFC00", msj: false },
  { id: "imessage",    nombre: "iMessage",     emoji: "💬", color: "#34C759", msj: true },
];

export const plataforma = (id) => PLATAFORMAS.find((p) => p.id === id) || { id, nombre: id, emoji: "🔗", color: "#8B8FA8" };
