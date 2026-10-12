---
tags: [modelo, estructura, entrega]
creado: 2026-10-12
estado: decidido
---

# La fábrica y sus productos

Volver a [[README]] · Relacionado: [[escalera-de-madurez]] · [[flujo-planning-a-done]]

## Estructura (decidida el 12/10)

```
agenttic/
├── software-factory/          ← la fábrica: el molde
│   ├── vault/                 conocimiento, modelo, lecciones, calibraciones, artículo
│   ├── plantillas/            intake, triage, DoD, runbook, comentario por fase
│   ├── agentes/               reviewer, plan-reviewer, builders base
│   ├── ci/                    workflows modelo (CI, tag/release)
│   └── arnés/                 arnés de regresión genérico
├── conversion-platform/       ← producto (cliente de la fábrica)
└── agenttia/                  ← producto
```

La fábrica es dueña del **molde**; cada producto tiene su **instancia**.

## Principio: el producto se entrega sin la fábrica

> Si mañana alguien se lleva Conversion Chat, se le entrega su repo y lo necesario, y un equipo de desarrollo
> lo continúa **sin la fábrica y sin ajustes**. La fábrica es una forma de trabajar, no una dependencia.

Consecuencias:

1. **Copiar, no enlazar.** Lo que la fábrica instala en un producto se copia y pasa a ser del producto:
   agentes, CI, arnés, documentación. Nada de submódulos, plugins o paquetes que el producto necesite descargar de la fábrica para funcionar.
   (Esto reemplaza la idea de sincronizar con un plugin de Claude Code: un plugin puede *instalar* la copia, nunca ser requisito para operar.)
2. **El producto se explica solo.** Su README, `AGENTS.md`, `ENVIRONMENTS.md`, ADR, `VERSIONING.md` y runbooks bastan para
   instalar, desplegar, probar y operar. **Ninguna referencia a rutas del vault ni a la fábrica** en el repo del producto.
3. **Lo de Claude es opcional.** `.claude/agents/` son archivos de texto; un equipo sin Claude Code los ignora y nada se rompe.
   CI, pruebas y regresión corren con herramientas estándar (pnpm, GitHub Actions).
4. **Cuentas e infraestructura propias por producto.** GitHub, Supabase (org), Railway (proyecto), Cloudflare, dominio, Resend,
   Google (OAuth) y llaves de LLM de un producto no se comparten con otro. Se entregan transfiriendo la propiedad.
5. **Seguimiento propio.** El workspace de Plane del producto contiene solo trabajo del producto. El trabajo **de la fábrica**
   (plantillas, agentes, calibraciones) se registra fuera: proyecto FACTORY en el espacio de la fábrica, no en el de CC.
6. **Las mejoras viajan por copia versionada.** Cada copia lleva su versión (p. ej. `reviewer-agent v0.3 — fábrica`); el producto puede quedarse en una versión vieja sin romperse.

## Qué pertenece a quién

| Pieza | Producto | Fábrica |
|---|---|---|
| Código, migraciones, CI instalado, pruebas | ✔ | molde del CI |
| Arnés de regresión y suites de sus agentes | ✔ (copia del arnés + suites propias) | arnés genérico |
| ADR, ENVIRONMENTS, AGENTS.md, VERSIONING, runbooks por ítem, planes en `docs/tasks/` | ✔ | plantillas |
| `.claude/agents/` | ✔ (copia, opcional para quien recibe) | agentes base |
| Plane del producto (ítems, Request) | ✔ | — |
| Vault, modelo, escalera, lecciones, artículo, calibraciones | — | ✔ |
| Plantillas de intake/triage/DoD como proceso | — | ✔ (el producto puede llevarse una copia si quiere) |

## Prueba de entrega (criterio verificable)

Un equipo nuevo, solo con el repo, la documentación del repo y las credenciales transferidas, puede:
instalar en local, desplegar a staging y a producción, correr CI y la suite de regresión, y hacer un rollback.
Es el mismo espíritu del nivel 5 de la [[escalera-de-madurez]]: nadie depende de conversaciones con los fundadores.

## Brechas conocidas en Conversion Chat (12/10)

- **Supabase:** `cc-staging` vive en la org renombrada "Agenttia-stage" → CC no tiene su staging en una org propia.
- **Railway:** el proyecto de CC tiene el environment `staging` con la v2 de Agenttia → mezcla de productos.
- **Plane:** PLATFORM-60 (arranque de Agenttia) vive en el workspace de CC; pasa al de Agenttia al crearse.
- **Repo (revisado el 12/10 en `cc-stage`):** una sola referencia real: `docs/tasks/platform-59-staging-cc.md` dice que el plan aprobado está "en el vault".
  Se corrige llevando el plan v2.2 a `docs/tasks/platform-59-plan.md`. El `reviewer-agent` menciona "software factory" en su descripción: inofensivo, conviene neutralizarlo.
- Agentes y CI ya son copias locales: cumplen.
