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
import { cuentas, perfiles, urlConectar, completarConectar, plataforma, PLATAFORMAS } from "../lib/canales.js";
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

const REDIRECCION = () => window.location.origin + window.location.pathname + "#canales";

export default function Integraciones({ isMobile, showToast, setTab }) {
  const [cuenta, setCuenta] = useState([]);
  const [perfilId, setPerfilId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");

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

  // ── Vuelve de conectar una red (#canales?code=…&state=…) ────
  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#canales")) return;
    const params = new URLSearchParams(hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "");
    const codigo = params.get("code");
    const state = params.get("state");
    const fallo = params.get("error") || params.get("error_message");
    const plataformaOk = params.get("platform");
    const pendiente = sessionStorage.getItem("stokly_canal_pendiente") || "";
    sessionStorage.removeItem("stokly_canal_pendiente");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (codigo && pendiente && perfilId) {
      completarConectar(pendiente, { code: codigo, state, profileId: perfilId })
        .then(() => { showToast("✅ Canal conectado"); cargar(); })
        .catch((e) => showToast("⚠️ " + e.message));
    } else if (fallo) {
      showToast("⚠️ " + fallo);
    } else if (codigo || plataformaOk) {
      showToast("✅ Canal conectado");
      cargar();
    }
  }, [perfilId, cargar, showToast]);

  const conectar = async (id) => {
    if (id === "whatsapp") { setTab("whatsapp"); return; }
    if (!perfilId) { showToast("⚠️ No se encontró tu perfil"); return; }
    setOcupado(id);
    try {
      const conSelector = FLUJO_SELECTOR.includes(id);
      const url = await urlConectar(id, {
        perfilId,
        redirect: REDIRECCION(),
        hosted: false,
        ...(conSelector ? { headless: false } : {}),
      });
      if (!url) throw new Error("La plataforma no devolvió el enlace de conexión");
      if (conSelector) sessionStorage.removeItem("stokly_canal_pendiente");
      else sessionStorage.setItem("stokly_canal_pendiente", id);
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
