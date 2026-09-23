import { useState } from "react";
import { supabase } from "../lib/supabase.js";

// ══════════════════════════════════════════════════════════════
//  Estilos propios de la pantalla de acceso
//  (esta pantalla se pinta ANTES del CSS general de la app)
// ══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
input, button, textarea, select { font-family: inherit; }

.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 28px 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #EDF2FB 0%, #F7F8FC 45%, #E9F9F4 100%);
  font-family: 'Nunito','Segoe UI',sans-serif;
  color: #1A1A2E;
  -webkit-font-smoothing: antialiased;
}

/* ── fondos decorativos ── */
.blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; pointer-events: none; }
.blob-1 { width: 440px; height: 440px; background: #9FF3DE; top: -140px; left: -130px; animation: drift1 15s ease-in-out infinite; }
.blob-2 { width: 400px; height: 400px; background: #BDD6FF; bottom: -150px; right: -110px; animation: drift2 17s ease-in-out infinite; }
@keyframes drift1 { 0%,100% { transform: translate(0,0) } 50% { transform: translate(45px,35px) } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-45px,-30px) } }

/* ── tarjeta ── */
.auth-card {
  position: relative; z-index: 2;
  width: 100%; max-width: 1020px;
  background: #fff;
  border-radius: 30px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 34px 74px rgba(16,29,74,.15), 0 6px 16px rgba(16,29,74,.06);
  animation: rise .55s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes rise { from { opacity: 0; transform: translateY(20px) scale(.985) } to { opacity: 1; transform: none } }

/* ── panel de marca ── */
.brand {
  flex: 0 0 405px;
  position: relative; overflow: hidden;
  padding: 48px 42px;
  display: flex; flex-direction: column; gap: 26px;
  color: #fff;
  background: linear-gradient(160deg, #00C896 0%, #35B4F5 55%, #4A90FF 100%);
}
.brand::after  { content:""; position:absolute; width:330px; height:330px; border-radius:50%; background:rgba(255,255,255,.10); top:-120px; right:-130px; }
.brand::before { content:""; position:absolute; width:230px; height:230px; border-radius:50%; background:rgba(255,255,255,.09); bottom:-95px; left:-95px; }
.brand > * { position: relative; z-index: 1; }

.logo-row { display: flex; align-items: center; gap: 11px; }
.logo-sq {
  width: 44px; height: 44px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 22px; color: #fff;
  background: rgba(255,255,255,.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.35);
  backdrop-filter: blur(6px);
}
.logo-word { font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 30px; letter-spacing: -.02em; }

.brand-title { font-size: 31px; font-weight: 900; line-height: 1.18; letter-spacing: -.02em; margin-top: 14px; }
.brand-sub { font-size: 14.5px; font-weight: 600; line-height: 1.6; color: rgba(255,255,255,.88); margin-top: 12px; }

.feats { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
.feats li { display: flex; align-items: center; gap: 11px; font-size: 14.5px; font-weight: 800; color: rgba(255,255,255,.95); }
.feats .tick {
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.22);
  font-size: 13px; font-weight: 900;
}

.brand-pill {
  margin-top: auto;
  align-self: flex-start;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.3);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 12.5px; font-weight: 900; letter-spacing: .02em;
}

/* ── formulario ── */
.form { flex: 1; padding: 46px 46px 42px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.mobile-logo { display: none; align-items: center; gap: 10px; margin-bottom: 24px; }
.mobile-logo .logo-sq { width: 38px; height: 38px; font-size: 19px; border-radius: 12px; background: linear-gradient(135deg,#00C896,#4A90FF); box-shadow: 0 8px 18px rgba(0,200,150,.30); }
.mobile-logo .word { font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 25px; background: linear-gradient(135deg,#00C896,#4A90FF); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

/* selector iniciar / crear */
.seg { display: flex; background: #F1F3F9; border-radius: 15px; padding: 5px; gap: 4px; margin-bottom: 26px; }
.seg button {
  flex: 1; border: none; background: transparent;
  padding: 11px 10px; font-size: 13.5px; font-weight: 800; color: #8B8FA8;
  border-radius: 11px; cursor: pointer; transition: all .18s ease;
}
.seg button:hover { color: #5B6178; }
.seg button.active { background: #fff; color: #1A1A2E; box-shadow: 0 2px 10px rgba(16,29,74,.12); }

.title { font-size: 25px; font-weight: 900; letter-spacing: -.02em; color: #1A1A2E; }
.sub { font-size: 14px; font-weight: 600; color: #8B8FA8; margin-top: 7px; margin-bottom: 26px; }

/* campos */
.field { margin-bottom: 15px; }
.lbl { display: block; font-size: 10.5px; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; color: #8B8FA8; margin-bottom: 7px; }
.input-wrap { position: relative; }
.ico { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #A6ACC4; display: flex; pointer-events: none; transition: color .2s; }
.in {
  width: 100%;
  background: #F7F8FC;
  border: 2px solid #EAECF5;
  border-radius: 15px;
  padding: 14.5px 44px;
  font-size: 14.5px; font-weight: 600; color: #1A1A2E;
  outline: none; transition: all .2s ease;
}
.in::placeholder { color: #A6ACC4; font-weight: 500; }
.in:focus { border-color: #00C896; background: #fff; box-shadow: 0 0 0 4px rgba(0,200,150,.13); }
.input-wrap:focus-within .ico { color: #00C896; }
.in.has-eyes { padding-right: 46px; }
.eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #A6ACC4; cursor: pointer;
  display: flex; padding: 6px; border-radius: 9px; transition: all .15s;
}
.eye:hover { color: #5B6178; background: #EDF0F8; }

/* fuerza de contraseña */
.pw-row { display: flex; align-items: center; gap: 10px; margin-top: 9px; }
.pwmeter { flex: 1; height: 6px; background: #EDF0F8; border-radius: 6px; overflow: hidden; }
.pwmeter-fill { height: 100%; border-radius: 6px; transition: width .35s ease, background .35s ease; }
.pw-txt { font-size: 11px; font-weight: 900; letter-spacing: .03em; white-space: nowrap; }
.l0 { color: #FF5A5F } .l0.pwmeter-fill, .pwmeter-fill.l0 { background: #FF5A5F }
.l1 { color: #FF5A5F } .pwmeter-fill.l1 { background: #FF5A5F }
.l2 { color: #FF8C42 } .pwmeter-fill.l2 { background: #FF8C42 }
.l3 { color: #4A90FF } .pwmeter-fill.l3 { background: #4A90FF }
.l4 { color: #00C896 } .pwmeter-fill.l4 { background: #00C896 }

/* mensajes */
.msg { display: flex; gap: 9px; align-items: flex-start; border-radius: 14px; padding: 12px 14px; font-size: 13.5px; font-weight: 700; line-height: 1.5; margin-bottom: 16px; animation: nudge .3s ease; }
.msg.error { background: #FFF0F0; color: #E5484D; }
.msg.info  { background: #EEF4FF; color: #3B74E8; }
@keyframes nudge { from { opacity: 0; transform: translateY(-5px) } to { opacity: 1; transform: none } }

/* botón principal */
.btn-primary {
  width: 100%; border: none; cursor: pointer;
  border-radius: 16px; padding: 16px;
  font-size: 15px; font-weight: 900; color: #fff;
  background: linear-gradient(135deg, #00C896, #4A90FF);
  box-shadow: 0 12px 26px rgba(0,200,150,.32);
  transition: all .18s ease;
  display: flex; align-items: center; justify-content: center; gap: 9px;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(0,200,150,.38); }
.btn-primary:active:not(:disabled) { transform: scale(.985); }
.btn-primary:disabled { opacity: .75; cursor: wait; }
.spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: rot .7s linear infinite; }
@keyframes rot { to { transform: rotate(360deg) } }

/* divisor */
.divider { display: flex; align-items: center; gap: 14px; margin: 22px 0 16px; }
.divider span { flex: 1; height: 1.5px; background: #EAECF5; }
.divider b { font-size: 10.5px; font-weight: 900; letter-spacing: .12em; color: #B4B8CC; }

/* google */
.btn-google {
  width: 100%; background: #fff;
  border: 1.5px solid #E8EAF2; border-radius: 16px;
  padding: 14.5px; font-size: 14.5px; font-weight: 800; color: #1F2937;
  display: flex; align-items: center; justify-content: center; gap: 11px;
  cursor: pointer; transition: all .18s ease;
}
.btn-google:hover:not(:disabled) { border-color: #D6DAEA; box-shadow: 0 8px 20px rgba(16,29,74,.10); transform: translateY(-2px); }
.btn-google:active:not(:disabled) { transform: scale(.985); }
.btn-google:disabled { opacity: .6; cursor: wait; }

.micro { margin-top: 20px; font-size: 11.5px; font-weight: 700; color: #9AA1B8; text-align: center; line-height: 1.6; }

/* confirmación de correo */
.success { text-align: center; animation: nudge .35s ease; }
.check {
  width: 84px; height: 84px; margin: 0 auto 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #00C896, #4A90FF);
  color: #fff; font-size: 40px; font-weight: 900;
  box-shadow: 0 16px 34px rgba(0,200,150,.35);
  animation: pop .5s cubic-bezier(.2,.9,.3,1.45) both;
}
@keyframes pop { from { transform: scale(.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
.success h2 { font-size: 23px; font-weight: 900; letter-spacing: -.02em; }
.success p { font-size: 14px; font-weight: 600; color: #8B8FA8; line-height: 1.65; margin: 10px 0 24px; }
.success p b { color: #1A1A2E; font-weight: 800; word-break: break-all; }
.btn-ghost {
  width: 100%; margin-top: 10px; background: #F7F8FC;
  border: 2px solid #EAECF5; border-radius: 16px; padding: 13px;
  font-size: 14px; font-weight: 800; color: #5B6178; cursor: pointer; transition: all .15s;
}
.btn-ghost:hover { border-color: #D6DAEA; background: #fff; }

/* ── responsive ── */
@media (max-width: 940px) {
  .brand { display: none; }
  .auth-card { max-width: 470px; border-radius: 26px; }
  .mobile-logo { display: flex; }
  .form { padding: 36px 30px 32px; }
}
@media (max-width: 430px) {
  .auth-page { padding: 16px 10px; }
  .form { padding: 30px 20px 26px; }
  .title { font-size: 22px; }
  .seg button { font-size: 12.5px; padding: 10px 6px; }
}
`;

// ── iconos (SVG en línea) ────────────────────────────────────
const SV = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
};
const IconMail = () => (
  <svg {...SV}><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="m3 7 8.2 5.6a1.5 1.5 0 0 0 1.6 0L21 7" /></svg>
);
const IconLock = () => (
  <svg {...SV}><rect x="4" y="10.5" width="16" height="10.5" rx="3" /><path d="M8 10.5v-3a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.7" r="1.4" fill="currentColor" stroke="none" /></svg>
);
const IconUser = () => (
  <svg {...SV}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5" /></svg>
);
const IconEye = () => (
  <svg {...SV}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const IconEyeOff = () => (
  <svg {...SV}><path d="M3 3 21 21" /><path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3.3 3.9" /><path d="M6.6 7.9A17.4 17.4 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.8-.8" /><path d="M9.9 10a3 3 0 0 0 4.2 4.2" /></svg>
);
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

function friendly(err) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos";
  if (m.includes("already registered")) return "Ese email ya está registrado";
  if (m.includes("password")) return "La contraseña debe tener al menos 6 caracteres";
  if (m.includes("email not confirmed")) return "Confirma tu correo primero (revisa tu bandeja)";
  if (m.includes("rate limit") || m.includes("too many request"))
    return "Demasiados intentos. Espera un minuto y vuelve a intentar";
  if (m.includes("email") && (m.includes("invalid") || m.includes("format")))
    return "Ese correo no parece válido. Revísalo";
  if (m.includes("failed to fetch")) return "Sin conexión con Supabase. Revisa tu internet";
  return err?.message || "Ocurrió un error";
}

// fuerza de contraseña (0–4)
function passLevel(p) {
  let l = 0;
  if (p.length >= 6) l++;
  if (p.length >= 10) l++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) l++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) l++;
  return l;
}
const PW_LABELS = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'error'|'info', text}
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!email.trim() || !pass) {
      setMsg({ type: "error", text: "Completa email y contraseña" });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setDone(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: "error", text: friendly(err) });
    } finally {
      setBusy(false);
    }
  }

  async function withGoogle() {
    setMsg(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      setMsg({
        type: "error",
        text: "Google aún no está conectado. Actívalo en: Supabase → Authentication → Providers → Google",
      });
    }
  }

  function goSignup() { setMode("signup"); setMsg(null); setDone(false); }
  function goSignin() { setMode("signin"); setMsg(null); setDone(false); }

  const lvl = passLevel(pass);
  const isInfo = msg?.type === "info";

  return (
    <div className="auth-page">
      <style>{CSS}</style>
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-card">
        {/* ── Panel de marca (solo escritorio) ── */}
        <aside className="brand">
          <div className="logo-row">
            <div className="logo-sq">S</div>
            <span className="logo-word">stokly</span>
          </div>

          <div>
            <h2 className="brand-title">Todo tu negocio,<br />en un solo panel.</h2>
            <p className="brand-sub">
              Inventario, ventas, gastos y métricas siempre sincronizados en la nube.
            </p>
          </div>

          <ul className="feats">
            {[
              "Inventario al tiempo real",
              "Ventas y gastos siempre claros",
              "Métricas que sí se entienden",
              "Invita a tu equipo en 1 minuto",
            ].map((f) => (
              <li key={f}><span className="tick">✓</span>{f}</li>
            ))}
          </ul>

          <div className="brand-pill">✨ 100% gratis · sin tarjeta</div>
        </aside>

        {/* ── Formulario ── */}
        <main className="form">
          <div className="mobile-logo">
            <div className="logo-sq">S</div>
            <span className="word">stokly</span>
          </div>

          {done ? (
            /* ── Confirmación de correo ── */
            <div className="success">
              <div className="check">✓</div>
              <h2>Revisa tu correo</h2>
              <p>
                Enviamos un enlace de confirmación a<br />
                <b>{email}</b><br />
                Ábrelo para activar tu cuenta.
              </p>
              <button className="btn-primary" onClick={goSignin}>Volver a iniciar sesión</button>
              <button className="btn-ghost" onClick={() => { setDone(false); setEmail(""); setPass(""); }}>Usar otro correo</button>
            </div>
          ) : (
            <>
              {/* selector moderno en lugar del enlace de abajo */}
              <div className="seg">
                <button type="button" className={mode === "signin" ? "active" : ""} onClick={goSignin}>
                  Iniciar sesión
                </button>
                <button type="button" className={mode === "signup" ? "active" : ""} onClick={goSignup}>
                  Crear cuenta
                </button>
              </div>

              <h1 className="title">{mode === "signin" ? "Bienvenido de vuelta 👋" : "Crea tu cuenta gratis"}</h1>
              <p className="sub">
                {mode === "signin"
                  ? "Ingresa para ver tu panel."
                  : "En menos de un minuto lo tienes todo listo."}
              </p>

              <form onSubmit={submit} noValidate>
                {mode === "signup" && (
                  <div className="field">
                    <label className="lbl" htmlFor="au-name">Nombre</label>
                    <div className="input-wrap">
                      <span className="ico"><IconUser /></span>
                      <input
                        id="au-name" className="in" value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre" autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="lbl" htmlFor="au-email">Email</label>
                  <div className="input-wrap">
                    <span className="ico"><IconMail /></span>
                    <input
                      id="au-email" className="in" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com" autoComplete="email"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="lbl" htmlFor="au-pass">Contraseña</label>
                  <div className="input-wrap">
                    <span className="ico"><IconLock /></span>
                    <input
                      id="au-pass" className="in has-eyes"
                      type={showPass ? "text" : "password"} value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder={mode === "signin" ? "Tu contraseña" : "Mínimo 6 caracteres"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button" className="eye"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {mode === "signup" && pass.length > 0 && (
                    <div className="pw-row">
                      <div className="pwmeter">
                        <div className={`pwmeter-fill l${lvl}`} style={{ width: Math.max(12, lvl * 25) + "%" }} />
                      </div>
                      <span className={`pw-txt l${lvl}`}>{PW_LABELS[lvl]}</span>
                    </div>
                  )}
                </div>

                {msg && (
                  <div className={`msg ${isInfo ? "info" : "error"}`}>
                    <span>{isInfo ? "📧" : "⚠️"}</span>
                    <span>{msg.text}</span>
                  </div>
                )}

                <button className="btn-primary" type="submit" disabled={busy}>
                  {busy && <span className="spin" />}
                  {busy ? "Un momento…" : mode === "signin" ? "Ingresar" : "Crear mi cuenta"}
                </button>
              </form>

              <div className="divider"><span /><b>O CONTINÚA CON</b><span /></div>

              <button className="btn-google" type="button" onClick={withGoogle} disabled={busy}>
                <GoogleG /> Continuar con Google
              </button>

              <p className="micro">
                🔒 Cada cuenta tiene su panel privado.<br />
                Invita a tu equipo cuando quieras.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
