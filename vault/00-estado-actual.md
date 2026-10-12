---
tags: [estado, handoff]
actualizado: 2026-10-11
---

# Estado actual — leer primero al iniciar una sesión nueva

Volver a [[README]]

> Este archivo es el **traspaso entre sesiones**. Al empezar una conversación nueva: leer este
> archivo y el [[README]]. Al cerrar una sesión: actualizarlo.
> **Fuente de verdad del producto:** Plane (comentarios por fase) y el repo (`master`, `docs/tasks/`).
> Este archivo resume; no duplica.

## Dónde estamos

- **Piloto:** Conversion Chat (`master` = producción). **Core futuro:** Agenttia.
- **Flujo de ramas vigente:** `feature → cc-stage → master`, con `cc-staging` como entorno previo a prod
  (Supabase `cc-staging`, Railway `cc-agent`, Workers `stg.*`; admin detrás de Cloudflare Access). Documentado en `docs/ENVIRONMENTS.md`.
- **Caso 1 (precios de IMEC):** **en producción desde el 10/10** (PR #223, merge commit `04dfb95`; release 0.13.0).
  La tool `get_catalog_price` sigue **apagada** en ORIANA de prod: IMEC probó en staging y aprobó; se habilita con el Go del cliente.
- **Fábrica:** el caso 1 es el primer ítem que recorre el flujo completo. Retrospectiva medida en
  [[04-caso-1-retrospectiva]]. Estándares nuevos del 10/10: [[definition-of-done]] v0.2, [[triage]] v0.4,
  [[runbook-salida-a-prod]], [[comentario-por-fase]]; Fibonacci activa en Plane.

## 11/10 — lo que avanzó (Claude Code, cotejado en GitHub y Plane)

- **PLATFORM-62 Done:** cc-staging completo (portal y agenda sin workers.dev, Access solo en el admin, desvío de correos con `EMAIL_REDIRECT_TO`,
  seed y humo de agenda). **Suites v2** de Buitrago y Urea con agendamiento, **aprobadas por Nicole** (AGENT-44) y con línea base v2.
- **PLATFORM-63 Done:** **CI** en cada PR (type-check, lint, pruebas) y **tag + GitHub Release automáticos** cuando los 3 Workers quedan en verde.
  Verificado en el release real v0.13.2. Límites: el CI avisa pero no bloquea (plan gratuito); Railway (agent) no entra en el gate. PLATFORM-65 descartado.
- **Releases:** 0.13.1 (agenda BOOKING-7/8 + PLATFORM-62) y 0.13.2 (CI y releases). REQUEST-8 cerrado.
- **BOOKING-5, 7 y 10 Done.** BOOKING-10 es el **primer ítem con estimación Fibonacci** (1 punto, abierto y cerrado en 12 minutos: carril express).
- **ADR 036 (cc-staging, ramas y acceso) y ADR 037 (CI y releases)** escritos (PR #238, en `cc-stage`; falta subir a master).
- **Nuevo e importante para la fábrica:** PLATFORM-64, promover un agente probado en cc-staging a producción con todo su setup y sin datos de prueba.

**Desvíos de proceso detectados en el cotejo del 11/10:**
1. **Numeración de ADR en conflicto:** el ADR 034 dice "Reemplazado (ver ADR 036, pendiente)", pero el 036 ahora es cc-staging.
   El ADR de conocimiento pasa a ser **ADR 038** y hay que corregir la línea del 034.
2. **Hallazgos fuera de la puerta única:** AGENT-44/45, BOOKING-5 a 10 y PLATFORM-63 a 65 se crearon directo en los proyectos de módulo, sin pasar por Request.
   El 09/10 los hallazgos sí iban a Request. Hay que decidir la regla (ver decisiones abiertas). REQUEST-19 "prueba" es basura.
3. **Estimaciones:** solo BOOKING-10 tiene puntos; los demás ítems nuevos no.
4. **Cierres sin línea de esfuerzo** ni formato DoD (las horas siguen pendientes).
5. **Puntos 4–6 del cotejo del 10/10:** runbook marcado como ejecutado en `cc-stage` (falta master); plan v2.2 sigue fuera del repo;
   el registro del humo no aparece. CODEOWNERS de suites y `plan-reviewer-agent` siguen sin estar en el repo.

## Caso 1 — estado al 10/10

| Ítem | Estado en Plane | Para cerrar |
|---|---|---|
| PLATFORM-59 — staging de CC | **Done** (10/10 16:26). Etapa B separada en **PLATFORM-62** (In Progress) | — |
| AGENT-38 — precios del catálogo | Review & QA. Código, migración y sync en prod; tool apagada | Go del cliente → habilitar la tool en ORIANA, prueba en prod, `PRICES_SCHEDULE_ENABLED=true` en imec-scraper |
| AGENT-37 — prompt de ORIANA | Review & QA | Prompt final en ORIANA de prod **y versionado** (el probado difiere del de `docs/tasks/agent-37-oriana-prompt-precios.md`) |
| REQUEST-1 | Backlog (desalineado) | Con 37 y 38 en Done + comentario en el padre |
| REQUEST-8 | **Done** (11/10) | Cerrado con PLATFORM-59 y 62; PLATFORM-60 sigue aparte |
| REQUEST-3 | **Done** (10/10 19:07) | — |

## Cotejo de la salida a prod contra la DoD v0.2 (10/10)

**Cumple:** migración antes del merge; merge commit; deploy de runtime y Workers; RLS verificada; sync de precios en prod;
etapa B separada en su propio ítem (sin "parciales"); release y CHANGELOG (0.13.0); tool apagada hasta validar con el cliente.

**Resuelto el 10/10 (registrado en PLATFORM-59):**
1. ~~Rol temporal `cc_staging_export` en prod~~: **borrado** (confirmado por Juan Carlos).
2. ~~G7~~: **confirmado**, los REVISAR son variación del modelo.
3. ~~Cifra del Suero Hydra~~: **corregida** en el conocimiento de staging y prod.
8. ~~Cierres sueltos~~: AGENT-28, PORTAL-14 y PLATFORM-48 a **Done** (evidencia: `d135dbc`, `f785d59`); PLATFORM-50 **cancelado** (obsoleto por la decisión del 04/10); REQUEST-3 a **Done**.

**Lo revisa Juan Carlos (con Claude Code):**
4. Runbook en master desactualizado: dice "EN PAUSA" con todas las casillas sin marcar; debería decir EJECUTADO 10/10.
5. Humo: el cierre no menciona `/health` ni la prueba de un agente de prod "igual que antes".
6. Plan v2.2 de PLATFORM-59 sigue sin estar en el repo.

**Decidido:**
7. Prompts: **no se versionan por ahora**. Versionarlos bien es una herramienta del admin por cliente (candidato a Request más adelante).
   Mientras tanto, el texto final del prompt se pega en el comentario de cierre del ítem (DoD v0.2).

**Pendiente:** formato DoD con línea de esfuerzo humano y puntos (horas de Juan Carlos y Nicole por etapa).

**Límites conocidos que salen con el release:** escenario 4 (equipo ambiguo) → REQUEST-12, aceptado por el cliente; formato del precio → REQUEST-13.

## Request: cola por triar

- **En Intake (sin triar):** REQUEST-2, 4, 5, 6 y 7 (n8n en el repo, conocimiento editable 4+5, alertas de sync, handoff que apaga la conversación). REQUEST-3 Done.
- **En Backlog, registrados durante el caso 1:** REQUEST-9 (Railway retira Config as Code el 2026-12-01, **alta**),
  10 (EMA no usa los textos exactos, **alta**), 11 (5 casos de la línea base), 12 (ambigüedad en `get_catalog_price`),
  13 (formato del precio), 14 (token de ingesta por cliente), 15 (WhatsApp de prueba en cc-staging), 16 (reranker y `/shadow`),
  17 (verificar cifras antes de enviar, **alta**), 18 (política de envíos de IMEC).
- **Creados directo en módulos el 11/10 (sin triar por Request):** AGENT-45 (flujo de descuentos), BOOKING-6 (Google "app no verificada"),
  BOOKING-8 (invitación de Google a cualquier correo), BOOKING-9 (festivos), PLATFORM-64 (promoción staging → prod).

## Piezas del harness ya en uso

| Pieza | Dónde |
|---|---|
| Puerta única de entrada | Plane → proyecto **Request** (Intake) |
| Plantillas intake v0.4, triage v0.4, DoD v0.2, runbook de salida, comentario por fase, asistente de intake | `04-plantillas/` |
| Guía para producto (Nicole) | Página en Plane (Request) |
| Etiquetas `linea:*`, `causa:*` | Plane → Agent y PLATFORM (son por proyecto) |
| Subagentes builder | repo `.claude/agents/`: runtime, database, admin, portal, portal-design, booking, calendar |
| Agente de Review | repo `.claude/agents/reviewer-agent.md`. Primer bloqueante real en AGENT-38 |
| Agente de Planning | v0.2, en `04-plantillas/agentes/plan-reviewer-agent.md`. Calibración 2 hecha (PLATFORM-59). Falta llevarlo al repo |
| **Entorno previo a prod** | `cc-staging` (nuevo). Flujo `feature → cc-stage → master` |
| **Suite de regresión por agente** | `apps/agent/scripts/regression/` (ORIANA, DIEGO, UREA, suites v1). Arnés `run.ts`, `compare.ts`, `ab.ts` |
| **Regla de A/B fijada antes de correr** | `docs/tasks/platform-59-results/ab-regla.md` |
| **Runbook de salida a prod** | `docs/tasks/platform-59-salida-a-prod.md` (candidato a plantilla) |
| **CI** (11/10) | type-check, lint y pruebas en cada PR; tag y Release automáticos tras el deploy en verde (ADR 037, `docs/VERSIONING.md`) |
| **Suites v2 aprobadas por producto** | Buitrago y Urea con agendamiento (AGENT-44) |

## Decisiones abiertas

- ~~Retro del caso 1~~ **Decidido el 10/10:** holdout en punto medio (suite visible con CODEOWNERS + set holdout fuera del repo); Fibonacci al triar y horas humanas al cerrar; gate de regresión 3 + 10 corridas. Ya en [[definition-of-done]] v0.2 y [[triage]] v0.4.
- **Modelo de conocimiento:** **ADR 038** (reemplaza al 034; el número 036 lo tomó cc-staging), prerequisito de REQUEST-4 y 5. Mientras tanto, puente manual.
- **Puerta única vs. hallazgos en caliente:** ¿un hallazgo que aparece mientras se construye entra por Request o se crea directo en el módulo con enlace al ítem padre y se tría en el lote semanal?
- **PLATFORM-64** (promoción de agentes staging → prod) es la pieza que convierte cc-staging en la línea de onboarding de agentes: candidato a caso 2.
- **Agenttia (PLATFORM-60, To Do):** tag `agenttia-v2-base`, repo propio, entornos heredados. Después de que los precios estén en prod.
  Regla del puente: los fixes van de CC a Agenttia, nunca al revés.

## Reglas del flujo

- **El plan aprobado vive en el repo**, en `docs/tasks/<ítem>-plan.md` junto a su brief, y se enlaza en Plane.
  ⚠ PLATFORM-59 no lo cumple: la v2.2 solo está en el vault (`03-modelo/calibracion/platform-59-plan-v2.2.md`).
- **El vault guarda conocimiento de la fábrica**, no artefactos del producto. La excepción es el material de calibración.
- **Antes de escribir un archivo en el repo**, verificar si ya existe y su estado en git.
- **Regresión antes de habilitar:** todo cambio en el runtime se valida contra la suite de los agentes en producción,
  con línea base tomada **antes** del cambio y regla de decisión escrita **antes** de ver resultados.
- **Nada en prod sin OK explícito**, paso por paso (runbook).

## Decisiones del 12/10

- **Estructura:** `software-factory` (molde) + productos (`conversion-platform`, `agenttia`) como instancias. Ver [[fabrica-y-productos]].
- **Principio de entrega:** cada producto debe poder entregarse y operarse **sin la fábrica y sin ajustes**: se copia, no se enlaza;
  cuentas e infraestructura propias por producto; el repo se explica solo; nada en el repo apunta al vault.
- **Caso 2 = PLATFORM-60** (crear `software-factory` + arrancar Agenttia instalando el molde). **Caso 3 = PLATFORM-64** (promoción staging → prod).
- **ADR de conocimiento = 038** (el 036 lo tomó cc-staging).

## Acceso a Plane (12/10)

| Conector | Workspace (slug) | Cómo | Proyectos |
|---|---|---|---|
| `Plane_So` | `conversion-chat` | OAuth (claude.ai) | Request, Agent, Platform, Portal, Booking, Marketing |
| `plane-agenttia` | `agenttia` | stdio local en Claude Desktop (`uvx plane-mcp-server`, PAT) | Inbox, Platform, Agent, Marketing |

- **Regla:** antes de cualquier escritura, verificar el workspace con `workspace retrieve`.
- **Ojo con los identificadores repetidos:** ambos workspaces tienen `PLATFORM`, `AGENT` y `MARKETING`.
  En notas y comentarios que crucen workspaces, escribir el prefijo: **CC PLATFORM-60** / **AG PLATFORM-1**.
- Agenttia ya tiene **INBOX** como puerta de entrada (equivalente a Request de CC).

## Backlog de la fábrica — Plane `agenttia` → proyecto **FACTORY** (creado el 12/10)

Estimación Fibonacci activa; estados Backlog → Todo → In Progress → Review & QA → Done / Cancelled.

| Ítem | Qué | Pts | Prioridad |
|---|---|---|---|
| FACTORY-1 | Kit `software-factory` con el vault adentro (CC PLATFORM-60 parte A) | 5 | alta |
| FACTORY-2 | Agentes base versionados en el molde (reviewer, plan-reviewer, builders) | 3 | alta |
| FACTORY-3 | CI modelo y arnés de regresión genérico en el molde | 5 | media |
| FACTORY-4 | Holdout: CODEOWNERS de suites + set holdout fuera del repo | 3 | media |
| FACTORY-5 | Regla de puerta única para hallazgos en caliente | 1 | alta |
| FACTORY-6 | Horas del caso 1 y cierre de la retro | 1 | media |
| FACTORY-7 | Triage por lotes como ritual semanal | 2 | media |
| FACTORY-8 | Calibración 1 del `plan-reviewer-agent` | 2 | baja |
| FACTORY-9 | Artículo: estructura v2 y borrador 1–6 | 3 | baja |

## Próximos pasos de la fábrica

0. **Separar cuentas de CC y Agenttia** (prerrequisito del principio de entrega): org de Supabase de cc-staging, environment `staging` de Agenttia en el Railway de CC.
1. **Higiene (una tanda de Claude Code):** subir `cc-stage` a master (ADR 036/037, runbook ejecutado); corregir la línea del ADR 034 a "ver ADR 038";
   plan v2.2 de PLATFORM-59 al repo; `plan-reviewer-agent` al repo; CODEOWNERS de `apps/agent/scripts/regression/`.
2. **Decidir la regla de la puerta única** para hallazgos en caliente y borrar REQUEST-19.
3. **Triage por lotes con Fibonacci:** Request 2, 4–7, 9–18 + los ítems directos del 11/10. Primero lo que tiene fecha o es alto: REQUEST-9 (Railway, 01/12), 10 y 17.
4. **Caso 2 con los estándares nuevos** (puntos al triar, horas al cerrar, DoD v0.2): es el "después" del artículo.
5. Horas del caso 1 (tabla A/B/C, pendiente) y habilitar ORIANA con el Go de IMEC.
6. ADR 038 (conocimiento) · PLATFORM-60 (Agenttia) · artículo, estructura v2.

## Cómo retomar en una conversación nueva

```
Retomamos la software factory. Lee ~/Projects/agenttic/software-factory/vault/00-estado-actual.md
y el README del vault (la fábrica: ~/Projects/agenttic/software-factory), y dime dónde quedamos antes de seguir.
```
