// ============================================================
// stokly · 💬 WhatsApp — número conectado y plantillas de Meta
//
//   · Conecta el número con el registro oficial de Meta (la ventana
//     que se abre es de Facebook/WhatsApp, nunca de otro proveedor).
//   · Crea plantillas de mensaje y las envía a revisión de Meta:
//     mientras estén PENDING no se pueden usar, APPROVED sí.
//
// Todo sale por el proxy de stokly (src/lib/canales.js).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import {
  cuentas,
  plantillas,
  crearPlantilla,
  conectarRed,
  completarConectar,
  canales,
  perfiles,
  paramsCallback,
  limpiarUrl,
  errorAmigable,
} from "../lib/canales.js";
import { C } from "../lib/paleta.js";

const COLOR_ESTADO = {
  APPROVED: { bg: C.greenLight, color: "#0B7A5B", texto: "✅ Aprobada" },
  PENDING: { bg: C.yellowLight, color: "#B7791F", texto: "⏳ En revisión" },
  REJECTED: { bg: C.redLight, color: C.red, texto: "❌ Rechazada" },
  PAUSED: { bg: C.bg, color: C.muted, texto: "⏸ Pausada" },
  DISABLED: { bg: C.bg, color: C.muted, texto: "⏸ Desactivada" },
  IN_APPEAL: { bg: C.yellowLight, color: "#B7791F", texto: "⏳ En apelación" },
  PENDING_DELETION: { bg: C.bg, color: C.muted, texto: "Borrando" },
};

const vacio = { nombre: "", categoria: "UTILITY", idioma: "es_CO", cuerpo: "", header: "", footer: "", rta: "", urlTexto: "", url: "" };

// ── Conexión del número (popup oficial de Meta) ────────────────
const cargarScriptFacebook = () =>
  new Promise((resolve, reject) => {
    if (window.FB) return resolve();
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar el popup de Meta"));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error("El popup de Meta tardó demasiado")), 12000);
  });

