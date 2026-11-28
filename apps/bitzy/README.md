# Bitzy

Plataforma web de juegos estilo Roblox/Poki: un catálogo de **15.120 juegos jugables** en el navegador —con los **juegos de coches** como protagonistas— y un **Creador de juegos con IA**.

> Un proyecto de Pascual Pepa.

## Cómo funciona el catálogo

- `juegos/motores/` — 14 motores de juego en Canvas 2D. **Coches (5):** Fuga Policial (persecuciones vistas desde arriba, con nivel de calor), carreras pseudo-3D (Turbo), subida de montaña con física (Subida Extrema), circuito con derrapes y rivales (Derrape GP) y estacionamiento (Estacioná). **Otros:** serpiente, corredor infinito, plataformas, naves, rompebloques, defensa de torres, gemas match-3, ritmo y hockey de aire para 2 jugadores locales.
- **Heat City** (`public/heat-city/`) — juego especial: mundo abierto en 3D (Three.js) con autos, tiendas, teléfono y policía. Aparece destacado en la portada, en `/coches` y en el buscador (`lib/catalogo/especiales.ts`).
- `/coches` — sección propia de coches (desafío de coches del día, filas por tipo); el juego destacado de la portada siempre es de coches.
- `lib/catalogo/generador.ts` — cada motor se multiplica por **12 temáticas × 5 dificultades × 3 modos × 6 mapas = 1.080 variantes**, cada una con nombre, portada (SVG generado), descripción y estadísticas propias.
- Todo es **determinístico**: la semilla sale del id (`naves-42`), así que el mismo juego es siempre idéntico (mapas, niveles, enemigos, portada).
- Agregar un motor = un archivo en `juegos/motores/` + una entrada en `lib/catalogo/motores.ts` → suma 1.080 juegos más.
- El código de cada motor se descarga recién al jugar (`juegos/motores/index.ts`, import dinámico).
- `juegos/runtime/` — bucle de paso fijo, teclado/mouse/táctil, sonido sintetizado con Web Audio, partículas, fondos temáticos, pausa y fin de partida.

## Creador con IA

- `/crear`: chat a la izquierda, vista previa jugable a la derecha (iframe con `sandbox="allow-scripts"`), micrófono (Web Speech API), sugerencias rápidas, plantillas e historial de versiones.
- Con `ANTHROPIC_API_KEY`, Claude escribe el juego HTML completo y lo modifica pedido a pedido (`lib/creador/ia.ts`), con límite de gasto mensual (`lib/gasto.ts`).
- Sin clave (o si se supera el límite), un intérprete local entiende pedidos comunes («hacé la nave más rápida», «agregá un jefe final», «colores neón», «modo dos jugadores»…) y arma el juego con un mini motor (`lib/creador/motor-html.ts`).
- Publicar sube el juego a «Hechos por la comunidad»; cada juego tiene Remix (copia con crédito al original), likes y Compartir.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # catálogo, motores (simulación jugando automáticamente) e intérprete del Creador
npm run build
```

Variables: ver `.env.example`.

## Estado por fases

- **Fase 1 (hecha):** marca Bitzy, sección de coches con 4 motores, diseño, inicio con filas, explorador con búsqueda/filtros y grilla virtualizada, ruleta al azar, ficha SEO de cada juego (+ imagen para redes), reproductor, 10 motores, generador de variantes, Creador con IA, comunidad, remix, compartir/insertar, desafío del día (juego y cuenta regresiva).
- **Fase 2:** cuentas (email y Google), monedas, niveles, logros, ranking del desafío diario con premios y el juego nuevo automático de cada día (tarea programada + control de calidad + panel de administración).
- **Fase 3:** multijugador online (salas con código y partida rápida por WebSockets) y concursos semanales.
- **Fase 4:** tienda y pagos con Stripe, y más motores (hasta 40–60).
