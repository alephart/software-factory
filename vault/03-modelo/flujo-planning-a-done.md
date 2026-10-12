---
tags: [modelo, planning, building, review, done, agentes]
creado: 2026-10-03
---

# De Planning a Done — con agentes

Volver a [[README]] · Antes: [[02-triage]] · Plantilla: [[definition-of-done]]

## 1. Velocidad: carriles en vez de un solo camino

El caso 1 fue lento porque estábamos **diseñando el proceso y aprendiendo** al mismo tiempo. En régimen: intake 3–5 min, triage 10–15 min. Además, no todo ítem recorre el mismo camino:

| Carril | Cuándo | Recorrido | Meta |
|---|---|---|---|
| **Express** | Causa `conocimiento` o `datos`, cambio pequeño, sin código | Intake → triage corto → curación → escenario → Done | Mismo día |
| **Estándar** | `prompt`, `requisito` pequeño, bug acotado | + planning ligero (spec en el ítem) | 1–3 días |
| **Mayor** | Capacidad nueva, cambio de arquitectura | + ADR + gate de especificación | Según ADR |
| **Urgente** | Rúbrica urgente (info incorrecta en salud, agente caído) | Salta la cola; postmortem después | Horas |

Reglas de velocidad:
- **Triage por lotes:** dos sesiones de 30 min por semana, no ítem por ítem.
- **Los agentes hacen el trabajo pesado:** estructurar el intake, proponer hipótesis, crear ítems, redactar specs y ADRs. Los humanos aprueban en los gates.
- **La ceremonia es proporcional al riesgo:** un ajuste de conocimiento no necesita ADR.

## 2. Planning

**Salida:** especificación con **criterios de aceptación verificables** + lista de tareas.

- Ligero: la spec vive en el ítem de Plane.
- Mayor: ADR en `docs/adr/` del repo, enlazado desde el ítem.
- Para agentes conversacionales, los criterios se escriben como **escenarios**:
  `Dado <contexto> · Cuando el usuario <dice X> · Entonces el agente <hace Y> · Y nunca <Z>`
- **Gate de especificación:** producto + técnica aprueban antes de construir. Aquí se resuelven desacuerdos.

## 3. Building

- **Una rama (o worktree) por ítem**, nombrada con su ID (ej. `agent-38-precios-vigentes`).
- El agente builder implementa **contra los criterios de aceptación**, no contra la conversación.
- El PR referencia el ítem de Plane (integración GitHub ya conectada).
- En la línea `agente-cliente`, Building es un cambio de conocimiento o instrucciones, hecho por producto (con ayuda de un agente curador).

## 4. Review — dos capas + gate humano

1. **Automática:** typecheck, tests, validación de esquema en migraciones, y **escenarios conversacionales** corridos contra el agente en staging.
2. **Agente revisor:** contexto separado del builder; compara el diff contra la spec. No ve el razonamiento del builder (principio holdout).
3. **Gate de merge humano:** fundador técnico (plataforma) o producto (agente-cliente).

Los escenarios de los criterios de aceptación se guardan en el **set de regresión**: nunca se borran.

**Gate de regresión (desde el 10/10):** línea base antes del cambio → barrido de la suite con 3 corridas → A/B con 10 corridas
por brazo solo en los ítems marcados, con la regla escrita antes de correr. **Holdout:** la suite visible vive en el repo con
CODEOWNERS de producto; el set holdout vive fuera del repo y solo lo corre el gate. Detalle en [[definition-of-done]] v0.2.

## 5. Done

Ver [[definition-of-done]]. Un ítem de Request se cierra cuando todos sus ítems derivados están en Done.

## 6. Asignación de agentes por etapa

| Etapa | Agente | Humano (gate) | Herramienta |
|---|---|---|---|
| Intake | Asistente de intake: estructura el reporte en la plantilla | Producto aprueba | Plane MCP |
| Triage | Agente de triage: propone hipótesis, revisa conocimiento/prompt, sugiere causa y prioridad | Producto o técnica decide | Plane MCP + acceso al conocimiento |
| Planning | Planner: redacta spec/ADR y criterios como escenarios | Gate de especificación (ambos) | Claude Code + repo |
| Building | Builder(s): subagentes por área (agent, portal, db) | Técnica supervisa | Claude Code, worktree por ítem |
| Review | Revisor + runner de escenarios | Gate de merge | CI, staging |
| Done | Verificador de DoD: revisa checklist y actualiza Plane | Producto notifica al cliente | Plane MCP |

### ¿Dónde entra Mastra?

Distinguir dos cosas:

- **Agentes que construyen** (la fábrica): son agentes de desarrollo. Hoy: Claude Code con subagentes en `.claude/agents/` + Plane MCP. No hace falta Mastra para empezar.
- **Mastra** es el runtime del producto. Su lugar natural en la fábrica:
  1. **Runner de escenarios (Review, nivel 3):** simular conversaciones contra el agente Mastra en staging y puntuar resultados. Es el primer uso recomendado, porque prueba el producto real.
  2. **Orquestación de la fábrica (nivel 4):** workflows con pausa para aprobación humana (ej. webhook de Plane → agente de triage → comentario propuesto → espera aprobación). Alternativa: n8n, ya disponible para automatización.

Orden recomendado: subagentes de Claude Code por etapa → runner de escenarios en Mastra → orquestación automática.

## 7. Caso 1 en este flujo

- **AGENT-37** (Nicole, carril estándar): confirmar con el cliente el comportamiento provisional y la frecuencia de cambio de precios → escribir criterios como escenarios → ajustar instrucciones → escenario al set → Done.
- **AGENT-38** (Juan Carlos, carril mayor): bloqueado por AGENT-37. Con la frecuencia confirmada → ADR (sincronización vs. consulta en vivo, comportamiento ante dato no disponible) → building → review con escenarios → Done.
- **REQUEST-1:** se cierra cuando ambos estén en Done.
