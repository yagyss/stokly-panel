// ============================================================
// stokly · 🤖 Agente IA de WhatsApp (pestaña Integraciones)
//
//   · Crea y enciende el agente que responde a tus clientes.
//   · Entrenamiento: qué vendes, cómo envías, cómo cobras, preguntas
//     frecuentes e instrucciones con tus propias palabras.
//   · Economía: límites de turnos/tokens y lista blanca para probar
//     sin gastar; stokly le pasa tallas y fotos en vivo desde
//     Supabase solo cuando un cliente pregunta (sin catálogo en memoria).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import {
  estadoAgente,
  crearAgente,
  configurarAgente,
  infoNegocio,
  guardarInfoNegocio,
  faqs,
  crearFaq,
  borrarFaq,
  skills,
  crearSkill,
  borrarSkill,
  presupuesto,
  guardarPresupuesto,
  probarAgente,
  permitidos,
  permitirNumero,
  quitarNumero,
} from "../lib/canales.js";
import { C } from "../lib/paleta.js";

const INFO_VACIA = {
  business_description: "",
  delivery_and_shipping: "",
  purchase_info: "",
  return_policy: "",
  payment_method: "",
  contact_info: { email: "", hours_of_operation: "", address: "" },
};

const slug = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "instruccion";

const Campo = ({ label, children, ancho = "100%" }) => (
  <label style={{ display: "block", width: ancho }}>
    <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>{label}</div>
    {children}
  </label>
);

