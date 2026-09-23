import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";

// ══════════════════════════════════════════════════════════════
//  SESIÓN / AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════
export function useAuth() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session || null);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    user: session?.user || null,
    session,
    initializing,
    signOut: () => supabase.auth.signOut(),
  };
}

// ══════════════════════════════════════════════════════════════
//  PANELES (workspaces) · MIEMBROS · INVITACIONES
// ══════════════════════════════════════════════════════════════
// Paneles a los que pertenece el usuario (incluye el suyo propio)
export function useMemberships(userId) {
  const [memberships, setMemberships] = useState([]);
  const [status, setStatus] = useState(userId ? "loading" : "idle");

  const refresh = async () => {
    if (!userId) {
      setMemberships([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, email, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[stokly] miembros:", error.message);
      setStatus("error");
      return;
    }
    setMemberships(data || []);
    setStatus("ready");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { memberships, status, refresh };
}

// Une al usuario a los paneles que le hayan invitado por su correo.
// Devuelve la lista de workspace_id a los que se acababa de unir.
export async function acceptPendingInvites(user) {
  const email = (user?.email || "").trim().toLowerCase();
  if (!email) return [];

  const { data, error } = await supabase
    .from("invitations")
    .select("id, workspace_id, email")
    .eq("status", "pending");
  if (error) {
    console.error("[stokly] invitaciones:", error.message);
    return [];
  }

  const mine = (data || []).filter(
    (i) => (i.email || "").trim().toLowerCase() === email
  );
  const joined = [];
  for (const inv of mine) {
    const { error: insErr } = await supabase.from("workspace_members").insert({
      workspace_id: inv.workspace_id,
      user_id: user.id,
      email,
      role: "member",
    });
    if (insErr) {
      console.error("[stokly] unirse al panel:", insErr.message);
      continue;
    }
    await supabase.from("invitations").update({ status: "accepted" }).eq("id", inv.id);
    joined.push(inv.workspace_id);
  }
  return joined;
}

// ══════════════════════════════════════════════════════════════
//  MAPEO fila de BD <-> objeto de la app
// ══════════════════════════════════════════════════════════════
export const productFromRow = (r) => ({
  id: String(r.id),
  name: r.name,
  sku: r.sku,
  brand: r.brand || "",
  color: r.color || "",
  size: r.size == null ? "" : String(r.size),
  category: r.category || "Otro",
  stock: Number(r.stock) || 0,
  minStock: Number(r.min_stock) || 0,
  price: Number(r.price) || 0,
  cost: Number(r.cost) || 0,
  sold: Number(r.sold) || 0,
  emoji: r.emoji || "📦",
  image: r.image_url || "",
});

export const productToRow = (p, uid, ws) => ({
  id: String(p.id),
  user_id: uid,
  workspace_id: ws,
  name: p.name,
  sku: p.sku,
  brand: p.brand || "",
  color: p.color || "",
  size: p.size == null ? "" : String(p.size),
  category: p.category || "Otro",
  stock: Math.round(+p.stock) || 0,
  min_stock: Math.round(+p.minStock) || 0,
  price: +p.price || 0,
  cost: +p.cost || 0,
  sold: Math.round(+p.sold) || 0,
  emoji: p.emoji || "📦",
  image_url: p.image || null,
});

export const saleFromRow = (r) => ({
  id: String(r.id),
  productId: r.product_id == null ? null : String(r.product_id),
  qty: Number(r.qty) || 0,
  total: Number(r.total) || 0,
  date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
  method: r.method || "Efectivo",
});

export const saleToRow = (s, uid, ws) => ({
  id: String(s.id),
  user_id: uid,
  workspace_id: ws,
  product_id: s.productId == null ? null : String(s.productId),
  qty: Math.round(+s.qty) || 0,
  total: +s.total || 0,
  date: s.date,
  method: s.method || "Efectivo",
});

export const expenseFromRow = (r) => ({
  id: String(r.id),
  concept: r.concept,
  amount: Number(r.amount) || 0,
  date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
  category: r.category || "Otro",
  emoji: r.emoji || "💡",
});

export const expenseToRow = (e, uid, ws) => ({
  id: String(e.id),
  user_id: uid,
  workspace_id: ws,
  concept: e.concept,
  amount: +e.amount || 0,
  date: e.date,
  category: e.category || "Otro",
  emoji: e.emoji || "💡",
});

// ══════════════════════════════════════════════════════════════
//  TABLA SINCRONIZADA
//  · carga al iniciar sesión (filtrada por panel activo)
//  · cada cambio local se calcula (altas / bajas / cambios)
//    y se guarda en Supabase en segundo plano
// ══════════════════════════════════════════════════════════════
export function useSyncedTable(table, { fromRow, toRow, onError }, userId, workspaceId) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(userId && workspaceId ? "loading" : "idle");
  const ref = useRef([]);
  const loadedFor = useRef(null);
  const key = userId && workspaceId ? userId + ":" + workspaceId : null;

  useEffect(() => {
    if (!key) {
      setStatus("idle");
      ref.current = [];
      setRows([]);
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === key) return;
    let alive = true;
    setStatus("loading");
    supabase
      .from(table)
      .select("*")
      .eq("workspace_id", workspaceId)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error("[stokly] carga de " + table, error.message);
          setStatus("error");
          return;
        }
        const mapped = (data || []).map(fromRow);
        loadedFor.current = key;
        ref.current = mapped;
        setRows(mapped);
        setStatus("ready");
      });
    return () => {
      alive = false;
    };
  }, [key, table]);

  async function persist(prev, next) {
    const prevMap = new Map(prev.map((r) => [String(r.id), r]));
    const nextIds = new Set(next.map((r) => String(r.id)));
    const inserted = next.filter((r) => !prevMap.has(String(r.id)));
    const removed = prev.filter((r) => !nextIds.has(String(r.id)));
    const updated = next.filter(
      (r) => prevMap.has(String(r.id)) && prevMap.get(String(r.id)) !== r
    );
    try {
      const up = [...inserted, ...updated].map((r) => toRow(r, userId, workspaceId));
      if (up.length) {
        const { error } = await supabase.from(table).upsert(up);
        if (error) throw error;
      }
      if (removed.length) {
        // Borrado permanente en lotes de 100 (evita URLs demasiado largas)
        const ids = removed.map((r) => String(r.id));
        for (let i = 0; i < ids.length; i += 100) {
          const { error } = await supabase
            .from(table)
            .delete()
            .in("id", ids.slice(i, i + 100));
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error("[stokly] sync " + table + ":", err.message || err);
      if (typeof onError === "function") onError("❌ No se pudo guardar en la nube — revisa tu conexión e inténtalo de nuevo.");
    }
  }

  // Acepta valor directo o función actualizadora (igual que setState)
  const apply = (updater) => {
    const prev = ref.current;
    const next = typeof updater === "function" ? updater(prev) : updater;
    ref.current = next;
    setRows(next);
    persist(prev, next);
  };

  return [rows, apply, status];
}

// Id único compatible con el PK texto de la base
export const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
