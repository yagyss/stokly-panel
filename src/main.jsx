import ReactDOM from "react-dom/client";
import Stokly from "./App.jsx";
import { registrarServiceWorker } from "./lib/pwa.js";

// 📲 PWA: deja la app instalable y con caché para abrir sin conexión
registrarServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(<Stokly />);
