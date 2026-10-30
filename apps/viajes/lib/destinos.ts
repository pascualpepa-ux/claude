import type { TipoActividad } from "./types";

/**
 * Catálogo de ejemplo (fase 1). En la fase 3 lo reemplaza el agente de
 * recomendaciones con datos reales.
 */
/** Texto en los dos idiomas de la web. */
export interface Bilingue {
  es: string;
  en: string;
}

export interface ActividadBase {
  nombre: Bilingue;
  tipo: TipoActividad;
  aireLibre: boolean;
  precio: number; // USD por persona
  horas: number;
}

export interface CiudadBase {
  clave: string; // identificador estable, no cambia con el idioma
  nombre: Bilingue;
  peso: number; // reparto de días cuando se elige solo el país
  costo: number; // índice de costo de vida, 1 = promedio
  aeropuerto: string;
  zonas: Bilingue[];
  actividades: ActividadBase[];
}

export interface PaisBase {
  nombre: Bilingue;
  alias: string[];
  ciudades: CiudadBase[];
  aerolineas: string[];
}

const a = (
  es: string,
  en: string,
  tipo: TipoActividad,
  aireLibre: boolean,
  precio: number,
  horas: number,
): ActividadBase => ({ nombre: { es, en }, tipo, aireLibre, precio, horas });

/** Zona con el mismo nombre en los dos idiomas, o con traducción. */
const z = (es: string, en = es): Bilingue => ({ es, en });

