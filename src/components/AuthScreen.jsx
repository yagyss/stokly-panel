import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F7F8FC",
  padding: 20,
  fontFamily: "'Nunito','Segoe UI',sans-serif",
};

const box = {
  background: "white",
  borderRadius: 26,
  boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
  padding: "34px 28px",
  width: "100%",
  maxWidth: 420,
};

const input = {
  background: "#F7F8FC",
  border: "2px solid #EAECF5",
  borderRadius: 14,
  padding: "13px 16px",
  fontSize: 15,
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  color: "#1A1A2E",
};

const label = {
  fontSize: 11,
  fontWeight: 800,
  color: "#8B8FA8",
  marginBottom: 6,
  textTransform: "uppercase",
  display: "block",
};

function friendly(err) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos";
  if (m.includes("already registered")) return "Ese email ya está registrado";
  if (m.includes("password")) return "La contraseña debe tener al menos 6 caracteres";
  if (m.includes("email not confirmed")) return "Confirma tu correo primero (revisa tu bandeja)";
  if (m.includes("failed to fetch"))
    return "Sin conexión con Supabase. Revisa tu internet";
  return err?.message || "Ocurrió un error";
}

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
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
        if (!data.session) {
          setDone(true);
          setMsg({
            type: "info",
            text: "📧 Te enviamos un correo para confirmar tu cuenta. Ábrelo y haz clic en el enlace.",
          });
        }
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
        text:
          "Google no está configurado todavía en Supabase. Actívalo en: Dashboard → Authentication → Providers → Google",
      });
    }
  }

  const isInfo = msg?.type === "info";

  return (
    <div style={wrap}>
      <form style={box} onSubmit={submit}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg,#00C896,#4A90FF)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "white",
              fontSize: 22,
            }}
          >
            S
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: 26,
              background: "linear-gradient(135deg,#00C896,#60A5FA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            stokly
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#8B8FA8", fontWeight: 700, marginBottom: 22 }}>
          {mode === "signin"
            ? "Ingresa a tu panel de gestión"
            : "Crea tu cuenta gratis"}
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Nombre</label>
            <input
              style={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={label}>Email</label>
          <input
            style={input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={label}>Contraseña</label>
          <input
            style={input}
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>

        {msg && (
          <div
            style={{
              background: isInfo ? "#EEF4FF" : "#FFF0F0",
              color: isInfo ? "#4A90FF" : "#FF5A5F",
              borderRadius: 12,
              padding: "11px 14px",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16,
              lineHeight: 1.45,
            }}
          >
            {msg.text}
          </div>
        )}

        {!done && (
          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              background: "#00C896",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 900,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {busy
              ? "Un momento…"
              : mode === "signin"
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </button>
        )}

        {/* ── Google ── */}
        {!done && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 14px" }}>
              <div style={{ flex: 1, height: 1, background: "#EAECF5" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#B4B8CC" }}>O CONTINÚA CON</span>
              <div style={{ flex: 1, height: 1, background: "#EAECF5" }} />
            </div>
            <button
              type="button"
              onClick={withGoogle}
              disabled={busy}
              style={{
                width: "100%",
                background: "white",
                color: "#1A1A2E",
                border: "2px solid #EAECF5",
                borderRadius: 14,
                padding: "13px 20px",
                fontSize: 14,
                fontWeight: 800,
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.7 : 1,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar con Google
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#8B8FA8", fontWeight: 700 }}>
          {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMsg(null);
              setDone(false);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#00C896",
              fontWeight: 900,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            {mode === "signin" ? "Regístrate" : "Ingresa"}
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: "#B4B8CC", fontWeight: 600, textAlign: "center", lineHeight: 1.5 }}>
          Cada cuenta tiene su propio panel. Invita a tu equipo para trabajar juntos en el mismo panel.
        </div>
      </form>
    </div>
  );
}
