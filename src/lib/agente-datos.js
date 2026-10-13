// ============================================================
// stokly · Datos en vivo para el agente de WhatsApp
//
// El agente de IA responde a tus clientes por WhatsApp. Para que no
// invente fotos ni tallas, stokly le manda SOLO lo que necesita,
// justo cuando un cliente escribe (y solo si el agente está activo):
//
//   cliente escribe "¿ tienen el conjunto en L? "
//     → stokly busca en Supabase las referencias parecidas
//     → le manda al agente nombre, tallas con stock y fotos
//     → el agente responde con lo que SÍ hay
//
// Así el agente consulta en el momento exacto y no gasta tokens
// manteniendo el catálogo entero en su memoria.
// ============================================================
import { eventoAgente } from "./canales.js";

const palabras = (texto) =>
  String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 3 && !["que","para","por","con","los","las","una","unos","unas","del","des","est","esta","este","como","tengo","hola","buenas","favor","pueden","puede","dime","gracias"].includes(p));

// Foto principal de una referencia (primer color con foto)
const fotoDe = (p) => {
  const imgs = String(p.image || "").split(",").map((s) => s.trim()).filter(Boolean);
  return imgs[0] || "";
};

// Catálogo filtrado por lo que escribió el cliente, listo para el agente.
export function catalogoParaElAgente(productos, texto, max = 6) {
  const claves = palabras(texto);
  const grupo = new Map();
  for (const p of productos || []) {
    const k = `${p.name}__${p.brand || ""}`;
    if (!grupo.has(k)) grupo.set(k, { nombre: p.name, marca: p.brand || "", categoria: p.category || "", foto: fotoDe(p), variantes: [] });
    grupo.get(k).variantes.push(p);
  }
  const todo = [...grupo.values()].map((g) => ({
    ...g,
    texto: `${g.nombre} ${g.marca} ${g.categoria}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    tallas: g.variantes.map((v) => ({ talla: v.size, color: v.color, stock: Number(v.stock) || 0, precio: Number(v.price) || 0, foto: fotoDe(v) })),
    totalStock: g.variantes.reduce((a, v) => a + (Number(v.stock) || 0), 0),
    precio: Number(g.variantes[0]?.price) || 0,
  }));

  const coinciden = claves.length
    ? todo.filter((g) => claves.some((c) => g.texto.includes(c)))
    : todo;
  const orden = coinciden.slice().sort((a, b) => {
    const prioridad = (g) => (g.totalStock > 0 ? 2 : 1); // primero lo que SÍ hay
    return prioridad(b) - prioridad(a) || b.totalStock - a.totalStock;
  });

  return {
    consulta: String(texto || "").slice(0, 300),
    productos: orden.slice(0, max).map((g) => ({
      nombre: g.nombre,
      marca: g.marca,
      categoria: g.categoria,
      precio: g.precio,
      disponible: g.totalStock > 0,
      stock_total: g.totalStock,
      variantes: g.tallas,
      foto_principal: g.foto,
    })),
    busqueda_realizada_en: new Date().toISOString(),
    nota: "Inventario en vivo de stokly. Responde solo con lo que aparece aquí; si un color/talla tiene stock 0, dilo claramente.",
  };
}

// Envia el recorte del catálogo al agente (solo WhatsApp y solo si está activo).
export async function avisarAlAgente(accountId, { telefono, productos, texto }) {
  const payload = catalogoParaElAgente(productos, texto);
  return eventoAgente(accountId, {
    to: telefono,
    type: "consulta_catalogo",
    description: "Cliente preguntó por un producto; stokly envía las tallas y fotos vigentes",
    payload: JSON.stringify(payload).slice(0, 4096),
  });
}
