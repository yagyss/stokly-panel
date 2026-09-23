import { useState, useEffect, useRef, Fragment } from "react";
import { uploadProductImage } from "./lib/image.js";
import AuthScreen from "./components/AuthScreen.jsx";
import TeamModal from "./components/TeamModal.jsx";
import {
  useAuth,
  useSyncedTable,
  useMemberships,
  acceptPendingInvites,
  productFromRow,
  productToRow,
  saleFromRow,
  saleToRow,
  expenseFromRow,
  expenseToRow,
  newId,
} from "./lib/data.js";

const C = {
  bg: "#F7F8FC", white: "#FFFFFF", text: "#1A1A2E", muted: "#8B8FA8", border: "#EAECF5",
  green: "#00C896", greenLight: "#E6FAF5", red: "#FF5A5F", redLight: "#FFF0F0",
  blue: "#4A90FF", blueLight: "#EEF4FF", orange: "#FF8C42", orangeLight: "#FFF4EE",
  purple: "#8B5CF6", purpleLight: "#F3F0FF", yellow: "#FFB800", yellowLight: "#FFFBEB",
  teal: "#06B6D4", tealLight: "#E0F7FA",
  sidebar: "#1A1A2E", sidebarBorder: "rgba(255,255,255,0.08)",
};

const TABS = [
  { id: "home",      label: "Inicio",     emoji: "🏠", desc: "Resumen general" },
  { id: "inventory", label: "Inventario", emoji: "📦", desc: "Productos y stock" },
  { id: "sales",     label: "Ventas",     emoji: "💰", desc: "Registro de ventas" },
  { id: "expenses",  label: "Gastos",     emoji: "💸", desc: "Control de gastos" },
  { id: "finance",   label: "Finanzas",   emoji: "📈", desc: "Flujo de caja" },
  { id: "metrics",   label: "Métricas",   emoji: "📊", desc: "Análisis avanzado" },
];

const COLOR_CSS = {
  blanco:"#F0F0F0", negro:"#1C1C1E", rojo:"#EF4444", azul:"#3B82F6", verde:"#10B981",
  amarillo:"#F59E0B", gris:"#9CA3AF", khaki:"#B5A642", naranja:"#F97316", morado:"#8B5CF6",
  rosa:"#EC4899", café:"#92400E", marrón:"#92400E", beige:"#D4C5A9",
};
const getColorCSS = (name) => COLOR_CSS[name?.toLowerCase()] || "#CBD5E1";

const INIT_PRODUCTS = [
  { id:1,  name:"Camiseta Básica", sku:"CAM-001", brand:"Nike",    color:"Blanco", size:"M",     stock:45, minStock:10, price:45000,  cost:22000,  sold:120, category:"Ropa",      emoji:"👕" },
  { id:2,  name:"Camiseta Básica", sku:"CAM-002", brand:"Nike",    color:"Negro",  size:"L",     stock:8,  minStock:10, price:45000,  cost:22000,  sold:98,  category:"Ropa",      emoji:"👕" },
  { id:3,  name:"Camiseta Básica", sku:"CAM-003", brand:"Nike",    color:"Rojo",   size:"S",     stock:3,  minStock:5,  price:45000,  cost:22000,  sold:60,  category:"Ropa",      emoji:"👕" },
  { id:4,  name:"Camiseta Básica", sku:"CAM-004", brand:"Nike",    color:"Blanco", size:"L",     stock:18, minStock:5,  price:45000,  cost:22000,  sold:80,  category:"Ropa",      emoji:"👕" },
  { id:5,  name:"Pantalón Cargo",  sku:"PAN-001", brand:"Adidas",  color:"Khaki",  size:"32",    stock:3,  minStock:5,  price:120000, cost:65000,  sold:45,  category:"Ropa",      emoji:"👖" },
  { id:6,  name:"Pantalón Cargo",  sku:"PAN-002", brand:"Adidas",  color:"Negro",  size:"34",    stock:12, minStock:5,  price:120000, cost:65000,  sold:38,  category:"Ropa",      emoji:"👖" },
  { id:7,  name:"Pantalón Cargo",  sku:"PAN-003", brand:"Adidas",  color:"Khaki",  size:"30",    stock:0,  minStock:5,  price:120000, cost:65000,  sold:55,  category:"Ropa",      emoji:"👖" },
  { id:8,  name:"Sneaker Urban",   sku:"ZAP-001", brand:"Vans",    color:"Blanco", size:"42",    stock:15, minStock:8,  price:280000, cost:140000, sold:67,  category:"Calzado",   emoji:"👟" },
  { id:9,  name:"Sneaker Urban",   sku:"ZAP-002", brand:"Vans",    color:"Rojo",   size:"41",    stock:2,  minStock:5,  price:280000, cost:140000, sold:89,  category:"Calzado",   emoji:"👟" },
  { id:10, name:"Sneaker Urban",   sku:"ZAP-003", brand:"Vans",    color:"Negro",  size:"43",    stock:7,  minStock:5,  price:280000, cost:140000, sold:44,  category:"Calzado",   emoji:"👟" },
  { id:11, name:"Hoodie Premium",  sku:"HOO-001", brand:"Champion",color:"Gris",   size:"XL",    stock:22, minStock:8,  price:180000, cost:90000,  sold:55,  category:"Ropa",      emoji:"🧥" },
  { id:12, name:"Hoodie Premium",  sku:"HOO-002", brand:"Champion",color:"Negro",  size:"M",     stock:4,  minStock:8,  price:180000, cost:90000,  sold:70,  category:"Ropa",      emoji:"🧥" },
  { id:13, name:"Gorra Snapback",  sku:"GOR-001", brand:"New Era", color:"Azul",   size:"Único", stock:30, minStock:5,  price:85000,  cost:40000,  sold:200, category:"Accesorios",emoji:"🧢" },
  { id:14, name:"Gorra Snapback",  sku:"GOR-002", brand:"New Era", color:"Negro",  size:"Único", stock:12, minStock:5,  price:85000,  cost:40000,  sold:150, category:"Accesorios",emoji:"🧢" },
];
const INIT_SALES = [
  { id:1,productId:13,qty:5,total:425000,date:"2025-02-01",method:"Efectivo" },
  { id:2,productId:8, qty:1,total:280000,date:"2025-02-05",method:"Tarjeta" },
  { id:3,productId:1, qty:2,total:90000, date:"2025-02-10",method:"Nequi" },
  { id:4,productId:9, qty:1,total:280000,date:"2025-02-14",method:"Tarjeta" },
  { id:5,productId:11,qty:3,total:540000,date:"2025-02-18",method:"Transferencia" },
  { id:6,productId:5, qty:2,total:240000,date:"2025-02-22",method:"Efectivo" },
];
const INIT_EXPENSES = [
  { id:1,concept:"Compra Nike x20",      amount:440000, date:"2025-02-03",category:"Compras",    emoji:"🛍️" },
  { id:2,concept:"Arriendo local",        amount:1200000,date:"2025-02-01",category:"Operacional",emoji:"🏪" },
  { id:3,concept:"Publicidad Instagram",  amount:150000, date:"2025-02-15",category:"Marketing",  emoji:"📱" },
  { id:4,concept:"Pauta Facebook Ads",    amount:200000, date:"2025-02-20",category:"Marketing",  emoji:"📱" },
  { id:5,concept:"Servicios públicos",    amount:85000,  date:"2025-02-05",category:"Operacional",emoji:"💡" },
];

const fmt  = (n) => "$" + Number(Math.round(n)).toLocaleString("es-CO");
const pct  = (a,b) => b ? Math.round((a/b)*100) : 0;
const catEmoji = { Ropa:"👕", Calzado:"👟", Accesorios:"🧢", Otro:"📦" };

function groupProducts(products) {
  const g = {};
  for (const p of products) {
    const k = `${p.name}__${p.brand}`;
    if (!g[k]) g[k] = { name:p.name, brand:p.brand, emoji:p.emoji, category:p.category, price:p.price, cost:p.cost, image:p.image||"", variants:[] };
    if (!g[k].image && p.image) g[k].image = p.image;
    g[k].variants.push(p);
  }
  return Object.values(g);
}

