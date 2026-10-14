// Qué admite exactamente GET /connect/{platform} para WhatsApp y Facebook
const spec = await (await fetch("https://zernio.com/openapi.json")).json();

const op = spec.paths["/v1/connect/{platform}"]?.get;
console.log("── GET /v1/connect/{platform} ──");
console.log((op?.description || op?.summary || "").slice(0, 2000));
console.log("\nparámetros:");
for (const p of op?.parameters || []) {
  console.log(
    `  ${p.name} (${p.in})${p.required ? " *oblig" : ""}: ${p.schema?.type || ""}` +
      (p.schema?.enum ? " enum=[" + p.schema.enum.join("|") + "]" : "") +
      (p.description ? " — " + p.description : "")
  );
}

// Rutas que mencionen whatsapp o signup
console.log("\n── rutas relacionadas ──");
for (const [ruta, metodos] of Object.entries(spec.paths)) {
  if (!/whatsapp|signup|embedded/i.test(ruta)) continue;
  for (const [m, o] of Object.entries(metodos)) {
    console.log(`  ${m.toUpperCase()} ${ruta} — ${o.summary || ""}`);
  }
}

// Búsqueda de "signup" en todo el spec (documentación)
const texto = JSON.stringify(spec);
const marcas = [];
let i = 0;
while ((i = texto.indexOf("signup", i)) !== -1 && marcas.length < 12) {
  marcas.push("…" + texto.slice(Math.max(0, i - 160), i + 220).replace(/\\n/g, " ") + "…\n");
  i += 6;
}
console.log("\n── menciones de 'signup' ──");
for (const m of marcas) console.log(m + "\n");
