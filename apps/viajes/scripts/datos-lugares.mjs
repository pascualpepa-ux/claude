// Genera data/lugares/{ciudades,aeropuertos}.json a partir de datos abiertos.
//
// Fuentes (descargarlas antes de correr el script):
//   - Aeropuertos: OurAirports, dominio público
//     https://davidmegginson.github.io/ourairports-data/airports.csv
//   - Ciudades: GeoNames cities15000 (ciudades de más de 15.000 habitantes), CC BY 4.0
//     https://download.geonames.org/export/dump/cities15000.zip (descomprimir: cities15000.txt)
//   - Provincias / estados: GeoNames admin1CodesASCII, CC BY 4.0
//     https://download.geonames.org/export/dump/admin1CodesASCII.txt
//
// Uso: node scripts/datos-lugares.mjs <airports.csv> <cities15000.txt> <admin1CodesASCII.txt>
import { readFileSync, writeFileSync } from "node:fs";

const [rutaAeropuertos, rutaCiudades, rutaRegiones] = process.argv.slice(2);
if (!rutaAeropuertos || !rutaCiudades || !rutaRegiones) {
  console.error("Uso: node scripts/datos-lugares.mjs <airports.csv> <cities15000.txt> <admin1CodesASCII.txt>");
  process.exit(1);
}

/** Parser CSV mínimo con comillas (el formato de OurAirports). */
function filasCsv(texto) {
  const filas = [];
  let fila = [], campo = "", comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

const redondear = (n) => Math.round(n * 1e4) / 1e4;

// Aeropuertos con vuelos regulares y código IATA.
const [cab, ...filas] = filasCsv(readFileSync(rutaAeropuertos, "utf8"));
const col = Object.fromEntries(cab.map((n, i) => [n, i]));
const aeropuertos = filas
  .filter((f) => ["large_airport", "medium_airport"].includes(f[col.type]) && f[col.scheduled_service] === "yes" && /^[A-Z]{3}$/.test(f[col.iata_code]))
  .map((f) => [
    f[col.iata_code],
    f[col.name],
    f[col.municipality] || "",
    f[col.iso_country],
    redondear(Number(f[col.latitude_deg])),
    redondear(Number(f[col.longitude_deg])),
    f[col.type] === "large_airport" ? 1 : 0,
  ]);

// Provincia o estado de cada ciudad (para distinguir, por ejemplo, Pilar de Buenos Aires y Pilar de Córdoba).
const regiones = new Map(
  readFileSync(rutaRegiones, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split("\t"))
    .map(([codigo, nombre]) => [codigo, nombre]),
);

// Ciudades: nombre, nombre ASCII, otros nombres en alfabeto latino (para "Nueva York", "Londres"...),
// país, coordenadas y población.
const latino = /^[\p{Script=Latin}\s'’.\-]+$/u;
const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const ciudades = readFileSync(rutaCiudades, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((linea) => linea.split("\t"))
  .map((c) => {
    const nombre = c[1];
    const poblacion = Number(c[14]);
    const vistos = new Set([normalizar(nombre), normalizar(c[2])]);
    const otros = [];
    // Las ciudades grandes tienen muchos nombres en otros idiomas; el orden de GeoNames no
    // prioriza ninguno, así que se guardan todos los de alfabeto latino hasta un tope.
    const tope = poblacion >= 1_000_000 ? 120 : poblacion >= 300_000 ? 40 : poblacion >= 100_000 ? 15 : 0;
    if (tope) {
      for (const alt of c[3].split(",")) {
        const n = normalizar(alt.trim());
        if (!alt || alt.length > 40 || !latino.test(alt) || vistos.has(n)) continue;
        vistos.add(n);
        otros.push(alt.trim());
        if (otros.length >= tope) break;
      }
    }
    const region = regiones.get(`${c[8]}.${c[10]}`) ?? "";
    return [nombre, c[2], otros, c[8], redondear(Number(c[4])), redondear(Number(c[5])), poblacion, region === nombre ? "" : region];
  })
  .sort((a, b) => b[6] - a[6]);

writeFileSync("data/lugares/aeropuertos.json", JSON.stringify(aeropuertos));
writeFileSync("data/lugares/ciudades.json", JSON.stringify(ciudades));
console.log(`${aeropuertos.length} aeropuertos, ${ciudades.length} ciudades`);
