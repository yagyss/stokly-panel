// ============================================================
// stokly · Función "invite"
// Envía por correo una invitación al panel usando el servicio
// de correo de Supabase (sin servicios externos).
// Se ejecuta en el servidor: aquí vive la service_role key.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    // --- 1) ¿Quién llama? (JWT del usuario logueado) ---
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!jwt) return json({ error: "No autorizado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !user) return json({ error: "No autorizado" }, 401);

    // --- 2) Datos ---
    const { email, workspaceId, redirectTo } = await req.json();
    if (!email || !workspaceId) return json({ error: "Faltan datos" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))
      return json({ error: "Correo no válido" }, 400);

    // --- 3) ¿Es dueño del panel? ---
    const { data: member } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member || member.role !== "owner")
      return json({ error: "Solo el dueño del panel puede invitar" }, 403);

    // --- 4) Enviar invitación por correo ---
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      String(email),
      { redirectTo: redirectTo || "https://stokly-panel.vercel.app" }
    );

    // Si la cuenta ya existe, no hay que crearla: entrará con su contraseña
    if (inviteError) {
      if (/already been registered|already exists/i.test(inviteError.message))
        return json({ ok: true, mode: "existing" });
      return json({ error: inviteError.message }, 400);
    }

    return json({ ok: true, mode: "sent" });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
