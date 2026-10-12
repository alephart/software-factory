---
tags: [modelo, recomendaciones]
creado: 2026-09-28
---

# Recomendaciones adicionales

Volver a [[README]] · Ver [[escalera-de-madurez]]

## Proteger el tiempo de producto

Hoy producto ocupa intake, curación, revisión y soporte a la vez: el cuello de botella humano más probable. En el nivel 3, parte de su revisión manual pasa a escenarios automáticos y su foco se mueve a **diseñar escenarios**. Es la mejor inversión de su tiempo.

## Empezar por la fábrica de agentes

Es más repetible, se ve rápido y cada cliente nuevo es un experimento del proceso. Primer caso a documentar: el onboarding de un cliente de productos adaptado desde la estructura de clínicas.

## Usar nuestros propios agentes en la fábrica

Primer agente de proceso: un **agente de triage** que clasifique tickets entrantes por causa raíz, entrenado con los casos ya resueltos. Encaja con la práctica de empezar la fábrica por triage.

## Ajustes prioritarios (resumen)

1. Review de agentes con escenarios como holdout, incluyendo cada bug de producción como regresión.
2. Definition of Done por tipo: feature, bug, onboarding de cliente, ADR.
3. Límite de trabajo en curso para ADRs.
4. Cola única de intake con plantilla mínima.
5. Chequeos automáticos para errores ya repetidos.
6. Métricas simples desde ya: lead time, fallas pipeline vs. cliente, reabiertos.
