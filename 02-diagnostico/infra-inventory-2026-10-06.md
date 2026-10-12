# Inventario de infraestructura — 2026-10-06

Insumo de PLATFORM-59 (staging propio de Conversion Chat) y PLATFORM-60 (repo y entorno de Agenttia v2). Plan de origen: `03-modelo/plan-separacion-infra.md`, Bloque 1.

**Solo lectura.** No se creó, borró, desplegó ni cambió nada. No hay valores de secretos en este archivo: solo refs, dominios y nombres de variables. No se abrieron `~/Projects/agenttic/credentials` ni los `.sql` sueltos de `~/Projects/agenttic`. No se consultaron números de WhatsApp.

**Todas las filas son "verificado hoy" (2026-10-06).** Los reportes de la auditoría del 04/10 no existen, así que el inventario parte de cero.

## Criterios

| Columna | Valores y regla |
|---|---|
| producto | **CC** si hay evidencia directa de que sirve a Conversion Chat (master, producción, dominios `conversionchat.co`). **Agenttia v2** si la evidencia es la rama `stage`, el tag `agenttia-v2-base`, el repo o la organización de Agenttia. **ambiguo** si la evidencia es mixta o no alcanza; la observación dice por qué. |
| estado | **activo**: responde, recibe commits o despliega con actividad en los últimos 30 días. **obsoleto**: inactivo, pausado o sin actividad en más de 90 días. **roto**: existe pero falla o contradice su propia configuración. **sin determinar**: no se pudo verificar con acceso de solo lectura. |
| evidencia | Código del método usado, definido en la sección "Evidencia". |

## Inventario

