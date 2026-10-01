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
  addedAt: r.created_at ? String(r.created_at).slice(0, 10) : "",
  barcode: r.barcode || "",
  name: r.name,
  sku: r.sku,
  brand: r.brand || "",
  color: r.color || "",
  size: r.size == null ? "" : String(r.size),
  category: r.category || "Otro",
  categoryId: r.category_id || "",
  subcategory: r.subcategory || "",
  subcategoryId: r.subcategory_id || "",
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
  category_id: p.categoryId || null,
  subcategory: p.subcategory || "",
  subcategory_id: p.subcategoryId || null,
  stock: Math.round(+p.stock) || 0,
  min_stock: Math.round(+p.minStock) || 0,
  price: +p.price || 0,
  cost: +p.cost || 0,
  sold: Math.round(+p.sold) || 0,
  emoji: p.emoji || "📦",
  barcode: p.barcode || null,
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
  dateEnd: r.date_end ? String(r.date_end).slice(0, 10) : "",
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
  date_end: e.dateEnd || null,
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

// ══════════════════════════════════════════════════════════════
//  CATEGORÍAS Y SUBCATEGORÍAS (por panel)
// ══════════════════════════════════════════════════════════════
// Catálogo inicial de Stokly para tiendas de moda. Cada panel lo
// recibe en su primera visita (si todavía no tiene categorías).
export const CATEGORIAS_BASE = [
  { name: "Ropa", subs: ["Camisetas","Blusas","Camisas","Vestidos","Conjuntos","Pantalones","Jeans","Faldas","Shorts","Bermudas","Chaquetas","Buzos y Suéteres","Ropa deportiva","Ropa interior","Pijamas","Ropa de bebé","Ropa infantil"] },
  { name: "Calzado", subs: ["Tenis","Zapatos","Sandalias","Tacones","Botas","Botines","Mocasines","Pantuflas","Chanclas","Calzado infantil"] },
  { name: "Bolsos y Carteras", subs: ["Bolsos","Carteras","Morrales","Maletines","Riñoneras","Canguros","Bolsos deportivos","Bolsos de viaje"] },
  { name: "Accesorios", subs: ["Gorras","Sombreros","Cinturones","Bufandas","Pañuelos","Guantes","Corbatas","Accesorios para el cabello"] },
  { name: "Joyería y Bisutería", subs: ["Collares","Pulseras","Aretes","Anillos","Tobilleras","Broches"] },
  { name: "Belleza y Cuidado Personal", subs: ["Perfumes","Cosméticos","Cuidado capilar","Cuidado corporal"] },
  { name: "Otros", subs: ["Otros"] },
];

const norm = (s) => String(s || "").trim().toLowerCase();

