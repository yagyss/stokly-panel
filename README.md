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
