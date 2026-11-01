// Genera lib/paises.json y lib/fronteras.json (datos de los países para el globo y /pais/[codigo]).
// Uso, desde apps/viajes: npm i --no-save world-countries@5.1.0 world-atlas@2.0.2 topojson-client@3.1.0 && node scripts/datos-paises.cjs
const fs = require("fs");
const topo = require("topojson-client");
const paises = require("world-countries");
const APP = require("path").resolve(__dirname, "..");
const ciudades = JSON.parse(fs.readFileSync(APP + "/data/lugares/ciudades.json", "utf8"));
const aeropuertos = JSON.parse(fs.readFileSync(APP + "/data/lugares/aeropuertos.json", "utf8"));
const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const dist = (a, b, c, d) => Math.hypot(a - c, (b - d) * Math.cos((a * Math.PI) / 180));

const salida = [];
for (const p of paises) {
  if (!p.cca2 || p.status === "user-assigned" && p.cca2 !== "XK") {}
  const cap = p.capital?.[0];
  let lat = p.latlng[0], lon = p.latlng[1], capEncontrada = false;
  if (cap) {
    const n = norm(cap);
    const cand = ciudades.filter((c) => c[3] === p.cca2 && (norm(c[0]) === n || norm(c[1]) === n || c[2].some((o) => norm(o) === n))).sort((a, b) => b[6] - a[6]);
    if (cand[0]) { lat = cand[0][4]; lon = cand[0][5]; capEncontrada = true; }
  }
  // Aeropuerto: el grande más cerca de la capital; si no hay, cualquiera del país.
  const delPais = aeropuertos.filter((a) => a[3] === p.cca2);
  const grandes = delPais.filter((a) => a[6]);
  const lista = grandes.length ? grandes : delPais;
  // En algunas capitales el grande más cercano no es el principal (Roma: Ciampino en vez de Fiumicino).
  const PRINCIPAL = { IT: "FCO", GB: "LHR", FR: "CDG", AR: "EZE", RU: "SVO", JP: "HND", CN: "PEK", US: "IAD", TH: "BKK", KR: "ICN", MX: "MEX", BR: "BSB", TR: "ESB", DE: "BER", SE: "ARN", NO: "OSL", IL: "TLV", ID: "CGK", MY: "KUL", PH: "MNL", VN: "HAN", IN: "DEL", EG: "CAI", MA: "RBA", ZA: "PRY", AU: "CBR", CA: "YOW", NZ: "WLG" };
  const aero = delPais.find((a) => a[0] === PRINCIPAL[p.cca2]) ?? lista.sort((a, b) => dist(lat, lon, a[4], a[5]) - dist(lat, lon, b[4], b[5]))[0];
  salida.push([
    p.cca2, cap ?? "", Math.round(lat * 100) / 100, Math.round(lon * 100) / 100,
    Object.keys(p.languages ?? {}).join(","), Object.keys(p.currencies ?? {}).join(","),
    p.idd?.root ? (p.idd.suffixes?.length === 1 ? p.idd.root + p.idd.suffixes[0] : p.idd.root) : "",
    aero ? aero[0] : "", capEncontrada ? 1 : 0, p.region,
  ]);
}
const sinCap = salida.filter((s) => s[1] && !s[8]).map((s) => s[0] + ":" + s[1]);
console.log("paises", salida.length, "capital sin coordenadas:", sinCap.length, sinCap.slice(0, 40).join(" "));
fs.writeFileSync(APP + "/lib/paises.json", JSON.stringify(salida.map((s) => s.filter((_, i) => i !== 8))));

// Fronteras: polígonos (Natural Earth 1:110m, de world-atlas), redondeados a 0,1°.
const mundo = JSON.parse(fs.readFileSync(require.resolve("world-atlas/countries-110m.json"), "utf8"));
const porNumero = Object.fromEntries(paises.map((p) => [p.ccn3, p.cca2]));
const nombres = { Kosovo: "XK", "N. Cyprus": "CY", Somaliland: "SO" };
const geo = topo.feature(mundo, mundo.objects.countries);
const fronteras = {};
let faltan = [];
for (const f of geo.features) {
  const cod = porNumero[f.id] ?? nombres[f.properties.name];
  if (!cod) { faltan.push(f.properties.name); continue; }
  const polis = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const anillos = polis.map((poli) => poli[0].map(([lo, la]) => [Math.round(lo * 10) / 10, Math.round(la * 10) / 10]));
  (fronteras[cod] ??= []).push(...anillos);
}
console.log("fronteras", Object.keys(fronteras).length, "sin código:", faltan);
fs.writeFileSync(APP + "/lib/fronteras.json", JSON.stringify(fronteras));
