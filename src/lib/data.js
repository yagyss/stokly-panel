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

// ══════════════════════════════════════════════════════════════
//  🏷️ DESCUENTO DE LA VENTA (almacenamiento temporal)
//  La columna `sales.discount` todavía NO existe en la base de datos, así que
//  el valor viaja CODIFICADO dentro de `method`:
//      "Efectivo"  →  "Efectivo·dto:10000"
//  saleFromRow lo separa: en la app el método SIEMPRE se ve limpio y el
//  descuento queda guardado en la nube (sobrevive recargas y otros equipos).
//  ⚙️ Cuando exista la columna: correr
//     supabase/migrations/*_sales_discount.sql y dejar de codificar aquí
//     (lectura: si trae columna, manda la columna; si no, la de method).
// ══════════════════════════════════════════════════════════════
const RE_DESCUENTO = /^(.*?)·dto:(\d+)$/;

// "Efectivo" + 10000  →  "Efectivo·dto:10000"
const methodConDescuento = (method, discount) => {
  const base = method || "Efectivo";
  const d = Math.max(0, Math.round(Number(discount) || 0));
  return d > 0 ? `${base}·dto:${d}` : base;
};

// "Efectivo·dto:10000"  →  { method:"Efectivo", discount:10000 }
const leerMethod = (raw) => {
  const m = String(raw || "Efectivo");
  const t = m.match(RE_DESCUENTO);
  return t ? { method: t[1] || "Efectivo", discount: Number(t[2]) || 0 } : { method: m, discount: 0 };
};

// ══════════════════════════════════════════════════════════════
//  📦 CICLO DE VIDA DEL PEDIDO · MODALIDAD DE PAGO · ATRIBUCIÓN
//  Columnas nuevas desde la migración
//  supabase/migrations/20261008000001_contraentrega_atribucion.sql
//
//  REGLAS (las MISMAS en Inicio, Ventas, Finanzas, Métricas y CRM):
//   · INGRESO confirmado = status "entregado" y nada más.
//     El histórico migró con status="entregado" → ningún total viejo cambia.
//   · "Pendiente de envío" y "Enviado" NO son ingreso (aún no se cobró).
//   · "Cancelado" y "Devuelto" tampoco.
//   · Devolución parcial resta del ingreso (returned_amount).
//   · attribution vacío → en pantalla: "Sin atribuir".
//   · El stock se descuenta UNA sola vez, al registrar la venta;
//     confirmar NO vuelve a descontarlo.
// ══════════════════════════════════════════════════════════════

export const ESTADOS = [
  { id:"pendiente", label:"Pendiente de envío",  emoji:"🕓", color:"#B45309", bg:"#FEF3C7" },
  { id:"enviado",   label:"Enviado",             emoji:"🚚", color:"#2563EB", bg:"#DBEAFE" },
  { id:"entregado", label:"Entregado y cobrado", emoji:"✅", color:"#047857", bg:"#D1FAE5" },
  { id:"devuelto",  label:"Devuelto",            emoji:"↩️", color:"#B91C1C", bg:"#FEE2E2" },
  { id:"cancelado", label:"Cancelado",           emoji:"🚫", color:"#6B7280", bg:"#F3F4F6" },
];

export const MODALIDADES = [
  { id:"pagada",        label:"Venta pagada", emoji:"💵" },
  { id:"contraentrega", label:"Contraentrega", emoji:"📦" },
];

export const ATRIBUCIONES = [
  { id:"organico",   label:"Orgánico",   emoji:"🌱" },
  { id:"publicidad", label:"Publicidad", emoji:"📣" },
  { id:"web",        label:"Página web", emoji:"🌐" },
  { id:"offline",    label:"Offline",    emoji:"🚶" },
];

export const PLATAFORMAS = [
  { id:"meta",   label:"Meta (FB/IG)" },
  { id:"tiktok", label:"TikTok" },
  { id:"google", label:"Google" },
  { id:"otra",   label:"Otra" },
];

