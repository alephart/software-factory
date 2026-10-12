---
tags: [modelo]
creado: 2026-09-28
---

# Ajustes al planteamiento

Volver a [[README]] · Siguiente: [[escalera-de-madurez]]

## 1. Agregar la etapa de Operación

El flujo Intake → Triage → Planning → Building → Review → Done termina en el despliegue, pero en agentes conversacionales lo más valioso pasa después: conversaciones reales, soporte, quejas y fallas del agente. Una fábrica real es un **ciclo**:

**Intake → Triage → Planning → Building → Review → Done → Operación → Intake**

Sin Operación, los bugs que encuentra el cliente nunca se convierten en pruebas.

## 2. Autonomía por etapa, no un nivel global

Los niveles de Shapiro miden cuánta autonomía tiene la IA. Nuestra tesis mide cómo un emprendimiento madura hasta ser fábrica. Se define la autonomía **etapa por etapa y de forma deliberada**: Building puede ser muy autónomo mientras Triage y el gate de merge siguen siendo humanos. Eso es diseño, no inmadurez. El problema actual no es la poca autonomía, sino que su distribución es accidental.

## 3. Medir antes de cambiar

Para que el artículo tenga un "antes y después" con números, hace falta línea base. Dos o tres semanas midiendo el estado actual:

- Tiempo de intake a Done
- Fallas detectadas por el pipeline vs. por el cliente
- Trabajo reabierto