export default function WhatsApp({ isMobile, showToast, setTab, negocio }) {
  const [cuentaWhats, setCuentaWhats] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [errorCuentas, setErrorCuentas] = useState("");
  const [conectando, setConectando] = useState(false);
  const [cfgMeta, setCfgMeta] = useState(null); // datos del popup oficial, cargados al abrir la sección
  const [cuentaSel, setCuentaSel] = useState("");
  const [lista, setLista] = useState([]);
  const [cargandoPl, setCargandoPl] = useState(true);
  const [errorPl, setErrorPl] = useState("");
  const [form, setForm] = useState(vacio);
  const [abriendoForm, setAbriendoForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState("");

  const cargarCuentas = useCallback(async () => {
    setCargandoCuentas(true);
    try {
      const d = await cuentas({ platform: "whatsapp" });
      const arr = Array.isArray(d?.accounts) ? d.accounts : [];
      setCuentaWhats(arr);
      setErrorCuentas("");
      setCuentaSel((prev) => prev || arr[0]?._id || "");
    } catch (e) {
      setErrorCuentas(e.message);
    } finally {
      setCargandoCuentas(false);
    }
  }, []);

  const cargarPlantillas = useCallback(
    async (silencioso = false) => {
      if (!cuentaSel) { setLista([]); setCargandoPl(false); return; }
      if (!silencioso) setCargandoPl(true);
      try {
        const d = await plantillas(cuentaSel);
        setLista(Array.isArray(d?.templates) ? d.templates : []);
        setErrorPl("");
      } catch (e) {
        if (!silencioso) { setLista([]); setErrorPl(e.message); }
      } finally {
        if (!silencioso) setCargandoPl(false);
      }
    },
    [cuentaSel]
  );

  useEffect(() => { cargarCuentas(); }, [cargarCuentas]);
  useEffect(() => { cargarPlantillas(); }, [cargarPlantillas]);

  // Volvimos de conectar el número (misma pestaña). El proveedor deja SU
  // resultado en la cadena de consulta (?connected=whatsapp o ?error=…) y
  // stokly marca la sección en el fragmento (#canales?seccion=whatsapp):
  // se leen los DOS sitios y se cuenta cómo acabó. Antes sólo se limpiaba
  // el enlace, así que si algo fallaba no había forma de enterarse.
  useEffect(() => {
    const p = paramsCallback();
    const conectado = p.get("connected");
    const codigo = p.get("code");
    const state = p.get("state");
    const fallo = p.get("error");
    const msgFallo = p.get("error_message");
    const volvimosDeConectar = conectado || codigo || fallo || (window.location.hash || "").startsWith("#canales");
    if (!volvimosDeConectar) return;
    limpiarUrl();
    if (conectado) {
      showToast("✅ Número de WhatsApp conectado: buscando la cuenta…");
      cargarCuentas();
    } else if (codigo) {
      // Volvimos con el código de Meta sin canjear (flujo headless): aquí se
      // intercambia por la conexión real. Antes este código se ignoraba y la
      // conexión quedaba muda: parecía que "WhatsApp no dejaba conectar".
      (async () => {
        const pid =
          sessionStorage.getItem("stokly_wa_perfil") ||
          (await perfiles().then((d) => d?.profiles?.[0]?._id).catch(() => ""));
        sessionStorage.removeItem("stokly_wa_perfil");
        if (!pid) {
          showToast("⚠️ No se pudo completar la conexión: vuelve a pulsar Conectar.");
          return;
        }
        try {
          await completarConectar("whatsapp", { code: codigo, state, profileId: pid });
          showToast("✅ Número de WhatsApp conectado: buscando la cuenta…");
        } catch (e) {
          showToast("⚠️ " + e.message);
        }
        cargarCuentas();
      })();
    } else if (fallo) {
      showToast("⚠️ " + errorAmigable(fallo, msgFallo));
      cargarCuentas();
    }
  }, [showToast, cargarCuentas]);

  // Traemos los datos del popup oficial de Meta sólo cuando aún no hay
  // número conectado: así, al pulsar el botón no hay que esperar nada
  // (si no, el navegador bloquea la ventana por venir de una promesa).
  useEffect(() => {
    if (cuentaWhats.length) return;
    canales("/connect/whatsapp/sdk-config")
      .then((d) => { if (d?.appId && d?.configId) setCfgMeta(d); })
      .catch(() => {});
  }, [cuentaWhats.length]);

  // Estado de las plantillas: Meta tarda hasta 24 h, así que se refresca
  useEffect(() => {
    const t = setInterval(() => { if (cuentaSel) cargarPlantillas(true); }, 45000);
    return () => clearInterval(t);
  }, [cuentaSel, cargarPlantillas]);

  // ── Conectar número (opción principal: mismo recorrido que Meta) ──
  // Va directo a la ventana de Facebook/WhatsApp EN LA MISMA PESTAÑA:
  // sin ventana emergente, que es lo que bloqueaba el recorrido antes
  // (la página auxiliar abría una ventana que el navegador rechazaba y
  // el flujo se quedaba en el paso 1 sin avanzar).
  const conectar = async () => {
    setConectando(true);
    try {
      const perfil = await perfiles();
      const perfilId = perfil?.profiles?.[0]?._id;
      if (!perfilId) throw new Error("No se encontró tu perfil");
      // Guardamos el perfil: si la vuelta trae el código de Meta en vez del
      // resultado, hay que canjearlo con este profileId.
      sessionStorage.setItem("stokly_wa_perfil", perfilId);
      const pedirEnlace = () =>
        conectarRed("whatsapp", {
          perfilId,
          // headless:false → el proveedor TERMINA la conexión en su callback
          // y al volver avisa con ?connected=whatsapp (mismo camino que
          // Facebook, que sí funcionaba). Con headless=true la vuelta traía
          // ?code=… y esta sección no lo canjeaba: todo quedaba sin avisar.
          headless: false,
          redirect: window.location.origin + window.location.pathname + "#canales?seccion=whatsapp",
        });
      let datos = await pedirEnlace();
      let url = datos?.authUrl || datos?.url || "";
      if (!url) {
        // Reintento único: el enlace a veces llega vacío por un tropiezo
        // transitorio del proveedor/rede; con esto no se nota.
        await new Promise((r) => setTimeout(r, 1200));
        datos = await pedirEnlace();
        url = datos?.authUrl || datos?.url || "";
      }
      if (!url) {
        if (datos?.error) throw new Error(errorAmigable(datos.error, datos.error_message || datos.message));
        const detalle = !datos ? "vacía" : typeof datos === "object" ? Object.keys(datos).join(", ") : String(datos).slice(0, 60);
        console.warn("[stokly] WhatsApp sin enlace de conexión:", JSON.stringify(datos).slice(0, 400));
        throw new Error(`El proveedor no devolvió el enlace de conexión (respuesta: ${detalle}). Reintenta en unos segundos.`);
      }
      // Misma pestaña: evita que el navegador bloquee nada
      window.location.href = url;
    } catch (e) {
      sessionStorage.removeItem("stokly_wa_perfil");
      setConectando(false);
      showToast("⚠️ " + e.message);
    }
  };

  // ── Conectar número (opción directa: ventana oficial de Meta) ──
  const conectarDirecto = async () => {
    setConectando(true);
    try {
      const perfil = await perfiles();
      const perfilId = perfil?.profiles?.[0]?._id;
      if (!perfilId) throw new Error("No se encontró tu perfil");
      const cfg = cfgMeta || (await canales("/connect/whatsapp/sdk-config"));
      if (!cfg?.appId || !cfg?.configId) throw new Error("Meta no está disponible ahora: usa la opción principal");
      setCfgMeta(cfg);
      await cargarScriptFacebook();
      window.FB.init({ appId: cfg.appId, cookie: false, xfbml: false, version: "v21.0" });
      window.FB.login(
        (res) => {
          setConectando(false);
          const codigo = res && res.authResponse && res.authResponse.code;
          if (!codigo) { showToast("Conexión cancelada"); return; }
          completarConectar("whatsapp", { code: codigo, profileId: perfilId })
            .then(() => { showToast("✅ Número de WhatsApp conectado"); cargarCuentas(); })
            .catch((e) => showToast("⚠️ " + e.message));
        },
        {
          config_id: cfg.configId,
          response_type: "code",
          override_default_response_type: true,
          features: ["WAEmbeddedSignup"],
          auth_type: "rerequest",
        }
      );
    } catch (e) {
      setConectando(false);
      showToast("⚠️ " + e.message);
    }
  };

  // ── Crear plantilla ────────────────────────────────────────
  const enviarPlantilla = async () => {
    const nombre = form.nombre.trim();
    const cuerpo = form.cuerpo.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(nombre)) { showToast("⚠️ El nombre va en minúsculas, sin espacios (ej: saludo_nuevo)"); return; }
    if (!cuerpo) { showToast("⚠️ Escribe el texto del mensaje"); return; }
    if (form.urlTexto.trim() && !/^https?:\/\//i.test(form.url.trim())) { showToast("⚠️ La URL del botón debe empezar por https://"); return; }

    const componentes = [];
    if (form.header.trim()) componentes.push({ type: "header", format: "text", text: form.header.trim() });
    componentes.push({ type: "body", text: cuerpo });
    if (form.footer.trim()) componentes.push({ type: "footer", text: form.footer.trim() });
    const botones = [];
    if (form.rta.trim()) botones.push({ type: "quick_reply", text: form.rta.trim() });
    if (form.urlTexto.trim() && form.url.trim()) botones.push({ type: "url", text: form.urlTexto.trim(), url: form.url.trim() });
    if (botones.length) componentes.push({ type: "buttons", buttons: botones });

    setEnviando(true);
    setOk("");
    try {
      await crearPlantilla({
        accountId: cuentaSel,
        name: nombre,
        category: form.categoria,
        language: form.idioma.trim(),
        components: componentes,
      });
      setOk(`✅ Plantilla "${nombre}" enviada a Meta para aprobación. Suele tardar hasta 24 horas.`);
      setForm(vacio);
      setAbriendoForm(false);
      cargarPlantillas();
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  const input = { width: "100%" };
  const cuentaActiva = cuentaWhats.find((c) => c._id === cuentaSel) || cuentaWhats[0];
  const calidad = cuentaActiva?.metadata?.qualityRating;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      {/* ── Número ── */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">📱 Tu número de WhatsApp</div>
        {cargandoCuentas && <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Revisando tu número…</div>}
        {errorCuentas && <div style={{ background: C.redLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: C.red, lineHeight: 1.5 }}>{errorCuentas}</div>}

        {!cargandoCuentas && !errorCuentas && cuentaWhats.length === 0 && (
          <div style={{ background: C.bg, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
              Todavía no hay ningún número conectado. Al conectarlo, WhatsApp Business quedará ligado a <b>tu negocio</b> con la
              API oficial de Meta (los mensajes salen desde tu propio número, con tus plantillas y tu agente).
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn-main" onClick={conectar} disabled={conectando} style={{ opacity: conectando ? 0.7 : 1 }}>
                {conectando ? "Abriendo WhatsApp…" : "💬 Conectar mi número"}
              </button>
              <button className="filter-btn" onClick={conectarDirecto} disabled={conectando} title="Alternativa: la ventana de Meta en una pestaña aparte (si la principal no termina)">Conexión en ventana ↗</button>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>
              Se abre Facebook/WhatsApp <b>en esta misma pestaña</b>: inicia sesión con tu cuenta, acepta los permisos y espera a que
              termine — al acabar vuelves aquí solo y el número aparece conectado. Nada de ventanas emergentes que puedan bloquearse.
            </div>
          </div>
        )}

        {cuentaWhats.map((c) => (
          <div key={c._id} className="row-item">
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "#25D3661F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💬</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: C.text }}>
                {c.metadata?.displayPhoneNumber || c.username || c.displayName || "Número de WhatsApp"}
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
                {c.displayName && c.metadata?.displayPhoneNumber ? c.displayName + " · " : ""}
                {c.needsReconnection ? "⚠️ hay que reconectarlo" : c.isActive === false ? "inactivo" : "conectado"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {calidad && (
                <span className="pill" style={{ background: calidad === "GREEN" ? C.greenLight : calidad === "RED" ? C.redLight : C.yellowLight, color: calidad === "GREEN" ? "#0B7A5B" : calidad === "RED" ? C.red : "#B7791F", fontSize: 11 }}>
                  Calidad {calidad}
                </span>
              )}
            </div>
          </div>
        ))}

        {cuentaWhats.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button className="filter-btn" onClick={conectar} disabled={conectando}>{conectando ? "Abriendo…" : "＋ Conectar otro número"}</button>
            <button className="filter-btn" onClick={() => { setCuentaSel(""); cargarCuentas(); }}>↻ Actualizar</button>
          </div>
        )}
      </div>

      {/* ── Plantillas ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>📨 Plantillas de mensaje</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="filter-btn" onClick={() => cargarPlantillas()}>↻ Revisar estado</button>
            <button className="btn-main" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => setAbriendoForm((v) => !v)}>
              {abriendoForm ? "Cerrar" : "＋ Nueva plantilla"}
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, lineHeight: 1.55, marginBottom: 14 }}>
          Las plantillas sirven para escribirle a un cliente <b>cuando ya pasaron 24 h</b> de su último mensaje. Meta las revisa
          (hasta 24 h) y queda <b>Aprobada</b>, <b>En revisión</b> o <b>Rechazada</b>.
        </div>

        {cuentaWhats.length > 1 && (
          <select className="stk-input" value={cuentaSel} onChange={(e) => setCuentaSel(e.target.value)} style={{ marginBottom: 14 }}>
            {cuentaWhats.map((c) => (
              <option key={c._id} value={c._id}>{c.metadata?.displayPhoneNumber || c.username || c.displayName || c._id}</option>
            ))}
          </select>
        )}

        {abriendoForm && (
          <div style={{ background: C.bg, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 12 }}>Nueva plantilla para Meta</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Nombre (minúsculas y guiones bajos)</div>
                <input className="stk-input" style={input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="saludo_cliente" />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Categoría</div>
                <select className="stk-input" style={input} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  <option value="UTILITY">UTILITY — utilidad (pedidos, envíos)</option>
                  <option value="MARKETING">MARKETING — promoción</option>
                  <option value="AUTHENTICATION">AUTHENTICATION — códigos</option>
                </select>
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Idioma</div>
                <select className="stk-input" style={input} value={form.idioma} onChange={(e) => setForm({ ...form, idioma: e.target.value })}>
                  <option value="es_CO">Español (Colombia)</option>
                  <option value="es">Español</option>
                  <option value="en_US">English (US)</option>
                  <option value="pt_BR">Português (Brasil)</option>
                </select>
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Encabezado (opcional)</div>
                <input className="stk-input" style={input} value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} placeholder="Tu pedido está listo" />
              </label>
            </div>
            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Mensaje (obligatorio)</div>
              <textarea className="stk-input" rows={4} style={{ ...input, resize: "vertical" }} value={form.cuerpo} onChange={(e) => setForm({ ...form, cuerpo: e.target.value })} placeholder="Hola {{1}}, tu pedido #{{2}} ya está listo para retirar." />
            </label>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 6, lineHeight: 1.5 }}>
              Si usas variables como <b>{"{{1}}"}</b>, Meta pedirá un ejemplo de cada una; si es tu primera plantilla, déjalas sin variables.
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", marginTop: 12 }}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Pie (opcional)</div>
                <input className="stk-input" style={input} value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} placeholder="stokly · tu tienda" />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Botón de respuesta rápida (opcional)</div>
                <input className="stk-input" style={input} value={form.rta} onChange={(e) => setForm({ ...form, rta: e.target.value })} placeholder="Ver mi pedido" />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>Texto del botón de enlace (opcional)</div>
                <input className="stk-input" style={input} value={form.urlTexto} onChange={(e) => setForm({ ...form, urlTexto: e.target.value })} placeholder="Ver catálogo" />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 5 }}>URL del botón</div>
                <input className="stk-input" style={input} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn-main" onClick={enviarPlantilla} disabled={enviando || !cuentaSel} style={{ opacity: enviando ? 0.7 : 1 }}>
                {enviando ? "Enviando…" : "Enviar a aprobación de Meta"}
              </button>
              <button className="btn-outline" onClick={() => { setAbriendoForm(false); setForm(vacio); }}>Cancelar</button>
            </div>
          </div>
        )}

        {ok && (
          <div style={{ background: C.greenLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 800, color: "#0B7A5B", marginBottom: 14, lineHeight: 1.5 }}>{ok}</div>
        )}

        {cargandoPl && !lista.length && <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Cargando plantillas…</div>}
        {errorPl && (
          <div style={{ background: C.redLight, borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: C.red, lineHeight: 1.5, marginBottom: 12 }}>
            {errorPl}
          </div>
        )}
        {!cargandoPl && !errorPl && !lista.length && cuentaWhats.length > 0 && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, lineHeight: 1.6 }}>
            Aún no tienes plantillas. Crea la primera con <b>＋ Nueva plantilla</b>: Meta la revisa y queda lista para usar.
          </div>
        )}
        {!cargandoPl && !lista.length && cuentaWhats.length === 0 && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, lineHeight: 1.6 }}>
            Conecta un número de WhatsApp para ver y crear plantillas.
          </div>
        )}

        {lista.map((t) => {
          const estado = COLOR_ESTADO[t.status] || { bg: C.bg, color: C.muted, texto: t.status || "—" };
          const cuerpo = (t.components || []).find((c) => String(c.type).toLowerCase() === "body");
          return (
            <div key={t.id || t.name + t.language} className="row-item">
              <div style={{ width: 40, height: 40, borderRadius: 13, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📨</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 13.5, color: C.text, overflowWrap: "anywhere" }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700 }}>
                  {t.category} · {t.language}
                  {cuerpo?.text ? ` · ${String(cuerpo.text).slice(0, 60)}${String(cuerpo.text).length > 60 ? "…" : ""}` : ""}
                </div>
              </div>
              <span className="pill" style={{ background: estado.bg, color: estado.color, fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{estado.texto}</span>
            </div>
          );
        })}
      </div>

      {/* ── Ayuda ── */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">💡 Cómo funciona</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, lineHeight: 1.7 }}>
          <b>1.</b> Conectas tu número (Meta lo verifica en su propia ventana).<br />
          <b>2.</b> Creas plantillas acá y Meta las revisa en hasta 24 h.<br />
          <b>3.</b> En <b>Mensajes</b> respondes a tus clientes; si pasaron 24 h del último mensaje de ellos, usas una plantilla
          aprobada.<br />
          <b>4.</b> Si activas el agente IA en <b>Integraciones</b>, él responde solo y stokly le pasa las tallas y fotos
          vigentes de tu inventario en el momento.
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="filter-btn" onClick={() => setTab("mensajes")}>Ir a Mensajes →</button>
        </div>
      </div>
    </div>
  );
}
