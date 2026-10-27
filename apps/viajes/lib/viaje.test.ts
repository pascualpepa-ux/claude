import { describe, expect, it } from "vitest";
import { sumarDias } from "./fechas";
import { aplicarClima, generarViaje, repartirNoches, traducirViaje, viajeDeMuestra } from "./mock";
import { calcularResumen } from "./presupuesto";

describe("repartirNoches", () => {
  it("reparte todas las noches respetando el peso", () => {
    expect(repartirNoches([3, 2], 5)).toEqual([3, 2]);
    expect(repartirNoches([3, 2, 2], 10).reduce((s, n) => s + n, 0)).toBe(10);
  });

  it("da al menos una noche por ciudad y no usa más ciudades que noches", () => {
    expect(repartirNoches([3, 2, 2], 2)).toHaveLength(2);
    expect(repartirNoches([3, 2, 2], 3)).toEqual([1, 1, 1]);
  });
});

describe("generarViaje", () => {
  it("con solo el país sugiere ciudades: 5 días en China son Beijing y Shanghái", () => {
    const plan = generarViaje(viajeDeMuestra());
    expect(plan.rutaSugerida).toBe(true);
    expect(plan.ruta.map((r) => r.ciudad)).toEqual(["Beijing", "Shanghái"]);
    expect(plan.dias).toHaveLength(6);
    expect(plan.traslados).toHaveLength(1);
  });

  it("con una ciudad no sugiere ruta", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), destino: "Lisboa" });
    expect(plan.rutaSugerida).toBe(false);
    expect(plan.ruta).toEqual([{ clave: "lisboa", ciudad: "Lisboa", dias: 5, aeropuerto: "LIS" }]);
  });

  it("no pone actividades al aire libre en días de lluvia", () => {
    const base = viajeDeMuestra();
    for (let i = 0; i < 20; i++) {
      const ida = sumarDias(base.fechaIda, i * 7);
      const plan = generarViaje({ ...base, fechaIda: ida, fechaVuelta: sumarDias(ida, 9), destino: "Japón" });
      for (const dia of plan.dias) {
        if (dia.clima.condicion !== "lluvia" && dia.clima.condicion !== "tormenta") continue;
        for (const id of dia.actividades) {
          expect(plan.actividades.find((a) => a.id === id)?.aireLibre).toBe(false);
        }
      }
    }
  });

  it("marca como no verificado el hotel preferido que no se pudo confirmar", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), destino: "Roma", hotelPreferido: "Hotel Artemide" });
    const elegido = plan.hoteles.roma.find((h) => h.id === plan.hotelElegido.roma);
    expect(elegido?.nombre).toBe("Hotel Artemide");
    expect(elegido?.origen.estado).toBe("no_verificado");
  });

  it("es determinístico para el mismo pedido", () => {
    const input = viajeDeMuestra();
    const a = generarViaje(input);
    const b = generarViaje(input);
    expect(a.vuelos.map((v) => v.precioPorPersona)).toEqual(b.vuelos.map((v) => v.precioPorPersona));
  });
});

describe("calcularResumen", () => {
  it("el total es la suma de las líneas y se divide por persona", () => {
    const plan = generarViaje(viajeDeMuestra());
    const r = calcularResumen(plan);
    expect(r.total).toBeCloseTo(r.lineas.reduce((s, l) => s + l.monto, 0));
    expect(r.porPersona).toBeCloseTo(r.total / 3);
  });

  it("avisa cuando el viaje se pasa del presupuesto", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), presupuestoMin: 100, presupuestoMax: 500 });
    const r = calcularResumen(plan);
    expect(r.rango.estado).toBe("excedido");
    expect(r.rango.diferencia).toBeCloseTo(r.porPersona - 500);
  });

  it("compara contra el total cuando el presupuesto es por grupo", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), modoPresupuesto: "total", presupuestoMin: 0, presupuestoMax: 1_000_000 });
    const r = calcularResumen(plan);
    expect(r.rango.comparado).toBeCloseTo(r.total);
    expect(r.rango.estado).toBe("dentro");
  });
});

