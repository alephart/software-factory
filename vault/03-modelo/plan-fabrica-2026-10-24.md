---
tags: [modelo, plan, factory-server]
creado: 2026-10-24
estado: propuesto
item: FACTORY-11
---

# Plan de la fábrica desde el 24/10

Volver a [[README]] · Decisiones: [[consolidacion-2026-10-23]] · Servidor: [[factory-server]] · Lecciones: [[06-factory-primer-recorrido]]

**Objetivo:** que la Factory pase del sandbox a su primer producto (Agenttia) con gates de máquina, sin poner en riesgo CC en producción.
**Éxito:** un ítem de Agenttia recorre Plane → Factory → merge con `factory-verdict` obligatorio, en el servidor y con aislamiento real.

Las fechas son una propuesta según la capacidad de una sola persona técnica; se ajustan en cada traspaso.
**Restricciones de calendario:** REQUEST-9 (Railway) vence el **2026-12-01**; el congreso de EMA es el **27–28/11** (semana sin cambios en CC).

## Orden y dependencias

```
Bloque 0 (higiene)
   └─► Bloque 1 (fase 3: servidor) ──► Bloque 2 (gate completo) ──► Bloque 4 (fase 4: E2B → Agenttia)
Bloque 3 (CC: D + REQUEST-9 → C Sentry)  ── en paralelo, por el flujo de CC; congelado el 23–28/11
Bloque 5 (si el volumen lo pide) ── sin fecha
```

## Bloque 0 — Higiene inmediata (semana del 26/10, horas)

| # | Qué | Quién | Hecho cuando |
|---|---|---|---|
| 0.1 | *Interaction limits* en `factory-sandbox` (solo colaboradores) | Juan Carlos | Activo y anotado su vencimiento (≤ 6 meses) |
| 0.2 | **Regla de confianza en las skills:** `factory-triage`, `factory-plan` y `factory-plan-review` solo cuentan comentarios de autores con `write`/`maintain`/`admin` o de una lista explícita | Factory (issue en `factory-server`) | Versión nueva de las 3 skills + caso de prueba con un comentario de alguien sin permiso |
| 0.3 | Renombrar el job del workflow a `publicar-estado` | Claude Code prepara, Juan Carlos publica | El estado obligatorio sigue llamándose `factory-verdict` y el ruleset no cambia |
| 0.4 | Pendientes de B: proyecto SANDBOX en Plane, labels `destino:*` (SANDBOX, Request de CC, Inbox de Agenttia), `origen:plane` en `factory-sandbox`, invitar a Nicole (rol *Triage*) | Juan Carlos | Todo creado; Nicole aceptó la invitación |
| 0.5 | Quitar el pie de atribución de la descripción del PR #13 (desde GitHub; la plataforma lo vuelve a agregar si se edita desde Claude) | Juan Carlos | Sin atribución |
| 0.6 | Integrar el vault a `master` (`factory-11/fase-2` → `docs/agents-md` → `factory-11/fase-3`) y PR de `factory-11/fase-3` en `factory-server` | Juan Carlos | `master` al día en los dos repos |

## Bloque 1 — Fase 3: servidor (semana del 26/10 – 7/11) — **cumplido el 29/10**

Desde el 26/10 se monta en **Railway** (decisión E revisada): runbook `factory-server/docs/runbook-railway.md`, que usa las secciones
1.3–1.6, 3 y 5 de `runbook-servidor.md` (WorkOS *Production*, GitHub App de producción, workspace `factory` de Anthropic con límite de gasto,
llave de cifrado, configuración de la Factory y recorrido). El Droplet (`runbook-servidor.md` completo) queda como alternativa.
Sin backups en Hobby durante la prueba; respaldo a R2 antes de la fase 4 (4.1b).

**Resultado (29/10):** issue #19 de `factory-sandbox` → PR #20 → Done, con tarjeta de Review creada por el webhook, commits de
`agenttic-factory[bot]` y `factory-verdict` en verde por el bot nuevo. Detalle en [[00-estado-actual]].

**Hueco a cuidar:** al pasar a la App de producción cambia el bot. Hay que actualizar la variable `FACTORY_BOT_LOGIN` de `factory-sandbox`
a `<slug-de-producción>[bot]`; si no, `factory-verdict` deja en *pending* todos los PRs (no reconoce al bot nuevo) o trata sus PRs como humanos.

**Hecho cuando:** un issue de `factory-sandbox` llega a Done en `factory.alephart.co`, con la tarjeta de Review creada sola (webhook),
commits con la identidad del bot de producción y `factory-verdict` en verde por el bot nuevo.

## Bloque 2 — Gate completo (durante los recorridos del bloque 1)

