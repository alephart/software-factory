---
tags: [modelo, madurez]
creado: 2026-09-28
nivel_actual: 1 (en curso)
actualizado: 2026-10-10
---

# Escalera de madurez: de emprendimiento a software factory

Volver a [[README]] · Contexto: [[ajustes-al-planteamiento]] · Diagnóstico: [[problemas-por-etapa]]

Cada nivel tiene un criterio de salida verificable. No se avanza sin cumplirlo.

## Nivel 1 — Visible

- Todo el trabajo entra por una sola cola, con plantilla: tipo (feature / bug / onboarding de agente / deuda), línea (plataforma o agente de cliente), evidencia e impacto.
- Producto es dueño del intake de cliente; el fundador técnico, del intake técnico.
- Empieza la medición de línea base.

**Criterio de salida:** dos semanas sin trabajar en nada que no esté en la cola, con línea base de tiempos.

## Nivel 2 — Definido

- Cada etapa tiene entrada, salida y dueño.
- Triage clasifica por causa raíz: prompt / conocimiento / datos estructurados / infraestructura / integración.
- Definition of Done por tipo de trabajo.
- Límite de trabajo en curso (ej.: máx. dos ADRs abiertos sin implementar).
- Gate de especificación: producto y técnica firman antes de construir; los desacuerdos se resuelven ahí.

**Criterio de salida:** ningún ítem en estado "parcial" sin fecha ni dueño.

## Nivel 3 — Verificado (el salto más importante)

- Set de **escenarios conversacionales** a partir de conversaciones reales, curados por producto, guardados fuera del alcance de los agentes que construyen (principio holdout).
- Cada bug de producción se convierte en escenario de regresión.
- Simulador que corre los escenarios contra el agente en staging antes de cada despliegue (nuestro equivalente a un digital twin de WhatsApp).
- Errores repetidos → chequeos automáticos en el pipeline (ej.: validación de esquema en migraciones).

**Criterio de salida:** ningún despliegue de agente sin correr escenarios; la mayoría de fallas se detectan antes que el cliente.

## Nivel 4 — Medido y en ciclo

- Etapa de Operación formalizada: cada caso de soporte se registra con categoría; los repetidos se vuelven tickets o mejoras de conocimiento.
- Métricas semanales: tiempo intake → Done, % fallas detectadas por pipeline vs. cliente, trabajo reabierto.
- Autonomía por etapa definida por escrito: dónde actúa un agente solo, dónde propone, dónde decide un humano.

**Criterio de salida:** las decisiones de proceso se toman con esas métricas.

## Nivel 5 — Escalable

- Cada gate documentado para que una persona nueva lo ocupe con sus artefactos: guía de triage, plantilla de ADR, set de escenarios, checklist de onboarding de agentes.
- Fábrica de agentes y fábrica de plataforma operan por separado.

**Criterio de salida:** una persona nueva ocupa un gate (QA, soporte u onboarding) en menos de dos semanas sin depender de conversaciones con los fundadores.

> El nivel 5 es la tesis: el objetivo no es trabajar sin humanos, sino que **agregar humanos sea fácil** porque el proceso ya existe y los agentes ocupaban esos puestos mientras tanto.

## Registro de avance

| Fecha | Nivel | Nota |
|---|---|---|
| 2026-09-28 | 0 | Modelo definido. Siguiente: plantillas nivel 1 y 2. |
| 2026-10-03 | 1 (en curso) | Proyecto Request como cola única con plantilla de intake. Empieza el registro de tiempos con el caso 1. |
| 2026-10-10 | 1 (en curso), con piezas de 2 y 3 | Nivel 1 aún no cumple su salida (7 días de cola, se piden 14, y sin línea base de tiempos de esfuerzo). Nivel 2 parcial: triage por causa raíz, DoD v0.1, gate de especificación, revisor de planes. Nivel 3 adelantado por necesidad: staging equivalente a prod, suites de regresión por agente, línea base y A/B con regla previa. Falta para 3: holdout de las suites y que ningún despliegue salga sin correrlas. Ver [[04-caso-1-retrospectiva]]. |