describe("idiomas", () => {
  it("genera el mismo viaje en inglés con nombres traducidos y los mismos precios", () => {
    const es = generarViaje(viajeDeMuestra(), "es");
    const en = generarViaje(viajeDeMuestra(), "en");
    expect(en.ruta.map((r) => r.ciudad)).toEqual(["Beijing", "Shanghai"]);
    expect(en.actividades[0].nombre).toBe("Great Wall at Mutianyu");
    expect(en.dias[0].nota).toMatch(/^Arrival in Beijing/);
    expect(calcularResumen(en).total).toBeCloseTo(calcularResumen(es).total);
    expect(calcularResumen(en).lineas[0].concepto).toBe("Flights");
  });

  it("al cambiar de idioma conserva el vuelo, los hoteles y las actividades elegidas", () => {
    const es = generarViaje(viajeDeMuestra(), "es");
    const editado = {
      ...es,
      vueloElegido: "vuelo-2",
      hotelElegido: { ...es.hotelElegido, beijing: "beijing-hotel-0" },
      dias: es.dias.map((d, i) => (i === 1 ? { ...d, actividades: [] } : d)),
    };
    const en = traducirViaje(editado, "en");
    expect(en.idioma).toBe("en");
    expect(en.vueloElegido).toBe("vuelo-2");
    expect(en.hotelElegido.beijing).toBe("beijing-hotel-0");
    expect(en.dias[1].actividades).toEqual([]);
    expect(calcularResumen(en).total).toBeCloseTo(calcularResumen(editado).total);
  });

  it("reconoce destinos escritos en inglés", () => {
    expect(generarViaje({ ...viajeDeMuestra(), destino: "Japan" }, "en").ruta[0].ciudad).toBe("Tokyo");
  });

  it("con un país sin datos propios arma la ruta con sus ciudades principales", () => {
    const plan = generarViaje({
      ...viajeDeMuestra(),
      destino: "Perú",
      ciudadesDestino: [
        { ciudad: "Lima", iata: "LIM" },
        { ciudad: "Arequipa", iata: "AQP" },
      ],
    });
    expect(plan.rutaSugerida).toBe(true);
    expect(plan.ruta.map((r) => r.ciudad)).toEqual(["Lima", "Arequipa"]);
    expect(plan.vuelos[0].ida.hasta).toBe("LIM");
    expect(plan.vuelos[0].vuelta.desde).toBe("AQP");
  });

  it("usa el aeropuerto de llegada elegido", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), destino: "Roma", aeropuertoDestino: "CIA" });
    expect(plan.vuelos[0].ida.hasta).toBe("CIA");
  });
});

describe("clima real", () => {
  it("usa el clima de los agentes, reacomoda actividades y no inventa cuando falta", () => {
    const base = generarViaje({ ...viajeDeMuestra(), destino: "Lisboa" });
    const iata = base.ruta[0].aeropuerto;
    const datos = {
      [iata]: Object.fromEntries(
        base.dias.map((d, i) => [
          d.fecha,
          {
            fecha: d.fecha,
            tipo: i === 0 ? ("sin_datos" as const) : ("pronostico" as const),
            condicion: "lluvia" as const,
            maxima: 18,
            minima: 11,
            probLluvia: 90,
            estado: "verificado" as const,
            fuente: "Open-Meteo + MET Norway",
            consultadoEn: new Date().toISOString(),
          },
        ]),
      ),
    };
    const plan = aplicarClima(base, datos, "es");
    expect(plan.climaReal).toBe(true);
    expect(plan.dias[0].clima.tipo).toBe("sin_datos");
    expect(plan.dias[1].clima).toMatchObject({ maxima: 18, condicion: "lluvia", tipo: "pronostico" });
    expect(plan.dias[1].clima.origen.fuente).toBe("Open-Meteo + MET Norway");
    // Con lluvia todos los días, ninguna actividad al aire libre.
    const aireLibre = new Set(plan.actividades.filter((a) => a.aireLibre).map((a) => a.id));
    expect(plan.dias.flatMap((d) => d.actividades).some((id) => aireLibre.has(id))).toBe(false);
    // Al traducir, se conserva el clima real.
    expect(traducirViaje(plan, "en").dias[1].clima.maxima).toBe(18);
  });
});
