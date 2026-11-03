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
| **1A** | Skills más chicas | Analizar las skills de Mastra (qué ítems y gates cubren, qué instrucciones mejoran la herramienta), tomar lo mejor y escribir las nuestras cortas: `factory-review`/`factory-rereview` propias, lo de consulta a `references/`, recortar triage/plan/plan-review. Las mejoras de Mastra se siguen leyendo con `skills:upstream` (decidido el 02/11) | **Hecho (02/11, noche)** con ajustes: triage/plan/plan-review no se recortan; skills en inglés. Falta medir |
| **1A** | Respuestas más cortas | Presupuesto de largo en cada salida (triage, plan, veredictos): la salida cuesta más que la entrada y cada etapa siguiente la relee | **Hecho (02/11, noche)**, valores holgados. Falta medir |
| 2 | Modelo por etapa | **Contribuir código a Mastra** (el manejo manual no es factible; decidido el 02/11). Meta: Haiku en triage, **Sonnet en build** (código) y en review, Opus solo en la revisión del plan | Por investigar |
| 3 | Carril express | Ítems de ≤ 2 puntos sin revisión del plan: la persona pone `plan:aprobado` a mano (aprobar sin revisión, ya documentado). Criterio en la plantilla de triage | Por hacer |
| 4 | Memoria observacional | Medir su costo y si se puede limitar en las sesiones de la Factory | Por investigar |
| — | Caché de 5 minutos | Descartado (fijo en el código y probablemente peor para la sesión de la tarjeta) | Descartado |

**Antes de cambiar, medir por etapa.** La consola da el costo por día y modelo, no por sesión. Línea base: un ítem nuevo, anotando la hora de
cada etapa y el uso por hora; y revisar si la UI de Mastra muestra tokens por sesión. Cada palanca se evalúa con un ítem de prueba antes de adoptarla.

## 1A: skills de review propias, skills en inglés y salidas con presupuesto (02/11, noche)

Definido con Juan Carlos el 02/11 en la noche, punto por punto. Cambios en `factory-server` (rama `factory-12/skills-cortas`).
Qué se tomó de las reviews de Mastra y qué no: registro en `factory-server/docs/factory-skills-upstream.md` (fila del 02/11).

**Decisiones:**
- **Reviews propias y cortas** (lo de la fila 1A). La review carga ~10,7 KB al empezar y ~6,4 KB al publicar (`references/publish.md`, que se
  lee al final), frente a ~51 KB de la generada (re-review: ~57 KB). Las páginas de categorías de Mastra se leen solo si aplican.
- **Triage, plan y plan-review no se recortan:** vuelven a sus versiones (0.6 / 0.7 / 0.6) y solo ganan el presupuesto de largo y no repetir
  lo publicado en el mensaje final (0.7 / 0.8 / 0.7; plantilla v0.3). La fila 1A decía "recortar triage/plan/plan-review"; se descartó.
- **Las cinco skills en inglés** (palanca nueva: el inglés cuesta menos tokens que el español). Copia en español para leer en
  `factory-server/docs/skills-es/`, con la misma versión (`skills:test` lo verifica). **Lo que publican en GitHub sigue en español.**
- **Publicación como Mastra:** en un PR de la Factory, comentario con la advertencia "Factory misconfiguration"; en un PR de una persona,
  review de GitHub (`factory-verdict` da "PR humano: no aplica", decidido y probado el 24/10).
- **Sin informe de pruebas aparte** (la verificación va en el veredicto; la publicación del check ya estaba desactivada) y **sin PRs de
  seguimiento** (lo no bloqueante queda como hallazgo).
- **Presupuesto de largo (holgado):** triage ≤ 400 palabras · plan ≤ 900 / 1500 / 2500 según puntos (1–3 / 5–8 / 13) · revisión del plan ≤ 500 ·
  veredicto ≤ 350 (approve) o ≤ 500 (request changes), +100 en re-review. Medido el 02/11 en el sandbox: triage 480–570, plan 1.290–1.550
  (cambio de dos líneas), revisión del plan 520–700, veredicto 390–540 más informe de pruebas 70–140.

