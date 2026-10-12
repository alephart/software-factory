---
tags: [plantilla, nivel-2, triage]
version: 0.5
creado: 2026-10-03
actualizado: 2026-10-12
estado: en-prueba
---

# Plantilla de Triage

Volver a [[README]] · Lección: [[02-triage]] · Etapa anterior: [[intake]]

> **Propósito:** decidir qué es realmente el ítem, por qué pasa, qué tan importante es y a dónde va.
> **Regla:** triage diagnostica y decide; no diseña la solución.
> **Tiempo:** ~15 min por ítem. Si no alcanza → causa `investigar`.
> **Dónde vive:** como comentario en el ítem del proyecto **Request** (puerta única de entrada) en Plane, antes de aceptarlo.
> **Listo cuando:** cada ítem resultante tiene responsable y siguiente etapa, y quien lo recibe puede empezar sin preguntar.

---

## Bloque para copiar como comentario en Plane

> Los textos entre `< >` y entre paréntesis son guía: se reemplazan o se borran.

```
## Triage — <fecha> — <quién hizo el triage>
Decisión: aceptar | rechazar | duplicado de <ID> | posponer hasta <fecha>

Hipótesis revisadas:
- <hipótesis> → confirmada / descartada / parcial — evidencia: <qué se revisó>

Causa raíz: requisito | conocimiento | prompt | datos-estructurados | integracion | codigo | infraestructura | investigar
Tipo: <percepción del intake> → <tipo confirmado> — <por qué cambió, si cambió>

Prioridad: urgente | alta | media | baja
Justificación: <criterio de la rúbrica>

Ítems resultantes:
1. [<línea>] <qué hay que lograr, no cómo>
   Responsable: <persona> · Proyecto: <proyecto Plane> · Siguiente etapa: <etapa>
   Estimación: 1 | 2 | 3 | 5 | 8 | 13 puntos
2. ...

Pendientes / supuestos a confirmar:
- <lo que se asumió y hay que validar, con quién>
```

---

## Rúbrica de prioridad

| Prioridad | Criterio |
|---|---|
| **Urgente** | Información incorrecta o riesgosa al usuario final (en salud, siempre), agente caído, o pérdida de leads/citas en todas las conversaciones sin alternativa |
| **Alta** | Afecta el flujo comercial con frecuencia, pero existe alternativa |
| **Media** | Casos ocasionales o mejora con impacto claro |
| **Baja** | Mejora deseable sin impacto medible inmediato |

## Estimación (Fibonacci)

Se estima **al triar**, por cada ítem resultante, y se copia al campo de estimación del ítem en Plane.
Es complejidad relativa, no horas. Las horas reales se anotan al cerrar (ver [[definition-of-done]]).

| Puntos | Referencia |
|---|---|
| 1 | Ajuste puntual de conocimiento o de prompt, sin código |
| 2 | Cambio pequeño y conocido, un archivo o una tabla |
| 3 | Cambio acotado con pruebas y un escenario nuevo |
| 5 | Capacidad nueva en un módulo; plan ligero |
| 8 | Toca varios módulos o una migración; plan con revisor |
| 13 | Infraestructura o arquitectura; plan con revisor y staging. **Si pasa de 13, se divide** |

Referencias reales: AGENT-37 ≈ 3 · AGENT-38 ≈ 8 · PLATFORM-59 ≈ 13 (estimados después, caso 1).

## Rutas según causa

| Causa                    | Siguiente etapa típica                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| `requisito`              | Planning ligero (actualizar spec del agente) o ADR si requiere capacidad nueva |
| `conocimiento`           | Curación directa (producto) + escenario de regresión                           |
| `prompt`                 | Building directo con revisión + escenario de regresión                         |
| `datos-estructurados`    | Building directo                                                               |
| `integracion` / `codigo` | Planning (ADR si cambia arquitectura)                                          |
| `infraestructura`        | Planning (entornos, despliegue, ramas; nada en prod sin plan aprobado)         |
| `investigar`             | Spike con tiempo máximo definido                                               |

## Puerta única (decidido el 12/10, FACTORY-5)

| Qué llega | Por dónde entra | Quién lo registra |
|---|---|---|
| Pedido o problema de un cliente, de producto o de operación | **Solo por el Intake** de Request (CC) o Inbox (Agenttia) | Producto, el asistente de intake o un agente |
| Hallazgo que aparece **mientras se construye** un ítem ya triado | Directo en el proyecto de módulo, **enlazado al ítem padre** | Quien construye (humano o agente) |
| Trabajo de la fábrica misma | Proyecto FACTORY (workspace de Agenttia) | Quien lo detecta |

Reglas:
1. **En Request/Inbox no se crean ítems normales.** Todo lo que entra ahí nace como registro de Intake y solo pasa a ser ítem al aceptarlo en triage.
   Después del triage, el trabajo se asigna como ítems en su proyecto de módulo; el ítem de Request queda como padre/seguimiento.
2. **Los hallazgos en caliente** (creados directo en el módulo) entran al **triage por lotes de la semana**: se les pone causa, puntos y prioridad. Si al triarlos resulta que no son del ítem padre sino un pedido nuevo, se registran en Intake y se cierra el del módulo.
3. **Para agentes (Claude Code y cualquier cliente de Plane por MCP):** en Request o Inbox se usa **`intake create`**, nunca `workitem create`.
   Registrar "en Request" significa siempre "en el Intake de Request". Antes de escribir, verificar el workspace (`workspace retrieve`).

## Flujo en Plane

1. Ítem llega al Intake del proyecto **Request** (o **Inbox** en Agenttia). Nunca se crea como ítem normal.
2. Triage escribe el comentario con este bloque.
3. Se acepta en Request (queda como ítem padre / seguimiento del pedido original).
4. Se crea cada ítem resultante en su proyecto de módulo, relacionado con el ítem de Request.
5. Se aplican etiquetas de línea y causa, y la estimación en puntos.

## Etiquetas en Plane (para métricas)

- Línea: `linea:plataforma`, `linea:agente-cliente`
- Causa: `causa:requisito`, `causa:conocimiento`, `causa:prompt`, `causa:datos`, `causa:integracion`, `causa:codigo`, `causa:infraestructura`
- Las etiquetas son por proyecto en Plane: crear las que falten en el proyecto destino al crear el ítem.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-03 | Primera versión, construida a partir del caso 1 |
| 0.2 | 2026-10-03 | Quién hizo el triage; tipo con transición; responsable + proyecto + siguiente etapa por ítem; sección de supuestos a confirmar; flujo con proyecto Request |
| 0.3 | 2026-10-06 | Causa `infraestructura` (entornos, despliegue, ramas), surgida de REQUEST-8; nota de etiquetas por proyecto |
| 0.4 | 2026-10-10 | Estimación Fibonacci por ítem resultante, con tabla de referencia (decisión de la retro del caso 1) |
| 0.5 | 2026-10-12 | Puerta única: solo Intake en Request/Inbox; hallazgos en caliente al módulo enlazados al padre y al lote semanal; regla para agentes (`intake create`). FACTORY-5. Surgió de REQUEST-9 y 11 a 19 creados fuera de Intake |
