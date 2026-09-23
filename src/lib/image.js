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

// Sube la foto dentro de la carpeta del panel (workspace_id)
// y devuelve la URL pública. El RLS de Storage valida la carpeta.
export async function uploadProductImage(file, workspaceId) {
  if (!workspaceId) throw new Error("No hay panel activo");
  const blob = await resizeImage(file);
  const path = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
