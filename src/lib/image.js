import { supabase } from "./supabase.js";

// ══════════════════════════════════════════════════════════════
//  FOTOS DE PRODUCTO (Supabase Storage — bucket "product-images")
// ══════════════════════════════════════════════════════════════
export const PRODUCT_IMAGE_BUCKET = "product-images";

// Redimensiona en el navegador antes de subir (menos espacio, carga rápida)
export function resizeImage(file, max = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Archivo de imagen no válido"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; // JPEG no guarda transparencia
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("No se pudo procesar la imagen"));
          resolve(blob);
        }, "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Redimensiona el logo CON fondo transparente (PNG) — a diferencia de la
// foto de producto, el logo de un negocio casi siempre trae transparencia.
function resizeLogo(file, max = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el logo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Archivo de imagen no válido"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("No se pudo procesar el logo"));
          resolve(blob);
        }, "image/png");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Sube el LOGO del negocio a la carpeta del panel y devuelve la URL pública.
export async function uploadLogoImage(file, workspaceId) {
  if (!workspaceId) throw new Error("No hay panel activo");
  const blob = await resizeLogo(file);
  const path = `${workspaceId}/logo-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: "image/png", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Borra un archivo que ya no se usa (logo anterior). No falla la operación.
export async function borrarImagenPublica(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/object\/public\/product-images\/(.+)$/);
    if (!m) return;
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([decodeURIComponent(m[1])]);
  } catch (e) { /* nada que borrar */ }
}

// Sube la foto dentro de la carpeta del panel (workspace_id)
// y devuelve la URL pública. El RLS de Storage valida la carpeta.
export async function uploadProductImage(file, workspaceId) {
  if (!workspaceId) throw new Error("No hay panel activo");
  const blob = await prepararImagen(file);
  return subirBlob(blob, workspaceId);
}

function subirBlob(blob, workspaceId) {
  const path = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  return supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false })
    .then(({ error }) => {
      if (error) throw error;
      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    });
}

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

// 📱 HEIC/HEIF es el formato de iPhone y de muchas fotos que llegan por
//    WhatsApp: el navegador NO lo abre. Aquí se convierte a JPG. La librería
//    se descarga SOLO cuando hace falta (no pesa para el resto de usuarios).
async function convertirHEIC(file) {
  const mod = await import("heic2any");
  const heic2any = mod.default || mod;
  const salida = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  return Array.isArray(salida) ? salida[0] : salida;
}

// Redimensiona; si el navegador no puede con la foto, intenta otras vías
// antes de rendirse: menos tamaño (memoria) y conversión HEIC → JPG.
async function prepararImagen(file) {
  try { return await resizeImage(file); }
  catch (e) {
    const msg = String(e && e.message);
    // Se quedó sin memoria con una foto enorme: la reduce y reintenta.
    if (msg.includes("procesar")) return await resizeImage(file, 640, 0.62);
    // No la pudo abrir (¿HEIC/HEIF?): la convierte a JPG y vuelve a intentar.
    let jpg = null;
    try { jpg = await convertirHEIC(file); } catch { /* no era HEIC */ }
    if (jpg) {
      try { return await resizeImage(jpg); }
      catch { return await resizeImage(jpg, 640, 0.62); }
    }
    throw e;
  }
}

// 📷 Subida confiable: reintenta una vez (fallas de red) y ya está lista
//    para usar en cualquier sitio donde se suban fotos.
export async function subirFotoProducto(file, workspaceId) {
  if (!workspaceId) throw new Error("No hay panel activo");
  const blob = await prepararImagen(file);
  let ultimo = null;
  for (let i = 0; i < 2; i++) {
    try { return await subirBlob(blob, workspaceId); }
    catch (e) { ultimo = e; if (i === 0) await esperar(700); }
  }
  throw ultimo;
}

// 💬 Traduce el error técnico a un mensaje corto y accionable.
export function textoErrorFoto(err) {
  const m = String((err && err.message) || err || "").toLowerCase();
  if (m.includes("no hay panel"))              return "no hay panel activo: recarga la página";
  if (m.includes("jwt") || m.includes("401") || m.includes("unauthorized") || m.includes("session"))
                                               return "tu sesión expiró: recarga la página";
  if (m.includes("row-level security") || m.includes("violates"))
                                               return "no tienes permiso para subir fotos en este panel";
  if (m.includes("quota") || m.includes("exceeded") || m.includes("storage size") || m.includes("excede"))
                                               return "se acabó el espacio para fotos en Supabase";
  if (m.includes("no se pudo leer") || m.includes("no válido"))
                                               return "no pude abrir esa imagen: conviértela a JPG o PNG";
  if (m.includes("procesar"))                  return "el navegador no pudo procesar esa foto (prueba con otra)";
  if (m.includes("fetch") || m.includes("network") || m.includes("connection"))
                                               return "sin conexión a internet";
  if (m.includes("payload too large") || m.includes("413")) return "esa foto pesa demasiado";
  return String((err && err.message) || "error desconocido").slice(0, 70);
}
