# 📦 stokly

Panel de gestión de inventario, ventas, gastos, finanzas y métricas para pequeños negocios.

Aplicación **React + Vite**, responsive (escritorio con sidebar, móvil con navegación inferior).

## 🚀 Uso local

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## 🏗️ Build de producción

```bash
npm run build
npm run preview
```

## 📲 PWA (instalable en celular y escritorio)

| Archivo | Qué hace |
|---|---|
| `public/manifest.webmanifest` | Nombre, íconos, colores y modo "aplicación" (lo que ve el sistema para instalar) |
| `public/sw.js` | Service worker: abre la app **sin internet** y siempre trae la versión nueva desde la red (nunca deja una app vieja cacheada) |
| `src/lib/pwa.js` | Registra el SW **sólo en producción** y expone el botón `📲 Instalar app` del menú de usuario |
| `public/favicon.svg` + `public/icons/` | Ícono de la pestaña y íconos de instalación (192/512/maskable/180) |
| `scripts/gen-iconos.mjs` | Regenera los íconos PNG sin dependencias: `node scripts/gen-iconos.mjs` |

El SW **no se registra en `npm run dev`** (para que nada quede cacheado al
desarrollar). Para probarlo hay que compilar:

```bash
npm run build
npm run preview   # http://localhost:4173
```

> ⚠️ Si modificas `public/sw.js`, sube `CACHE = "stokly-pwa-v1"` → `v2` para que
> los visitantes descarten el caché anterior.
>
> ⚠️ Las rutas del manifest y del registro son **relativas** (`./`) a propósito:
> así funcionan igual en la raíz (Vercel) y en subcarpeta (GitHub Pages).

## 📑 Secciones

| Sección | Descripción |
|---|---|
| 🏠 Inicio | Ganancia neta, KPIs, acciones rápidas, alertas de stock |
| 📦 Inventario | Búsqueda, filtros, vista visual/lista, importar Excel/CSV |
| 💰 Ventas | Registro de ventas por método de pago |
| 💸 Gastos | Control de gastos por categoría |
| 📈 Finanzas | Flujo de caja, rentabilidad, indicadores (CPA, punto de equilibrio, ROI) |
| 📊 Métricas | Ranking de ventas, colores preferidos, sugerencias de compra |

## 🛠️ Stack

- React 18
- Vite 5
- SheetJS (XLSX) para importar archivos Excel
- Sin librerías de UI: estilos con CSS embebido

## 📦 Deploy

Despliegue automático con **GitHub Pages** vía GitHub Actions: cada push a `main` compila y publica el sitio.