export default function AgenteIA({ accountId, isMobile, showToast }) {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const [info, setInfo] = useState(INFO_VACIA);
  const [listaFaq, setListaFaq] = useState([]);
  const [faq, setFaq] = useState({ q: "", a: "" });
  const [listaSkill, setListaSkill] = useState([]);
  const [skill, setSkill] = useState({ cuando: "", texto: "" });
  const [budgets, setBudgets] = useState([]);
  const [nuevoBudget, setNuevoBudget] = useState({ unit_type: "ai_turn", time_window: "one_day", max_budget: 30 });
  const [numeros, setNumeros] = useState([]);
  const [nuevoNumero, setNuevoNumero] = useState("");
  const [prueba, setPrueba] = useState("");
  const [respuesta, setRespuesta] = useState("");

  const recargarEstado = useCallback(async () => {
    if (!accountId) { setCargando(false); return; }
    setCargando(true);
    try {
      const st = await estadoAgente(accountId);
      setEstado(st);
      setError("");
      if (st?.onboarded) {
        const [i, f, s, b, l] = await Promise.allSettled([
          infoNegocio(accountId), faqs(accountId), skills(accountId), presupuesto(accountId), permitidos(accountId),
        ]);
        if (i.status === "fulfilled" && i.value) {
          setInfo({ ...INFO_VACIA, ...i.value, contact_info: { ...INFO_VACIA.contact_info, ...(i.value.contact_info || {}) } });
        }
        if (f.status === "fulfilled") setListaFaq(Array.isArray(f.value?.faqs) ? f.value.faqs : Array.isArray(f.value?.data) ? f.value.data : []);
        if (s.status === "fulfilled") setListaSkill(Array.isArray(s.value?.skills) ? s.value.skills : Array.isArray(s.value?.data) ? s.value.data : []);
        if (b.status === "fulfilled") setBudgets(Array.isArray(b.value?.budgets) ? b.value.budgets : []);
        if (l.status === "fulfilled") setNumeros(Array.isArray(l.value?.entries) ? l.value.entries : Array.isArray(l.value?.data) ? l.value.data : Array.isArray(l.value?.allowlist) ? l.value.allowlist : []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [accountId]);

  useEffect(() => { recargarEstado(); }, [recargarEstado]);

  const correr = async (fn, okMsg) => {
    setOcupado(true);
    try {
      const r = await fn();
      if (okMsg) showToast(okMsg);
      return r;
    } catch (e) {
      showToast("⚠️ " + e.message);
      return null;
    } finally {
      setOcupado(false);
    }
  };

  // ── Sin número conectado ───────────────────────────────────
  if (!accountId) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">🤖 Agente IA de WhatsApp</div>
        <div style={{ background: C.bg, borderRadius: 16, padding: 18, fontSize: 13, fontWeight: 700, color: C.muted, lineHeight: 1.6 }}>
          El agente responde por WhatsApp con la información de tu negocio. Para crearlo necesitas tener un número conectado en la
          pestaña <b>WhatsApp</b>.
        </div>
      </div>
    );
  }

  if (cargando && !estado) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">🤖 Agente IA de WhatsApp</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Revisando el estado del agente…</div>
      </div>
    );
  }

  const pendientes = (estado?.manualSteps || []).filter((s) => s.step === "accept_terms");
  const activo = !!estado?.enabled;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Estado y encendido ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>🤖 Agente IA de WhatsApp</div>
          <span className="pill" style={{ background: !estado?.onboarded ? C.bg : activo ? C.greenLight : C.yellowLight, color: !estado?.onboarded ? C.muted : activo ? "#0B7A5B" : "#B7791F", fontSize: 11.5, fontWeight: 900 }}>
            {!estado?.onboarded ? "Sin crear" : activo ? "🟢 Activo" : "🟡 Creado, apagado"}
          </span>
        </div>

        {error && <div style={{ background: C.redLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: C.red, lineHeight: 1.5, marginBottom: 12 }}>{error}</div>}

        {pendientes.map((s) => (
          <div key={s.step} style={{ background: C.yellowLight, borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 13, fontWeight: 700, color: "#B7791F", lineHeight: 1.55 }}>
            Meta pide aceptar los términos del agente en WhatsApp Manager.{" "}
            {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#B7791F", fontWeight: 900 }}>Abrir WhatsApp Manager ↗</a>}
          </div>
        ))}

        {!estado?.onboarded ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
              El agente contesta solo las consultas de tus clientes por WhatsApp usando lo que le enseñes acá abajo. Se crea una sola
              vez sobre tu número y después solo lo entrenas y lo enciendes.
            </div>
            <button
              className="btn-main"
              disabled={ocupado || pendientes.length > 0}
              style={{ opacity: ocupado || pendientes.length > 0 ? 0.6 : 1 }}
              onClick={() => correr(async () => { await crearAgente(accountId); await recargarEstado(); }, "✅ Agente creado")}
            >
              {ocupado ? "Creando…" : "Crear mi agente"}
            </button>
          </>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button
              className={activo ? "btn-outline" : "btn-main"}
              disabled={ocupado}
              onClick={() => correr(async () => { await configurarAgente(accountId, { rollout: { enabled: !activo } }); await recargarEstado(); }, activo ? "⏸ Agente apagado" : "✅ Agente encendido")}
            >
              {activo ? "⏸ Apagar agente" : "🟢 Encender agente"}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: C.muted }}>
              Responde a:
              <select
                className="stk-input"
                style={{ width: "auto", padding: "8px 10px", fontSize: 12.5, fontWeight: 800 }}
                value={estado?.settings?.ai_audience || "EVERYONE"}
                disabled={ocupado}
                onChange={(e) => correr(async () => { await configurarAgente(accountId, { ai_audience: e.target.value }); await recargarEstado(); })}
              >
                <option value="EVERYONE">todos mis clientes</option>
                <option value="ALLOWLISTED_ONLY">solo números de prueba</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* ── Entrenamiento: el negocio con tus palabras ── */}
      {estado?.onboarded && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title">🧠 Entrenamiento</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
            Todo lo que escribas acá es lo que el agente usa para responder. Guarda con <b>Guardar entrenamiento</b>.
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <Campo label="¿Qué vendes y cómo atiendes? (esto es lo principal)">
              <textarea className="stk-input" rows={3} style={{ resize: "vertical" }} value={info.business_description} onChange={(e) => setInfo({ ...info, business_description: e.target.value })} placeholder="Vendemos ropa deportiva. Atendemos por WhatsApp de lunes a sábado…" />
            </Campo>
            <Campo label="Envíos y entregas">
              <textarea className="stk-input" rows={3} style={{ resize: "vertical" }} value={info.delivery_and_shipping} onChange={(e) => setInfo({ ...info, delivery_and_shipping: e.target.value })} placeholder="Enviamos a todo el país con Servientrega (1–3 días) y entrega local en Cali el mismo día…" />
            </Campo>
            <Campo label="Formas de pago">
              <textarea className="stk-input" rows={2} style={{ resize: "vertical" }} value={info.payment_method} onChange={(e) => setInfo({ ...info, payment_method: e.target.value })} placeholder="Nequi, Daviplata, transferencia y contraentrega…" />
            </Campo>
            <Campo label="Cambios y devoluciones">
              <textarea className="stk-input" rows={2} style={{ resize: "vertical" }} value={info.return_policy} onChange={(e) => setInfo({ ...info, return_policy: e.target.value })} placeholder="Cambios dentro de los 30 días con etiqueta y sin uso…" />
            </Campo>
            <Campo label="Información de la compra (tallas, stock, precios)">
              <textarea className="stk-input" rows={2} style={{ resize: "vertical" }} value={info.purchase_info} onChange={(e) => setInfo({ ...info, purchase_info: e.target.value })} placeholder="Las tallas y disponibilidad las consulta en vivo con stokly…" />
            </Campo>
            <Campo label="Contacto del negocio">
              <div style={{ display: "grid", gap: 8 }}>
                <input className="stk-input" value={info.contact_info?.email || ""} onChange={(e) => setInfo({ ...info, contact_info: { ...info.contact_info, email: e.target.value } })} placeholder="hola@tutienda.com" />
                <input className="stk-input" value={info.contact_info?.hours_of_operation || ""} onChange={(e) => setInfo({ ...info, contact_info: { ...info.contact_info, hours_of_operation: e.target.value } })} placeholder="Lun a sáb, 9 a 6" />
                <input className="stk-input" value={info.contact_info?.address || ""} onChange={(e) => setInfo({ ...info, contact_info: { ...info.contact_info, address: e.target.value } })} placeholder="Dirección o ciudad" />
              </div>
            </Campo>
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn-main" disabled={ocupado} onClick={() => correr(async () => { await guardarInfoNegocio(accountId, info); showToast("✅ Entrenamiento guardado"); })}>
              {ocupado ? "Guardando…" : "💾 Guardar entrenamiento"}
            </button>
          </div>

          {/* Preguntas frecuentes */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 10 }}>❓ Preguntas frecuentes</div>
            {!listaFaq.length && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Aún no hay preguntas. Agrega las que más te hacen tus clientes.</div>}
            {listaFaq.map((f) => (
              <div key={f.id || f.faqId || f.question} className="row-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: C.text, overflowWrap: "anywhere" }}>{f.question}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, overflowWrap: "anywhere" }}>{f.answer}</div>
                </div>
                <button className="filter-btn" onClick={() => correr(async () => { await borrarFaq(accountId, f.id || f.faqId); await recargarEstado(); }, "Eliminada")}>✕</button>
              </div>
            ))}
            <div style={{ display: "grid", gap: 10, marginTop: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
              <input className="stk-input" value={faq.q} onChange={(e) => setFaq({ ...faq, q: e.target.value })} placeholder="Pregunta (ej: ¿Hacen envíos a Medellín?)" />
              <input className="stk-input" value={faq.a} onChange={(e) => setFaq({ ...faq, a: e.target.value })} placeholder="Respuesta exacta que debe dar" />
            </div>
            <button
              className="filter-btn" style={{ marginTop: 10 }} disabled={ocupado || !faq.q.trim() || !faq.a.trim()}
              onClick={() => correr(async () => { await crearFaq(accountId, { question: faq.q.trim(), answer: faq.a.trim() }); setFaq({ q: "", a: "" }); await recargarEstado(); }, "✅ Pregunta agregada")}
            >
              ＋ Agregar pregunta
            </button>
          </div>

          {/* Instrucciones */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 10 }}>📝 Instrucciones (describe qué debe hacer)</div>
            {!listaSkill.length && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 10 }}>Escribe con tus palabras cómo debe comportarse el agente.</div>}
            {listaSkill.map((s) => (
              <div key={s.id || s.title} className="row-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: C.text, overflowWrap: "anywhere" }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, overflowWrap: "anywhere" }}>{s.description}</div>
                </div>
                <span className="pill" style={{ background: s.status === "active" ? C.greenLight : C.yellowLight, color: s.status === "active" ? "#0B7A5B" : "#B7791F", fontSize: 10.5 }}>{s.status === "active" ? "activa" : "en revisión"}</span>
                <button className="filter-btn" onClick={() => correr(async () => { await borrarSkill(accountId, s.id); await recargarEstado(); }, "Eliminada")}>✕</button>
              </div>
            ))}
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <input className="stk-input" value={skill.cuando} onChange={(e) => setSkill({ ...skill, cuando: e.target.value })} placeholder="Cuándo aplicar (ej: cuando pregunten por descuentos)" />
              <textarea className="stk-input" rows={3} style={{ resize: "vertical" }} value={skill.texto} onChange={(e) => setSkill({ ...skill, texto: e.target.value })} placeholder="Qué debe hacer (ej: Solo el 10% para pedidos de más de 3 prendas; nunca ofrezcas descuentos por teléfono…)" />
            </div>
            <button
              className="filter-btn" style={{ marginTop: 10 }} disabled={ocupado || !skill.texto.trim()}
              onClick={() => correr(async () => {
                await crearSkill(accountId, {
                  title: slug(skill.cuando || skill.texto),
                  description: skill.cuando.trim() || "Instrucción personalizada",
                  skill: skill.texto.trim(),
                });
                setSkill({ cuando: "", texto: "" });
                await recargarEstado();
              }, "✅ Instrucción agregada (Meta la revisa en unos minutos)")}
            >
              ＋ Agregar instrucción
            </button>
          </div>

          {/* Datos en vivo + números de prueba */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 8 }}>📦 Datos en vivo de tu inventario</div>
            <div style={{ background: C.greenLight, borderRadius: 14, padding: 14, fontSize: 12.5, fontWeight: 700, color: "#0B7A5B", lineHeight: 1.6, marginBottom: 12 }}>
              Activado por defecto: cuando un cliente escribe, stokly le manda al agente <b>solo</b> las referencias que le
              interesan (tallas con stock y fotos), tal como están en Supabase. Así contesta con lo real y no gasta tokens
              recordando todo el catálogo.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input className="stk-input" style={{ width: 220 }} value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} placeholder="+573001234567" />
              <button
                className="filter-btn" disabled={ocupado || !/^\+\d{7,15}$/.test(nuevoNumero.trim())}
                onClick={() => correr(async () => { await permitirNumero(accountId, { phone: nuevoNumero.trim() }); setNuevoNumero(""); await recargarEstado(); }, "✅ Número agregado")}
              >
                ＋ Agregar número de prueba
              </button>
            </div>
            {!!numeros.length && (
              <div style={{ marginTop: 8 }}>
                {numeros.map((n) => (
                  <div key={n.id || n._id || n.entryId || n.phone} className="row-item">
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: C.text, overflowWrap: "anywhere" }}>{n.phone || n.phoneNumber || n.consumer || n.entryId}</div>
                    <button className="filter-btn" onClick={() => correr(async () => { await quitarNumero(accountId, n.id || n._id || n.entryId); await recargarEstado(); }, "Quitado")}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Economía */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 8 }}>💸 Límites de uso (para no gastar de más)</div>
            {!budgets.length && (
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                Sin límites: el agente responde todo lo que necesite. Si quieres un tope, ponlo acá (al llegar al tope deja de
                contestar y te avisa hasta que se renueve la ventana).
              </div>
            )}
            {budgets.map((b) => (
              <div key={b.budget_id || `${b.unit_type}-${b.time_window}`} className="row-item">
                <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: C.text }}>
                  {b.unit_type === "ai_turn" ? "Conversaciones con IA" : "Tokens"} · {Number(b.max_budget).toLocaleString("es-CO")} máx. · {b.time_window.replace("_", " ")}
                </div>
                <button className="filter-btn" onClick={() => correr(async () => { await guardarPresupuesto(accountId, { budgets: budgets.filter((x) => x !== b) }); await recargarEstado(); }, "Límite quitado")}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              <select className="stk-input" style={{ width: "auto" }} value={nuevoBudget.unit_type} onChange={(e) => setNuevoBudget({ ...nuevoBudget, unit_type: e.target.value })}>
                <option value="ai_turn">conversaciones con IA</option>
                <option value="token">tokens</option>
              </select>
              <select className="stk-input" style={{ width: "auto" }} value={nuevoBudget.time_window} onChange={(e) => setNuevoBudget({ ...nuevoBudget, time_window: e.target.value })}>
                <option value="one_day">por día</option>
                <option value="seven_days">por semana</option>
                <option value="fourteen_days">por 15 días</option>
                <option value="thirty_days">por mes</option>
              </select>
              <input className="stk-input" style={{ width: 110 }} type="number" min={1} value={nuevoBudget.max_budget} onChange={(e) => setNuevoBudget({ ...nuevoBudget, max_budget: Number(e.target.value) })} />
              <button
                className="filter-btn" disabled={ocupado || !(nuevoBudget.max_budget >= 1)}
                onClick={() => correr(async () => {
                  await guardarPresupuesto(accountId, { budgets: [...budgets, { unit_type: nuevoBudget.unit_type, time_window: nuevoBudget.time_window, max_budget: Number(nuevoBudget.max_budget) }] });
                  await recargarEstado();
                }, "✅ Límite aplicado")}
              >
                ＋ Aplicar límite
              </button>
            </div>
          </div>

          {/* Probar */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 8 }}>🧪 Probar el agente</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>
              Prueba en sandbox de Meta: no se envía a ningún cliente real ni consume tokens facturables.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="stk-input" style={{ flex: 1, minWidth: 200 }} value={prueba} onChange={(e) => setPrueba(e.target.value)} placeholder="Hola, ¿tienen el conjunto en talla M?" onKeyDown={(e) => { if (e.key === "Enter" && prueba.trim()) { e.preventDefault(); correr(async () => { const r = await probarAgente(accountId, { message: prueba.trim() }); setRespuesta(r?.agent_response || "(sin respuesta)"); }, null); } }} />
              <button
                className="btn-main" disabled={ocupado || !prueba.trim()}
                onClick={() => correr(async () => { const r = await probarAgente(accountId, { message: prueba.trim() }); setRespuesta(r?.agent_response || "(sin respuesta)"); }, null)}
              >
                {ocupado ? "…" : "Probar"}
              </button>
            </div>
            {respuesta && (
              <div style={{ background: C.bg, borderRadius: 14, padding: 14, marginTop: 10, fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {respuesta}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
