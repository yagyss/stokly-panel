// ============================================================
// stokly · 📨 Mensajes — bandeja única de WhatsApp y redes sociales
//
// Trae las conversaciones de todos los canales conectados, deja leer
// el hilo completo y responder desde acá. Se actualiza sola cada 20 s
// mientras la pestaña está abierta (cuando la cerrás, deja de pedir).
//
// Cuando un cliente de WhatsApp escribe y el agente IA está activo,
// stokly le pasa al agente las tallas y fotos vigentes de lo que está
// preguntando (ver src/lib/agente-datos.js).
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import {
  conversaciones,
  mensajes,
  enviarMensaje,
  marcarLeido,
  aceptarConversacion,
  estadoAgente,
  plataforma,
} from "../lib/canales.js";
import { avisarAlAgente } from "../lib/agente-datos.js";
import { C, horaCorta } from "../lib/paleta.js";

const cajita = (color) => ({
  width: 40,
  height: 40,
  borderRadius: 13,
  background: color + "1F",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 19,
  flexShrink: 0,
});

export default function Mensajes({ products, setTab, isMobile, showToast }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState(null);
  const [hilo, setHilo] = useState([]);
  const [cargandoHilo, setCargandoHilo] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [avisoAgente, setAvisoAgente] = useState(""); // "", "ok", "no"
  const vistos = useRef(new Set());
  const estadoAgenteRef = useRef({});

  // ── Cargar la bandeja ──────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const d = await conversaciones({ limit: 50 });
      setLista(Array.isArray(d?.data) ? d.data : Array.isArray(d?.conversations) ? d.conversations : []);
      setError("");
    } catch (e) {
      if (!silencioso) setError(e.message);
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  const cargarHilo = useCallback(async (conv, silencioso = false) => {
    if (!conv) return;
    if (!silencioso) setCargandoHilo(true);
    try {
      const d = await mensajes(conv.id, { accountId: conv.accountId, sortOrder: "asc", limit: 100 });
      setHilo(Array.isArray(d?.messages) ? d.messages : []);
      marcarLeido(conv.id, { accountId: conv.accountId }).catch(() => {});
    } catch (e) {
      if (!silencioso) {
        setHilo([]);
        showToast("⚠️ " + e.message);
      }
    } finally {
      if (!silencioso) setCargandoHilo(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refresco suave mientras la pestaña está abierta
  useEffect(() => {
    const t = setInterval(() => {
      cargar(true);
      if (abierta) cargarHilo(abierta, true);
    }, 20000);
    return () => clearInterval(t);
  }, [abierta, cargar, cargarHilo]);

  // ── Avisar al agente IA con lo que pidió el cliente ────────
  const avisar = useCallback(
    async (conv, ultimo) => {
      if (!conv || conv.platform !== "whatsapp") return;
      const telefono = conv.participantId || "";
      if (!/^\+\d{7,15}$/.test(telefono)) return;
      const cuenta = conv.accountId;
      let activo = estadoAgenteRef.current[cuenta];
      if (activo === undefined) {
        try {
          const st = await estadoAgente(cuenta);
          activo = !!(st && st.onboarded && st.enabled);
        } catch {
          activo = false;
        }
        estadoAgenteRef.current[cuenta] = activo;
      }
      if (!activo) return;
      try {
        await avisarAlAgente(cuenta, { telefono, productos: products, texto: ultimo?.message || "" });
        setAvisoAgente("ok");
      } catch {
        setAvisoAgente("no");
      }
    },
    [products]
  );

  useEffect(() => {
    if (!hilo.length) return;
    const nuevos = hilo.filter((m) => m.direction === "incoming" && !vistos.current.has(m.id));
    hilo.forEach((m) => vistos.current.add(m.id));
    if (nuevos.length && abierta) avisar(abierta, nuevos[nuevos.length - 1]);
  }, [hilo, abierta, avisar]);

  const abrir = (conv) => {
    setAbierta(conv);
    setHilo([]);
    setAvisoAgente("");
    cargarHilo(conv);
  };

  const enviar = async () => {
    const t = texto.trim();
    if (!t || !abierta || enviando) return;
    setEnviando(true);
    try {
      await enviarMensaje(abierta.id, { accountId: abierta.accountId, message: t });
      setTexto("");
      await cargarHilo(abierta, true);
      showToast("✅ Mensaje enviado");
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  const aceptar = async () => {
    try {
      await aceptarConversacion(abierta.id, { accountId: abierta.accountId });
      showToast("✅ Solicitud aceptada");
      cargar(true);
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const pedir = abierta && !cargandoHilo && !enviando;

  // ── Columna: lista ────────────────────────────────────────
  const listaUI = (
    <div className="card" style={{ padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>📨 Bandeja</div>
        <button className="filter-btn" onClick={() => cargar()} title="Actualizar mensajes">↻ Actualizar</button>
      </div>

      {cargando && !lista.length && (
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, padding: "18px 4px" }}>Cargando mensajes…</div>
      )}

      {error && (
        <div style={{ background: C.redLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: C.red, lineHeight: 1.5 }}>
          {error}
          <div style={{ marginTop: 10 }}>
            <button className="filter-btn" onClick={() => cargar()}>Reintentar</button>
          </div>
        </div>
      )}

      {!cargando && !error && !lista.length && (
        <div style={{ textAlign: "center", padding: "26px 10px" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 6 }}>Aún no hay mensajes</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, lineHeight: 1.55, marginBottom: 14 }}>
            Conecta WhatsApp o tus redes en <b>Integraciones</b> y los mensajes de tus clientes van a aparecer acá.
          </div>
          <button className="btn-main" style={{ padding: "10px 18px", fontSize: 13 }} onClick={() => setTab("integraciones")}>
            Ir a Integraciones
          </button>
        </div>
      )}

      {lista.map((c) => {
        const p = plataforma(c.platform);
        const abierto = abierta?.id === c.id;
        return (
          <button
            key={c.id}
            onClick={() => abrir(c)}
            style={{
              width: "100%", display: "flex", gap: 11, alignItems: "center", textAlign: "left",
              padding: "11px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: abierto ? C.greenLight : "none", marginBottom: 2, minWidth: 0,
            }}
          >
            <div style={cajita(p.color)}>{p.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.participantName || c.participantId || "Cliente"}
                </span>
                {c.folder === "requests" && (
                  <span className="pill" style={{ background: C.yellowLight, color: "#B7791F", fontSize: 9.5, padding: "2px 7px" }}>Solicitud</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.lastMessage || "—"}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700 }}>{horaCorta(c.updatedTime)}</div>
              {c.unreadCount > 0 && (
                <span className="pill" style={{ background: C.green, color: "#fff", fontSize: 10, padding: "2px 7px", marginTop: 4, fontWeight: 900 }}>
                  {c.unreadCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  // ── Columna: hilo ─────────────────────────────────────────
  const hiloUI = abierta ? (
    <div className="card" style={{ padding: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderBottom: `1.5px solid ${C.border}`, minWidth: 0 }}>
        {isMobile && (
          <button className="filter-btn" onClick={() => setAbierta(null)} style={{ padding: "6px 10px" }} title="Volver a la bandeja">←</button>
        )}
        <div style={cajita(plataforma(abierta.platform).color)}>{plataforma(abierta.platform).emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 14.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {abierta.participantName || abierta.participantId || "Cliente"}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
            {plataforma(abierta.platform).nombre} · {abierta.accountUsername || "tu cuenta"}
          </div>
        </div>
        {abierta.folder === "requests" && (
          <button className="filter-btn active" onClick={aceptar} title="Aceptar este mensaje solicitado">Aceptar</button>
        )}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 220, maxHeight: isMobile ? "48vh" : "54vh", overflowY: "auto", background: C.bg }}>
        {cargandoHilo && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>Cargando conversación…</div>}
        {!cargandoHilo && !hilo.length && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, textAlign: "center", padding: "24px 8px", lineHeight: 1.5 }}>
            Sin mensajes en este hilo todavía.
          </div>
        )}
        {hilo.map((m) => {
          const saliente = m.direction === "outgoing";
          const fotos = (m.attachments || []).filter((a) => a && (a.type === "image" || a.type === "video") && (a.url || a.mediaUrl));
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: saliente ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "84%", minWidth: 0, background: saliente ? C.greenLight : C.white, border: `1.5px solid ${saliente ? C.green : C.border}`, borderRadius: 16, padding: "9px 12px" }}>
                {m.message && (
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {m.message}
                  </div>
                )}
                {fotos.map((a, i) => (
                  <img key={i} src={a.url || a.mediaUrl} alt="" style={{ width: "100%", maxWidth: 230, borderRadius: 12, marginTop: m.message ? 8 : 0, display: "block" }} />
                ))}
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginTop: 5, textAlign: "right" }}>{horaCorta(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        {avisoAgente === "ok" && (
          <div style={{ alignSelf: "center" }}>
            <span className="pill" style={{ background: C.purpleLight, color: C.purple, fontSize: 11, fontWeight: 800 }} title="stokly le pasó al agente las tallas y fotos vigentes de lo que pidió el cliente">
              🤖 Agente con datos en vivo
            </span>
          </div>
        )}
        {avisoAgente === "no" && (
          <div style={{ alignSelf: "center" }}>
            <span className="pill" style={{ background: C.yellowLight, color: "#B7791F", fontSize: 11, fontWeight: 800 }} title="El agente no estaba disponible para recibir los datos">
              🤖 Agente no disponible
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `1.5px solid ${C.border}`, alignItems: "center" }}>
        <input
          className="stk-input"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribe una respuesta…"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="btn-main" onClick={enviar} disabled={!pedir || !texto.trim()} style={{ opacity: !pedir || !texto.trim() ? 0.6 : 1, padding: "11px 18px" }}>
          {enviando ? "…" : "Enviar"}
        </button>
      </div>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {abierta ? hiloUI : listaUI}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 370px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
      {listaUI}
      {hiloUI || (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.muted, fontWeight: 700, fontSize: 13.5, lineHeight: 1.6 }}>
          Elegí una conversación de la izquierda para leerla y responder.
        </div>
      )}
    </div>
  );
}
