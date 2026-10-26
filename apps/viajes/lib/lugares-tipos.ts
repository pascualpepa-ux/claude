// Tipos compartidos con el navegador (lib/lugares.ts es solo del servidor porque carga los datos).

export interface AeropuertoCercano {
  iata: string;
  nombre: string;
  ciudad: string;
  distanciaKm: number;
}

export interface Lugar {
  ciudad: string;
  region: string; // provincia o estado ("" si no se conoce)
  pais: string; // código ISO de 2 letras
  aeropuertos: AeropuertoCercano[];
}
