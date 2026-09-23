import { useEffect, useState } from "react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase.js";

// ── Modal de equipo ───────────────────────────────────────────
// · el dueño invita por correo a nuevas personas
// · lista los miembros del panel y sus invitaciones pendientes
export default function TeamModal({
  user,
  activeWs,
  isOwner,
  onClose,
  showToast,
  onChanged,
}) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(null); // {type:'ok'|'error', text}

  async function load() {
    const [m, i] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", activeWs)
        .order("created_at", { ascending: true }),
      supabase
        .from("invitations")
        .select("*")
        .eq("workspace_id", activeWs)
        .order("created_at", { ascending: false }),
    ]);
    if (m.error) console.error("[stokly] miembros:", m.error.message);
    if (i.error) console.error("[stokly] invitaciones:", i.error.message);
    setMembers(m.data || []);
    setInvites(i.data || []);
  }

  useEffect(() => {
    if (activeWs) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs]);

  async function send(e) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      setHint({ type: "error", text: "Escribe un correo válido" });
      return;
    }
    setBusy(true);
    setHint(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada. Sal y vuelve a entrar");

      // 1) la función en el servidor envía el correo de invitación
      const res = await fetch(`${SUPABASE_URL}/functions/v1/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: mail,
          workspaceId: activeWs,
          redirectTo: window.location.origin,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "No se pudo enviar la invitación");

      // 2) guardamos la invitación pendiente en la base
      const already = invites.some(
        (iv) => (iv.email || "").toLowerCase() === mail && iv.status === "pending"
      );
      if (!already) {
        const { error } = await supabase.from("invitations").insert({
          workspace_id: activeWs,
          email: mail,
          created_by: user.id,
        });
        if (error && error.code !== "23505")
          console.error("[stokly] invitación:", error.message);
      }

      setEmail("");
      if (out.mode === "existing") {
        setHint({
          type: "ok",
          text: `✅ ${mail} ya tiene cuenta stokly: solo debe iniciar sesión con ese correo y verá el panel.`,
        });
      } else {
        setHint({
          type: "ok",
          text: `📧 Invitación enviada a ${mail}. Debe abrir el correo y crear su contraseña.`,
        });
      }
      showToast("✅ Invitación enviada");
      load();
    } catch (err) {
      setHint({ type: "error", text: err.message || "Error al invitar" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(iv) {
    await supabase.from("invitations").delete().eq("id", iv.id);
    load();
  }

  async function removeMember(m) {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", activeWs)
      .eq("user_id", m.user_id);
    if (error) {
      showToast("⚠️ " + error.message);
      return;
    }
    showToast("👋 Quitado del panel");
    load();
    if (m.user_id === user.id && onChanged) onChanged();
  }

  const pending = invites.filter((i) => i.status === "pending").length;
  const avatar = (txt) => (txt || "U")[0].toUpperCase();

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 19 }}>👥 Equipo del panel</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8B8FA8", fontWeight: 900 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: "#8B8FA8", fontWeight: 600, marginBottom: 18, lineHeight: 1.5 }}>
          {isOwner
            ? "Invita por correo a tu equipo: todas las personas del panel verán y editarán los mismos productos, ventas y gastos."
            : "Este panel es compartido. Solo el dueño puede invitar a más personas."}
        </div>

        {/* ── Invitar ── */}
        {isOwner && (
          <form onSubmit={send} style={{ background: "#F7F8FC", borderRadius: 18, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#8B8FA8", textTransform: "uppercase", marginBottom: 8 }}>
              Enviar invitación
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="stk-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: "1 1 200px" }}
              />
              <button className="btn-main" disabled={busy} style={{ opacity: busy ? 0.6 : 1, padding: "12px 18px" }}>
                {busy ? "Enviando…" : "📧 Invitar"}
              </button>
            </div>

            {hint && (
              <div
                style={{
                  marginTop: 10,
                  background: hint.type === "error" ? "#FFF0F0" : "#E6FAF5",
                  color: hint.type === "error" ? "#FF5A5F" : "#00A87E",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  lineHeight: 1.45,
                }}
              >
                {hint.text}
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 11, color: "#8B8FA8", fontWeight: 600, lineHeight: 1.5 }}>
              ⏱️ El correo sale al instante (el plan gratis de Supabase permite unos 3–4 correos por hora).
            </div>
          </form>
        )}

        {/* ── Miembros ── */}
        <div style={{ fontWeight: 900, fontSize: 14, margin: "6px 0 8px" }}>
          Miembros ({members.length})
        </div>
        <div className="card" style={{ padding: "4px 16px", marginBottom: 16 }}>
          {members.map((m) => (
            <div key={m.user_id} className="row-item">
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#00C896,#4A90FF)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 15 }}>
                {avatar(m.email)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.email || "—"}
                </div>
                <div style={{ fontSize: 11, color: "#8B8FA8", fontWeight: 600 }}>
                  {m.user_id === user.id ? "Tú" : "Equipo"}
                </div>
              </div>
              <span
                className="pill"
                style={{
                  background: m.role === "owner" ? "#EEF4FF" : "#F3F0FF",
                  color: m.role === "owner" ? "#4A90FF" : "#8B5CF6",
                }}
              >
                {m.role === "owner" ? "👑 Dueño" : "Miembro"}
              </span>
              {isOwner && m.role !== "owner" && (
                <button
                  onClick={() => removeMember(m)}
                  title="Quitar del panel"
                  style={{ background: "#FFF0F0", border: "none", borderRadius: 9, padding: "6px 9px", cursor: "pointer", color: "#FF5A5F", fontWeight: 900, fontSize: 12, fontFamily: "inherit" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <div style={{ padding: "14px 0", fontSize: 13, color: "#8B8FA8", fontWeight: 700 }}>
              Cargando miembros…
            </div>
          )}
        </div>

        {/* ── Invitaciones ── */}
        {isOwner && (
          <>
            <div style={{ fontWeight: 900, fontSize: 14, margin: "0 0 8px" }}>
              Invitaciones ({pending} pendientes)
            </div>
            <div className="card" style={{ padding: "4px 16px", marginBottom: 8 }}>
              {invites.map((iv) => (
                <div key={iv.id} className="row-item">
                  <div style={{ width: 36, height: 36, background: iv.status === "pending" ? "#FFF4EE" : "#E6FAF5", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                    {iv.status === "pending" ? "✉️" : "✅"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {iv.email}
                    </div>
                    <div style={{ fontSize: 11, color: "#8B8FA8", fontWeight: 600 }}>
                      {iv.created_at ? new Date(iv.created_at).toLocaleDateString("es-CO") : ""}
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{
                      background: iv.status === "pending" ? "#FFF4EE" : "#E6FAF5",
                      color: iv.status === "pending" ? "#FF8C42" : "#00A87E",
                    }}
                  >
                    {iv.status === "pending" ? "Pendiente" : "Aceptada"}
                  </span>
                  {iv.status === "pending" && (
                    <button
                      onClick={() => cancelInvite(iv)}
                      title="Cancelar invitación"
                      style={{ background: "#F7F8FC", border: "none", borderRadius: 9, padding: "6px 9px", cursor: "pointer", color: "#8B8FA8", fontWeight: 900, fontSize: 12, fontFamily: "inherit" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {invites.length === 0 && (
                <div style={{ padding: "14px 0", fontSize: 13, color: "#8B8FA8", fontWeight: 700 }}>
                  Aún no has invitado a nadie
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ background: "#EEF4FF", borderRadius: 14, padding: "12px 14px", fontSize: 12, color: "#4A90FF", fontWeight: 700, lineHeight: 1.55, marginTop: 10 }}>
          📌 <b>Cómo funciona:</b> la persona recibe un correo, crea su contraseña y al entrar
          su correo queda unido a este panel. Si ya tenía cuenta stokly, solo debe iniciar
          sesión con ese correo.
        </div>
      </div>
    </div>
  );
}