function stockStatus(stock, minStock) {
  if (stock === 0)          return { color:C.red,    bg:C.redLight,    dot:"🔴", label:"Agotado" };
  if (stock <= minStock)    return { color:C.orange,  bg:C.orangeLight, dot:"🟠", label:"Bajo" };
  if (stock <= minStock*2)  return { color:C.yellow,  bg:C.yellowLight, dot:"🟡", label:"Normal" };
  return                           { color:C.green,   bg:C.greenLight,  dot:"🟢", label:"OK" };
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const parseCSV = (text) => {
  const lines = text.trim().split("\n").map(l=>l.replace(/\r/g,""));
  if (lines.length < 2) return [];
  // Detecta el separador: tab, punto y coma (Excel español) o coma
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  // Divide una línea respetando campos entre comillas (permite comas dentro de valores)
  const splitLine = (line) => { const out=[]; let cur=""; let q=false;
    for (let i=0;i<line.length;i++){ const ch=line[i];
      if (q){ if (ch==='"'){ if (line[i+1]==='"'){ cur+='"'; i++; } else { q=false; } } else { cur+=ch; } }
      else { if (ch==='"'){ q=true; } else if (ch===delim){ out.push(cur); cur=""; } else { cur+=ch; } }
    } out.push(cur); return out; };
  const headers = splitLine(lines[0]).map(h=>h.replace(/"/g,"").trim().toLowerCase());
  const colMap = { nombre:["nombre","name","producto"], sku:["sku","código","ref"], brand:["marca","brand"], color:["color"], size:["talla","size"], category:["categoría","categoria"], stock:["stock","cantidad"], minStock:["stock mínimo","min stock","mínimo"], price:["precio venta","precio","price"], cost:["costo","cost"], image:["imagen","foto","image"] };
  const findCol = k => { for (const v of (colMap[k]||[k])) { const i = headers.findIndex(h=>h.includes(v)); if (i!==-1) return i; } return -1; };
  const cols = {}; for (const k of Object.keys(colMap)) cols[k] = findCol(k);
  return lines.slice(1).filter(l=>l.trim()).map((line,i) => {
    const vals = splitLine(line).map(v=>v.replace(/"/g,"").trim());
    const get = k => cols[k]!==-1 ? (vals[cols[k]]||"") : "";
    const name=get("nombre"),sku=get("sku"),stockRaw=get("stock");
    if (!name||!sku||!stockRaw) return null;
    const category=get("category")||"Otro";
    return { id:newId(),name,sku,brand:get("brand")||"",color:get("color")||"",size:get("size")||"",category,stock:parseInt(stockRaw)||0,minStock:parseInt(get("minStock"))||5,price:parseFloat(get("price").replace(/[^0-9.]/g,""))||0,cost:parseFloat(get("cost").replace(/[^0-9.]/g,""))||0,sold:0,emoji:catEmoji[category]||"📦",image:get("image")||"" };
  }).filter(Boolean);
};

// ── Fechas locales (evita el salto de día de toISOString en UTC-5) ────────────
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const sumarDiasISO = (iso, n) => { const [y,m,d] = String(iso).split("-").map(Number); const dt = new Date(y, m-1, d + n); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`; };
const restarDiasISO = (n) => sumarDiasISO(hoyISO(), -n);
const dmISO = (iso) => { const p = String(iso||"").split("-"); return p.length === 3 ? `${Number(p[2])}/${Number(p[1])}` : "…"; };

// Enlace de Google Drive → URL directa que sí carga como foto (https://lh3…)
const normalizarFotoURL = (v) => {
  const s = String(v || "").trim();
  if (!/^https?:\/\//i.test(s)) return "";
  const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|[?&]id=)([a-zA-Z0-9-_]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  return s;
};

// ── Filtros por rango de tiempo (Ventas / Gastos / Finanzas) ─────────────────
const RANGOS = [
  { id:"todo", label:"Todo" }, { id:"dia", label:"Día" }, { id:"semana", label:"Semana" }, { id:"d15", label:"15 días" },
  { id:"mes", label:"Mes" }, { id:"trim", label:"Trimestre" }, { id:"m6", label:"6 meses" }, { id:"an", label:"Año" },
  { id:"custom", label:"Personalizado" },
];
const RANGO_DIAS = { dia:0, semana:6, d15:14, mes:29, trim:89, m6:179, an:364 };
function rangoAFechas(r) {
  if (!r || r.id === "todo") return { from:null, to:null };
  if (r.id === "custom") return { from: r.from || null, to: r.to || null };
  return { from: restarDiasISO(RANGO_DIAS[r.id] || 0), to: hoyISO() };
}
const rangoLabel = (r) => r.id === "custom" ? `${r.from || "…"} → ${r.to || "…"}` : ((RANGOS.find(x => x.id === r.id) || {}).label || "");
// Ventas: la fecha cae dentro del rango
function enRango(fecha, rango) {
  const { from, to } = rangoAFechas(rango);
  if (!from && !to) return true;
  const f = fecha || hoyISO();
  if (from && f < from) return false;
  if (to && f > to) return false;
  return true;
}
// Gastos: pueden tener rango propio (date → dateEnd); basta con que SE CRUCEN
function solapaRango(e, rango) {
  const { from, to } = rangoAFechas(rango);
  if (!from && !to) return true;
  const ini = e.date || hoyISO();
  const fin = e.dateEnd || ini;
  if (from && fin < from) return false;
  if (to && ini > to) return false;
  return true;
}
function DateRangeFilter({ rango, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, alignItems:"center" }}>
      {RANGOS.map(r => (
        <button
          key={r.id}
          className={`filter-btn ${rango.id === r.id ? "active" : ""}`}
          style={{ whiteSpace:"nowrap", flexShrink:0 }}
          onClick={() => onChange(r.id === "custom" ? { id:"custom", from: rango.from || restarDiasISO(29), to: rango.to || hoyISO() } : { id:r.id })}
        >{r.label}</button>
      ))}
      {rango.id === "custom" && (
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <input type="date" className="stk-input" style={{ padding:"7px 8px", fontSize:12, width:140 }} value={rango.from || ""} onChange={e => onChange({ ...rango, from:e.target.value })} />
          <span style={{ fontWeight:900, color:C.muted }}>→</span>
          <input type="date" className="stk-input" style={{ padding:"7px 8px", fontSize:12, width:140 }} value={rango.to || ""} onChange={e => onChange({ ...rango, to:e.target.value })} />
        </div>
      )}
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  input, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #EAECF5; border-radius: 3px; }

  /* ── Layout ── */
  .app-root { display: flex; min-height: 100vh; background: #F7F8FC; font-family: 'Nunito','Segoe UI',sans-serif; }

  /* Sidebar — hidden on mobile */
  .sidebar { display: none; }

  /* Mobile bottom nav */
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1.5px solid #EAECF5; padding: 8px 4px 14px; display: flex; justify-content: space-around; z-index: 60; }

  /* Main */
  .main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; padding-bottom: 90px; }
  .topbar { background: white; border-bottom: 1.5px solid #EAECF5; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
  .page-content { padding: 20px 16px; }

  /* ── Responsive grid helpers ── */
  .grid-2  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-4  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-inv { display: grid; grid-template-columns: 1fr; gap: 12px; }

  /* ── Components ── */
  .card { background: white; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .btn-main  { background: #00C896; color: white; border: none; border-radius: 14px; padding: 12px 22px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .btn-main:active { transform: scale(0.97); }
  .btn-orange { background: #FF8C42 !important; }
  .btn-outline { background: white; color: #1A1A2E; border: 2px solid #EAECF5; border-radius: 14px; padding: 11px 20px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .stk-input { background: #F7F8FC; border: 2px solid #EAECF5; border-radius: 14px; padding: 12px 16px; font-size: 14px; width: 100%; outline: none; font-family: inherit; color: #1A1A2E; transition: border 0.2s; }
  .stk-input:focus { border-color: #00C896; }
  .pill { display: inline-flex; align-items: center; border-radius: 30px; padding: 4px 12px; font-size: 11px; font-weight: 800; }
  .row-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1.5px solid #EAECF5; }
  .row-item:last-child { border-bottom: none; }
  .filter-btn { border: 2px solid #EAECF5; background: white; border-radius: 12px; padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; color: #8B8FA8; white-space: nowrap; }
  .filter-btn.active { border-color: #00C896; color: #00C896; background: #E6FAF5; }
  .tab-btn-mob { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 8px; border-radius: 12px; }
  .tab-btn-mob.active { background: #E6FAF5; }
  /* "+" central de la barra inferior (atajo de agregar rápido) */
  .fab-add { width:46px; height:46px; flex-shrink:0; align-self:center; border-radius:50%; background:linear-gradient(135deg,#00C896,#4A90FF); color:#fff; border:none; font-size:27px; font-weight:900; line-height:1; cursor:pointer; box-shadow:0 6px 16px rgba(0,200,150,.40); display:flex; align-items:center; justify-content:center; font-family:inherit; padding:0; }
  .fab-add:active { transform:scale(.93); }
  .bar { height: 6px; background: #EAECF5; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; transition: width 0.8s ease; }
  .section-title { font-weight: 900; font-size: 15px; color: #1A1A2E; margin-bottom: 14px; }
  .cf-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #EAECF5; font-size: 13px; }
  .cf-row:last-child { border-bottom: none; }
  .color-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.08); flex-shrink: 0; }
  .stock-btn { width: 32px; height: 32px; border-radius: 10px; border: 2px solid #EAECF5; background: white; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #8B8FA8; font-family: inherit; }
  .drop-zone { border: 2.5px dashed #00C896; border-radius: 20px; padding: 32px 20px; text-align: center; cursor: pointer; background: #E6FAF5; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
  .sheet { background: white; border-radius: 28px 28px 0 0; padding: 28px 20px 40px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; }
  .handle { width: 40px; height: 4px; background: #EAECF5; border-radius: 2px; margin: 0 auto 24px; }
  .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1A1A2E; color: white; border-radius: 16px; padding: 13px 22px; font-weight: 700; font-size: 14px; z-index: 200; white-space: nowrap; animation: popIn 0.3s ease; }
  @keyframes popIn { from { transform: translateX(-50%) translateY(10px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
  .view-toggle { display: flex; background: #F7F8FC; border-radius: 12px; padding: 4px; gap: 2px; flex-shrink: 0; }
  .view-btn { border: none; background: none; border-radius: 9px; padding: 6px 13px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit; color: #8B8FA8; white-space: nowrap; }
  .view-btn.active { background: white; color: #1A1A2E; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  .group-card { background: white; border-radius: 22px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); overflow: hidden; border: 2px solid transparent; }
  .group-card.has-alert { border-color: rgba(255,90,95,0.25); }
  .icon-box { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .kpi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-card { border-radius: 18px; padding: 18px; }

  /* ── DESKTOP ── */
  @media (min-width: 768px) {
    .sidebar {
      display: flex; flex-direction: column;
      width: 240px; flex-shrink: 0;
      background: #1A1A2E;
      position: sticky; top: 0; height: 100vh;
      overflow-y: auto;
    }
    .bottom-nav { display: none !important; }
    .main-wrap { padding-bottom: 0; }
    .page-content { padding: 28px 32px; max-width: 1200px; }
    .grid-2  { grid-template-columns: 1fr 1fr; }
    .grid-4  { grid-template-columns: repeat(4, 1fr); }
    .grid-inv { grid-template-columns: 1fr 1fr; }
    .topbar { padding: 18px 32px; }
    .sheet { border-radius: 20px; margin: auto; align-self: center; }
    .overlay { align-items: center; }
    .toast { bottom: 32px; }
    .desktop-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .desktop-3col { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  }
  @media (min-width: 1024px) {
    .sidebar { width: 260px; }
    .grid-4 { grid-template-columns: repeat(4,1fr); }
  }
`;

// ── Sidebar (desktop) ─────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, lowStock, signOut }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <div style={{ width:36, height:36, background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:18 }}>S</div>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, background:"linear-gradient(135deg,#00C896,#60A5FA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>stokly</span>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>Panel de gestión</div>
      </div>

      {/* Nav items */}
      <nav style={{ padding:"0 12px", flex:1 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit", marginBottom:4, background: tab===t.id ? "rgba(0,200,150,0.12)" : "none", transition:"all 0.15s" }}>
            <span style={{ fontSize:20 }}>{t.emoji}</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:800, fontSize:14, color: tab===t.id ? C.green : "rgba(255,255,255,0.75)" }}>{t.label}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>{t.desc}</div>
            </div>
            {t.id==="inventory" && lowStock.length>0 && <span style={{ marginLeft:"auto", background:"rgba(255,90,95,0.2)", color:C.red, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:900 }}>{lowStock.length}</span>}
          </button>
        ))}
      </nav>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ margin:"12px", background:"rgba(255,90,95,0.1)", border:"1px solid rgba(255,90,95,0.2)", borderRadius:16, padding:"14px 16px" }}>
          <div style={{ fontSize:12, fontWeight:900, color:C.red, marginBottom:8 }}>⚠️ {lowStock.length} con bajo stock</div>
          {lowStock.slice(0,3).map(p => (
            <div key={p.id} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
              <div className="color-dot" style={{ width:10, height:10, background:getColorCSS(p.color) }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name} / T{p.size}</span>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:900, color:C.red }}>{p.stock}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding:"16px 24px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>stokly v2.0 · Cali, CO</div>
        <button onClick={signOut} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>⏻ Salir</button>
      </div>
    </aside>
  );
}

