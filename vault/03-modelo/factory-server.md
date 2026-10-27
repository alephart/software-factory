---
tags: [modelo, infraestructura, factory-server]
creado: 2026-10-21
estado: decidido
item: FACTORY-11
---

# Servidor de la Factory (factory-server)

Volver a [[README]] · Relacionado: [[fabrica-y-productos]] · [[05-mastra-factory-prueba]]

## Decisiones (21/10)

| Tema | Decisión |
|---|---|
| Motor y UI | Mastra Factory autoalojada, ejecutando **nuestras skills** (`src/mastra/public/factory-skills/`, copiadas del kit) |
| Repo | `alephart-co/factory-server` (nuevo, privado). Separado de `software-factory` (vault + kit) |
| Servidor | DigitalOcean, Droplet **dedicado** de 8 GB / 4 vCPU / 160 GB (~USD 48/mes) |
| Dominio | `factory.alephart.co` |
| Entrada pública | Túnel de Cloudflare (sin puertos abiertos) |
| Acceso | **WorkOS** desde el inicio (la interfaz de la Factory no funciona sin login; `MASTRACODE_AUTH_DISABLED` no sirve para la UI). Entorno *Staging* de WorkOS para local, *Production* para el servidor. Cloudflare Access opcional como capa extra |
| Base de datos | Postgres con pgvector + Redis en el mismo Droplet (Docker Compose) |
| Agentes | En el mismo Droplet mientras solo se toquen repos de prueba; **E2B más adelante**, antes de tocar CC o Agenttia |
| GitHub | GitHub App propia en la organización `alephart-co` |
| Modelos | Llaves propias (Anthropic, OpenAI u otros), con límite de gasto |
| Local | Solo desarrollo: `pnpm dev` + docker-compose en el Mac, con WorkOS Staging |

## Reglas

- **Droplet dedicado:** no se comparte con n8n ni con nada que tenga credenciales de productos.
- **Cero credenciales de producción** en el servidor de la Factory.
- Cloudflare Access debe dejar pasar sin login la ruta de webhooks de GitHub (y solo esa).
- Respaldo diario de Postgres; la llave de cifrado de credenciales y los secretos de firma se guardan fuera del Droplet.

## Fases

1. **Local:** crear `factory-server` sin plataforma, GitHub App propia, un issue de `factory-sandbox` hasta Done con las skills de Mastra.
2. **Nuestras skills:** triage con aprobación humana y sin crear etiquetas, plan con nuestra plantilla, plan-reviewer independiente, review con reglas del repo. **Escritas el 22/10** (ver abajo); falta probarlas con un issue.
3. **Servidor:** Droplet + Docker Compose + túnel + respaldos; el mismo issue de prueba hasta Done. **Despliegue escrito el 23/10** (ver abajo); falta montarlo.
4. **Primer producto:** con E2B, Agenttia (caso 2).

## Lecciones de la fase 1 (local, 22/10)

- **WorkOS es obligatorio**: la interfaz no funciona con `MASTRACODE_AUTH_DISABLED`.
- **Llave de Anthropic dentro de un workspace** (`factory-dev`): una llave sin workspace falla con `anthropic-workspace-id`.
- **Sin webhooks, la revisión automática no arranca**: el evento "PR abierto" solo llega por webhook. La sincronización
  periódica detecta issues nuevos y merges, pero no crea la tarjeta de revisión.
- ~~Una revisión lanzada a mano no puede registrar el veredicto~~ **Corregido el 22/10:** la causa real era que faltaba
  `MASTRACODE_PUBLIC_URL`; sin ella Mastra no entrega `factory_review_source` a **ninguna** sesión de review. Ver [[06-factory-primer-recorrido]].
- **No tocar GitHub a mano** mientras la tarjeta avanza (merge antes del Review → revert → tarjeta enredada).
- **Conclusión:** para el flujo completo hacen falta webhooks: túnel de Cloudflare en el servidor (fase 3) o un túnel
  temporal en local.

## Fase 2 — nuestras skills (22/10: probadas de punta a punta con factory-sandbox #2)

Viven en `factory-server/src/mastra/public/factory-skills/`; el detalle está en `factory-server/docs/factory-skills.md`.

| Skill | Cómo | Regla de la fábrica que lleva |
|---|---|---|
| `factory-triage` v0.1 | Reemplazo completo | Plantilla de [[triage]] v0.5; nunca etiquetas; nunca avanza la tarjeta (pide la etapa actual) |
| `factory-plan` v0.1 | Reemplazo completo + `references/plantilla-plan.md` | Plantilla de plan; Fase 0 versiona el plan en `docs/tasks/`; publica el plan en el issue |
| `factory-plan-review` v0.1 | Skill nueva | `plan-reviewer-agent` v0.3; sesión nueva, solo lee, veredicto en el issue |
| `factory-review` / `factory-rereview` | **Generadas** (`npm run skills:build`) | La de Mastra + `skills-src/reglas-del-repo.md` antes del veredicto (`reviewer-agent` v0.3) |

