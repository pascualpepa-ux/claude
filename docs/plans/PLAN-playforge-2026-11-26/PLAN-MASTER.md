---
task: playforge
created: 2026-11-26
updated: 2026-11-26
status: in-progress
workflow: WF-FEATURE
priority: P2
---

# PLAN MASTER: Playforge — plataforma de juegos + Creador con IA

Código en `apps/playforge/`. Pedido del usuario (2026-11-26): catálogo ≥ 10.535 juegos jugables generados
de 40–60 motores, Creador con IA, desafío diario, juego nuevo automático por día, multijugador online,
remix, compartir, concursos, moneda/tienda (Stripe), cuentas, niveles y logros. Firma en el pie: "Un proyecto de Pascual Pepa".

## Fases

| # | Fase | Estado | Hecho el |
|---|------|--------|----------|
| 1 | Diseño, inicio, 10 motores, generador de variantes (10.800 juegos), Creador con IA, comunidad, remix, compartir | ✅ | 2026-11-26 |
| 2 | Cuentas (email + Google), monedas, niveles, logros, ranking del desafío diario, juego nuevo automático diario + panel admin | ⬜ | |
| 3 | Multijugador online (salas con código + partida rápida), concursos semanales | ⬜ | |
| 4 | Tienda + Stripe, más motores hasta 40–60 | ⬜ | |

## Decisiones (fase 1)
- Canvas 2D propio en vez de Phaser: carga instantánea, sin dependencia pesada, motores chicos y con import dinámico.
- Catálogo 100 % determinístico generado en código (sin base de datos): 12 temas × 5 dificultades × 3 modos × 6 mapas por motor.
- Almacén de documentos Postgres (JSONB) con respaldo en archivo local.
- Creador: Claude (claude-opus-5-5, con fallbacks del servidor y límite de gasto) + intérprete local como respaldo.

## Handoff Payload (para la fase 2)
- do_not_redo: catálogo, motores, reproductor, Creador, comunidad, compartir/insertar ya funcionan y tienen tests (`npm test`).
- watch_out: no usar `transform` en contenedores de página (rompe el reproductor `fixed`); ver GOTCHAS G008.
- next_inputs: `lib/almacen.ts` (persistencia), `lib/gasto.ts` (límite IA compartido con el juego diario), `components/Reproductor.tsx` (`onFin` para enviar puntajes al ranking).

## Lịch sử cập nhật
| Fecha | Cambio |
|---|---|
| 2026-11-26 | Plan creado; fase 1 completada |