// ── Splash (carga) ────────────────────────────────────────────────────────────
function Splash({ text }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.bg, gap:16, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ width:56, height:56, background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:28, animation:"spinPulse 1.2s ease-in-out infinite" }}>S</div>
      <div style={{ fontWeight:800, fontSize:14, color:C.muted }}>{text}</div>
      <style>{`@keyframes spinPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.7}}`}</style>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function Stokly() {
  const { user, initializing, signOut } = useAuth();
  const { memberships, status: mStatus, refresh: refreshMemberships } = useMemberships(user?.id);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [importView, setImportView] = useState("file"); // file | sheet
  const [userMenu, setUserMenu] = useState(false); // menú del usuario en el topbar
  const [activeWs, setActiveWs] = useState(() => {
    try { return localStorage.getItem("stokly_ws"); } catch { return null; }
  });
  const width = useWindowWidth();
  const isMobile = width < 768;

  // ── Panel activo (el propio o uno compartido por invitación) ──
  const wsReady = !!user && (mStatus === "ready" || mStatus === "error");
  const validActive = activeWs && memberships.some(m => m.workspace_id === activeWs);
  const workspaceId = wsReady ? (validActive ? activeWs : user.id) : null;
  const isOwner = !!workspaceId && memberships.some(m => m.workspace_id === workspaceId && m.role === "owner");

  useEffect(() => {
    if (!workspaceId) return;
    try { localStorage.setItem("stokly_ws", workspaceId); } catch { /* sin storage */ }
  }, [workspaceId]);

  // Tablas conectadas a Supabase (carga + guardado automático, por panel)
  const [products, setProducts, pStatus] = useSyncedTable("products", { fromRow: productFromRow, toRow: productToRow, onError: (m) => showToast(m) }, user?.id, workspaceId);
  const [sales, setSales]           = useSyncedTable("sales",     { fromRow: saleFromRow,     toRow: saleToRow,     onError: (m) => showToast(m) }, user?.id, workspaceId);
  const [expenses, setExpenses]     = useSyncedTable("expenses",  { fromRow: expenseFromRow,  toRow: expenseToRow,  onError: (m) => showToast(m) }, user?.id, workspaceId);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // 🚫 Sin datos de ejemplo: el panel empieza vacío y solo muestra lo que TÚ agregas.
  // (Se eliminó el siembra-demo para que nada vuelva tras vaciar el inventario.)

  // Aceptar invitaciones pendientes dirigidas a este correo
  const acceptedRef = useRef(false);
  useEffect(() => {
    if (!user || mStatus !== "ready" || acceptedRef.current) return;
    acceptedRef.current = true;
    acceptPendingInvites(user)
      .then(async (joined) => {
        if (!joined.length) return;
        setActiveWs(joined[joined.length - 1]);
        await refreshMemberships();
        showToast("🤝 Te uniste a un panel compartido");
      })
      .catch((e) => console.error("[stokly] aceptar invitación:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mStatus]);

  // Pantalla de carga / login
  if (initializing) return <Splash text="Cargando stokly…" />;
  if (!user) return <AuthScreen />;
  if (pStatus === "loading" || pStatus === "idle") return <Splash text="Sincronizando tus datos…" />;
  if (pStatus === "error") {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:"'Nunito',sans-serif", padding:20 }}>
        <div style={{ background:"white", borderRadius:22, padding:32, maxWidth:440, textAlign:"center", boxShadow:"0 8px 30px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>⚠️</div>
          <div style={{ fontWeight:900, fontSize:18, marginBottom:8 }}>No pudimos conectar con Supabase</div>
          <div style={{ fontSize:13, color:C.muted, fontWeight:600, marginBottom:18, lineHeight:1.5 }}>
            Faltan las tablas en la base de datos o hubo un problema de red.
            Ejecuta <b>supabase/schema.sql</b> en el SQL Editor de Supabase y recarga.
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button className="btn-main" onClick={() => location.reload()}>Recargar</button>
            <button className="btn-outline" onClick={() => signOut()}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalSales = sales.reduce((a,s) => a+s.total, 0);
  const totalExpenses = expenses.reduce((a,e) => a+e.amount, 0);
  const profit = totalSales - totalExpenses;
  const currentTab = TABS.find(t => t.id === tab);

  return (
    <div className="app-root">
      <style>{STYLES}</style>

      {/* Desktop sidebar */}
      <Sidebar tab={tab} setTab={setTab} lowStock={lowStock} signOut={signOut} />

      {/* Main */}
      <div className="main-wrap">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontWeight:900, fontSize:isMobile?18:22, color:C.text }}>{isMobile ? "stokly 📦" : `${currentTab?.emoji} ${currentTab?.label}`}</div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{isMobile ? "Tu negocio bajo control" : currentTab?.desc}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {lowStock.length>0 && isMobile && (
              <button onClick={() => setTab("inventory")} style={{ background:C.redLight, border:"none", borderRadius:12, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <span>🔴</span><span style={{ fontWeight:800, fontSize:13, color:C.red }}>{lowStock.length}</span>
              </button>
            )}
            {tab==="inventory" && <button onClick={() => setModal("addChoice")} className="btn-main" style={{ padding:"9px 16px", fontSize:13 }}>+ Producto</button>}
            {tab==="sales"     && <button onClick={() => setModal("sale")}    className="btn-main" style={{ padding:"9px 16px", fontSize:13 }}>+ Venta</button>}
            {tab==="expenses"  && <button onClick={() => setModal("expense")} className="btn-main btn-orange" style={{ padding:"9px 16px", fontSize:13 }}>+ Gasto</button>}
            {memberships.length > 1 && workspaceId && (
              <select
                value={workspaceId}
                onChange={e => setActiveWs(e.target.value)}
                className="stk-input"
                style={{ width:"auto", padding:"8px 10px", fontSize:12, fontWeight:800 }}
                title="Cambiar de panel"
              >
                {memberships.map(m => (
                  <option key={m.workspace_id} value={m.workspace_id}>
                    {m.workspace_id === user.id ? "🏠 Mi panel" : "👥 Panel compartido"}
                  </option>
                ))}
              </select>
            )}
            <div style={{ position:"relative" }}>
              <button
                onClick={() => setUserMenu(v => !v)}
                title={user.email}
                aria-label="Menú de usuario"
                style={{ width:36, height:36, background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:15, border:"none", cursor:"pointer", fontFamily:"inherit", padding:0, boxShadow:userMenu ? "0 0 0 3px rgba(0,200,150,.35)" : "none" }}
              >
                {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
              </button>
              {userMenu && (
                <>
                  <div onClick={() => setUserMenu(false)} style={{ position:"fixed", inset:0, zIndex:70 }} />
                  <div style={{ position:"absolute", top:44, right:0, background:"white", borderRadius:16, border:"1.5px solid #EAECF5", boxShadow:"0 12px 34px rgba(16,29,74,.18)", width:240, zIndex:80, overflow:"hidden", fontFamily:"inherit", textAlign:"left" }}>
                    <div style={{ padding:"14px 16px 12px", borderBottom:"1.5px solid #EAECF5", background:"#F7F8FC" }}>
                      {user.user_metadata?.display_name && <div style={{ fontWeight:900, fontSize:14, color:"#1A1A2E" }}>{user.user_metadata.display_name}</div>}
                      <div style={{ fontSize:12, color:"#8B8FA8", fontWeight:700, wordBreak:"break-all", lineHeight:1.35 }}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => { setUserMenu(false); setModal("team"); }}
                      title="Invitar a tu equipo"
                      style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", borderBottom:"1.5px solid #EAECF5", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:14, color:C.purple, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                    >
                      👥 Equipo
                    </button>
                    <button
                      onClick={() => { setUserMenu(false); if (window.confirm("¿Cerrar sesión?")) signOut(); }}
                      style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:14, color:C.red, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                    >
                      ⏻ Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">
          {tab==="home"      && <Home      products={products} sales={sales} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} lowStock={lowStock} setTab={setTab} setModal={setModal} isMobile={isMobile} />}
          {tab==="inventory" && <Inventory products={products} setProducts={setProducts} lowStock={lowStock} showToast={showToast} setModal={setModal} setImportView={setImportView} isMobile={isMobile} workspaceId={workspaceId} />}
          {tab==="sales"     && <Sales     sales={sales} setSales={setSales} products={products} setProducts={setProducts} totalSales={totalSales} isMobile={isMobile} showToast={showToast} />}
          {tab==="expenses"  && <Expenses  expenses={expenses} setExpenses={setExpenses} totalExpenses={totalExpenses} showToast={showToast} isMobile={isMobile} />}
          {tab==="finance"   && <Finance   products={products} sales={sales} expenses={expenses} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} isMobile={isMobile} />}
          {tab==="metrics"   && <Metrics   products={products} sales={sales} totalSales={totalSales} profit={profit} isMobile={isMobile} />}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="bottom-nav">
        {TABS.map((t, i) => (
          <Fragment key={t.id}>
            {i === Math.floor(TABS.length/2) && (
              <button className="fab-add" onClick={() => setModal("quickAdd")} title="Agregar rápido">+</button>
            )}
            <button className={`tab-btn-mob ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
              <span style={{ fontSize:20 }}>{t.emoji}</span>
              <span style={{ fontSize:9, fontWeight:800, color:tab===t.id?C.green:C.muted }}>{t.label}</span>
            </button>
          </Fragment>
        ))}
      </div>

      {modal==="product" && <AddProductModal onClose={() => setModal(null)} workspaceId={workspaceId} showToast={showToast} onSave={p => { setProducts(prev=>[...prev,p]); setModal(null); showToast("✅ Producto agregado"); }} />}
      {modal==="addChoice" && (
        <OptionPickerModal
          title="➕ Agregar producto"
          subtitle="Elige cómo quieres agregarlo"
          onClose={() => setModal(null)}
          options={[
            { emoji:"✏️", title:"Agregar producto manual", desc:"Un producto a la vez, con foto y todos los datos", bg:C.greenLight, color:C.green, action:() => setModal("product") },
            { emoji:"📂", title:"Forma masiva en Excel", desc:"Sube un archivo .xlsx o .csv con muchos productos", bg:C.blueLight, color:C.blue, action:() => { setImportView("file"); setModal("import"); } },
            { emoji:"🔗", title:"Google Sheets", desc:"Pega el enlace de tu hoja de cálculo", bg:C.greenLight, color:C.green, action:() => { setImportView("sheet"); setModal("import"); } },
          ]}
        />
      )}
      {modal==="quickAdd" && (
        <OptionPickerModal
          title="➕ Agregar"
          subtitle="¿Qué quieres registrar?"
          onClose={() => setModal(null)}
          options={[
            { emoji:"✏️", title:"Producto manual", desc:"Un producto con foto y todos los datos", bg:C.greenLight, color:C.green, action:() => setModal("product") },
            { emoji:"📂", title:"Producto masivo", desc:"Excel/CSV o Google Sheets (eliges dentro)", bg:C.blueLight, color:C.blue, action:() => { setImportView("file"); setModal("import"); } },
            { emoji:"💰", title:"Agregar venta", desc:"Registrar una venta rápidamente", bg:C.greenLight, color:C.green, action:() => setModal("sale") },
            { emoji:"💸", title:"Agregar gasto", desc:"Registrar un gasto rápidamente", bg:C.orangeLight, color:C.orange, action:() => setModal("expense") },
          ]}
        />
      )}
      {modal==="import"  && <ImportModal    importView={importView} workspaceId={workspaceId} onClose={() => setModal(null)} onImport={(newP,mode,aviso) => {
        let fotoN = 0;
        if(mode==="replace") { setProducts(newP); }
        else {
          const upd = new Map(); const add = [];
          newP.forEach(p => { const ex = products.find(x => x.sku === p.sku);
            if(!ex) add.push(p);
            else if(p.image && !ex.image){ upd.set(ex.id, {...ex, image:p.image}); fotoN++; }
          });
          setProducts(prev => [...prev.map(x => upd.get(x.id) || x), ...add]);
        }
        setModal(null);
        showToast(`✅ ${newP.length} importados${fotoN?` · 📷 foto agregada a ${fotoN} existentes`:""}${aviso?` · ⚠️ ${aviso}`:""}`);
      }} />}
      {modal==="sale"    && <AddSaleModal   products={products} onClose={() => setModal(null)} onSave={(s,pid,qty) => { setSales(prev=>[...prev,s]); setProducts(prev=>prev.map(p=>String(p.id)===String(pid)?{...p,stock:p.stock-qty,sold:p.sold+qty}:p)); setModal(null); showToast("💰 Venta: "+fmt(s.total)); }} />}
      {modal==="expense" && <AddExpenseModal onClose={() => setModal(null)} onSave={e => { setExpenses(prev=>[...prev,e]); setModal(null); showToast("💸 Gasto registrado"); }} />}
      {modal==="team"    && <TeamModal      user={user} activeWs={workspaceId} isOwner={isOwner} onClose={() => setModal(null)} showToast={showToast} onChanged={refreshMemberships} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home({ products, totalSales, totalExpenses, profit, lowStock, setTab, setModal, isMobile }) {
  const top5 = [...products].sort((a,b)=>b.sold-a.sold).slice(0,5);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Hero card */}
      <div style={{ background:"linear-gradient(135deg,#00C896 0%,#4A90FF 100%)", borderRadius:24, padding:isMobile?22:28, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85, marginBottom:4 }}>Ganancia neta del mes</div>
        <div style={{ fontSize:isMobile?36:48, fontWeight:900, marginBottom:16 }}>{fmt(profit)}</div>
        <div className="grid-2" style={{ maxWidth:480 }}>
          {[["VENTAS",totalSales],[" GASTOS",totalExpenses]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.18)", borderRadius:14, padding:"12px 16px" }}>
              <div style={{ fontSize:10, fontWeight:700, opacity:0.8, marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:900 }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        {[
          { label:"Unidades en stock", value:products.reduce((a,p)=>a+p.stock,0), color:C.blue,   bg:C.blueLight,   emoji:"📦" },
          { label:"Referencias",       value:products.length,                      color:C.purple, bg:C.purpleLight, emoji:"🏷️" },
          { label:"Ventas registradas",value:products.reduce((a,p)=>a+p.sold,0),  color:C.green,  bg:C.greenLight,  emoji:"💰" },
          { label:"Alertas de stock",  value:lowStock.length,                      color:lowStock.length?C.red:C.green, bg:lowStock.length?C.redLight:C.greenLight, emoji:"⚠️" },
        ].map(k=>(
          <div key={k.label} className="stat-card" style={{ background:k.bg }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{k.emoji}</div>
            <div style={{ fontSize:11, fontWeight:800, color:k.color, textTransform:"uppercase", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color:C.text }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions + alerts */}
      <div className={isMobile ? "" : "desktop-2col"}>
        <div>
          <div className="section-title">Acciones rápidas</div>
          <div className="grid-2">
            {[
              { label:"Registrar venta",  emoji:"💰", color:C.green,  bg:C.greenLight,  action:()=>setModal("sale") },
              { label:"Agregar producto", emoji:"📦", color:C.blue,   bg:C.blueLight,   action:()=>setModal("addChoice") },
              { label:"Registrar gasto",  emoji:"💸", color:C.orange, bg:C.orangeLight, action:()=>setModal("expense") },
              { label:"Ver finanzas",     emoji:"📈", color:C.teal,   bg:C.tealLight,   action:()=>setTab("finance") },
            ].map(a=>(
              <button key={a.label} onClick={a.action} style={{ background:a.bg, border:"none", borderRadius:18, padding:16, cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{a.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, color:a.color }}>{a.label}</div>
              </button>
            ))}
          </div>
        </div>

        {lowStock.length > 0 && (
          <div>
            <div className="section-title">⚠️ Stock bajo</div>
            <div className="card" style={{ padding:16 }}>
              {lowStock.slice(0,5).map(p=>(
                <div key={p.id} className="row-item">
                  <div className="color-dot" style={{ background:getColorCSS(p.color) }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{p.brand} · T{p.size}</div>
                  </div>
                  <span style={{ fontWeight:900, color:C.red, fontSize:14 }}>{p.stock} uds</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="card" style={{ padding:20 }}>
        <div className="section-title">🏆 Lo que más vendes</div>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {top5.map((p,i)=>(
            <div key={p.id} className="row-item">
              <div style={{ width:28,height:28, background:i===0?C.yellow:C.bg, borderRadius:9, display:"flex",alignItems:"center",justifyContent:"center", fontWeight:900, fontSize:13, color:i===0?"white":C.muted }}>{i+1}</div>
              <div className="color-dot" style={{ background:getColorCSS(p.color) }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14 }}>{p.name}</div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{p.brand} · {p.color} · T{p.size}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:900, fontSize:15, color:C.green }}>{p.sold}</div>
                <div style={{ fontSize:10, color:C.muted }}>vendidos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
function Inventory({ products, setProducts, lowStock, showToast, setModal, setImportView, isMobile, workspaceId }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("visual");
  const [viewMenu, setViewMenu] = useState(false); // menú desplegable "Vista"
  const [filterCat, setFilterCat] = useState("Todos");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editGroup, setEditGroup] = useState(null); // referencia en edición (agregar tallas/colores)
  const fileRef = useRef(null);

  // Sube la foto de una referencia (carpeta = panel de trabajo)
  async function handlePhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !photoTarget) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, workspaceId);
      const ids = new Set(photoTarget.variants.map(v => String(v.id)));
      setProducts(prev => prev.map(x => ids.has(String(x.id)) ? { ...x, image: url } : x));
      showToast("📷 Foto de referencia actualizada");
    } catch (err) {
      console.error("[stokly] foto:", err && err.message);
      showToast("❌ No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  // Borrado permanente de una referencia (todas sus variantes)
  const deleteGroup = (group) => {
    if (!window.confirm(`¿Eliminar la referencia "${group.name}" y sus ${group.variants.length} variantes?\n\nSe borrará PERMANENTEMENTE.`)) return;
    const ids = new Set(group.variants.map(v => String(v.id)));
    setProducts(prev => prev.filter(p => !ids.has(String(p.id))));
    setExpandedGroup(null);
    showToast("🗑️ Referencia eliminada");
  };

  // Vaciar todo el inventario (borrado permanente)
  const clearAll = () => {
    if (!window.confirm(`🗑️ ¿Vaciar el inventario?\n\nSe eliminarán PERMANENTEMENTE los ${products.length} productos.\n(Las ventas y gastos NO se tocan)`)) return;
    if (!window.confirm("⚠️ Última confirmación: esta acción NO se puede deshacer.\n\n¿Borrar todo el inventario?")) return;
    setProducts([]);
    showToast("🗑️ Inventario vaciado — empieza desde cero 🚀");
  };
  const categories = ["Todos", ...new Set(products.map(p=>p.category))];

  // Abre el editor de referencia (siempre con el grupo COMPLETO, sin filtros)
  const openEdit = (g) => {
    const full = groupProducts(products).find(x => x.name === g.name && (x.brand || "") === (g.brand || "")) || g;
    setEditGroup(full);
  };
  const openEditByVariant = (p) => {
    const g = groupProducts(products).find(x => x.variants.some(v => String(v.id) === String(p.id)));
    if (g) setEditGroup(g);
  };
  // Guarda la referencia: datos base a todas sus variantes, nuevas se agregan, quitadas se eliminan
  const saveEdit = ({ refFields, vars }) => {
    const oldName = editGroup.name, oldBrand = editGroup.brand || "";
    setProducts(prev => {
      const refOldIds = new Set(prev.filter(p => p.name === oldName && (p.brand || "") === oldBrand).map(p => String(p.id)));
      const keptIds = new Set(vars.map(v => String(v.id)));
      const removedIds = new Set([...refOldIds].filter(id => !keptIds.has(id)));
      const existing = new Set(prev.map(p => String(p.id)));
      const varMap = new Map(vars.map(v => [String(v.id), v]));
      let next = prev.filter(p => !removedIds.has(String(p.id))).map(p => {
        const id = String(p.id);
        const nv = varMap.get(id);
        if (nv) return { ...p, ...nv, name: refFields.name, brand: refFields.brand, category: refFields.category };
        if (refOldIds.has(id)) return { ...p, name: refFields.name, brand: refFields.brand, category: refFields.category };
        return p;
      });
      const news = vars.filter(v => !existing.has(String(v.id))).map(v => ({ ...v, name: refFields.name, brand: refFields.brand, category: refFields.category }));
      return [...next, ...news];
    });
    setEditGroup(null);
    showToast("✏️ Referencia actualizada");
  };
  const q = search.toLowerCase();
  const filtered = products.filter(p =>
    (filterCat==="Todos" || p.category===filterCat) &&
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.color.toLowerCase().includes(q) || p.size.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );
  const groups = groupProducts(filtered);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:"none" }} />
      {/* Search + controls */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 240px" }}>
          <input className="stk-input" placeholder="🔍 Busca por nombre, color, talla, marca..." value={search} onChange={e=>setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,fontWeight:900 }}>✕</button>}
        </div>
        {/* Menú desplegable "Vista" (ahorra espacio:3 vistas en1 botón) */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <button
            onClick={() => setViewMenu(v => !v)}
            title="Cambiar vista del inventario"
            style={{ background:"white", border:"1.5px solid #EAECF5", borderRadius:12, padding:"9px 13px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.text, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}
          >
            👁 Vista {viewMenu ? "▴" : "▾"}
          </button>
          {viewMenu && (
            <>
              <div onClick={() => setViewMenu(false)} style={{ position:"fixed", inset:0, zIndex:70 }} />
              <div style={{ position:"absolute", top:42, left:0, background:"white", borderRadius:14, border:"1.5px solid #EAECF5", boxShadow:"0 12px 34px rgba(16,29,74,.18)", zIndex:80, overflow:"hidden", minWidth:175, fontFamily:"inherit", textAlign:"left" }}>
                {[["visual","📋 Visual"],["list","☰ Lista"],["table","🗒️ Tabla"]].map(([id,label]) => (
                  <button
                    key={id}
                    onClick={() => { setViewMode(id); setViewMenu(false); }}
                    style={{ width:"100%", padding:"12px 14px", background:viewMode===id?C.greenLight:"none", border:"none", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:13, color:viewMode===id?C.green:C.text, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                  >
                    <span>{label}</span>
                    {viewMode===id && <span style={{ marginLeft:"auto", fontWeight:900 }}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {products.length>0 && (
          <button onClick={clearAll} title="Vaciar todo el inventario (borrado permanente)" style={{ background:C.redLight, color:C.red, border:"none", borderRadius:12, padding:"10px 14px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>🗑️ Vaciar</button>
        )}
      </div>

      {/* Category filters */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {categories.map(c => <button key={c} className={`filter-btn ${filterCat===c?"active":""}`} onClick={()=>setFilterCat(c)}>{c}</button>)}
      </div>

      {/* Result summary */}
      {search && (
        <div style={{ background:groups.length?C.blueLight:C.redLight, borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, color:groups.length?C.blue:C.red }}>
          {groups.length ? `✅ ${groups.length} ref · ${filtered.length} variantes` : "😕 Sin resultados"}
        </div>
      )}

      {/* Alert strip */}
      {lowStock.length>0 && !search && (
        <div style={{ background:C.redLight, border:"1.5px solid rgba(255,90,95,0.3)", borderRadius:14, padding:"10px 16px", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontWeight:900, fontSize:13, color:C.red }}>⚠️ {lowStock.length} con problema de stock</span>
        </div>
      )}

      {/* VISUAL MODE */}
      {viewMode==="visual" && (
        <div className="grid-inv">
          {groups.length===0 && <div style={{ textAlign:"center", padding:40, color:C.muted, fontWeight:700 }}>Sin resultados 🔍</div>}
          {groups.map((group, gi) => {
            const hasAlert = group.variants.some(v=>v.stock<=v.minStock);
            const totalStock = group.variants.reduce((a,v)=>a+v.stock,0);
            const isExpanded = expandedGroup===gi || search.length>0;
            const margin = group.price ? Math.round(((group.price-group.cost)/group.price)*100) : 0;
            return (
              <div key={gi} className={`group-card ${hasAlert?"has-alert":""}`}>
                {/* Header */}
                <div style={{ padding:"16px 18px 12px", cursor:"pointer" }} onClick={()=>setExpandedGroup(isExpanded&&!search?null:gi)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:42,height:42, background:hasAlert?C.redLight:C.greenLight, borderRadius:13, display:"flex",alignItems:"center",justifyContent:"center", fontSize:22, overflow:"hidden", flexShrink:0 }}>{group.image ? <img src={group.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : group.emoji}</div>
                      <div>
                        <div style={{ fontWeight:900, fontSize:16, color:C.text }}>{group.name}</div>
                        <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{group.brand} · {group.variants.length} variantes</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmt(group.price)}</div>
                      <span className="pill" style={{ background:margin>40?C.greenLight:C.yellowLight, color:margin>40?C.green:C.yellow }}>Margen {margin}%</span>
                    </div>
                  </div>
                  {/* Color swatches + stock total */}
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                    {[...new Set(group.variants.map(v=>v.color))].map(color=>(
                      <div key={color} style={{ display:"flex",alignItems:"center",gap:4, background:C.bg, borderRadius:20, padding:"3px 10px 3px 5px" }}>
                        <div className="color-dot" style={{ width:12,height:12, background:getColorCSS(color) }} />
                        <span style={{ fontSize:11, fontWeight:700 }}>{color}</span>
                      </div>
                    ))}
                    <span style={{ fontSize:11, color:C.muted, fontWeight:700 }}>· {totalStock} uds</span>
                    {hasAlert && <span style={{ fontSize:11, fontWeight:900, color:C.red }}>⚠️</span>}
                    <button
                      onClick={e => { e.stopPropagation(); setPhotoTarget(group); if (fileRef.current) fileRef.current.click(); }}
                      title={group.image ? "Cambiar foto" : "Agregar foto"}
                      disabled={uploading}
                      style={{ marginLeft:"auto", background:C.bg, border:"none", borderRadius:10, padding:"5px 9px", fontSize:14, cursor:"pointer", lineHeight:1 }}
                    >{uploading ? "⏳" : "📷"}</button>
                    <span style={{ fontSize:14, color:C.muted }}>{isExpanded?"▲":"▼"}</span>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(group); }}
                      title="Editar referencia — agregar tallas y colores"
                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:0, lineHeight:1, fontFamily:"inherit" }}
                    >✏️</button>
                  </div>
                </div>

                {/* Expanded variants */}
                {isExpanded && (
                  <div style={{ padding:"0 18px 16px", borderTop:"1.5px solid "+C.border }}>
                    <div style={{ marginTop:12 }}>
                      {/* Legend */}
                      <div style={{ display:"grid", gridTemplateColumns:"16px 1fr 56px 80px 72px", gap:10, marginBottom:8, paddingBottom:6, borderBottom:"1px solid "+C.border }}>
                        {["","Color / SKU","Talla","Stock",""].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:800, color:C.muted, textTransform:"uppercase" }}>{h}</div>
                        ))}
                      </div>
                      {group.variants.map(v => {
                        const st = stockStatus(v.stock, v.minStock);
                        const maxBar = Math.max(...group.variants.map(x=>x.stock+x.minStock*2),1);
                        return (
                          <div key={v.id} style={{ display:"grid", gridTemplateColumns:"16px 1fr 56px 80px 72px", gap:10, alignItems:"center", padding:"9px 0", borderBottom:"1px solid "+C.border+"60" }}>
                            <div className="color-dot" style={{ width:14,height:14, background:getColorCSS(v.color) }} />
                            <div>
                              <div style={{ fontWeight:800, fontSize:13 }}>{v.color}</div>
                              <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{v.sku}</div>
                            </div>
                            <div style={{ background:C.bg, borderRadius:8, padding:"3px 8px", fontSize:12, fontWeight:900, textAlign:"center" }}>T{v.size}</div>
                            <div>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                <span style={{ fontSize:14, fontWeight:900, color:st.color }}>{v.stock}</span>
                                <span style={{ fontSize:11 }}>{st.dot}</span>
                              </div>
                              <div className="bar"><div className="bar-fill" style={{ width:`${Math.min(100,(v.stock/maxBar)*100)}%`, background:st.color }} /></div>
                              <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>mín {v.minStock}</div>
                            </div>
                            <div style={{ display:"flex", gap:4 }}>
                              <button className="stock-btn" onClick={()=>setProducts(prev=>prev.map(x=>x.id===v.id?{...x,stock:Math.max(0,x.stock-1)}:x))}>−</button>
                              <button className="stock-btn" onClick={()=>setProducts(prev=>prev.map(x=>x.id===v.id?{...x,stock:x.stock+1}:x))}>+</button>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display:"flex", justifyContent:"flex-end", gap:16, marginTop:10, flexWrap:"wrap" }}>
                        <button onClick={()=>openEdit(group)} style={{ background:"none",border:"none",color:C.blue,fontSize:12,cursor:"pointer",fontWeight:800,fontFamily:"inherit" }}>✏️ Editar referencia (agregar tallas/colores)</button>
                        <button onClick={()=>deleteGroup(group)} style={{ background:"none",border:"none",color:C.red,fontSize:12,cursor:"pointer",fontWeight:800,fontFamily:"inherit" }}>🗑️ Eliminar referencia (permanente)</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LIST MODE */}
      {viewMode==="list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(p=>{
            const st = stockStatus(p.stock,p.minStock);
            const margin = p.price?Math.round(((p.price-p.cost)/p.price)*100):0;
            return (
              <div key={p.id} className="card" style={{ padding:14, border:`2px solid ${p.stock<=p.minStock?C.red+"30":"transparent"}` }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width:34, height:34, borderRadius:10, objectFit:"cover", flexShrink:0, border:"1.5px solid #EAECF5" }} />
                    : <div className="color-dot" style={{ width:22,height:22, background:getColorCSS(p.color), flexShrink:0 }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:900, fontSize:14 }}>{p.emoji} {p.name}</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{p.brand} · {p.color} · T{p.size} · {p.sku}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontWeight:900, fontSize:16, color:st.color }}>{p.stock} {st.dot}</div>
                    <div style={{ fontSize:10, color:C.muted }}>mín {p.minStock}</div>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <span className="pill" style={{ background:C.purpleLight, color:C.purple }}>{fmt(p.price)}</span>
                    <span className="pill" style={{ background:margin>40?C.greenLight:C.yellowLight, color:margin>40?C.green:C.yellow }}>{margin}%</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="stock-btn" onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))}>−</button>
                    <button className="stock-btn" onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))}>+</button>
                    <button title="Editar referencia (agregar tallas/colores)" onClick={()=>openEditByVariant(p)} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontWeight:800,fontSize:12,fontFamily:"inherit" }}>✏️ Editar</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length===0 && <div style={{ textAlign:"center",padding:40,color:C.muted,fontWeight:700 }}>Sin resultados 🔍</div>}
        </div>
      )}

      {/* TABLE MODE — vista tradicional con todos los campos */}
      {viewMode==="table" && (
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", minWidth:1020, fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["","Nombre","SKU","Marca","Color","Talla","Categoría","Precio","Costo","Margen","Mín","Stock","Vendidos","Agregado",""].map((h,i)=>(
                    <th key={i} style={{ padding:"11px 10px", fontSize:10, fontWeight:900, color:C.muted, textTransform:"uppercase", textAlign: (i>=7&&i<=12)?"right":"left", whiteSpace:"nowrap", borderBottom:"1.5px solid "+C.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>{
                  const st = stockStatus(p.stock,p.minStock);
                  const margin = p.price?Math.round(((p.price-p.cost)/p.price)*100):0;
                  const td = { padding:"9px 10px", borderBottom:"1px solid "+C.border+"60", whiteSpace:"nowrap" };
                  return (
                    <tr key={p.id}>
                      <td style={td}>{p.image ? <img src={p.image} alt="" style={{ width:30, height:30, borderRadius:8, objectFit:"cover", display:"block" }} /> : <span style={{ fontSize:17 }}>{p.emoji}</span>}</td>
                      <td style={{ ...td, fontWeight:800 }}>{p.name}</td>
                      <td style={{ ...td, color:C.muted, fontWeight:600 }}>{p.sku}</td>
                      <td style={td}>{p.brand||"—"}</td>
                      <td style={td}>{p.color||"—"}</td>
                      <td style={td}>{p.size?`T${p.size}`:"—"}</td>
                      <td style={td}>{p.category}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:800 }}>{fmt(p.price)}</td>
                      <td style={{ ...td, textAlign:"right", color:C.muted }}>{fmt(p.cost)}</td>
                      <td style={{ ...td, textAlign:"right" }}><span className="pill" style={{ background:margin>40?C.greenLight:margin>20?C.yellowLight:C.redLight, color:margin>40?C.green:margin>20?C.yellow:C.red }}>{margin}%</span></td>
                      <td style={{ ...td, textAlign:"right", color:C.muted }}>{p.minStock}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:900, color:st.color }}>{p.stock} {st.dot}</td>
                      <td style={{ ...td, textAlign:"right", color:C.muted, fontWeight:700 }}>{p.sold}</td>
                      <td style={{ ...td, color:C.muted, fontWeight:700 }}>{p.addedAt ? p.addedAt.split("-").reverse().join("/") : "—"}</td>
                      <td style={td}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button className="stock-btn" style={{ width:26, height:26, fontSize:13 }} onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))}>−</button>
                          <button className="stock-btn" style={{ width:26, height:26, fontSize:13 }} onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))}>+</button>
                          <button title="Editar referencia (agregar tallas/colores)" onClick={()=>openEditByVariant(p)} style={{ background:"none",border:"none",color:C.blue,cursor:"pointer",fontWeight:800,fontSize:12,fontFamily:"inherit" }}>✏️ Editar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length===0 && <tr><td colSpan={15} style={{ textAlign:"center", padding:40, color:C.muted, fontWeight:700 }}>Sin resultados 🔍</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor de referencia — agregar/quitar tallas y colores de la misma referencia */}
      {editGroup && <EditReferenceModal group={editGroup} onClose={() => setEditGroup(null)} onSave={saveEdit} />}
    </div>
  );
}

// ── SALES ─────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, products, setProducts, totalSales, isMobile, showToast }) {
  const [rango, setRango] = useState({ id:"todo" });
  const ventasR = sales.filter(s => enRango(s.date, rango));
  const totalR = ventasR.reduce((a,s)=>a+s.total,0);
  const byMethod = ventasR.reduce((acc,s)=>{acc[s.method]=(acc[s.method]||0)+s.total;return acc;},{});
  const clearSales = () => {
    if (!window.confirm(`🗑️ ¿Vaciar ventas?\n\nSe eliminarán PERMANENTEMENTE las ${sales.length} ventas registradas.`)) return;
    if (!window.confirm("⚠️ Última confirmación: NO se puede deshacer.\n\n¿Borrar todas las ventas?")) return;
    setSales([]);
    showToast("🗑️ Ventas vaciadas");
  };
  const colors = { Efectivo:[C.green,C.greenLight], Tarjeta:[C.blue,C.blueLight], Nequi:[C.purple,C.purpleLight], Transferencia:[C.orange,C.orangeLight], Daviplata:[C.red,C.redLight] };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <DateRangeFilter rango={rango} onChange={setRango} />
      <div style={{ background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85 }}>{rango.id==="todo"?"Total histórico":"Total · "+rangoLabel(rango)}</div>
        <div style={{ fontSize:isMobile?32:44, fontWeight:900 }}>{fmt(totalR)}</div>
      </div>
      <div className="grid-4">
        {Object.entries(byMethod).map(([m,total])=>{const[color,bg]=colors[m]||[C.muted,C.bg];return <div key={m} className="stat-card" style={{ background:bg }}><div style={{ fontSize:12,fontWeight:800,color,marginBottom:4 }}>{m}</div><div style={{ fontSize:20,fontWeight:900 }}>{fmt(total)}</div><div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{pct(total,totalR)}%</div></div>;})}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div className="section-title" style={{ marginBottom:0 }}>Historial</div>
          {sales.length>0 && (
            <button onClick={clearSales} title="Borrar todas las ventas (permanente)" style={{ background:C.redLight, color:C.red, border:"none", borderRadius:10, padding:"7px 12px", fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗑️ Vaciar ventas</button>
          )}
        </div>
        {[...ventasR].reverse().map(s=>{
          const p=products.find(x=>x.id===s.productId);
          return (
            <div key={s.id} className="row-item">
              <div style={{ width:38,height:38, background:C.greenLight, borderRadius:12, display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{p?.emoji||"📦"}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14 }}>{p?.name||"Producto"}</div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, display:"flex", gap:6, alignItems:"center" }}>
                  {p&&<div className="color-dot" style={{ width:10,height:10,background:getColorCSS(p.color) }} />}
                  {s.date} · {s.qty} uds · {s.method}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontWeight:900, fontSize:16, color:C.green }}>{fmt(s.total)}</div>
                <button title="Eliminar (permanente)" onClick={()=>{ if(!window.confirm(`¿Eliminar la venta del ${s.date} por ${fmt(s.total)}?\n\nSe borrará PERMANENTEMENTE.`)) return; setSales(prev=>prev.filter(x=>x.id!==s.id)); showToast("🗑️ Venta eliminada"); }} style={{ background:C.redLight,border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontWeight:800,fontSize:12,color:C.red,fontFamily:"inherit" }}>🗑️</button>
              </div>
            </div>
          );
        })}
        {ventasR.length===0 && <div style={{ textAlign:"center", padding:30, color:C.muted, fontWeight:700 }}>Sin ventas en este rango 📅</div>}
      </div>
    </div>
  );
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function Expenses({ expenses, setExpenses, totalExpenses, showToast, isMobile }) {
  const [rango, setRango] = useState({ id:"todo" });
  const gastosR = expenses.filter(e => solapaRango(e, rango));
  const totalR = gastosR.reduce((a,e)=>a+e.amount,0);
  const byCategory = gastosR.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{});
  const clearExpenses = () => {
    if (!window.confirm(`🗑️ ¿Vaciar gastos?\n\nSe eliminarán PERMANENTEMENTE los ${expenses.length} gastos.`)) return;
    if (!window.confirm("⚠️ Última confirmación: NO se puede deshacer.\n\n¿Borrar todos los gastos?")) return;
    setExpenses([]);
    showToast("🗑️ Gastos vaciados");
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <DateRangeFilter rango={rango} onChange={setRango} />
      <div style={{ background:"linear-gradient(135deg,#FF8C42,#FF5A5F)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85 }}>{rango.id==="todo"?"Total gastos":"Total gastos · "+rangoLabel(rango)}</div>
        <div style={{ fontSize:isMobile?32:44, fontWeight:900 }}>{fmt(totalR)}</div>
      </div>
      <div className="grid-4">
        {Object.entries(byCategory).map(([cat,amount])=><div key={cat} className="stat-card" style={{ background:C.orangeLight }}><div style={{ fontSize:12,fontWeight:800,color:C.orange,marginBottom:4 }}>{cat}</div><div style={{ fontSize:20,fontWeight:900 }}>{fmt(amount)}</div></div>)}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div className="section-title" style={{ marginBottom:0 }}>Historial</div>
          {expenses.length>0 && (
            <button onClick={clearExpenses} title="Borrar todos los gastos (permanente)" style={{ background:C.redLight, color:C.red, border:"none", borderRadius:10, padding:"7px 12px", fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗑️ Vaciar gastos</button>
          )}
        </div>
        {[...gastosR].reverse().map(e=>(
          <div key={e.id} className="row-item">
            <div style={{ width:38,height:38,background:C.orangeLight,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{e.emoji}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:14 }}>{e.concept}</div><div style={{ fontSize:11,color:C.muted,fontWeight:600 }}>{e.date}{e.dateEnd?" → "+e.dateEnd:""} · {e.category}</div></div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
              <div style={{ fontWeight:900,fontSize:16,color:C.red }}>{fmt(e.amount)}</div>
              <button title="Eliminar (permanente)" onClick={()=>{ if(!window.confirm(`¿Eliminar el gasto "${e.concept}"?\n\nSe borrará PERMANENTEMENTE.`)) return; setExpenses(prev=>prev.filter(x=>x.id!==e.id)); showToast("🗑️ Gasto eliminado"); }} style={{ background:"none",border:"none",color:C.red,fontSize:11,cursor:"pointer",fontWeight:800,fontFamily:"inherit" }}>🗑️ Borrar</button>
            </div>
          </div>
        ))}
        {gastosR.length===0 && <div style={{ textAlign:"center", padding:30, color:C.muted, fontWeight:700 }}>Sin gastos en este rango 📅</div>}
      </div>
    </div>
  );
}

// ── FINANCE ───────────────────────────────────────────────────────────────────
function Finance({ products, sales, expenses, totalSales, totalExpenses, profit, isMobile }) {
  const [sec, setSec] = useState("cashflow");
  const [rango, setRango] = useState({ id:"todo" });
  const sF = sales.filter(s => enRango(s.date, rango));
  const eF = expenses.filter(e => solapaRango(e, rango));
  const totalSalesR = sF.reduce((a,s)=>a+s.total,0);
  const totalExpensesR = eF.reduce((a,e)=>a+e.amount,0);
  const profitR = totalSalesR - totalExpensesR;
  const mktExp = eF.filter(e=>e.category==="Marketing").reduce((a,e)=>a+e.amount,0);
  const opExp  = eF.filter(e=>e.category==="Operacional").reduce((a,e)=>a+e.amount,0);
  const cogs   = sF.reduce((a,s)=>{const p=products.find(x=>String(x.id)===String(s.productId));return a+(p?p.cost*s.qty:0);},0);
  const grossP = totalSalesR - cogs;
  const gMargin= pct(grossP,totalSalesR);
  const nMargin= pct(profitR,totalSalesR);
  const cpa    = sF.length > 0 ? mktExp/sF.length : 0;
  const fixed  = opExp + mktExp;
  const breakEven = gMargin > 0 ? (fixed/(gMargin/100)) : 0;
  const frozen = products.reduce((a,p)=>a+p.stock*p.cost,0);
  const rg = rangoAFechas(rango);
  const todasFechas = [...sales.map(s=>s.date), ...expenses.map(e=>e.date)].filter(Boolean).sort();
  const f0 = rg.from || todasFechas[0] || restarDiasISO(29);
  const t0 = rg.to || hoyISO();
  const diasTot = Math.max(1, Math.round((Date.parse(t0) - Date.parse(f0)) / 86400000) + 1);
  const paso = Math.max(1, Math.ceil(diasTot / 4));
  const cfWeeks = [0,1,2,3].map(i => {
    const bf = sumarDiasISO(f0, i * paso);
    const btRaw = sumarDiasISO(f0, (i + 1) * paso - 1);
    if (bf > t0) return { l:"—", e:0, s:0 };
    const bt = btRaw > t0 ? t0 : btRaw;
    return {
      l: dmISO(bf) + "–" + dmISO(bt),
      e: sF.filter(s => s.date >= bf && s.date <= bt).reduce((a,s)=>a+s.total,0),
      s: eF.filter(x => { const ini = x.date || ""; const fin = x.dateEnd || ini; return fin >= bf && ini <= bt; }).reduce((a,x)=>a+x.amount,0),
    };
  });
  const maxCF = Math.max(...cfWeeks.map(d=>Math.max(d.e,d.s)),1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <DateRangeFilter rango={rango} onChange={setRango} />
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {[{id:"cashflow",l:"💧 Flujo de Caja"},{id:"profitability",l:"💎 Rentabilidad"},{id:"indicators",l:"🎯 Indicadores"}].map(s=><button key={s.id} className={`filter-btn ${sec===s.id?"active":""}`} onClick={()=>setSec(s.id)}>{s.l}</button>)}
      </div>
      {sec==="cashflow" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:profitR>=0?"linear-gradient(135deg,#00C896,#06B6D4)":"linear-gradient(135deg,#FF5A5F,#FF8C42)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
            <div style={{ fontSize:13, fontWeight:700, opacity:0.85, marginBottom:2 }}>{profitR>=0?"✅ Flujo positivo":"🚨 Flujo negativo"}{rango.id!=="todo"?" · "+rangoLabel(rango):""}</div>
            <div style={{ fontSize:isMobile?32:44, fontWeight:900, marginBottom:14 }}>{fmt(profitR)}</div>
            <div className="grid-2" style={{ maxWidth:400 }}>
              <div style={{ background:"rgba(255,255,255,0.2)",borderRadius:13,padding:"10px 14px" }}><div style={{ fontSize:10,opacity:0.8,fontWeight:700,marginBottom:3 }}>ENTRADAS</div><div style={{ fontSize:18,fontWeight:900 }}>{fmt(totalSalesR)}</div></div>
              <div style={{ background:"rgba(255,255,255,0.2)",borderRadius:13,padding:"10px 14px" }}><div style={{ fontSize:10,opacity:0.8,fontWeight:700,marginBottom:3 }}>SALIDAS</div><div style={{ fontSize:18,fontWeight:900 }}>{fmt(totalExpensesR)}</div></div>
            </div>
          </div>
          <div className={isMobile?"":"desktop-2col"}>
            <div className="card" style={{ padding:20 }}>
              <div className="section-title">📅 Flujo por rangos</div>
              <div style={{ display:"flex", gap:10, alignItems:"flex-end", height:120, marginBottom:10 }}>
                {cfWeeks.map((d,i)=>(
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
                    <div style={{ width:"100%", display:"flex", gap:3, alignItems:"flex-end", height:100 }}>
                      <div style={{ flex:1, background:C.green, borderRadius:"6px 6px 0 0", height:`${Math.max(4,(d.e/maxCF)*100)}%` }} />
                      <div style={{ flex:1, background:C.red, borderRadius:"6px 6px 0 0", height:`${Math.max(4,(d.s/maxCF)*100)}%` }} />
                    </div>
                    <div style={{ fontSize:11,fontWeight:800,color:C.muted }}>{d.l}</div>
                    <div style={{ fontSize:10,fontWeight:700,color:d.e-d.s>=0?C.green:C.red }}>{d.e-d.s>=0?"+":""}{fmt(d.e-d.s)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",gap:16,justifyContent:"center" }}>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}><div style={{ width:12,height:12,background:C.green,borderRadius:3 }} /><span style={{ fontSize:11,fontWeight:700,color:C.muted }}>Entradas</span></div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}><div style={{ width:12,height:12,background:C.red,borderRadius:3 }} /><span style={{ fontSize:11,fontWeight:700,color:C.muted }}>Salidas</span></div>
              </div>
            </div>
            <div style={{ background:C.yellowLight, border:"2px solid "+C.yellow+"50", borderRadius:18, padding:20 }}>
              <div style={{ fontWeight:900, fontSize:15, marginBottom:6 }}>⚠️ Capital inmovilizado</div>
              <div style={{ fontSize:isMobile?28:36, fontWeight:900, color:C.yellow, marginBottom:6 }}>{fmt(frozen)}</div>
              <div style={{ fontSize:13, color:C.muted, fontWeight:600 }}>Dinero en productos sin vender. Mucho inventario = menos liquidez.</div>
            </div>
          </div>
        </div>
      )}
      {sec==="profitability" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"linear-gradient(135deg,#8B5CF6,#4A90FF)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
            <div style={{ fontSize:13,fontWeight:700,opacity:0.85,marginBottom:2 }}>{rango.id==="todo"?"Ganancia bruta total":"Ganancia bruta · "+rangoLabel(rango)}</div>
            <div style={{ fontSize:isMobile?32:44, fontWeight:900, marginBottom:4 }}>{fmt(grossP)}</div>
            <div style={{ fontSize:13,opacity:0.85 }}>Bruto: {gMargin}% · Neto: {nMargin}%</div>
          </div>
          <div className={isMobile?"":"desktop-2col"} style={{ gap:12 }}>
            {products.filter(p=>rango.id==="todo"||sF.some(s=>String(s.productId)===String(p.id))).map(p=>{const mis=sF.filter(s=>String(s.productId)===String(p.id));const unidades=mis.reduce((a,s)=>a+s.qty,0);const rev=mis.reduce((a,s)=>a+s.total,0);const cog=unidades*p.cost;const gp=rev-cog;const m=rev>0?pct(gp,rev):0;return(
              <div key={p.id} className="card" style={{ padding:16 }}>
                <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:12 }}>
                  <div className="color-dot" style={{ width:20,height:20,background:getColorCSS(p.color) }} />
                  <div style={{ flex:1 }}><div style={{ fontWeight:900,fontSize:14 }}>{p.name} <span style={{ color:C.muted,fontWeight:600,fontSize:12 }}>· {p.color}/T{p.size} · {unidades} uds</span></div></div>
                  <span className="pill" style={{ background:m>40?C.greenLight:m>20?C.yellowLight:C.redLight, color:m>40?C.green:m>20?C.yellow:C.red }}>{m}%</span>
                </div>
                <div className="grid-2" style={{ gap:8 }}>
                  {[{l:"Ingresos",v:fmt(rev),c:C.blue},{l:"Ganancia",v:fmt(gp),c:gp>0?C.green:C.red}].map(k=>(
                    <div key={k.l} style={{ background:C.bg,borderRadius:10,padding:"8px 12px" }}>
                      <div style={{ fontSize:10,color:C.muted,fontWeight:700,marginBottom:3 }}>{k.l}</div>
                      <div style={{ fontSize:13,fontWeight:900,color:k.c }}>{k.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
      {sec==="indicators" && (
        <div className={isMobile?"":"desktop-2col"} style={{ gap:16 }}>
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase",marginBottom:4 }}>CPA — Costo por Venta</div>
            <div style={{ fontSize:36,fontWeight:900,color:C.purple,marginBottom:4 }}>{fmt(cpa)}</div>
            <div style={{ background:cpa<30000?C.greenLight:C.yellowLight,borderRadius:12,padding:12,fontSize:13,fontWeight:700,color:cpa<30000?C.green:C.yellow }}>
              {cpa<30000?"✅ CPA saludable":"⚠️ CPA alto — evalúa tu publicidad"}
            </div>
          </div>
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase",marginBottom:4 }}>Punto de Equilibrio</div>
            <div style={{ fontSize:36,fontWeight:900,color:C.orange,marginBottom:10 }}>{fmt(breakEven)}</div>
            <div className="bar" style={{ height:12,marginBottom:10 }}><div className="bar-fill" style={{ width:`${Math.min(100,pct(totalSalesR,breakEven))}%`, background:totalSalesR>=breakEven?C.green:"linear-gradient(90deg,#FF8C42,#FFB800)" }} /></div>
            <div style={{ background:totalSalesR>=breakEven?C.greenLight:C.yellowLight,borderRadius:12,padding:12,fontSize:13,fontWeight:700,color:totalSalesR>=breakEven?C.green:C.yellow }}>
              {totalSalesR>=breakEven?"✅ Superaste el punto de equilibrio":`⚠️ Faltan ${fmt(breakEven-totalSalesR)}`}
            </div>
          </div>
          <div className="card" style={{ padding:20 }}>
            <div className="section-title">📊 Márgenes</div>
            {[{l:"Margen Bruto",v:gMargin,a:grossP,c:C.green},{l:"Margen Neto",v:nMargin,a:profitR,c:nMargin>0?C.teal:C.red}].map(m=>(
              <div key={m.l} style={{ marginBottom:18 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                  <span style={{ fontWeight:800,fontSize:14 }}>{m.l}</span>
                  <div style={{ textAlign:"right" }}><div style={{ fontWeight:900,fontSize:18,color:m.c }}>{m.v}%</div><div style={{ fontSize:12,fontWeight:700,color:m.c }}>{fmt(m.a)}</div></div>
                </div>
                <div className="bar" style={{ height:10 }}><div className="bar-fill" style={{ width:`${Math.max(0,Math.min(100,m.v))}%`,background:m.c }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:20 }}>
            <div className="section-title">💹 ROI del negocio</div>
            <div style={{ textAlign:"center",padding:"10px 0 20px" }}>
              <div style={{ fontSize:52,fontWeight:900,color:profitR>0?C.green:C.red }}>{pct(profitR,totalExpensesR)}%</div>
              <div style={{ fontSize:13,color:C.muted,fontWeight:700 }}>retorno sobre lo invertido</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── METRICS ───────────────────────────────────────────────────────────────────
function Metrics({ products, sales, totalSales, profit, isMobile }) {
  const topSold = [...products].sort((a,b)=>b.sold-a.sold);
  const byBrand = products.reduce((acc,p)=>{if(!acc[p.brand])acc[p.brand]=0;acc[p.brand]+=p.sold;return acc;},{});
  const byColor = products.reduce((acc,p)=>{if(!acc[p.color])acc[p.color]=0;acc[p.color]+=p.sold;return acc;},{});
  // unidades vendidas por talla
  const sizeMap = {};
  products.forEach(p => { const s = String(p.size ?? "").trim(); if (!s) return; sizeMap[s] = (sizeMap[s] || 0) + (Number(p.sold) || 0); });
  const bySize = Object.entries(sizeMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxSize = bySize[0]?.[1] || 1;
  const totalSizeSold = bySize.reduce((a, [, v]) => a + v, 0);
  const maxSold = topSold[0]?.sold||1;
  const toBuy = products.filter(p=>p.stock<p.minStock*2).sort((a,b)=>b.sold-a.sold);
  const margin = totalSales?pct(profit,totalSales):0;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="grid-4">
        {[
          {label:"Margen neto",   value:`${margin}%`,                                    color:margin>30?C.green:C.orange, bg:margin>30?C.greenLight:C.orangeLight},
          {label:"Ticket prom.", value:fmt(sales.length?Math.round(totalSales/sales.length):0), color:C.blue,   bg:C.blueLight},
          {label:"Más vendido",  value:topSold[0]?.name.split(" ")[0]||"—",              color:C.yellow, bg:C.yellowLight},
          {label:"Referencias",  value:products.length,                                  color:C.purple, bg:C.purpleLight},
        ].map(k=><div key={k.label} className="stat-card" style={{ background:k.bg }}><div style={{ fontSize:11,fontWeight:800,color:k.color,marginBottom:6,textTransform:"uppercase" }}>{k.label}</div><div style={{ fontSize:24,fontWeight:900,color:C.text }}>{k.value}</div></div>)}
      </div>
      <div className={isMobile?"":"desktop-2col"}>
        <div className="card" style={{ padding:20 }}>
          <div className="section-title">🏆 Ranking de ventas</div>
          {topSold.map((p,i)=>(
            <div key={p.id} style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center" }}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span style={{ fontSize:13,fontWeight:900,color:i===0?C.yellow:C.muted,minWidth:20 }}>#{i+1}</span>
                  <div className="color-dot" style={{ width:14,height:14,background:getColorCSS(p.color) }} />
                  <span style={{ fontWeight:800,fontSize:13 }}>{p.name} <span style={{ color:C.muted,fontWeight:600 }}>/ {p.color}</span></span>
                </div>
                <span style={{ fontWeight:900,color:C.green,fontSize:13 }}>{p.sold}</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((p.sold/maxSold)*100)}%`, background:i===0?"linear-gradient(90deg,#FFB800,#FF8C42)":"linear-gradient(90deg,#00C896,#4A90FF)" }} /></div>
            </div>
          ))}
        </div>
        <div>
          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <div className="section-title">🎨 Colores preferidos</div>
            {Object.entries(byColor).sort((a,b)=>b[1]-a[1]).map(([color,sold])=>(
              <div key={color} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center" }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <div className="color-dot" style={{ width:16,height:16,background:getColorCSS(color) }} />
                    <span style={{ fontWeight:800,fontSize:14 }}>{color}</span>
                  </div>
                  <span style={{ fontWeight:900,color:C.purple }}>{sold} uds</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((sold/Math.max(...Object.values(byColor)))*100)}%`, background:"linear-gradient(90deg,#F472B6,#8B5CF6)" }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div className="section-title" style={{ marginBottom:0 }}>📏 Tallas más vendidas</div>
              {bySize.length > 0 && <span className="pill" style={{ background:C.tealLight, color:C.teal }}>{totalSizeSold} uds</span>}
            </div>
            {bySize.length === 0 && (
              <div style={{ fontSize:13, color:C.muted, fontWeight:700, lineHeight:1.7, marginTop:6 }}>
                Aún no hay ventas por talla.<br />
                <span style={{ fontWeight:600 }}>Registra ventas y verás aquí qué tallas se van primero.</span>
              </div>
            )}
            {bySize.map(([size, sold], i) => (
              <div key={size} style={{ marginBottom:12, marginTop: i === 0 && bySize.length > 0 ? 14 : 0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", minWidth:0 }}>
                    <span style={{ height:26, padding:"0 10px", borderRadius:9, whiteSpace:"nowrap", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12.5, background:i===0?"linear-gradient(135deg,#00C896,#4A90FF)":C.bg, border:i===0?"none":"2px solid "+C.border, color:i===0?"#fff":C.text, boxShadow:i===0?"0 4px 12px rgba(0,200,150,.30)":"none" }}>
                      T {size}
                    </span>
                    <span style={{ fontWeight:800, fontSize:13, color:i===0?C.green:C.muted }}>
                      {i===0 ? "🏆 La más vendida" : `${pct(sold, totalSizeSold)}% de lo vendido`}
                    </span>
                  </div>
                  <span style={{ fontWeight:900, fontSize:13, color:i===0?C.green:C.purple }}>{sold} uds</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((sold/maxSize)*100)}%`, background:i===0?"linear-gradient(90deg,#FFB800,#FF8C42)":"linear-gradient(90deg,#4A90FF,#8B5CF6)" }} /></div>
              </div>
            ))}
          </div>
          {toBuy.length>0 && (
            <div className="card" style={{ padding:20, border:"2px solid "+C.yellow+"50" }}>
              <div className="section-title">🛒 Qué deberías comprar</div>
              {toBuy.map(p=>{const qty=Math.max(p.minStock*3,10);return(
                <div key={p.id} style={{ background:C.yellowLight,borderRadius:16,padding:"14px 16px",marginBottom:10 }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:8 }}>
                    <div className="color-dot" style={{ width:16,height:16,background:getColorCSS(p.color) }} />
                    <div style={{ fontWeight:900,fontSize:14 }}>{p.name} <span style={{ color:C.muted,fontWeight:600 }}>· {p.color}/T{p.size}</span></div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4 }}>
                    <span style={{ fontSize:13,color:C.muted,fontWeight:700 }}>Stock: <span style={{ color:C.red }}>{p.stock}</span></span>
                    <span style={{ fontSize:13,fontWeight:900,color:C.yellow }}>Comprar {qty} → {fmt(qty*p.cost)}</span>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
// Modal genérico de opciones (atajos de agregar)
function OptionPickerModal({ title, subtitle, options, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:C.muted, fontWeight:700, marginBottom:18 }}>{subtitle}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {options.map(o => (
            <button
              key={o.title}
              onClick={o.action}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=o.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";}}
              style={{ display:"flex", alignItems:"center", gap:14, background:C.bg, border:"2px solid transparent", borderRadius:16, padding:"15px 16px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", width:"100%" }}
            >
              <div style={{ width:44, height:44, background:o.bg, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, flexShrink:0 }}>{o.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:15, color:C.text }}>{o.title}</div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{o.desc}</div>
              </div>
              <div style={{ fontSize:18, color:C.muted, fontWeight:900 }}>›</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop:18 }}>
          <button className="btn-outline" onClick={onClose} style={{ width:"100%" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Modal para editar una referencia: cambia datos base y agrega/quita tallas y colores
function EditReferenceModal({ group, onClose, onSave }) {
  const [rf, setRf] = useState({ name: group.name, brand: group.brand || "", category: group.category || "Otro" });
  const [vars, setVars] = useState(() => group.variants.map(v => ({ ...v })));
  const [err, setErr] = useState("");

  const updVar = (i, key, val) => setVars(vs => vs.map((v, j) => (j === i ? { ...v, [key]: val } : v)));
  const addVar = () => setVars(vs => [...vs, {
    id: newId(), name: group.name, sku: "", brand: rf.brand, color: "", size: "",
    category: rf.category, stock: 0, minStock: 5, price: group.price || 0, cost: group.cost || 0,
    sold: 0, emoji: catEmoji[rf.category] || "📦", image: group.image || "",
  }]);
  const dropVar = (i) => setVars(vs => vs.filter((_, j) => j !== i));

  function save() {
    if (!rf.name.trim()) { setErr("El nombre de la referencia es obligatorio"); return; }
    if (!vars.length) { setErr("Debe quedar al menos una variante"); return; }
    const noSku = vars.findIndex(v => !String(v.sku || "").trim());
    if (noSku >= 0) { setErr(`Falta el SKU de la variante ${noSku + 1} — toda variante necesita SKU único`); return; }
    if (vars.some(v => v.stock === "" || v.stock == null || isNaN(+v.stock))) { setErr("Revisa el stock: debe ser un número en todas las variantes"); return; }
    setErr("");
    onSave({ refFields: rf, vars });
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20 }}>✏️ Editar referencia</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:700, marginBottom:18 }}>
          {group.variants.length} variante{group.variants.length !== 1 ? "s" : ""} — agrega tallas y colores de la MISMA referencia
        </div>

        <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:6, textTransform:"uppercase" }}>Datos de la referencia</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <div style={{ gridColumn:"span 2" }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:4 }}>Nombre *</div>
            <input className="stk-input" value={rf.name} onChange={e => setRf(p => ({ ...p, name: e.target.value }))} placeholder="Camiseta Básica" />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:4 }}>Marca</div>
            <input className="stk-input" value={rf.brand} onChange={e => setRf(p => ({ ...p, brand: e.target.value }))} placeholder="Nike" />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:4 }}>Categoría</div>
            <select className="stk-input" value={rf.category} onChange={e => setRf(p => ({ ...p, category: e.target.value }))}>
              {["Ropa","Calzado","Accesorios","Otro"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase" }}>Variantes ({vars.length})</div>
          <button className="filter-btn" onClick={addVar}>➕ Agregar talla/color</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {vars.map((v, i) => {
            const isNew = !group.variants.some(gv => String(gv.id) === String(v.id));
            return (
              <div key={v.id} style={{ background:C.bg, border:`1.5px solid ${isNew ? C.green : C.border}`, borderRadius:14, padding:"10px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:900, color:isNew ? C.green : C.muted }}>
                    {isNew ? "✨ Nueva variante" : `Variante ${i + 1}`}
                  </span>
                  <button onClick={() => dropVar(i)} style={{ background:"none", border:"none", color:C.red, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>✕ Quitar</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(92px, 1fr))", gap:8 }}>
                  {[
                    { k:"color",   ph:"Color",     v:v.color },
                    { k:"size",    ph:"Talla",     v:v.size },
                    { k:"sku",     ph:"SKU *",     v:v.sku },
                    { k:"stock",   ph:"Stock *",   v:v.stock,   type:"number" },
                    { k:"minStock",ph:"Mín",       v:v.minStock,type:"number" },
                    { k:"price",   ph:"Precio $",  v:v.price,   type:"number" },
                    { k:"cost",    ph:"Costo $",   v:v.cost,    type:"number" },
                  ].map(fd => (
                    <div key={fd.k}>
                      <input
                        className="stk-input"
                        type={fd.type || "text"}
                        placeholder={fd.ph}
                        value={fd.v == null ? "" : fd.v}
                        onChange={e => updVar(i, fd.k, fd.type === "number" ? (e.target.value === "" ? "" : +e.target.value) : e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {err && <div style={{ marginBottom:12, background:C.redLight, color:C.red, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800 }}>⚠️ {err}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex:2 }}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ onClose, onSave, workspaceId, showToast }) {
  const [f, setF] = useState({ name:"",sku:"",brand:"",color:"",size:"",stock:"",minStock:"5",price:"",cost:"",category:"Ropa" });
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const photoRef = useRef(null);

  async function pickPhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { setImage(await uploadProductImage(file, workspaceId)); }
    catch (err) { console.error("[stokly] foto:", err && err.message); if (showToast) showToast("❌ No se pudo subir la foto"); }
    finally { setUploading(false); }
  }

  function save() {
    if (uploading) { setErr("⏳ Espera a que termine de subir la foto"); return; }
    const miss = [];
    if (!f.name.trim()) miss.push("Nombre");
    if (!f.sku.trim()) miss.push("SKU");
    if (f.stock === "" || f.stock == null) miss.push("Stock");
    if (miss.length) { setErr("Faltan campos obligatorios: " + miss.join(", ")); return; }
    setErr("");
    onSave({ ...f, id:newId(), stock:+f.stock, minStock:+f.minStock, price:+f.price||0, cost:+f.cost||0, sold:0, emoji:catEmoji[f.category]||"📦", image });
  }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>📦 Nuevo producto</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[{label:"Nombre *",key:"name",ph:"Camiseta Básica",full:true},{label:"SKU *",key:"sku",ph:"CAM-001"},{label:"Marca",key:"brand",ph:"Nike"},{label:"Color",key:"color",ph:"Blanco"},{label:"Talla",key:"size",ph:"M / 42"},{label:"Stock *",key:"stock",ph:"0",type:"number"},{label:"Stock mínimo",key:"minStock",ph:"5",type:"number"},{label:"Precio ($)",key:"price",ph:"0",type:"number"},{label:"Costo ($)",key:"cost",ph:"0",type:"number"}].map(field=>(
            <div key={field.key} style={{ gridColumn:field.full?"span 2":"span 1" }}>
              <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>{field.label}</div>
              <input className="stk-input" type={field.type||"text"} placeholder={field.ph} value={f[field.key]} onChange={e=>setF(p=>({...p,[field.key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ gridColumn:"span 2" }}>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Categoría</div>
            <select className="stk-input" value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>
              {["Ropa","Calzado","Accesorios","Otro"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Foto del producto (opcional)</div>
          <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display:"none" }} />
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {image ? (
              <>
                <img src={image} alt="Vista previa" style={{ width:56, height:56, borderRadius:14, objectFit:"cover", border:"2px solid #EAECF5" }} />
                <button className="filter-btn" onClick={()=>photoRef.current&&photoRef.current.click()} disabled={uploading}>{uploading ? "⏳ Subiendo…" : "🔄 Cambiar"}</button>
                <button className="filter-btn" onClick={()=>setImage("")}>✕ Quitar</button>
              </>
            ) : (
              <button className="filter-btn" onClick={()=>photoRef.current&&photoRef.current.click()} disabled={uploading}>{uploading ? "⏳ Subiendo…" : "📷 Agregar foto"}</button>
            )}
          </div>
        </div>
        {err && <div style={{ marginBottom:12, background:C.redLight, color:C.red, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800 }}>⚠️ {err}</div>}
        <div style={{ display:"flex",gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} disabled={uploading} style={{ flex:2, opacity:uploading?0.6:1 }}>Guardar producto</button>
        </div>
      </div>
    </div>
  );
}

function AddSaleModal({ products, onClose, onSave }) {
  const [pid,setPid]=useState(""); const [qty,setQty]=useState(1); const [method,setMethod]=useState("Efectivo");
  const p=products.find(x=>String(x.id)===String(pid)); const total=p?p.price*qty:0;
  function save() { if(!p||qty<1||p.stock<qty) return; onSave({id:newId(),productId:String(pid),qty:+qty,total,date:hoyISO(),method},String(pid),+qty); }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>💰 Registrar venta</div>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Producto</div>
            <select className="stk-input" value={pid} onChange={e=>setPid(e.target.value)}>
              <option value="">Selecciona un producto</option>
              {products.filter(p=>p.stock>0).map(p=><option key={p.id} value={String(p.id)}>{p.emoji} {p.name} — {p.color}/T{p.size} ({p.stock} disp.) — {fmt(p.price)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Cantidad</div>
            <div style={{ display:"flex",gap:16,alignItems:"center",justifyContent:"center" }}>
              <button className="stock-btn" style={{ width:48,height:48,fontSize:24 }} onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
              <span style={{ fontSize:36,fontWeight:900,minWidth:50,textAlign:"center" }}>{qty}</span>
              <button className="stock-btn" style={{ width:48,height:48,fontSize:24 }} onClick={()=>setQty(q=>Math.min(p?.stock||99,q+1))}>+</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Método de pago</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["Efectivo","Tarjeta","Nequi","Transferencia","Daviplata"].map(m=><button key={m} className={`filter-btn ${method===m?"active":""}`} onClick={()=>setMethod(m)}>{m}</button>)}
            </div>
          </div>
          {p&&<div style={{ background:C.greenLight,borderRadius:16,padding:"16px 20px",textAlign:"center" }}><div style={{ fontSize:13,color:C.muted,fontWeight:700 }}>Total a cobrar</div><div style={{ fontSize:36,fontWeight:900,color:C.green }}>{fmt(total)}</div></div>}
        </div>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex:2 }}>Confirmar venta</button>
        </div>
      </div>
    </div>
  );
}

function AddExpenseModal({ onClose, onSave }) {
  const [f,setF]=useState({concept:"",amount:"",category:"Operacional",date:hoyISO(),dateEnd:""});
  const [err,setErr]=useState("");
  const ce={Operacional:"🏪",Compras:"🛍️",Marketing:"📱",Logística:"🚚",Otro:"💡"};
  function save() {
    if(!f.concept.trim()||!f.amount){ setErr("⚠️ Completa el concepto y el monto."); return; }
    if(f.dateEnd&&f.date&&f.dateEnd<f.date){ setErr("⚠️ La fecha \"Hasta\" es anterior a la fecha de inicio."); return; }
    if(f.date>hoyISO()){ if(!window.confirm(`⚠️ La fecha es FUTURA (${f.date}).\n\n¿Registrar el gasto de todas formas?`)) return; }
    setErr("");
    onSave({...f,id:newId(),amount:+f.amount,date:f.date||hoyISO(),dateEnd:f.dateEnd||"",emoji:ce[f.category]||"💡"});
  }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>💸 Registrar gasto</div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Concepto</div><input className="stk-input" placeholder="Ej: Arriendo del mes" value={f.concept} onChange={e=>setF(p=>({...p,concept:e.target.value}))} /></div>
          <div><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Monto ($)</div><input className="stk-input" type="number" placeholder="0" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} /></div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Fecha del gasto</div><input className="stk-input" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} /></div>
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Hasta (opcional)</div><input className="stk-input" type="date" value={f.dateEnd} onChange={e=>setF(p=>({...p,dateEnd:e.target.value}))} /></div>
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:-6 }}>📅 Si duró varios días (ej: publicidad del 24 sep al 10 oct). Déjalo vacío si fue un solo día.</div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Categoría</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["Operacional","Compras","Marketing","Logística","Otro"].map(c=><button key={c} className={`filter-btn ${f.category===c?"active":""}`} onClick={()=>setF(p=>({...p,category:c}))}>{ce[c]} {c}</button>)}
            </div>
          </div>
        </div>
        {err && <div style={{ background:C.redLight, color:C.red, borderRadius:12, padding:"10px 12px", fontSize:13, fontWeight:800, marginTop:4 }}>{err}</div>}
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main btn-orange" onClick={save} style={{ flex:2 }}>Guardar gasto</button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImport, importView="file", workspaceId }) {
  const [step,setStep]=useState("upload"); const [dragOver,setDragOver]=useState(false);
  const [parsed,setParsed]=useState([]); const [error,setError]=useState(""); const [mode,setMode]=useState("merge"); const [fileName,setFileName]=useState("");
  const [src,setSrc]=useState(importView==="sheet"?"sheet":"file"); // "file" | "sheet"
  const [sheetUrl,setSheetUrl]=useState(""); const [loadingSheet,setLoadingSheet]=useState(false);
  const [fotos,setFotos]=useState({});        // {archivo.jpg: File} fotos adjuntadas
  const [rotas,setRotas]=useState({});        // {indice:true} enlaces que no cargan
  const [subiendo,setSubiendo]=useState("");  // "📷 Subiendo fotos… 2/5"
  const fileRef=useRef();
  const fotosRef=useRef();
  const xlsxOcupado=useRef(false);
  const PLANTILLA_HEADERS = ["nombre","sku","marca","color","talla","categoria","stock","stock mínimo","precio venta","costo","imagen (foto o enlace)"];
  const PLANTILLA_EJEMPLO = ["Camiseta Básica","CAM-001","Nike","Blanco","M","Ropa","10","5","199.99","80.50","camiseta.jpg"];

  // Carga la librería XLSX solo si hace falta (compartida por importar y plantilla)
  function cargarXLSX(msgCarga, msgFallo, cb) {
    if (window.XLSX) { cb(); return; }
    if (xlsxOcupado.current) return;
    xlsxOcupado.current = true;
    setError(msgCarga);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => { xlsxOcupado.current = false; setError(""); cb(); };
    s.onerror = () => { xlsxOcupado.current = false; setError(msgFallo); };
    document.head.appendChild(s);
  }

  //1) Plantilla REAL de Excel (.xlsx) — columnas garantizadas en cualquier idioma de Excel
  function descargarExcel() {
    cargarXLSX(
      "⏳ Preparando plantilla de Excel…",
      "No se pudo cargar el generador de Excel. Revisa tu conexión o usa la plantilla CSV de abajo.",
      () => {
        try {
          const ws = XLSX.utils.aoa_to_sheet([PLANTILLA_HEADERS, PLANTILLA_EJEMPLO]);
          ws["!cols"] = PLANTILLA_HEADERS.map((h, i) => ({ wch: Math.max(String(h).length, String(PLANTILLA_EJEMPLO[i] || "").length) + 2 }));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Inventario");
          XLSX.writeFile(wb, "plantilla-inventario-stokly.xlsx");
        } catch (e) { setError("No se pudo generar la plantilla: " + e.message); }
      }
    );
  }

  //2) Plantilla CSV con ";" (Excel español + Google Sheets la reconocen con columnas)
  function descargarCSV() {
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const csv = "\uFEFF" + [PLANTILLA_HEADERS, PLANTILLA_EJEMPLO].map(r => r.map(esc).join(";")).join("\n") + "\n";
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plantilla-inventario-stokly.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function processFile(file) {
    if(!file)return; setFileName(file.name); setError("");
    if(file.name.match(/\.xlsx?$/i)) {
      cargarXLSX("⏳ Cargando lector de Excel…", "No se pudo cargar el lector de Excel. Revisa tu conexión e inténtalo otra vez.", () => {
        const r=new FileReader();
        r.onload=e=>{try{const X=window.XLSX;if(!X){setError("El lector de Excel no cargó. Vuelve a intentarlo.");return;}const wb=X.read(e.target.result,{type:"array"});const csv=X.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);const p=parseCSV(csv);if(!p.length){setError("No se encontraron productos. Revisa los encabezados.");return;}setParsed(p);setStep("preview");}catch(err){setError("Error: "+err.message);}};
        r.readAsArrayBuffer(file);
      });
    } else if(file.name.match(/\.(csv|tsv|txt)$/i)) {
      const r=new FileReader(); r.onload=e=>{const p=parseCSV(e.target.result);if(!p.length){setError("Sin productos.");return;}setParsed(p);setStep("preview");};r.readAsText(file,"UTF-8");
    } else setError("Usa .xlsx o .csv");
  }

  // Convierte cualquier enlace de Google Sheets a su exportación CSV
  function sheetsToCsv(u){
    const s=(u||"").trim();
    if(!s) return null;
    if(/\/export\?format=csv/i.test(s)) return s;
    const m=s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if(!m) return null;
    const gid=(s.match(/[#&?]gid=(\d+)/)||[])[1];
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid?`&gid=${gid}`:""}`;
  }
  async function loadSheet(){
    const url=sheetsToCsv(sheetUrl);
    if(!url){ setError("Pega un enlace válido de Google Sheets (que contenga /spreadsheets/d/)"); return; }
    setLoadingSheet(true); setError(""); setFileName("Google Sheets");
    try{
      const res=await fetch(url,{headers:{Accept:"text/csv"}});
      if(!res.ok) throw new Error("No pude leer la hoja ("+res.status+"). Comparte: Compartir → Cualquier persona con el enlace → Lector.");
      const text=await res.text();
      const t=text.trim();
      if(t.startsWith("<!DOCTYPE")||t.startsWith("<html"))
        throw new Error("Google devolvió una página, no datos. Comparte la hoja: Compartir → Cualquier persona con el enlace → Lector.");
      const p=parseCSV(text);
      if(!p.length){ setError("La hoja se abrió pero no tiene productos. Usa encabezados: nombre, sku, stock, precio..."); return; }
      setParsed(p); setStep("preview");
    }catch(err){ setError(err.message||"No se pudo conectar con Google Sheets."); }
    finally{ setLoadingSheet(false); }
  }

  // Sube las fotos adjuntadas (se emparejan por nombre de archivo) y arma los productos finales
  async function importar() {
    if (subiendo) return;
    const unicas = [];
    parsed.forEach(p => {
      const v = (p.image||"").trim();
      if (!v || normalizarFotoURL(v)) return;
      const base = v.split(/[\\/]/).pop().toLowerCase();
      if (fotos[base] && !unicas.includes(base)) unicas.push(base);
    });
    const mapaURL = {};
    let fallos = 0;
    if (unicas.length) {
      for (let i = 0; i < unicas.length; i++) {
        const base = unicas[i];
        setSubiendo(`📷 Subiendo fotos… ${i+1}/${unicas.length}`);
        try { mapaURL[base] = await uploadProductImage(fotos[base], workspaceId); }
        catch (e) { console.error("[stokly] foto import:", e && e.message); fallos++; }
      }
      setSubiendo("✅ Fotos listas — importando…");
    }
    let sinFoto = 0;
    const finalP = parsed.map(p => {
      const v = (p.image||"").trim();
      if (!v) return p;
      const url = normalizarFotoURL(v);
      if (url) return { ...p, image: url };
      const base = v.split(/[\\/]/).pop().toLowerCase();
      if (mapaURL[base]) return { ...p, image: mapaURL[base] };
      sinFoto++;
      return { ...p, image: "" };
    });
    setSubiendo("");
    let aviso = "";
    const rotasN = Object.keys(rotas).length;
    if (fallos) aviso += `${fallos} foto(s) no se pudieron subir`;
    if (sinFoto) aviso += (aviso ? " · " : "") + `${sinFoto} sin foto (falta adjuntarla)`;
    if (rotasN) aviso += (aviso ? " · " : "") + `${rotasN} enlace(s) de imagen no cargan`;
    onImport(finalP, mode, aviso);
  }

  const conFoto = parsed.filter(p => !!(p.image||"").trim()).length;
  const pendAdj = parsed.filter(p => {
    const v = (p.image||"").trim();
    if (!v || normalizarFotoURL(v)) return false;
    return !fotos[v.split(/[\\/]/).pop().toLowerCase()];
  }).length;

  const srcBtn=(id,emoji,label,desc,color,bg)=>(
    <button key={id} onClick={()=>{setSrc(id);setError("");}} style={{ flex:1,background:src===id?bg:C.bg,border:`2px solid ${src===id?color:C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"left" }}>
      <div style={{ fontWeight:900,fontSize:13,color:src===id?color:C.text }}>{emoji} {label}</div>
      <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{desc}</div>
    </button>
  );

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        {step==="upload"&&<>
          <div style={{ fontWeight:900,fontSize:20,marginBottom:14 }}>📥 Importar inventario</div>

          {/* Selector de origen */}
          <div style={{ display:"flex",gap:10,marginBottom:12 }}>
            {srcBtn("file","📂","Excel / CSV","Sube un archivo",C.blue,C.blueLight)}
            {srcBtn("sheet","🔗","Google Sheets","Pega el enlace",C.green,C.greenLight)}
          </div>

          {/* Plantilla oficial descargable */}
          <div style={{ background:C.blueLight, borderRadius:14, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.6, marginBottom:10, color:C.text }}>
              📄 <b>Plantilla oficial</b> — todos los campos, <b>un producto de ejemplo</b> y columna <b>imagen</b>.<br/>
              <span style={{ color:C.muted, fontWeight:600 }}>Borra la fila de ejemplo antes de importar · usa punto para decimales (199.99) · en "imagen" escribe el nombre de la foto (camiseta.jpg) y adjúntala en el paso siguiente — o pega un enlace público (https://…)</span>
            </div>
            <button className="btn-main" onClick={descargarExcel} style={{ width:"100%", marginBottom:8 }}>📥 Descargar plantilla para Excel (.xlsx)</button>
            <button className="btn-outline" onClick={descargarCSV} style={{ width:"100%", fontWeight:900 }}>📄 Descargar plantilla CSV (para Google Sheets)</button>
          </div>

          {src==="file" && (
            <div className={`drop-zone ${dragOver?"drag-over":""}`} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current.click()}>
              <div style={{ fontSize:40,marginBottom:10 }}>📁</div>
              <div style={{ fontWeight:900,fontSize:16,marginBottom:6 }}>Arrastra tu archivo</div>
              <div style={{ fontSize:13,color:C.muted,fontWeight:600 }}>Excel (.xlsx) o CSV</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv" style={{ display:"none" }} onChange={e=>processFile(e.target.files[0])} />
            </div>
          )}

          {src==="sheet" && (
            <div style={{ background:C.greenLight, borderRadius:20, padding:18 }}>
              <div style={{ fontSize:40,marginBottom:8,textAlign:"center" }}>🔗</div>
              <div style={{ fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase",marginBottom:6 }}>Enlace de tu hoja</div>
              <input className="stk-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadSheet()} />
              <button className="btn-main" onClick={loadSheet} disabled={loadingSheet} style={{ width:"100%",marginTop:12,opacity:loadingSheet?0.7:1 }}>
                {loadingSheet?"Leyendo hoja…":"Leer hoja de Google"}
              </button>
              <div style={{ fontSize:12,color:C.muted,fontWeight:600,marginTop:12,lineHeight:1.6 }}>
                <b>Cómo prepararla:</b> en Google Sheets → <b>Compartir</b> → <i>Cualquier persona con el enlace</i> → <b>Lector</b>.<br/>
                Encabezados necesarios: <b>nombre, sku, stock</b> (opcionales: marca, color, talla, categoría, precio, costo, mínimo, <b>imagen</b>).<br/>
                💡 Toma la <b>plantilla</b> de arriba, súbela a Google Sheets y llénala.
              </div>
            </div>
          )}

          {error&&<div style={{ background:C.redLight,borderRadius:12,padding:12,marginTop:12,fontSize:13,fontWeight:700,color:C.red,lineHeight:1.5 }}>{error}</div>}
          <button className="btn-outline" onClick={onClose} style={{ width:"100%",marginTop:16 }}>Cancelar</button>
        </>}
        {step==="preview"&&<>
          <div style={{ fontWeight:900,fontSize:20,marginBottom:4 }}>✅ Vista previa</div>
          <div style={{ fontSize:13,color:C.muted,fontWeight:600,marginBottom:16 }}>{fileName} · {parsed.length} productos · 📷 {conFoto} con foto{pendAdj?` · ⚠️ ${pendAdj} sin adjuntar`:""}</div>
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            {[{id:"merge",label:"➕ Agregar",desc:"No duplica SKUs"},{id:"replace",label:"🔄 Reemplazar",desc:"Borra el actual"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{ flex:1,background:mode===m.id?C.greenLight:C.bg,border:`2px solid ${mode===m.id?C.green:C.border}`,borderRadius:14,padding:12,cursor:"pointer",fontFamily:"inherit" }}>
                <div style={{ fontWeight:900,fontSize:13,color:mode===m.id?C.green:C.text }}>{m.label}</div>
                <div style={{ fontSize:11,color:C.muted }}>{m.desc}</div>
              </button>
            ))}
          </div>
          {/* Adjuntar fotos desde el celular o la computadora */}
          <div style={{ background:C.blueLight, borderRadius:14, padding:12, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:900, marginBottom:4 }}>📎 Adjuntar fotos (opcional)</div>
            <div style={{ fontSize:11.5, color:C.muted, fontWeight:600, lineHeight:1.6, marginBottom:8 }}>
              En la columna <b>imagen</b> escribe el <b>nombre del archivo</b> de la foto (ej: <i>camiseta.jpg</i>) y aquí adjunta las fotos: Stokly las sube y las deja guardadas en cada producto. Si prefieres, pega un <b>enlace https://…</b> en esa columna (Google Drive también funciona).
            </div>
            <input ref={fotosRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>{
              const map = {};
              Array.from(e.target.files || []).forEach(f => { map[f.name.split(/[\\/]/).pop().toLowerCase()] = f; });
              setFotos(map); setRotas({});
            }} />
            <button className="filter-btn" onClick={() => fotosRef.current.click()}>
              {Object.keys(fotos).length ? `📷 ${Object.keys(fotos).length} fotos adjuntadas — cambiar` : "📷 Seleccionar fotos del celular/computador"}
            </button>
            {pendAdj > 0 && <div style={{ fontSize:11, color:C.orange, fontWeight:800, marginTop:6 }}>⚠️ {pendAdj} producto(s) piden foto y todavía no está adjunta</div>}
          </div>
          <div className="card" style={{ padding:14,maxHeight:250,overflowY:"auto",marginBottom:16 }}>
            {parsed.slice(0,40).map((p,i)=>{
              const val=(p.image||"").trim();
              const url=normalizarFotoURL(val);
              const nombreFoto=val&&!url?val.split(/[\\/]/).pop().toLowerCase():"";
              const adjunta=nombreFoto?!!fotos[nombreFoto]:false;
              return (
              <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border }}>
                {url ? (rotas[i]
                  ? <div style={{ width:26,height:26,borderRadius:7,background:C.redLight,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }} title="El enlace no carga">⚠️</div>
                  : <img src={url} alt="" onError={()=>setRotas(prev=>({...prev,[i]:true}))} style={{ width:26, height:26, borderRadius:7, objectFit:"cover", border:"1.5px solid #EAECF5", flexShrink:0 }} />)
                : nombreFoto
                  ? <div style={{ width:26,height:26,borderRadius:7,background:adjunta?C.greenLight:C.bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,border:adjunta?"1.5px solid "+C.green:"1.5px dashed "+C.border }} title={nombreFoto}>📷</div>
                  : <div className="color-dot" style={{ background:getColorCSS(p.color), flexShrink:0 }} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:13 }}>{p.name}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{p.brand} · {p.color} · T{p.size}</div>
                  {rotas[i] && <div style={{ fontSize:10.5,color:C.red,fontWeight:800 }}>⚠️ El enlace no carga — adjunta la foto o corrige el enlace</div>}
                  {nombreFoto && !adjunta && !rotas[i] && <div style={{ fontSize:10.5,color:C.orange,fontWeight:800 }}>📎 Falta adjuntar "{nombreFoto}"</div>}
                  {adjunta && <div style={{ fontSize:10.5,color:C.green,fontWeight:800 }}>✅ Foto lista: {nombreFoto}</div>}
                </div>
                <span style={{ fontWeight:900,fontSize:12,color:C.green }}>{p.stock} uds</span>
              </div>
              );
            })}
            {parsed.length>40&&<div style={{ textAlign:"center",color:C.muted,fontSize:12,padding:8 }}>+{parsed.length-40} más...</div>}
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button className="btn-outline" onClick={()=>{setStep("upload");setParsed([]);setFotos({});setRotas({});}} style={{ flex:1 }}>← Volver</button>
            <button className="btn-main" onClick={importar} disabled={!!subiendo} style={{ flex:2, opacity:subiendo?0.7:1 }}>{subiendo || `Importar ${parsed.length}`}</button>
          </div>
        </>}
      </div>
    </div>
  );
}