// Canal de compra: DÓNDE se concretó la venta (no confundir con la fuente)
export const CANALES_COMPRA = [
  { id:"web",         label:"Página web" },
  { id:"whatsapp",    label:"WhatsApp" },
  { id:"instagram",   label:"Instagram" },
  { id:"tienda",      label:"Tienda física" },
  { id:"marketplace", label:"Marketplace" },
  { id:"otro",        label:"Otro" },
];

export const TIPOS_DEVOLUCION = [
  { id:"logistica", label:"Logística", emoji:"🚚", desc:"El paquete regresó: se perdió, hubo error de dirección o no lo recogieron." },
  { id:"comercial", label:"Comercial", emoji:"👤", desc:"El cliente lo devolvió: talla, defecto o simplemente no le gustó." },
];

const IDS_ESTADO = ESTADOS.map(e => e.id);

export const estadoDe        = (s) => ESTADOS.find(e => e.id === (s && s.status)) || ESTADOS[2];
export const modalidadDe     = (s) => MODALIDADES.find(m => m.id === (s && s.modality)) || MODALIDADES[0];

export const etiquetaAtribucion = (s) => {
  const a = ATRIBUCIONES.find(x => x.id === (s && s.attribution));
  if (!a) return "Sin atribuir";
  if (a.id !== "publicidad") return a.label;
  const p = PLATAFORMAS.find(x => x.id === (s && s.platform));
  return `Publicidad · ${p ? p.label : (s.platform || "")}${s.campaign ? ` · ${s.campaign}` : ""}`;
};

export const etiquetaCanal = (s) => {
  const c = CANALES_COMPRA.find(x => x.id === (s && s.channel));
  return c ? c.label : "";
};

// ¿Esta venta YA es ingreso confirmado? (todo lo histórico lo es)
export const esConfirmada = (s) => {
  const st = s && s.status;
  return !st || st === "entregado";
};

// Dinero que deja ESTA venta como ingreso confirmado (0 si no está confirmada)
export const ingresoDe = (s) =>
  esConfirmada(s) ? Math.max(0, (Number(s && s.total) || 0) - (Number(s && s.returnedAmount) || 0)) : 0;

// Unidades de ESTA venta que cuentan como vendidas
export const unidadesContadas = (s) =>
  esConfirmada(s) ? Math.max(0, (Number(s && s.qty) || 0) - (Number(s && s.returnedQty) || 0)) : 0;

export const esPendienteDeCobro = (s) => {
  const st = s && s.status;
  return st === "pendiente" || st === "enviado";
};

export const ingresosPendientes = (lista) =>
  (lista || []).filter(esPendienteDeCobro).reduce((a, s) => a + (Number(s.total) || 0), 0);

export const confirmadas = (lista) => (lista || []).filter(esConfirmada);

// 🧮 Qué hay que moverle al producto cuando CAMBIA una venta
//    (confirmar, cancelar, reabrir, editar…).  {stock, sold}
//    · stock  → negativo = se reserva (descuenta); positivo = se devuelve
//    · sold   → suma/resta el contador de "vendido"
export const deltasProducto = (vieja, nueva) => {
  const n = nueva || vieja;
  const d = { stock: 0, sold: 0 };
  const cancelV = !!(vieja && vieja.status === "cancelado");
  const cancelN = !!(n && n.status === "cancelado");
  const q = Number(vieja && vieja.qty) || 0;
  if (cancelN && !cancelV) d.stock += q;   // cancelan → el stock vuelve
  if (cancelV && !cancelN) d.stock -= q;   // reabren  → vuelve a reservarse
  d.sold += unidadesContadas(n) - unidadesContadas(vieja);
  return d;
};

// 🗑️ Borrar una venta: lo que hay que regresar al producto
//    · cancelado  → su stock ya se devolvió al cancelar, no se devuelve dos veces
//    · devuelto   → las unidades devueltas YA están en el estante (restada)
//    · confirmado → vuelven todas las unidades que siguen en la venta
export const deltasBorrado = (s) => {
  const q = Number(s && s.qty) || 0;
  const r = Number(s && s.returnedQty) || 0;
  return {
    stock: (s && s.status === "cancelado") ? 0 : Math.max(0, q - r),
    sold: -unidadesContadas(s),
  };
};

