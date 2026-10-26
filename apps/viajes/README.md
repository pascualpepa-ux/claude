# Rumbo: planificador de viajes

Web app en español para armar un viaje: itinerario día por día con clima, vuelos, hoteles,
precios con su fuente y presupuesto total y por persona.

Plan completo: `docs/plans/PLAN-app-viajes-2026-10-26/PLAN-MASTER.md` (en la raíz del repo).

## Estado

Fase 1 lista: interfaz, asistente de preguntas e itinerario con **datos de ejemplo**.
Las APIs reales se conectan en la fase 3.

## Cómo probarla

```bash
cd apps/viajes
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas de la lógica (ruta, clima, presupuesto)
npm run typecheck
npm run build
```

Qué mirar:
1. Portada: `/`. Botón "Ver un ejemplo" (5 días en China, 3 viajeros).
2. Asistente: `/planificar`. Probá poner solo un país (China, Japón, Italia, España) o una ciudad.
3. Resultado: `/viaje`. Sacá o sumá actividades, elegí otro vuelo u hotel: el total se recalcula.

## Estructura

- `app/` páginas (portada, asistente, viaje)
- `components/` tarjetas de día, vuelo, hotel y resumen de presupuesto
- `lib/mock.ts` generador de datos de ejemplo (lo reemplazan los agentes en la fase 3)
- `lib/presupuesto.ts` cálculo de totales y control del rango de presupuesto
- `.env.example` claves de API para la fase 3 (nunca van en el código)
