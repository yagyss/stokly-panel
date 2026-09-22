import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Rutas relativas: funciona en localhost y en GitHub Pages (/repo/)
  base: "./",
  plugins: [react()],
  server: { port: 5173, open: false },
});
