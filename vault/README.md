---
tags: [moc, software-factory]
creado: 2026-09-28
actualizado: 2026-10-10
---

# Vault — Agenttic Software Factory

Memoria de trabajo del proceso para llevar Agenttic de un desarrollo artesanal asistido por agentes a una software factory definida, medida y escalable.

## Tesis

No se trata de demostrar que un equipo pequeño iguala a uno grande. Se trata de demostrar que **un emprendimiento que arranca pequeño, con un proceso de factory bien definido y ejecutado, puede crecer hasta ser una software factory tradicional**. El proceso es el activo, no el tamaño del equipo: cada gate que hoy ocupa un agente o un fundador es un puesto que mañana puede ocupar una persona.

## Mapa del vault

- **01 — Investigación**
  - [[software-factory-panorama]] — qué es una software factory, niveles de autonomía, caso de referencia, riesgos
- **02 — Diagnóstico**
  - [[roles-actuales]] — quién ocupa cada etapa hoy
  - [[problemas-por-etapa]] — problemas actuales de Intake a Operación (versión anonimizada)
- **03 — Modelo**
  - [[ajustes-al-planteamiento]] — etapa de Operación, autonomía por etapa, medir antes de cambiar
  - [[escalera-de-madurez]] — niveles 1 a 5 con criterios de salida
  - [[flujo-planning-a-done]] — carriles de velocidad, planning/building/review/done, agentes por etapa, Mastra
  - [[recomendaciones]] — acciones adicionales
  - [[agente-revisor-de-planes]] — diseño del agente de la etapa Planning
  - [[fabrica-y-productos]] — estructura fábrica/productos y principio de entrega sin la fábrica
  - [[consolidacion-2026-10-23]] — investigaciones consolidadas: lecciones de Stripe/Spotify y decisiones A–E
  - [[plan-fabrica-2026-10-24]] — plan desde el 24/10: bloques, dependencias, fechas y criterios de salida
- **04 — Plantillas**
  - [[intake]] — v0.4, evidencia según tipo
  - [[triage]] — v0.5, con estimación Fibonacci y regla de puerta única
  - [[definition-of-done]] — v0.2, con gate de regresión, holdout y esfuerzo humano
  - [[runbook-salida-a-prod]] — v0.1
  - [[comentario-por-fase]] — v0.1, bitácora por fase en Plane
- **05 — Artículo**
  - [[notas-articulo]] — estructura propuesta y reglas de anonimización
- **06 — Lecciones**
  - [[01-intake]] — por qué existe el intake y sus cuatro principios
  - [[02-triage]] — diagnóstico + decisión, causas raíz, rúbrica
  - [[03-proceso-interno-interfaz-simple]] — el proceso es interno; la interfaz para producto es simple
  - [[04-caso-1-retrospectiva]] — caso 1 de punta a punta: línea de tiempo, métricas y hallazgos antes del cliente
  - [[05-mastra-factory-prueba]] — prueba de Mastra Factory (12/10)
  - [[06-factory-primer-recorrido]] — primer recorrido completo con nuestras skills: defensa en capas, defectos, modelos y mejoras

## Estructura en Plane

- **Request:** puerta única de entrada (Intake). Ítem padre del pedido original.
- **Proyectos de módulo** (Agent, Portal, Booking, Marketing, Platform Admin): reciben solo trabajo triado.
- Etiquetas: `linea:*`, `causa:*`.

## Estado

| Fecha | Hito |
|---|---|
| 2026-09-28 | Investigación, diagnóstico y modelo de madurez definidos. Vault creado. |
| 2026-10-03 | Intake v0.3 y triage v0.2 validados con caso 1. Proyecto Request creado. Caso 1 dividido en AGENT-37 y AGENT-38. DoD v0.1. |
| 2026-10-04 | Auditoría stage vs master. Hotfix de seguridad AGENT-21 en prod. Decisión: stage pasa a ser la base de Agenttia v2; CC sigue en master con `cc-stage`. |
| 2026-10-05 | PRs pendientes cerrados. Planning de AGENT-38 aprobado (tool genérica, conector por cliente). Intake v0.4. Diseño del agente revisor de planes. |
| 2026-10-06/07 | AGENT-38 construido y aprobado por el reviewer (PR #218 en draft). REQUEST-8 triado → PLATFORM-59/60. Plan de staging mínimo de CC con regresión (Dr. Buitrago, Urea, IMEC). Triage v0.3. |
| 2026-10-07 | Plan de PLATFORM-59 revisado por humano + IA y por `plan-reviewer-agent` (calibración 2). Agente revisor v0.2. PLATFORM-59 en dos etapas. |
| 2026-10-09 | Plan de PLATFORM-59 v2.2 aprobado (tras revisar la v2.1). Veredicto consolidado publicado en Plane. `cc-stage` creada con scripts de G1, seed y regresión. |
| 2026-10-08/10 | Etapa A de PLATFORM-59 ejecutada: `cc-staging` operativo, seed igual a prod, línea base y A/B de regresión, precios validados con el modelo real. Fase 10 (ENVIRONMENTS, ADRs, runbook). PR #223 en draft; salida a prod en pausa esperando Go. |
| 2026-10-10 | Retrospectiva medida del caso 1, primer ítem que recorre el flujo completo: 6,6 días de intake a listo para prod, 11 hallazgos encontrados por el proceso y no por el cliente. |
| 2026-10-10 | Decisiones de la retro: holdout en punto medio, Fibonacci + horas humanas, gate 3 + 10 corridas. DoD v0.2, triage v0.4, plantillas de runbook y de comentario por fase. |
| 2026-10-10 | **Caso 1 en producción** (PR #223, release 0.13.0). PLATFORM-59 en Done; etapa B → PLATFORM-62. IMEC aprueba en staging; la tool se habilita con su Go. Fibonacci activa en Plane. |
| 2026-10-11 | cc-staging completo (PLATFORM-62), **CI y releases automáticos** (PLATFORM-63, v0.13.2), suites v2 aprobadas por producto, ADR 036/037. Primer ítem con Fibonacci (BOOKING-10). |
| 2026-10-12 | Estructura fábrica/productos y principio de entrega sin la fábrica. CC PLATFORM-60 reescrito como caso 2. Acceso a Plane de Agenttia; proyecto **FACTORY** creado con 9 ítems estimados. |
| 2026-10-21/23 | FACTORY-11: decisión de Mastra Factory autoalojada; fases 1 y 2 en local (dos recorridos completos con nuestras skills, mejoras de prioridad alta); despliegue de la fase 3 escrito (Docker Compose, túnel, respaldos, runbook). |
| — | Siguiente: FACTORY-5 (regla de puerta única), FACTORY-1 y 2 (molde), y el plan de CC PLATFORM-60. |

## Pendientes estratégicos

- **Conversion Chat es el piloto; Agenttia es el core.** El recorrido de implementación de la software factory se prueba en Conversion Chat, pero el destino es Agenttia. Pendiente definir cómo se traslada el proceso, las plantillas y los agentes de la fábrica a Agenttia.
- **Código de Agenttia (decidido 04/10):** la rama `stage` de CC es la base de Agenttia v2, en un repo propio. Separar el código ahora no adelanta el traslado de la fábrica, que sigue para el final del piloto.

## Convenciones

- Español para el contenido; enlaces estilo Obsidian `[[nota]]`.
- Nada de nombres de clientes, empresas ni claves/IDs de herramientas en `05-articulo/`.
- Plantillas versionadas: cada ajuste sube la versión y se anota en su historial.
