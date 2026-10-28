// Tableros de salidas con la forma de AeroDataBox (para pruebas, no se muestran en la web).
const salida = (numero: string, aerolinea: string, desde: string, hasta: string, sale: string, llega: string, saleUtc: string, llegaUtc: string, avion: string, extra = {}) => ({
  number: numero,
  codeshareStatus: "IsOperator",
  isCargo: false,
  airline: { name: aerolinea },
  aircraft: { model: avion },
  departure: { airport: { iata: desde }, scheduledTime: { local: sale, utc: saleUtc } },
  arrival: { airport: { iata: hasta }, scheduledTime: { local: llega, utc: llegaUtc } },
  ...extra,
});

export const TABLEROS: Record<string, unknown[]> = {
  EZE: [
    salida("IB 6856", "Iberia", "EZE", "MAD", "2026-11-26 13:15-03:00", "2026-11-27 05:30+01:00", "2026-11-26 16:15Z", "2026-11-27 04:30Z", "Airbus A350-900"),
    salida("UX 42", "Air Europa", "EZE", "MAD", "2026-11-26 14:30-03:00", "2026-11-27 06:40+01:00", "2026-11-26 17:30Z", "2026-11-27 05:40Z", "Boeing 787-9"),
    salida("AR 1132", "Aerolíneas Argentinas", "EZE", "MAD", "2026-11-26 15:35-03:00", "2026-11-27 07:45+01:00", "2026-11-26 18:35Z", "2026-11-27 06:45Z", "Airbus A330-200"),
    salida("IB 4321", "LATAM", "EZE", "MAD", "2026-11-26 16:00-03:00", "2026-11-27 08:00+01:00", "2026-11-26 19:00Z", "2026-11-27 07:00Z", "Airbus A350-900", { codeshareStatus: "IsCodeshared" }),
    salida("AA 900", "American Airlines", "EZE", "MIA", "2026-11-26 21:00-03:00", "2026-11-27 05:00-05:00", "2026-11-27 00:00Z", "2026-11-27 10:00Z", "Boeing 777-200"),
  ],
  AEP: [],
  MAD: [
    salida("IB 6855", "Iberia", "MAD", "EZE", "2026-12-02 23:55+01:00", "2026-12-03 08:50-03:00", "2026-12-02 22:55Z", "2026-12-03 11:50Z", "Airbus A350-900"),
    salida("UX 41", "Air Europa", "MAD", "EZE", "2026-12-02 23:45+01:00", "2026-12-03 08:30-03:00", "2026-12-02 22:45Z", "2026-12-03 11:30Z", "Boeing 787-9"),
    salida("AR 1133", "Aerolíneas Argentinas", "MAD", "EZE", "2026-12-02 12:40+01:00", "2026-12-02 20:55-03:00", "2026-12-02 11:40Z", "2026-12-02 23:55Z", "Airbus A330-200"),
  ],
};
