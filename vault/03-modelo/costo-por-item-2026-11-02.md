---
tags: [modelo, costo, factory-server]
creado: 2026-11-02
estado: en-curso
item: FACTORY-12
---

# Costo de la Factory por ítem (02/11)

Volver a [[README]] · Plan: [[plan-fabrica-2026-10-24]] · Estado: [[00-estado-actual]]

## Medición (27/10 – 02/11)

**Railway (workspace Factory, Hobby):** USD 1,66 en ~6,5 días; estimado del ciclo USD 3,30, dentro de los USD 5 incluidos → **USD 5/mes fijos**
(frente a ~USD 48 del Droplet). El 95% es memoria en reposo (`factory` ~490 MB, `postgres` ~100 MB). Casi no depende del número de ítems.
**Decisión E confirmada: la Factory se queda en Railway.**

**Anthropic (todos los workspaces; solo hubo gasto los días de recorrido):**

| Día | Recorrido | Sonnet 5.5 | Opus 5.5 | Haiku 4.5 | Total |
|---|---|---|---|---|---|
| 29/10 | #19: triage, plan v1 → AJUSTAR, v2 → APROBAR, build, review, re-review | 5,09 | 3,65 (2 revisiones de plan) | 0,12 | **8,85** |
| 02/11 | #21 con 3 re-reviews + reviews del PR #23 y del *Update branch* del #22 | 4,71 | 1,86 (1 revisión de plan) | 0,24 | **6,81** |

- **~USD 6–7 por ítem en el camino feliz**, aunque el cambio sea de dos líneas: el costo lo pone el número de sesiones (triage, plan, revisión
  del plan, build, review) y el contexto que cada una relee en cada vuelta, no el tamaño del cambio.
- Caché: **97,6% de la entrada se lee del caché** (Sonnet y Opus al 100%). No es el problema. ~12 M de tokens de entrada en dos días (~5–6 M por ítem).
- Revisión del plan con Opus: ~USD 1,8 por revisión (25–40% del ítem). En el #19 encontró un bloqueante real.
- Proyección: 10 ítems/mes ≈ USD 75; 20 ≈ USD 145, más los USD 5 de Railway. **No escala así: hay que bajarlo.**

## Lo que dice el código de Mastra (0.24, revisado el 02/11; 0.26 salió el mismo día)

- **Modelo por etapa: no se puede configurar.** Hay un modelo por defecto por proyecto, que usan la sesión de la tarjeta (triage, plan, build)
  y la de review. Existe la herramienta `factory_switch_session_model`, pero solo en sesiones de usuario con una persona: una sesión de tarjeta
  no puede cambiar su propio modelo. Cambiar de modelo a mitad de sesión además invalida el caché (se reescribe todo el contexto).
- **Caché de 1 hora: fijo en el código** (`ANTHROPIC_PROMPT_CACHE_TTL = "1h"` en `@mastra/code-sdk`). Cambiarlo exige parchear `node_modules`
  (prohibido). Y probablemente conviene: la sesión de la tarjeta corre triage, plan y build con esperas humanas entre etapas; con 5 minutos se perdería.
  **Esta palanca se descarta.**
- **Haiku sale de la memoria observacional** de Mastra (*observer*/*reflector*), que corre llamadas extra. La memoria tiene ajustes por proyecto: hay que medir cuánto cuesta y si se puede limitar.
- **Tamaño de las skills** (aprox.): `factory-review` ~10–12 k tokens, `factory-rereview` ~11–14 k (casi todo es la skill de Mastra; lo nuestro, ~1 k);
  `factory-triage` ~3,5 k, `factory-plan-review` ~3 k, `factory-plan` ~3 k + plantilla ~1 k. Se pagan en cada vuelta de cada sesión.

## Plan de reducción (decidido por Juan Carlos el 02/11)

| Prioridad | Palanca | Qué | Estado |
|---|---|---|---|
| **1A** | Skills más chicas | Analizar las skills de Mastra (qué ítems y gates cubren, qué instrucciones mejoran la herramienta), tomar lo mejor y escribir las nuestras cortas: `factory-review`/`factory-rereview` propias, lo de consulta a `references/`, recortar triage/plan/plan-review. Las mejoras de Mastra se siguen leyendo con `skills:upstream` (decidido el 02/11) | Por hacer |
| **1A** | Respuestas más cortas | Presupuesto de largo en cada salida (triage, plan, veredictos): la salida cuesta más que la entrada y cada etapa siguiente la relee | Por hacer |
| 2 | Modelo por etapa | **Contribuir código a Mastra** (el manejo manual no es factible; decidido el 02/11). Meta: Haiku en triage, **Sonnet en build** (código) y en review, Opus solo en la revisión del plan | Por investigar |
| 3 | Carril express | Ítems de ≤ 2 puntos sin revisión del plan: la persona pone `plan:aprobado` a mano (aprobar sin revisión, ya documentado). Criterio en la plantilla de triage | Por hacer |
| 4 | Memoria observacional | Medir su costo y si se puede limitar en las sesiones de la Factory | Por investigar |
| — | Caché de 5 minutos | Descartado (fijo en el código y probablemente peor para la sesión de la tarjeta) | Descartado |

**Antes de cambiar, medir por etapa.** La consola da el costo por día y modelo, no por sesión. Línea base: un ítem nuevo, anotando la hora de
cada etapa y el uso por hora; y revisar si la UI de Mastra muestra tokens por sesión. Cada palanca se evalúa con un ítem de prueba antes de adoptarla.
