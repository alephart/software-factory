---
tags: [leccion, retrospectiva, metricas, caso-1]
creado: 2026-10-10
estado: borrador — prod hecho; falta habilitar ORIANA (Go del cliente) y las horas
---

# Lección 4 — Caso 1 de punta a punta: retrospectiva medida

Volver a [[README]] · Antes: [[03-proceso-interno-interfaz-simple]] · Flujo: [[flujo-planning-a-done]] · Madurez: [[escalera-de-madurez]]

> El caso 1 (precios del catálogo de IMEC) es el **primer ítem que recorrió el flujo completo**:
> Request → triage → planning con revisor → building con reviewer → staging con regresión → runbook de salida.
> Se escribió antes del Go a prod y se completó el 10/10 con la salida. Falta la última fila: ORIANA habilitada en prod tras el Go del cliente.

## Fuentes

- Plane: REQUEST-1, AGENT-37, AGENT-38, REQUEST-8, PLATFORM-59 (comentarios por fase) y Request.
- GitHub: PR #218 (AGENT-38) y PR #223 (`cc-stage` → `master`, draft), con fechas de commits.
- Repo, rama `cc-stage`: `docs/tasks/platform-59-results/` (línea base, candidato, A/B, precios) y `platform-59-salida-a-prod.md`.
- Vault: `03-modelo/calibracion/platform-59-comparacion.md`.

**Límite de los datos:** solo hay tiempo **transcurrido** (marcas de Plane y de commits), no horas de esfuerzo.
Las fechas de autor de los commits se agrupan al final de cada sesión, así que sirven para ordenar, no para medir duración fina.

## Línea de tiempo (hora de Bogotá)

| Fecha | Hito | Etapa |
|---|---|---|
| 03/10 18:05 | REQUEST-1 entra por intake | Intake |
| 03/10 20:58 | Triage: se divide en AGENT-37 (prompt, Nicole) y AGENT-38 (datos, Juan Carlos) | Triage |
| 03/10 22:16 | Nicole rechaza la "solución provisional" (era lo que ya pasaba) → [[03-proceso-interno-interfaz-simple]] | Planning |
| 03/10 23:02 | Escenarios de AGENT-37 aprobados por producto | Gate de especificación |
| 05/10 | Plan de AGENT-38 aprobado (tool genérica, conector por cliente) | Planning |
| 05/10 23:06 | REQUEST-8: CC no tiene staging parecido a prod | Intake |
| 06/10 05:42 | Triage de REQUEST-8 → PLATFORM-59 (bloquea AGENT-38) y PLATFORM-60 | Triage |
| 06/10 23:24 | PR #218 abierto; el `reviewer-agent` encuentra un bloqueante, se corrige, segunda pasada APROBADA | Building + Review |
| 07/10 | Plan de PLATFORM-59 v1 → revisión humana + `plan-reviewer-agent` → AJUSTAR | Planning |
| 07–09/10 | v2 → v2.1 (un bloqueante) → v2.2 aprobada | Planning |
| 08/10 00:10 | Primer commit de `cc-stage` | Building |
| 08/10 | Fases 0–4: inventario, Supabase cc-staging, Railway, seed (G1, G2, G4) | Building |
| 09/10 02:10 | Fases 5–6: arnés de regresión y línea base | Review |
| 09/10 13:53 | Fase 7: PR #218 mergeado a `cc-stage` | Review |
| 09/10 16:44 | Fase 8: candidato + A/B; Nicole aprueba el texto de PRECIOS | Review |
| 09/10 19:32 | Fase 9: precios en cc-staging, escenarios con el modelo real | Review |
| 10/10 08:03 | Fase 10 y PR #223 en draft; salida a prod **en pausa** | Listo para Done |
| 10/10 11:58 | Migración en prod, PR #223 mergeado (merge commit `04dfb95`), deploy de runtime y Workers, sync de precios en prod (176/235) | Salida a prod |
| 10/10 16:26 | PLATFORM-59 a Done; etapa B separada en PLATFORM-62. Release 0.13.0 | Done |
| 10/10 16:49 | IMEC prueba en staging y aprueba; AGENT-38 en Review & QA hasta habilitar la tool | Validación del cliente |
| — | ORIANA con `get_catalog_price` en prod y cron semanal activo | Done de AGENT-37/38 (pendiente del Go del cliente) |

