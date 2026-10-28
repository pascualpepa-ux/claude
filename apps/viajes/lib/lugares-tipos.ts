// Tipos compartidos con el navegador (lib/lugares.ts es solo del servidor porque carga los datos).

export interface AeropuertoCercano {
  iata: string;
  nombre: string;
  ciudad: string;
  distanciaKm: number;
  internacional?: boolean; // aeropuerto grande, con vuelos internacionales
}

/** Ciudad principal de un país, con su aeropuerto más cercano (para sugerir rutas). */
export interface CiudadPrincipal {
  ciudad: string;
  iata: string;
}

export interface Lugar {
  tipo: "ciudad" | "pais";
  ciudad: string; // "" cuando es un país
  region: string; // provincia o estado ("" si no se conoce)
  pais: string; // código ISO de 2 letras
  aeropuertos: AeropuertoCercano[];
  ciudades?: CiudadPrincipal[]; // solo países: sus ciudades principales con aeropuerto
}