**Hallazgos del código de Mastra (`@mastra/factory@0.24.0`):**
- El override es **por archivo**, no por carpeta: una skill local reemplaza `SKILL.md` y las `references/` empaquetadas siguen visibles.
  Por eso la review se **genera** (insertar una sección) en vez de reescribir 100 KB atados a herramientas internas.
- **No hay subagentes** en las sesiones de la Factory (`subagents: []`): el plan-reviewer no puede correr dentro de la sesión del plan.
  Se resolvió como skill aparte en **sesión nueva**, que además permite elegir otro modelo. El plan se publica en el issue
  (`<!-- agenttic-factory-plan -->`) para que esa sesión lo lea sin heredar contexto.
- La política del tablero Work ya da dos frenos: solo un `bug` puede pasar solo a Planning, y con *Auto-approve plans* apagado
  ningún agente pasa a Building. Nuestro triage va más allá: tampoco avanza los bugs.
- El builder recibe "Implement the approved plan" en el mismo hilo; no hay skill de build que adaptar. Para que el plan viva en el repo,
  la plantilla trae la Fase 0.

**Desvíos frente a la decisión del 21/10:** las skills no se "copian del kit" tal cual: el kit tiene agentes de Claude Code, no skills
de la Factory. Se derivaron de ellos y desde ahora son de `factory-server`, con su versión. La regla de CI de la fábrica (CI en rojo bloquea)
prevalece sobre la de Mastra (CI solo informa).

**Probado el 22/10** (skills hasta v0.4): recorrido completo de `factory-sandbox` #2, con túnel temporal de Cloudflare para los webhooks.
Resultados, defectos corregidos, modelos y mejoras en [[06-factory-primer-recorrido]]. **Fase 2 cerrada el 23/10** con el merge del PR #11.
Dirección para integrar Plane sin construir módulo: misma nota, sección "Plane ↔ GitHub".

## Fase 3 — servidor (23/10: despliegue escrito, sin montar)

En `factory-server`, rama `factory-11/fase-3`: `deploy/` y `docs/runbook-servidor.md` (el runbook es la guía paso a paso).

| Pieza | Cómo |
|---|---|
| Imagen | `deploy/Dockerfile`: Node 22 + git + `gh` + pnpm, usuario `node`. **No se construye** si fallan `skills:test` o `board:test` |
| Servicios | `deploy/docker-compose.prod.yml`: `app` (4111 interno), `db` (`pgvector/pgvector:pg18`), `tunnel` (`cloudflared` con token). Sin puertos publicados |
| Secretos | Dos archivos: `deploy/.env` (Compose: Postgres, túnel) y `deploy/app.env` (app). Los críticos con copia en el gestor de contraseñas |
| Sandbox | Local dentro del contenedor, con clones y HOME en el volumen `/data`; tope de 3 sandboxes |
| Respaldo | `deploy/backup.sh`: `pg_dump` diario por cron, 14 días, copia a Spaces con rclone; restauración probada en base aparte |
| SO | `unattended-upgrades` con reinicio automático; imágenes actualizadas cada mes |

**Desvíos frente a la decisión del 21/10:**
- **Sin Redis.** El servidor es un solo proceso (así se probó la fase 2); Redis Streams solo hace falta con varias réplicas.
- **Sin Cloudflare Access** en esta fase: WorkOS ya exige login. Si se agrega, *Bypass* solo para `/web/github/webhook`.
- **Postgres confirmado en el Droplet** tras evaluar Supabase: serviría, pero exige *Session pooler* o conexión directa
  (Mastra usa *advisory locks*, incompatibles con el pooler de transacciones), org propia y plan Pro.
- "Droplet dedicado" = dedicado a la Factory (Basic 8 GB / 4 vCPU), no CPU dedicada.

**Riesgo aceptado en la fase 3:** con la sandbox local, un agente corre en el mismo contenedor que la app y podría leer sus secretos
(llave de la GitHub App, WorkOS, llave de cifrado). Aceptable solo con `factory-sandbox`. E2B va antes de instalar la App en cualquier
repo de producto; para eso la App pasa a *Any account* y se instala en la cuenta del producto, sin mudar el repo.

**Sin probar todavía:** la construcción de la imagen, `varlock run` con el entorno del contenedor y la llave PEM en `app.env`.