## Métricas

| Métrica | Valor | Nota |
|---|---|---|
| Intake → listo para prod | **6,6 días** (03/10 18:05 → 10/10 08:03) | Transcurrido. Incluye diseñar el proceso al mismo tiempo |
| Intake → código en prod | **6,7 días** (03/10 18:05 → 10/10 11:58) | La funcionalidad queda apagada hasta el Go del cliente |
| Intake → triage | ~3 h | Con el triage aún en diseño. Meta en régimen: 10–15 min |
| Desvío por infraestructura (PLATFORM-59) | 4,1 días de 6,6 | De REQUEST-8 triado al PR #223. Sin staging, AGENT-38 no tenía dónde validarse |
| Ejecución del plan de PLATFORM-59 | ~56 h, 10 fases | Del primer commit de `cc-stage` al PR #223 |
| Vueltas de plan | AGENT-38: 1 · PLATFORM-59: 4 (v1, v2, v2.1, v2.2) | |
| Vueltas de review de código | AGENT-38: 2 (1 bloqueante, luego APROBADO) | |
| Tamaño | PR #218: 19 commits, +2.541/−77 · PR #223: 45 commits, +5.483/−103, 81 archivos | #223 incluye #218 |
| Ítems nuevos registrados en Request durante el caso | 10 (REQUEST-9 a 18), del 08 al 09/10 | 9 salen del trabajo del caso 1; REQUEST-10 (EMA) es aparte. Antes se habrían perdido |

## Hallazgos detectados por el proceso, no por el cliente

Esta es la métrica que más importa para la tesis: **qué encontró el proceso que, sin él, habría llegado a producción o lo habría reportado el cliente**.
Los #8 y #9 ya estaban en producción: el proceso los encontró antes de que el cliente los reportara.

| # | Hallazgo | Quién lo detectó | Gate |
|---|---|---|---|
| 1 | La "solución provisional" no resolvía nada: era el comportamiento actual | Producto (Nicole), con los escenarios | Gate de especificación |
| 2 | Lookup de producto por nombre sin coincidencia exacta primero | `reviewer-agent` | Review de código |
| 3 | 23 hallazgos en el plan v1 de PLATFORM-59 (5 bloqueantes; unos 15 solo los vio el agente) | `plan-reviewer-agent` | Planning |
| 4 | El humo de re-ingesta del plan v2.1 **borraba los chunks del documento real** | Revisión humana + IA | Planning |
| 5 | `schedule_appointment` habilitada en prod sin implementación en el runtime | G1 | Building |
| 6 | Railway retira Config as Code el 2026-12-01 y el agent de prod depende de él | Fase 3 | Building → REQUEST-9 |
| 7 | 63 posibles datos personales en el export de prod (revisados y anonimizados antes de copiar) | Escáner de PII, G2 | Building |
| 8 | 5 comportamientos de prod que no siguen la acción esperada (urgencias, disponibilidad inventada, descuentos) | Línea base de regresión | Review → REQUEST-11 |
| 9 | ORIANA da el precio solo 2 de 5 veces: 237 chunks decían "lo confirma un asesor" | A/B | Review → conocimiento corregido en prod |
| 10 | Cifra contradictoria del Suero Hydra ($70.000 en el conocimiento vs $235.000 en la tabla) | Escenarios con la tool | Review (pendiente) |
| 11 | Ante un nombre ambiguo, el agente da varios precios en vez de preguntar (3/5) | Escenarios con la tool | Review → REQUEST-12 |

**Errores del propio proceso (falsos positivos):**
- El `plan-reviewer-agent` dio 2 hallazgos falsos (conocimiento "legacy" y el modelo de Urea) y exageró la severidad de uno: venían de un contexto viejo que le pasamos.
- El arnés de regresión con 3 corridas marcó FALLA en los tres agentes por **ruido del modelo**, no por el cambio. Se resolvió con un A/B de 5 corridas y una regla fijada antes de correr (`ab-regla.md`).