export function useCategorias(workspaceId) {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    if (!workspaceId) { setCategorias([]); setSubcategorias([]); return; }
    setCargando(true);
    setError("");
    try {
      const ver = (r) => { if (r.error) throw r.error; return r.data || []; };
      let cats = await ver(
        await supabase.from("categories").select("id,name,active").eq("workspace_id", workspaceId).order("name")
      );

      // Primera vez en este panel → sembramos el catálogo inicial de Stokly
      if (!cats.length) {
        await ver(await supabase
          .from("categories")
          .upsert(CATEGORIAS_BASE.map(c => ({ workspace_id: workspaceId, name: c.name })),
                  { onConflict: "workspace_id,name", ignoreDuplicates: true }));
        cats = await ver(
          await supabase.from("categories").select("id,name,active").eq("workspace_id", workspaceId).order("name")
        );
        const idPorNombre = {};
        cats.forEach(c => { idPorNombre[norm(c.name)] = c.id; });
        const filas = [];
        CATEGORIAS_BASE.forEach(c => (c.subs || []).forEach(s => {
          const catId = idPorNombre[norm(c.name)];
          if (catId) filas.push({ workspace_id: workspaceId, category_id: catId, name: s });
        }));
        if (filas.length) {
          await ver(await supabase
            .from("subcategories")
            .upsert(filas, { onConflict: "category_id,name", ignoreDuplicates: true }));
        }
      }

      const subs = await ver(
        await supabase.from("subcategories").select("id,category_id,name,active").eq("workspace_id", workspaceId).order("name")
      );
      setCategorias(cats);
      setSubcategorias(subs);
    } catch (e) {
      console.error("[stokly] categorías:", e.message || e);
      setError("No se pudieron cargar las categorías — revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const duplicado = (lista, nombre) => lista.some(x => norm(x.name) === norm(nombre));

  const crearCategoria = async (nombre) => {
    const n = String(nombre || "").trim();
    if (!n) return { ok: false, error: "Escribe el nombre de la categoría" };
    if (duplicado(categorias, n)) return { ok: false, error: "Ya existe una categoría con ese nombre" };
    const { data, error: err } = await supabase
      .from("categories").insert({ workspace_id: workspaceId, name: n }).select("id,name").single();
    if (err) return { ok: false, error: err.code === "23505" ? "Ya existe una categoría con ese nombre" : "No se pudo guardar — revisa tu conexión" };
    setCategorias(cs => [...cs, data].sort((a, b) => a.name.localeCompare(b.name, "es")));
    return { ok: true, id: data.id };
  };

  const crearSubcategoria = async (categoryId, nombre) => {
    const n = String(nombre || "").trim();
    if (!categoryId) return { ok: false, error: "Primero elige una categoría" };
    if (!n) return { ok: false, error: "Escribe el nombre de la subcategoría" };
    if (duplicado(subcategorias.filter(s => String(s.category_id) === String(categoryId)), n)) {
      return { ok: false, error: "Ya existe esa subcategoría en esta categoría" };
    }
    const { data, error: err } = await supabase
      .from("subcategories")
      .insert({ workspace_id: workspaceId, category_id: categoryId, name: n })
      .select("id,category_id,name").single();
    if (err) return { ok: false, error: err.code === "23505" ? "Ya existe esa subcategoría" : "No se pudo guardar — revisa tu conexión" };
    setSubcategorias(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "es")));
    return { ok: true, id: data.id };
  };

  return { categorias, subcategorias, cargando, error, crearCategoria, crearSubcategoria, recargar: cargar };
}

// ── Datos del NEGOCIO del panel: nombre + logo ────────────────────────────────
// Cada panel (negocio) guarda lo suyo: el nombre puede ser el del negocio o el
// de la persona, y el logo se ve en el panel y en el catálogo público.
// Los miembros del panel ven lo mismo (RLS: is_member).
export function useNegocio(workspaceId, nombreSugerido) {
  const [negocio, setNegocio] = useState({ name: "", logo_url: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const intentoRef = useRef(""); // panel al que ya le intentamos poner el nombre

  const cargar = async () => {
    if (!workspaceId) { setNegocio({ name: "", logo_url: "" }); return; }
    setCargando(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("workspaces").select("name,logo_url").eq("id", workspaceId).maybeSingle();
      if (err) throw err;
      const fila = { name: (data && data.name) || "", logo_url: (data && data.logo_url) || "" };
      setNegocio(fila);

      // Primera visita con nombre dado de alta en el registro → lo usamos como
      // nombre del negocio (aparece en el panel y en el catálogo).
      const sugerido = String(nombreSugerido || "").trim();
      if (sugerido && !fila.name.trim() && intentoRef.current !== workspaceId) {
        intentoRef.current = workspaceId;
        const { error: e2 } = await supabase
          .from("workspaces").upsert({ id: workspaceId, name: sugerido });
        if (e2) throw e2;
        setNegocio({ ...fila, name: sugerido });
      }
    } catch (e) {
      console.error("[stokly] negocio:", e.message || e);
      setError("No se pudo cargar el nombre y el logo del panel — revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    intentoRef.current = "";
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Guarda lo escrito en el modal "Mi negocio"
  const guardar = async (campos) => {
    if (!workspaceId) return { ok: false, error: "No hay panel activo" };
    const nombre = String((campos && campos.name) || "").trim();
    const logo = String((campos && campos.logo_url) || "").trim();
    const { error: err } = await supabase
      .from("workspaces")
      .upsert({ id: workspaceId, name: nombre, logo_url: logo });
    if (err) {
      console.error("[stokly] negocio guardar:", err.message || err);
      return { ok: false, error: "No se pudo guardar — revisa tu conexión" };
    }
    setNegocio({ name: nombre, logo_url: logo });
    return { ok: true };
  };

  return { negocio, cargando, error, guardar, recargar: cargar };
}
