// ¿Dónde caen los parámetros al volver del OAuth? (query vs. fragmento)
const spec = await (await fetch("https://zernio.com/openapi.json")).json();
const texto = JSON.stringify(spec);

const buscar = (re, tope = 6) => {
  let m, n = 0;
  const out = [];
  while ((m = re.exec(texto)) && n < tope) {
    out.push("…" + texto.slice(Math.max(0, m.index - 260), m.index + 300).replace(/\\n/g, " ") + "…\n");
    n++;
  }
  return out;
};

console.log("── 'fragment' ──");
for (const t of buscar(/fragment/gi)) console.log(t + "\n");

console.log("── 'hash' ──");
for (const t of buscar(/\bhash\b/gi, 4)) console.log(t + "\n");

console.log("── 'searchParams' / 'URL API' ──");
for (const t of buscar(/searchParams|URL API/gi, 5)) console.log(t + "\n");

console.log("── ejemplos con connected= o code= en una URL ──");
for (const t of buscar(/connected=\{|connected=facebook|callback\?code=|example\.com[^"]{0,80}(code|connected)/gi, 5)) console.log(t + "\n");
