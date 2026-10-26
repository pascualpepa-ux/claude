import type { TipoActividad } from "./types";

/**
 * Catálogo de ejemplo (fase 1). En la fase 3 lo reemplaza el agente de
 * recomendaciones con datos reales.
 */
export interface ActividadBase {
  nombre: string;
  tipo: TipoActividad;
  aireLibre: boolean;
  precio: number; // USD por persona
  horas: number;
}

export interface CiudadBase {
  nombre: string;
  peso: number; // reparto de días cuando se elige solo el país
  costo: number; // índice de costo de vida, 1 = promedio
  aeropuerto: string;
  zonas: string[];
  actividades: ActividadBase[];
}

export interface PaisBase {
  nombre: string;
  alias: string[];
  ciudades: CiudadBase[];
  aerolineas: string[];
}

const a = (
  nombre: string,
  tipo: TipoActividad,
  aireLibre: boolean,
  precio: number,
  horas: number,
): ActividadBase => ({ nombre, tipo, aireLibre, precio, horas });

export const PAISES: PaisBase[] = [
  {
    nombre: "China",
    alias: ["china"],
    aerolineas: ["Air China", "China Eastern", "Emirates", "Qatar Airways"],
    ciudades: [
      {
        nombre: "Beijing",
        peso: 3,
        costo: 0.9,
        aeropuerto: "PEK",
        zonas: ["Dongcheng", "Wangfujing", "Sanlitun"],
        actividades: [
          a("Gran Muralla en Mutianyu", "imperdible", true, 45, 6),
          a("Ciudad Prohibida", "imperdible", false, 12, 3),
          a("Templo del Cielo", "imperdible", true, 5, 2),
          a("Pato laqueado en un restaurante tradicional", "comida", false, 35, 2),
          a("Hutongs en bicicleta", "experiencia", true, 25, 3),
          a("Museo Nacional de China", "imperdible", false, 0, 3),
          a("Mercado nocturno de Wangfujing", "comida", true, 15, 2),
        ],
      },
      {
        nombre: "Shanghái",
        peso: 2,
        costo: 1,
        aeropuerto: "PVG",
        zonas: ["The Bund", "Jing'an", "Concesión Francesa"],
        actividades: [
          a("Paseo por The Bund al atardecer", "imperdible", true, 0, 2),
          a("Jardín Yuyuan", "imperdible", true, 6, 2),
          a("Mirador de la Shanghai Tower", "experiencia", false, 30, 2),
          a("Xiaolongbao en Nanxiang", "comida", false, 12, 1),
          a("Museo de Shanghái", "imperdible", false, 0, 3),
          a("Pueblo de agua de Zhujiajiao", "experiencia", true, 20, 5),
        ],
      },
      {
        nombre: "Xi'an",
        peso: 2,
        costo: 0.8,
        aeropuerto: "XIY",
        zonas: ["Centro amurallado", "Barrio Musulmán"],
        actividades: [
          a("Guerreros de Terracota", "imperdible", false, 25, 4),
          a("Muralla de Xi'an en bicicleta", "experiencia", true, 12, 2),
          a("Barrio Musulmán y sus puestos", "comida", true, 10, 2),
          a("Gran Pagoda de la Oca Salvaje", "imperdible", true, 8, 2),
        ],
      },
    ],
  },
  {
    nombre: "Japón",
    alias: ["japon", "japón"],
    aerolineas: ["Japan Airlines", "ANA", "Delta", "Emirates"],
    ciudades: [
      {
        nombre: "Tokio",
        peso: 3,
        costo: 1.2,
        aeropuerto: "HND",
        zonas: ["Shinjuku", "Asakusa", "Shibuya"],
        actividades: [
          a("Templo Senso-ji en Asakusa", "imperdible", true, 0, 2),
          a("Cruce de Shibuya y Shibuya Sky", "experiencia", false, 18, 2),
          a("Mercado exterior de Tsukiji", "comida", true, 25, 2),
          a("teamLab Planets", "experiencia", false, 28, 2),
          a("Santuario Meiji y Harajuku", "imperdible", true, 0, 3),
          a("Ramen en Shinjuku", "comida", false, 12, 1),
        ],
      },
      {
        nombre: "Kioto",
        peso: 2,
        costo: 1.1,
        aeropuerto: "KIX",
        zonas: ["Gion", "Centro", "Higashiyama"],
        actividades: [
          a("Fushimi Inari", "imperdible", true, 0, 3),
          a("Bosque de bambú de Arashiyama", "imperdible", true, 0, 3),
          a("Ceremonia del té", "experiencia", false, 35, 1.5),
          a("Mercado Nishiki", "comida", false, 20, 2),
          a("Kinkaku-ji, el Pabellón Dorado", "imperdible", true, 4, 1.5),
        ],
      },
      {
        nombre: "Osaka",
        peso: 1,
        costo: 1,
        aeropuerto: "KIX",
        zonas: ["Namba", "Umeda"],
        actividades: [
          a("Dotonbori de noche", "comida", true, 25, 3),
          a("Castillo de Osaka", "imperdible", false, 6, 2),
          a("Acuario Kaiyukan", "experiencia", false, 18, 3),
        ],
      },
    ],
  },
  {
    nombre: "Italia",
    alias: ["italia"],
    aerolineas: ["ITA Airways", "Aerolíneas Argentinas", "Iberia", "Air Europa"],
    ciudades: [
      {
        nombre: "Roma",
        peso: 3,
        costo: 1.1,
        aeropuerto: "FCO",
        zonas: ["Centro Storico", "Trastevere", "Monti"],
        actividades: [
          a("Coliseo y Foro Romano", "imperdible", true, 22, 3),
          a("Museos Vaticanos y Capilla Sixtina", "imperdible", false, 25, 4),
          a("Cena en Trastevere", "comida", false, 40, 2),
          a("Fontana di Trevi y Panteón a pie", "imperdible", true, 0, 3),
          a("Clase de pasta fresca", "experiencia", false, 70, 3),
        ],
      },
      {
        nombre: "Florencia",
        peso: 2,
        costo: 1.05,
        aeropuerto: "FLR",
        zonas: ["Duomo", "Oltrarno"],
        actividades: [
          a("Galería Uffizi", "imperdible", false, 28, 3),
          a("Subida a la cúpula del Duomo", "imperdible", true, 32, 2),
          a("Mercato Centrale", "comida", false, 20, 1.5),
          a("Excursión de vinos a Chianti", "experiencia", true, 95, 6),
        ],
      },
      {
        nombre: "Venecia",
        peso: 1,
        costo: 1.3,
        aeropuerto: "VCE",
        zonas: ["San Marco", "Cannaregio"],
        actividades: [
          a("Plaza y Basílica de San Marco", "imperdible", true, 4, 2),
          a("Paseo en góndola", "experiencia", true, 90, 0.5),
          a("Cicchetti en bacari", "comida", false, 25, 2),
        ],
      },
    ],
  },
  {
    nombre: "España",
    alias: ["espana", "españa"],
    aerolineas: ["Iberia", "Air Europa", "Aerolíneas Argentinas", "LATAM"],
    ciudades: [
      {
        nombre: "Madrid",
        peso: 2,
        costo: 1,
        aeropuerto: "MAD",
        zonas: ["Sol", "Malasaña", "Salamanca"],
        actividades: [
          a("Museo del Prado", "imperdible", false, 17, 3),
          a("Parque del Retiro", "imperdible", true, 0, 2),
          a("Tapas en La Latina", "comida", false, 30, 2),
          a("Palacio Real", "imperdible", false, 15, 2),
        ],
      },
      {
        nombre: "Barcelona",
        peso: 2,
        costo: 1.1,
        aeropuerto: "BCN",
        zonas: ["Eixample", "Gótico", "Gràcia"],
        actividades: [
          a("Sagrada Familia", "imperdible", false, 30, 2),
          a("Park Güell", "imperdible", true, 13, 2),
          a("Mercado de La Boqueria", "comida", false, 20, 1.5),
          a("Barrio Gótico a pie", "experiencia", true, 0, 3),
        ],
      },
      {
        nombre: "Sevilla",
        peso: 1,
        costo: 0.9,
        aeropuerto: "SVQ",
        zonas: ["Santa Cruz", "Triana"],
        actividades: [
          a("Real Alcázar", "imperdible", true, 16, 2.5),
          a("Espectáculo de flamenco", "experiencia", false, 35, 1.5),
          a("Tapeo en Triana", "comida", false, 25, 2),
        ],
      },
    ],
  },
];

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type Resolucion =
  | { tipo: "pais"; pais: PaisBase }
  | { tipo: "ciudad"; ciudad: CiudadBase; pais?: PaisBase };

