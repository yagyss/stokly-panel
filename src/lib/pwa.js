// ============================================================
//  stokly · PWA helpers
//  · Registra el service worker (sólo en la build de producción,
//    para que `npm run dev` no quede cacheado).
//  · Expone el botón "Instalar app" (beforeinstallprompt) y
//    instrucciones para iPhone, donde ese evento no existe.
// ============================================================
import { useEffect, useState } from "react";

let pendiente = null; // evento beforeinstallprompt guardado

export function registrarServiceWorker() {
  if (!import.meta.env.PROD) return; // en desarrollo nunca instalamos SW
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.info("[stokly] PWA lista (service worker activo)"))
      .catch((e) => console.info("[stokly] service worker:", e && e.message));
  });
}

// ¿Se puede instalar? (Chrome/Edge/Android) ¿Ya está instalada?
export function useInstalable() {
  const [instalable, setInstalable] = useState(false);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      pendiente = e;
      setInstalable(true);
    };
    const onInstalada = () => {
      pendiente = null;
      setInstalable(false);
      setInstalada(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalada);

    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) setInstalada(true);
    } catch {
      /* sin matchMedia */
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalada);
    };
  }, []);

  // Devuelve "instalada" | "aceptada" | "rechazada" | "sin-prompt"
  const instalar = async () => {
    if (instalada) return "instalada";
    if (pendiente) {
      const ev = pendiente;
      pendiente = null;
      try {
        ev.prompt();
        const { outcome } = await ev.userChoice;
        setInstalable(false);
        if (outcome === "accepted") setInstalada(true);
        return outcome || "rechazada";
      } catch {
        return "rechazada";
      }
    }
    return "sin-prompt";
  };

  return { instalable, instalada, instalar };
}

// Instrucciones manuales (iPhone y quien no tenga el botón automático)
export const INSTRUCCIONES_INSTALAR = `📲 Instalar stokly en tu celular

iPhone (Safari):
1. Toca el botón Compartir ⬆️ (abajo en el centro).
2. Baja y toca "Añadir a pantalla de inicio".
3. Toca "Añadir" (arriba a la derecha).

Android (Chrome):
1. Toca el menú ⋮ (esquina superior derecha).
2. Toca "Instalar aplicación" o "Añadir a pantalla de inicio".
3. Confirma "Instalar".

Computador (Chrome o Edge):
1. Toca el ícono de instalar ▼ en la barra de direcciones.
2. Confirma "Instalar".`;
