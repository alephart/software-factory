---
tags: [leccion, intake, nivel-1]
creado: 2026-09-28
actualizado: 2026-10-03
---

# Lección 1 — Intake

Volver a [[README]] · Plantilla: [[intake]]

## Idea central

El intake convierte una **petición** (algo que alguien dice) en una **unidad de trabajo** (algo que el proceso puede mover, comparar y medir).

Analogía: la recepción de una clínica. Registra quién llegó, qué le pasa y desde cuándo. No diagnostica ni decide el tratamiento. Sin recepción, cada paciente entra al consultorio que tenga la puerta abierta.

## Cuatro principios

1. **Intake registra, no decide.** Priorizar y diagnosticar es trabajo de triage. Mezclarlos hace que quien registra filtre con su criterio y se pierda visibilidad.
2. **Separar problema de solución.** El cliente trae soluciones; el intake captura el dolor. La solución se anota aparte como sugerencia.
3. **Evidencia siempre.** Sin evidencia no hay verificación posterior. La evidencia es la materia prima de los escenarios de prueba (nivel 3).
4. **Pocos campos.** Un formulario exhaustivo parece riguroso pero se abandona. Solo lo que triage necesita para decidir.

## Criterio de "intake listo"

Un ítem está listo cuando **triage puede empezar sin tener que preguntarle nada a quien reportó**.

## Conexión con el resto de la fábrica

- La evidencia del intake → escenarios de regresión en Review (nivel 3).
- La fecha de intake → inicio de la métrica de lead time (nivel 4).
- Los campos `línea` y `tipo` → separan la fábrica de plataforma de la fábrica de agentes.

## Preguntas para verificar comprensión

- ¿Por qué el intake no debe priorizar?
- ¿Qué pasa con un ítem que llega sin evidencia?
- ¿Cuál es la diferencia entre el campo "problema" y el campo "solución sugerida"?

## Aprendizajes de la prueba

### Caso 1, versión 1 — "El agente no responde precios" (2026-10-03, Plane)

Lo que funcionó:
- Problema descrito desde el cliente, sin proponer solución.
- Evidencia adjunta (captura de la conversación).
- Impacto claro sobre el flujo comercial.
- Prioridad sin asignar: correcto, eso es de triage.

Lo que aprendimos:
- **El título asumió la causa.** "Precios ya almacenados" afirma algo que la propia revisión contradice. El título debe describir el síntoma observado, no una hipótesis.
- **Diagnóstico colado en el intake.** Va como comentario, como primer hallazgo de triage.
- **El tipo es percepción, no veredicto.** Quien reporta dice "bug"; triage confirma.
- **Faltó la línea.** Era `agente-cliente`.
- **Evidencia trazable.** Anotar fecha o identificador de la conversación.
- **Generalización en el título.** "Agentes" (plural) cuando la evidencia es de un solo agente.

### Caso 1, versión 2

Mejoró: título corregido, contexto de cliente/agente, sugerencia y condiciones del cliente registradas.

Aprendizaje clave — **las condiciones del cliente valen más que su sugerencia.** "Los precios cambian constantemente" descarta la solución ingenua (copiar precios al documento de conocimiento). Por eso la plantilla v0.3 separa sugerencia y condiciones.

### Caso 1, versión 3 — aprobado ✅

Mejoró: estructura con encabezados, línea y tipo explícitos, evidencia con fecha, frecuencia en el impacto, diagnóstico movido a comentario.

Detalles menores que quedan como hábito:
- No repetir en "Problema" lo que ya está en los metadatos (quién y por qué canal reportó).
- La fecha sola puede no bastar si hay muchas conversaciones ese día: agregar ID o referencia del contacto.
- Precisar el alcance de la frecuencia: "en cada conversación **donde preguntan precio**".

Puente hacia triage: el comentario reveló que el conocimiento le indica al agente remitir al asesor en todos los ítems. **El agente está haciendo lo que se le pidió.** Lo que llegó como "bug" probablemente es un cambio de requisito del cliente. Esto se resuelve en la [[02-triage|Lección 2]].
