---
tags: [plantilla, nivel-1, intake]
version: 0.4
creado: 2026-09-28
actualizado: 2026-10-05
estado: validada-caso-1
---

# Plantilla de Intake

Volver a [[README]] · Lección: [[01-intake]] · Siguiente etapa: triage (pendiente)

> **Propósito:** convertir una petición en una unidad de trabajo que se pueda mover, comparar y medir.
> **Regla:** el intake registra, no decide. No prioriza ni diagnostica.
> **Dónde vive:** los ítems se registran en Plane (Intake). Este archivo define el proceso, no guarda los ítems.
> **Listo cuando:** triage puede empezar sin preguntarle nada a quien reportó.

---

## Campos

**1. Título**
Una línea que describa el **síntoma observado**: ni la solución ni la causa supuesta. Con el alcance que muestra la evidencia (un agente, no "los agentes", si solo hay un caso).
- ✅ "El agente de un cliente no responde el precio de los productos"
- ❌ "Agregar precios al conocimiento" (solución)
- ❌ "Los agentes no muestran los precios almacenados" (causa supuesta + generalización)

**2. Línea**
`plataforma` | `agente-cliente`
¿Afecta al sistema para todos, o a la configuración/conocimiento de un cliente específico?

**3. Tipo (según quien reporta)**
`bug` | `feature` | `onboarding-agente` | `deuda-tecnica` | `soporte`
Es una percepción inicial; triage la confirma o la corrige.

**4. Reportado por (rol) y canal**
Rol: producto · técnico · ventas · cliente
Canal: conversación con cliente · soporte · revisión interna · monitoreo

**5. Problema**
Qué pasa, en palabras de quien lo vive. Sin proponer solución ni diagnóstico. Sin repetir los metadatos.

**6. Evidencia**
**Obligatoria.** Lo que cuenta como evidencia depende del tipo:
- **Bug:** un artefacto rastreable: captura, fragmento de conversación, dato o enlace, **más fecha e identificador de la conversación o del contacto**, para poder encontrarla y convertirla en escenario de prueba.
- **Feature o pedido del cliente:** la **fuente de la necesidad**: quién la pidió, cuándo y con qué palabras. Si no hay registro escrito, se acepta un **testimonio fechado** de quien estuvo presente, marcado como tal ("Testimonio de <rol>: conversación no grabada").
- **Interno (deuda técnica, revisión):** dónde y cuándo se observó (archivo, revisión, auditoría).

Si no hay evidencia ni testimonio, el ítem queda en estado `falta-evidencia`.
Un testimonio es evidencia válida pero débil: triage debería pedir que la siguiente conversación con el cliente quede por escrito.

**7. Impacto**
¿A quién afecta? ¿Con qué frecuencia y en qué tipo de conversación? ¿Qué se pierde (un lead, una cita, tiempo del cliente, confianza)?

**8. Sugerencias y condiciones del cliente** _(opcional)_
- **Sugerencia:** la solución que propone quien reporta, si la tiene.
- **Condiciones:** reglas de negocio o restricciones que el cliente menciona (frecuencia de cambio de datos, qué no se puede decir, a quién derivar). Son requisitos, no soluciones, y suelen descartar las soluciones ingenuas.

> Si al registrar ya revisaste algo (por ejemplo, el conocimiento del agente), anótalo como **comentario** del ítem: será el primer hallazgo de triage, no parte del reporte.

---

## Formato para copiar en Plane

> Las plantillas de work item de Plane requieren plan de pago. Mientras tanto, copiar y pegar este bloque al crear cada ítem.

```
Línea: agente-cliente | plataforma
Tipo (percepción): bug | feature | onboarding-agente | deuda-tecnica | soporte
Reportado por: <rol> · Canal: <canal>
Cliente/agente: <si aplica>

## Problema
## Evidencia
(captura + fecha + ID de conversación o contacto)
## Impacto
(a quién, frecuencia y en qué tipo de conversación, qué se pierde)
## Sugerencias y condiciones del cliente
- Sugerencia:
- Condición:
```

---

## Estado al salir de intake

`nuevo` → pasa a triage
`falta-evidencia` → vuelve a quien reportó

## Métricas que habilita

- Volumen de trabajo entrante por semana, por tipo y por línea
- Punto de inicio para medir el tiempo de intake a Done
- Proporción de trabajo que viene de clientes vs. interno

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-09-28 | Primera versión, pendiente de prueba con casos reales |
| 0.2 | 2026-10-03 | Tras caso 1: título = síntoma sin causa ni generalización; tipo como percepción; evidencia con fecha/ID; diagnósticos van como comentario |
| 0.3 | 2026-10-03 | Campo 8 pasa a "Sugerencias y condiciones del cliente"; formato con encabezados para Plane; validada con caso 1 |
| 0.4 | 2026-10-05 | Evidencia según tipo: artefacto para bugs, fuente de la necesidad para features (se acepta testimonio fechado), observación para lo interno. Surgió de REQUEST-4 (pedido nacido en una conversación no grabada) |
