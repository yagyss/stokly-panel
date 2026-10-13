// ============================================================
// stokly · 🔌 Integraciones — tus canales y tu agente IA
//
//   · Conecta WhatsApp y las redes sociales con el flujo propio:
//     el cliente ve la ventana de la red (Facebook, TikTok…), nunca
//     el nombre del proveedor que va por debajo.
//   · Abajo vive el agente IA de WhatsApp (crearlo, entrenarlo,
//     límites de uso y datos en vivo del inventario).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { cuentas, perfiles, conectarRed, completarConectar, plataforma, PLATAFORMAS } from "../lib/canales.js";
import { C } from "../lib/paleta.js";
import AgenteIA from "./AgenteIA.jsx";

// Redes que se conectan con la ventana oficial de cada plataforma
const CONECTABLES = [
  "instagram", "facebook", "tiktok", "youtube", "linkedin", "twitter", "threads",
  "pinterest", "reddit", "bluesky", "googlebusiness", "telegram", "discord", "slack",
  "snapchat", "whatsapp",
];
// Estas se conectan con el selector del propio proveedor (no hay
// intercambio directo del código OAuth): se abre su página y vuelven.
const FLUJO_SELECTOR = ["facebook", "googlebusiness", "snapchat"];

// El proveedor nos devuelve al panel con #canales?…; llevamos la red
// dentro del propio enlace para no depender de la memoria del navegador.
const REDIRECCION = (id) => window.location.origin + window.location.pathname + "#canales?redes=" + id;

