// Paleta de stokly para las secciones nuevas (WhatsApp, Integraciones, Mensajes).
// ⚠️ Es el MISMO objeto C que vive en src/App.jsx — mantenerlos iguales.
export const C = {
  bg: "#F5F6F7", white: "#FFFFFF", text: "#1B1D21", muted: "#797E8C", border: "#E4E6EA",
  // Semántica: verde = positivo · ámbar = pendiente/alerta · naranja = gasto ·
  // azul/morado = métricas · rojo = error/pérdida. (mantener igual que App.jsx)
  green: "#2F6B52", greenLight: "#F0F4F2", red: "#A3352C", redLight: "#FBF2F1",
  blue: "#3D6E96", blueLight: "#EAF1F7", orange: "#BC6C30", orangeLight: "#FBF1E8",
  purple: "#6B5B9B", purpleLight: "#F1EEF8", yellow: "#9A7A20", yellowLight: "#FAF4E4",
  teal: "#3E7D76", tealLight: "#EAF3F1",
  // Variantes claras sobre fondo oscuro (mantener igual que App.jsx):
  greenOn: "#5FC68E", orangeOn: "#EB9668", amberOn: "#E8C063",
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
