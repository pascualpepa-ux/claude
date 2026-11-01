import DATOS from "./paises.json";
import type { Idioma } from "./idioma";

// Datos de cada país para el globo y para su página de /pais/[codigo].
// Fuentes: mledoze/countries (ODbL) para capital, idiomas, monedas y prefijo; GeoNames (CC BY 4.0) para
// las coordenadas de la capital; OurAirports (dominio público) para el aeropuerto principal.
// Se regeneran con scripts/datos-paises.cjs.

type Fila = [codigo: string, capital: string, lat: number, lon: number, idiomas: string, monedas: string, prefijo: string, aeropuerto: string, region: string];

export interface Pais {
  codigo: string; // ISO de 2 letras
  capital: string; // en inglés, como viene en los datos
  lat: number; // de la capital (o del centro del país si no se encontró)
  lon: number;
  idiomas: string[]; // ISO 639-3
  monedas: string[]; // ISO 4217
  prefijo: string; // +34
  aeropuerto: string; // IATA, puede estar vacío
  region: string;
}

const aPais = ([codigo, capital, lat, lon, idiomas, monedas, prefijo, aeropuerto, region]: Fila): Pais => ({
  codigo,
  capital,
  lat,
  lon,
  idiomas: idiomas ? idiomas.split(",") : [],
  monedas: monedas ? monedas.split(",") : [],
  prefijo,
  aeropuerto,
  region,
});

export const PAISES: Pais[] = (DATOS as Fila[]).map(aPais);

export function paisPorCodigo(codigo: string): Pais | undefined {
  const c = codigo.toUpperCase();
  return PAISES.find((p) => p.codigo === c);
}

/** Nombre del país en el idioma de la web (el navegador y Node los traen). */
export function nombrePais(codigo: string, idioma: Idioma): string {
  try {
    return new Intl.DisplayNames([idioma], { type: "region" }).of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

/** Bandera como emoji, a partir del código de 2 letras. */
export const bandera = (codigo: string) => String.fromCodePoint(...[...codigo.toUpperCase()].map((l) => 0x1f1a5 + l.charCodeAt(0)));

export function nombresDe(codigos: string[], tipo: "language" | "currency", idioma: Idioma): string[] {
  const d = new Intl.DisplayNames([idioma], { type: tipo });
  return codigos.map((c) => {
    try {
      return d.of(c) ?? c;
    } catch {
      return c;
    }
  });
}
