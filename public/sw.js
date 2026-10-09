// ============================================================
//  stokly · Service Worker (PWA)
//  Qué hace:
//   · Guarda la "cáscara" de la app (index, íconos, manifest)
//     para que abra aunque NO tengas internet.
//   · Las páginas (navegación) van SIEMPRE a la red primero:
//     así, cada vez que salga una versión nueva la ves al instante
//     (nunca te quedas con una app vieja guardada).
//   · Los archivos con nombre hasheado (assets/index-xxxx.js) se
//     guardan en caché porque ya no cambian nunca.
//   · Nada de Supabase/API: sólo se cachea el mismo dominio.
//  ¿Al cambiar el código del SW? Sube el número de CACHE (v1→v2).
// ============================================================

const CACHE = "stokly-pwa-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const viejas = await caches.keys();
      await Promise.all(viejas.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return; // nunca cachear POST/PUT/DELETE
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return; // Supabase y externos: red
  if (url.pathname.endsWith("/sw.js")) return; // el propio SW siempre de la red
  evento.respondWith(responder(req));
});

async function responder(req) {
  const cache = await caches.open(CACHE);

  // ── Navegación (abrir la app): red primero, caché si no hay internet ──
  if (req.mode === "navigate") {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const leido = res.clone();
        const copia = res.clone();
        await limpiarBundlesViejos(cache, leido);
        cache.put("./", copia).catch(() => {});
      }
      return res;
    } catch (e) {
      return (
        (await cache.match("./")) ||
        (await cache.match("./index.html")) ||
        new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain" } })
      );
    }
  }

  // ── Archivos: caché primero (con actualización en segundo plano) ──
  const guardada = await cache.match(req);
  const ruta = new URL(req.url).pathname;
  const inmutable = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i.test(ruta);

  const irRed = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (guardada) {
    if (!inmutable) irRed.catch(() => {}); // refresca en segundo plano
    return guardada;
  }
  const res = await irRed;
  return res || new Response("", { status: 504 });
}

// Cuando sale una versión nueva, borra los bundles ANTIGUOS del caché
// (así no se van acumulando MB con cada despliegue).
async function limpiarBundlesViejos(cache, resIndex) {
  try {
    const texto = await resIndex.text();
    const nuevo = (texto.match(/assets\/index-[\w-]+\.js/) || [])[0];
    const previo = await cache.match("./");
    if (!nuevo || !previo) return;
    const textoPrevio = await previo.text();
    const viejo = (textoPrevio.match(/assets\/index-[\w-]+\.js/) || [])[0];
    if (!viejo || viejo === nuevo) return;
    const peticiones = await cache.keys();
    await Promise.all(
      peticiones
        .filter((p) => {
          const pth = new URL(p.url).pathname;
          return pth.includes("/assets/") && !pth.endsWith(nuevo);
        })
        .map((p) => cache.delete(p))
    );
  } catch (e) {
    /* sin problemas: sólo limpieza */
  }
}