**Corrección:** en la primera versión de esta sección (misma noche) se anotó como "hueco" que la review de Mastra dejaba en *pending* los
PRs de personas. Era un error: `factory-verdict` excluye a propósito los PRs de personas (24/10, PR #13). Se retiró.

**Protección:** `pnpm skills:test` falla si una skill pasa su tope de bytes, pierde un contrato que lee el servidor (`Verdict:`/`Reviewed head:`,
marcadores, herramientas) o su copia en español tiene otra versión. Se retiró el generador de reviews (`build-review-skills`, `reglas-del-repo`).

**Dónde está:** `factory-server` PR #12 (rama `factory-12/skills-cortas`), sin fusionar ni desplegar. Las reviews siguen en 1.0
(nunca se desplegaron). Mastra 0.26 (paquete `@mastra/factory`, salió el 02/11) sigue sin revisar: procedimiento de
`docs/factory-skills-upstream.md`.

### El proceso no cambia (comparado el 02/11 contra `docs/factory-skills.md`, `factory-verdict` y el código de Mastra 0.24)

| Paso | Antes (Mastra + `reglas-del-repo`) | Con nuestras reviews | Por qué es igual |
|---|---|---|---|
| Review desde la tarjeta | Mastra invoca `factory-review`; `factory-rereview` si ya hay veredicto | Igual | El tablero las llama por nombre (`boards/review.js`); `skills:test` comprueba que el servidor sirve las nuestras |
| PR y checkout | De `$ARGUMENTS` (el head ya está en la sesión) | Igual | Se agregó al revisar la paridad (commit `fbf6eac`) |
| Veredicto en el PR | `Verdict:` en la 1.ª línea y `Reviewed head:` con el SHA completo; comentario con la advertencia "Factory misconfiguration" si la App es la autora; review de GitHub en PRs de personas | Igual | Son las dos líneas que parsean Mastra y `factory-verdict` |
| `factory-verdict` | Lee comentarios del bot sin editar; cuenta rondas; desde 2, además una persona | Igual | Cada pasada publica un comentario nuevo |
| *Request changes* → builder | Mastra despierta al builder por la 1.ª línea del comentario | Igual | `requestsChangesVerdict` solo mira esa línea |
| Push → re-review | Automática, con el head anterior en los argumentos | Igual; ahora usa ese head | Antes lo buscaba en los comentarios |
| Etiquetas | `status:auto-approved` / `status:changes-requested` | Igual | — |
| Cierre | `factory_record_review_verdict`; tarjeta en Reviewing; merge humano | Igual, con la línea "el merge es humano" | Esa línea de `reglas-del-repo` faltaba y se agregó |
| Reglas de la fábrica | `reglas-del-repo` v0.3 (8 reglas) | Integradas en `factory-review` | Lectura desde la rama base, plan como especificación, `AGENTS.md`, ADR, tenancy, frontera, gate de regresión, CI en rojo bloquea, Intake |
| Seguridad | Destino verificado, inyección, credenciales, scripts antes de ejecutar | Igual | — |

**Diferencias decididas el 02/11:** sin informe de pruebas aparte (la verificación va en el veredicto), sin PRs de seguimiento, veredicto
en español con presupuesto de largo, mensaje final corto, skills en inglés.

**Índice de categorías (decidido el 02/11):** Mastra obliga a leer `references/categories/README.md` antes del diff; la nuestra lo lee solo si
el cambio no es trivial. Se mantiene así, pero **se puede volver obligatorio como en Mastra** cambiando el paso 5 de la sección 1 de
`factory-review` (y su copia en español). Anotado también en `factory-server/docs/factory-skills.md` y en el registro de Mastra.

### Plan de pruebas (después de fusionar y desplegar el PR #12)

Las skills nuevas se dan por buenas solo con este recorrido en `factory-sandbox` (regla de `AGENTS.md`).

1. **Antes:** el autodeploy de Railway ya está apagado (FACTORY-11; confirmado el 02/11), así que el merge no despliega solo; *Deploy Latest Commit* (`Cmd + K`) con `skills:test`, `board:test`,
   `deploy:test` y `build` en verde en el log; *Auto-approve tools* activo; anotar la hora de inicio.
2. **Issue nuevo de ~2 puntos, de punta a punta**, anotando la hora de cada etapa:
   - Triage: bloque en español, ≤ 400 palabras; la tarjeta no se mueve; mensaje final de una línea.
   - Respuesta humana en comentario nuevo → Planning.
   - Plan: comentario nuevo, ≤ 900 palabras, no se repite en la conversación.
   - Revisión del plan en sesión nueva: ≤ 500 palabras; pone o quita `plan:aprobado`.
   - Build → PR.
3. **Review:** veredicto con `Verdict:` + `Reviewed head:` + advertencia; ≤ 350 (approve) o ≤ 500 (request changes); etiquetas `status:*`;
   `factory-verdict` en verde o rojo según corresponda; tarjeta en Reviewing; **no** sale informe de pruebas aparte ni PR de seguimiento.
   Anotar si leyó el índice de categorías.
4. **Un *request changes***, como el 02/11 (PR #22): un commit roto → la re-review pide cambios → el builder corrige → la re-review aprueba.
   Revisar la sección "Pasada anterior" (atendido, parcial, abierto, refutado, invalidado) y que `factory-verdict` cuente 1 ronda.
5. **Un PR abierto por una persona:** la review sale como review de GitHub; `factory-verdict` da "PR humano: no aplica".
6. **Medición:** costo del día en *Usage* de Anthropic (por modelo) frente al 29/10 (USD 8,85) y al 02/11 (USD 6,81); largo real de cada
   salida frente a su presupuesto. Si algo se queda corto, se ajusta el presupuesto con esos datos.

Resultado de cada punto: anotarlo aquí y en [[00-estado-actual]].
