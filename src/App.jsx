import { useState, useEffect, useRef, Fragment } from "react";
import { uploadProductImage, uploadLogoImage, borrarImagenPublica, subirFotoProducto, textoErrorFoto } from "./lib/image.js";
import { supabase } from "./lib/supabase.js";
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
  customerFromRow,
  customerToRow,
  newId,
  useCategorias,
  useNegocio,
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
const catEmoji = { Ropa:"👕", Calzado:"👟", Accesorios:"🧢", Otro:"📦", Otros:"📦", "Bolsos y Carteras":"👜", "Joyería y Bisutería":"💍", "Belleza y Cuidado Personal":"💄" };

function groupProducts(products) {
  const g = {};
  for (const p of products) {
    const k = `${p.name}__${p.brand}`;
    if (!g[k]) g[k] = { name:p.name, brand:p.brand, emoji:p.emoji, category:p.category, categoryId:p.categoryId || "", price:p.price, cost:p.cost, image:p.image||"", imgs:[], variants:[] };
    if (!g[k].image && p.image) g[k].image = p.image;
    // 📸 Fotos de TODOS los colores de la referencia, en orden: es lo que
    //    deslizas con el dedo en la foto principal (carrusel).
    imgsDe(p.image).forEach(u => { if (!g[k].imgs.includes(u)) g[k].imgs.push(u); });
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

// ── Dinero a mano / traído del Excel ──────────────────────────────────────────
// En Colombia 85.000 son OCHENTA Y CINCO MIL pesos, no 85 con decimales.
// Antes hacíamos parseFloat("85.000") = 85 y el precio se perdía al importar.
// Este lector entiende ambos formatos y devuelve SIEMPRE un número:
//   "85.000" / "$85.000" / "85,000" -> 85000  ·  "199.99" -> 199.99  ·  "1.234,56" -> 1234.56
const numDinero = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = String(v).trim().replace(/[$\s\u00A0]/g, "").replace(/[^0-9.,]/g, "");
  if (!s) return 0;
  const p = s.lastIndexOf("."), c = s.lastIndexOf(",");
  if (p !== -1 && c !== -1) s = p > c ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  else if (c !== -1) s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  else if (p !== -1 && /^\d{1,3}(\.\d{3})+$/.test(s) && !s.startsWith("0.")) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
};
// Unidades enteras (stock, stock mínimo) con la misma lectura de miles: "1.000" = 1000.
const numEntero = (v) => Math.round(numDinero(v));

const parseCSV = (text) => {
  const lines = text.trim().split("\n").map(l=>l.replace(/\r/g,"")).filter(l=>l.trim());
  if (lines.length < 2) return [];
  // La plantilla que se descarga trae una leyenda arriba y una fila en blanco
  // antes de los títulos: se salta hasta la fila que SÍ son los encabezados.
  const esEncabezado = l => { const c = l.replace(/"/g,"").toLowerCase();
    return /(nombre|\bname\b|producto)/.test(c) && /(stock|cantidad)/.test(c); };
  let ini = 0;
  for (let i = 0; i < Math.min(3, lines.length - 1); i++) { if (esEncabezado(lines[i])) { ini = i; break; } }
  const lineaHdr = lines[ini];
  // Detecta el separador: tab, punto y coma (Excel español) o coma
  const delim = lineaHdr.includes("\t") ? "\t" : lineaHdr.includes(";") ? ";" : ",";
  // Divide una línea respetando campos entre comillas (permite comas dentro de valores)
  const splitLine = (line) => { const out=[]; let cur=""; let q=false;
    for (let i=0;i<line.length;i++){ const ch=line[i];
      if (q){ if (ch==='"'){ if (line[i+1]==='"'){ cur+='"'; i++; } else { q=false; } } else { cur+=ch; } }
      else { if (ch==='"'){ q=true; } else if (ch===delim){ out.push(cur); cur=""; } else { cur+=ch; } }
    } out.push(cur); return out; };
  const headers = splitLine(lineaHdr).map(h=>h.replace(/"/g,"").trim().toLowerCase());
  const colMap = { nombre:["nombre","name","producto"], sku:["sku","código","ref"], brand:["marca","brand"], color:["color"], size:["talla","size"], category:["categoría","categoria"], stock:["stock","cantidad"], minStock:["stock mínimo","min stock","mínimo"], price:["precio venta","precio","price"], cost:["costo","cost"], image:["imagen","foto","image"], barcode:["codigo de barras","código de barras","barcode"] };
  // "categoría" no debe caer en la columna "subcategoría" (ni "stock" en
  // "stock mínimo", ni "sku" en "código de barras"): se ignoran esas columnas.
  const findCol = k => {
    const mala = k === "category" ? (h => h.includes("sub"))
              : k === "stock"      ? (h => /m[ií]nimo|min stock/.test(h))
              : k === "sku"        ? (h => h.includes("barras"))
              : () => false;
    for (const v of (colMap[k]||[k])) { const i = headers.findIndex(h=>h.includes(v) && !mala(h)); if (i!==-1) return i; } return -1;
  };
  const cols = {}; for (const k of Object.keys(colMap)) cols[k] = findCol(k);
  return lines.slice(ini+1).filter(l=>l.trim()).map((line,i) => {
    const vals = splitLine(line).map(v=>v.replace(/"/g,"").trim());
    if (!vals.some(v=>v)) return null; // línea vacía
    const get = k => cols[k]!==-1 ? (vals[cols[k]]||"") : "";
    const name=get("nombre"),sku=get("sku"),stockRaw=get("stock");
    const category=get("category");
    const brand=get("brand"),color=get("color"),size=get("size");
    const price=get("price"),cost=get("cost"),image=get("image");
    // Campos con ASTERISCO ROJO en la plantilla = OBLIGATORIOS. Si falta alguno
    // la vista previa lo avisa; sin nombre o sin stock actual la fila NO se importa.
    const faltan = [];
    if (!name)        faltan.push("nombre");
    if (!category)    faltan.push("categoría");
    if (!stockRaw)    faltan.push("stock actual");
    if (!brand)       faltan.push("marca");
    if (!color)       faltan.push("color");
    if (!size)        faltan.push("talla");
    if (!price)       faltan.push("precio venta");
    if (!cost)        faltan.push("costo");
    if (!image)       faltan.push("imagen");
    // Números con el lector de dinero: "85.000" entra como 85 mil, "199.99" como decimal.
    return { id:newId(),name,sku,brand,color,size,category,stock:numEntero(stockRaw),minStock:numEntero(get("minStock"))||5,price:numDinero(price),cost:numDinero(cost),sold:0,emoji:catEmoji[category]||"📦",image,barcode:get("barcode")||"",faltan };
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

// 📸 Varias fotos por color — se guardan juntas en image separadas por "||"
const imgsDe = (v) => String(v || "").split("||").map(s => s.trim()).filter(Boolean);
const juntarImgs = (arr) => [...new Set(arr.map(s => String(s).trim()).filter(Boolean))].join("||");
const primeraImg = (v) => imgsDe(v)[0] || "";

// 💰 Venta con varias referencias: los renglones de la MISMA venta llevan el
//    mismo prefijo de id "<uuid>::<n>" (la columna id es texto, así no hay que
//    tocar la base de datos). Una venta vieja (sin "::") es un grupo de 1.
const grupoVenta = (id) => { const s = String(id || ""); const i = s.indexOf("::"); return i > 0 ? s.slice(0, i) : s; };

// 🧾 Historial: CADA renglón de venta se muestra en SU propio cuadro, con su
//    propio botón de borrar (nada de juntarlas en una sola caja). grupoVenta()
//    solo sirve para saber qué referencias vinieron juntas en la misma venta y
//    mostrarlo como una píldoraita "🔗 N refs" en cada tarjeta.

// 🏷️ SKU y código de barras son OPCIONALES: si el usuario no tiene esos datos,
// Stokly le crea un código único. Es el que se imprime en la etiqueta (nombre,
// color y talla) y el que reconoce el escáner al hacer inventario.
const codLimpio = (v) => String(v || "").trim().toUpperCase();
const codNuevo = () => "STK-" + (Math.random().toString(36).slice(2, 8) + "000000").slice(0, 6).toUpperCase();
const generarSku = (tomados) => {
  const t = new Set((tomados || []).map(codLimpio).filter(Boolean));
  for (let i = 0; i < 999; i++) { const c = codNuevo(); if (!t.has(c)) return c; }
  return "STK-" + Date.now().toString(36).toUpperCase();
};
// Devuelve la lista completa con código en los que no tengan (los que ya tienen no cambian)
const conCodigos = (lista, extra = []) => {
  const tomados = [...(extra || []), ...lista].map(p => p && p.sku);
  return lista.map(p => {
    if (codLimpio(p.sku)) return p;
    const c = generarSku(tomados);
    tomados.push(c);
    return { ...p, sku: c };
  });
};
// Respaldo para productos antiguos guardados sin SKU: se deduce del id y también escanea
const codInterno = (p) => String((p && p.id) || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();

// Carga perezosa de JsBarcode — solo cuando abres el generador de etiquetas
let jsbCargas = null;
function cargarJsBarcode(ok, fail) {
  if (window.JsBarcode) { ok(); return; }
  if (jsbCargas) { jsbCargas.push({ ok, fail }); return; }
  jsbCargas = [{ ok, fail }];
  const s = document.createElement("script");
  s.src = "./JsBarcode.all.min.js";
  s.onload = () => { const l = jsbCargas || []; jsbCargas = null; l.forEach(x => x.ok()); };
  s.onerror = () => { const l = jsbCargas || []; jsbCargas = null; l.forEach(x => x.fail()); };
  document.head.appendChild(s);
}

// Carga perezosa de SheetJS — compartida por ImportModal y "Descargar inventario"
let xlsxCargas = null;
function cargarScriptXLSX(msgCarga, msgFallo, cb, setMsg) {
  if (window.XLSX) { cb(); return; }
  if (xlsxCargas) { xlsxCargas.push({ cb, setMsg, msgFallo }); return; }
  xlsxCargas = [{ cb, setMsg, msgFallo }];
  setMsg(msgCarga);
  const s = document.createElement("script");
  s.src = "./xlsx.full.min.js";
  s.onload = () => { const l = xlsxCargas || []; xlsxCargas = null; l.forEach(x => { try { x.setMsg(""); x.cb(); } catch (e) { console.error("[stokly] xlsx:", e); } }); };
  s.onerror = () => { const l = xlsxCargas || []; xlsxCargas = null; l.forEach(x => x.setMsg(x.msgFallo)); };
  document.head.appendChild(s);
}

// Carga perezosa de ExcelJS — solo se usa para la plantilla con los
// asteriscos de los campos obligatorios PINTADOS EN ROJO (SheetJS no pinta).
let excelJSPromesa = null;
function cargarScriptExcelJS() {
  if (window.ExcelJS) return Promise.resolve(true);
  if (excelJSPromesa) return excelJSPromesa;
  excelJSPromesa = new Promise(resolve => {
    const s = document.createElement("script");
    s.src = "./exceljs.min.js";
    s.onload = () => { excelJSPromesa = null; resolve(!!window.ExcelJS); };
    s.onerror = () => { excelJSPromesa = null; resolve(false); };
    document.head.appendChild(s);
  });
  return excelJSPromesa;
}

// Descarga un archivo con nombre (compartido por las plantillas)
function descargarBlob(blob, nombre) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Busca un producto por el código escaneado de la etiqueta (SKU o código de barras)
function buscarPorCodigo(products, codeRaw) {
  const c = String(codeRaw || "").replace(/\*/g, "").trim().toUpperCase();
  if (!c) return null;
  let p = products.find(x => String(x.sku || "").trim().toUpperCase() === c);
  if (!p) p = products.find(x => String(x.barcode || "").trim().toUpperCase() === c);
  const limpio = (s) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
  if (!p) p = products.find(x => limpio(x.sku) === limpio(c)) || products.find(x => x.barcode && limpio(x.barcode) === limpio(c));
  if (!p) p = products.find(x => codInterno(x) && codInterno(x) === c);
  return p || null;
}

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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // Cierra el menú al tocar fuera de él
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const etiqueta = rango.id === "custom" ? `${dmISO(rango.from||"")} → ${dmISO(rango.to||"")}` : rangoLabel(rango);
  return (
    <div ref={ref} style={{ position:"relative", alignSelf:"flex-start" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", border:`2px solid ${open ? C.blue : C.border}`, borderRadius:14, padding:"9px 14px", fontWeight:900, fontSize:13.5, cursor:"pointer", fontFamily:"inherit", color:C.text, boxShadow: open ? "0 8px 20px rgba(16,24,40,0.10)" : "none" }}
      >
        <span>📅</span>
        <span>{etiqueta}</span>
        <span style={{ fontSize:10, color:C.muted, transform: open ? "rotate(180deg)" : "none", transition:"transform .15s" }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:998 }} />
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:999, background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:16, boxShadow:"0 16px 40px rgba(16,24,40,0.18)", padding:8, width:270, maxWidth:"calc(100vw - 32px)" }}>
            <div style={{ fontSize:10.5, fontWeight:900, color:C.muted, textTransform:"uppercase", padding:"4px 8px 6px" }}>Elegir rango de tiempo</div>
            {RANGOS.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id === "custom" ? { id:"custom", from: rango.from || restarDiasISO(29), to: rango.to || hoyISO() } : { id:r.id });
                  if (r.id !== "custom") setOpen(false);
                }}
                style={{ display:"flex", width:"100%", justifyContent:"space-between", alignItems:"center", background:rango.id === r.id ? C.blueLight : "transparent", border:"none", borderRadius:10, padding:"10px 10px", fontWeight:800, fontSize:13.5, cursor:"pointer", fontFamily:"inherit", color:C.text, textAlign:"left" }}
              >
                <span>{r.label}</span>
                {rango.id === r.id && <span style={{ color:C.blue, fontWeight:900 }}>✓</span>}
              </button>
            ))}
            {rango.id === "custom" && (
              <div style={{ borderTop:`1px dashed ${C.border}`, marginTop:6, paddingTop:8, display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"flex", gap:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:900, color:C.muted, textTransform:"uppercase", marginBottom:3 }}>Desde</div>
                    <input type="date" className="stk-input" style={{ padding:"7px 8px", fontSize:12.5, width:"100%" }} value={rango.from || ""} onChange={e => onChange({ ...rango, from:e.target.value })} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:900, color:C.muted, textTransform:"uppercase", marginBottom:3 }}>Hasta</div>
                    <input type="date" className="stk-input" style={{ padding:"7px 8px", fontSize:12.5, width:"100%" }} value={rango.to || ""} onChange={e => onChange({ ...rango, to:e.target.value })} />
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Los totales se actualizan al instante</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// 📷 Escáner de código de barras / QR — lee la etiqueta de la prenda con la cámara
function ScanModal({ onClose, onScan }) {
  const [msg, setMsg] = useState("⏳ Preparando la cámara…");
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const qref = useRef(null);
  const procesando = useRef(false);
  const cbRef = useRef(onScan);
  cbRef.current = onScan;
  useEffect(() => {
    let vivo = true;
    const recibir = (txt) => {
      if (!vivo || procesando.current) return;
      procesando.current = true;
      const e = cbRef.current(txt);
      if (e) { setErr(e); procesando.current = false; }
    };
    const arrancar = async () => {
      if (!vivo) return;
      try {
        let ctorCfg;
        try {
          const F = window.Html5QrcodeSupportedFormats;
          if (F) {
            const fmts = [F.QR_CODE, F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_39, F.CODE_93, F.CODE_128, F.ITF, F.CODABAR].filter(x => x != null);
            if (fmts.length) ctorCfg = { formatsToSupport: fmts };
          }
        } catch (_) { /* si no, lee todos los formatos por defecto */ }
        const q = ctorCfg ? new window.Html5Qrcode("stokly-scanner", ctorCfg) : new window.Html5Qrcode("stokly-scanner");
        qref.current = q;
        await q.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 230, height: 230 } }, recibir, () => {});
        if (vivo) setMsg("");
      } catch (e) {
        console.error("[stokly] scanner:", e && e.message);
        if (vivo) setMsg("⚠️ No pude abrir la cámara (permiso denegado o sin cámara). Escribe el código abajo ✍️");
      }
    };
    if (window.Html5Qrcode) { arrancar(); }
    else {
      const s = document.createElement("script");
      s.src = "./html5-qrcode.min.js";
      s.onload = () => { arrancar(); };
      s.onerror = () => { if (vivo) setMsg("❌ No se pudo cargar el escáner (revisa tu conexión). Escribe el código abajo ✍️"); };
      document.head.appendChild(s);
    }
    return () => {
      vivo = false;
      const q = qref.current;
      if (q) { try { q.stop().then(() => q.clear()).catch(() => {}); } catch (_) {} }
    };
  }, []);
  const enviarManual = (e) => {
    if (e) e.preventDefault();
    const v = manual.trim();
    if (!v) return;
    const r = cbRef.current(v);
    if (r) setErr(r);
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:6 }}>📷 Escanear etiqueta</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:700, marginBottom:14, lineHeight:1.5 }}>
          Apunta la cámara al <b>código de barras o QR</b> de la prenda y listo. ¿Sin cámara? Escríbelo a mano abajo.
        </div>
        <div id="stokly-scanner" style={{ width:"100%", minHeight:230, background:"#0E1116", borderRadius:16, overflow:"hidden", marginBottom:10 }} />
        {msg && <div style={{ background: msg.charAt(0) === "⏳" ? C.blueLight : C.yellowLight, color: msg.charAt(0) === "⏳" ? C.blue : C.yellow, borderRadius:12, padding:"10px 12px", fontSize:12.5, fontWeight:800, marginBottom:10, lineHeight:1.5 }}>{msg}</div>}
        {err && <div style={{ background:C.redLight, color:C.red, borderRadius:12, padding:"10px 12px", fontSize:13, fontWeight:800, marginBottom:10 }}>⚠️ {err}</div>}
        <form onSubmit={enviarManual} style={{ display:"flex", gap:8, marginBottom:14 }}>
          <input className="stk-input" style={{ flex:1, minWidth:0 }} placeholder="✍️ O escribe el código / SKU" value={manual} onChange={e => { setManual(e.target.value); setErr(""); }} />
          <button type="submit" className="btn-main" style={{ padding:"0 16px", flexShrink:0 }}>Buscar</button>
        </form>
        <button className="btn-outline" onClick={onClose} style={{ width:"100%" }}>Cerrar escáner</button>
      </div>
    </div>
  );
}

// ── 📤 COMPARTIR CATÁLOGO (link público para WhatsApp — sin iniciar sesión) ──
function ShareModal({ workspaceId, sizes, onClose, showToast }) {
  const [modo, setModo] = useState("todo"); // todo | talla
  const [talla, setTalla] = useState(sizes[0] || "");
  // Tu WhatsApp: para que los PEDIDOS que arma la clienta en el catálogo te lleguen directo a ti
  const [wa, setWa] = useState(() => { try { return localStorage.getItem("stokly-wa") || ""; } catch (e) { return ""; } });
  useEffect(() => { if (modo === "talla" && !talla && sizes.length) setTalla(sizes[0]); }, [modo, sizes, talla]);
  const base = `${window.location.origin}${window.location.pathname}#/catalogo?ws=${encodeURIComponent(workspaceId || "")}`;
  const waNum = wa.replace(/\D/g, "");
  const tieneWa = waNum.length >= 10;
  const link = base + (modo === "talla" && talla ? `&talla=${encodeURIComponent(talla)}` : "") + (tieneWa ? `&wa=${waNum}` : "");
  const cambiarWa = (v) => {
    const s = v.replace(/[^\d\s+()-]/g, "");
    setWa(s);
    try { localStorage.setItem("stokly-wa", s); } catch (e) { /* sin almacenamiento */ }
  };
  const msg = modo === "talla" && talla
    ? `🛍️ Mira nuestro catálogo — prendas disponibles en talla ${talla}:\n${link}`
    : `🛍️ Mira nuestro catálogo completo:\n${link}`;
  async function copiar() {
    try { await navigator.clipboard.writeText(msg); showToast("📋 Link copiado — pégalo en WhatsApp"); }
    catch (e) {
      try {
        const ta = document.createElement("textarea"); ta.value = msg;
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        showToast("📋 Link copiado — pégalo en WhatsApp");
      } catch (e2) { showToast("❌ No se pudo copiar — selecciona el link y cópialo"); }
    }
  }
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>📤 Compartir catálogo</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:600, marginBottom:16, lineHeight:1.5 }}>
          Cualquiera con el link ve tu catálogo <b>sin iniciar sesión</b>. Nunca se muestran costos ni datos internos.<br />
          🛍️ Cada prenda tiene un botón <b>«＋ Añadir al pedido»</b>: la clienta junta lo que quiere y te lo manda por WhatsApp.
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          {[
            { id:"todo",  label:"📚 Catálogo completo", desc:"Todas las prendas y tallas" },
            { id:"talla", label:"📏 Solo una talla",    desc:"Ej: lo disponible en talla 4" },
          ].map(o => (
            <button key={o.id} onClick={() => setModo(o.id)} style={{ flex:1, background:modo===o.id?C.greenLight:C.bg, border:`2px solid ${modo===o.id?C.green:C.border}`, borderRadius:14, padding:"12px 10px", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
              <div style={{ fontWeight:900, fontSize:13, color:modo===o.id?C.green:C.text }}>{o.label}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{o.desc}</div>
            </button>
          ))}
        </div>
        {modo === "talla" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>Talla a compartir</div>
            <select className="stk-input" value={talla} onChange={e => setTalla(e.target.value)}>
              {!sizes.length && <option value="">(aún no tienes tallas registradas)</option>}
              {sizes.map(s => <option key={s} value={s}>Talla {s}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>Tu WhatsApp para pedidos (opcional)</div>
          <input className="stk-input" inputMode="tel" placeholder="Ej: 573001234567 (con código de país)" value={wa} onChange={e => cambiarWa(e.target.value)} />
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginTop:5, lineHeight:1.5 }}>
            {tieneWa
              ? <>✅ Tus clientas podrán tocar «＋ Añadir al pedido» en cada prenda y <b style={{ color:C.green }}>al enviar se abre su WhatsApp directo en tu chat</b> con el pedido escrito.</>
              : <>⚠️ <b style={{ color:C.yellow }}>Sin tu número</b>, al enviar se abre la lista de chats y la clienta debe buscar tu contacto. Pon tu WhatsApp para que el pedido te llegue <b>directo al mismo chat</b>.</>}
          </div>
        </div>
        <div style={{ background:C.blueLight, borderRadius:14, padding:"12px 14px", marginBottom:14, wordBreak:"break-all" }}>
          <div style={{ fontSize:10.5, fontWeight:900, color:C.blue, textTransform:"uppercase", marginBottom:4 }}>Tu link</div>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.text, lineHeight:1.55 }}>{link}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={copiar} style={{ flex:1 }}>📋 Copiar link</button>
        </div>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")}
          style={{ width:"100%", marginTop:10, background:"#25D366", color:"white", border:"none", borderRadius:14, padding:"13px 16px", fontWeight:900, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}
        >💬 Compartir por WhatsApp</button>
      </div>
    </div>
  );
}

