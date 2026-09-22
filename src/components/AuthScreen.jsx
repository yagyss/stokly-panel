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
          Cada usuario ve únicamente sus propios productos, ventas y gastos.
        </div>
      </form>
    </div>
  );
}
