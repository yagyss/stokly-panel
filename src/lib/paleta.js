// Paleta de stokly para las secciones nuevas (WhatsApp, Integraciones, Mensajes).
// ⚠️ Es el MISMO objeto C que vive en src/App.jsx — mantenerlos iguales.
export const C = {
  bg: "#F7F8FC", white: "#FFFFFF", text: "#1A1A2E", muted: "#8B8FA8", border: "#EAECF5",
  green: "#00C896", greenLight: "#E6FAF5", red: "#FF5A5F", redLight: "#FFF0F0",
  blue: "#4A90FF", blueLight: "#EEF4FF", orange: "#FF8C42", orangeLight: "#FFF4EE",
  purple: "#8B5CF6", purpleLight: "#F3F0FF", yellow: "#FFB800", yellowLight: "#FFFBEB",
  teal: "#06B6D4", tealLight: "#E0F7FA",
  sidebar: "#1A1A2E", sidebarBorder: "rgba(255,255,255,0.08)",
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
