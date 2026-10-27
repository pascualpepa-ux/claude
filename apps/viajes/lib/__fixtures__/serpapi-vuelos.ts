// Respuestas de ejemplo con la misma forma que Google Flights vía SerpApi (para pruebas, no se muestran en la web).
export const IDA = {
  search_metadata: { google_flights_url: "https://www.google.com/travel/flights?tfs=prueba" },
  best_flights: [
    {
      flights: [
        { departure_airport: { id: "MAD", time: "2026-12-05 12:20" }, arrival_airport: { id: "PEK", time: "2026-12-06 06:05" }, airline: "Air China", flight_number: "CA 908", duration: 645, airplane: "Airbus A330" },
      ],
      total_duration: 645,
      price: 980,
      departure_token: "tok-ca",
      extensions: ["1 free checked bag"],
    },
    {
      flights: [
        { departure_airport: { id: "MAD", time: "2026-12-05 09:40" }, arrival_airport: { id: "FRA", time: "2026-12-05 12:20" }, airline: "Lufthansa", flight_number: "LH 1115", duration: 160, airplane: "Airbus A321" },
        { departure_airport: { id: "FRA", time: "2026-12-05 13:55" }, arrival_airport: { id: "PEK", time: "2026-12-06 05:35" }, airline: "Lufthansa", flight_number: "LH 720", duration: 580, airplane: "Boeing 747-8" },
      ],
      layovers: [{ id: "FRA", duration: 95 }],
      total_duration: 835,
      price: 910,
      departure_token: "tok-lh",
    },
  ],
};

export const VUELTA: Record<string, unknown> = {
  "tok-ca": {
    best_flights: [
      {
        flights: [
          { departure_airport: { id: "PEK", time: "2026-12-12 01:50" }, arrival_airport: { id: "MAD", time: "2026-12-12 07:30" }, airline: "Air China", flight_number: "CA 907", duration: 760, airplane: "Airbus A330" },
        ],
        total_duration: 760,
        price: 990,
        booking_token: "b-ca",
        extensions: ["1 free checked bag"],
      },
    ],
  },
  "tok-lh": {
    best_flights: [
      {
        flights: [
          { departure_airport: { id: "PEK", time: "2026-12-12 13:40" }, arrival_airport: { id: "FRA", time: "2026-12-12 17:50" }, airline: "Lufthansa", flight_number: "LH 721", duration: 670, airplane: "Boeing 747-8" },
          { departure_airport: { id: "FRA", time: "2026-12-12 20:45" }, arrival_airport: { id: "MAD", time: "2026-12-12 23:15" }, airline: "Lufthansa", flight_number: "LH 1122", duration: 150, airplane: "Airbus A320" },
        ],
        layovers: [{ id: "FRA", duration: 175 }],
        total_duration: 995,
        price: 912,
      },
    ],
  },
};
