import { describe, expect, it } from "vitest";
import { tieneGroserias } from "./groserias";

describe("groserías", () => {
  it("detecta malas palabras, también disfrazadas", () => {
    for (const t of [
      "sos un idiota",
      "la puta madre",
      "PUTAAA",
      "p.u.t.a",
      "qué mierda es esto",
      "m1erda",
      "hijo de puta",
      "pelotudo",
      "fuck you",
      "this is shit",
      "F*U*C*K",
      "you're a bitch",
      "Sos un estúpido",
      "che boludo",
      "andá a cagar, cagón",
      "me chupa un huevo, pelotuda",
      "qué pinche servicio, cabrón",
      "chinga tu madre",
      "conchetumare weón",
      "hijueputa malparido",
      "ctm",
      "sos un forro de mierda",
      "kiss my ass",
      "you dumbass",
      "piss off",
      "damn it",
      "what a moron",
      "go to hell asshole",
      "stupid site",
      "gtfo",
    ]) {
      expect(tieneGroserias(t), t).toBe(true);
    }
  });

  it("no bloquea preguntas normales", () => {
    for (const t of [
      "¿Cómo armo mi viaje?",
      "Can I put two cities in my trip?",
      "Necesito una computadora en el hotel",
      "Quiero ir a Putumayo",
      "Hotel en Vergara",
      "hay retardo en los vuelos?",
      "un cono de helado en Roma",
      "Disputa con la aerolínea",
      "Shiitake ramen in Tokyo",
      "Is Scunthorpe nice?",
      "Mi vuelo está retrasado, ¿qué hago?",
      "¿Llevo un forro polar para la nieve?",
      "Quiero viajar con mi perra",
      "Un hotel cerca de la calle Gil",
      "Best cocktail bars in Havana",
      "Is Assisi worth a day trip?",
      "Flights to Moroni, Comoros",
      "spicy food in Mexico",
      "Do I need my passport for this class of ticket?",
      "Shall I visit Dickens' house in London?",
      "Piscina en el hotel",
      "Bariloche en invierno",
      "¿Qué es el Cocodrilo de Matanzas?",
      "pasaje en Culebra, Puerto Rico",
      "",
    ]) {
      expect(tieneGroserias(t), t).toBe(false);
    }
  });
});
