---
tags: [plantilla, nivel-3, salida-a-prod]
version: 0.1
creado: 2026-10-10
estado: en-prueba
---

# Runbook de salida a producción

Volver a [[README]] · DoD: [[definition-of-done]] · Origen: `docs/tasks/platform-59-salida-a-prod.md` (caso 1)

> **Dónde vive:** en el repo, `docs/tasks/<ítem>-salida-a-prod.md`, en la rama que sale. Se enlaza en Plane.
> **Reglas:** cada comando remoto se muestra antes de correrlo; nada en prod sin OK explícito, paso por paso;
> la rama se verifica justo antes de cada commit, push o deploy.

```
# <ÍTEM> — Runbook de salida a producción

Estado: LISTO | EN PAUSA (<quién, fecha>) | EJECUTADO (<fecha>)
Qué sale: <rama / PR> — <resumen>. Cambios de esquema: <migraciones, o "ninguno">
Por qué este orden: <qué se rompe si se invierte>

## Paso 0 — Pre-requisitos (sin tocar prod)
- [ ] Gate de regresión en PASA; REVISAR decididos
- [ ] Validación de producto (si cambia lo que ve el usuario final)
- [ ] master no avanzó (o se aplicó la política de hotfixes)
- [ ] type-check y pruebas en verde sobre la rama
- [ ] PR abierto, sin conflictos

## Paso 1 — Migración en prod (si hay)
<comandos: dry-run → push>
Verificar: <tablas, RLS, permisos>
Rollback: <aditiva → se corrige con migración nueva | otro>

## Paso 2 — Merge
Merge commit (no squash). <qué dispara el merge: auto-deploys>

## Paso 3 — Deploy
<servicios que no despliegan solos y cómo>
Rollback: <redeploy del commit anterior / revertir versión>

## Paso 4 — Humo en prod (funcionalidad nueva aún apagada)
- [ ] <health>
- [ ] <seguridad: llave pública rechazada, etc.>
- [ ] Un agente de prod responde igual que antes

## Paso 5 — Habilitar (último paso funcional)
<flag / tool / config>
Rollback: <apagarlo>

## Después de salir
- [ ] Comentario de DoD en cada ítem (con esfuerzo humano)
- [ ] Cierre en Request
- [ ] CHANGELOG y versión
- [ ] Pendientes y límites conocidos registrados en Request
```

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-10 | Generalizada desde el runbook de PLATFORM-59 / AGENT-38 |
