---
task: app-viajes
created: 2026-10-26
updated: 2026-10-26
status: in-progress
workflow: WF-FEATURE
priority: P2
---

# PLAN MASTER: App de viajes — itinerario + gastos compartidos + agentes

> Estado: **fase 1 lista, esperando revisión del usuario**. Código en `apps/viajes/`.
> Los step files (`steps/STEP-*.md`) se crean al arrancar cada fase.

## Descripción
Web app (en español, mobile-first) que arma un viaje a partir de un asistente de preguntas:
agentes buscadores + verificadores de clima, vuelos y hoteles, recomendaciones de ciudades
y actividades, itinerario día por día con precios y condiciones, calculadora de gastos
compartidos (mínimo de transferencias), viajes compartibles por link, monitoreo con
notificaciones (push + email) y deploy público. Pie de página en todas las pantallas:
"Un proyecto de Pascual Pepa".

## Fuente del pedido
- Pedido original: `prompt-app-viajes.md` (subido por el usuario el 2026-10-26)
- Workflow: WF-FEATURE (por fases, con demo de prueba al cierre de cada fase)

## 1. Investigación de APIs (consultada el 2026-10-26)

### Vuelos — búsqueda de precios
| Opción | Plan gratis / prueba | Comentario |
|---|---|---|
| ~~Amadeus Self-Service~~ | **Cerrado el 17-jul-2026** | Las claves quedaron deshabilitadas; ya no hay sandbox gratis para developers individuales. Descartado. |
| **SerpApi – Google Flights** | 250 búsquedas/mes gratis (compartidas con todos sus motores), 50/h | Precios reales de Google Flights + links para reservar. Solo lectura. **Recomendado como buscador.** |
| Duffel | Modo test gratis (aerolínea ficticia); modo live pago por orden | Sirve para probar el flujo y como 2.ª fuente cuando haya cuenta live. Opcional. |
| Ignav | 1.000 requests gratis, luego ~US$2/1.000 | Alternativa a evaluar si SerpApi queda corto. |

### Estado de vuelos (demoras, cancelaciones, puerta)
| Opción | Plan gratis | Comentario |
|---|---|---|
| **AeroDataBox** (vía RapidAPI) | ~600 unidades/mes | **Recomendado**: barato, buen dato de status/puerta. |
| AviationStack | 100 requests/mes | Respaldo. |
| FlightAware AeroAPI | Tier personal limitado | Mejor dato, pero escala caro. |

### Hoteles
| Opción | Plan gratis / prueba | Comentario |
|---|---|---|
| **SerpApi – Google Hotels** | Mismo cupo de 250/mes | Precios reales por noche/total, links oficiales. **Buscador.** |
| **LiteAPI (Nuitee)** | Sandbox key gratis al registrarse; live requiere tarjeta | Disponibilidad por noches/personas, políticas de cancelación, desayuno. **Verificador / condiciones.** |
| Booking.com Demand API | Sandbox, pero requiere ser afiliado aprobado | Para una etapa posterior. |

### Clima
| Opción | Plan gratis | Comentario |
|---|---|---|
| **Open-Meteo** | Sin clave, <10.000 llamadas/día, pronóstico hasta 16 días, CC BY 4.0 | **Buscador.** Ojo: el plan gratis es **solo uso no comercial**. |
| **OpenWeatherMap One Call 3.0** | 1.000 llamadas/día (pide tarjeta, no cobra si no se pasa) | **Verificador** (pronóstico diario 8 días). |
| Open-Meteo Historical / climatología | Gratis | Para viajes a más de 16 días: promedio histórico, marcado "baja confianza". |

### Ciudades y actividades
- **Claude API** (orquestador + recomendaciones: reparto de días por ciudad, imperdibles, comida, experiencias, armado del itinerario según el clima).
- **OpenTripMap** (datos abiertos, licencia ODbL) y/o **Google Places API (New)** (cupo gratis mensual por SKU) para validar que los lugares existan y traer coordenadas/fotos. Lo que no se pueda validar se marca "sugerencia no verificada".

### Limitación principal
250 búsquedas/mes de SerpApi alcanzan para desarrollo y uso personal, no para muchos usuarios.
Mitigación: caché de resultados (con fecha/hora y fuente), monitoreo de precios 1 vez por día
por viaje guardado, y abstracción por "proveedor" para cambiar de API sin tocar los agentes.

