// ¿headless=false se respeta o se vuelve "headless=true"?
import fs from "node:fs";
const KEY = (fs.readFileSync("C:/Users/pc/Downloads/stocly code/.env.local", "utf8").match(/ZERNIO_API_KEY=(.*)/) || [])[1].trim();
const H = { Authorization: `Bearer ${KEY}` };
const B = "https://zernio.com/api/v1";
const perfil = (await (await fetch(B + "/profiles", { headers: H })).json()).profiles[0]._id;
const RED = "https://yagyss.github.io/stokly-panel/#canales?redes=facebook";
const q = (o) => "?" + new URLSearchParams(o).toString();

const ver = async (etiqueta, params) => {
  const r = await fetch(B + "/connect/facebook" + q(params), { headers: H });
  const j = await r.json();
  let info = "";
  try {
    const u = new URL(j.authUrl);
    const st = u.searchParams.get("state") || "";
    info = `state contiene headless=true: ${st.includes("headless%3Dtrue") || st.includes("headless=true")}`;
    const ru = st.includes("headless") ? "(sí)" : "(no)";
    info += ` · estado con "headless" ${ru}`;
    info += ` · fragmento: ${decodeURIComponent(st).slice(-120)}`;
  } catch (e) { info = JSON.stringify(j).slice(0, 200); }
  console.log(`${etiqueta}\n   ${info}\n`);
};

await ver("headless=false explícito", { profileId: perfil, headless: "false", redirect_url: RED });
await ver("sin headless (por defecto)", { profileId: perfil, redirect_url: RED });
await ver("headless=true explícito", { profileId: perfil, headless: "true", redirect_url: RED });