// ── 🏷️ ETIQUETAS imprimibles con código de barras ────────────────────────────
function Etiqueta({ p }) {
  // Código de la etiqueta: el que dio el usuario (barras/SKU) o el que creó Stokly
  const code = String((p.barcode || p.sku || "").trim()) || codInterno(p);
  return (
    <div className="etq">
      <div className="etq-n">{p.name}</div>
      <div className="etq-c">{[p.color, p.size ? "T" + p.size : ""].filter(Boolean).join(" · ") || "—"}</div>
      <svg data-cod={code} />
      <div className="etq-s">{code}</div>
    </div>
  );
}

function LabelsModal({ products, onClose, showToast }) {
  const [sel, setSel] = useState(() => new Set());
  const [b, setB] = useState("");
  const [listo, setListo] = useState(!!window.JsBarcode);
  const [fallos, setFallos] = useState(0);

  useEffect(() => {
    if (window.JsBarcode) { setListo(true); return; }
    cargarJsBarcode(() => setListo(true), () => showToast("❌ No se pudo cargar el generador de etiquetas — revisa tu conexión"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dibuja los códigos (vista previa + hoja de impresión)
  useEffect(() => {
    if (!listo) return;
    let fallosN = 0;
    document.querySelectorAll("svg[data-cod]").forEach(svg => {
      const code = (svg.getAttribute("data-cod") || "").trim();
      if (!code) return;
      try {
        window.JsBarcode(svg, code, { format:"CODE128", displayValue:false, height:38, width:2, margin:2, background:"transparent", lineColor:"#000000" });
        if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`);
      } catch (e) { fallosN++; }
    });
    setFallos(fallosN);
  }, [listo, sel]);

  const q = b.toLowerCase().trim();
  const lista = products.filter(p => !q || [p.name, p.sku, p.color, p.size, p.brand].some(x => String(x || "").toLowerCase().includes(q)));
  const toggle = (id) => setSel(s => { const n = new Set(s); const k = String(id); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const seleccionados = products.filter(p => sel.has(String(p.id)));
  const algunosVisibles = lista.some(p => sel.has(String(p.id)));
  const alternarVisibles = () => setSel(s => {
    const n = new Set(s);
    const marcar = !algunosVisibles;
    lista.forEach(p => { if (marcar) n.add(String(p.id)); else n.delete(String(p.id)); });
    return n;
  });
  const imprimir = () => { if (sel.size && listo) window.print(); };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>🏷️ Etiquetas con código de barras</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:600, marginBottom:14, lineHeight:1.5 }}>
          Marca las prendas y imprime sus etiquetas para poder escanearlas con el 📷 de stokly.<br />
          🏷️ Cada etiqueta sale con <b style={{ color:C.text }}>nombre · color · talla</b> y su código — <b style={{ color:C.text }}>si el producto no tiene SKU, Stokly le pone uno igual</b>.
        </div>
        <input className="stk-input" placeholder="🔍 Busca la prenda (nombre, talla, SKU…)" value={b} onChange={e => setB(e.target.value)} style={{ marginBottom:10 }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:12.5, fontWeight:900 }}>{sel.size} seleccionada{sel.size === 1 ? "" : "s"}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button className="filter-btn" onClick={alternarVisibles}>{algunosVisibles ? "✕ Quitar visibles" : "☑️ Seleccionar visibles"}</button>
            {sel.size > 0 && <button className="filter-btn" onClick={() => setSel(new Set())}>Limpiar</button>}
          </div>
        </div>
        <div className="card" style={{ padding:"4px 14px", maxHeight:210, overflowY:"auto", marginBottom:12 }}>
          {lista.map(p => (
            <label key={p.id} className="row-item" style={{ cursor:"pointer" }}>
              <input type="checkbox" checked={sel.has(String(p.id))} onChange={() => toggle(p.id)} style={{ width:18, height:18, accentColor:"#00C896" }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:13.5 }}>{p.emoji} {p.name}</div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{p.color} · T{p.size} · {p.sku || codInterno(p)}</div>
              </div>
            </label>
          ))}
          {!lista.length && <div style={{ textAlign:"center", padding:24, color:C.muted, fontWeight:700 }}>Sin resultados 🔍</div>}
        </div>
        {seleccionados[0] && (
          <div style={{ background:C.bg, borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:900, color:C.muted, textTransform:"uppercase", marginBottom:8 }}>Vista previa</div>
              <Etiqueta p={seleccionados[0]} />
            </div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:700, lineHeight:1.6, flex:1, minWidth:150 }}>
              🖨️ Se imprimirán <b style={{ color:C.text }}>{sel.size}</b> etiqueta{sel.size === 1 ? "" : "s"} de52×34 mm.<br />
              Coloca papel carta o A4 — se acomodan solas.
            </div>
          </div>
        )}
        {fallos > 0 && <div style={{ background:C.yellowLight, color:"#B54708", borderRadius:12, padding:"9px 12px", fontSize:12.5, fontWeight:800, marginBottom:10 }}>⚠️ {fallos} código(s) tienen caracteres especiales — abajo del código se imprime el número igual</div>}
        {!listo && <div style={{ background:C.blueLight, color:C.blue, borderRadius:12, padding:"9px 12px", fontSize:12.5, fontWeight:800, marginBottom:10 }}>⏳ Cargando el generador de códigos…</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cerrar</button>
          <button className="btn-main" onClick={imprimir} disabled={!sel.size || !listo} style={{ flex:2, opacity:!sel.size || !listo ? 0.6 : 1 }}>🖨️ Imprimir {sel.size || ""}</button>
        </div>
        {/* Hoja de impresión: oculta en pantalla, visible solo al imprimir */}
        <div id="stokly-print">
          {seleccionados.map(p => <Etiqueta key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

// ── 🔍 VISOR DE FOTOS — se abre a pantalla completa al tocar una foto ─────────
// 📸 FOTO PRINCIPAL CON DEDO — desliza para recorrer todas las fotos de la
//    referencia (todos sus colores). Tocando se abre la foto en grande.
function CarruselFotos({ fotos, w, h, onAbrir, style }) {
  const lista = (fotos || []).filter(Boolean);
  const [i, setI] = useState(0);
  const arr = useRef({ x:0, y:0, moved:false });
  if (!lista.length) return null;
  const idx = Math.min(i, lista.length - 1);
  const ir = d => setI(x => (x + d + lista.length) % lista.length);
  const soltar = e => {
    const dx = e.clientX - arr.current.x, dy = e.clientY - arr.current.y;
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) { ir(dx < 0 ? 1 : -1); arr.current.moved = true; }
  };
  return (
    <div
      onPointerDown={e => { arr.current = { x:e.clientX, y:e.clientY, moved:false }; }}
      onPointerUp={soltar}
      onClick={e => { e.stopPropagation(); if (arr.current.moved) { arr.current.moved = false; return; } if (onAbrir) onAbrir(idx); }}
      title={lista.length > 1 ? "Desliza con el dedo para ver las fotos de todos los colores" : "Ver foto completa"}
      style={{ position:"relative", width:w, height:h, overflow:"hidden", touchAction:"pan-y", cursor:"zoom-in", flexShrink:0, ...style }}
    >
      <img src={lista[idx]} alt="" draggable={false} style={{ width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none", display:"block" }} />
      {lista.length > 1 && (
        <div style={{ position:"absolute", right:3, bottom:3, background:"rgba(0,0,0,.62)", color:"#fff", fontSize:9, fontWeight:900, lineHeight:1.4, borderRadius:8, padding:"1px 5px", pointerEvents:"none" }}>{idx + 1}/{lista.length}</div>
      )}
    </div>
  );
}

function VisorFotos({ fotos, inicio = 0, onClose }) {
  const lista = (fotos || []).filter(Boolean);
  const [i, setI] = useState(Math.min(inicio || 0, Math.max(0, lista.length - 1)));
  const ir = (d) => setI(x => (x + d + lista.length) % lista.length);
  const arr = useRef({ x:0, y:0, moved:false });
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); ir(1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); ir(-1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista.length]);
  if (!lista.length) return null;
  return (
    <div
      onPointerDown={e => { arr.current = { x:e.clientX, y:e.clientY, moved:false }; }}
      onPointerUp={e => {
        if (lista.length < 2) return;
        const dx = e.clientX - arr.current.x, dy = e.clientY - arr.current.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { ir(dx < 0 ? 1 : -1); arr.current.moved = true; }
      }}
      onClick={e => { if (arr.current.moved) { arr.current.moved = false; e.stopPropagation(); return; } onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.93)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16, touchAction:"pan-y" }}
    >
      <img src={lista[i]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:"100%", maxHeight:"82vh", borderRadius:14, objectFit:"contain" }} />
      {lista.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); ir(-1); }} title="Foto anterior" style={{ position:"fixed", left:10, top:"50%", transform:"translateY(-50%)", width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:24, cursor:"pointer", fontFamily:"inherit" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); ir(1); }} title="Foto siguiente" style={{ position:"fixed", right:10, top:"50%", transform:"translateY(-50%)", width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:24, cursor:"pointer", fontFamily:"inherit" }}>›</button>
          <div onClick={e => e.stopPropagation()} style={{ position:"fixed", bottom:26, left:"50%", transform:"translateX(-50%)", color:"white", fontWeight:800, fontSize:13, background:"rgba(0,0,0,.55)", borderRadius:20, padding:"6px 14px" }}>{i + 1} / {lista.length}</div>
        </>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }} title="Cerrar" style={{ position:"fixed", top:14, right:14, width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:18, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ position:"fixed", bottom:26, left:14, color:"rgba(255,255,255,.7)", fontWeight:700, fontSize:11.5, background:"rgba(0,0,0,.4)", borderRadius:16, padding:"5px 11px" }}>{lista.length > 1 ? "👆 Desliza para ver todas · toca fuera para cerrar" : "Toca fuera de la foto para cerrar"}</div>
    </div>
  );
}

// ── 📲 CATÁLOGO PÚBLICO — se ve con el link, sin iniciar sesión ──────────────
function PublicCatalog() {
  const qs = (() => {
    const h = window.location.hash.replace(/^#\/catalogo/, "");
    return new URLSearchParams(h.startsWith("?") ? h.slice(1) : h);
  })();
  const ws = qs.get("ws") || "";
  const waTienda = (qs.get("wa") || "").replace(/\D/g, ""); // WhatsApp de la tienda (a quién llega el pedido)
  const [items, setItems] = useState(undefined); // undefined = cargando
  const [negocio, setNegocio] = useState({ name:"", logo_url:"" }); // nombre y logo de la tienda
  const [talla, setTalla] = useState(qs.get("talla") || "");
  const [q, setQ] = useState("");
  const [foto, setFoto] = useState(null);        // { imgs:[], i }
  // 🛍️ El pedido se guarda en la sesión: si la clienta sale al WhatsApp y vuelve
  // al catálogo, lo que armó sigue ahí.
  const ssKey = `stokly-pedido:${ws}`;
  const leerSS = () => { try { return JSON.parse(sessionStorage.getItem(ssKey) || "null"); } catch (e) { return null; } };
  const [pedido, setPedido] = useState(() => (leerSS() || {}).pedido || []);            // [{ key, name, brand, color, price, emoji }]
  const [tallasSel, setTallasSel] = useState(() => (leerSS() || {}).tallasSel || {});   // talla elegida en cada tarjeta { [key]: size }
  useEffect(() => {
    try { sessionStorage.setItem(ssKey, JSON.stringify({ pedido, tallasSel })); } catch (e) { /* sin almacenamiento */ }
  }, [ssKey, pedido, tallasSel]);

  useEffect(() => {
    // El catálogo público se pide por panel (ws). La función expone SOLO ese
    // panel y solo columnas seguras: nunca costo, vendidos ni datos internos.
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ws);
    if (!esUuid) { setItems([]); return; }
    let vivo = true;
    supabase.rpc("catalogo_publico", { ws })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) { console.error("[stokly] catálogo:", error.message); setItems([]); }
        else setItems(data || []);
      });
    // Nombre y logo de la tienda (solo esos dos datos son públicos)
    supabase.rpc("negocio_publico", { ws })
      .then(({ data }) => {
        if (vivo && Array.isArray(data) && data[0]) setNegocio({ name: data[0].name || "", logo_url: data[0].logo_url || "" });
      });
    return () => { vivo = false; };
  }, [ws]);

  // Agrupa las variantes por referencia + color (una tarjeta por prenda/color)
  const filas = (items || []).map(r => productFromRow(r));
  const grupos = [];
  const idx = {};
  filas.forEach(p => {
    const k = `${p.name}__${p.brand}__${p.color}`;
    if (!idx[k]) { idx[k] = { key:k, name:p.name, brand:p.brand, color:p.color, emoji:p.emoji, price:p.price, imgs:[], tallas:[] }; grupos.push(idx[k]); }
    const g = idx[k];
    imgsDe(p.image).forEach(u => { if (!g.imgs.includes(u)) g.imgs.push(u); });
    if (!g.price) g.price = p.price;
    g.tallas.push({ size:p.size, stock:p.stock });
  });
  const ordenarTallas = (ts) => {
    const m = {};
    ts.forEach(t => { const s = String(t.size || ""); if (!s) return; m[s] = (m[s] || 0) + (t.stock || 0); });
    return Object.entries(m).map(([size, stock]) => ({ size, stock })).sort((a, b) => a.size.localeCompare(b.size, "es", { numeric:true }));
  };
  const tallasDisponibles = [...new Set(filas.map(p => String(p.size || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { numeric:true }));
  const visibles = grupos.filter(g =>
    (!talla || g.tallas.some(t => String(t.size) === talla)) &&
    (!q || [g.name, g.brand, g.color].some(x => String(x || "").toLowerCase().includes(q.toLowerCase())))
  ).sort((a, b) => a.name.localeCompare(b.name, "es"));

  // ── 🛍️ PEDIDO: la clienta junta prendas y las manda de una sola vez ────────
  // Talla elegida en la tarjeta (si solo hay una con stock, se elige sola)
  const tallaElegida = (g) => {
    if (tallasSel[g.key]) return tallasSel[g.key];
    const conStock = ordenarTallas(g.tallas).filter(t => t.stock > 0);
    return conStock.length === 1 ? conStock[0].size : "";
  };
  const enPedido = (k) => pedido.some(x => x.key === k);
  const cantDe = (k) => { const it = pedido.find(x => x.key === k); return it ? (it.qty || 1) : 0; };
  // Suma/ resta unidades (al llegar a 0 la saca del pedido)
  const ajustar = (k, d) => setPedido(prev => prev.flatMap(x => {
    if (x.key !== k) return [x];
    const q = (x.qty || 1) + d;
    return q <= 0 ? [] : [{ ...x, qty:q }];
  }));
  const alternarPedido = (g) => setPedido(prev => prev.some(x => x.key === g.key)
    ? prev.filter(x => x.key !== g.key)
    : [...prev, { key:g.key, name:g.name, brand:g.brand, color:g.color, price:g.price, emoji:g.emoji, qty:1 }]);
  const unidades = pedido.reduce((a, x) => a + (x.qty || 1), 0);
  const totalPedido = pedido.reduce((a, x) => a + (+x.price || 0) * (x.qty || 1), 0);
  const tallaDe = (x) => {
    if (tallasSel[x.key]) return tallasSel[x.key];
    const g = grupos.find(z => z.key === x.key);
    return g ? tallaElegida(g) : "";
  };
  const enviarPedido = () => {
    if (!pedido.length) return;
    const lineas = pedido.map((x, i) => {
      const n = x.qty || 1;
      return `${i + 1}) ${x.name}${x.color ? " · " + x.color : ""}${tallaDe(x) ? " · Talla " + tallaDe(x) : ""}${n > 1 ? ` · ${n} unidades` : ""} — ${fmt((+x.price || 0) * n)}`;
    });
    const txt =
      `🛍️ *¡Hola! Quiero pedir del catálogo:*\n\n${lineas.join("\n")}\n\n` +
      `*Total: ${fmt(totalPedido)} · ${unidades} unidad${unidades === 1 ? "" : "es"}*\n` +
      `_(Te confirmo cantidades y cualquier detalle por aquí.)_`;
    // wa.me/<número> abre WhatsApp con el chat de la TIENDA (el mismo del que
    // llegó el link). Usamos location.href en vez de window.open porque el
    // navegador dentro de WhatsApp/Instagram bloquea las ventanas nuevas y no
    // salta a la app: al navegar en la misma pestaña el celular abre WhatsApp.
    const destino = waTienda ? `https://wa.me/${waTienda}?text=` : `https://wa.me/?text=`;
    window.location.href = destino + encodeURIComponent(txt);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Nunito','Segoe UI',sans-serif" }}>
      <style>{STYLES}</style>

      {/* Encabezado */}
      <div style={{ background:"linear-gradient(135deg,#00C896,#4A90FF)", padding:"26px 16px 22px", color:"white" }}>
        <div style={{ maxWidth:980, margin:"0 auto", display:"flex", alignItems:"center", gap:14 }}>
          {!!negocio.logo_url && (
            <img src={negocio.logo_url} alt="Logo de la tienda" style={{ width:52, height:52, borderRadius:16, objectFit:"cover", background:"white", border:"2px solid rgba(255,255,255,0.5)", flexShrink:0 }} />
          )}
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:800, opacity:.85 }}>{negocio.name || "stokly 📦"}</div>
            <div style={{ fontSize:26, fontWeight:900, marginTop:2 }}>🛍️ Catálogo</div>
            <div style={{ fontSize:13, fontWeight:600, opacity:.9, marginTop:4 }}>Elige tu talla y descubre cada prenda</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:980, margin:"0 auto", padding:"16px 14px 6px" }}>
        {/* Búsqueda + tallas */}
        <input className="stk-input" placeholder="🔍 Busca prenda, color, marca…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom:10 }} />
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:6 }}>
          <button className={`filter-btn ${talla === "" ? "active" : ""}`} onClick={() => setTalla("")} style={{ flexShrink:0 }}>Todas</button>
          {tallasDisponibles.map(s => (
            <button key={s} className={`filter-btn ${talla === s ? "active" : ""}`} onClick={() => setTalla(s)} style={{ flexShrink:0 }}>Talla {s}</button>
          ))}
        </div>
        {talla && (
          <div style={{ background:C.blueLight, borderRadius:12, padding:"9px 14px", fontSize:13, fontWeight:800, color:C.blue, marginTop:6 }}>
            📏 Mostrando prendas disponibles en talla {talla} · {visibles.length} prenda{visibles.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {/* Estado de carga / error */}
      {items === undefined && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted, fontWeight:800, fontSize:15 }}>⏳ Cargando catálogo…</div>
      )}
      {items !== undefined && !items.length && (
        <div style={{ textAlign:"center", padding:"50px 20px" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>😕</div>
          <div style={{ fontWeight:900, fontSize:16, marginBottom:6 }}>No encontramos ese catálogo</div>
          <div style={{ fontSize:13, color:C.muted, fontWeight:600, lineHeight:1.6 }}>Pide el link actualizado a la tienda<br />o vuelve a intentarlo en unos minutos.</div>
        </div>
      )}

      {/* Tarjetas */}
      {visibles.length > 0 && (
        <div style={{ maxWidth:980, margin:"0 auto", padding:"10px 14px 4px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(235px, 1fr))", gap:16 }}>
          {visibles.map(g => (
            <div key={g.key} className="card" style={{ overflow:"hidden" }}>
              {g.imgs.length ? (
                <div onClick={() => setFoto({ imgs:g.imgs, i:0 })} style={{ position:"relative", cursor:"zoom-in", height:205, background:C.bg }}>
                  <img src={g.imgs[0]} alt={g.name} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                  {g.imgs.length > 1 && <span style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.6)", color:"white", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:800 }}>📷 {g.imgs.length}</span>}
                </div>
              ) : (
                <div style={{ height:205, display:"flex", alignItems:"center", justifyContent:"center", fontSize:54, background:C.bg }}>{g.emoji}</div>
              )}
              <div style={{ padding:"12px 14px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:900, fontSize:15 }}>{g.name}</div>
                    <div style={{ fontSize:12, color:C.muted, fontWeight:700 }}>{[g.brand, g.color].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:15, color:C.green, whiteSpace:"nowrap" }}>{fmt(g.price)}</div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
                  {ordenarTallas(g.tallas).map(t => {
                    const elegida = tallaElegida(g) === t.size;
                    const agotada = t.stock <= 0;
                    return (
                      <button
                        key={t.size}
                        onClick={() => { if (!agotada) setTallasSel(s => ({ ...s, [g.key]: s[g.key] === t.size ? undefined : t.size })); }}
                        disabled={agotada}
                        title={agotada ? "Talla agotada" : `Elegir la talla ${t.size} para pedir`}
                        style={{ fontSize:11.5, fontWeight:800, borderRadius:9, padding:"4px 9px", cursor:agotada ? "default" : "pointer", fontFamily:"inherit", background:agotada ? C.bg : (elegida ? C.green : C.greenLight), color:agotada ? C.muted : (elegida ? "white" : C.green), border:`1.5px solid ${agotada ? C.border : (elegida ? C.green : C.green + "90")}` }}
                      >
                        T{t.size}{agotada ? " · Agotado" : ""}
                      </button>
                    );
                  })}
                </div>
                {enPedido(g.key) ? (
                  <div style={{ display:"flex", gap:7, alignItems:"stretch", marginTop:12 }}>
                    <button
                      onClick={() => ajustar(g.key, -1)}
                      title={cantDe(g.key) <= 1 ? "Quitar del pedido" : "Quitar una unidad"}
                      style={{ width:42, flexShrink:0, borderRadius:13, border:`2px solid ${C.green}`, background:"transparent", color:C.green, fontSize:21, fontWeight:900, lineHeight:1, cursor:"pointer", fontFamily:"inherit" }}
                    >−</button>
                    <div style={{ flex:1, minWidth:0, background:C.greenLight, border:`2px solid ${C.green}`, borderRadius:13, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontSize:12.5, fontWeight:900, color:C.green, lineHeight:1.25 }}>✓ En el pedido</div>
                      <div style={{ fontSize:11.5, fontWeight:800, color:C.green, opacity:.9, lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {cantDe(g.key)} unidad{cantDe(g.key) === 1 ? "" : "es"} · {fmt((+g.price || 0) * cantDe(g.key))}
                      </div>
                    </div>
                    <button
                      onClick={() => ajustar(g.key, 1)}
                      title="Agregar una unidad"
                      style={{ width:42, flexShrink:0, borderRadius:13, border:`2px solid ${C.green}`, background:C.green, color:"white", fontSize:21, fontWeight:900, lineHeight:1, cursor:"pointer", fontFamily:"inherit" }}
                    >＋</button>
                  </div>
                ) : (
                  <button
                    onClick={() => alternarPedido(g)}
                    title="Juntar esta prenda para pedirla por WhatsApp"
                    style={{ width:"100%", marginTop:12, padding:"11px 12px", borderRadius:13, cursor:"pointer", fontFamily:"inherit", fontWeight:900, fontSize:13.5, border:`2px solid ${C.green + "90"}`, background:"transparent", color:C.green }}
                  >
                    ＋ Añadir al pedido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {items !== undefined && items.length > 0 && visibles.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted, fontWeight:800 }}>😕 Nada coincide con ese filtro</div>
      )}

      {/* 🛍️ Barra del pedido — cada referencia discriminada + total */}
      {pedido.length > 0 && (
        <div style={{ position:"fixed", left:0, right:0, bottom:0, background:"#0E1116", color:"white", zIndex:120, boxShadow:"0 -8px 26px rgba(0,0,0,.32)" }}>
          <div style={{ maxWidth:980, margin:"0 auto", padding:"10px 12px", paddingBottom:"calc(10px + env(safe-area-inset-bottom))" }}>
            {/* Prendas elegidas, una por una */}
            <div style={{ maxHeight:Math.min(pedido.length, 3) * 36 + 8, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
              {pedido.map((x, i) => {
                const n = x.qty || 1;
                return (
                  <div key={x.key} style={{ display:"flex", alignItems:"center", gap:8, height:36, borderBottom:"1px solid rgba(255,255,255,.09)" }}>
                    <span style={{ width:20, flexShrink:0, color:"rgba(255,255,255,.45)", fontWeight:900, fontSize:12, textAlign:"center" }}>{i + 1}</span>
                    <span style={{ flex:1, minWidth:0, fontWeight:800, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {x.name}{x.color ? ` · ${x.color}` : ""}{tallaDe(x) ? ` · T${tallaDe(x)}` : ""}
                    </span>
                    {n > 1 && <span style={{ flexShrink:0, fontWeight:900, fontSize:12, color:"rgba(255,255,255,.6)" }}>×{n}</span>}
                    <span style={{ flexShrink:0, fontWeight:900, fontSize:13, color:"#9BE7CD" }}>{fmt((+x.price || 0) * n)}</span>
                    <button
                      onClick={() => setPedido(prev => prev.filter(p => p.key !== x.key))}
                      title="Quitar esta prenda del pedido"
                      style={{ width:26, height:26, flexShrink:0, borderRadius:8, background:"rgba(255,255,255,.12)", border:"none", color:"rgba(255,255,255,.85)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
                    >✕</button>
                  </div>
                );
              })}
            </div>

            {/* Sumatoria */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, padding:"9px 0", borderTop:"1.5px solid rgba(255,255,255,.22)", fontWeight:900, fontSize:14.5 }}>
              <span>TOTAL · {unidades} unidad{unidades === 1 ? "" : "es"}</span>
              <span style={{ color:"#00E0A8" }}>{fmt(totalPedido)}</span>
            </div>

            {/* Acciones */}
            <div style={{ display:"flex", gap:9 }}>
              <button
                onClick={() => setPedido([])}
                title="Vaciar el pedido"
                style={{ width:50, flexShrink:0, background:"rgba(255,255,255,.12)", border:"none", borderRadius:13, color:"white", fontSize:17, cursor:"pointer", fontFamily:"inherit" }}
              >🗑️</button>
              <button
                onClick={enviarPedido}
                title="Abrir WhatsApp con este pedido"
                style={{ flex:1, background:"#25D366", color:"white", border:"none", borderRadius:13, padding:"14px 12px", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}
              >📤 Enviar pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* Pie */}
      <div style={{ textAlign:"center", padding:"24px 16px 40px", fontSize:12.5, color:C.muted, fontWeight:700, lineHeight:1.7 }}>
        Hecho con 🧡 stokly<br />
        <button
          onClick={() => { window.location.href = window.location.origin + window.location.pathname; }}
          style={{ marginTop:8, background:"white", border:"1.5px solid "+C.border, borderRadius:12, padding:"9px 16px", fontWeight:800, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", color:C.text }}
        >¿Eres la tienda? Inicia sesión</button>
      </div>

      {/* Hueco para que la barra del pedido no tape el pie */}
      {pedido.length > 0 && <div style={{ height:122 + Math.min(pedido.length, 3) * 36 }} />}

      {/* Visor de fotos */}
      {foto && (
        <div onClick={() => setFoto(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.93)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <img src={foto.imgs[foto.i]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:"100%", maxHeight:"76vh", borderRadius:14, objectFit:"contain" }} />
          {foto.imgs.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setFoto(f => ({ ...f, i:(f.i - 1 + f.imgs.length) % f.imgs.length })); }} style={{ position:"fixed", left:10, top:"50%", transform:"translateY(-50%)", width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:24, cursor:"pointer", fontFamily:"inherit" }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setFoto(f => ({ ...f, i:(f.i + 1) % f.imgs.length })); }} style={{ position:"fixed", right:10, top:"50%", transform:"translateY(-50%)", width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:24, cursor:"pointer", fontFamily:"inherit" }}>›</button>
              <div onClick={e => e.stopPropagation()} style={{ position:"fixed", bottom:26, left:"50%", transform:"translateX(-50%)", color:"white", fontWeight:800, fontSize:13, background:"rgba(0,0,0,.55)", borderRadius:20, padding:"6px 14px" }}>{foto.i + 1} / {foto.imgs.length}</div>
            </>
          )}
          <button onClick={e => { e.stopPropagation(); setFoto(null); }} style={{ position:"fixed", top:14, right:14, width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,.16)", border:"none", color:"white", fontSize:18, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
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

  /* ── 🏷️ Etiquetas imprimibles con código de barras ── */
  .etq { width: 52mm; height: 34mm; background: #fff; border: 0.4mm solid #D0D5DD; border-radius: 2.5mm; padding: 2.5mm 3mm; display: flex; flex-direction: column; gap: 0.8mm; box-sizing: border-box; overflow: hidden; flex-shrink: 0; }
  .etq-n { font-size: 9.5pt; font-weight: 900; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15; }
  .etq-c { font-size: 7.5pt; color: #475467; font-weight: 700; white-space: nowrap; overflow: hidden; }
  .etq svg { width: 100%; height: 11mm; }
  .etq-s { font-size: 7pt; font-weight: 800; text-align: center; letter-spacing: 0.6px; margin-top: auto; color: #000; }
  #stokly-print { position: fixed; left: -10000px; top: 0; }
  @media print {
    body * { visibility: hidden !important; }
    #stokly-print, #stokly-print * { visibility: visible !important; }
    #stokly-print { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; padding: 6mm; display: flex; flex-wrap: wrap; gap: 3mm; background: #fff; }
    .etq { page-break-inside: avoid; }
  }
`;

// ── Modal "MI NEGOCIO": nombre (del negocio o personal) + logo ────────────────
// ── 👥 CRM: ficha de cada cliente + TODO lo que ha comprado ──────────
function CrmModal({ customers, setCustomers, sales, setSales, products, onClose, showToast, isMobile }) {
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);       // cliente a crear/editar
  const [abierto, setAbierto] = useState(null); // ficha con el historial abierto
  const plano = s => String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const t = plano(q.trim());

  // 📇 Resumen de cada cliente a partir de sus ventas ligadas
  const fichas = (customers||[])
    .filter(c => !t || plano([c.name,c.city,c.phone,c.email,c.notes].join(" ")).includes(t))
    .map(c => {
      const compras = (sales||[]).filter(s => String(s.customerId) === String(c.id));
      const gastado = compras.reduce((a,s)=>a+(s.total||0),0);
      const uds     = compras.reduce((a,s)=>a+(s.qty||0),0);
      const fechas  = compras.map(s=>s.date).filter(Boolean).sort();
      return { c, compras, gastado, uds, n:compras.length, ult:fechas[fechas.length-1]||"", primera:fechas[0]||"" };
    })
    .sort((a,b)=> (b.gastado - a.gastado) || String(a.c.name).localeCompare(String(b.c.name)));
  const totalGastado = fichas.reduce((a,f)=>a+f.gastado,0);
  const totalCompras = fichas.reduce((a,f)=>a+f.n,0);

  const guardar = () => {
    const n = String((form && form.name) || "").trim();
    if (!n) { showToast("⚠️ El nombre del cliente es obligatorio"); return; }
    const limpio = { name:n, city:String(form.city||"").trim(), phone:String(form.phone||"").trim(), email:String(form.email||"").trim(), notes:String(form.notes||"").trim() };
    if (form.id) {
      setCustomers(prev => prev.map(x => String(x.id)===String(form.id) ? { ...x, ...limpio } : x));
      showToast("✅ Cliente actualizado");
    } else {
      setCustomers(prev => [...prev, { id:newId(), createdAt:hoyISO(), ...limpio }]);
      showToast("✅ Cliente agregado");
    }
    setForm(null);
  };

  const borrar = (c) => {
    if (!window.confirm(`🗑️ ¿Eliminar a "${c.name}"?\n\nSe borra su ficha; sus ventas quedan guardadas SIN cliente.\n\nSe borrará PERMANENTEMENTE.`)) return;
    setCustomers(prev => prev.filter(x => String(x.id) !== String(c.id)));
    setSales(prev => prev.map(s => String(s.customerId)===String(c.id) ? { ...s, customerId:null } : s));
    setAbierto(null);
    showToast("🗑️ Cliente eliminado");
  };

  const campo = (k, ph, extra) => (
    <input className="stk-input" placeholder={ph} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} {...extra} />
  );

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ fontWeight:900, fontSize:isMobile?19:20 }}>👥 Clientes (CRM)</div>
          <button className="btn-main" onClick={()=>setForm({ name:"", city:"", phone:"", email:"", notes:"" })} style={{ padding:"9px 14px", fontSize:13, whiteSpace:"nowrap" }}>+ Nuevo cliente</button>
        </div>
        <div style={{ fontSize:12.5, color:C.muted, fontWeight:700, marginBottom:14 }}>
          {customers.length} cliente{customers.length===1?"":"s"} · {totalCompras} compra{totalCompras===1?"":"s"} · {fmt(totalGastado)} facturados
        </div>

        {/* ➕ Alta / ✏️ edición del cliente */}
        {form && (
          <div style={{ background:C.bg, border:"1.5px solid "+C.border, borderRadius:18, padding:14, marginBottom:14, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:11.5, fontWeight:900, color:C.muted, textTransform:"uppercase" }}>{form.id ? "✏️ Editar cliente" : "➕ Nuevo cliente"}</div>
            {campo("name","Nombre * (obligatorio)")}
            <div style={{ display:"flex", gap:8 }}>
              {campo("city","📍 Ciudad")}
              {campo("phone","📞 Celular",{ inputMode:"tel" })}
            </div>
            {campo("email","✉️ Correo (opcional)",{ inputMode:"email" })}
            <textarea className="stk-input" placeholder="📝 Notas: tallas que usa, gustos, avisos…" rows={2} style={{ resize:"vertical" }} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-outline" onClick={()=>setForm(null)} style={{ flex:1 }}>Cancelar</button>
              <button className="btn-main" onClick={guardar} style={{ flex:2 }}>Guardar</button>
            </div>
          </div>
        )}

        <input className="stk-input" placeholder="🔍 Buscar por nombre, ciudad o celular" value={q} onChange={e=>setQ(e.target.value)} style={{ marginBottom:12 }} />

        {!fichas.length && (
          <div style={{ textAlign:"center", padding:"26px 10px", color:C.muted, fontWeight:700, lineHeight:1.7, whiteSpace:"pre-line" }}>
            {customers.length ? "Ningún cliente coincide con la búsqueda 🔍" : "Aún no tienes clientes 👥\nAgrégalos aquí o directo al registrar una venta."}
          </div>
        )}

        {fichas.map(f => {
          const abi = abierto === String(f.c.id);
          const iniciales = String(f.c.name||"?").trim().charAt(0).toUpperCase() || "?";
          return (
            <div key={f.c.id} style={{ background:C.white, border:"1.5px solid "+C.border, borderRadius:18, padding:14, marginBottom:10 }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:14, background:C.blueLight, color:C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:17, flexShrink:0 }}>{iniciales}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:15 }}>{f.c.name}</div>
                  <div style={{ fontSize:11.5, color:C.muted, fontWeight:700, marginTop:3, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    {f.c.city && <span>📍 {f.c.city}</span>}
                    {f.c.phone && <span>📞 <a href={`tel:${f.c.phone}`} style={{ color:C.blue, textDecoration:"none", fontWeight:900 }}>{f.c.phone}</a></span>}
                    {f.c.email && <span>✉️ {f.c.email}</span>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:7 }}>
                    <span className="pill" style={{ background:C.greenLight, color:C.green }}>{f.n} compra{f.n===1?"":"s"}</span>
                    <span className="pill" style={{ background:C.yellowLight, color:C.yellow }}>{fmt(f.gastado)}</span>
                    {f.ult && <span className="pill" style={{ background:C.bg, color:C.muted }}>Última: {f.ult}</span>}
                    {f.primera && <span className="pill" style={{ background:C.bg, color:C.muted }}>1ª: {f.primera}</span>}
                  </div>
                </div>
              </div>
              {f.c.notes && <div style={{ fontSize:12, color:C.text, background:C.bg, borderRadius:12, padding:"8px 10px", marginTop:9, fontWeight:600, lineHeight:1.5 }}>📝 {f.c.notes}</div>}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button className="filter-btn" onClick={()=>setAbierto(abi?null:String(f.c.id))} style={{ flex:1, borderColor:abi?C.blue:undefined, color:abi?C.blue:undefined }}>
                  🧾 {abi ? "Ocultar compras" : (f.n ? `Ver sus ${f.n} compra${f.n===1?"":"s"}` : "Ver compras")}
                </button>
                <button className="filter-btn" title="Editar cliente" onClick={()=>setForm({ id:String(f.c.id), name:f.c.name, city:f.c.city, phone:f.c.phone, email:f.c.email, notes:f.c.notes })}>✏️</button>
                <button className="filter-btn" title="Eliminar cliente" onClick={()=>borrar(f.c)} style={{ color:C.red }}>🗑️</button>
              </div>
              {abi && (
                <div style={{ marginTop:10, borderTop:"1.5px dashed "+C.border, paddingTop:8 }}>
                  {!f.compras.length && <div style={{ fontSize:12.5, color:C.muted, fontWeight:700, padding:"6px 0" }}>Todavía no ha comprado nada 🕓</div>}
                  {[...f.compras].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(s=>{
                    const p = products.find(x=>String(x.id)===String(s.productId));
                    return (
                      <div key={s.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid "+C.border+"60" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p?.name||"Producto"}</div>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{s.date} · {p?`${p.color||"–"}/T${p.size||"–"}`:""} · {s.method}</div>
                        </div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.muted, flexShrink:0 }}>×{s.qty}</div>
                        <div style={{ fontWeight:900, fontSize:13.5, color:C.green, flexShrink:0, minWidth:72, textAlign:"right" }}>{fmt(s.total)}</div>
                      </div>
                    );
                  })}
                  {f.n>0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:9, fontWeight:900, fontSize:13 }}>
                      <span style={{ color:C.muted }}>{f.n} compra{f.n===1?"":"s"} · {f.uds} uds</span>
                      <span style={{ color:C.green }}>{fmt(f.gastado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop:14 }}>
          <button className="btn-outline" onClick={onClose} style={{ width:"100%" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function NegocioModal({ negocio, workspaceId, onClose, onGuardar, showToast }) {
  const [nombre, setNombre] = useState((negocio && negocio.name) || "");
  const [logo, setLogo] = useState((negocio && negocio.logo_url) || "");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState("");
  const logoRef = useRef(null);

  async function pickLogo(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setErr(""); setSubiendo(true);
    try {
      const url = await uploadLogoImage(f, workspaceId);
      const anterior = logo;
      setLogo(url);
      if (anterior && anterior !== url) borrarImagenPublica(anterior);
    } catch (e2) {
      console.error("[stokly] logo:", e2 && e2.message);
      setErr("No se pudo subir el logo — revisa tu conexión e inténtalo otra vez.");
    } finally { setSubiendo(false); }
  }

  async function guardar() {
    if (subiendo) { setErr("⏳ Espera a que termine de subir el logo"); return; }
    if (!nombre.trim()) { setErr("Escribe el nombre de tu negocio (o tu nombre)"); return; }
    setGuardando(true); setErr("");
    const r = await onGuardar({ name: nombre, logo_url: logo });
    setGuardando(false);
    if (!r.ok) { setErr(r.error || "No se pudo guardar"); return; }
    showToast("✅ Negocio actualizado");
    onClose();
  }

  const iniciales = (String(nombre).trim()[0] || "N").toUpperCase();

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:6 }}>🏪 Mi negocio</div>
        <div style={{ fontSize:12.5, color:C.muted, fontWeight:600, marginBottom:18, lineHeight:1.55 }}>
          El nombre puede ser el de tu negocio <b>o tu nombre personal</b>. Se muestra en tu panel y en el catálogo público.
        </div>

        {/* Logo del negocio */}
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:18 }}>
          {logo
            ? <img src={logo} alt="Logo" style={{ width:76, height:76, borderRadius:20, objectFit:"cover", background:C.bg, border:"1.5px solid "+C.border }} />
            : <div style={{ width:76, height:76, borderRadius:20, background:"linear-gradient(135deg,#00C896,#4A90FF)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:30, flexShrink:0 }}>{iniciales}</div>}
          <div style={{ flex:1, minWidth:0 }}>
            <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={pickLogo} />
            <button className="filter-btn" onClick={() => logoRef.current && logoRef.current.click()} disabled={subiendo} style={{ width:"100%", marginBottom:6, opacity:subiendo?0.7:1 }}>
              {subiendo ? "⏳ Subiendo logo…" : (logo ? "🖼️ Cambiar logo" : "🖼️ Subir logo (opcional)")}
            </button>
            {logo && (
              <button className="filter-btn" onClick={() => { borrarImagenPublica(logo); setLogo(""); }} style={{ width:"100%" }}>
                ✕ Quitar logo
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>Nombre del negocio o tu nombre *</div>
        <input className="stk-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Mi Negocio / María Pérez" maxLength={60} />
        <div style={{ fontSize:11.5, color:C.muted, fontWeight:600, marginTop:8, lineHeight:1.5 }}>
          💡 Este es el nombre que aparece en tu panel y en el link del catálogo.
        </div>

        {err && <div style={{ background:C.redLight, borderRadius:12, padding:11, marginTop:14, fontSize:13, fontWeight:700, color:C.red, lineHeight:1.5 }}>{err}</div>}

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={guardar} disabled={guardando || subiendo} style={{ flex:2, opacity:(guardando||subiendo)?0.7:1 }}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar (desktop) ─────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, lowStock, signOut, negocio, onNegocio }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          {negocio && negocio.logo_url
            ? <img src={negocio.logo_url} alt="Logo del negocio" style={{ width:36, height:36, borderRadius:12, objectFit:"cover", background:"white", border:"1.5px solid rgba(255,255,255,0.25)" }} />
            : <div style={{ width:36, height:36, background:"linear-gradient(135deg,#00C896,#4A90FF)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:18 }}>S</div>}
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, background:"linear-gradient(135deg,#00C896,#60A5FA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>stokly</span>
        </div>
        <button onClick={onNegocio} title="Nombre y logo de tu negocio" style={{ background:"none", border:"none", padding:0, margin:0, textAlign:"left", cursor:"pointer", fontFamily:"inherit", display:"block" }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:800, lineHeight:1.3 }}>{(negocio && negocio.name) || "Panel de gestión"}</div>
          <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.4)", fontWeight:700 }}>🏪 Editar nombre y logo</div>
        </button>
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
  // 👥 CRM: fichas de clientes (nombre, ciudad, celular…) ligadas a sus ventas
  const [customers, setCustomers]   = useSyncedTable("customers", { fromRow: customerFromRow, toRow: customerToRow, onError: (m) => showToast(m) }, user?.id, workspaceId);

  // 🏪 Nombre y logo del negocio del panel activo
  const nombreSugerido = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "";
  const { negocio, guardar: guardarNegocio } = useNegocio(workspaceId, nombreSugerido);

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

  // 📲 Catálogo PÚBLICO — cualquiera con el link lo ve sin iniciar sesión
  if (typeof window !== "undefined" && window.location.hash.startsWith("#/catalogo")) {
    return <PublicCatalog />;
  }

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
      <Sidebar tab={tab} setTab={setTab} lowStock={lowStock} signOut={signOut} negocio={negocio} onNegocio={() => setModal("negocio")} />

      {/* Main */}
      <div className="main-wrap">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontWeight:900, fontSize:isMobile?18:22, color:C.text }}>{isMobile ? "stokly 📦" : `${currentTab?.emoji} ${currentTab?.label}`}</div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{isMobile ? ((negocio && negocio.name) || "Tu negocio bajo control") : currentTab?.desc}</div>
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
                {negocio && negocio.logo_url
                  ? <img src={negocio.logo_url} alt="Logo del negocio" style={{ width:36, height:36, borderRadius:12, objectFit:"cover", background:"white" }} />
                  : (user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
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
                      onClick={() => { setUserMenu(false); setModal("negocio"); }}
                      title="Nombre y logo de tu negocio"
                      style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", borderBottom:"1.5px solid #EAECF5", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:14, color:C.green, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                    >
                      🏪 Mi negocio
                    </button>
                    <button
                      onClick={() => { setUserMenu(false); setModal("crm"); }}
                      title="Clientes: sus datos y todo lo que han comprado"
                      style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", borderBottom:"1.5px solid #EAECF5", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:14, color:C.blue, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                    >
                      👥 Clientes (CRM)
                    </button>
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
          {tab==="home"      && <Home      products={products} sales={sales} expenses={expenses} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} lowStock={lowStock} setTab={setTab} setModal={setModal} isMobile={isMobile} />}
          {tab==="inventory" && <Inventory products={products} setProducts={setProducts} lowStock={lowStock} showToast={showToast} setModal={setModal} setImportView={setImportView} isMobile={isMobile} workspaceId={workspaceId} />}
          {tab==="sales"     && <Sales     sales={sales} setSales={setSales} products={products} customers={customers} setProducts={setProducts} totalSales={totalSales} isMobile={isMobile} showToast={showToast} />}
          {tab==="expenses"  && <Expenses  expenses={expenses} setExpenses={setExpenses} totalExpenses={totalExpenses} showToast={showToast} isMobile={isMobile} />}
          {tab==="finance"   && <Finance   products={products} sales={sales} expenses={expenses} totalSales={totalSales} totalExpenses={totalExpenses} profit={profit} isMobile={isMobile} />}
          {tab==="metrics"   && <Metrics   products={products} sales={sales} expenses={expenses} totalSales={totalSales} profit={profit} isMobile={isMobile} />}
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

      {modal==="product" && <AddProductModal onClose={() => setModal(null)} workspaceId={workspaceId} showToast={showToast} onSave={p => {
        const auto = !codLimpio(p.sku);
        const nuevo = auto ? { ...p, sku: generarSku(products.map(x => x.sku)) } : p;
        setProducts(prev => [...prev, nuevo]);
        setModal(null);
        showToast(auto ? `✅ Producto agregado · etiqueta ${nuevo.sku}` : "✅ Producto agregado");
      }} />}
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
        let fotoN = 0, autoN = 0, precioN = 0;
        // Coincide por SKU; si el archivo no trae SKU, por nombre+marca+color+talla
        const clave = x => [x.name, x.brand||"", x.color||"", x.size||""].map(v=>String(v).trim().toLowerCase()).join("|");
        const mismo = (ex, p) => { const cod = codLimpio(p.sku); return cod ? codLimpio(ex.sku) === cod : clave(ex) === clave(p); };
        if(mode==="replace") {
          autoN = newP.filter(p => !codLimpio(p.sku)).length;
          setProducts(conCodigos(newP));
        }
        else {
          const upd = new Map(); const add = [];
          newP.forEach(p => { const ex = products.find(x => mismo(x, p));
            if(!ex) { add.push(p); return; }
            // "➕ Agregar" no duplica y además trae PRECIO y COSTO del archivo:
            // así se corrigen los precios volviendo a importar la hoja ya arreglada.
            const cambios = {};
            if (p.price > 0 && Number(p.price) !== Number(ex.price)) { cambios.price = p.price; precioN++; }
            if (p.cost > 0 && Number(p.cost) !== Number(ex.cost)) cambios.cost = p.cost;
            if (p.image && !ex.image) { cambios.image = p.image; fotoN++; }
            if (Object.keys(cambios).length) upd.set(ex.id, { ...ex, ...cambios });
          });
          autoN = add.filter(p => !codLimpio(p.sku)).length;
          const listos = conCodigos(add, products);
          setProducts(prev => [...prev.map(x => upd.get(x.id) || x), ...listos]);
        }
        setModal(null);
        showToast(`✅ ${newP.length} importados${autoN?` · 🏷️ ${autoN} con código nuevo`:""}${precioN?` · 💲 ${precioN} precio${precioN>1?"s":""} actualizado${precioN>1?"s":""}`:""}${fotoN?` · 📷 foto agregada a ${fotoN} existentes`:""}${aviso?` · ⚠️ ${aviso}`:""}`);
      }} />}
      {modal==="sale"    && <AddSaleModal   products={products} customers={customers} setCustomers={setCustomers} sales={sales} onClose={() => setModal(null)} onSave={(r) => { const arr = Array.isArray(r) ? r : [r]; setSales(prev=>[...prev, ...arr]); const porProd = {}; arr.forEach(s => { if (s.productId != null) porProd[String(s.productId)] = (porProd[String(s.productId)]||0) + (s.qty||0); }); setProducts(prev=>prev.map(p => { const q = porProd[String(p.id)]; return q ? {...p, stock:p.stock-q, sold:p.sold+q} : p; })); setModal(null); showToast("💰 Venta: "+fmt(arr.reduce((a,s)=>a+(s.total||0),0))); }} />}
      {modal==="expense" && <AddExpenseModal onClose={() => setModal(null)} onSave={e => { setExpenses(prev=>[...prev,e]); setModal(null); showToast("💸 Gasto registrado"); }} />}
      {modal==="negocio" && <NegocioModal negocio={negocio} workspaceId={workspaceId} onClose={() => setModal(null)} onGuardar={guardarNegocio} showToast={showToast} />}
      {modal==="crm"     && <CrmModal customers={customers} setCustomers={setCustomers} sales={sales} setSales={setSales} products={products} onClose={() => setModal(null)} showToast={showToast} isMobile={isMobile} />}
      {modal==="team"    && <TeamModal      user={user} activeWs={workspaceId} isOwner={isOwner} onClose={() => setModal(null)} showToast={showToast} onChanged={refreshMemberships} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── 🔄 DEVOLUCIÓN ────────────────────────────────────────────────────────────
// Cuando se BORRA una venta (devolución), el inventario se reajusta solo:
// las unidades vuelven al stock y se baja el contador de "vendido" del producto.
function aplicarDevolucion(setProducts, ventasBorradas) {
  const porProd = {};
  (ventasBorradas || []).forEach(s => {
    if (s && s.productId != null) porProd[String(s.productId)] = (porProd[String(s.productId)] || 0) + (s.qty || 0);
  });
  if (!Object.keys(porProd).length) return;
  setProducts(prev => prev.map(p => {
    const q = porProd[String(p.id)];
    if (!q) return p;
    return { ...p, stock: (p.stock || 0) + q, sold: Math.max(0, (p.sold || 0) - q) };
  }));
}

// ✏️ EDITAR una venta: el inventario se reajusta solo.
//    Si cambia de referencia/color/talla o de cantidad, el producto VIEJO
//    recupera sus unidades y el NUEVO las descuenta (delta = unidades vendidas).
function aplicarCambioVenta(setProducts, vieja, nueva) {
  const delta = {};
  const sumar = (pid, q, signo) => {
    if (pid == null || !q) return;
    const k = String(pid);
    delta[k] = (delta[k] || 0) + signo * q;
  };
  if (vieja) sumar(vieja.productId, vieja.qty || 0, -1);
  if (nueva) sumar(nueva.productId, nueva.qty || 0, +1);
  if (!Object.keys(delta).length) return;
  setProducts(prev => prev.map(p => {
    const d = delta[String(p.id)];
    if (!d) return p;
    return { ...p, stock: Math.max(0, (p.stock || 0) - d), sold: Math.max(0, (p.sold || 0) + d) };
  }));
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home({ products, sales, expenses, totalSales, totalExpenses, profit, lowStock, setTab, setModal, isMobile }) {
  const [rango, setRango] = useState({ id:"todo" });
  const sF = sales.filter(s => enRango(s.date, rango));
  const eF = expenses.filter(e => solapaRango(e, rango));
  const totalSR = sF.reduce((a,s) => a + s.total, 0);
  const totalER = eF.reduce((a,e) => a + e.amount, 0);
  const profitR = totalSR - totalER;
  const unidadesR = {};
  sF.forEach(s => { unidadesR[s.productId] = (unidadesR[s.productId] || 0) + (s.qty || 0); });
  // 📌 Fuente de verdad = las ventas registradas (si borras una, baja al instante)
  const vendidos = (p) => (unidadesR[p.id] || 0);
  const top5 = [...products].sort((a,b) => vendidos(b) - vendidos(a)).slice(0,5);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <DateRangeFilter rango={rango} onChange={setRango} />
      {/* Hero card */}
      <div style={{ background:"linear-gradient(135deg,#00C896 0%,#4A90FF 100%)", borderRadius:24, padding:isMobile?22:28, color:"white" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:0.85, marginBottom:4 }}>{rango.id==="todo" ? "Ganancia neta del mes" : "Ganancia · " + rangoLabel(rango)}</div>
        <div style={{ fontSize:isMobile?36:48, fontWeight:900, marginBottom:16 }}>{fmt(profitR)}</div>
        <div className="grid-2" style={{ maxWidth:480 }}>
          {[["VENTAS",totalSR],[" GASTOS",totalER]].map(([l,v])=>(
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
          { label: rango.id==="todo" ? "Unidades vendidas" : "Vendidas en el rango", value: sF.reduce((a,s)=>a+(s.qty||0),0), color:C.green,  bg:C.greenLight,  emoji:"💰" },
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
                <div style={{ fontWeight:900, fontSize:15, color:C.green }}>{vendidos(p)}</div>
                <div style={{ fontSize:10, color:C.muted }}>{rango.id==="todo" ? "vendidos" : "uds en rango"}</div>
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
  const [toolsMenu, setToolsMenu] = useState(false); // menú desplegable "Acciones" (escanear, compartir, etiquetas, descargar, vista, vaciar)
  const [filterCat, setFilterCat] = useState("Todos");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editGroup, setEditGroup] = useState(null); // referencia en edición (agregar tallas/colores)
  const [scanOpen, setScanOpen] = useState(false);   // escáner de código de barras
  const [rango, setRango] = useState({ id:"todo" }); // fecha en que se AGREGÓ el producto
  const [filterSize, setFilterSize] = useState("Todas"); // filtro de talla
  const [shareOpen, setShareOpen] = useState(false); // compartir catálogo (link/WhatsApp)
  const [labelsOpen, setLabelsOpen] = useState(false); // imprimir etiquetas con código de barras
  const [visor, setVisor] = useState(null);            // 🔍 fotos a pantalla completa {fotos:[], i}
  const fileRef = useRef(null);

  // 📸 Sube fotos al COLOR elegido de una referencia (agrega, no reemplaza)
  //    Cada foto se sube POR SEPARADO: si una falla, las demás sí se quedan.
  async function handlePhoto(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !photoTarget) return;
    setUploading(true);
    try {
      const nuevas = [], fallas = [];
      for (const f of files) {
        try { nuevas.push(await subirFotoProducto(f, workspaceId)); }
        catch (err) { console.error("[stokly] foto:", err && err.message); fallas.push(err); }
      }
      if (nuevas.length) {
        const ids = new Set(photoTarget.ids.map(x => String(x)));
        setProducts(prev => prev.map(x => {
          if (!ids.has(String(x.id))) return x;
          return { ...x, image: juntarImgs([...imgsDe(x.image), ...nuevas]) };
        }));
      }
      if (!fallas.length) {
        showToast(`📷 ${nuevas.length} foto${nuevas.length > 1 ? "s" : ""} agregada${nuevas.length > 1 ? "s" : ""} al color`);
      } else if (nuevas.length) {
        showToast(`📷 ${nuevas.length} ok · ❌ ${fallas.length}: ${textoErrorFoto(fallas[fallas.length - 1])}`);
      } else {
        showToast("❌ " + textoErrorFoto(fallas[0]));
      }
    } catch (err) {
      console.error("[stokly] foto:", err && err.message);
      showToast("❌ " + textoErrorFoto(err));
    } finally {
      setUploading(false);
    }
  }

  // Quita una foto del color elegido (todas sus variantes)
  const quitarFoto = (variants, url) => {
    if (!window.confirm("¿Quitar esta foto del color?")) return;
    const ids = new Set(variants.map(v => String(v.id)));
    setProducts(prev => prev.map(x => ids.has(String(x.id)) ? { ...x, image: juntarImgs(imgsDe(x.image).filter(u => u !== url)) } : x));
    showToast("🗑️ Foto quitada");
  };

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

  // ⬇️ Descarga TODO el inventario en Excel (.xlsx) con todas las columnas
  function descargarInventario() {
    if (!products.length) { showToast("📭 Tu inventario está vacío"); return; }
    cargarScriptXLSX(
      "⏳ Preparando tu inventario…",
      "❌ No se pudo cargar el generador de Excel — revisa tu conexión",
      () => {
        try {
          const cab = ["nombre","sku","marca","color","talla","categoria","stock","stock mínimo","precio venta","costo","margen %","vendidos","codigo de barras","agregado","imagen"];
          const filas = products.map(p => [
            p.name, p.sku, p.brand || "", p.color || "", p.size || "", p.category,
            p.stock, p.minStock, p.price, p.cost,
            p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0,
            p.sold, p.barcode || "",
            p.addedAt ? p.addedAt.split("-").reverse().join("/") : "",
            p.image || "",
          ]);
          const ws = XLSX.utils.aoa_to_sheet([cab, ...filas]);
          ws["!cols"] = cab.map((h, i) => {
            let m = String(h).length;
            for (const f of filas) { const l = String(f[i] == null ? "" : f[i]).length; if (l > m) m = l; }
            return { wch: Math.min(45, m + 2) };
          });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Inventario");
          XLSX.writeFile(wb, `inventario-stokly-${hoyISO()}.xlsx`);
          showToast(`✅ Inventario descargado: ${products.length} productos`);
        } catch (e) { console.error("[stokly] export:", e); showToast("❌ No se pudo descargar: " + (e && e.message)); }
      },
      (m) => { if (m && m.charAt(0) !== "⏳") showToast(m); }
    );
  }
  const categories = ["Todos", ...new Set(products.map(p=>p.category))];
  // Tallas distintas del inventario (orden:2,4,10… y luego letras)
  const sizes = [...new Set(products.map(p => String(p.size || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric:true }));

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
    // Datos de referencia que se aplican a TODAS sus variantes (incluye categoría).
    // La subcategoría ya no se edita: si un producto antiguo la trae, se conserva.
    const cf = {
      name: refFields.name, brand: refFields.brand, category: refFields.category,
      categoryId: refFields.categoryId || "",
    };
    setProducts(prev => {
      const refOldIds = new Set(prev.filter(p => p.name === oldName && (p.brand || "") === oldBrand).map(p => String(p.id)));
      const keptIds = new Set(vars.map(v => String(v.id)));
      const removedIds = new Set([...refOldIds].filter(id => !keptIds.has(id)));
      const existing = new Set(prev.map(p => String(p.id)));
      const varMap = new Map(vars.map(v => [String(v.id), v]));
      let next = prev.filter(p => !removedIds.has(String(p.id))).map(p => {
        const id = String(p.id);
        const nv = varMap.get(id);
        if (nv) {
          // Si borraron el SKU de una variante que ya tenía, se conserva el suyo
          const sku = codLimpio(nv.sku) ? nv.sku : (codLimpio(p.sku) ? p.sku : "");
          return { ...p, ...nv, sku, ...cf };
        }
        if (refOldIds.has(id)) return { ...p, ...cf };
        return p;
      });
      const news = vars.filter(v => !existing.has(String(v.id))).map(v => ({ ...v, ...cf }));
      // Toda variante nueva sin SKU recibe el código que Stokly imprime en su etiqueta
      return conCodigos([...next, ...news]);
    });
    setEditGroup(null);
    showToast("✏️ Referencia actualizada");
  };
  // 🔎 Búsqueda: acepta "talla4", "talla 4", "4" o cualquier combinación de
  //    nombre + color + marca + talla + SKU (todas las palabras deben coincidir)
  const q = search.toLowerCase().trim();
  let palabras = q.split(/\s+/).filter(Boolean);
  let soloTalla = false;
  if (palabras.length && /^(talla|tallas|t|size)$/.test(palabras[0])) { soloTalla = true; palabras = palabras.slice(1); }
  const filtered = products.filter(p => {
    if (filterCat !== "Todos" && p.category !== filterCat) return false;
    if (filterSize !== "Todas" && String(p.size || "") !== filterSize) return false;
    if (rango.id !== "todo" && p.addedAt && !enRango(p.addedAt, rango)) return false;
    if (!palabras.length) return true;
    if (soloTalla) return String(p.size || "").toLowerCase().includes(palabras.join(" "));
    const campos = [p.name, p.brand, p.color, p.size, p.sku, p.category].map(x => String(x || "").toLowerCase());
    return palabras.every(w => campos.some(c => c.includes(w)));
  });
  const groups = groupProducts(filtered);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display:"none" }} />
      {/* 📷 Escáner de código de barras de la etiqueta */}
      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          onScan={(code) => {
            const p = buscarPorCodigo(products, code);
            if (p) {
              // Filtra por el código; si es un producto sin SKU, por su nombre/color/talla
              setSearch(String(p.sku || "").trim() || [p.name, p.color, p.size].filter(Boolean).join(" "));
              setFilterCat("Todos");
              setFilterSize("Todas");
              setScanOpen(false);
              showToast(`✅ ${p.name}${p.color ? " · " + p.color : ""}${p.size ? " · T" + p.size : ""} · ${p.sku ? "SKU " + p.sku : "🏷️ Código " + codInterno(p)}`);
              return null;
            }
            return `El código "${code}" no está en tu inventario`;
          }}
        />
      )}
      {/* 📅 Filtro de fecha — por cuándo se AGREGÓ el producto */}
      <DateRangeFilter rango={rango} onChange={setRango} />
      {/* Search + controls */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 240px" }}>
          <input className="stk-input" placeholder="🔍 Nombre, color, talla4, marca, SKU…" value={search} onChange={e=>setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,fontWeight:900 }}>✕</button>}
        </div>
        {/* ☰ Menú desplegable "Acciones" — agrupa escanear, compartir, etiquetas, descargar, vista y vaciar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <button
            onClick={() => setToolsMenu(m => !m)}
            title="Todas las acciones del inventario"
            style={{ background:"white", border:"1.5px solid #EAECF5", borderRadius:12, padding:"9px 13px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.text, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}
          >
            ☰ Acciones {toolsMenu ? "▴" : "▾"}
          </button>
          {toolsMenu && (
            <>
              <div onClick={() => setToolsMenu(false)} style={{ position:"fixed", inset:0, zIndex:70 }} />
              <div style={{ position:"absolute", top:42, right:0, background:"white", borderRadius:14, border:"1.5px solid #EAECF5", boxShadow:"0 12px 34px rgba(16,29,74,.18)", zIndex:80, overflow:"hidden", minWidth:205, fontFamily:"inherit", textAlign:"left" }}>
                {[
                  { icon:"📷",   label:"Escanear etiqueta",    desc:"Cámara o código", fn:() => setScanOpen(true) },
                  { icon:"📤",   label:"Compartir catálogo",   desc:"Link o WhatsApp", fn:() => setShareOpen(true) },
                  { icon:"🏷️",   label:"Etiquetas",            desc:"Código de barras", fn:() => setLabelsOpen(true) },
                  { icon:"⬇️",   label:"Descargar",            desc:"Inventario en Excel", fn:descargarInventario },
                ].map(o => (
                  <button
                    key={o.label}
                    onClick={() => { setToolsMenu(false); o.fn(); }}
                    style={{ width:"100%", padding:"10px 14px", background:"none", border:"none", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:13, color:C.text, fontFamily:"inherit", display:"flex", alignItems:"center", gap:9 }}
                  >
                    <span style={{ fontSize:15, width:20, textAlign:"center", flexShrink:0 }}>{o.icon}</span>
                    <span style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
                      <span>{o.label}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:C.muted }}>{o.desc}</span>
                    </span>
                  </button>
                ))}
                <div style={{ height:1, background:"#EAECF5", margin:"4px 0" }} />
                <div style={{ padding:"6px 14px 2px", fontSize:10, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.4 }}>👁 Vista</div>
                {[["visual","📋 Visual"],["list","☰ Lista"],["table","🗒️ Tabla"]].map(([id,label]) => (
                  <button
                    key={id}
                    onClick={() => { setViewMode(id); setToolsMenu(false); }}
                    style={{ width:"100%", padding:"9px 14px", background:viewMode===id?C.greenLight:"none", border:"none", textAlign:"left", cursor:"pointer", fontWeight:800, fontSize:13, color:viewMode===id?C.green:C.text, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}
                  >
                    <span>{label}</span>
                    {viewMode===id && <span style={{ marginLeft:"auto", fontWeight:900 }}>✓</span>}
                  </button>
                ))}
                {products.length>0 && (
                  <>
                    <div style={{ height:1, background:"#EAECF5", margin:"4px 0" }} />
                    <button
                      onClick={() => { setToolsMenu(false); clearAll(); }}
                      title="Vaciar todo el inventario (borrado permanente)"
                      style={{ width:"100%", padding:"10px 14px", background:"none", border:"none", textAlign:"left", cursor:"pointer", fontWeight:900, fontSize:13, color:C.red, fontFamily:"inherit", display:"flex", alignItems:"center", gap:9 }}
                    >
                      <span style={{ fontSize:15, width:20, textAlign:"center", flexShrink:0 }}>🗑️</span>
                      <span style={{ display:"flex", flexDirection:"column" }}>
                        <span>Vaciar</span>
                        <span style={{ fontSize:10, fontWeight:700, opacity:.8 }}>Borrado permanente</span>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Categoría + talla */}
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, flex:1, minWidth:0 }}>
          {categories.map(c => <button key={c} className={`filter-btn ${filterCat===c?"active":""}`} onClick={()=>setFilterCat(c)}>{c}</button>)}
        </div>
        <select
          className="stk-input"
          value={filterSize}
          onChange={e => setFilterSize(e.target.value)}
          title="Filtrar por talla"
          style={{ width:"auto", flexShrink:0, padding:"7px 10px", fontSize:12.5, fontWeight:800 }}
        >
          {["Todas", ...sizes].map(s => <option key={s} value={s}>{s === "Todas" ? "📏 Todas las tallas" : `📏 Talla ${s}`}</option>)}
        </select>
      </div>

      {/* Result summary */}
      {(search || filterSize!=="Todas" || rango.id!=="todo") && (
        <div style={{ background:groups.length?C.blueLight:C.redLight, borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, color:groups.length?C.blue:C.red }}>
          {groups.length
            ? `✅ ${groups.length} ref · ${filtered.length} variantes${filterSize!=="Todas" ? ` · T${filterSize}` : ""}${rango.id!=="todo" ? ` · 📅 ${rangoLabel(rango)}` : ""}`
            : `😕 Sin resultados${filterSize!=="Todas" ? ` en talla ${filterSize}` : ""}${rango.id!=="todo" ? ` · 📅 ${rangoLabel(rango)}` : ""}`}
        </div>
      )}

      {/* Alert strip */}
      {lowStock.length>0 && !search && filterSize==="Todas" && rango.id==="todo" && (
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
            // 📸 Todas las fotos de la referencia (todos sus colores) para la foto principal
            const fotosGrupo = (group.imgs && group.imgs.length) ? group.imgs : imgsDe(group.image);
            const isExpanded = expandedGroup===gi || search.length>0;
            const margin = group.price ? Math.round(((group.price-group.cost)/group.price)*100) : 0;
            return (
              <div key={gi} className={`group-card ${hasAlert?"has-alert":""}`}>
                {/* Header */}
                <div style={{ padding:"16px 18px 12px", cursor:"pointer" }} onClick={()=>setExpandedGroup(isExpanded&&!search?null:gi)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:64,height:64, background:hasAlert?C.redLight:C.greenLight, borderRadius:17, display:"flex",alignItems:"center",justifyContent:"center", fontSize:32, overflow:"hidden", flexShrink:0 }}>{fotosGrupo.length ? <CarruselFotos fotos={fotosGrupo} w={64} h={64} onAbrir={ix => setVisor({ fotos: fotosGrupo, i: ix })} /> : group.emoji}</div>
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
                    <span style={{ fontSize:14, color:C.muted, marginLeft:"auto" }}>{isExpanded?"▲":"▼"}</span>
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
                      {/* 📸 Fotos por color — varias fotos por cada color de la referencia */}
                      <div style={{ marginTop:14, paddingTop:10, borderTop:"1px dashed "+C.border }}>
                        <div style={{ fontSize:10.5, fontWeight:900, color:C.muted, textTransform:"uppercase", marginBottom:8 }}>📸 Fotos por color</div>
                        {[...new Set(group.variants.map(v => v.color || "—"))].map(color => {
                          const vs = group.variants.filter(v => (v.color || "—") === color);
                          const seed = vs.map(v => v.image).find(im => imgsDe(im).length) || "";
                          const fotos = imgsDe(seed);
                          return (
                            <div key={color} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid "+C.border+"60", flexWrap:"wrap" }}>
                              <div style={{ display:"flex", gap:6, alignItems:"center", minWidth:100 }}>
                                <div className="color-dot" style={{ width:13, height:13, background:getColorCSS(color) }} />
                                <span style={{ fontSize:12, fontWeight:800 }}>{color}</span>
                              </div>
                              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flex:1, minWidth:0 }}>
                                {fotos.map((u, i) => (
                                  <div key={u + i} style={{ position:"relative", width:60, height:60 }}>
                                    <img src={u} alt="" onClick={e => { e.stopPropagation(); setVisor({ fotos, i }); }} title="Ver foto completa" style={{ width:60, height:60, borderRadius:13, objectFit:"cover", border:"1.5px solid #EAECF5", cursor:"zoom-in" }} />
                                    <button
                                      onClick={e => { e.stopPropagation(); quitarFoto(vs, u); }}
                                      title="Quitar esta foto"
                                      style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:C.red, color:"white", border:"none", fontSize:10, fontWeight:900, cursor:"pointer", lineHeight:1, padding:0 }}
                                    >✕</button>
                                  </div>
                                ))}
                                <button
                                  onClick={e => { e.stopPropagation(); setPhotoTarget({ ids: vs.map(v => v.id) }); if (fileRef.current) fileRef.current.click(); }}
                                  title={`Agregar fotos al color ${color} (puedes elegir varias)`}
                                  disabled={uploading}
                                  style={{ width:60, height:60, borderRadius:13, border:"1.5px dashed "+C.border, background:C.bg, cursor:"pointer", fontSize:22, color:C.muted, fontFamily:"inherit", fontWeight:900, lineHeight:1 }}
                                >{uploading ? "⏳" : "＋"}</button>
                              </div>
                              <span style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{fotos.length} foto{fotos.length === 1 ? "" : "s"}</span>
                            </div>
                          );
                        })}
                      </div>
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
                  {imgsDe(p.image).length
                    ? <CarruselFotos fotos={imgsDe(p.image)} w={54} h={54} onAbrir={ix => setVisor({ fotos: imgsDe(p.image), i: ix })} style={{ borderRadius:13, border:"1.5px solid #EAECF5" }} />
                    : <div className="color-dot" style={{ width:34,height:34, background:getColorCSS(p.color), flexShrink:0 }} />}
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
                      <td style={td}>{imgsDe(p.image).length ? <CarruselFotos fotos={imgsDe(p.image)} w={46} h={46} onAbrir={ix => setVisor({ fotos: imgsDe(p.image), i: ix })} style={{ borderRadius:11 }} /> : <span style={{ fontSize:24 }}>{p.emoji}</span>}</td>
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
      {editGroup && <EditReferenceModal group={editGroup} workspaceId={workspaceId} showToast={showToast} onClose={() => setEditGroup(null)} onSave={saveEdit} />}
      {/* 📤 Compartir catálogo (link público para WhatsApp) */}
      {shareOpen && <ShareModal workspaceId={workspaceId} sizes={sizes} onClose={() => setShareOpen(false)} showToast={showToast} />}
      {/* 🏷️ Etiquetas imprimibles con código de barras */}
      {labelsOpen && <LabelsModal products={products} onClose={() => setLabelsOpen(false)} showToast={showToast} />}
      {/* 🔍 Visor de fotos a pantalla completa */}
      {visor && <VisorFotos fotos={visor.fotos} inicio={visor.i} onClose={() => setVisor(null)} />}
    </div>
  );
}

// ── SALES ─────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, products, customers, setProducts, totalSales, isMobile, showToast }) {
  const [rango, setRango] = useState({ id:"todo" });
  const [edit, setEdit] = useState(null); // ✏️ venta abierta para corregir
  const ventasR = sales.filter(s => enRango(s.date, rango));
  const totalR = ventasR.reduce((a,s)=>a+s.total,0);
  const byMethod = ventasR.reduce((acc,s)=>{acc[s.method]=(acc[s.method]||0)+s.total;return acc;},{});
  // 🧾 Cuántas referencias formaron la venta de la que viene cada renglón
  const porGrupo = {};
  ventasR.forEach(s => { const k = grupoVenta(s.id); porGrupo[k] = (porGrupo[k] || 0) + 1; });
  const clearSales = () => {
    if (!window.confirm(`🗑️ ¿Vaciar ventas?\n\nSe eliminarán PERMANENTEMENTE las ${sales.length} ventas registradas.\n\n✅ Todo el stock de esas ventas VUELVE al inventario.`)) return;
    if (!window.confirm("⚠️ Última confirmación: NO se puede deshacer.\n\n¿Borrar todas las ventas?")) return;
    aplicarDevolucion(setProducts, sales);
    setSales([]);
    showToast("🗑️ Ventas vaciadas · inventario devuelto");
  };
  // ✏️ Corregir una venta (referencia, color, talla, cantidad, precio, fecha…):
  //    al guardar, las unidades se mueven SOLOS de un producto a otro.
  const guardarEdicion = (nueva) => {
    const vieja = sales.find(x => String(x.id) === String(nueva.id));
    setSales(prev => prev.map(x => String(x.id) === String(nueva.id) ? nueva : x));
    aplicarCambioVenta(setProducts, vieja, nueva);
    setEdit(null);
    showToast("✏️ Venta actualizada");
  };
  // ⬇️ Descarga las ventas DEL RANGO elegido en Excel (.xlsx)
  function descargarVentas() {
    if (!ventasR.length) { showToast("📭 No hay ventas en este rango"); return; }
    cargarScriptXLSX(
      "⏳ Preparando tus ventas…",
      "❌ No se pudo cargar el generador de Excel — revisa tu conexión",
      () => {
        try {
          const cab = ["fecha","sku","producto","color","talla","cantidad","método","total"];
          const filas = ventasR.map(s => {
            const p = products.find(x => x.id === s.productId);
            return [s.date, p?.sku || "", p?.name || "Producto", p?.color || "", p?.size || "", s.qty, s.method, s.total];
          });
          const ws = XLSX.utils.aoa_to_sheet([cab, ...filas]);
          ws["!cols"] = cab.map((h, i) => {
            let m = String(h).length;
            for (const f of filas) { const l = String(f[i] == null ? "" : f[i]).length; if (l > m) m = l; }
            return { wch: Math.min(45, m + 2) };
          });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Ventas");
          XLSX.writeFile(wb, `ventas-stokly-${hoyISO()}.xlsx`);
          showToast(`✅ ${filas.length} ventas descargadas${rango.id !== "todo" ? " · " + rangoLabel(rango) : ""}`);
        } catch (e) { console.error("[stokly] export ventas:", e); showToast("❌ No se pudo descargar: " + (e && e.message)); }
      },
      (m) => { if (m && m.charAt(0) !== "⏳") showToast(m); }
    );
  }
  const colors = { Efectivo:[C.green,C.greenLight], Tarjeta:[C.blue,C.blueLight], Nequi:[C.purple,C.purpleLight], Transferencia:[C.orange,C.orangeLight], Daviplata:[C.red,C.redLight] };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
        <DateRangeFilter rango={rango} onChange={setRango} />
        <button onClick={descargarVentas} title="Descargar las ventas del rango en Excel (.xlsx)" style={{ background:"white", border:"1.5px solid #EAECF5", borderRadius:12, padding:"9px 13px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.text, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>⬇️ Descargar</button>
      </div>
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
        {/* 🧾 CADA venta/referencia en SU propio cuadro, con toda la info y su 🗑️ */}
        {[...ventasR].reverse().map(s=>{
          const p0=products.find(x=>String(x.id)===String(s.productId));
          const cli=(customers||[]).find(c=>String(c.id)===String(s.customerId));
          const nRef=porGrupo[grupoVenta(s.id)]||1;
          const mismaVenta=String(s.id).includes("::")&&nRef>1;
          const precioU=s.qty>0?Math.round((s.total||0)/s.qty):(s.total||0);
          const[mColor,mBg]=colors[s.method]||[C.muted,C.bg];
          const borrar=()=>{
            const linea=`${p0?.name||"Producto"}${p0?` · ${p0.color||"–"}/${p0.size||"–"}`:""}`;
            if(!window.confirm(`↩️ ¿Eliminar esta venta (devolución)?\n\n${linea}\n${s.qty} ud${s.qty===1?"":"s"} · ${fmt(s.total)} · ${s.date}\n\nSe borrará PERMANENTEMENTE.\n\n✅ Las ${s.qty} ud${s.qty===1?"":"s"} VUELVEN al inventario y las métricas se ajustan solas.`)) return;
            setSales(prev=>prev.filter(x=>String(x.id)!==String(s.id)));
            aplicarDevolucion(setProducts, [s]);
            showToast(`↩️ Devolución: ${s.qty} ud${s.qty===1?"":"s"} de vuelta al inventario`);
          };
          return (
            <div key={s.id} style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap", background:C.white, border:"1.5px solid "+C.border, borderRadius:16, padding:isMobile?12:14, marginBottom:10 }}>
              <div style={{ width:42,height:42, background:C.greenLight, borderRadius:13, display:"flex",alignItems:"center",justifyContent:"center",fontSize:21, flexShrink:0 }}>{p0?.emoji||"📦"}</div>
              <div style={{ flex:"1 1 170px", minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:isMobile?14:15 }}>{p0?.name||"Producto"}</div>
                <div style={{ fontSize:11.5, color:C.muted, fontWeight:700, marginTop:4, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                  {p0&&<span className="color-dot" style={{ width:10,height:10,background:getColorCSS(p0.color), flexShrink:0 }} />}
                  <span>{p0?.color||"—"} · {p0?.size?`Talla ${p0.size}`:"Talla —"}</span>
                  {p0?.sku&&<span>· SKU {p0.sku}</span>}
                </div>
                <div style={{ fontSize:11.5, color:C.muted, fontWeight:700, marginTop:4, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                  {cli&&<span className="pill" title={cli.phone?`📞 ${cli.phone}`:"Cliente"} style={{ background:C.blueLight, color:C.blue, fontSize:10.5, padding:"3px 9px" }}>👤 {cli.name}{cli.city?` · ${cli.city}`:""}</span>}
                  <span>📅 {s.date}</span>
                  <span>· {s.qty} ud{s.qty===1?"":"s"} × {fmt(precioU)}</span>
                  <span className="pill" style={{ background:mBg, color:mColor, fontSize:10.5, padding:"3px 9px" }}>{s.method}</span>
                  {mismaVenta&&<span className="pill" style={{ background:C.bg, color:C.muted, fontSize:10.5, padding:"3px 9px" }} title="Esta venta se registró junto con otras referencias">🔗 {nRef} refs</span>}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0, marginLeft:"auto" }}>
                <div style={{ fontWeight:900, fontSize:isMobile?17:19, color:C.green }}>{fmt(s.total)}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  <button title="Editar esta venta (referencia, color, talla, cantidad, precio, fecha…)" onClick={()=>setEdit(s)} style={{ background:C.blueLight, color:C.blue, border:"none", borderRadius:10, padding:isMobile?"6px 10px":"7px 12px", fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>✏️ Editar</button>
                  <button title="Eliminar esta venta (devolución)" onClick={borrar} style={{ background:C.redLight, color:C.red, border:"none", borderRadius:10, padding:isMobile?"6px 10px":"7px 12px", fontWeight:900, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>🗑️ Borrar</button>
                </div>
              </div>
            </div>
          );
        })}
        {ventasR.length===0 && <div style={{ textAlign:"center", padding:30, color:C.muted, fontWeight:700 }}>Sin ventas en este rango 📅</div>}
      </div>
      {/* ✏️ Corregir una venta ya registrada */}
      {edit && (
        <EditSaleModal
          venta={edit}
          products={products}
          customers={customers}
          setCustomers={setCustomers}
          onClose={() => setEdit(null)}
          onSave={guardarEdicion}
        />
      )}
    </div>
  );
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function Expenses({ expenses, setExpenses, totalExpenses, showToast, isMobile }) {
  const [rango, setRango] = useState({ id:"todo" });
  const gastosR = expenses.filter(e => solapaRango(e, rango));
  const totalR = gastosR.reduce((a,e)=>a+e.amount,0);
  const byCategory = gastosR.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{});
  // ⬇️ Descarga los gastos DEL RANGO elegido en Excel (.xlsx)
  function descargarGastos() {
    if (!gastosR.length) { showToast("📭 No hay gastos en este rango"); return; }
    cargarScriptXLSX(
      "⏳ Preparando tus gastos…",
      "❌ No se pudo cargar el generador de Excel — revisa tu conexión",
      () => {
        try {
          const cab = ["fecha","hasta","concepto","monto","categoría"];
          const filas = gastosR.map(e => [e.date, e.dateEnd || "", e.concept, e.amount, e.category]);
          const ws = XLSX.utils.aoa_to_sheet([cab, ...filas]);
          ws["!cols"] = cab.map((h, i) => {
            let m = String(h).length;
            for (const f of filas) { const l = String(f[i] == null ? "" : f[i]).length; if (l > m) m = l; }
            return { wch: Math.min(45, m + 2) };
          });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Gastos");
          XLSX.writeFile(wb, `gastos-stokly-${hoyISO()}.xlsx`);
          showToast(`✅ ${filas.length} gastos descargados${rango.id !== "todo" ? " · " + rangoLabel(rango) : ""}`);
        } catch (e) { console.error("[stokly] export gastos:", e); showToast("❌ No se pudo descargar: " + (e && e.message)); }
      },
      (m) => { if (m && m.charAt(0) !== "⏳") showToast(m); }
    );
  }
  const clearExpenses = () => {
    if (!window.confirm(`🗑️ ¿Vaciar gastos?\n\nSe eliminarán PERMANENTEMENTE los ${expenses.length} gastos.`)) return;
    if (!window.confirm("⚠️ Última confirmación: NO se puede deshacer.\n\n¿Borrar todos los gastos?")) return;
    setExpenses([]);
    showToast("🗑️ Gastos vaciados");
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
        <DateRangeFilter rango={rango} onChange={setRango} />
        <button onClick={descargarGastos} title="Descargar los gastos del rango en Excel (.xlsx)" style={{ background:"white", border:"1.5px solid #EAECF5", borderRadius:12, padding:"9px 13px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.text, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>⬇️ Descargar</button>
      </div>
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
// 📂 Cabecera plegable de las secciones de Métricas: con un clic en el título
//    se despliega o se encoge la lista, y siempre se ve cuántos artículos hay.
function CabeceraPlegable({ titulo, total, etqTotal, limite, abierto, onToggle, extra }) {
  const plegable = total > limite;
  return (
    <button type="button" onClick={plegable ? onToggle : undefined} aria-expanded={abierto}
      style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, width:"100%", background:"none", border:"none", padding:plegable?"6px 0":0, marginBottom:plegable?6:12, cursor:plegable?"pointer":"default", fontFamily:"inherit", textAlign:"left" }}>
      <span style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", minWidth:0 }}>
        <span className="section-title" style={{ marginBottom:0 }}>{titulo}</span>
        {typeof total === "number" && <span className="pill" style={{ background:C.bg, color:C.muted, fontSize:10.5, padding:"3px 10px" }}>{total} {etqTotal}</span>}
        {extra}
      </span>
      {plegable && (
        <span className="pill" style={{ background:abierto?C.greenLight:C.green, color:abierto?C.green:"#fff", flexShrink:0, fontSize:10.5, padding:"5px 11px" }}>
          {abierto ? "▲ encoger" : "▼ desplegar"}
        </span>
      )}
    </button>
  );
}

function Metrics({ products, sales, expenses, totalSales, profit, isMobile }) {
  const [rango, setRango] = useState({ id:"todo" });
  // 📂 Listas plegables: arrancan encogidas; un clic las despliega
  const [verRanking, setVerRanking] = useState(false);
  const [verTallas, setVerTallas]   = useState(false);
  const [verComprar, setVerComprar] = useState(false);
  const [verMarcas, setVerMarcas]   = useState(false);
  const N_RANK = 5, N_TALLAS = 6, N_COMPRAR = 4, N_MARCA = 5;
  const sF = sales.filter(s => enRango(s.date, rango));
  const eF = expenses.filter(e => solapaRango(e, rango));
  const totalSR = sF.reduce((a,s) => a + s.total, 0);
  const totalER = eF.reduce((a,e) => a + e.amount, 0);
  const profitR = totalSR - totalER;
  // unidades vendidas POR PRODUCTO dentro del rango elegido
  const porProducto = {};
  sF.forEach(s => { if (s.productId) porProducto[s.productId] = (porProducto[s.productId] || 0) + (s.qty || 0); });
  // 📌 Fuente de verdad = las VENTAS del rango (no el contador del producto).
  //    Así, si borras una venta por devolución, todas las métricas bajan solas.
  const vend = (p) => !p ? 0 : (porProducto[p.id] || 0);
  // 🏆 RANKING POR REFERENCIA (nombre + marca): SUMA todas sus tallas y colores
  //    y debajo deja discriminado cada variante con sus unidades
  //    (ej: "Conjunto Emily" → 12 uds → Rosado T-M 5 · Rosado T-L 4 · Negro T-M 3).
  //    Solo lo que SE HA VENDIDO; sale de las ventas, así que borra/corrige y baja.
  const dineroPorRef = {};
  sF.forEach(s => {
    const p = products.find(x => String(x.id) === String(s.productId));
    if (!p) return;
    const k = `${p.name}__${p.brand || ""}`;
    dineroPorRef[k] = (dineroPorRef[k] || 0) + (s.total || 0);
  });
  const porRef = {};
  products.forEach(p => {
    const k = `${p.name}__${p.brand || ""}`;
    const v = vend(p) || 0;
    if (!porRef[k]) porRef[k] = { key:k, name:p.name || "Producto", brand:p.brand || "", emoji:p.emoji || "📦", uds:0, detalle:[] };
    porRef[k].uds += v;
    if (v > 0) porRef[k].detalle.push({ id:String(p.id), label:`${p.color || "–"}${p.size ? ` · T${p.size}` : ""}`, color:p.color || "", uds:v });
  });
  const ranking = Object.values(porRef)
    .filter(r => r.uds > 0)
    .map(r => ({ ...r, money:dineroPorRef[r.key] || 0, detalle:[...r.detalle].sort((a,b) => b.uds - a.uds) }))
    .sort((a,b) => b.uds - a.uds || b.money - a.money || String(a.name).localeCompare(String(b.name)));
  // 🏷️ Marcas vendidas en el rango (unidades + dinero), calculado de las ventas
  const marcaUn = {}, marcaTot = {};
  sF.forEach(s => {
    const p = products.find(x => String(x.id) === String(s.productId));
    const b = (p && String(p.brand || "").trim()) || "Sin marca";
    marcaUn[b] = (marcaUn[b] || 0) + (s.qty || 0);
    marcaTot[b] = (marcaTot[b] || 0) + (s.total || 0);
  });
  const byBrand = Object.keys(marcaUn)
    .map(b => ({ brand:b, uds:marcaUn[b], total:marcaTot[b] }))
    .filter(x => x.uds > 0)
    .sort((a,b) => b.uds - a.uds || b.total - a.total);
  const totalMarcas = byBrand.reduce((a,m)=>a+m.uds,0);
  const maxMarca = byBrand[0]?.uds || 1;
  const byColor = products.reduce((acc,p)=>{const v=vend(p);if(!acc[p.color])acc[p.color]=0;acc[p.color]+=v;return acc;},{});
  // unidades vendidas por talla (según el rango elegido)
  const sizeMap = {};
  products.forEach(p => { const s = String(p.size ?? "").trim(); const v = vend(p); if (!s || !v) return; sizeMap[s] = (sizeMap[s] || 0) + v; });
  const bySize = Object.entries(sizeMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxSize = bySize[0]?.[1] || 1;
  const totalSizeSold = bySize.reduce((a, [, v]) => a + v, 0);
  const maxSold = ranking.length ? (ranking[0].uds || 1) : 1;
  const toBuy = products.filter(p=>p.stock<p.minStock*2).sort((a,b)=>vend(b)-vend(a));
  const margin = totalSR?pct(profitR,totalSR):0;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <DateRangeFilter rango={rango} onChange={setRango} />
      <div className="grid-4">
        {[
          {label:"Margen neto",   value:`${margin}%`,                                    color:margin>30?C.green:C.orange, bg:margin>30?C.greenLight:C.orangeLight},
          {label:"Ticket prom.", value:fmt(sF.length?Math.round(totalSR/sF.length):0), color:C.blue,   bg:C.blueLight},
          {label:"Más vendido",  value:ranking[0] ? ranking[0].name.split(" ").slice(0,2).join(" ") : "—", color:C.yellow, bg:C.yellowLight},
          {label:"Referencias",  value:products.length,                                  color:C.purple, bg:C.purpleLight},
        ].map(k=><div key={k.label} className="stat-card" style={{ background:k.bg }}><div style={{ fontSize:11,fontWeight:800,color:k.color,marginBottom:6,textTransform:"uppercase" }}>{k.label}</div><div style={{ fontSize:24,fontWeight:900,color:C.text }}>{k.value}</div></div>)}
      </div>
      <div className={isMobile?"":"desktop-2col"}>
        <div>
        <div className="card" style={{ padding:20, marginBottom:16 }}>
          <CabeceraPlegable titulo="🏆 Ranking de ventas" total={ranking.length} etqTotal="referencias" limite={N_RANK} abierto={verRanking} onToggle={()=>setVerRanking(v=>!v)}
            extra={byBrand.length>0 ? <span className="pill" title={`Marca más vendida en ${rango.id==="todo"?"todo":"este rango"}`} style={{ background:C.purpleLight, color:C.purple, fontSize:10.5, padding:"3px 10px" }}>🏷️ {byBrand[0].brand} · {byBrand[0].uds} uds</span> : null} />
          {ranking.length === 0 && (
            <div style={{ fontSize:13, color:C.muted, fontWeight:700, lineHeight:1.7 }}>
              Sin ventas en este rango 📅<br />
              <span style={{ fontWeight:600 }}>Cambia el rango de tiempo para ver quién lidera.</span>
            </div>
          )}
          {ranking.slice(0, verRanking ? ranking.length : N_RANK).map((r,i)=>(
            <div key={r.key} style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center",gap:8 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center",minWidth:0 }}>
                  <span style={{ fontSize:13,fontWeight:900,color:i===0?C.yellow:C.muted,minWidth:20 }}>#{i+1}</span>
                  <span style={{ fontWeight:800,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.name} <span style={{ color:C.muted,fontWeight:600 }}>/ {r.brand||"—"}</span></span>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontWeight:900,color:C.green,fontSize:13 }}>{r.uds} uds</div>
                  <div style={{ fontSize:11,fontWeight:800,color:C.muted }}>{fmt(r.money)}</div>
                </div>
              </div>
              {/* 🔎 Discriminado: cada color/talla de la referencia con SUS unidades */}
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:6 }}>
                {r.detalle.map(d=>(
                  <span key={d.id} className="pill" style={{ background:C.bg, color:C.text, fontSize:10.5, padding:"3px 9px", gap:5 }}>
                    <span className="color-dot" style={{ width:9,height:9,background:getColorCSS(d.color), flexShrink:0 }} />
                    {d.label} <b style={{ color:C.green }}>{d.uds}</b>
                  </span>
                ))}
              </div>
              <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((r.uds/maxSold)*100)}%`, background:i===0?"linear-gradient(90deg,#FFB800,#FF8C42)":"linear-gradient(90deg,#00C896,#4A90FF)" }} /></div>
            </div>
          ))}
          {ranking.length > N_RANK && (
            <button onClick={()=>setVerRanking(v=>!v)} style={{ width:"100%", marginTop:2, background:C.bg, border:"none", borderRadius:12, padding:"10px", fontWeight:900, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", color:C.text }}>
              {verRanking ? "▲ Encoger la lista" : `▼ Desplegar las ${ranking.length} referencias`}
            </button>
          )}
        </div>
        {/* 🏷️ MARCAS más vendidas (sale de las ventas, se borra con la devolución) */}
        <div className="card" style={{ padding:20, border:"2px solid "+C.purple+"40" }}>
          <CabeceraPlegable titulo="🏷️ Marcas más vendidas" total={byBrand.length} etqTotal="marcas" limite={N_MARCA} abierto={verMarcas} onToggle={()=>setVerMarcas(v=>!v)}
            extra={byBrand.length>0 ? <span className="pill" style={{ background:C.purpleLight, color:C.purple, fontSize:10.5, padding:"3px 10px" }}>{totalMarcas} uds</span> : null} />
          {byBrand.length === 0 && (
            <div style={{ fontSize:13, color:C.muted, fontWeight:700, lineHeight:1.7 }}>
              Sin ventas en este rango 📅<br />
              <span style={{ fontWeight:600 }}>Registra ventas y verás aquí qué marca lidera.</span>
            </div>
          )}
          {byBrand.slice(0, verMarcas ? byBrand.length : N_MARCA).map((m,i)=>(
            <div key={m.brand} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", minWidth:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:i===0?C.yellow:C.muted, minWidth:20 }}>#{i+1}</span>
                  <span style={{ fontWeight:800, fontSize:13.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.brand}</span>
                  {i===0 && <span className="pill" style={{ background:C.yellowLight, color:C.yellow, fontSize:10, padding:"3px 9px", flexShrink:0 }}>🏆 La más vendida</span>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontWeight:900, fontSize:13, color:i===0?C.green:C.purple }}>{m.uds} uds</div>
                  <div style={{ fontSize:11, fontWeight:800, color:C.muted }}>{fmt(m.total)}</div>
                </div>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((m.uds/maxMarca)*100)}%`, background:i===0?"linear-gradient(90deg,#FFB800,#FF8C42)":"linear-gradient(90deg,#8B5CF6,#4A90FF)" }} /></div>
            </div>
          ))}
          {byBrand.length > N_MARCA && (
            <button onClick={()=>setVerMarcas(v=>!v)} style={{ width:"100%", marginTop:2, background:C.bg, border:"none", borderRadius:12, padding:"10px", fontWeight:900, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", color:C.text }}>
              {verMarcas ? "▲ Encoger la lista" : `▼ Desplegar las ${byBrand.length} marcas`}
            </button>
          )}
        </div>
        </div>
        <div>
          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <div className="section-title">🎨 Colores preferidos</div>
            {Object.entries(byColor).filter(([,sold])=>sold>0).sort((a,b)=>b[1]-a[1]).map(([color,sold])=>(
              <div key={color} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center" }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <div className="color-dot" style={{ width:16,height:16,background:getColorCSS(color) }} />
                    <span style={{ fontWeight:800,fontSize:14 }}>{color}</span>
                  </div>
                  <span style={{ fontWeight:900,color:C.purple }}>{sold} uds</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width:`${Math.round((sold/Math.max(1,...Object.values(byColor)))*100)}%`, background:"linear-gradient(90deg,#F472B6,#8B5CF6)" }} /></div>
              </div>
            ))}
            {Object.entries(byColor).filter(([,sold])=>sold>0).length === 0 && (
              <div style={{ fontSize:13, color:C.muted, fontWeight:700, lineHeight:1.7 }}>Sin ventas en este rango 📅</div>
            )}
          </div>
          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <CabeceraPlegable titulo="📏 Tallas más vendidas" total={bySize.length} etqTotal="tallas" limite={N_TALLAS} abierto={verTallas} onToggle={()=>setVerTallas(v=>!v)}
              extra={bySize.length > 0 ? <span className="pill" style={{ background:C.tealLight, color:C.teal }}>{totalSizeSold} uds</span> : null} />
            {bySize.length === 0 && (
              <div style={{ fontSize:13, color:C.muted, fontWeight:700, lineHeight:1.7, marginTop:6 }}>
                Aún no hay ventas por talla.<br />
                <span style={{ fontWeight:600 }}>Registra ventas y verás aquí qué tallas se van primero.</span>
              </div>
            )}
            {bySize.slice(0, verTallas ? bySize.length : N_TALLAS).map(([size, sold], i) => (
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
            {bySize.length > N_TALLAS && (
              <button onClick={()=>setVerTallas(v=>!v)} style={{ width:"100%", marginTop:2, background:C.bg, border:"none", borderRadius:12, padding:"10px", fontWeight:900, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", color:C.text }}>
                {verTallas ? "▲ Encoger la lista" : `▼ Desplegar las ${bySize.length} tallas`}
              </button>
            )}
          </div>
          {toBuy.length>0 && (
            <div className="card" style={{ padding:20, border:"2px solid "+C.yellow+"50" }}>
              <CabeceraPlegable titulo="🛒 Qué deberías comprar" total={toBuy.length} etqTotal="productos" limite={N_COMPRAR} abierto={verComprar} onToggle={()=>setVerComprar(v=>!v)} />
              {toBuy.slice(0, verComprar ? toBuy.length : N_COMPRAR).map(p=>{const qty=Math.max(p.minStock*3,10);return(
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
              {toBuy.length > N_COMPRAR && (
                <button onClick={()=>setVerComprar(v=>!v)} style={{ width:"100%", marginTop:2, background:"#fff", border:"none", borderRadius:12, padding:"10px", fontWeight:900, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", color:C.text }}>
                  {verComprar ? "▲ Encoger la lista" : `▼ Desplegar los ${toBuy.length} productos`}
                </button>
              )}
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

// ── 🔎 Selector con buscador (categorías) ───────────────────────────
// Panel con lista desplazable, campo de búsqueda en vivo (sin distinguir
// mayúsculas de minúsculas) y opción de crear una nueva en el momento.
function SelectorBuscador({ titulo, opciones, valor, onElegir, placeholder, etiquetaCrear, tituloCrear, onCrear, deshabilitado, buscarEn, phBusqueda }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [msg, setMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  const elegida = opciones.find(o => String(o.id) === String(valor));
  // 🔍 Escribe como quieras: "basica" encuentra "Básica" (sin importar acentos ni MAYÚSCULAS).
  // `buscarEn` permite buscar también por SKU, código, color, talla… (los productos).
  const plano = s => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const texto = plano(q.trim());
  const filtradas = texto ? opciones.filter(o => plano(buscarEn ? buscarEn(o) : o.name).includes(texto)) : opciones;

  const cerrar = () => { setAbierto(false); setQ(""); setCreando(false); setNuevo(""); setMsg(""); };

  const crear = async () => {
    if (guardando) return;
    setGuardando(true);
    setMsg("");
    const r = await onCrear(nuevo);
    setGuardando(false);
    if (!r || !r.ok) { setMsg("⚠️ " + ((r && r.error) || "No se pudo crear")); return; }
    onElegir(r.id);
    cerrar();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!deshabilitado) setAbierto(true); }}
        disabled={deshabilitado}
        className="stk-input"
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, textAlign:"left", width:"100%", cursor:deshabilitado ? "not-allowed" : "pointer", opacity:deshabilitado ? .6 : 1 }}
      >
        <span style={{ color:elegida ? C.text : C.muted, fontWeight:elegida ? 800 : 600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {elegida ? elegida.name : placeholder}
        </span>
        <span style={{ color:C.muted, fontWeight:900, flexShrink:0 }}>▼</span>
      </button>

      {abierto && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && cerrar()} style={{ zIndex:320 }}>
          <div className="sheet">
            <div className="handle" />
            <div style={{ fontWeight:900, fontSize:18, marginBottom:10 }}>{titulo}</div>
            <input
              className="stk-input"
              autoFocus
              placeholder={phBusqueda || "🔍 Buscar…"}
              value={q}
              onChange={e => { setQ(e.target.value); setMsg(""); }}
            />
            <div style={{ maxHeight:"44vh", overflowY:"auto", WebkitOverflowScrolling:"touch", margin:"10px 0 0" }}>
              {filtradas.map(o => {
                const sel = String(o.id) === String(valor);
                return (
                  <button
                    key={o.id}
                    onClick={() => { onElegir(o.id); cerrar(); }}
                    style={{ display:"flex", width:"100%", alignItems:"center", justifyContent:"space-between", gap:8, background:sel ? C.greenLight : C.bg, border:`1.5px solid ${sel ? C.green : C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:7, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:14, color:C.text, textAlign:"left" }}
                  >
                    <span>{o.name}</span>
                    {sel && <span style={{ color:C.green, fontWeight:900, flexShrink:0 }}>✓</span>}
                  </button>
                );
              })}
              {!filtradas.length && (
                <div style={{ color:C.muted, fontWeight:700, fontSize:13, padding:"8px 2px", lineHeight:1.5 }}>
                  😕 Nada coincide con «{q}»
                  {etiquetaCrear && <><br />
                    <span style={{ fontSize:11.5 }}>Puedes crearla aquí abajo 👇</span></>}
                </div>
              )}
            </div>

            {etiquetaCrear && (creando ? (
              <div style={{ marginTop:10, background:C.blueLight, borderRadius:14, padding:"12px 14px" }}>
                <div style={{ fontSize:11, fontWeight:900, color:C.blue, textTransform:"uppercase", marginBottom:6 }}>{tituloCrear}</div>
                <input
                  className="stk-input"
                  autoFocus
                  placeholder="Nombre…"
                  value={nuevo}
                  onChange={e => { setNuevo(e.target.value); setMsg(""); }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); crear(); } }}
                />
                {msg && <div style={{ fontSize:12, fontWeight:800, color:C.red, marginTop:6, lineHeight:1.4 }}>{msg}</div>}
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button type="button" className="btn-outline" onClick={() => { setCreando(false); setNuevo(""); setMsg(""); }} style={{ flex:1 }}>Cancelar</button>
                  <button type="button" className="btn-main" onClick={crear} style={{ flex:1, opacity:guardando ? .7 : 1 }}>{guardando ? "⏳ Guardando…" : "Crear categoría"}</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setCreando(true); setMsg(""); }}
                style={{ width:"100%", marginTop:4, background:"transparent", border:`1.5px dashed ${C.green}`, color:C.green, borderRadius:12, padding:"12px 14px", fontWeight:900, fontSize:13.5, cursor:"pointer", fontFamily:"inherit" }}
              >
                {etiquetaCrear}
              </button>
            ))}

            <div style={{ marginTop:12 }}>
              <button type="button" className="btn-outline" onClick={cerrar} style={{ width:"100%" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Modal para editar una referencia: cambia datos base y agrega/quita tallas y colores
function EditReferenceModal({ group, onClose, onSave, workspaceId, showToast }) {
  const [rf, setRf] = useState({ name: group.name, brand: group.brand || "", category: group.category || "Otro" });
  const [vars, setVars] = useState(() => group.variants.map(v => ({ ...v })));
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fotoColor, setFotoColor] = useState(null); // color al que se le agregan fotos
  const [visor, setVisor] = useState(null);         // 🔍 fotos a pantalla completa {fotos:[], i}
  const photoRef = useRef(null);

  // 📂 Categorías del panel
  const cats = useCategorias(workspaceId);
  const [catId, setCatId] = useState(group.categoryId ? String(group.categoryId) : "");
  const nombreCat = (cats.categorias.find(c => String(c.id) === String(catId)) || {}).name || "";

  // Referencias antiguas: si solo tienen el texto de categoría, la emparejamos
  // con la categoría real para que no se pierda nada al editar.
  useEffect(() => {
    if (catId || !cats.categorias.length) return;
    const t = String(group.category || "").trim().toLowerCase();
    const c = cats.categorias.find(x => String(x.name).toLowerCase() === t)
      || cats.categorias.find(x => ["otro", "otros"].includes(t) && String(x.name).toLowerCase() === "otros");
    if (c) { setCatId(String(c.id)); setRf(p => ({ ...p, category: c.name })); }
  }, [cats.categorias, catId, group.category]);

  // Al cambiar la categoría se limpia el error
  const elegirCat = (id) => {
    setCatId(id);
    setErr("");
    const c = cats.categorias.find(x => String(x.id) === String(id));
    if (c) setRf(p => ({ ...p, category: c.name }));
  };

  // 📸 Agrega varias fotos al color elegido (en todas sus variantes)
  async function pickColorPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !fotoColor) return;
    setUploading(true);
    try {
      // Cada foto se sube POR SEPARADO: si una falla, las demás sí se quedan.
      const nuevas = [], fallas = [];
      for (const f of files) {
        try { nuevas.push(await subirFotoProducto(f, workspaceId)); }
        catch (err2) { console.error("[stokly] foto ref:", err2 && err2.message); fallas.push(err2); }
      }
      if (nuevas.length) {
        setVars(vs => vs.map(v => ((v.color || "—") === fotoColor ? { ...v, image: juntarImgs([...imgsDe(v.image), ...nuevas]) } : v)));
      }
      if (!showToast) return;
      if (!fallas.length) showToast(`📷 ${nuevas.length} foto${nuevas.length > 1 ? "s" : ""} agregada${nuevas.length > 1 ? "s" : ""}`);
      else if (nuevas.length) showToast(`📷 ${nuevas.length} ok · ❌ ${fallas.length}: ${textoErrorFoto(fallas[fallas.length - 1])}`);
      else showToast("❌ " + textoErrorFoto(fallas[0]));
    } catch (err2) {
      console.error("[stokly] foto ref:", err2 && err2.message);
      if (showToast) showToast("❌ " + textoErrorFoto(err2));
    } finally {
      setUploading(false);
    }
  }

  const updVar = (i, key, val) => setVars(vs => vs.map((v, j) => (j === i ? { ...v, [key]: val } : v)));
  const addVar = () => setVars(vs => [...vs, {
    id: newId(), name: group.name, sku: "", barcode: "", brand: rf.brand, color: "", size: "",
    category: rf.category, stock: 0, minStock: 5, price: group.price || 0, cost: group.cost || 0,
    sold: 0, emoji: catEmoji[rf.category] || "📦", image: group.image || "",
  }]);
  const dropVar = (i) => setVars(vs => vs.filter((_, j) => j !== i));

  function save() {
    if (!rf.name.trim()) { setErr("El nombre de la referencia es obligatorio"); return; }
    if (!vars.length) { setErr("Debe quedar al menos una variante"); return; }
    if (vars.some(v => v.stock === "" || v.stock == null || isNaN(+v.stock))) { setErr("Revisa el stock: debe ser un número en todas las variantes"); return; }
    if (!catId && !cats.error) { setErr("Elige la categoría"); return; }
    setErr("");
    // Los números se convierten AL GUARDAR (no mientras se escribe), para poder
    // escribir "85.000" = 85 mil pesos en precio, costo y stock.
    const varsNum = vars.map(v => ({ ...v,
      stock: numEntero(v.stock), minStock: numEntero(v.minStock),
      price: numDinero(v.price), cost: numDinero(v.cost),
    }));
    onSave({
      refFields: {
        ...rf,
        category: nombreCat || rf.category,
        categoryId: catId,
      },
      vars: varsNum,
    });
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
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:4 }}>Categoría *</div>
            <SelectorBuscador
              titulo="Seleccionar categoría"
              opciones={cats.categorias}
              valor={catId}
              onElegir={elegirCat}
              placeholder={cats.cargando ? "⏳ Cargando…" : "Seleccionar categoría ▼"}
              etiquetaCrear="+ Crear nueva categoría"
              tituloCrear="Nueva categoría"
              onCrear={cats.crearCategoria}
            />
            {cats.error && <div style={{ fontSize:11.5, fontWeight:800, color:C.red, marginTop:6, lineHeight:1.4 }}>⚠️ {cats.error}</div>}
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
                    { k:"sku",     ph:"SKU (opcional)", v:v.sku },
                    { k:"barcode", ph:"Código de barras", v:v.barcode },
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
                        onChange={e => updVar(i, fd.k, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 📸 Fotos por color de la referencia (varias por color) */}
        <div style={{ background:C.greenLight, borderRadius:12, padding:"8px 12px", fontSize:11.5, fontWeight:700, color:C.text, marginTop:-6, marginBottom:14, lineHeight:1.5 }}>
          🏷️ El <b>SKU es opcional</b>: si lo dejas vacío, Stokly le crea el código a esa variante y así tiene su etiqueta con nombre, color y talla.
        </div>
        <div style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase", margin:"2px 0 8px" }}>📸 Fotos por color</div>
        <input ref={photoRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={pickColorPhotos} />
        {[...new Set(vars.map(v => v.color || "—"))].map(color => {
          const deColor = vars.filter(v => (v.color || "—") === color);
          const seed = deColor.map(v => v.image).find(im => imgsDe(im).length) || "";
          const fotos = imgsDe(seed);
          return (
            <div key={color} style={{ display:"flex", gap:8, alignItems:"center", background:C.bg, borderRadius:12, padding:"8px 10px", marginBottom:8, flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", minWidth:92 }}>
                <div className="color-dot" style={{ width:13, height:13, background:getColorCSS(color) }} />
                <span style={{ fontSize:12.5, fontWeight:800 }}>{color}</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flex:1, minWidth:0 }}>
                {fotos.map((u, ix) => (
                  <div key={u} style={{ position:"relative", width:58, height:58 }}>
                    <img src={u} alt="" onClick={() => setVisor({ fotos, i: ix })} title="Ver foto completa" style={{ width:58, height:58, borderRadius:13, objectFit:"cover", border:"1.5px solid #EAECF5", cursor:"zoom-in" }} />
                    <button
                      onClick={() => setVars(vs => vs.map(v => ((v.color || "—") === color ? { ...v, image: juntarImgs(imgsDe(v.image).filter(x => x !== u)) } : v)))}
                      title="Quitar foto"
                      style={{ position:"absolute", top:-6, right:-6, width:17, height:17, borderRadius:"50%", background:C.red, color:"#fff", border:"none", fontSize:9, fontWeight:900, cursor:"pointer", padding:0 }}
                    >✕</button>
                  </div>
                ))}
                <button
                  className="filter-btn"
                  onClick={() => { setFotoColor(color); if (photoRef.current) photoRef.current.click(); }}
                  disabled={uploading}
                  style={{ padding:"6px 10px" }}
                >{uploading ? "⏳ Subiendo…" : "＋ Fotos"}</button>
              </div>
              <span style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{fotos.length} foto{fotos.length === 1 ? "" : "s"}</span>
            </div>
          );
        })}

        {err && <div style={{ marginBottom:12, background:C.redLight, color:C.red, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800 }}>⚠️ {err}</div>}
        {/* 🔍 Visor de fotos a pantalla completa */}
        {visor && <VisorFotos fotos={visor.fotos} inicio={visor.i} onClose={() => setVisor(null)} />}
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex:2 }}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ onClose, onSave, workspaceId, showToast }) {
  const [f, setF] = useState({ name:"",sku:"",brand:"",color:"",size:"",stock:"",minStock:"5",price:"",cost:"",barcode:"",category:"Ropa" });
  // 📂 Categorías del panel
  const cats = useCategorias(workspaceId);
  const [catId, setCatId] = useState("");
  const nombreCat = (cats.categorias.find(c => String(c.id) === String(catId)) || {}).name || "";
  const elegirCat = (id) => {
    setCatId(id);
    const c = cats.categorias.find(x => String(x.id) === String(id));
    if (c) setF(p => ({ ...p, category: c.name }));
  };
  const [visor, setVisor] = useState(null); // 🔍 foto a pantalla completa
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const photoRef = useRef(null);

  async function pickPhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { setImage(await subirFotoProducto(file, workspaceId)); }
    catch (err) { console.error("[stokly] foto:", err && err.message); if (showToast) showToast("❌ " + textoErrorFoto(err)); }
    finally { setUploading(false); }
  }

  function save() {
    if (uploading) { setErr("⏳ Espera a que termine de subir la foto"); return; }
    const miss = [];
    if (!f.name.trim()) miss.push("Nombre");
    if (f.stock === "" || f.stock == null) miss.push("Stock");
    // Si las categorías no pudieron cargar (sin conexión), no bloqueamos el guardado
    if (!cats.error && !catId) miss.push("Categoría");
    if (miss.length) { setErr("Faltan campos obligatorios: " + miss.join(", ")); return; }
    setErr("");
    const catFinal = nombreCat || f.category || "Otro";
    onSave({ ...f, id:newId(), category: catFinal, categoryId: catId, stock:numEntero(f.stock), minStock:numEntero(f.minStock), price:numDinero(f.price), cost:numDinero(f.cost), sold:0, emoji:catEmoji[catFinal]||"📦", image });
  }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>📦 Nuevo producto</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[{label:"Nombre *",key:"name",ph:"Camiseta Básica",full:true},{label:"SKU (opcional)",key:"sku",ph:"Déjalo vacío y Stokly lo crea"},{label:"Código de barras (opcional)",key:"barcode",ph:"Ej: 7501234567890"},{label:"Marca",key:"brand",ph:"Nike"},{label:"Color",key:"color",ph:"Blanco"},{label:"Talla",key:"size",ph:"M / 42"},{label:"Stock *",key:"stock",ph:"0",type:"number"},{label:"Stock mínimo",key:"minStock",ph:"5",type:"number"},{label:"Precio ($)",key:"price",ph:"0",type:"number"},{label:"Costo ($)",key:"cost",ph:"0",type:"number"}].map(field=>(
            <div key={field.key} style={{ gridColumn:field.full?"span 2":"span 1" }}>
              <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>{field.label}</div>
              <input className="stk-input" type={field.type||"text"} placeholder={field.ph} value={f[field.key]} onChange={e=>setF(p=>({...p,[field.key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ gridColumn:"span 2" }}>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Categoría *</div>
            <SelectorBuscador
              titulo="Seleccionar categoría"
              opciones={cats.categorias}
              valor={catId}
              onElegir={elegirCat}
              placeholder={cats.cargando ? "⏳ Cargando…" : "Seleccionar categoría ▼"}
              etiquetaCrear="+ Crear nueva categoría"
              tituloCrear="Nueva categoría"
              onCrear={cats.crearCategoria}
            />
            {cats.error && <div style={{ fontSize:11.5, fontWeight:800, color:C.red, marginTop:6, lineHeight:1.4 }}>⚠️ {cats.error}</div>}
          </div>
        </div>
        <div style={{ background:C.greenLight, borderRadius:12, padding:"9px 12px", fontSize:11.5, fontWeight:700, color:C.text, marginTop:-6, marginBottom:16, lineHeight:1.55 }}>
          🏷️ <b>SKU y código de barras son opcionales.</b> Si los dejas vacíos, Stokly le crea un código a la prenda y con él imprime su etiqueta (nombre · color · talla) para poder escanearla después.
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Foto del producto (opcional)</div>
          <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display:"none" }} />
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {image ? (
              <>
                <img src={image} alt="Vista previa" onClick={() => setVisor({ fotos:[image], i:0 })} title="Ver foto completa" style={{ width:76, height:76, borderRadius:16, objectFit:"cover", border:"2px solid #EAECF5", cursor:"zoom-in" }} />
                <button className="filter-btn" onClick={()=>photoRef.current&&photoRef.current.click()} disabled={uploading}>{uploading ? "⏳ Subiendo…" : "🔄 Cambiar"}</button>
                <button className="filter-btn" onClick={()=>setImage("")}>✕ Quitar</button>
              </>
            ) : (
              <button className="filter-btn" onClick={()=>photoRef.current&&photoRef.current.click()} disabled={uploading}>{uploading ? "⏳ Subiendo…" : "📷 Agregar foto"}</button>
            )}
          </div>
        </div>
        {err && <div style={{ marginBottom:12, background:C.redLight, color:C.red, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800 }}>⚠️ {err}</div>}
        {/* 🔍 Visor de foto a pantalla completa */}
        {visor && <VisorFotos fotos={visor.fotos} inicio={visor.i} onClose={() => setVisor(null)} />}
        <div style={{ display:"flex",gap:10 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} disabled={uploading} style={{ flex:2, opacity:uploading?0.6:1 }}>Guardar producto</button>
        </div>
      </div>
    </div>
  );
}

function AddSaleModal({ products, customers, setCustomers, sales, onClose, onSave }) {
  const [pid,setPid]=useState(""); const [qty,setQty]=useState(1); const [method,setMethod]=useState("Efectivo");
  const [scanOpen,setScanOpen]=useState(false); const [err,setErr]=useState("");
  // 👥 Cliente de esta venta: se elige uno existente o se agrega rápido aquí mismo
  const [cli,setCli]=useState("");
  const [nuevoCli,setNuevoCli]=useState(null);
  // 🛒 Varias referencias en UNA MISMA venta: se van agregando renglones aquí
  //    y al guardar se registran todos juntos (mismo día, mismo método).
  const [items,setItems]=useState([]);
  const p=products.find(x=>String(x.id)===String(pid));
  const renglones = items
    .map(it => ({ ...it, pr: products.find(x=>String(x.id)===String(it.pid)) }))
    .filter(r => r.pr);
  const total = renglones.reduce((a,r)=>a + r.pr.price*r.qty, 0);
  const unidades = renglones.reduce((a,r)=>a + r.qty, 0);
  // 🔍 Opciones del buscador: productos con stock (más los ya agregados y el elegido)
  //    con texto para encontrarlos por nombre, marca, talla, SKU o código de barras.
  const opcionesVenta = products
    .filter(pp => pp.stock > 0 || String(pp.id) === String(pid) || items.some(i => String(i.pid) === String(pp.id)))
    .map(pp => ({
      id: String(pp.id),
      name: `${pp.emoji || "📦"} ${pp.name} — ${pp.color || "–"}/T${pp.size || "–"} (${pp.stock} disp.) — ${fmt(pp.price)}`,
      txt: [pp.name, pp.brand, pp.sku, pp.barcode, pp.color, pp.size, pp.category].join(" "),
    }));
  // ➕ Agrega una referencia a la venta (botón ➕ o escáner 📷)
  function agregarProducto(prod, cantidad) {
    if(!prod){ setErr("⚠️ Busca el producto por su nombre, o escanea su etiqueta con 📷"); return; }
    if(cantidad<1){ setErr("⚠️ La cantidad debe ser al menos 1"); return; }
    if(prod.stock<cantidad){ setErr(`⚠️ Solo hay ${prod.stock} unidades disponibles de ${prod.name}`); return; }
    setItems(prev => {
      const i = prev.findIndex(x => String(x.pid) === String(prod.id));
      if(i >= 0){ const arr=[...prev]; arr[i]={...arr[i], qty: Math.min(prod.stock, arr[i].qty + cantidad)}; return arr; }
      return [...prev, { pid:String(prod.id), qty:+cantidad }];
    });
    setPid(""); setQty(1); setErr("");
  }
  const agregar = () => agregarProducto(p, qty);
  // ✕ / − + sobre los renglones ya agregados
  const quitar = (idQ) => setItems(prev => prev.filter(x => String(x.pid) !== String(idQ)));
  const cambiar = (idQ, d) => setItems(prev => prev.map(x => {
    if(String(x.pid) !== String(idQ)) return x;
    const st = products.find(y => String(y.id) === String(x.pid))?.stock || 1;
    return { ...x, qty: Math.max(1, Math.min(st, x.qty + d)) };
  }));
  // 👥 Clientes disponibles en el buscador + creación rápida (nombre, ciudad, celular)
  const opcionesCli = [
    // "Sin cliente" solo aparece cuando ya hay uno elegido (para poder quitarlo)
    ...(cli ? [{ id:"", name:"👤 Sin cliente (venta anónima)", txt:"" }] : []),
    ...(customers||[]).map(c => ({ id:String(c.id), name:`👤 ${c.name}${c.city?` · ${c.city}`:""}`, txt:[c.name,c.city,c.phone,c.email].join(" ") })),
  ];
  const cliElegido = (customers||[]).find(c => String(c.id) === String(cli));
  const comprasCli = cli ? (sales||[]).filter(s => String(s.customerId) === String(cli)) : [];
  const gastadoCli = comprasCli.reduce((a,s)=>a+(s.total||0),0);
  const guardarCliente = () => {
    const n = String((nuevoCli && nuevoCli.name) || "").trim();
    if(!n){ setErr("⚠️ Escribe el nombre del cliente"); return; }
    const c = { id:newId(), name:n, city:String(nuevoCli.city||"").trim(), phone:String(nuevoCli.phone||"").trim(), email:"", notes:"", createdAt:hoyISO() };
    setCustomers(prev=>[...prev, c]);
    setCli(c.id); setNuevoCli(null); setErr("");
  };
  function save() {
    if(!renglones.length){ setErr("⚠️ Agrega al menos una referencia con el botón ➕"); return; }
    const mal = renglones.find(r => (r.pr.stock || 0) < r.qty);
    if(mal){ setErr(`⚠️ Solo hay ${mal.pr.stock} unidades disponibles de ${mal.pr.name}`); return; }
    setErr("");
    // Todo lo de esta venta comparte el mismo prefijo de id: así en el historial
    // se ven juntos y se borran juntos. Con 1 sola referencia se guarda como antes.
    const g = renglones.length > 1 ? `${newId()}::` : "";
    onSave(renglones.map((r,i)=>({
      id: g ? `${g}${i+1}` : newId(),
      productId:String(r.pid),
      qty:+r.qty,
      total:r.pr.price*r.qty,
      date:hoyISO(),
      method,
      customerId: cli || null,
    })));
  }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900,fontSize:20,marginBottom:20 }}>💰 Registrar venta</div>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {/* 👥 Cliente de la venta: se elige uno existente o se agrega aquí mismo */}
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>👤 Cliente (opcional)</div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <SelectorBuscador
                  titulo="Cliente"
                  phBusqueda="🔍 Buscar por nombre, ciudad o celular"
                  placeholder="👤 Elegir cliente ▼"
                  opciones={opcionesCli}
                  valor={cli}
                  onElegir={id => { setCli(id); setErr(""); }}
                  buscarEn={o => o.txt}
                />
              </div>
              <button className="filter-btn" onClick={()=>setNuevoCli(nuevoCli?null:{name:"",city:"",phone:""})} title="Agregar un cliente nuevo" style={{ padding:"0 14px", flexShrink:0 }}>➕</button>
            </div>
            {cliElegido && (
              <div style={{ marginTop:8, background:C.blueLight, borderRadius:14, padding:"10px 12px", fontSize:12.5, fontWeight:800, color:C.blue }}>
                👤 {cliElegido.name}{cliElegido.city?` · ${cliElegido.city}`:""}{cliElegido.phone?` · 📞 ${cliElegido.phone}`:""}
                <div style={{ color:C.muted, fontWeight:700, marginTop:3 }}>{comprasCli.length} compra{comprasCli.length===1?"":"s"} · {fmt(gastadoCli)} gastados</div>
              </div>
            )}
            {nuevoCli && (
              <div style={{ marginTop:8, background:C.bg, border:"1.5px solid "+C.border, borderRadius:14, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase" }}>Nuevo cliente</div>
                <input className="stk-input" placeholder="Nombre * (obligatorio)" value={nuevoCli.name} onChange={e=>setNuevoCli(f=>({...f,name:e.target.value}))} />
                <input className="stk-input" placeholder="Ciudad" value={nuevoCli.city} onChange={e=>setNuevoCli(f=>({...f,city:e.target.value}))} />
                <input className="stk-input" placeholder="Celular / WhatsApp" inputMode="tel" value={nuevoCli.phone} onChange={e=>setNuevoCli(f=>({...f,phone:e.target.value}))} />
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-outline" onClick={()=>setNuevoCli(null)} style={{ flex:1 }}>Cancelar</button>
                  <button className="btn-main" onClick={guardarCliente} style={{ flex:2 }}>Guardar cliente</button>
                </div>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:5,textTransform:"uppercase" }}>Producto</div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <SelectorBuscador
                  titulo="Elegir producto"
                  phBusqueda="🔍 Escribe el nombre (también: marca, talla, SKU…)"
                  placeholder="🔍 Buscar producto por nombre ▼"
                  opciones={opcionesVenta}
                  valor={pid}
                  onElegir={id => { setPid(id); setErr(""); }}
                  buscarEn={o => o.txt}
                />
              </div>
              <button className="filter-btn" onClick={()=>setScanOpen(true)} title="Escanear la etiqueta de la prenda con la cámara" style={{ padding:"0 14px", flexShrink:0 }}>📷</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Cantidad a agregar</div>
            <div style={{ display:"flex",gap:16,alignItems:"center",justifyContent:"center" }}>
              <button className="stock-btn" style={{ width:48,height:48,fontSize:24 }} onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
              <span style={{ fontSize:36,fontWeight:900,minWidth:50,textAlign:"center" }}>{qty}</span>
              <button className="stock-btn" style={{ width:48,height:48,fontSize:24 }} onClick={()=>setQty(q=>Math.min(p?.stock||99,q+1))}>+</button>
            </div>
            <button className="btn-main" onClick={agregar} style={{ width:"100%", marginTop:12, padding:"13px 14px", opacity:p?1:.55 }}>➕ Agregar a la venta</button>
          </div>
          {/* 🛒 Referencias ya agregadas a esta venta */}
          {renglones.length>0 && (
            <div>
              <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>🛒 En esta venta · {renglones.length} {renglones.length===1?"referencia":"referencias"} · {unidades} uds</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {renglones.map(r=>(
                  <div key={String(r.pid)} style={{ display:"flex", gap:8, alignItems:"center", background:C.bg, border:"1px solid "+C.border, borderRadius:14, padding:"9px 10px" }}>
                    <div style={{ width:34,height:34, background:C.greenLight, borderRadius:10, display:"flex",alignItems:"center",justifyContent:"center", fontSize:17, flexShrink:0 }}>{r.pr.emoji||"📦"}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.pr.name}</div>
                      <div style={{ fontSize:10.5, color:C.muted, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.pr.color||"–"} · T{r.pr.size||"–"} · {fmt(r.pr.price)} c/u</div>
                    </div>
                    <div style={{ display:"flex", gap:4, alignItems:"center", flexShrink:0 }}>
                      <button className="stock-btn" onClick={()=>cambiar(r.pid,-1)} title="Menos unidades">−</button>
                      <span style={{ fontWeight:900, minWidth:18, textAlign:"center", fontSize:14 }}>{r.qty}</span>
                      <button className="stock-btn" onClick={()=>cambiar(r.pid,1)} title="Más unidades">+</button>
                    </div>
                    <div style={{ fontWeight:900, fontSize:14, color:C.green, flexShrink:0, minWidth:70, textAlign:"right" }}>{fmt(r.pr.price*r.qty)}</div>
                    <button title="Quitar de la venta" onClick={()=>quitar(r.pid)} style={{ background:C.redLight,border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontWeight:800,fontSize:12,color:C.red,fontFamily:"inherit",flexShrink:0 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:C.muted,marginBottom:8,textTransform:"uppercase" }}>Método de pago</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["Efectivo","Tarjeta","Nequi","Transferencia","Daviplata"].map(m=><button key={m} className={`filter-btn ${method===m?"active":""}`} onClick={()=>setMethod(m)}>{m}</button>)}
            </div>
          </div>
          {renglones.length>0 &&<div style={{ background:C.greenLight,borderRadius:16,padding:"16px 20px",textAlign:"center" }}><div style={{ fontSize:13,color:C.muted,fontWeight:700 }}>Total a cobrar</div><div style={{ fontSize:36,fontWeight:900,color:C.green }}>{fmt(total)}</div></div>}
        </div>
        {err && <div style={{ background:C.redLight, color:C.red, borderRadius:12, padding:"10px 12px", fontSize:13, fontWeight:800 }}>{err}</div>}
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex:2 }}>{renglones.length>1 ? `Guardar venta · ${renglones.length} ref.` : "Confirmar venta"}</button>
        </div>
        {/* 📷 Escanear la etiqueta para agregar el producto al instante */}
        {scanOpen && (
          <ScanModal
            onClose={()=>setScanOpen(false)}
            onScan={(code) => {
              const f = buscarPorCodigo(products, code);
              if (f) {
                agregarProducto(f, qty);
                setScanOpen(false);
                return null;
              }
              return `El código "${code}" no está en tu inventario`;
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── ✏️ EDITAR una venta ya registrada ─────────────────────────────────────────
// Corrige la referencia (color/talla), cantidad, precio, fecha, método o cliente.
// Al guardar, las unidades se mueven SOLAS en el inventario (aplicarCambioVenta).
function EditSaleModal({ venta, products, customers, setCustomers, onClose, onSave }) {
  const original = products.find(x => String(x.id) === String(venta.productId));
  const [pid, setPid]     = useState(venta.productId == null ? "" : String(venta.productId));
  const [qty, setQty]     = useState(Math.max(1, Number(venta.qty) || 1));
  const [precio, setPrecio] = useState(String(venta.qty > 0 ? Math.round((venta.total || 0) / venta.qty) : (venta.total || 0)));
  const [fecha, setFecha] = useState(venta.date || hoyISO());
  const [method, setMethod] = useState(venta.method || "Efectivo");
  const [cli, setCli]     = useState(venta.customerId ? String(venta.customerId) : "");
  const [err, setErr]     = useState("");
  const p = products.find(x => String(x.id) === String(pid));
  const unit = Math.max(0, numDinero(precio));
  const total = unit * qty;
  const esMismo = !!(original && p && String(original.id) === String(p.id));
  const disponible = p ? (p.stock || 0) + (esMismo ? (venta.qty || 0) : 0) : 0;
  const cambioRef = !!(original && p && !esMismo);
  const opciones = products.map(pp => ({
    id: String(pp.id),
    name: `${pp.emoji || "📦"} ${pp.name} — ${pp.color || "–"}/${pp.size || "–"} (${pp.stock} disp.) — ${fmt(pp.price)}`,
    txt: [pp.name, pp.brand, pp.sku, pp.barcode, pp.color, pp.size, pp.category].join(" "),
  }));
  const opcionesCli = [
    ...(cli ? [{ id:"", name:"👤 Sin cliente (venta anónima)", txt:"" }] : []),
    ...(customers || []).map(c => ({ id:String(c.id), name:`👤 ${c.name}${c.city ? ` · ${c.city}` : ""}`, txt:[c.name,c.city,c.phone,c.email].join(" ") })),
  ];
  function guardar() {
    if (!p) { setErr("⚠️ Elige la referencia (color y talla) de la venta"); return; }
    if (qty < 1) { setErr("⚠️ La cantidad debe ser al menos 1"); return; }
    if (qty > disponible) { setErr(`⚠️ Solo hay ${disponible} unidades disponibles de ${p.name}`); return; }
    if (!fecha) { setErr("⚠️ Elige la fecha de la venta"); return; }
    setErr("");
    onSave({ ...venta, productId:String(p.id), qty, total, date:fecha, method, customerId: cli || null });
  }
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>✏️ Editar venta</div>
        <div style={{ fontSize:12.5, color:C.muted, fontWeight:700, marginBottom:18 }}>Corrige la referencia, color, talla, cantidad, precio o fecha</div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>👤 Cliente (opcional)</div>
            <SelectorBuscador titulo="Cliente" phBusqueda="🔍 Buscar por nombre, ciudad o celular" placeholder="👤 Elegir cliente ▼" opciones={opcionesCli} valor={cli} onElegir={id => { setCli(id); setErr(""); }} buscarEn={o => o.txt} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>🎽 Referencia · color · talla</div>
            <SelectorBuscador titulo="Referencia" phBusqueda="🔍 Escribe el nombre (también: marca, talla, SKU…)" placeholder="🔎 Buscar producto por nombre ▼" opciones={opciones} valor={pid} onElegir={id => { setPid(id); setErr(""); }} buscarEn={o => o.txt} />
            {original && (
              <div style={{ fontSize:11.5, color:C.muted, fontWeight:700, marginTop:6 }}>
                Estaba: {original.name} · {original.color || "–"}/T{original.size || "–"} · {original.stock} en stock
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:8, textTransform:"uppercase" }}>Cantidad</div>
            <div style={{ display:"flex", gap:16, alignItems:"center", justifyContent:"center" }}>
              <button className="stock-btn" style={{ width:48, height:48, fontSize:24 }} onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
              <span style={{ fontSize:36, fontWeight:900, minWidth:50, textAlign:"center" }}>{qty}</span>
              <button className="stock-btn" style={{ width:48, height:48, fontSize:24 }} onClick={() => setQty(q => Math.min(disponible || 99, q + 1))}>+</button>
            </div>
            <div style={{ fontSize:11.5, color:C.muted, fontWeight:700, textAlign:"center", marginTop:6 }}>Disponibles: {disponible}</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>Precio unitario ($)</div>
              <input className="stk-input" type="number" inputMode="numeric" value={precio} onChange={e => { setPrecio(e.target.value); setErr(""); }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5, textTransform:"uppercase" }}>Fecha</div>
              <input className="stk-input" type="date" value={fecha} onChange={e => { setFecha(e.target.value); setErr(""); }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:8, textTransform:"uppercase" }}>Método de pago</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Efectivo","Tarjeta","Nequi","Transferencia","Daviplata"].map(m => (
                <button key={m} className={`filter-btn ${method === m ? "active" : ""}`} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ background:C.greenLight, borderRadius:16, padding:"16px 20px", textAlign:"center" }}>
            <div style={{ fontSize:13, color:C.muted, fontWeight:700 }}>Total de esta venta</div>
            <div style={{ fontSize:36, fontWeight:900, color:C.green }}>{fmt(total)}</div>
            <div style={{ fontSize:11.5, color:C.muted, fontWeight:700 }}>{qty} ud{qty === 1 ? "" : "s"} × {fmt(unit)}</div>
          </div>
          {cambioRef && (
            <div style={{ background:C.blueLight, borderRadius:12, padding:"10px 12px", fontSize:12, fontWeight:800, color:C.blue, lineHeight:1.5 }}>
              🔄 Al guardar: {original.name} ({original.color || "–"}/T{original.size || "–"}) recupera {venta.qty} ud y {p.name} ({p.color || "–"}/T{p.size || "–"}) descuenta {qty}.
            </div>
          )}
        </div>
        {err && <div style={{ background:C.redLight, color:C.red, borderRadius:12, padding:"10px 12px", fontSize:13, fontWeight:800, marginTop:14 }}>{err}</div>}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn-main" onClick={guardar} style={{ flex:2 }}>Guardar cambios</button>
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
  // 📄 Plantilla: mismo orden que el formulario de "Nuevo producto".
  // OBLIGATORIOS = todo EXCEPTO sku, código de barras y stock mínimo.
  // En el archivo se marcan con un ASTERISCO ROJO (los opcionales van sin *).
  const ES_OBLIGATORIO = h => String(h).startsWith("*");
  const PLANTILLA_LEYENDA = "🔴 * EN ROJO = OBLIGATORIO · SIN * = OPCIONAL (sku, código de barras y stock mínimo)";
  const PLANTILLA_HEADERS = [
    "* nombre",
    "* categoría",
    "* stock actual",
    "* marca",
    "* color",
    "* talla",
    "* precio venta",
    "* costo",
    "* imagen (foto o enlace)",
    "sku (opcional)",
    "código de barras (opcional)",
    "stock mínimo (opcional)",
  ];
  const PLANTILLA_EJEMPLO = ["Camiseta Básica","Ropa","10","Nike","Blanco","M","185.000","80.500","camiseta.jpg","CAM-001","7501234567890","5"];
  // Hoja "Instrucciones" del Excel: qué es obligatorio y qué va en cada columna
  const PLANTILLA_INFO = [
    ["COLUMNA","* OBLIGATORIA","QUÉ PONER AHÍ"],
    ["* nombre","✅ SÍ","Como se ve en la tienda: Camiseta Básica"],
    ["* categoría","✅ SÍ","Ropa, Calzado, Bolsos y Carteras, Accesorios, Joyería y Bisutería, Belleza y Cuidado Personal u Otros. Si no existe en tu panel, Stokly la crea al importar."],
    ["* stock actual","✅ SÍ","Unidades que hay AHORA en la tienda: número entero (ej: 10). Al vender, Stokly le resta a esta columna."],
    ["* marca","✅ SÍ","Ej: Nike"],
    ["* color","✅ SÍ","Ej: Blanco"],
    ["* talla","✅ SÍ","Ej: M o 42"],
    ["* precio venta","✅ SÍ","85.000 = 85 mil pesos (también vale $85.000 o 85,000). Si quieres decimales: 199.99"],
    ["* costo","✅ SÍ","Lo que te costó: 80.500 (o 80.50). Si falta se toma 0."],
    ["* imagen (foto o enlace)","✅ SÍ","Escribe el nombre de la foto (camiseta.jpg) y adjúntala al importar, o pega un enlace https://… Varias fotos: sepáralas con ||"],
    ["sku (opcional)","No (opcional)","Tu código interno. Si lo dejas vacío, Stokly le crea uno a cada producto y con él sale su etiqueta."],
    ["código de barras (opcional)","No (opcional)","Ej: 7501234567890 (lo que trae la etiqueta del proveedor)."],
    ["stock mínimo (opcional)","No (opcional)","Es OPCIONAL: el nivel en el que quieres la alerta 🟠/🟡 (si lo dejas vacío vale 5). No es lo que hay en la tienda: eso va en «stock actual»."],
    ["","",""],
    ["RECUERDA","",'Los que van con * en ROJO son obligatorios: si falta alguno, la vista previa te lo avisa. Borra la leyenda y la fila de ejemplo antes de importar. Archivo .xlsx o CSV; en Google Sheets sube el CSV y compártelo como "Cualquier persona con el enlace" (Lector).'],
  ];
  // 📂 Categorías del panel (para asignarlas a lo importado)
  const cats = useCategorias(workspaceId);

  // Carga la librería XLSX solo si hace falta (compartida con "Descargar inventario")
  function cargarXLSX(msgCarga, msgFallo, cb) {
    cargarScriptXLSX(msgCarga, msgFallo, cb, setError);
  }

  //1) Plantilla REAL de Excel (.xlsx) con los obligatorios en ASTERISCO ROJO
  async function descargarExcel() {
    setError("⏳ Preparando plantilla de Excel…");
    // 1ª opción: ExcelJS → el asterisco de cada obligatorio sale pintado en ROJO
    try {
      if (await cargarScriptExcelJS()) { await plantillaExcelEstilo(); setError(""); return; }
    } catch (e) { console.error("[stokly] plantilla (exceljs):", e); }
    // Respaldo: SheetJS (mismo archivo, sin color) — nunca te quedas sin plantilla
    cargarXLSX(
      "⏳ Preparando plantilla de Excel…",
      "No se pudo cargar el generador de Excel. Revisa tu conexión o usa la plantilla CSV de abajo.",
      () => { try { plantillaExcelBasica(); setError(""); } catch (e) { setError("No se pudo generar la plantilla: " + e.message); } }
    );
  }

  // Con estilos: leyenda arriba + encabezados con * en rojo (los opcionales en gris)
  async function plantillaExcelEstilo() {
    const wb = new window.ExcelJS.Workbook();
    const ws = wb.addWorksheet("Inventario");
    const nCols = PLANTILLA_HEADERS.length;

    ws.mergeCells(1, 1, 1, nCols);
    const ley = ws.getCell(1, 1);
    ley.value = PLANTILLA_LEYENDA;
    ley.font = { bold: true, size: 12, color: { argb: "FF1F2A37" } };
    ley.alignment = { vertical: "middle" };
    ws.getRow(1).height = 26;

    PLANTILLA_HEADERS.forEach((h, i) => {
      const c = ws.getCell(2, i + 1);
      const ob = ES_OBLIGATORIO(h);
      c.value = h;
      c.font = { bold: true, color: { argb: ob ? "FFD93025" : "FF5F6368" } }; // rojo = obligatorio
      c.alignment = { vertical: "middle", wrapText: true };
      c.border = { bottom: { style: "medium", color: { argb: ob ? "FFD93025" : "FFD0D5DD" } } };
      const ancho = Math.max(String(h).length, String(PLANTILLA_EJEMPLO[i] || "").length) + 4;
      ws.getColumn(i + 1).width = Math.min(40, Math.max(12, ancho));
    });
    ws.getRow(2).height = 34;

    // Ejemplo como TEXTO: un código de barras guardado como número saldría en
    // notación científica (7.50123E+12) y dejaría de servir para escanear.
    PLANTILLA_EJEMPLO.forEach((v, i) => {
      ws.getCell(3, i + 1).value = String(v == null ? "" : v);
    });
    ws.getColumn(11).numFmt = "0"; // código de barras: siempre dígitos completos

    // Hoja 2: Instrucciones. Se escribe celda por celda (addRow no serializa
    // filas en este bundle de ExcelJS y la hoja saldría vacía).
    const ins = wb.addWorksheet("Instrucciones");
    PLANTILLA_INFO.forEach((fila, r) => {
      fila.forEach((val, c) => {
        const cel = ins.getCell(r + 1, c + 1);
        cel.value = String(val == null ? "" : val);
        cel.alignment = { vertical: "top", wrapText: true };
        if (r === 0) {
          cel.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00A884" } };
        }
      });
    });
    ins.getColumn(1).width = 26;
    ins.getColumn(2).width = 18;
    ins.getColumn(3).width = 110;

    const buffer = await wb.xlsx.writeBuffer();
    descargarBlob(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "plantilla-inventario-stokly.xlsx"
    );
  }

  // Respaldo sin colores (SheetJS) — columnas garantizadas en cualquier idioma de Excel
  function plantillaExcelBasica() {
    const ws = XLSX.utils.aoa_to_sheet([[PLANTILLA_LEYENDA], [], PLANTILLA_HEADERS, PLANTILLA_EJEMPLO]);
    ws["!cols"] = PLANTILLA_HEADERS.map((h, i) => ({ wch: Math.min(46, Math.max(String(h).length, String(PLANTILLA_EJEMPLO[i] || "").length) + 4) }));
    const info = XLSX.utils.aoa_to_sheet(PLANTILLA_INFO);
    info["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 110 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.utils.book_append_sheet(wb, info, "Instrucciones");
    XLSX.writeFile(wb, "plantilla-inventario-stokly.xlsx");
  }

  //2) Plantilla CSV con ";" (Excel español + Google Sheets la reconocen con columnas)
  //   Va la leyenda de la fila 1 (allí no se puede pintar en rojo, por eso el 🔴)
  function descargarCSV() {
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const filas = [[PLANTILLA_LEYENDA], [], PLANTILLA_HEADERS, PLANTILLA_EJEMPLO];
    const csv = "\uFEFF" + filas.map(r => r.map(esc).join(";")).join("\n") + "\n";
    descargarBlob(new Blob([csv], { type:"text/csv;charset=utf-8;" }), "plantilla-inventario-stokly.csv");
  }

  function processFile(file) {
    if(!file)return; setFileName(file.name); setError("");
    if(file.name.match(/\.xlsx?$/i)) {
      cargarXLSX("⏳ Cargando lector de Excel…", "No se pudo cargar el lector de Excel. Revisa tu conexión e inténtalo otra vez.", () => {
        const r=new FileReader();
        r.onload=e=>{try{const X=window.XLSX;if(!X){setError("El lector de Excel no cargó. Vuelve a intentarlo.");return;}const wb=X.read(e.target.result,{type:"array"});const csv=X.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);const p=parseCSV(csv);if(!p.length){setError("No se encontraron productos. Revisa que la fila de títulos tenga las columnas y que debajo haya filas con datos.");return;}setParsed(p);setStep("preview");}catch(err){setError("Error: "+err.message);}};
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
      if(!p.length){ setError("La hoja se abrió pero no tiene productos. Revisa que la fila de títulos tenga las columnas y que debajo haya filas con datos."); return; }
      setParsed(p); setStep("preview");
    }catch(err){ setError(err.message||"No se pudo conectar con Google Sheets."); }
    finally{ setLoadingSheet(false); }
  }

  // Sube las fotos adjuntadas (se emparejan por nombre de archivo) y arma los productos finales
  async function importar() {
    if (subiendo) return;
    const unicas = [];
    parsed.forEach(p => {
      imgsDe(p.image).forEach(v => {
        if (!v || normalizarFotoURL(v)) return;
        const base = v.split(/[\\/]/).pop().toLowerCase();
        if (fotos[base] && !unicas.includes(base)) unicas.push(base);
      });
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
      const ps = imgsDe(p.image);
      if (!ps.length) return p;
      const ok = [];
      ps.forEach(v => {
        const url = normalizarFotoURL(v);
        if (url) { ok.push(url); return; }
        const base = v.split(/[\\/]/).pop().toLowerCase();
        if (mapaURL[base]) { ok.push(mapaURL[base]); return; }
        sinFoto++;
      });
      return { ...p, image: ok.join("||") };
    });
    // Filas sin nombre o sin stock actual no son productos: no se importan (se avisa).
    const esInvalida = p => (p.faltan||[]).includes("nombre") || (p.faltan||[]).includes("stock actual");
    const omitidas = finalP.filter(esInvalida).length;
    const validos = finalP.filter(p => !esInvalida(p));
    let aviso = "";
    const rotasN = Object.keys(rotas).length;
    if (omitidas) aviso = `${omitidas} fila(s) ignoradas (sin nombre o sin stock actual)`;
    if (fallos) aviso += (aviso ? " · " : "") + `${fallos} foto(s) no se pudieron subir`;
    if (sinFoto) aviso += (aviso ? " · " : "") + `${sinFoto} sin foto (falta adjuntarla)`;
    if (rotasN) aviso += (aviso ? " · " : "") + `${rotasN} enlace(s) de imagen no cargan`;
    // 🏷️ Categoría: se asigna a cada producto importado y se crea en el
    // panel la que todavía no exista (igual que en "Nuevo producto").
    setSubiendo("🏷️ Asignando categorías…");
    const conCat = await asignarCategorias(validos);
    setSubiendo("");
    onImport(conCat, mode, aviso);
  }

  // Devuelve la lista con categoryId resuelto por nombre.
  // Si las categorías no cargaron (sin conexión) devuelve todo igual: nunca se
  // bloquea la importación por este paso.
  async function asignarCategorias(lista) {
    const nk = s => String(s || "").trim().toLowerCase();
    const base = lista.map(p0 => {
      const { faltan, ...p } = p0; // "faltan" solo sirve para la vista previa
      const c = String(p.category || "").trim() || "Otros";
      return { ...p, category: c, emoji: catEmoji[c] || p.emoji || "📦" };
    });
    if (!workspaceId) return base;
    for (let i = 0; i < 50 && cats.cargando; i++) await new Promise(r => setTimeout(r, 100));
    if (cats.error) return base;

    const catPor = new Map(cats.categorias.map(c => [nk(c.name), c]));
    const salida = [];
    for (const p of base) {
      let cat = catPor.get(nk(p.category)) || null;
      if (!cat) {
        const r = await cats.crearCategoria(p.category);
        if (r && r.ok) { cat = { id: r.id, name: p.category }; catPor.set(nk(p.category), cat); }
      }
      salida.push({ ...p, category: cat ? cat.name : p.category, categoryId: cat ? cat.id : "" });
    }
    return salida;
  }

  const conFoto = parsed.filter(p => imgsDe(p.image).length > 0).length;
  // Filas sin SKU/código → Stokly les crea uno solo y con él sale su etiqueta
  const sinCod = parsed.filter(p => !codLimpio(p.sku)).length;
  // Campos con asterisco rojo en la plantilla (obligatorios) que están vacíos
  const conFaltantes = parsed.filter(p => (p.faltan||[]).length > 0).length;
  const omitidas = parsed.filter(p => (p.faltan||[]).includes("nombre") || (p.faltan||[]).includes("stock actual")).length;
  const pendAdj = parsed.filter(p =>
    imgsDe(p.image).some(v => v && !normalizarFotoURL(v) && !fotos[v.split(/[\\/]/).pop().toLowerCase()])
  ).length;

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
              📄 <b>Plantilla oficial</b> — <b>todo es obligatorio menos sku, código de barras y stock mínimo</b>: los obligatorios van con <b style={{ color:C.red }}>* en ROJO</b> en los títulos de las columnas.<br/>
              <span style={{ color:C.muted, fontWeight:600 }}>En el Excel hay una hoja <b>Instrucciones</b> con qué va en cada columna · borra la leyenda de arriba y la fila de ejemplo antes de importar · usa punto para decimales (199.99) · <b style={{ color:C.text }}>si dejas el sku vacío</b>, Stokly le crea el código a cada producto para su etiqueta · en "imagen" escribe el nombre de la foto (camiseta.jpg) y adjúntala en el paso siguiente — o pega un enlace público (https://…) · para VARIAS fotos del mismo producto separa los enlaces con || · en el CSV el asterisco no se puede pintar, por eso trae la leyenda 🔴</span>
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
                <b style={{ color:C.text }}>Obligatorio (*):</b> nombre, categoría, stock actual, marca, color, talla, precio, costo e imagen.<br/>
                <b style={{ color:C.text }}>Opcional (sin *):</b> sku, código de barras y stock mínimo.<br/>
                💡 Toma la <b>plantilla</b> de arriba (CSV), súbela a Google Sheets y llénala.<br/>
                💡 Si dejas el <b>sku</b> vacío, Stokly le crea el código a cada producto para imprimir su etiqueta.
              </div>
            </div>
          )}

          {error&&<div style={{ background:C.redLight,borderRadius:12,padding:12,marginTop:12,fontSize:13,fontWeight:700,color:C.red,lineHeight:1.5 }}>{error}</div>}
          <button className="btn-outline" onClick={onClose} style={{ width:"100%",marginTop:16 }}>Cancelar</button>
        </>}
        {step==="preview"&&<>
          <div style={{ fontWeight:900,fontSize:20,marginBottom:4 }}>✅ Vista previa</div>
          <div style={{ fontSize:13,color:C.muted,fontWeight:600,marginBottom:16 }}>{fileName} · {parsed.length} filas · 📷 {conFoto} con foto{sinCod?` · 🏷️ ${sinCod} sin código (Stokly lo crea)`:""}{conFaltantes?` · 🔴 ${conFaltantes} con obligatorios sin llenar`:""}{omitidas?` · 🚫 ${omitidas} se omitirán (sin nombre/stock actual)`:""}{pendAdj?` · ⚠️ ${pendAdj} sin adjuntar`:""}</div>
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            {[{id:"merge",label:"➕ Agregar",desc:"No duplica productos"},{id:"replace",label:"🔄 Reemplazar",desc:"Borra el actual"}].map(m=>(
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
              En la columna <b>imagen</b> escribe el <b>nombre del archivo</b> de la foto (ej: <i>camiseta.jpg</i>) y aquí adjunta las fotos: Stokly las sube y las deja guardadas en cada producto. Si prefieres, pega un <b>enlace https://…</b> en esa columna (Google Drive también funciona). <b>Varias fotos:</b> separa los enlaces con <b>||</b>.
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
              const partesCelda=imgsDe(p.image);
              const url=partesCelda.length?normalizarFotoURL(partesCelda[0]):"";
              const nombreFoto=!url&&partesCelda.length?partesCelda[0].split(/[\\/]/).pop().toLowerCase():"";
              const adjunta=nombreFoto?!!fotos[nombreFoto]:false;
              return (
              <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border }}>
                {url ? (rotas[i]
                  ? <div style={{ width:38,height:38,borderRadius:9,background:C.redLight,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }} title="El enlace no carga">⚠️</div>
                  : <img src={url} alt="" onError={()=>setRotas(prev=>({...prev,[i]:true}))} style={{ width:38, height:38, borderRadius:9, objectFit:"cover", border:"1.5px solid #EAECF5", flexShrink:0 }} />)
                : nombreFoto
                  ? <div style={{ width:38,height:38,borderRadius:9,background:adjunta?C.greenLight:C.bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,border:adjunta?"1.5px solid "+C.green:"1.5px dashed "+C.border }} title={nombreFoto}>📷</div>
                  : <div className="color-dot" style={{ background:getColorCSS(p.color), flexShrink:0 }} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:13,color:p.name?C.text:C.red }}>{p.name || "(sin nombre)"}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{p.brand} · {p.color} · T{p.size}{p.sku?` · ${p.sku}`:" · 🏷️ Stokly creará el código"}</div>
                  <div style={{ fontSize:10.5,fontWeight:800,color:p.category?C.green:C.muted }}>
                    {p.category || "Sin categoría"}
                  </div>
                  {(p.faltan||[]).length>0 && (
                    <div style={{ fontSize:10.5,fontWeight:800,color:(p.faltan.includes("nombre")||p.faltan.includes("stock actual"))?C.red:C.orange }}>
                      {(p.faltan.includes("nombre")||p.faltan.includes("stock actual")) ? "🚫 Se omitirá — falta: " : "🔴 Falta: "}
                      {(p.faltan||[]).join(", ")}
                    </div>
                  )}
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
