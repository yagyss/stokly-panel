import { useState, useEffect, useRef } from "react";
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
    if (!g[k]) g[k] = { name:p.name, brand:p.brand, emoji:p.emoji, category:p.category, price:p.price, cost:p.cost, variants:[] };
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
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delim).map(h=>h.replace(/"/g,"").trim().toLowerCase());
  const colMap = { nombre:["nombre","name","producto"], sku:["sku","código","ref"], brand:["marca","brand"], color:["color"], size:["talla","size"], category:["categoría","categoria"], stock:["stock","cantidad"], minStock:["stock mínimo","min stock","mínimo"], price:["precio venta","precio","price"], cost:["costo","cost"] };
  const findCol = k => { for (const v of (colMap[k]||[k])) { const i = headers.findIndex(h=>h.includes(v)); if (i!==-1) return i; } return -1; };
  const cols = {}; for (const k of Object.keys(colMap)) cols[k] = findCol(k);
  return lines.slice(1).filter(l=>l.trim()).map((line,i) => {
    const vals = line.split(delim).map(v=>v.replace(/"/g,"").trim());
    const get = k => cols[k]!==-1 ? (vals[cols[k]]||"") : "";
    const name=get("nombre"),sku=get("sku"),stockRaw=get("stock");
    if (!name||!sku||!stockRaw) return null;
    const category=get("category")||"Otro";
    return { id:newId(),name,sku,brand:get("brand")||"",color:get("color")||"",size:get("size")||"",category,stock:parseInt(stockRaw)||0,minStock:parseInt(get("minStock"))||5,price:parseFloat(get("price").replace(/[^0-9.]/g,""))||0,cost:parseFloat(get("cost").replace(/[^0-9.]/g,""))||0,sold:0,emoji:catEmoji[category]||"📦" };
  }).filter(Boolean);
};

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
  .view-toggle { display: flex; background: #F7F8FC; border-radius: 12px; padding: 4px; gap: 2px; }
  .view-btn { border: none; background: none; border-radius: 9px; padding: 6px 13px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit; color: #8B8FA8; }
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
  const [products, setProducts, pStatus] = useSyncedTable("products", { fromRow: productFromRow, toRow: productToRow }, user?.id, workspaceId);
  const [sales, setSales]           = useSyncedTable("sales",     { fromRow: saleFromRow,     toRow: saleToRow     }, user?.id, workspaceId);
  const [expenses, setExpenses]     = useSyncedTable("expenses",  { fromRow: expenseFromRow,  toRow: expenseToRow  }, user?.id, workspaceId);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // Primera vez: cargar datos de ejemplo para que el panel no arranque vacío
  // (solo en el panel propio, nunca en uno compartido)
  const seedRef = useRef(false);
  useEffect(() => {
    if (!user || !workspaceId || pStatus !== "ready" || seedRef.current) return;
    if (workspaceId !== user.id) { seedRef.current = true; return; }
    if (products.length > 0) { seedRef.current = true; return; }
    seedRef.current = true;
    setProducts(INIT_PRODUCTS.map(p => ({ ...p, id: String(p.id) })));
    setSales(INIT_SALES.map(s => ({ ...s, id: String(s.id), productId: String(s.productId) })));
    setExpenses(INIT_EXPENSES.map(e => ({ ...e, id: String(e.id) })));
    showToast("✨ Cargamos datos de ejemplo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workspaceId, pStatus, products.length]);

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
            {tab==="inventory" && <button onClick={() => setModal("product")} className="btn-main" style={{ padding:"9px 16px", fontSize:13 }}>+ Producto</button>}
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
            <button
              onClick={() => setModal("team")}
              title="Invitar a tu equipo"
              style={{ background:C.purpleLight, border:"none", borderRadius:12, padding:"7px 11px", cursor:"pointer", fontWeight:800, fontSize:13, color:C.purple, fontFamily:"inherit" }}
            >
              👥{!isMobile && " Equipo"}
            </button>
            <button onClick={() => signOut()} title="Cerrar sesión" style={{ background:C.bg, border:"none", borderRadius:12, padding:"7px 10px", cursor:"pointer", fontWeight:800, fontSize:12, color:C.muted, fontFamily:"inherit" }}>⏻</button>
            <div title={user.email} style={{ width:36, height:36, background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:15 }}>{(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}</div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">
          {tab==="home"      && <Home      products={products} sales={sales} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} lowStock={lowStock} setTab={setTab} setModal={setModal} isMobile={isMobile} />}
          {tab==="inventory" && <Inventory products={products} setProducts={setProducts} lowStock={lowStock} showToast={showToast} setModal={setModal} setImportView={setImportView} isMobile={isMobile} />}
          {tab==="sales"     && <Sales     sales={sales} setSales={setSales} products={products} setProducts={setProducts} totalSales={totalSales} isMobile={isMobile} />}
          {tab==="expenses"  && <Expenses  expenses={expenses} setExpenses={setExpenses} totalExpenses={totalExpenses} showToast={showToast} isMobile={isMobile} />}
          {tab==="finance"   && <Finance   products={products} sales={sales} expenses={expenses} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} isMobile={isMobile} />}
          {tab==="metrics"   && <Metrics   products={products} sales={sales} totalSales={totalSales} profit={profit} isMobile={isMobile} />}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn-mob ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize:20 }}>{t.emoji}</span>
            <span style={{ fontSize:9, fontWeight:800, color:tab===t.id?C.green:C.muted }}>{t.label}</span>
          </button>
        ))}
      </div>

      {modal==="product" && <AddProductModal onClose={() => setModal(null)} onSave={p => { setProducts(prev=>[...prev,p]); setModal(null); showToast("✅ Producto agregado"); }} />}
      {modal==="import"  && <ImportModal    importView={importView} onClose={() => setModal(null)} onImport={(newP,mode) => { if(mode==="replace") setProducts(newP); else setProducts(prev => { const s=new Set(prev.map(p=>p.sku)); return [...prev,...newP.filter(p=>!s.has(p.sku))]; }); setModal(null); showToast(`✅ ${newP.length} importados`); }} />}
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
              { label:"Agregar producto", emoji:"📦", color:C.blue,   bg:C.blueLight,   action:()=>setModal("product") },
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
function Inventory({ products, setProducts, lowStock, showToast, setModal, setImportView, isMobile }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("visual");
  const [filterCat, setFilterCat] = useState("Todos");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const categories = ["Todos", ...new Set(products.map(p=>p.category))];
  const q = search.toLowerCase();
  const filtered = products.filter(p =>
    (filterCat==="Todos" || p.category===filterCat) &&
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.color.toLowerCase().includes(q) || p.size.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );
  const groups = groupProducts(filtered);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Search + controls */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 240px" }}>
          <input className="stk-input" placeholder="🔍 Busca por nombre, color, talla, marca..." value={search} onChange={e=>setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,fontWeight:900 }}>✕</button>}
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode==="visual"?"active":""}`} onClick={()=>setViewMode("visual")}>📋 Visual</button>
          <button className={`view-btn ${viewMode==="list"?"active":""}`} onClick={()=>setViewMode("list")}>☰ Lista</button>
        </div>
        <button onClick={()=>{setImportView("file");setModal("import");}} style={{ background:C.blueLight, color:C.blue, border:"none", borderRadius:12, padding:"10px 14px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>📂 Excel / CSV</button>
        <button onClick={()=>{setImportView("sheet");setModal("import");}} style={{ background:C.greenLight, color:C.green, border:"none", borderRadius:12, padding:"10px 14px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>🔗 Google Sheets</button>
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
                      <div style={{ width:42,height:42, background:hasAlert?C.redLight:C.greenLight, borderRadius:13, display:"flex",alignItems:"center",justifyContent:"center", fontSize:22 }}>{group.emoji}</div>
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
                    <span style={{ marginLeft:"auto", fontSize:14, color:C.muted }}>{isExpanded?"▲":"▼"}</span>
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
                      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
                        <button onClick={()=>{setProducts(prev=>prev.filter(p=>!group.variants.find(v=>v.id===p.id)));showToast("🗑️ Eliminado");}} style={{ background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Eliminar referencia</button>
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
                  <div className="color-dot" style={{ width:22,height:22, background:getColorCSS(p.color), flexShrink:0 }} />
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
                    <button onClick={()=>{setProducts(prev=>prev.filter(x=>x.id!==p.id));showToast("🗑️");}} style={{ background:C.redLight,border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:800,fontSize:12,color:C.red,fontFamily:"inherit" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length===0 && <div style={{ textAlign:"center",padding:40,color:C.muted,fontWeight:700 }}>Sin resultados 🔍</div>}
        </div>
      )}
    </div>
  );
}

// ── SALES ─────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, products, setProducts, totalSales, isMobile }) {
  const byMethod = sales.reduce((acc,s)=>{acc[s.method]=(acc[s.method]||0)+s.total;return acc;},{});
  const colors = { Efectivo:[C.green,C.greenLight], Tarjeta:[C.blue,C.blueLight], Nequi:[C.purple,C.purpleLight], Transferencia:[C.orange,C.orangeLight], Daviplata:[C.red,C.redLight] };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85 }}>Total del mes</div>
        <div style={{ fontSize:isMobile?32:44, fontWeight:900 }}>{fmt(totalSales)}</div>
      </div>
      <div className="grid-4">
        {Object.entries(byMethod).map(([m,total])=>{const[color,bg]=colors[m]||[C.muted,C.bg];return <div key={m} className="stat-card" style={{ background:bg }}><div style={{ fontSize:12,fontWeight:800,color,marginBottom:4 }}>{m}</div><div style={{ fontSize:20,fontWeight:900 }}>{fmt(total)}</div><div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{pct(total,totalSales)}%</div></div>;})}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div className="section-title">Historial</div>
        {[...sales].reverse().map(s=>{
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
              <div style={{ fontWeight:900, fontSize:16, color:C.green }}>{fmt(s.total)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function Expenses({ expenses, setExpenses, totalExpenses, showToast, isMobile }) {
  const byCategory = expenses.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"linear-gradient(135deg,#FF8C42,#FF5A5F)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85 }}>Total gastos</div>
        <div style={{ fontSize:isMobile?32:44, fontWeight:900 }}>{fmt(totalExpenses)}</div>
      </div>
      <div className="grid-4">
        {Object.entries(byCategory).map(([cat,amount])=><div key={cat} className="stat-card" style={{ background:C.orangeLight }}><div style={{ fontSize:12,fontWeight:800,color:C.orange,marginBottom:4 }}>{cat}</div><div style={{ fontSize:20,fontWeight:900 }}>{fmt(amount)}</div></div>)}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div className="section-title">Historial</div>
        {[...expenses].reverse().map(e=>(
          <div key={e.id} className="row-item">
            <div style={{ width:38,height:38,background:C.orangeLight,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{e.emoji}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:14 }}>{e.concept}</div><div style={{ fontSize:11,color:C.muted,fontWeight:600 }}>{e.date} · {e.category}</div></div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
              <div style={{ fontWeight:900,fontSize:16,color:C.red }}>{fmt(e.amount)}</div>
              <button onClick={()=>{setExpenses(prev=>prev.filter(x=>x.id!==e.id));showToast("🗑️ Eliminado");}} style={{ background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FINANCE ───────────────────────────────────────────────────────────────────
function Finance({ products, sales, expenses, totalSales, totalExpenses, profit, isMobile }) {
  const [sec, setSec] = useState("cashflow");
  const mktExp = expenses.filter(e=>e.category==="Marketing").reduce((a,e)=>a+e.amount,0);
  const opExp  = expenses.filter(e=>e.category==="Operacional").reduce((a,e)=>a+e.amount,0);
  const cogs   = products.reduce((a,p)=>a+p.sold*p.cost,0);
  const grossP = totalSales - cogs;
  const gMargin= pct(grossP,totalSales);
  const nMargin= pct(profit,totalSales);
  const cpa    = sales.length > 0 ? mktExp/sales.length : 0;
  const fixed  = opExp + mktExp;
  const breakEven = gMargin > 0 ? (fixed/(gMargin/100)) : 0;
  const frozen = products.reduce((a,p)=>a+p.stock*p.cost,0);
  const cfWeeks = [
    {l:"Sem 1",e:sales.filter(s=>s.date<="2025-02-07").reduce((a,s)=>a+s.total,0), s:expenses.filter(e=>e.date<="2025-02-07").reduce((a,e)=>a+e.amount,0)},
    {l:"Sem 2",e:sales.filter(s=>s.date>"2025-02-07"&&s.date<="2025-02-14").reduce((a,s)=>a+s.total,0), s:expenses.filter(e=>e.date>"2025-02-07"&&e.date<="2025-02-14").reduce((a,e)=>a+e.amount,0)},
    {l:"Sem 3",e:sales.filter(s=>s.date>"2025-02-14"&&s.date<="2025-02-21").reduce((a,s)=>a+s.total,0), s:expenses.filter(e=>e.date>"2025-02-14"&&e.date<="2025-02-21").reduce((a,e)=>a+e.amount,0)},
    {l:"Sem 4",e:sales.filter(s=>s.date>"2025-02-21").reduce((a,s)=>a+s.total,0), s:expenses.filter(e=>e.date>"2025-02-21").reduce((a,e)=>a+e.amount,0)},
  ];
  const maxCF = Math.max(...cfWeeks.map(d=>Math.max(d.e,d.s)),1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {[{id:"cashflow",l:"💧 Flujo de Caja"},{id:"profitability",l:"💎 Rentabilidad"},{id:"indicators",l:"🎯 Indicadores"}].map(s=><button key={s.id} className={`filter-btn ${sec===s.id?"active":""}`} onClick={()=>setSec(s.id)}>{s.l}</button>)}
      </div>
      {sec==="cashflow" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:profit>=0?"linear-gradient(135deg,#00C896,#06B6D4)":"linear-gradient(135deg,#FF5A5F,#FF8C42)", borderRadius:22, padding:isMobile?20:24, color:"white" }}>
            <div style={{ fontSize:13, fontWeight:700, opacity:0.85, marginBottom:2 }}>{profit>=0?"✅ Flujo positivo":"🚨 Flujo negativo"}</div>
            <div style={{ fontSize:isMobile?32:44, fontWeight:900, marginBottom:14 }}>{fmt(profit)}</div>
            <div className="grid-2" style={{ maxWidth:400 }}>
              <div style={{ background:"rgba(255,255,255,0.2)",borderRadius:13,padding:"10px 14px" }}><div style={{ fontSize:10,opacity:0.8,fontWeight:700,marginBottom:3 }}>ENTRADAS</div><div style={{ fontSize:18,fontWeight:900 }}>{fmt(totalSales)}</div></div>
              <div style={{ background:"rgba(255,255,255,0.2)",borderRadius:13,padding:"10px 14px" }}><div style={{ fontSize:10,opacity:0.8,fontWeight:700,marginBottom:3 }}>SALIDAS</div><div style={{ fontSize:18,fontWeight:900 }}>{fmt(totalExpenses)}</div></div>
            </div>
          </div>
          <div className={isMobile?"":"desktop-2col"}>
            <div className="card" style={{ padding:20 }}>
              <div className="section-title">📅 Flujo semanal</div>
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
            <div style={{ fontSize:13,fontWeight:700,opacity:0.85,marginBottom:2 }}>Ganancia bruta total</div>
            <div style={{ fontSize:isMobile?32:44, fontWeight:900, marginBottom:4 }}>{fmt(grossP)}</div>
            <div style={{ fontSize:13,opacity:0.85 }}>Bruto: {gMargin}% · Neto: {nMargin}%</div>
          </div>
          <div className={isMobile?"":"desktop-2col"} style={{ gap:12 }}>
            {products.map(p=>{const rev=p.sold*p.price;const cog=p.sold*p.cost;const gp=rev-cog;const m=rev>0?pct(gp,rev):0;return(
              <div key={p.id} className="card" style={{ padding:16 }}>
                <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:12 }}>
                  <div className="color-dot" style={{ width:20,height:20,background:getColorCSS(p.color) }} />
                  <div style={{ flex:1 }}><div style={{ fontWeight:900,fontSize:14 }}>{p.name} <span style={{ color:C.muted,fontWeight:600,fontSize:12 }}>· {p.color}/T{p.size}</span></div></div>
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
            <div className="bar" style={{ height:12,marginBottom:10 }}><div className="bar-fill" style={{ width:`${Math.min(100,pct(totalSales,breakEven))}%`, background:totalSales>=breakEven?C.green:"linear-gradient(90deg,#FF8C42,#FFB800)" }} /></div>
            <div style={{ background:totalSales>=breakEven?C.greenLight:C.yellowLight,borderRadius:12,padding:12,fontSize:13,fontWeight:700,color:totalSales>=breakEven?C.green:C.yellow }}>
              {totalSales>=breakEven?"✅ Superaste el punto de equilibrio":`⚠️ Faltan ${fmt(breakEven-totalSales)}`}
            </div>
          </div>
          <div className="card" style={{ padding:20 }}>
            <div className="section-title">📊 Márgenes</div>
            {[{l:"Margen Bruto",v:gMargin,a:grossP,c:C.green},{l:"Margen Neto",v:nMargin,a:profit,c:nMargin>0?C.teal:C.red}].map(m=>(
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
              <div style={{ fontSize:52,fontWeight:900,color:profit>0?C.green:C.red }}>{pct(profit,totalExpenses)}%</div>
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
function AddProductModal({ onClose, onSave }) {
  const [f, setF] = useState({ name:"",sku:"",brand:"",color:"",size:"",stock:"",minStock:"5",price:"",cost:"",category:"Ropa" });
  function save() {
    if (!f.name||!f.sku||!f.stock) return;
    onSave({ ...f, id:newId(), stock:+f.stock, minStock:+f.minStock, price:+f.price||0, cost:+f.cost||0, sold:0, emoji:catEmoji[f.category]||"📦" });
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
        <div style={{ display:"flex",gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex:2 }}>Guardar producto</button>
        </div>
      </div>
    </div>
  );
}

function AddSaleModal({ products, onClose, onSave }) {
  const [pid,setPid]=useState(""); const [qty,setQty]=useState(1); const [method,setMethod]=useState("Efectivo");
  const p=products.find(x=>String(x.id)===String(pid)); const total=p?p.price*qty:0;
  function save() { if(!p||qty<1||p.stock<qty) return; onSave({id:newId(),productId:String(pid),qty:+qty,total,date:new Date().toISOString().split("T")[0],method},String(pid),+qty); }
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
  const [f,setF]=useState({concept:"",amount:"",category:"Operacional"});
  const ce={Operacional:"🏪",Compras:"🛍️",Marketing:"📱",Logística:"🚚",Otro:"💡"};
  function save() { if(!f.concept||!f.amount) return; onSave({...f,id:newId(),amount:+f.amount,date:new Date().toISOString().split("T")[0],emoji:ce[f.category]||"💡"}); }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>💸 Registrar gasto</div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Concepto</div><input className="stk-input" placeholder="Ej: Arriendo del mes" value={f.concept} onChange={e=>setF(p=>({...p,concept:e.target.value}))} /></div>
          <div><div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Monto ($)</div><input className="stk-input" type="number" placeholder="0" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} /></div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Categoría</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["Operacional","Compras","Marketing","Logística","Otro"].map(c=><button key={c} className={`filter-btn ${f.category===c?"active":""}`} onClick={()=>setF(p=>({...p,category:c}))}>{ce[c]} {c}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main btn-orange" onClick={save} style={{ flex:2 }}>Guardar gasto</button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImport, importView="file" }) {
  const [step,setStep]=useState("upload"); const [dragOver,setDragOver]=useState(false);
  const [parsed,setParsed]=useState([]); const [error,setError]=useState(""); const [mode,setMode]=useState("merge"); const [fileName,setFileName]=useState("");
  const [src,setSrc]=useState(importView==="sheet"?"sheet":"file"); // "file" | "sheet"
  const [sheetUrl,setSheetUrl]=useState(""); const [loadingSheet,setLoadingSheet]=useState(false);
  const fileRef=useRef();
  function processFile(file) {
    if(!file)return; setFileName(file.name); setError("");
    if(file.name.match(/\.xlsx?$/i)) {
      const r=new FileReader();
      r.onload=e=>{try{const X=window.XLSX;if(!X){setError("Cargando... intenta de nuevo");return;}const wb=X.read(e.target.result,{type:"array"});const csv=X.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);const p=parseCSV(csv);if(!p.length){setError("No se encontraron productos. Revisa los encabezados.");return;}setParsed(p);setStep("preview");}catch(err){setError("Error: "+err.message);}};
      r.readAsArrayBuffer(file);
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
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            {srcBtn("file","📂","Excel / CSV","Sube un archivo",C.blue,C.blueLight)}
            {srcBtn("sheet","🔗","Google Sheets","Pega el enlace",C.green,C.greenLight)}
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
                Encabezados necesarios: <b>nombre, sku, stock</b> (opcionales: marca, color, talla, categoría, precio, costo, mínimo).
              </div>
            </div>
          )}

          {error&&<div style={{ background:C.redLight,borderRadius:12,padding:12,marginTop:12,fontSize:13,fontWeight:700,color:C.red,lineHeight:1.5 }}>{error}</div>}
          <button className="btn-outline" onClick={onClose} style={{ width:"100%",marginTop:16 }}>Cancelar</button>
        </>}
        {step==="preview"&&<>
          <div style={{ fontWeight:900,fontSize:20,marginBottom:4 }}>✅ Vista previa</div>
          <div style={{ fontSize:13,color:C.muted,fontWeight:600,marginBottom:16 }}>{fileName} · {parsed.length} productos</div>
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            {[{id:"merge",label:"➕ Agregar",desc:"No duplica SKUs"},{id:"replace",label:"🔄 Reemplazar",desc:"Borra el actual"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{ flex:1,background:mode===m.id?C.greenLight:C.bg,border:`2px solid ${mode===m.id?C.green:C.border}`,borderRadius:14,padding:12,cursor:"pointer",fontFamily:"inherit" }}>
                <div style={{ fontWeight:900,fontSize:13,color:mode===m.id?C.green:C.text }}>{m.label}</div>
                <div style={{ fontSize:11,color:C.muted }}>{m.desc}</div>
              </button>
            ))}
          </div>
          <div className="card" style={{ padding:14,maxHeight:250,overflowY:"auto",marginBottom:16 }}>
            {parsed.slice(0,40).map((p,i)=>(
              <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border }}>
                <div className="color-dot" style={{ background:getColorCSS(p.color) }} />
                <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:13 }}>{p.name}</div><div style={{ fontSize:11,color:C.muted }}>{p.brand} · {p.color} · T{p.size}</div></div>
                <span style={{ fontWeight:900,fontSize:12,color:C.green }}>{p.stock} uds</span>
              </div>
            ))}
            {parsed.length>40&&<div style={{ textAlign:"center",color:C.muted,fontSize:12,padding:8 }}>+{parsed.length-40} más...</div>}
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button className="btn-outline" onClick={()=>{setStep("upload");setParsed([]);}} style={{ flex:1 }}>← Volver</button>
            <button className="btn-main" onClick={()=>onImport(parsed,mode)} style={{ flex:2 }}>Importar {parsed.length}</button>
          </div>
        </>}
      </div>
    </div>
  );
}
