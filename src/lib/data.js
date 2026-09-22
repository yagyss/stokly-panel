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
});

export const productToRow = (p, uid) => ({
  id: String(p.id),
  user_id: uid,
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
});

export const saleFromRow = (r) => ({
  id: String(r.id),
  productId: r.product_id == null ? null : String(r.product_id),
  qty: Number(r.qty) || 0,
  total: Number(r.total) || 0,
  date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
  method: r.method || "Efectivo",
});

export const saleToRow = (s, uid) => ({
  id: String(s.id),
  user_id: uid,
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

export const expenseToRow = (e, uid) => ({
  id: String(e.id),
  user_id: uid,
  concept: e.concept,
  amount: +e.amount || 0,
  date: e.date,
  category: e.category || "Otro",
  emoji: e.emoji || "💡",
});

// ══════════════════════════════════════════════════════════════
//  TABLA SINCRONIZADA
//  · carga al iniciar sesión
//  · cada cambio local se calcula (altas / bajas / cambios)
//    y se guarda en Supabase en segundo plano
// ══════════════════════════════════════════════════════════════
export function useSyncedTable(table, { fromRow, toRow }, userId) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(userId ? "loading" : "idle");
  const ref = useRef([]);
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!userId) {
      setStatus("idle");
      ref.current = [];
      setRows([]);
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === userId) return;
    let alive = true;
    setStatus("loading");
    supabase
      .from(table)
      .select("*")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error("[stokly] carga de " + table, error.message);
          setStatus("error");
          return;
        }
        const mapped = (data || []).map(fromRow);
        loadedFor.current = userId;
        ref.current = mapped;
        setRows(mapped);
        setStatus("ready");
      });
    return () => {
      alive = false;
    };
  }, [userId, table]);

  async function persist(prev, next) {
    const prevMap = new Map(prev.map((r) => [String(r.id), r]));
    const nextIds = new Set(next.map((r) => String(r.id)));
    const inserted = next.filter((r) => !prevMap.has(String(r.id)));
    const removed = prev.filter((r) => !nextIds.has(String(r.id)));
    const updated = next.filter(
      (r) => prevMap.has(String(r.id)) && prevMap.get(String(r.id)) !== r
    );
    try {
      const up = [...inserted, ...updated].map((r) => toRow(r, userId));
      if (up.length) {
        const { error } = await supabase.from(table).upsert(up);
        if (error) throw error;
      }
      if (removed.length) {
        const { error } = await supabase
          .from(table)
          .delete()
          .in("id", removed.map((r) => String(r.id)));
        if (error) throw error;
      }
    } catch (err) {
      console.error("[stokly] sync " + table + ":", err.message || err);
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
