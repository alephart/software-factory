---
tags: [leccion, factory-server, mastra, skills, nivel-4]
creado: 2026-10-22
estado: en-prueba
item: FACTORY-11
---

# Primer recorrido completo con nuestras skills (22/10)

Volver a [[README]] · Relacionado: [[factory-server]] · [[05-mastra-factory-prueba]] · [[triage]] · [[definition-of-done]]

`factory-sandbox` #2 (agregar `parseCOP`) recorrió la Factory local de punta a punta con las skills de la fábrica:
triage → respuesta humana → plan v1 → revisión del plan (AJUSTAR) → plan v2 → revisión (AJUSTAR, aprobado por encima) →
build → review (*request changes*) → corrección automática → re-review (*approve*). Falta el merge humano.
Uso en `factory-server/docs/factory-skills.md`.

## Qué funcionó

| Pieza | Evidencia |
|---|---|
| Triage sin etiquetas y sin avanzar la tarjeta | Issues #1 y #2: bloque de la plantilla en español, la tarjeta se quedó en Triage aun con un bug ya resuelto |
| Verificar antes de opinar | El triage del #1 vio que el bug ya estaba arreglado por el PR #10 y lo dijo |
| Plan con plantilla | Fase 0 (plan al repo), escenarios con casos reales, supuestos y lo no verificado |
| Plan-reviewer independiente | En sesión nueva con Sonnet 5.5 encontró dos bloqueantes reales del plan v1 (`2M` leído como 2; `5 milagros` como 5000) |
| Builder fiel al plan vigente | Reimplementó según el v2 leyendo el issue; 57/57 casos propios pasan |
| Review con reglas del repo | Publicó *request changes* con "Para registrar en el Intake"; el builder corrigió solo; la re-review aprobó sola |

**Defensa en capas, medida.** Cada capa encontró defectos que la anterior dejó pasar:
plan-reviewer → `2M`, `milagros`; review → `parseCOP('5 constructor')` = `NaN` (clave heredada de `Object.prototype`);
el builder, al revisarse, → `5 mil millones` = 5000. Ninguno estaba en los 30 escenarios del plan ni en los 57 casos de Claude Code.
Es el argumento central para el artículo: el valor no está en un agente bueno, sino en varias miradas independientes con gates humanos.

## Defectos que encontró la prueba (y su corrección)

| # | Qué pasó | Causa | Corrección |
|---|---|---|---|
| 1 | El plan v1 y su revisión ignoraron la respuesta del autor publicada antes del plan | Las skills solo leían el triage | Skills v0.2: las respuestas humanas del hilo mandan; ignorarlas bloquea |
| 2 | **Una sesión de usuario movió la tarjeta a Building con la identidad de Juan Carlos** y arrancó el build del v1 | `factory-plan` pedía la transición en cualquier sesión; en una sesión de usuario el agente actúa como la persona | Skills v0.3: solo se pide transición con `role="plan"`/`"triage"` en `factory-phase` |
| 3 | El builder implementó el plan v1 cuando ya existía el v2 | Construye con el plan de su conversación | v0.3: el mensaje final del plan dice que el vigente es el último del issue. Regla de proceso: los planes se piden solo en la sesión de la tarjeta |
| 4 | El plan v2 se escribió dos veces en dos sesiones y la segunda cambió la estimación (5 → 2) | Sesiones sueltas escribiendo planes | Plantilla v0.2: la estimación parte del triage; `factory-plan-review` se niega a escribir planes |
| 5 | Bloqueante falso en la revisión del v2 (Sonnet 4.5) | Leyó mal el plan ("no crea docs/tasks", y sí lo decía) | `factory-plan-review` v0.3: un "bloquea" exige citar el plan y verificar que no está cubierto en otra parte |
| 6 | Ninguna review podía publicar el veredicto | Falta `MASTRACODE_PUBLIC_URL`: sin ella Mastra no entrega `factory_review_source` | Variable en `.env`; requisito documentado. **Corrige la lección de la fase 1** ("una revisión lanzada a mano no puede registrar el veredicto": la causa era esta variable) |
| 7 | La review (Haiku) dijo que no tenía la herramienta cuando sí la tenía | Repitió la conclusión de la corrida anterior sin comprobar | Usar un modelo más fuerte en review; pedir que liste herramientas si duda |
| 8 | Un comentario `@agenttic-factory-dev review` despertó al builder, que se revisó a sí mismo | Mastra trata comentarios de personas en el PR como feedback para el builder | Regla de proceso: la review se pide desde la tarjeta, no comentando |
| 9 | Webhook respondía `{"error":"unauthorized"}` | URL del webhook sin la ruta exacta `/web/github/webhook` | Documentado en requisitos |

## Modelos (una muestra por caso: orientativo)

| Etapa | Modelo | Resultado |
|---|---|---|
| Triage | Haiku 5.5 | Bien (2/2), rápido |
| Plan v1 | Haiku 5.5 | Plantilla bien; reglas contradictorias |
| Revisión plan v1 | Sonnet 5.5 | La mejor: 2 bloqueantes reales, 0 falsos |
| Plan v2 | Sonnet 4.5 | Sólido |
| Revisión plan v2 | Sonnet 4.5 | 1 bloqueante falso |
| Build | Haiku 5.5 → Sonnet 5.5 | Correcto |
| Review | Haiku 5.5 → Sonnet 5.5 | Haiku encontró el `NaN` pero se trabó con la herramienta; Sonnet 5.5 publicó bien |

La Factory tiene **un solo modelo por defecto** para todas sus corridas; solo se cambia por sesión.
Propuesta: por defecto **Sonnet 5.5**; revisión del plan con **Opus 5.5** (o Sonnet 5.5), nunca Sonnet 4.5. Medir en 3–5 issues más.

## Mejoras, por prioridad

**Alta (antes de tocar CC o Agenttia):**
1. **Build exige APROBAR publicado.** Hoy nada impide pulsar Build sin revisión del plan. Se resuelve con una `transitionPolicy` propia
   del tablero Work (`includeDefaultBoards: false` + tablero `work` propio en `src/mastra/index.ts`).
2. **Aislar la sandbox.** Con la sandbox local el agente usa el `HOME` de Juan Carlos: los commits salen a su nombre y el builder
   "renovó la credencial de `gh`". E2B o un usuario del sistema dedicado (fase 3/4).
3. **Token de revisión separado.** La review sale como comentario porque el token de revisión es el autor del PR; no satisface
   branch protection.

**Media:**
4. Modelo por defecto Sonnet 5.5 y medición con más issues.
5. **Plane.** Todo vivió en issues de GitHub; la fábrica usa Plane (Request/Inbox). Decidir: Plane como entrada y GitHub como espejo, o al revés.
6. "Para registrar en el Intake" queda como texto: falta que alguien (o una skill) lo registre.
7. Las skills de review pesan ~10–11k tokens (Mastra recomienda <5k); casi todo viene de Mastra.

**Baja:**
8. Túnel fijo (fase 3).
9. `npm run skills:test` en CI de `factory-server`.
10. Llevar al kit lo que mostró Mastra: guardia de repo en los builders, "un sondeo debe poder fallar" en el `reviewer-agent`.

## Tiempos

Issue #2: triage 18:48 → re-review aprobada 23:12 (~4,5 h de reloj, casi todo depuración y pausas humanas).
Tiempo de agente por etapa: triage ~30 s · plan ~1 min · revisión del plan ~3–5 min · build ~1 min · review + corrección + re-review ~5 min.
