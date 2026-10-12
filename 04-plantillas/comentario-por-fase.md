---
tags: [plantilla, nivel-2, bitacora]
version: 0.1
creado: 2026-10-10
estado: en-prueba
---

# Comentario por fase (bitácora en Plane)

Volver a [[README]] · Origen: comentarios de PLATFORM-59 (caso 1)

> **Cuándo:** al cerrar cada fase de un plan aprobado, como comentario en el ítem de Plane.
> **Por qué:** fue la bitácora que permitió escribir la retrospectiva del caso 1 sin reconstruir nada.
> **Regla:** evidencia, no narración. Cada gate dice qué se verificó y con qué resultado.

```
Fases <N–M> (plan v<X>) — <nombre corto>. <fecha>.

<Fase N>: <qué se hizo, en una o dos frases>. <Commit / entorno / versión>.
<Gate>: IGUAL | PASA | FALLA | REVISAR — <qué se comparó y contra qué; cifras>.

Decisiones de <quién>: <decisión> — <motivo>.
Hallazgos: <lo inesperado>. → <REQUEST-n si se registró>.
Pendiente: <qué falta, de quién>.
Siguiente: <fase siguiente>.
```

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-10 | Primera versión, a partir de los comentarios de PLATFORM-59 |