| Caso | Hecho cuando |
|---|---|
| *Request changes* | Check en rojo; el builder corrige; la re-review lo pasa a verde |
| Dos rondas de cambios | Check en rojo con "escalar a una persona" |
| Commit nuevo después de un *approve* | El check vuelve a *pending* con el SHA nuevo — **probado el 29/10** (PR #20; la re-review sale sola) |

Si el formato del comentario de *request changes* no coincide con el que espera el workflow, se ajusta la expresión regular y se repite.

## Bloque 3 — CC: Railway y Sentry (por el flujo de CC, no por la Factory)

| # | Ítem | Fecha objetivo | Hecho cuando |
|---|---|---|---|
| 3.1 | **D + REQUEST-9:** `.railway/railway.ts`; CI con `on: push`; autodeploy con *Wait for CI* en `cc-agent` ← `cc-stage` y producción ← `master`; regla de la CLI en `docs/ENVIRONMENTS.md` + ADR | Staging antes del 7/11; producción antes del **20/11** | Un PR real despliega solo tras CI en verde; un CI en rojo **no** despliega; `railway.json`/`.toml` retirados |
| 3.2 | **C — Sentry** en `apps/agent`: organización propia de CC (US), Developer, muestreo ~20%, agent tracing sin contenido, `beforeSend`, release por SHA, spike protection, alertas mínimas, filtro de Gmail `sentry` | Después de 3.1; si no alcanza antes del 23/11, **en diciembre** | Un error provocado en staging aparece con su release y sin contenido de la conversación; la DoD completa (gate de regresión) en PASA |

**Congelado 23–28/11** (congreso de EMA): sin cambios en el runtime de CC salvo hotfix.

## Bloque 4 — Fase 4: primer producto (desde el 9/11; Agenttia en diciembre)

| # | Qué | Depende de | Hecho cuando |
|---|---|---|---|
| 4.1 | **E2B** (aislamiento real de la sandbox, `E2B_API_KEY`) | Bloque 1 | Un recorrido del sandbox corre en E2B; el agente no ve los secretos del servidor |
| 4.1b | **Respaldo de la base de la Factory:** cron en Railway con `pg_dump` diario a Cloudflare R2 (o workspace en Pro) | Bloque 1 | Respaldo diario fuera de Railway y una restauración probada |
| 4.2 | Repo de Agenttia en `Alephart-Co` (CC PLATFORM-60, caso 2) | — | Repo con su CI, AGENTS.md y entornos propios |
| 4.3 | **Team en `Alephart-Co`** + ruleset en Agenttia (`factory-verdict` + CI, sin bypass) | 4.2 | El merge queda bloqueado sin *approve* también en un repo privado |
| 4.4 | App de la Factory en el repo de Agenttia; etiquetas; `FACTORY_BOT_LOGIN` | 4.1, 4.3 | Primer ítem de Agenttia: Plane (`destino:factory`) → issue → Done |

**La Factory no entra a CC** hasta tener gate que bloquee ahí (Pro personal) y la App en *Any account*. Se decide después del primer ítem de Agenttia.

## Bloque 5 — Cuando el volumen lo pida (sin fecha)

- Skills del kit: `plane-to-factory`, `factory-to-plane`, `sentry-to-plane` (empiezan cuando registrar a mano deje de ser < 2 min o se olviden ítems).
- Plane Pro, o webhook de Sentry → Cloudflare Worker → Plane, si se pasa de ~5 ítems/semana.
- Verificar si Mastra permite un conjunto curado de MCP por sesión (la "puerta única de herramientas" de Stripe).
- Seer de Sentry, si hay volumen de errores en un producto con la Factory.

## Métricas (desde el bloque 1)

| Métrica | Fuente |
|---|---|
| PRs de la Factory mergeados sin reescritura humana (%) | GitHub |
| Rondas de *request changes* por PR y escalados | `factory-verdict` |
| Costo por ítem (tokens) | Workspace `factory` de Anthropic |
| Tiempo de Intake a merge | Plane + GitHub |
| Horas humanas por ítem (triage, revisión) | DoD v0.3 (línea de esfuerzo) |
| Incidentes en producción atribuibles a PRs de la Factory | Sentry + Plane |

## Riesgos

- **Una sola persona técnica:** el bloque 3 compite con la operación de CC (EMA, IMEC). Si algo cede, cede el bloque 4, nunca 3.1 (tiene fecha dura).
- **Mastra en beta:** cada actualización puede romper las skills o el tablero; correr `skills:test` y `board:test` siempre.
- **Gate dependiente de un formato de texto:** si Mastra cambia el comentario del veredicto, `factory-verdict` queda en *pending* (falla cerrado, no abierto). Es lo correcto, pero hay que vigilarlo al actualizar.