## 2. Stack propuesto
| Capa | Elección | Por qué |
|---|---|---|
| Front + back | **Next.js (App Router) + TypeScript** | Un solo proyecto, API routes para los agentes, fácil deploy. |
| UI | **Tailwind CSS + shadcn/ui**, PWA | Responsive mobile-first; PWA necesaria para push en el celular. |
| Base de datos + auth | **Supabase** (Postgres, login por email/magic link, Row Level Security) | Links de solo lectura / editable con RLS; plan gratis. |
| Agentes | Orquestador en TypeScript; buscadores = adaptadores por proveedor; verificadores = reglas deterministas + Claude solo donde hace falta criterio | Reglas duras en código (no se inventan precios: "no verificado" / "precio estimado"). |
| LLM | Claude API (`claude-sonnet-5-5` para recomendaciones, `claude-haiku-5-5` para extracción de condiciones) | — |
| Tareas programadas | **Vercel Cron** (o GitHub Actions si hace falta más frecuencia) | Monitoreo de precios, clima y estado de vuelos. |
| Notificaciones | **Web Push (VAPID)** + **Resend** para email | Ambos con plan gratis. |
| Tests | Vitest (lógica, división de gastos) + Playwright (flujo del asistente) | — |
| Deploy | **Vercel** + Supabase | Variables de entorno para todas las claves. |

## 3. Fases & pasos

### Fase 1: Interfaz + asistente + itinerario con datos de prueba
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 1.1 | Scaffold Next.js + Tailwind + layout con firma en el pie | ✅ | 2026-10-26 |
| 1.2 | Asistente paso a paso (origen/destino, fechas, personas, presupuesto mín/máx, aerolínea/clase, hotel, plan, equipaje) | ✅ | 2026-10-26 |
| 1.3 | Itinerario día por día + precios + condiciones + total y por persona (mocks) | ✅ | 2026-10-26 |
| 1.4 | Demo: cómo probarla | ✅ | 2026-10-26 |

### Fase 2: Calculadora de gastos compartidos
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 2.1 | Carga de gastos (quién pagó, entre quiénes) | ⬜ | - |
| 2.2 | Algoritmo de mínimas transferencias + tests | ⬜ | - |
| 2.3 | Demo | ⬜ | - |

### Fase 3: Agentes con APIs reales + verificadores
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 3.1 | Orquestador + contrato común de agentes (fuente, fecha/hora de consulta, estado verificado/estimado) | ⬜ | - |
| 3.2 | Clima: Open-Meteo + verificador OpenWeather | ⬜ | - |
| 3.3 | Hoteles: SerpApi Google Hotels + verificador LiteAPI | ⬜ | - |
| 3.4 | Vuelos: SerpApi Google Flights + verificador (recotización + reglas de horarios/escalas) | ⬜ | - |
| 3.5 | Recomendaciones de ciudades/actividades (Claude + OpenTripMap/Places) ubicadas según el clima | ⬜ | - |
| 3.6 | Manejo de errores / sin resultados + demo | ⬜ | - |

### Fase 4: Guardado, cuentas y links para compartir
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 4.1 | Supabase: esquema + auth + RLS | ⬜ | - |
| 4.2 | Links solo lectura / editable + demo | ⬜ | - |

### Fase 5: Monitoreo y notificaciones
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 5.1 | Cron: precio (umbral %), pronóstico, estado de vuelo (AeroDataBox), disponibilidad de hotel, totales | ⬜ | - |
| 5.2 | Push + email con valor anterior y nuevo; preferencias por usuario + demo | ⬜ | - |

### Fase 6: Deploy y publicación
| # | Paso | Status | Hecho |
|---|------|--------|-------|
| 6.1 | Deploy Vercel + Supabase, variables de entorno, prueba final | ⬜ | - |

## Decisiones (2026-10-26)
El usuario delegó las decisiones ("hacé lo mejor para que sea profesional y que la gente la use"):
1. Stack y plan: aprobados.
2. Código: carpeta `apps/viajes/` en este repo (se puede mover a un repo propio antes del deploy).
3. Uso: público/comercial. Antes de publicar (fase 6) hay que pasar a planes que permitan uso comercial
   (Open-Meteo comercial u OpenWeather como fuente principal; cupo pago de SerpApi).
4. Nombre de la app: Rumbo. Diseño: neutros zinc + acento teal, Geist, modo claro y oscuro automático.

## Historial
| Fecha | Cambio |
|---|---|
| 2026-10-26 | Propuesta inicial: investigación de APIs, stack y plan por fases |
| 2026-10-26 | Publicada en https://rumbotraveling.com (Vercel, proyecto `rumbo`, carpeta `apps/viajes`). Dominio comprado por el usuario, vence 26-oct-2027 con renovación automática |
| 2026-10-26 | Fase 1 completa: portada, asistente de 7 pasos, itinerario con datos de ejemplo, 10 tests |