## Lo que funcionó

1. **Los gates encontraron cosas reales en cada etapa**, no solo en review: especificación (#1), planning (#3, #4), building (#5–7) y review (#8–11).
2. **Línea base antes del cambio.** Sin ella, los 5 problemas de #8 se habrían atribuido a AGENT-38.
3. **La regla de decisión escrita antes de ver resultados** (con su límite de potencia dicho en voz alta). Evitó dos errores: bloquear por ruido o aprobar "a ojo".
4. **Comentario por fase en Plane con gates y evidencia** (G1–G7). Es la bitácora que permitió escribir esta retrospectiva sin reconstruir nada.
5. **El revisor de planes en contexto limpio** encontró ~15 cosas que el humano no vio; el humano encontró la dependencia entre ítems que el agente no vio. Son complementarios.
6. **Las correcciones fueron a la causa.** El fallo de precios se arregló en el conocimiento (2/5 → 0/5), no reforzando el prompt (que lo empeoró: 3/5 → 1/5).

## Lo que no funcionó o falta

1. **El plan aprobado no está en el repo.** La regla dice `docs/tasks/<ítem>-plan.md`; en `cc-stage` está el brief (`platform-59-staging-cc.md`) pero no `platform-59-plan.md`. La v2.2 solo vive en el vault (calibración).
2. **No se mide esfuerzo.** Solo hay tiempo transcurrido. Sin horas por etapa no se puede decir dónde se va el tiempo.
3. **Holdout incompleto.** Las suites de regresión las adaptó Claude Code a partir de la base de Nicole y viven en `apps/agent/scripts/regression/`, al alcance de los agentes que construyen. El nivel 3 pide lo contrario.
4. **La infraestructura apareció como bloqueo a mitad del caso.** Lo correcto era no tener staging; lo caro fue descubrirlo cuando AGENT-38 ya estaba construido.
5. **Estados de Plane desalineados:** REQUEST-1 sigue en Backlog mientras sus hijos están en Review & QA e In Progress.
6. **Pendiente de seguridad sin cierre visible:** el rol temporal `cc_staging_export` en prod debía borrarse (comentario del 08/10); no hay registro de que se hiciera.
7. **Muestras pequeñas.** Con 5 corridas solo se detectan diferencias muy marcadas. Sirve como gate, no como medición fina.

## Qué se vuelve estándar de la fábrica

| Pieza | De dónde sale | A dónde va |
|---|---|---|
| Gate de regresión: línea base → barrido 3 → A/B 10 con regla previa | PLATFORM-59, fases 6–8 | [[definition-of-done]] v0.2 ✔ |
| Runbook de salida a prod (migración → merge → deploy → humo → habilitar) | `platform-59-salida-a-prod.md` | [[runbook-salida-a-prod]] ✔ |
| Comentario por fase con gates y evidencia | Comentarios de PLATFORM-59 | [[comentario-por-fase]] ✔ |
| Revisión de plan en dos capas (humano + agente en contexto limpio) | Calibración 2 | Ya en [[agente-revisor-de-planes]] v0.2 |
| `cc-staging` como etapa obligatoria antes de prod | PLATFORM-59 | `ENVIRONMENTS.md` del repo (hecho) |

## Decisiones tomadas (10/10, Juan Carlos)

- **Holdout — punto medio:** la suite visible sigue en el repo, protegida con CODEOWNERS (los cambios los aprueba producto)
  y con la regla de que los builders no la editan; además, un set holdout de 5–8 casos por agente, curado por producto,
  **fuera del repo**, que solo corre el gate.
- **Esfuerzo — las dos medidas:** estimación Fibonacci al triar ([[triage]] v0.4) y horas de atención humana por etapa
  al cerrar, en el comentario de DoD ([[definition-of-done]] v0.2). Son cosas distintas: los puntos estiman antes, las horas miden después;
  cruzarlas es lo que calibra la estimación.
- **Gate de regresión:** barrido de toda la suite con 3 corridas; A/B con **10 corridas por brazo** solo en los ítems marcados.
  Con 5 o 6 corridas solo se detectan caídas de ~0,80; con 10, de 0,50.