### GitHub

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| `alephart/conversion-platform` | GitHub | ambiguo | todos | default `master` | activo | Privado. Contiene CC en `master` y la v2 en `stage`. Es el repo que antes se llamó `conversion-agenda` (GitHub redirige el nombre viejo). 0 PRs abiertos, 0 releases, 0 webhooks. Sin protección de ramas: el plan de GitHub no la ofrece en repos privados. | G1 G3 G5 |
| rama `master` | GitHub | CC | prod | último commit 2026-10-06 | activo | Los 3 Workers de producción se redespliegan al recibir commits aquí (ver Cloudflare). | G2 |
| rama `stage` | GitHub | Agenttia v2 | staging actual | último commit 2026-09-30 (merge PR #213) | activo | Respecto a `master`: 141 commits adelante y 28 atrás. Decisión del 04/10: es la base de la v2 (`00-estado-actual.md`). | G2 G4 |
| tag `agenttia-v2-base` | GitHub | Agenttia v2 | — | apunta a `0299c19`, igual a la punta de `stage` hoy | activo | Único tag del repo. Cumple el primer punto del alcance de PLATFORM-60. | G4 |
| 5 ramas de PRs ya mergeados | GitHub | CC | — | `chore/adr-034-reemplazado`, `feature/adr-035-structured-pricing`, `chore/agents-md-subagents`, `changeset-release/master`, `fix/agent-echo-window-first-turn-tools-master` | obsoleto | Siguen en el remoto aunque sus PRs ya se mergearon (#217, #216, #215, #203, #212). | G2 |
| ramas puente `chore/port-master-to-stage-*`, `chore/claude-md-to-agents-md-stage`, `fix/agent-*` de stage | GitHub | Agenttia v2 | staging | último commit 2026-09-01 a 2026-09-30 | obsoleto | Portes `master` a `stage` y fixes ya mergeados a `stage` (PRs #204, #208, #211, #213). | G2 |
| 75 de las 95 ramas | GitHub | ambiguo | — | último commit anterior a 2026-09-01 (desde 2026-05-22) | obsoleto | Ramas de features viejas (`feature/*`, `fix/*`, `develop`, `release/next`). No se verificó una por una si fueron mergeadas. | G2 |
| `railway/fix-deploy-3bf345` | GitHub | ambiguo | prod | 2026-05-26 | obsoleto | El prefijo `railway/` sugiere que la creó la integración de Railway con GitHub (inferido). | G2 |
| `.github/workflows/release.yml` (Release) | GitHub | CC | — | push a `master` | activo | Único workflow: abre el PR "chore: version packages" con changesets. No hay workflows de tests ni de deploy. | G5 |
| GitHub environment `conversion-platform / production` | GitHub | CC | prod | creado 2026-05-26 | activo | Los crea `railway-app[bot]`. Último deployment registrado: 2026-08-28. | G3 G6 |
| GitHub environment `conversion-platform / staging` | GitHub | ambiguo | staging | creado 2026-06-28 | activo | Los crea `railway-app[bot]`. Último deployment registrado: 2026-09-27 (commit `500e44b` de `master`). | G3 G6 |
| GitHub environment `rare-consideration / production` | GitHub | ambiguo | prod | creado 2026-05-26 | obsoleto | Un único deployment (2026-05-26) de `railway-app[bot]`. No coincide con ningún proyecto de Railway actual; probablemente es el nombre original del proyecto, pero Railway no conserva ese historial (inferido). | G3 G6 |
| repo `alephart/agenttia` | GitHub | Agenttia v2 | — | `master`, sin commits | activo | Privado, creado hoy, 0 bytes. Existe su carpeta local con el remoto configurado. | G1 G7 |
| repo `alephart/conversion-chat` | GitHub | CC | prod | `master`, 2026-09-26 | activo | **Público.** "Sitio web para página de conversion chat"; alimenta el Pages `conversion-chat`. | G1 G7 |
| repo `alephart/aeterium-web` | GitHub | ambiguo | — | `master`, 2026-08-07 | activo | Privado. Otro producto (Aeterium); alimenta el Pages `aeterium-web`. | G1 |
| repo `alephart/alephart-panel` | GitHub | ambiguo | — | `master`, 2026-09-09 | activo | Privado. Tiene carpeta local con `.dev.vars`. Producto sin identificar. | G1 G7 |
| repo `alephart/chunk-python` | GitHub | ambiguo | — | `main`, 2026-02-12 | obsoleto | Privado. Remoto de `~/Projects/rag-chunking`. | G1 G7 |
| ~85 repos `alephart` restantes | GitHub | ambiguo | — | último push entre 2014 y 2026 | obsoleto | Casi todos públicos y sin relación con CC ni Agenttia. Incluye un fork público de `n8n` (2025-07). | G1 |
| organizaciones `Alephart-Co` y `juancpulidos` | GitHub | ambiguo | — | 1 y 15 repos | obsoleto | Repos de 2014 a 2024. Sin relación con CC ni Agenttia. | G1 |

### Supabase

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| organización `Conversion` (`xfbuobkysdaralyojmsr`) | Supabase | CC | prod | — | activo | Contiene el proyecto de producción. | S1 |
| organización `Conversion-staging` (`yyglhxgeeaqmrqvyppcm`) | Supabase | ambiguo | staging | — | activo | Contiene el proyecto de staging, cuyo esquema es el de la v2. | S1 |
| organización `Agenttia` (`uzaigyjimhnxeiiawgqu`) | Supabase | Agenttia v2 | — | — | sin determinar | No tiene proyectos visibles con esta cuenta. | S1 |
| organizaciones `WhatPlay` y `Alephart Co.` | Supabase | ambiguo | — | — | obsoleto | Cada una con un solo proyecto, ambos inactivos. | S1 |
| proyecto `Conversion-Chat` (`ljmtpuoooxucdubjbeox`) | Supabase | CC | prod | **esquema = `master`**: 81 de 81 migraciones por nombre, 0 diferencias | activo | us-east-2, ACTIVE_HEALTHY. 34 tablas públicas (26 `platform_`, 6 `agenda_`, 2 `portal_`), sin tablas legacy. 7 clientes. Última versión `20261005111407` (hotfix AGENT-21). El historial se reparó hoy (`agent_media`); por nombre coincide con `master`. | S2 S3 |
| proyecto `conversion-chat-staging` (`gbkjpnteijduqsvzsnns`) | Supabase | ambiguo | staging | **esquema = `stage`**: 88 de 88 migraciones por nombre, 0 diferencias | activo | us-east-1, ACTIVE_HEALTHY. 35 tablas públicas. Tiene 8 migraciones que `master` y producción no tienen (knowledge items, `agent_id` en documentos y etapas, límite de media por plan, vigencia) y le falta `revoke_public_execute_rag_rpc`. 2 clientes. Esquema de la v2, pero lo usan los workers y el runtime de staging de CC. | S2 S3 |
| proyecto `bellezabot-production` (`hmtmzinfyauckduouqks`) | Supabase | ambiguo | prod (por nombre) | — | obsoleto | INACTIVE, creado 2025-07-27, organización Alephart Co. Sin relación con CC en el repo. | S2 |
| proyecto `Whatplay Site` (`ctqyeimihapgwzqianka`) | Supabase | ambiguo | — | — | obsoleto | INACTIVE, creado 2023-04-01. | S2 |

### Railway

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| proyecto `conversion-platform` (`3f8a5d47…`) | Railway | ambiguo | prod y staging | repo `alephart/conversion-platform` | activo | Único proyecto de la cuenta. Workspace personal (`Xan Xeiman's Projects`), no de una organización. Mezcla producción de CC y el entorno que corre la v2. | R1 |
| servicio `agent` | Railway | ambiguo | prod y staging | source = repo `alephart/conversion-platform`; config `apps/agent/railway.toml` | activo | Único servicio. **0 deployment triggers** en ambos environments según la API. | R1 R2 |
| environment `production` (`d5c627ae…`) | Railway | CC | prod | sin trigger; último deploy `SUCCESS` 2026-09-30 16:51, sin rama ni commit en su metadata | activo | Dominios `agent.agenttia.me` y `agent-production-01a7.up.railway.app` (ambos responden 200 en `/health`). `SUPABASE_URL` apunta a `ljmtpuoooxucdubjbeox`. 28 variables. El último deploy con rama y commit de GitHub fue `master` `5a838b2` el 2026-08-28. | R2 R3 R4 H1 |
| environment `staging` (`10b2fafd…`) | Railway | ambiguo | staging | sin trigger; último deploy `SUCCESS` 2026-09-30 16:50, sin rama ni commit en su metadata | activo | Dominios `staging.agenttia.me` y `agent-staging-2e57.up.railway.app` (200). `SUPABASE_URL` apunta a `gbkjpnteijduqsvzsnns`. 29 variables (una más: `NODE_OPTIONS`). El 2026-09-27 hubo deploys con rama `master` y commit `500e44b`; uno terminó `FAILED`. Corre código del repo y esquema de la v2. | R2 R3 R4 H1 |
| GitHub como origen de deploys de Railway | Railway | ambiguo | prod y staging | `railway-app[bot]` crea deployments en GitHub | activo | Evidencia de una conexión con GitHub usada hasta el 2026-08-28 (prod) y el 2026-09-27 (staging). Hoy no hay triggers ni deploys con rama desde el 2026-09-30. Contradice lo que dicen `AGENTS.md` y `docs/ENVIRONMENTS.md`: ver Riesgos. | G3 R2 R3 |

### Cloudflare

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| cuenta (`4ad23cbb…`) | Cloudflare | ambiguo | todos | wrangler con OAuth | activo | Cuenta única con los Workers de CC, los Pages de varios productos y los buckets de R2. Wrangler no lista los Workers de la cuenta: solo se verificaron los 6 de CC por nombre. | C1 |
| Worker `conversionchat-platform` (admin) | Cloudflare | CC | prod | `master` (auto-deploy inferido) | activo | `admin.conversionchat.co` (307 a login). `NEXT_PUBLIC_SUPABASE_URL` → prod. `AGENT_RUNTIME_URL` → `agent.agenttia.me`. R2 `conversionchat`. Último deploy 2026-10-06 02:44 UTC. | C2 C3 C4 |
| Worker `conversionchat-platform-staging` | Cloudflare | ambiguo | staging | deploy manual con wrangler (inferido) | activo | `stg.admin.conversionchat.co` y workers.dev (307). Supabase → staging. `AGENT_RUNTIME_URL` → `staging.agenttia.me`. R2 `conversionchat-test`. Último deploy 2026-09-02. | C2 C3 C4 |
| Worker `conversionchat-portal` | Cloudflare | CC | prod | `master` (auto-deploy inferido) | activo | `portal.conversionchat.co` (307). Supabase → prod. R2 `conversionchat` y bucket de media `conversionchat-agent-media`. Último deploy 2026-10-06 02:44 UTC. | C2 C3 C4 |
| Worker `conversionchat-portal-staging` | Cloudflare | ambiguo | staging | deploy manual (inferido) | activo | `stg.portal.conversionchat.co` y workers.dev (307). Supabase → staging. R2 `conversionchat-test` y el **mismo bucket de media de producción**. Último deploy 2026-09-02. | C2 C3 C4 |
| Worker `conversionchat-agenda` | Cloudflare | CC | prod | `master` (auto-deploy inferido) | activo | `agenda.conversionchat.co` (200). Supabase → prod. Último deploy 2026-10-06 02:44 UTC. | C2 C3 C4 |
| Worker `conversionchat-agenda-staging` | Cloudflare | ambiguo | staging | deploy manual (inferido) | activo | `stg.agenda.conversionchat.co` y workers.dev (200). Supabase → staging. Último deploy 2026-09-01. | C2 C3 C4 |
| auto-deploy de Cloudflare desde GitHub | Cloudflare | CC | prod | integración GitHub a Cloudflare | sin determinar | No se puede verificar por CLI. Se infiere porque los 3 Workers de producción se redesplegaron el 2026-10-06 02:44 UTC, tras los merges a `master`. Los dominios personalizados no están en ningún `wrangler.toml`: se configuran en el dashboard. | C3 |
| Pages `conversion-chat` | Cloudflare | CC | prod | repo `alephart/conversion-chat`, Git conectado | activo | `conversionchat.co`, `www.conversionchat.co` y `conversion-chat.pages.dev` (200). Modificado hace 1 semana. Carpeta local `~/Projects/conversion/web`. | C5 C6 |
| Pages `aeterium-web` | Cloudflare | ambiguo | — | Git conectado | activo | `aeterium.co` (200). Otro producto. | C5 C6 |
| Pages `whatplay-web` | Cloudflare | ambiguo | — | sin Git | obsoleto | `whatplay.org` (200). Modificado hace 8 meses. | C5 C6 |
| Pages `tfjs-object-detection` y `astropage-cloudflare` | Cloudflare | ambiguo | — | Git y sin Git | obsoleto | Sin cambios hace 3 años. | C5 |
| R2 `conversionchat` | Cloudflare | CC | prod | — | activo | Documentos de clientes de producción (creado 2026-04-13). | C2 C5 |
| R2 `conversionchat-test` | Cloudflare | ambiguo | staging | — | activo | Documentos de staging (creado 2026-07-18). | C2 C5 |
| R2 `conversionchat-agent-media` | Cloudflare | ambiguo | prod y staging | — | activo | Media de agentes (creado 2026-08-28). La usan prod **y** staging, tanto Railway como el portal. | C2 C5 H1 |
| R2 `agenttic-docs`, `sango-agent` | Cloudflare | ambiguo | — | — | sin determinar | Nombres de la era previa o de Agenttia; no hay referencias en el repo. | C5 |
| R2 `alephart-cobros`, `autorag-docs`, `rag-coursera-docs`, `juancpulidos`, `test-backend` | Cloudflare | ambiguo | — | — | obsoleto | Sin relación visible con CC ni Agenttia. | C5 |
| KV `WAITLIST_KV` | Cloudflare | ambiguo | — | — | sin determinar | Probablemente del sitio web (inferido). No hay bases D1. | C5 |
| dominio `agenttia.me` | Cloudflare (DNS) | ambiguo | prod y staging | subdominios `agent.` y `staging.` | activo | Es el endpoint del runtime de CC en producción y staging (`AGENT_RUNTIME_URL`). El apex `agenttia.me` no responde y no tiene registro A. | C2 C6 |
| dominios `conversionchat.co` y `stg.*.conversionchat.co` | Cloudflare (DNS) | CC | prod y staging | — | activo | Todos resuelven (IPs de Cloudflare) y responden. Prod: `admin.`, `portal.`, `agenda.`, `www.`. Staging: `stg.admin.`, `stg.portal.`, `stg.agenda.`. | C6 |

### Local (`~/Projects`)

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| `~/Projects/agenttic/conversion-platform` | local | CC | local | `feature/AGENT-38-precios-catalogo` | activo | Clon principal. `.env.local`, `.dev.vars` y `apps/agent/.env` apuntan a `127.0.0.1:54321`. `.env.stg` apunta a staging y `.env.prod` a producción (solo contienen `NEXT_PUBLIC_*`). | L1 L2 |
| `~/Projects/agenttic/conversion-platform-prod-deploy` | local | CC | — | worktree en `chore/port-master-to-stage-3`, 0 cambios | obsoleto | Su PR (#204) ya está mergeado. | L1 |
| worktree `wt-stage` en un scratchpad de otra sesión | local | Agenttia v2 | — | detached en `0299c19` (= tag `agenttia-v2-base`) | sin determinar | Vive bajo `/private/tmp/claude-501/…/scratchpad`: ruta efímera. | L1 |
| `~/Projects/agenttic/agenttia` | local | Agenttia v2 | — | `master`, remoto `alephart/agenttia`, sin commits | activo | 1 archivo sin commitear. | L1 |
| `~/Projects/agenttic/agenda` | local | CC | local | `master`, último commit 2026-03-16, remoto `alephart/conversion-agenda` | obsoleto | Clon de la agenda previo al monorepo. Su `.env.local` apunta al Supabase de **staging**. | L1 L2 |
| `~/Projects/Agent-sango` | local | ambiguo | — | `main`, sin remoto, 2026-02-05 | obsoleto | 24 cambios sin commitear. El nombre es el del staging anterior. | L1 |
| `~/Projects/agenttic/multi-agent-v1` | local | ambiguo | — | `main`, sin remoto, 2026-02-28 | obsoleto | `.env.example` de la era n8n. | L1 L2 |
| `~/Projects/agenttic/catalogo-conocimiento` | local | ambiguo | — | `main`, sin remoto ni commits | sin determinar | 7 archivos sin commitear. | L1 |
| `~/Projects/imec-scraper` | local | CC | local | `feature/AGENT-38-prices-only`, sin remoto | activo | Conector de precios de IMEC (AGENT-38). No tiene repo en GitHub. | L1 |
| `~/Projects/agenttic-vault` | local | ambiguo | — | `main`, sin remoto, 2026-09-28 | activo | Documentación transversal. 14 archivos sin commitear. | L1 |
| `~/Projects/conversion/web` | local | CC | prod | repo `alephart/conversion-chat`, `master`, 2026-09-26 | activo | Sitio web. Su `.dev.vars` define `CONTACT_EMAIL` y `RESEND_API_KEY`. | L1 L2 |
| `~/Projects/rag-chunking` | local | ambiguo | — | `main`, remoto `chunk-python`, 2026-02-11 | obsoleto | 7 cambios sin commitear. Su `.env` define llaves de Anthropic y OpenAI. | L1 L2 |
| `~/Projects/whatplay-web` | local | ambiguo | — | `main`, sin remoto, 2026-01-29 | obsoleto | Otro producto (WhatPlay). | L1 |
| 21 carpetas sin git en `~/Projects/agenttic` | local | ambiguo | — | — | sin determinar | `profamilia`, `anim`, `asset`, `plans`, `propuestas`, `claude`, `files_project`, `business`, `postman`, `conversion_dcos`, `docs`, `design_systems`, `system`, `review`, `reviews`, `plane`, `migrations-and-types-update`, `conversion-platform-bootstrap`, `info-rag`, `whatsapp`, `conversion` (en `~/Projects`). Solo se contaron archivos; `credentials` y los `.sql` sueltos quedaron excluidos. | L1 |

### Canales (solo conteos, leídos de la configuración)

| recurso | plataforma | producto | entorno | rama o fuente | estado | observación | evidencia |
|---|---|---|---|---|---|---|---|
| WhatsApp, 7 agentes con proveedor `wasenderapi` | Supabase (`platform_agents.channels`) | CC | prod | proyecto `ljmtpuoooxucdubjbeox` | activo | 7 agentes activos. Estado de conexión: 6 `connected` y 1 `external_disconnect`. 14 mapeos de canal activos (`platform_channel_mappings`, todos `whatsapp`). | S4 |
| WhatsApp, 3 agentes | Supabase | ambiguo | staging | proyecto `gbkjpnteijduqsvzsnns` | activo | 1 en `building` y 2 en `paused`. Proveedor: 1 `wasenderapi` y 2 sin proveedor. Conexión: 1 `session_terminated` y 2 `not_configured`. 1 mapeo de canal activo. | S4 |
| Meta e YCloud | código del runtime | CC | — | adaptadores en `apps/agent/src/channels` | sin determinar | Ningún agente los usa en prod ni en staging (solo aparece `wasenderapi`). Las variables `META_*` están en `.env.example` pero no en Railway. | S4 R3 |
| Instagram | — | — | — | — | sin determinar | **No identificado.** Sin referencias en el código, la configuración ni las migraciones. | L3 |

## Ambiguos

- **Proyecto Railway único**: producción de CC y el entorno que corre la v2 viven en el mismo proyecto y el mismo servicio `agent`.
- **Supabase `conversion-chat-staging`**: nombre, organización y consumidores son de CC; el esquema es el de `stage` (v2).
- **Dominio `agenttia.me`**: es el endpoint del runtime de CC en producción y staging.
- **Rama `stage`**: es la v2, pero recibió portes de `master` (PRs #204 y #208) y los Workers de staging de CC dependen de ella.
- **Workers de staging de CC** (`conversionchat-*-staging`): apuntan al Supabase de staging (esquema v2) y a `staging.agenttia.me`. CC no tiene hoy un staging propio.
- **GitHub environment `rare-consideration / production`**: no corresponde a ningún proyecto de Railway actual.
- **Organización Supabase `Agenttia`, repo `alephart/agenttia` y tag `agenttia-v2-base`**: existen pero están vacíos o sin proyectos; falta la asignación D1/D2.
- **Buckets R2 `agenttic-docs` y `sango-agent`**, y el KV `WAITLIST_KV`: sin referencias en el repo.
- **Proyecto Supabase `bellezabot-production`**: inactivo, sin relación con CC en el repo.
- **Repos y carpetas de otros productos** (`aeterium-web`, `alephart-panel`, `whatplay-web`, `rag-chunking`): no son CC ni Agenttia v2.
- **Workers de la cuenta de Cloudflare** distintos de los 6 de CC: wrangler no los lista.

## Riesgos detectados (hechos, sin recomendaciones)

1. **R2 compartido entre staging y producción.** En Railway, staging y production tienen el **mismo valor** en `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_MEDIA_BUCKET_NAME` y `R2_PUBLIC_BASE_URL`. Los workers de staging usan el mismo bucket de media (`conversionchat-agent-media`). Solo `R2_BUCKET_NAME` difiere entre entornos.
2. **La documentación contradice a Railway.** `AGENTS.md` y `docs/ENVIRONMENTS.md` (Entorno 5, escrito el 2026-10-05) dicen que Railway no está conectado a GitHub. Hoy: el servicio tiene como source el repo `alephart/conversion-platform`, `railway-app[bot]` creó deployments en GitHub (prod hasta 2026-08-28, staging hasta 2026-09-27) y la metadata de esos deploys trae rama y commit. Ahora no hay triggers y los deploys desde el 2026-09-30 no traen rama.
3. **CC en producción depende del dominio `agenttia.me`.** El admin y el portal de producción tienen `AGENT_RUNTIME_URL=https://agent.agenttia.me`.
4. **Los Workers de staging están desactualizados.** Último deploy: 2026-09-01 y 2026-09-02; `stage` avanzó hasta 2026-09-30 y su Supabase tiene 88 migraciones.
5. **`stage` y `master` divergen en ambos sentidos:** `stage` +141 y −28. El Supabase de staging no tiene `revoke_public_execute_rag_rpc` y el de producción no tiene 8 migraciones de `stage`.
6. **`.env.local` apuntando a staging en un clon viejo.** `~/Projects/agenttic/agenda/.env.local` usa el Supabase de staging. La regla del repo es que `.env.local` y `.dev.vars` nunca apunten a staging ni a producción; en el monorepo sí se cumple (todos usan `127.0.0.1:54321`).
7. **Sin protección de ramas** en `master` ni `stage`. 75 de 95 ramas llevan más de un mes sin actividad y hay ramas de PRs ya mergeados sin borrar.
8. **Repo público con nombre de producto:** `alephart/conversion-chat` (el sitio web) es público.
9. **n8n y shadow mode siguen configurados.** `N8N_BASE_URL` (mismo host en ambos entornos de Railway) y `SHADOW_MODE` existen en staging y producción.
10. **Todo bajo una sola identidad personal.** Un solo workspace personal de Railway, una sola cuenta de Cloudflare con OAuth de una persona y una sola cuenta de GitHub.
11. **Secrets de Cloudflare con nombres distintos entre entornos.** `conversionchat-agenda-staging` tiene `SUPABASE_SECRET` además de `SUPABASE_SECRET_KEY`. `conversionchat-portal` tiene `R2_PUBLIC_BASE_URL` como secret y `conversionchat-portal-staging` no.
12. **`railway.toml` con ruta distinta por environment:** `/apps/agent/railway.toml` en staging y `apps/agent/railway.toml` en production. En ambos `healthcheckPath` y `startCommand` aparecen vacíos en la API de Railway (los define el archivo).

**Verificado sin hallazgo:** en Railway, staging y production tienen valores **distintos** en `ENCRYPTION_KEY`, `OPENAI_API_KEY`, `RUNTIME_SECRET`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL` y `WASENDERAPI_API_KEY`. `ANTHROPIC_API_KEY` no existe en Railway.

## Anexo A — Variables de Railway (solo nombres)

**Servicio `agent`, environment `production` (28):** `ENCRYPTION_KEY`, `N8N_BASE_URL`, `OPENAI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_MEDIA_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `R2_SECRET_ACCESS_KEY`, `RAG_THRESHOLD`, `RAILWAY_ENVIRONMENT`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_PRIVATE_DOMAIN`, `RAILWAY_PROJECT_ID`, `RAILWAY_PROJECT_NAME`, `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_SERVICE_AGENT_URL`, `RAILWAY_SERVICE_ID`, `RAILWAY_SERVICE_NAME`, `RAILWAY_STATIC_URL`, `RUNTIME_PORT`, `RUNTIME_SECRET`, `SHADOW_MODE`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, `WASENDERAPI_API_KEY`, `WASENDERAPI_BASE_URL`.

**Environment `staging` (29):** las mismas más `NODE_OPTIONS`.

**Mismo valor en ambos entornos (solo nombres):** `N8N_BASE_URL`, `R2_ACCESS_KEY_ID`, `R2_ENDPOINT`, `R2_MEDIA_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `R2_SECRET_ACCESS_KEY`, `RAG_THRESHOLD`, `RAILWAY_PRIVATE_DOMAIN`, `RAILWAY_PROJECT_ID`, `RAILWAY_PROJECT_NAME`, `RAILWAY_SERVICE_ID`, `RAILWAY_SERVICE_NAME`, `RUNTIME_PORT`, `WASENDERAPI_BASE_URL`.

## Anexo B — Secrets de Cloudflare Workers (solo nombres)

| Worker | Secrets |
|---|---|
| `conversionchat-platform` y `conversionchat-platform-staging` | `ENCRYPTION_KEY`, `GOOGLE_CALENDAR_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `RUNTIME_SECRET`, `SUPABASE_SECRET_KEY`, `WASENDERAPI_API_KEY` |
| `conversionchat-portal` | `ENCRYPTION_KEY`, `R2_ACCESS_KEY_ID`, `R2_PUBLIC_BASE_URL`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `RUNTIME_SECRET`, `SUPABASE_SECRET_KEY`, `WASENDERAPI_API_KEY` |
| `conversionchat-portal-staging` | los mismos menos `R2_PUBLIC_BASE_URL` |
| `conversionchat-agenda` | `ENCRYPTION_KEY`, `GOOGLE_CALENDAR_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `SUPABASE_SECRET_KEY` |
| `conversionchat-agenda-staging` | los mismos más `SUPABASE_SECRET` |

Los `[vars]` de cada `wrangler.toml` (por entorno) llevan solo URLs públicas, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_MEDIA_BUCKET_NAME` (portal), `GOOGLE_REDIRECT_URI` y `AGENT_RUNTIME_URL`, además de la publishable key de Supabase, que es pública por diseño.

## Anexo C — Archivos `.env*` locales (solo nombres)

| Archivo | Supabase al que apunta | Variables |
|---|---|---|
| `conversion-platform/apps/agent/.env` | local (`127.0.0.1:54321`) | `ANTHROPIC_API_KEY`, `N8N_BASE_URL`, `OPENAI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `RUNTIME_PORT`, `RUNTIME_SECRET`, `SHADOW_MODE`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, `WASENDERAPI_API_KEY`, `WASENDERAPI_BASE_URL` |
| `conversion-platform/apps/admin/.env.local` y `.dev.vars` | local | `AGENDA_URL`, `AGENT_RUNTIME_URL`, `GOOGLE_CALENDAR_API_KEY`, `NEXT_PUBLIC_*`, `PORTAL_URL`, `R2_*`, `RESEND_*`, `RUNTIME_SECRET`, `SUPABASE_SECRET_KEY` |
| `conversion-platform/apps/portal/.env.local` y `.dev.vars` | local | `AGENDA_URL`, `AGENT_RUNTIME_URL`, `NEXT_PUBLIC_*`, `PORTAL_URL`, `R2_*` (incluido `R2_MEDIA_BUCKET_NAME`), `RESEND_*`, `RUNTIME_SECRET`, `SUPABASE_SECRET_KEY`, `WASENDERAPI_*` |
| `conversion-platform/apps/agenda/.env.local` y `.dev.vars` | local | `ENCRYPTION_KEY`, `GOOGLE_*`, `N8N_WEBHOOK_*`, `NEXT_PUBLIC_*`, `PORTAL_URL`, `RESEND_*`, `SUPABASE_SECRET_KEY`, `ENABLE_TEST_LOGIN` (solo `.dev.vars`) |
| `conversion-platform/apps/{admin,agenda,portal}/.env.stg` | **staging** (`gbkjpnteijduqsvzsnns`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` (el del portal también `AGENT_RUNTIME_URL`) |
| `conversion-platform/apps/{admin,agenda,portal}/.env.prod` | **producción** (`ljmtpuoooxucdubjbeox`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` |
| `agenttic/agenda/.env.local` (clon viejo) | **staging** (`gbkjpnteijduqsvzsnns`) | `ENCRYPTION_KEY`, `GOOGLE_*`, `N8N_WEBHOOK_*`, `NEXT_PUBLIC_*`, `RESEND_*`, `SUPABASE_SECRET_KEY` |
| `conversion/web/.dev.vars` | — | `CONTACT_EMAIL`, `RESEND_API_KEY` |
| `rag-chunking/.env` | — | `ANTHROPIC_*`, `OPENAI_*`, `LLM_PROVIDER`, `LOG_*`, `*_CHUNK_SIZE`, `OVERLAP_SIZE`, otros |
| `*.env.example` (monorepo, worktree `prod-deploy`, `agenda`, `multi-agent-v1`, `rag-chunking`) | placeholders | Plantillas: sin valores reales |

## Evidencia

| Código | Método (solo lectura) |
|---|---|
| G1 | `gh repo list` de `alephart`, `Alephart-Co`, `juancpulidos`; `gh api user/orgs` |
| G2 | GraphQL de `gh api` sobre refs (ramas con fecha del último commit) |
| G3 | `gh api repos/alephart/conversion-platform/deployments`, `/environments`, `/hooks`, `/branches/{rama}/protection` |
| G4 | `gh api` de tags, `/git/ref/tags/…` y `/compare/master...stage` |
| G5 | `gh workflow list`; archivos de `.github/workflows` |
| G6 | `gh api …/deployments?environment=…` (creador y fechas) |
| G7 | `gh api repos/alephart/{agenttia,conversion-chat,conversion-agenda}` |
| S1 | `supabase orgs list` |
| S2 | `supabase projects list` |
| S3 | SQL de solo lectura por MCP: diff por nombre de `supabase_migrations.schema_migrations` contra las migraciones de `master` y `stage` (leídas con `gh api …/git/trees`); conteo de tablas en `information_schema` |
| S4 | SQL de solo lectura por MCP: conteos por proveedor, estado y canal. No se leyeron números ni identificadores |
| R1 | `railway list --json` (proyecto, environments, servicios) |
| R2 | API GraphQL de Railway por `railway api`: `deploymentTriggers`, `deployments`, `serviceInstance` |
| R3 | API GraphQL de Railway: `variables`, solo comparadas con `jq`. Ni un valor se imprimió; solo nombres, el host de las variables `*_URL` y la igualdad entre entornos |
| R4 | `curl` a `/health` de los dominios de Railway |
| C1 | `wrangler whoami` |
| C2 | Lectura de `apps/*/wrangler.toml` (valores de variables con nombre `*SECRET*`, `*KEY*` o `*TOKEN*` enmascarados) |
| C3 | `wrangler deployments list --name …` y `wrangler secret list --name …` (solo nombres) |
| C4 | `wrangler secret list` más lectura de `[vars]` |
| C5 | `wrangler r2 bucket list`, `wrangler pages project list`, `wrangler kv namespace list`, `wrangler d1 list` |
| C6 | `curl -I` y `dig` a cada dominio |
| L1 | `git` en cada carpeta (rama, remoto con credenciales enmascaradas, último commit) y `git worktree list` |
| L2 | `find` de `.env*` y `.dev.vars*` con `cut -d=` y extracción solo del host de `SUPABASE_URL` |
| L3 | `graphify query` y búsqueda de "instagram" en `apps/agent/src`, `packages` y `supabase/migrations` |
| H1 | Comparación de variables de Railway entre environments (R3) y de `wrangler.toml` entre entornos (C2) |
| — | Contexto de producto y decisiones D1–D5: `~/Projects/agenttic-vault/03-modelo/plan-separacion-infra.md` y `00-estado-actual.md` |

## Qué no se pudo verificar

- Workers de Cloudflare fuera de los 6 de CC, y si existe una integración de GitHub con Cloudflare (solo se infiere por las fechas de deploy).
- Valores de los secrets de Cloudflare: solo se leyeron los nombres, así que no se puede comparar si staging y producción comparten secrets en Workers.
- Resend: no se consultó su API (no se usó ninguna llave); no se sabe si hay dominios o llaves compartidas.
- Plan y tamaño de cómputo de los proyectos de Supabase (la CLI no los devuelve aquí).
- Si Railway tuvo triggers configurados antes: la API solo muestra los actuales; el pasado se infiere de los deployments.
- Si el sitio `alephart-panel` u otros repos usan recursos de CC.
- Instagram: sin ninguna referencia, así que no se puede dar más detalle.
