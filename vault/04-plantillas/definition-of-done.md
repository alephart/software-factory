---
tags: [plantilla, nivel-2, nivel-3, done]
version: 0.3
creado: 2026-10-03
actualizado: 2026-10-24
estado: en-prueba
---

# Definition of Done

Volver a [[README]] · Flujo: [[flujo-planning-a-done]] · Origen de la v0.2: [[04-caso-1-retrospectiva]]

> **Regla:** un ítem está en Done solo si cumple **todo** su checklist. No existen estados "parcial", "casi" o "falta solo la UI": eso es un ítem abierto o un ítem nuevo.
> **Pegar como comentario** al mover a Done, marcando cada punto.

## Común a todos

- [ ] Cumple los criterios de aceptación del ítem
- [ ] Verificado en producción (no solo en staging)
- [ ] Ítem de Plane actualizado y enlazado al PR / cambio
- [ ] Si vino de Request: comentario en el ítem padre
- [ ] **Esfuerzo humano** anotado (horas aproximadas de atención humana, no de agentes):
  `Esfuerzo humano: triage Xh · planning Xh · building Xh · review Xh · salida Xh — estimado: N puntos`
- [ ] Los “Para registrar en el Intake” del PR quedaron registrados en Plane o descartados con motivo

## Si cambia el runtime de un agente o la plataforma

- [ ] Plan aprobado en el repo (`docs/tasks/<ítem>-plan.md`) y enlazado en Plane
- [ ] Validado en `cc-staging` antes de prod
- [ ] **Gate de regresión** (ver abajo) en PASA, con resumen versionado en el repo
- [ ] Salida a prod siguiendo un runbook ([[runbook-salida-a-prod]]): migración → merge → deploy → humo → habilitar
- [ ] Rollback escrito antes de salir

## Gate de regresión

1. **Línea base antes del cambio**, con la suite de los agentes en producción.
2. **Barrido:** toda la suite, **3 corridas** por ítem, base frente a candidato.
3. **A/B:** solo en los ítems que el barrido marca, **10 corridas por brazo**.
   La regla de decisión se escribe y se commitea **antes** de correr (por defecto: diferencia ≥ 0,40 y Fisher p < 0,05).
   Con 10 corridas se detecta una caída de 10/10 a 5/10; con 5 solo de 5/5 a 1/5.
4. Un ítem que no llega a significancia es **RUIDO (PASA)**, y la conclusión se apoya también en el diff.
5. Los REVISAR se cierran con una decisión humana registrada.

### Holdout de las suites

- **Suite visible** (`apps/agent/scripts/regression/`): protegida con CODEOWNERS; cualquier cambio a una suite lo aprueba producto.
  Los agentes builder no editan suites ni criterios para hacer pasar un cambio.
- **Set holdout** (5–8 casos por agente, de conversaciones reales, curado por producto): vive **fuera del repo**
  y solo lo corre el gate. Nunca entra al contexto de un agente builder.

## Por tipo

### bug
- [ ] Causa raíz documentada en el ítem
- [ ] **Escenario de regresión** agregado a la suite visible (aprobado por producto)
- [ ] Quien reportó fue notificado

### feature
- [ ] Escenarios de los criterios de aceptación agregados a la suite
- [ ] Documentación actualizada (AGENTS.md / docs / ADR si aplica)
- [ ] Producto validó el comportamiento

### onboarding-agente
- [ ] Conocimiento curado y revisado por producto
- [ ] Escenarios mínimos del cliente pasan (saludo, servicios, precios/política, agenda, cobertura, handoff)
- [ ] Suite del agente creada y casos holdout entregados por producto
- [ ] Número conectado y **cliente activado** con fecha
- [ ] Cliente recibió la guía de uso

### cambio en agente-cliente (conocimiento / instrucciones)
- [ ] Cambio aplicado; el **texto final** (prompt o fragmento de conocimiento) pegado en el comentario de cierre
  (no hay versionado de prompts en el admin todavía; decisión del 10/10)
- [ ] Escenario que lo prueba agregado a la suite
- [ ] Cliente notificado si el comportamiento visible cambió

### infraestructura
- [ ] Entorno documentado en `docs/ENVIRONMENTS.md`
- [ ] Rollback probado o documentado
- [ ] Credenciales temporales o de solo lectura retiradas (con registro en el ítem)

### deuda-tecnica
- [ ] Sin cambio de comportamiento (escenarios existentes siguen pasando)
- [ ] Motivo y resultado anotados en el ítem

### ADR
- [ ] Estado del ADR: aceptado / rechazado (no "propuesto" indefinido)
- [ ] Ítems de implementación creados en Plane

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-03 | Primera versión |
| 0.2 | 2026-10-10 | Ajuste del mismo día: sin versionado de prompts por ahora; el texto final va en el comentario de cierre. Retro del caso 1: esfuerzo humano al cerrar; sección de runtime/plataforma (plan en repo, cc-staging, runbook, rollback); gate de regresión 3 + 10 corridas con regla previa; holdout (suite visible con CODEOWNERS + set fuera del repo); tipo infraestructura |
| 0.3 | 2026-10-24 | Común a todos: los "Para registrar en el Intake" del PR quedan registrados en Plane o descartados con motivo (el riesgo es el olvido, no el tiempo; ver [[consolidacion-2026-10-23]], decisión B) |