/** Interpreta el destino escrito por el usuario: país, ciudad conocida o ciudad desconocida. */
export function resolverDestino(destino: string): Resolucion {
  const d = normalizar(destino);
  for (const pais of PAISES) {
    if (pais.alias.map(normalizar).includes(d) || normalizar(pais.nombre) === d) {
      return { tipo: "pais", pais };
    }
    const ciudad = pais.ciudades.find((c) => normalizar(c.nombre) === d);
    if (ciudad) return { tipo: "ciudad", ciudad, pais };
  }
  return { tipo: "ciudad", ciudad: ciudadGenerica(destino.trim() || "Destino") };
}

function ciudadGenerica(nombre: string): CiudadBase {
  return {
    nombre,
    peso: 1,
    costo: 1,
    aeropuerto: nombre.slice(0, 3).toUpperCase(),
    zonas: ["Centro", "Barrio histórico"],
    actividades: [
      a(`Recorrido a pie por el centro de ${nombre}`, "imperdible", true, 0, 3),
      a(`Museo principal de ${nombre}`, "imperdible", false, 15, 2.5),
      a("Mercado local y comida típica", "comida", false, 20, 2),
      a("Mirador o punto panorámico", "experiencia", true, 10, 1.5),
      a("Cena en un restaurante tradicional", "comida", false, 35, 2),
    ],
  };
}
