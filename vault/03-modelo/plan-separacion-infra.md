---
tags: [plan, infraestructura, agenttia, conversion-chat]
creado: 2026-10-05
estado: por-ejecutar
ítem: REQUEST-8
---

# Plan: separar la infraestructura de Agenttia y de Conversion Chat

Volver a [[00-estado-actual]] · Ítem: REQUEST-8 · Decisión de origen: 04/10 (stage = Agenttia v2)

> **Objetivo:** que cada recurso (repo, rama, Supabase, Railway, Cloudflare, carpeta local)
> pertenezca a **un solo producto y un solo entorno**, con nombre que lo diga.
> Al terminar, AGENT-38 tiene dónde probarse antes de producción.
> **Regla:** primero inventario y decisiones, después cambios. Nada en producción cambia en este plan.

---

## Bloque 0 — Arranque (10 min)

- Triage rápido de REQUEST-8: aceptarlo y moverlo a PLATFORM como ítem del plan.
- Confirmar que AGENT-38 está en pausa, con su trabajo commiteado en `feature/AGENT-38-precios-catalogo`.

## Bloque 1 — Inventario (solo lectura, con Claude Code)

Una tabla única con estas columnas: **recurso → producto → entorno → rama/fuente → estado → acción**.

| Dónde | Qué listar |
|---|---|
| GitHub | repos, ramas vivas, tags, PRs abiertos, workflows |
| Supabase | organizaciones, proyectos, a qué rama corresponde el esquema de cada uno |
| Railway | proyectos, environments, servicios, variables (solo nombres, nunca valores) |
| Cloudflare | Workers/Pages de admin, portal y agenda; environments de wrangler; dominios |
| Local | carpetas en `~/Projects`, worktrees, `.env*` (solo nombres) |
| Canales | números o cuentas de WhatsApp/Instagram por entorno |

Buena parte ya está en los reportes de la auditoría del 04/10: hay que reutilizarlos y no repetir trabajo.

## Bloque 2 — Decisiones (30 min, humanas)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Los entornos de staging actuales (que corren la v2) pasan a Agenttia, o se quedan con CC? | **Pasan a Agenttia como su entorno dev.** Ya tienen el esquema y el código de la v2. CC crea entornos nuevos desde master, lo que de paso valida que las migraciones de master reproducen prod |
| D2 | ¿Dónde vive Agenttia? | Repo GitHub propio; carpeta local propia; proyecto Railway propio, o por ahora el environment heredado, documentado como de Agenttia |
| D3 | Convención de nombres | `cc-prod`, `cc-staging`, `agenttia-dev` en Supabase, Railway, Workers y variables |
| D4 | Datos de IMEC en staging de CC | Se copian la configuración del cliente y el agente, el prompt y los documentos de conocimiento, que se re-ingestan. **No** se copian conversaciones, leads ni teléfonos |
| D5 | Canal para probar en staging | Un número de WhatsApp de prueba o el script de canal no-op que propuso el plan de AGENT-38. Puede ser el script primero y el número después |

## Bloque 3 — Agenttia

1. `git tag agenttia-v2-base origin/stage` y push del tag.
2. Crear el repo de Agenttia y subir el tag como su rama principal, conservando la historia.
3. Clonarlo en su carpeta local.
4. Reasignar los entornos heredados (según D1) y documentarlos en el repo nuevo. Los deploys salen de ese repo.
5. En el repo de CC, `stage` queda congelada; se elimina después de verificar que el repo de Agenttia está completo.
   El PR gemelo de #207 para stage se cierra con una nota.

## Bloque 4 — Staging de Conversion Chat

1. Rama `cc-stage` desde master.
2. **Supabase:** proyecto nuevo en la organización Conversion-staging.
   - `supabase db push` con las migraciones de master. Si falla, es un hallazgo: master no reproduce prod.
   - Seed: usuarios de prueba y el cliente IMEC con su agente (D4).
3. **Railway:** environment de staging de CC con variables apuntando al Supabase nuevo; `railway up` desde `cc-stage`.
4. **Cloudflare:** environments de staging de admin, portal y agenda en wrangler, apuntando al Supabase nuevo, y deploy.
5. **Canal de prueba** según D5.
6. **Prueba de humo:** el agente de IMEC en staging responde con su conocimiento (RAG) y la key pública es rechazada (AGENT-21).

## Bloque 5 — Documentación y cierre

- `docs/ENVIRONMENTS.md` en CC: tabla de entornos, cómo se despliega cada pieza, rollback. Esto también cierra **REQUEST-3**.
- `AGENTS.md`: flujo de ramas `feature → cc-stage → master`.
- Repo de Agenttia: su propio `ENVIRONMENTS.md`.
- Vault: estado actual y README.
- REQUEST-8 a Done.

## Después: retomar AGENT-38

- Rebase de `feature/AGENT-38-precios-catalogo` sobre master y PR contra `cc-stage`.
- Rollout a staging (migración con dry-run, Railway, admin, workflow contra staging, escenarios 1–6) y luego a prod.