export default function Integraciones({ isMobile, showToast, setTab }) {
  const [cuenta, setCuenta] = useState([]);
  const [perfilId, setPerfilId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [codigoRed, setCodigoRed] = useState(null); // { code, botUsername, instructions, expiresAt }

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [p, c] = await Promise.all([perfiles(), cuentas()]);
      setPerfilId(p?.profiles?.[0]?._id || "");
      setCuenta(Array.isArray(c?.accounts) ? c.accounts : []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // El perfil se pide arriba, pero si todavía no llegó (o falló la carga)
  // lo traemos aquí: el botón "Conectar" nunca debe quedarse sin saberlo.
  const traerPerfil = useCallback(async () => {
    if (perfilId) return perfilId;
    const p = await perfiles();
    const id = p?.profiles?.[0]?._id || "";
    if (id) setPerfilId(id);
    return id;
  }, [perfilId]);

  // ── Vuelve de conectar una red (#canales?redes=instagram&code=…) ──
  //  · El `code` OAuth viaja en el propio enlace, así que no dependemos
  //    de la memoria del navegador; y si el perfil aún no cargó, lo
  //    traemos aquí antes de intercambiarlo (antes se perdía y la cuenta
  //    quedaba sin conectar, sin aviso).
  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#canales")) return;
    const params = new URLSearchParams(hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "");
    const codigo = params.get("code");
    const state = params.get("state");
    const fallo = params.get("error") || params.get("error_message");
    const redHash = params.get("redes") || "";
    const pendiente = sessionStorage.getItem("stokly_canal_pendiente") || "";
    const selector = sessionStorage.getItem("stokly_canal_selector") === "1";

    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    sessionStorage.removeItem("stokly_canal_pendiente");
    sessionStorage.removeItem("stokly_canal_selector");

    if (codigo) {
      const red = redHash || pendiente;
      (async () => {
        const pid = perfilId || await traerPerfil().catch(() => "");
        if (!red || !pid) { showToast("⚠️ No se pudo completar la conexión: vuelve a intentarlo"); return; }
        try {
          await completarConectar(red, { code: codigo, state, profileId: pid });
          showToast("✅ Canal conectado");
          cargar();
        } catch (e) {
          showToast("⚠️ " + e.message);
        }
      })();
    } else if (fallo) {
      showToast("⚠️ " + fallo);
    } else if (pendiente || redHash) {
      // Volvió sin código: en el flujo con selector la cuenta ya quedó
      // creada del lado del proveedor; en el flujo directo fue un cancelado.
      if (selector) { showToast("✅ Canal conectado"); }
      else { showToast("ℹ️ Conexión cancelada"); }
      cargar();
    }
  }, [perfilId, traerPerfil, cargar, showToast]);

  const conectar = async (id) => {
    if (id === "whatsapp") { setTab("whatsapp"); return; }
    setOcupado(id);
    try {
      // Traemos el perfil aquí mismo: así no importa si la sección
      // todavía estaba cargando cuando se pulsó el botón.
      const pid = await traerPerfil();
      if (!pid) throw new Error("No encontramos tu perfil. Pulsa ↻ Actualizar e inténtalo de nuevo.");
      const conSelector = FLUJO_SELECTOR.includes(id);
      const datos = await conectarRed(id, {
        perfilId: pid,
        redirect: REDIRECCION(id),
        hosted: false,
        ...(conSelector ? { headless: false } : {}),
      });
      const url = datos?.authUrl || datos?.url || "";

      // Telegram (y afines): no hay enlace, hay que mandarle un código al bot
      if (!url && datos?.code) {
        setCodigoRed({ ...datos, plataforma: id });
        setOcupado("");
        showToast("ℹ️ Telegram te da un código: mándaselo al bot y queda conectado");
        return;
      }
      if (!url) {
        // Algo raro devolvió la red: lo decimos con detalle para poder verlo
        const detalle = !datos ? "vacía" : typeof datos === "object" ? Object.keys(datos).join(", ") : String(datos).slice(0, 60);
        throw new Error(`La red no devolvió el enlace de conexión (respuesta: ${detalle}). Reintenta en unos segundos.`);
      }

      sessionStorage.setItem("stokly_canal_pendiente", id);
      sessionStorage.setItem("stokly_canal_selector", conSelector ? "1" : "");
      // Misma pestaña: así nunca lo bloquea el navegador (sin pop-ups)
      window.location.href = url;
    } catch (e) {
      setOcupado("");
      showToast("⚠️ " + e.message);
    }
  };

  const porPlataforma = (id) => cuenta.filter((c) => c.platform === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Canales ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>🔌 Tus canales</div>
          <button className="filter-btn" onClick={cargar}>↻ Actualizar</button>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          Cada canal conectado recibe y envía mensajes desde la pestaña <b>Mensajes</b>. Conectas con la ventana oficial de cada
          red (Facebook, TikTok, Telegram…), con tu propia cuenta.
        </div>

        {error && <div style={{ background: C.redLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: C.red, lineHeight: 1.5, marginBottom: 12 }}>{error}</div>}
        {cargando && !cuenta.length && <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Cargando canales…</div>}

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)" }}>
          {PLATAFORMAS.filter((p) => CONECTABLES.includes(p.id)).map((p) => {
            const conectadas = porPlataforma(p.id);
            const conectado = conectadas.length > 0;
            return (
              <div
                key={p.id}
                style={{
                  border: `1.5px solid ${conectado ? C.green : C.border}`,
                  background: conectado ? C.greenLight : C.white,
                  borderRadius: 18, padding: 14, minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: p.color + "1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    {p.emoji}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                </div>

                {conectado ? (
                  <div>
                    {conectadas.map((c) => (
                      <div key={c._id} style={{ fontSize: 11.5, fontWeight: 800, color: "#0B7A5B", overflowWrap: "anywhere", marginBottom: 3 }}>
                        ✓ {c.username || c.displayName || c.metadata?.displayPhoneNumber || "conectado"}
                        {c.needsReconnection && <span style={{ color: C.red }}> · hay que reconectar</span>}
                      </div>
                    ))}
                    <button className="filter-btn" style={{ marginTop: 8 }} onClick={() => { if (p.id === "whatsapp") setTab("whatsapp"); else conectar(p.id); }}>
                      ＋ Otra cuenta
                    </button>
                  </div>
                ) : (
                  <button
                    className="filter-btn"
                    onClick={() => conectar(p.id)}
                    disabled={ocupado === p.id}
                    style={{ width: "100%" }}
                    title={p.id === "whatsapp" ? "Conectar número de WhatsApp" : `Conectar ${p.nombre}`}
                  >
                    {ocupado === p.id ? "Abriendo…" : p.id === "whatsapp" ? "Conectar →" : "＋ Conectar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Telegram: en lugar de un enlace, un código para el bot */}
        {codigoRed && (
          <div style={{ marginTop: 14, background: C.bg, borderRadius: 18, padding: 16, border: `1.5px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: C.text }}>✈️ Conecta {plataforma(codigoRed.plataforma).nombre}</div>
              <button className="filter-btn" onClick={() => setCodigoRed(null)}>Cerrar</button>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
              Telegram no usa ventana de inicio de sesión: le mandas este código a su bot oficial y el canal queda solo.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ background: C.white, border: `1.5px dashed ${C.green}`, borderRadius: 12, padding: "8px 16px", fontFamily: "monospace", fontSize: 19, fontWeight: 900, color: C.text, letterSpacing: 1 }}>{codigoRed.code}</span>
              <button className="filter-btn" onClick={() => { navigator.clipboard?.writeText(codigoRed.code); showToast("📋 Código copiado"); }}>Copiar código</button>
              <a className="btn-main" style={{ padding: "8px 14px", fontSize: 12.5, textDecoration: "none" }} href={`https://t.me/${codigoRed.botUsername || ""}`} target="_blank" rel="noreferrer">
                Abrir @{codigoRed.botUsername || "bot"} ↗
              </a>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, fontWeight: 600, color: C.muted, lineHeight: 1.9 }}>
              {(Array.isArray(codigoRed.instructions) ? codigoRed.instructions : []).map((p, i) => (
                <li key={i} style={{ overflowWrap: "anywhere" }}>{String(p).split(codigoRed.code).join(`«${codigoRed.code}»`)}</li>
              ))}
            </ol>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn-main" onClick={() => { setCodigoRed(null); cargar(); }}>Ya lo hice, buscar canal →</button>
              <button className="filter-btn" onClick={() => conectar(codigoRed.plataforma)}>Pedir otro código</button>
            </div>
          </div>
        )}

        {!!cuenta.length && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: C.text, marginBottom: 6 }}>Conectadas ({cuenta.length})</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cuenta.map((c) => {
                const p = plataforma(c.platform);
                return (
                  <span key={c._id} className="pill" style={{ background: C.bg, color: C.text, fontSize: 11.5, fontWeight: 800 }}>
                    {p.emoji} {c.username || c.displayName || p.nombre}
                    {c.needsReconnection ? " · ⚠️" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Agente IA ── */}
      <AgenteIA accountId={(cuenta.find((c) => c.platform === "whatsapp") || {})._id} isMobile={isMobile} showToast={showToast} />
    </div>
  );
}