export const saleFromRow = (r) => {
  const m = leerMethod(r.method);
  return {
    id: String(r.id),
    productId: r.product_id == null ? null : String(r.product_id),
    qty: Number(r.qty) || 0,
    total: Number(r.total) || 0,
    date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
    method: m.method,
    discount: m.discount || Number(r.discount) || 0,
    customerId: r.customer_id == null || r.customer_id === "" ? null : String(r.customer_id),
    // 📦 ciclo de vida del pedido (migración 20261008000001)
    modality: r.modality === "contraentrega" ? "contraentrega" : "pagada",
    status: IDS_ESTADO.includes(r.status) ? r.status : "entregado",
    confirmedAt: r.confirmed_at || "",
    confirmedBy: r.confirmed_by || "",
    returnedQty: Number(r.returned_qty) || 0,
    returnedAmount: Number(r.returned_amount) || 0,
    returnType: r.return_type || "",
    returnedAt: r.returned_at || "",
    // 🧲 atribución de la venta
    attribution: r.attribution || "",
    channel: r.channel || "",
    platform: r.platform || "",
    campaign: r.campaign || "",
  };
};

export const saleToRow = (s, uid, ws) => ({
  id: String(s.id),
  user_id: uid,
  workspace_id: ws,
  product_id: s.productId == null ? null : String(s.productId),
  qty: Math.round(+s.qty) || 0,
  total: +s.total || 0,
  date: s.date,
  method: methodConDescuento(s.method, s.discount),
  customer_id: s.customerId ? String(s.customerId) : null,
  modality: s.modality === "contraentrega" ? "contraentrega" : "pagada",
  status: IDS_ESTADO.includes(s.status) ? s.status : "entregado",
  confirmed_at: s.confirmedAt || null,
  confirmed_by: s.confirmedBy || null,
  returned_qty: Math.max(0, Math.round(+s.returnedQty) || 0),
  returned_amount: Math.max(0, +s.returnedAmount || 0),
  return_type: s.returnType || null,
  returned_at: s.returnedAt || null,
  returned_by: s.returnedBy || null,
  attribution: s.attribution || null,
  channel: s.channel || null,
  platform: s.platform || null,
  campaign: s.campaign || null,
});

// ══════════════════════════════════════════════════════════════
//  CLIENTES (CRM) — fichas por panel
// ══════════════════════════════════════════════════════════════
export const customerFromRow = (r) => ({
  id: String(r.id),
  name: r.name || "",
  city: r.city || "",
  phone: r.phone || "",
  email: r.email || "",
  notes: r.notes || "",
  createdAt: r.created_at || "",
  // 🧲 de dónde salió el cliente (fuente) y por dónde compra (canal)
  attribution: r.attribution || "",
  channel: r.channel || "",
});

export const customerToRow = (c, uid, ws) => ({
  id: String(c.id),
  user_id: uid,
  workspace_id: ws,
  name: c.name,
  city: c.city || "",
  phone: c.phone || "",
  email: c.email || "",
  notes: c.notes || "",
  attribution: c.attribution || null,
  channel: c.channel || null,
});

export const expenseFromRow = (r) => ({
  id: String(r.id),
  concept: r.concept,
  amount: Number(r.amount) || 0,
  date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
  dateEnd: r.date_end ? String(r.date_end).slice(0, 10) : "",
  category: r.category || "Otro",
  emoji: r.emoji || "💡",
  // 📣 gasto publicitario: plataforma y campaña (se cuenta UNA sola vez)
  platform: r.platform || "",
  campaign: r.campaign || "",
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
  platform: e.platform || null,
  campaign: e.campaign || null,
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
//  CATEGORÍAS (por panel)
// ══════════════════════════════════════════════════════════════
// Catálogo inicial de Stokly para tiendas de moda. Cada panel lo
// recibe en su primera visita (si todavía no tiene categorías).
// NOTA: la subcategoría se quitó de la app; la tabla `subcategories`
// y los datos que ya existen se conservan en la base de datos.
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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    if (!workspaceId) { setCategorias([]); return; }
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
      }

      setCategorias(cats);
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

  return { categorias, cargando, error, crearCategoria, recargar: cargar };
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
