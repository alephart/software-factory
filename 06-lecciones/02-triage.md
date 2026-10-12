---
tags: [leccion, triage, nivel-2]
creado: 2026-10-03
actualizado: 2026-10-03
---

# Lección 2 — Triage

Volver a [[README]] · Plantilla: [[triage]] · Anterior: [[01-intake]]

## Idea central

Triage es **diagnóstico + decisión**. Toma una unidad de trabajo del intake y decide qué es realmente, por qué pasa, qué tan importante es y a dónde va.

Analogía: el triage de urgencias. La enfermera de triage no opera ni define el tratamiento: evalúa la gravedad, identifica qué especialidad necesita el paciente y define el orden de atención. Si triage empieza a tratar, la sala de espera se llena.

## Las cuatro preguntas de triage

1. **¿Es real y es nuestro?** → aceptar · rechazar · duplicado · posponer
2. **¿Cuál es la causa raíz?** → categoría (ver abajo)
3. **¿Qué tipo es realmente?** → confirma o corrige la percepción del intake
4. **¿Qué tan importante es y a dónde va?** → prioridad, responsable, siguiente etapa

## Principios

1. **Decidir con evidencia, no con intuición.** Las hipótesis se listan y se descartan con datos.
2. **Triage no resuelve.** Identifica la causa y la ruta; el diseño de la solución es de Planning.
3. **Tiempo acotado.** ~15 minutos por ítem. Si no alcanza, el resultado es "requiere investigación".
4. **Prioridad por rúbrica, no por quién insiste.**
5. **Un intake puede convertirse en varios ítems.** Si toca dos líneas, se separa.

## Categorías de causa raíz

| Causa                 | Señal típica                                                            | Dónde se arregla                |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `requisito`           | El sistema hace lo que se pidió, pero el cliente ahora quiere otra cosa | Spec / conocimiento del cliente |
| `conocimiento`        | La información no está o está mal                                       | Curación                        |
| `prompt`              | La información existe, pero el agente la usa mal                        | Instrucciones del agente        |
| `datos-estructurados` | Tablas de configuración incorrectas o no consultadas                    | Datos / herramienta del agente  |
| `integracion`         | Falla un servicio externo                                               | Plataforma / proveedor          |
| `codigo`              | Bug en la lógica de la plataforma                                       | Plataforma                      |
| `investigar`          | No se pudo determinar en el tiempo de triage                            | Spike acotado                   |

## Rúbrica de prioridad

| Prioridad | Criterio |
|---|---|
| **Urgente** | Información incorrecta o riesgosa (en salud, siempre), agente caído, o pérdida de leads/citas en todas las conversaciones sin alternativa |
| **Alta** | Afecta el flujo comercial con frecuencia, pero existe alternativa |
| **Media** | Casos ocasionales o mejora con impacto claro |
| **Baja** | Mejora deseable sin impacto medible inmediato |

## Ejemplo resuelto: caso 1 (precios)

- **Decisión:** aceptar.
- **Causa:** `requisito` (el agente cumplía la instrucción de remitir al asesor; el cliente cambió lo que quiere).
- **Tipo:** `bug` → `feature`.
- **Condición determinante:** los precios cambian con frecuencia → se necesita fuente viva.
- **Dos ítems:** ajuste de instrucción del agente (agente-cliente) + capacidad de precios vigentes (plataforma, con ADR).
- **Prioridad:** Alta.

## Preguntas para verificar comprensión

- ¿Por qué el caso 1 no es un bug?
- ¿Por qué triage no debe diseñar la sincronización de precios?
- ¿Qué cambiaría la prioridad a Urgente?

## Aprendizajes de la prueba

### Caso 1 en Plane (2026-10-03)

Decisión de estructura: se creó el proyecto **Request** como puerta única de entrada. Los proyectos de módulo (Agent, Portal, Booking, etc.) reciben solo trabajo ya triado. Request = recepción; módulos = consultorios.

Lo que funcionó:
- Comentario de triage completo, con hipótesis, causa, tipo, prioridad e ítems resultantes.
- El hallazgo inicial del intake quedó como comentario separado: se preserva la trazabilidad.

Lo que aprendimos:
- **Las guías de la plantilla se borran.** Quedó el texto "(si cambió respecto al intake, decir por qué)" sin completar. → v0.2 marca explícitamente qué es guía.
- **Sin responsable no hay triage terminado.** Los dos ítems quedaron con responsable vacío. Un ítem sin dueño es el origen de los estados "parciales" del diagnóstico.
- **La siguiente etapa es por ítem, no global.** El ajuste del agente va a planning ligero; la capacidad de plataforma, a planning con ADR.
- **Mover entre proyectos puede perder evidencia.** La captura de pantalla no se trasladó con el ítem. Verificar adjuntos después de mover.
- **Hacer explícitos los supuestos.** "El requisito cambió" se infiere de lo que dijo el cliente; el comportamiento provisional (enviar enlace + remitir al asesor) debe confirmarse con el cliente.
- **Copiar el análisis de otro no es hacer triage.** El ejemplo resuelto sirve para aprender el razonamiento; en los próximos casos, el triage lo escribe el equipo.
