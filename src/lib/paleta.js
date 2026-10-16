// Paleta de stokly para las secciones nuevas (WhatsApp, Integraciones, Mensajes).
// ⚠️ Es el MISMO objeto C que vive en src/App.jsx — mantenerlos iguales.
export const C = {
  bg: "#F5F6F7", white: "#FFFFFF", text: "#1B1D21", muted: "#797E8C", border: "#E4E6EA",
  green: "#2F6B52", greenLight: "#F0F4F2", red: "#A3352C", redLight: "#FBF2F1",
  blue: "#4E5765", blueLight: "#F1F3F5", orange: "#8A5A2B", orangeLight: "#F7F3EE",
  purple: "#5C5674", purpleLight: "#F3F2F6", yellow: "#8A6A1C", yellowLight: "#F8F6EE",
  teal: "#3A6B72", tealLight: "#F0F4F5",
  sidebar: "#1B1D21", sidebarBorder: "rgba(255,255,255,0.08)",
};

export const fmt = (n) => "$" + Number(Math.round(n || 0)).toLocaleString("es-CO");

export const horaCorta = (iso) => {
  if (!iso) return "";
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  const hoy = new Date();
  const mismoDia = f.toDateString() === hoy.toDateString();
  const ayer = new Date(hoy.getTime() - 86400000).toDateString() === f.toDateString();
  const h = f.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  if (mismoDia) return h;
  if (ayer) return "ayer " + h;
  return f.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};