export const PAISES: PaisBase[] = [
  {
    nombre: { es: "China", en: "China" },
    alias: ["china"],
    aerolineas: ["Air China", "China Eastern", "Emirates", "Qatar Airways"],
    ciudades: [
      {
        clave: "beijing",
        nombre: { es: "Beijing", en: "Beijing" },
        peso: 3,
        costo: 0.9,
        aeropuerto: "PEK",
        zonas: [z("Dongcheng"), z("Wangfujing"), z("Sanlitun")],
        actividades: [
          a("Gran Muralla en Mutianyu", "Great Wall at Mutianyu", "imperdible", true, 45, 6),
          a("Ciudad Prohibida", "Forbidden City", "imperdible", false, 12, 3),
          a("Templo del Cielo", "Temple of Heaven", "imperdible", true, 5, 2),
          a("Pato laqueado en un restaurante tradicional", "Peking duck at a traditional restaurant", "comida", false, 35, 2),
          a("Hutongs en bicicleta", "Hutongs by bike", "experiencia", true, 25, 3),
          a("Museo Nacional de China", "National Museum of China", "imperdible", false, 0, 3),
          a("Mercado nocturno de Wangfujing", "Wangfujing night market", "comida", true, 15, 2),
          a("Bares y rooftops en Sanlitun", "Bars and rooftop lounges in Sanlitun", "vida_nocturna", false, 20, 3),
          a("Shopping en Sanlitun Taikoo Li", "Shopping at Sanlitun Taikoo Li", "compras", false, 0, 2),
        ],
      },
      {
        clave: "shanghai",
        nombre: { es: "Shanghái", en: "Shanghai" },
        peso: 2,
        costo: 1,
        aeropuerto: "PVG",
        zonas: [z("The Bund"), z("Jing'an"), z("Concesión Francesa", "French Concession")],
        actividades: [
          a("Paseo por The Bund al atardecer", "Sunset walk along The Bund", "imperdible", true, 0, 2),
          a("Jardín Yuyuan", "Yuyuan Garden", "imperdible", true, 6, 2),
          a("Mirador de la Shanghai Tower", "Shanghai Tower observation deck", "experiencia", false, 30, 2),
          a("Xiaolongbao en Nanxiang", "Xiaolongbao at Nanxiang", "comida", false, 12, 1),
          a("Museo de Shanghái", "Shanghai Museum", "imperdible", false, 0, 3),
          a("Pueblo de agua de Zhujiajiao", "Zhujiajiao water town", "experiencia", true, 20, 5),
          a("Bares de coctelería en la Concesión Francesa", "Cocktail bars in the French Concession", "vida_nocturna", false, 18, 3),
          a("Compras en Tianzifang", "Shopping at Tianzifang", "compras", true, 0, 2),
        ],
      },
      {
        clave: "xian",
        nombre: { es: "Xi'an", en: "Xi'an" },
        peso: 2,
        costo: 0.8,
        aeropuerto: "XIY",
        zonas: [z("Centro amurallado", "Walled city"), z("Barrio Musulmán", "Muslim Quarter")],
        actividades: [
          a("Guerreros de Terracota", "Terracotta Warriors", "imperdible", false, 25, 4),
          a("Muralla de Xi'an en bicicleta", "Xi'an City Wall by bike", "experiencia", true, 12, 2),
          a("Barrio Musulmán y sus puestos", "Muslim Quarter food stalls", "comida", true, 10, 2),
          a("Gran Pagoda de la Oca Salvaje", "Giant Wild Goose Pagoda", "imperdible", true, 8, 2),
          a("Noche de puestos y bares en el Barrio Musulmán", "Night market and bars in the Muslim Quarter", "vida_nocturna", true, 15, 2),
          a("Compras de artesanías en el Barrio Musulmán", "Handicraft shopping in the Muslim Quarter", "compras", true, 10, 1.5),
        ],
      },
    ],
  },
  {
    nombre: { es: "Japón", en: "Japan" },
    alias: ["japon", "japón", "japan"],
    aerolineas: ["Japan Airlines", "ANA", "Delta", "Emirates"],
    ciudades: [
      {
        clave: "tokio",
        nombre: { es: "Tokio", en: "Tokyo" },
        peso: 3,
        costo: 1.2,
        aeropuerto: "HND",
        zonas: [z("Shinjuku"), z("Asakusa"), z("Shibuya")],
        actividades: [
          a("Templo Senso-ji en Asakusa", "Senso-ji Temple in Asakusa", "imperdible", true, 0, 2),
          a("Cruce de Shibuya y Shibuya Sky", "Shibuya Crossing and Shibuya Sky", "experiencia", false, 18, 2),
          a("Mercado exterior de Tsukiji", "Tsukiji Outer Market", "comida", true, 25, 2),
          a("teamLab Planets", "teamLab Planets", "experiencia", false, 28, 2),
          a("Santuario Meiji y Harajuku", "Meiji Shrine and Harajuku", "imperdible", true, 0, 3),
          a("Ramen en Shinjuku", "Ramen in Shinjuku", "comida", false, 12, 1),
          a("Bares e izakayas en Shibuya", "Bars and izakayas in Shibuya", "vida_nocturna", false, 25, 3),
          a("Compras en Shibuya 109 y Takeshita-dori", "Shopping at Shibuya 109 and Takeshita Street", "compras", false, 0, 2.5),
        ],
      },
      {
        clave: "kioto",
        nombre: { es: "Kioto", en: "Kyoto" },
        peso: 2,
        costo: 1.1,
        aeropuerto: "KIX",
        zonas: [z("Gion"), z("Higashiyama"), z("Centro", "Downtown")],
        actividades: [
          a("Fushimi Inari", "Fushimi Inari", "imperdible", true, 0, 3),
          a("Bosque de bambú de Arashiyama", "Arashiyama Bamboo Grove", "imperdible", true, 0, 3),
          a("Ceremonia del té", "Tea ceremony", "experiencia", false, 35, 1.5),
          a("Mercado Nishiki", "Nishiki Market", "comida", false, 20, 2),
          a("Kinkaku-ji, el Pabellón Dorado", "Kinkaku-ji, the Golden Pavilion", "imperdible", true, 4, 1.5),
          a("Bares en Pontocho y Kiyamachi", "Bars in Pontocho and Kiyamachi", "vida_nocturna", false, 20, 3),
          a("Compras en Kawaramachi", "Shopping in Kawaramachi", "compras", false, 0, 2),
        ],
      },
      {
        clave: "osaka",
        nombre: { es: "Osaka", en: "Osaka" },
        peso: 1,
        costo: 1,
        aeropuerto: "KIX",
        zonas: [z("Umeda"), z("Namba")],
        actividades: [
          a("Dotonbori de noche", "Dotonbori at night", "comida", true, 25, 3),
          a("Castillo de Osaka", "Osaka Castle", "imperdible", false, 6, 2),
          a("Acuario Kaiyukan", "Kaiyukan Aquarium", "experiencia", false, 18, 3),
          a("Salir de noche por Dotonbori y Namba", "Night out in Dotonbori and Namba", "vida_nocturna", true, 20, 3),
          a("Compras en Shinsaibashi", "Shopping at Shinsaibashi", "compras", false, 0, 2),
        ],
      },
    ],
  },
  {
    nombre: { es: "Italia", en: "Italy" },
    alias: ["italia", "italy"],
    aerolineas: ["ITA Airways", "Aerolíneas Argentinas", "Iberia", "Air Europa"],
    ciudades: [
      {
        clave: "roma",
        nombre: { es: "Roma", en: "Rome" },
        peso: 3,
        costo: 1.1,
        aeropuerto: "FCO",
        zonas: [z("Centro Storico"), z("Monti"), z("Trastevere")],
        actividades: [
          a("Coliseo y Foro Romano", "Colosseum and Roman Forum", "imperdible", true, 22, 3),
          a("Museos Vaticanos y Capilla Sixtina", "Vatican Museums and Sistine Chapel", "imperdible", false, 25, 4),
          a("Cena en Trastevere", "Dinner in Trastevere", "comida", false, 40, 2),
          a("Fontana di Trevi y Panteón a pie", "Trevi Fountain and Pantheon on foot", "imperdible", true, 0, 3),
          a("Clase de pasta fresca", "Fresh pasta class", "experiencia", false, 70, 3),
          a("Bares y vida nocturna en Trastevere", "Bars and nightlife in Trastevere", "vida_nocturna", false, 15, 3),
          a("Compras de diseño en Monti", "Design shopping in Monti", "compras", false, 0, 2),
        ],
      },
      {
        clave: "florencia",
        nombre: { es: "Florencia", en: "Florence" },
        peso: 2,
        costo: 1.05,
        aeropuerto: "FLR",
        zonas: [z("Duomo"), z("Oltrarno")],
        actividades: [
          a("Galería Uffizi", "Uffizi Gallery", "imperdible", false, 28, 3),
          a("Subida a la cúpula del Duomo", "Climb to the Duomo dome", "imperdible", true, 32, 2),
          a("Mercato Centrale", "Mercato Centrale", "comida", false, 20, 1.5),
          a("Excursión de vinos a Chianti", "Chianti wine tour", "experiencia", true, 95, 6),
          a("Aperitivo y bares en Oltrarno", "Aperitivo and bars in Oltrarno", "vida_nocturna", false, 12, 2.5),
          a("Compras de artesanías en Oltrarno", "Artisan shopping in Oltrarno", "compras", false, 15, 1.5),
        ],
      },
      {
        clave: "venecia",
        nombre: { es: "Venecia", en: "Venice" },
        peso: 1,
        costo: 1.3,
        aeropuerto: "VCE",
        zonas: [z("San Marco"), z("Cannaregio")],
        actividades: [
          a("Plaza y Basílica de San Marco", "St. Mark's Square and Basilica", "imperdible", true, 4, 2),
          a("Paseo en góndola", "Gondola ride", "experiencia", true, 90, 0.5),
          a("Cicchetti en bacari", "Cicchetti at bacari wine bars", "comida", false, 25, 2),
          a("Spritz y bares en Cannaregio", "Spritz and bars in Cannaregio", "vida_nocturna", false, 10, 2.5),
          a("Compras en Strada Nova", "Shopping on Strada Nova", "compras", false, 0, 1.5),
        ],
      },
    ],
  },
  {
    nombre: { es: "España", en: "Spain" },
    alias: ["espana", "españa", "spain"],
    aerolineas: ["Iberia", "Air Europa", "Aerolíneas Argentinas", "LATAM"],
    ciudades: [
      {
        clave: "madrid",
        nombre: { es: "Madrid", en: "Madrid" },
        peso: 2,
        costo: 1,
        aeropuerto: "MAD",
        zonas: [z("Sol"), z("Salamanca"), z("Malasaña")],
        actividades: [
          a("Museo del Prado", "Prado Museum", "imperdible", false, 17, 3),
          a("Parque del Retiro", "Retiro Park", "imperdible", true, 0, 2),
          a("Tapas en La Latina", "Tapas in La Latina", "comida", false, 30, 2),
          a("Palacio Real", "Royal Palace", "imperdible", false, 15, 2),
          a("Salir de noche por Malasaña", "Night out in Malasaña", "vida_nocturna", false, 15, 3),
          a("Compras de moda independiente en Malasaña", "Indie fashion shopping in Malasaña", "compras", false, 0, 2),
        ],
      },
      {
        clave: "barcelona",
        nombre: { es: "Barcelona", en: "Barcelona" },
        peso: 2,
        costo: 1.1,
        aeropuerto: "BCN",
        zonas: [z("Eixample"), z("Gótico", "Gothic Quarter"), z("Gràcia")],
        actividades: [
          a("Sagrada Familia", "Sagrada Família", "imperdible", false, 30, 2),
          a("Park Güell", "Park Güell", "imperdible", true, 13, 2),
          a("Mercado de La Boqueria", "La Boqueria Market", "comida", false, 20, 1.5),
          a("Barrio Gótico a pie", "Gothic Quarter on foot", "experiencia", true, 0, 3),
          a("Bares y terrazas en Gràcia", "Bars and terraces in Gràcia", "vida_nocturna", false, 15, 3),
          a("Compras vintage en Gràcia", "Vintage shopping in Gràcia", "compras", false, 0, 2),
        ],
      },
      {
        clave: "sevilla",
        nombre: { es: "Sevilla", en: "Seville" },
        peso: 1,
        costo: 0.9,
        aeropuerto: "SVQ",
        zonas: [z("Santa Cruz"), z("Triana")],
        actividades: [
          a("Real Alcázar", "Royal Alcázar", "imperdible", true, 16, 2.5),
          a("Espectáculo de flamenco", "Flamenco show", "experiencia", false, 35, 1.5),
          a("Tapeo en Triana", "Tapas crawl in Triana", "comida", false, 25, 2),
          a("Flamenco y bares en Triana", "Flamenco and bars in Triana", "vida_nocturna", false, 20, 3),
          a("Compras en Triana", "Shopping in Triana", "compras", true, 0, 1.5),
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
    const nombresPais = [...pais.alias, pais.nombre.es, pais.nombre.en].map(normalizar);
    if (nombresPais.includes(d)) return { tipo: "pais", pais };
    const ciudad = pais.ciudades.find((c) => normalizar(c.nombre.es) === d || normalizar(c.nombre.en) === d);
    if (ciudad) return { tipo: "ciudad", ciudad, pais };
  }
  return { tipo: "ciudad", ciudad: ciudadGenerica(destino.trim() || "Destino") };
}

/** Ciudad sin datos propios: actividades genéricas (para cualquier destino del mundo). */
export function ciudadGenerica(nombre: string, aeropuerto?: string, peso = 1): CiudadBase {
  return {
    clave: normalizar(nombre).replace(/[^a-z0-9]+/g, "-") || "destino",
    nombre: { es: nombre, en: nombre },
    peso,
    costo: 1,
    aeropuerto: aeropuerto || nombre.slice(0, 3).toUpperCase(),
    zonas: [z("Centro", "Downtown"), z("Barrio histórico", "Historic quarter"), z("Barrio de moda", "Trendy district")],
    actividades: [
      a(`Recorrido a pie por el centro de ${nombre}`, `Walking tour of downtown ${nombre}`, "imperdible", true, 0, 3),
      a(`Museo principal de ${nombre}`, `${nombre}'s main museum`, "imperdible", false, 15, 2.5),
      a("Mercado local y comida típica", "Local market and street food", "comida", false, 20, 2),
      a("Mirador o punto panorámico", "Scenic viewpoint", "experiencia", true, 10, 1.5),
      a("Cena en un restaurante tradicional", "Dinner at a traditional restaurant", "comida", false, 35, 2),
      a("Bares y salida nocturna en el barrio de moda", "Bars and nightlife in the trendy district", "vida_nocturna", false, 15, 3),
      a("Compras en el barrio de moda", "Shopping in the trendy district", "compras", false, 0, 2),
    ],
  };
}
