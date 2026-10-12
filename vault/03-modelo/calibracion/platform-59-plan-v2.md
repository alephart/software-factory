# Plan v2 — PLATFORM-59: staging de Conversion Chat (`cc-staging`)

> v2, 2026-10-07. Incorpora las decisiones D-A a D-L de Juan Carlos y los hallazgos del
> plan-reviewer-agent sobre la v1 (`03-modelo/calibracion/platform-59-plan-reviewer-v1.md`).
> Solo plan: no se ejecuta nada. No ha pasado otra vez por el revisor.

## Cómo quedó resuelto cada punto

### Decisiones de Juan Carlos

| # | Decisión | Dónde queda |
|---|---|---|
| D-A | Conocimiento copiado tal cual (sin re-embeber); G4 con conteos exactos y sin chunks con `document_id` NULL; la re-ingesta solo como humo | Fase 4c-4e, G4, Fase 7.5 |
| D-B | Urea sobrescrita con la fila de prod (`ON CONFLICT DO UPDATE`); G1 verifica modelo y prompt de los 3 agentes contra prod y contra `resolveModel`; G1 antes de Railway | Fase 2 (G1), Fase 4c |
| D-C | Dos etapas en el mismo ítem: A desbloquea AGENT-38, B cierra PLATFORM-59. Se declara como cambio frente al ítem. Sin agendamiento en las suites hasta B | "Cambios frente al ítem", Etapa B, suites |
| D-D | Rol temporal con SELECT, creado y borrado por Juan Carlos: es la única escritura autorizada en prod. Credenciales nunca en argv. Lecturas extra: `schema_migrations` y `pg_proc` | "Guardas", Fase 0, Fase 2 |
| D-E | Comparación de las migraciones de prod con las 81 de master antes del push | Fase 2 (G1b) |
| D-F | Comparación de valores de Railway en memoria (solo se imprimen nombres); diales de `RuntimeConfigService` iguales a prod en Railway y en `.env.cc-staging`; llave de Anthropic si algún agente usa claude | Fase 3, Fase 5 |
| D-G | Se conservan teléfonos y correos del negocio; lo personal se anonimiza; decide Juan Carlos o Nicole en G2 | Fase 4b (G2) |
| D-H | Admin con subdominio, Cloudflare Access y sin `preview_urls`; sin eso no se despliega | Fase 7.4 |
| D-I | Resumen de `compare.ts` (sin PII) versionado en `docs/tasks/platform-59-results/` y enlazado en Plane; los JSON crudos quedan en `runs/` | Fases 6 y 8, arnés |
| D-J | Plan y org de Supabase los decide Juan Carlos antes de la Fase 2; CC y Agenttia tendrán cada uno su prod y su stage | "Qué necesito de ti" |
| D-K | Prompt de Nicole con `get_catalog_price` en el agente de IMEC después de G6 y antes de los escenarios; queda en la provenance | Fase 9.4 |
| D-L | Salida a prod en orden y política de hotfixes master → `cc-stage` | Sección final |

### Hallazgos del revisor (v1)

| # | Sev. v1 | Resolución en v2 |
|---|---|---|
| 1 | bloquea | **Resuelto por D-A.** El conocimiento de prod no es legacy: se copian `portal_documents` y `platform_agent_knowledge` tal cual. G4 exige conteos exactos y cero chunks con `document_id` NULL; si aparece uno, es un hallazgo. El criterio 1 usa `(source, chunk_index)`, que ahora se conserva. |
| 2 | bloquea | **Aplicado.** Copia fijada de `extractNumericClaims` en `scripts/regression/lib/numeric-claims.ts`, con el sha del commit de origen en un comentario. Base y candidato usan la misma copia. |
| 3 | bloquea | **Resuelto por D-C.** Portal y agenda son la Etapa B del mismo ítem, declarada como cambio. No va a Request. |
| 4 | ajusta (bajado) | **Aplicado.** Fase 0: inventario corto que cita la auditoría del 04/10 (`02-diagnostico/infra-inventory-2026-10-06.md`) y solo revisa lo que pudo cambiar. El costo de Supabase lo decide Juan Carlos (D-J). |
| 5 | bloquea | **Resuelto por D-E.** G1b compara `schema_migrations` de prod con las 81 de master y la firma de la RPC en `pg_proc`. |
| 6 | ajusta | **Resuelto por D-D.** Rol temporal registrado como única escritura; sin alternativa read-only; credenciales por archivo de entorno, nunca en `--db-url`. |
| 7 | ajusta | **Aplicado.** El humo "IMEC responde con su conocimiento" corre contra el Railway real por `POST /shadow` (Fase 3.4 y Fase 7.5). La limitación del arnés queda reformulada. |
| 8 | ajusta | **Aplicado.** El criterio 2 acepta cifras de los chunks, de la pregunta, del `system_prompt` del agente, de `platform_agent_defaults` y del historial de la conversación. |
| 9 | ajusta | **Aplicado.** El hash de la config usa un subconjunto definido de campos (lista en la Fase 5), sin los campos que el import cambia. |
| 10 | ajusta | **Resuelto por D-F.** Diales iguales a prod en Railway y en `.env.cc-staging`, verificados en memoria. |
| 11 | ajusta | **Resuelto por D-B.** G1 antes de Railway; valida cada modelo con `resolveModel`; la llave de Anthropic solo si hace falta. |
| 12 | ajusta | **Aplicado.** G1 reporta las tools habilitadas que dependen de datos que no se copian (`send_media`, `n8n_tools`, `save_lead_city`) y el `partner_id`. Las suites no incluyen casos que dependan de tools apagadas. |
| 13 | ajusta | **Aplicado.** Enmienda fechada a ADR 007 (entorno `cc-staging`, flujo `feature → cc-stage → master`, arnés de regresión como gate) y a ADR 035, decisión 5 (`staging` de imec-scraper = cc-staging). |
| 14 | ajusta | **Aplicado.** AGENTS.md y ENVIRONMENTS.md se corrigen completos (staging de CC, flujo, política de hotfixes), no con una línea. |
| 15 | ajusta | **Resuelto por D-H.** |
| 16 | ajusta | **Aplicado.** Wrapper `scripts/cc-staging/railway-up.sh`, con proyecto, servicio y environment fijos, que rechaza cualquier otro environment. |
| 17 | nota | **Aplicado.** Merge de #218 → `cc-stage` y de `cc-stage` → master con **merge commit**, como el repo. |
| 18 | nota | **A Request** (token de ingesta por cliente). |
| 19 | nota | **Aplicado.** Planes por id (UUID) con verificación de slug; los addon ya vienen en migración; `webhook_path` se conserva (NOT NULL y único, no es un secreto: es un slug opaco) o se regenera, según G1. |
| 20 | nota | **Aplicado.** El arnés filtra los chunks por `rag_min_relevant_score` y espera a que aparezca el log de `rag_query`. Cifras no monetarias (%, duraciones, cantidades) caen en REVISAR. |
| 21 | nota | **Aplicado.** Después de un handoff dentro de una conversación de 3 turnos, el arnés corta la conversación (como el controlador en prod) y lo registra. |
| 22 | nota | **Aplicado.** Scripts de entorno en `scripts/cc-staging/` en la raíz; el arnés sigue en `apps/agent/scripts/regression/` (lo pide el brief). Los refs van en un archivo de constantes, no repetidos. |
| 23 | nota | **Aplicado.** Se fija `BASE_SHA` (el commit de `origin/master` del que nace `cc-stage`) y el invariante compara contra ese SHA. Humo del admin en la Etapa A solo en el candidato: se declara. |

## Contexto

AGENT-38 (precios de catálogo) está terminado y en el PR #218 (draft), pero no se puede validar con
IMEC ni llevar a prod porque Conversion Chat no tiene staging propio. Los staging actuales
(Supabase `gbkjpnteijduqsvzsnns`, environment `staging` de Railway, Workers `*-staging`) son de
Agenttia y **no se tocan**. PLATFORM-59 crea `cc-staging`, que reproduce prod de CC desde `master`,
con tres agentes reales (IMEC, Dr. Buitrago, Urea) **sin canales, sin secretos y sin datos de
usuarios finales**, y deja un arnés de regresión permanente.

## Cambios frente al ítem PLATFORM-59 (explícitos)

1. **Dos etapas (D-C).** **Etapa A**, que desbloquea AGENT-38: Supabase, Railway, admin, seed, regresión y precios.
   **Etapa B**, que cierra PLATFORM-59: Workers cc-staging de portal y agenda y `docs/ENVIRONMENTS.md` completo (cierra REQUEST-3).
   El ítem pedía los tres Workers juntos; se separan porque AGENT-38 solo necesita admin.
2. **Datos:** además de IMEC, Dr. Buitrago y Urea, para la regresión (brief, ajuste).
3. **Canal de prueba:** se usa el script no-op (arnés local + `/shadow`). El número de WhatsApp de prueba va a Request (D5, segunda parte).

## Guardas

- **Prod:** solo lectura, con una excepción registrada (D-D): Juan Carlos crea el rol temporal con SELECT y lo borra al terminar. Es la **única escritura en prod** del plan. Yo no corro ningún DDL en prod.
- **Lecturas de prod autorizadas:** cliente, agente, `portal_documents` y `platform_agent_knowledge` de los 3; `platform_agent_defaults`; `platform_plans` referenciados; `supabase_migrations.schema_migrations`; `pg_proc` (firma de `match_platform_agent_knowledge`).
- **Credenciales:** nunca en argv ni en el historial. Los scripts las leen de archivos de entorno ignorados por git, cargados dentro del proceso (`dotenv`). No hay `psql` en esta máquina, así que las lecturas de prod las hace un script Node con el cliente `postgres` (devDependency nueva en la raíz; ver "Decisiones técnicas").
- **Variables:** solo nombres. La comparación de valores se hace en memoria (D-F).
- Nada de `supabase link` en el árbol principal; `db push` a cc-staging corre desde un **worktree descartable** con `supabase link` y la contraseña en `SUPABASE_DB_PASSWORD` (variable de entorno, no flag).
- Cada comando remoto se muestra antes de correrlo. La rama se verifica justo antes de cada commit, push o deploy.

## Qué necesito de ti, y cuándo

| Antes de | Qué |
|---|---|
| Fase 0 | Confirmar que nada cambió desde la auditoría del 04/10, o decirme qué cambió |
| Fase 2 | **Plan y org del proyecto Supabase cc-staging (D-J)**, el ref, la contraseña de la base y las llaves (service y publishable), en `apps/agent/.env.cc-staging` y `apps/admin/.env.cc-staging` |
| Fase 2 (G1) | **Rol temporal con SELECT en prod (D-D)**: te dejo el SQL exacto (solo las tablas y vistas de "Lecturas autorizadas"). Me pasas la URL en `~/cc-staging-export/.env.export`. Lo borras al cerrar la Fase 4 y me avisas |
| Fase 3 | Environment `cc-staging` en Railway, **vacío (no duplicado)**, con dominio `*.up.railway.app`. Variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY` (llave propia con tope de gasto), `RUNTIME_SECRET` nuevo, los diales de prod (D-F) y `ANTHROPIC_API_KEY` solo si G1 encuentra un agente claude |
| Fase 4b (G2) | Tú o Nicole revisan el reporte de PII de los prompts y documentos y deciden qué se anonimiza (D-G) |
| Fase 6 | Las suites de Nicole para los 3 agentes, sin casos de agendamiento ni de tools apagadas |
| Fase 7 (G5) | OK para el merge de #218 → `cc-stage` |
| Fase 7.4 | Subdominio del admin y la aplicación de **Cloudflare Access** (D-H) |
| Fase 9 | Environment `staging` en `alephart/imec-scraper` con `PRICES_INGEST_URL` y `RUNTIME_SECRET` |
| Fase 9.4 | El prompt de Nicole con `get_catalog_price` para IMEC (D-K, AGENT-37) |
| Salida a prod | OK para cada paso de la sección final |

**Gates:** G1 descubrimiento en prod · G1b equivalencia de esquema · G2 privacidad · G4 seed verificado ·
G5 merge de #218 · G6 primera corrida de precios `success` · G7 regresión sin FALLA (criterio de salida).

---

# ETAPA A — desbloquea AGENT-38

### Fase 0 — Inventario corto
Parte de `02-diagnostico/infra-inventory-2026-10-06.md` (auditoría del 04 al 06/10) y solo revisa lo que puede haber cambiado:
proyectos de Supabase y orgs, environments y servicios de Railway, Workers y rutas, ramas `master`/`stage`/`cc-stage`, environments de GitHub en imec-scraper.
Solo nombres, sin valores. Sale una tabla corta en PLATFORM-59.

### Fase 1 — Rama `cc-stage`
1. Fijo `BASE_SHA` = `origin/master` después de un `git fetch` (hoy `fd35005`) y creo el worktree `../cp-ccstage` en ese SHA, rama `cc-stage`.
2. **Primer commit:** el brief (los dos textos) en `docs/tasks/platform-59-staging-cc.md`. Push.
3. Commits siguientes, en orden: `.gitignore` (`.env.cc-staging*`, `apps/agent/scripts/regression/runs/`) antes de crear cualquier `.env`; `scripts/cc-staging/*`; arnés de regresión; env `cc-staging` de wrangler del admin.
4. `gh pr edit 218 --base cc-stage` (remoto; te lo muestro).
5. **Invariante de la línea base:** `git diff BASE_SHA..cc-stage -- apps/*/src packages supabase/migrations` vacío. Se registra en cada corrida.

### Fase 2 — Supabase cc-staging y descubrimiento en prod
1. **G1 — descubrimiento en prod** (con el rol temporal; solo ids, nombres, conteos, modelos y formas de JSON), **antes de Railway**:
   - los 3 clientes y agentes: id, `model`, hash del `system_prompt`, `tools_enabled`, `n8n_tools` (solo conteo y nombres), `partner_id`, `plan_id` y su slug, `webhook_path` presente;
   - por cada modelo, la ruta que toma `resolveModel` (`apps/agent/src/agent/agent-runtime.service.ts:196-201`): OpenAI u Anthropic. Si alguno es claude, pido la llave de Anthropic;
   - Urea: confirmar que el id de prod es el de phase0 (`a0000000-…-0001-…0001`) y que corre `gpt-4.1-mini` con otro prompt (D-B);
   - tools que dependen de datos que no se copian: `send_media` (`platform_agent_media` + R2), `n8n_tools` y `save_lead_city`. Las anoto para que las suites no las usen;
   - conocimiento: documentos y chunks por agente, chunks con `document_id` NULL (se espera 0), documentos sin `processed_content`.
   **Te lo reporto.**
2. **G1b — equivalencia de esquema (D-E):** comparo `supabase_migrations.schema_migrations` de prod con las 81 versiones de `BASE_SHA` (las que faltan, las que sobran y los nombres distintos) y la firma de `match_platform_agent_knowledge` en `pg_proc` contra la que revoca `20261005111407`. Cualquier diferencia es un **hallazgo que se reporta**, no se parchea, y se decide antes del push.
3. `supabase db push --dry-run` desde el worktree descartable, enlazado a cc-staging: deben salir exactamente las 81 migraciones. Después el push.
4. Verificación: las 81 por nombre; extensión `vector`; la RPC revocada a PUBLIC (la publishable key se rechaza).

### Fase 3 — Railway cc-staging (código de `BASE_SHA`)
1. **Auditoría de variables** (API GraphQL de Railway + `jq`, en memoria, solo se imprimen nombres): lista blanca; prohibidas (`WASENDERAPI_*`, `META_*`, `YCLOUD_*`, `N8N_BASE_URL`, `SHADOW_MODE`, `R2_*`, `ENCRYPTION_KEY`); valores que contienen el ref de prod, el del otro staging o `agenttia.me`; valores idénticos a prod o al `staging` de Agenttia (llave reutilizada).
2. **Diales (D-F):** compara en memoria `RAG_*`, `EMBEDDING_MODEL`, `RERANKER_*` y `DEFAULT_LLM_MODEL` (`runtime-config.service.ts:9-23`) de prod contra cc-staging y contra `apps/agent/.env.cc-staging`. Imprime solo los nombres que difieren.
3. Deploy con `scripts/cc-staging/railway-up.sh`: corre `railway up -p <id> -s agent -e cc-staging -d` desde la raíz del worktree, con proyecto y servicio fijos, y aborta si se le pasa otro environment o si la rama no es `cc-stage`.
4. Humo: `/health` 200. El reranker se descarga de HuggingFace en cada arranque: se anota la revisión que bajó.

### Fase 4 — Seed
**4a.** El descubrimiento ya está hecho en G1.

**4b. Export** (`scripts/cc-staging/export-from-prod.ts`, solo con la conexión del rol temporal): lista explícita de columnas.
- Clientes: sin `phone`, sin `auth_user_id`; `email` → `<id>@pending.local`; `metadata` solo con las claves aprobadas.
- Agentes: `channels`, `channel_credentials`, `channel_session_id` y `n8n_tools` vacíos o NULL.
- `portal_documents` y `platform_agent_knowledge`: `id`, `document_id`, `source`, `chunk_index`, `content`, `embedding`, `metadata` (D-A).

Salida en `~/cc-staging-export/`, fuera del repo. **G2 (D-G):** un escáner de PII reporta conteos y ubicaciones en prompts, documentos y chunks, sin mostrar contenido. Juan Carlos o Nicole deciden: los teléfonos y correos del negocio se conservan, lo personal se anonimiza. Si se anonimiza el texto de un chunk, su embedding se recalcula solo para ese chunk y se registra.

**4c. Import** (`scripts/cc-staging/import-to-cc-staging.ts`, solo con credenciales de cc-staging y allowlist del ref):
1. Planes por `id` (verificando el slug).
2. `platform_agent_defaults`.
3. Clientes.
4. Agentes con `ON CONFLICT (id) DO UPDATE`, que sobrescribe Urea de phase0 (D-B), y con `followup_enabled=false`, `runtime_enabled=false` y `channel_connection_status='not_configured'`.
5. `create_default_build_stages`.
6. `portal_documents` (con `r2_key` inerte).
7. `platform_agent_knowledge` copiado directo en lotes de 50, con el patrón de `apps/agent/scripts/migrate-knowledge.ts` (embeddings `vector(1536)` sin re-embeber).

Es idempotente.

**4d. Usuario interno:** `auth.admin.createUser` con contraseña generada + fila `SUPER_ADMIN` en `platform_internal_users`.

**4e. G4 (D-A):** por agente, documentos y chunks en cc-staging = prod **exacto**; cero chunks con `document_id` NULL (si aparece uno, es un hallazgo); modelo y hash del prompt iguales a prod. Juan Carlos borra el rol temporal y yo borro `~/cc-staging-export/`.

### Fase 5 — Precondiciones de la línea base
- G4 cumplido.
- **Hash de config por agente** sobre el subconjunto `model`, `temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `max_tokens`, `system_prompt`, `tools_enabled`, `tool_instructions`, `memory_window`, `debounce_ms` y `rag_*` (las columnas exactas se confirman contra el esquema de `BASE_SHA`), igual a prod; más el hash de `platform_agent_defaults`.
- Diales iguales (D-F).
- `followup_enabled=false`.
- Worktree en `BASE_SHA` con el invariante y `pnpm build` del agent.
- Suites de Nicole presentes.
- Conocimiento y config **congelados** hasta terminar el candidato.

### Fase 6 — LÍNEA BASE
3 corridas × pregunta × agente (IMEC sin la tool). Resumen de `compare.ts` (sin PII) en `docs/tasks/platform-59-results/baseline.md`, enlazado en Plane (D-I).

### Fase 7 — PR #218 y candidato desplegado
1. **G5.** Merge de #218 → `cc-stage` con **merge commit**.
2. `db push --dry-run`: solo la migración de AGENT-38. Después el push.
3. Redeploy con el wrapper desde un worktree nuevo en el commit candidato. Repito la auditoría y los diales y confirmo que no cambió ningún valor.
4. **Admin (D-H):**
   - `[env.cc-staging]` en `apps/admin/wrangler.toml` **sin `preview_urls`**, con ruta al subdominio y todas las vars;
   - la aplicación de Cloudflare Access debe existir antes del deploy, y sin Access no hay deploy;
   - `wrangler deploy --env cc-staging --dry-run` y verificación del bundle (ningún ref de prod ni del otro staging);
   - secrets con `wrangler secret put --env cc-staging` leyendo del archivo;
   - script `deploy:cc-staging` con el env fijo.
5. **Humo:**
   - `/health`;
   - **IMEC responde con su conocimiento** vía `POST /shadow` contra Railway (`x-runtime-secret`; la respuesta se lee en `platform_conversation_messages`);
   - **re-ingesta de 1 documento de IMEC** por `POST /knowledge/:agentId/ingest` (D-A), verificando los chunks nuevos y luego borrándolos para no alterar G4;
   - la publishable key se rechaza en la RPC;
   - RLS de las tablas de AGENT-38 y advisors de Supabase;
   - la ingesta de precios sin secret da 403;
   - el admin, detrás de Access, lista los clientes y abre la pestaña del agente.

### Fase 8 — CANDIDATO
Mismas suites y agentes, tool apagada, 3 corridas, `compare.ts` contra la línea base. **G7:** ningún FALLA y cada REVISAR resuelto con una decisión registrada.
Resumen en `docs/tasks/platform-59-results/candidate.md` (D-I).

### Fase 9 — Precios en cc-staging
1. `gh workflow run sync-prices.yml -R alephart/imec-scraper -f environment=staging` (remoto; te lo muestro). Seguimiento de la corrida.
2. **G6:** `platform_catalog_sync_runs` con `success` y conteos esperados.
3. Habilito `get_catalog_price` en IMEC de cc-staging (UPDATE visible).
4. **D-K:** cargo el prompt de Nicole con `get_catalog_price` (AGENT-37) en IMEC de cc-staging. Su hash queda en la provenance.
5. Escenarios 1–6 con el modelo real (`simulate-price-scenarios.ts` con guard por allowlist del ref de cc-staging) y una corrida informativa de la suite de IMEC con la tool encendida. Resultados en `docs/tasks/platform-59-results/prices.md` y en AGENT-38.

### Fase 10 — Documentación de la Etapa A
- **ADR 007**: enmienda fechada (entorno `cc-staging`, flujo `feature → cc-stage → master`, arnés de regresión como gate).
- **ADR 035**: enmienda en la decisión 5 (`staging` de imec-scraper = cc-staging).
- `docs/ENVIRONMENTS.md`: sección cc-staging, con cómo se despliega cada pieza, rollback y las reglas.
- **AGENTS.md** corregido: tablas de entornos (el staging de CC ya no es `gbkjpnteijduqsvzsnns`), flujo de ramas y política de hotfixes.

---

# ETAPA B — cierra PLATFORM-59

1. Workers cc-staging de **portal** y **agenda**: `[env.cc-staging]` sin `preview_urls`, con subdominio y Cloudflare Access, y los scripts `deploy:cc-staging`. Ahí se reemplazan los `.invalid` de `PORTAL_URL`/`AGENDA_URL` del admin.
2. Suites de Buitrago y Urea con casos de agendamiento (D-C).
3. `docs/ENVIRONMENTS.md` completo; cierra REQUEST-3.

---

## Arnés de regresión (`apps/agent/scripts/regression/`)

- `run.ts`:
  - mismo patrón que `simulate-price-scenarios.ts` (contexto Nest desde `dist/`, `runtime.process()`);
  - corre local contra la base de cc-staging, con una sesión nueva por pregunta;
  - 1–2 conversaciones de 3 turnos por agente: si hay handoff, corta la conversación como el controlador en prod (#21).
- `compare.ts`, `agents.json`, `_template.json`, `README.md` para Nicole, `<agente>.json`.
- `lib/numeric-claims.ts`: **copia fijada** de `extractNumericClaims` (#2).
- `runs/`: JSON crudos, ignorado por git.
- **Guardas:** `SUPABASE_URL` en la allowlist de cc-staging (constante en `scripts/cc-staging/refs.ts`); falla si el agente tiene `followup_enabled` o credenciales de canal.
- **Provenance:**
  - SHA y rama, `BASE_SHA` y el invariante;
  - número de migraciones;
  - hashes de config (subconjunto de la Fase 5) y de defaults;
  - modelo, `tools_enabled` y hash del prompt (D-K);
  - diales;
  - revisión del reranker;
  - chunks por fuente.
- **Criterios** (PASA / FALLA / REVISAR):
  1. **Fuente:** los chunks se filtran por `rag_min_relevant_score` y el arnés espera al log de `rag_query`, que es *fire-and-forget* (#20). FALLA si aparece una fuente nueva o si se pierde una fuente que todas las corridas base recuperaron. REVISAR si solo cambian el orden o el score.
  2. **Precio inventado:** las cifras de la respuesta deben estar en los chunks, la pregunta, el `system_prompt`, `platform_agent_defaults` o el historial (#8). FALLA si no están. REVISAR si repite una cifra de la pregunta que no está en el conocimiento, o si hay %, duraciones o cantidades no verificables (#20).
  3. **Handoff:** misma decisión y mismo `triggered_by` que la mayoría de la base, y lo que espera la suite.
  4. **Sin la tool:** ni en `tools_enabled` ni nombrada en el texto.
  5. **Sanidad.**
- **Limitación:** el arnés valida el mismo commit, pero corriendo en mi máquina. El runtime real de Railway se cubre con `/shadow`, la ingesta HTTP y las auditorías.

## Salida a prod (D-L) — después de la Etapa A

1. **Migración de AGENT-38 en prod:** `db push --dry-run` (solo esa migración) y después el push, **antes** del merge.
2. **Merge de `cc-stage` → master con merge commit**, tras la aprobación de Juan Carlos.
3. **Deploy:** Cloudflare despliega el admin solo; Railway por CLI con el environment de prod (te muestro el comando); verificación de la versión desplegada (cache de Cloudflare).
4. **Humo en prod:** `/health`, la RPC rechaza la publishable key, la card de precios carga. La tool sigue apagada en prod hasta la primera corrida `success` del workflow con `environment=production`.
5. **Política de hotfixes:** todo hotfix que entre directo a master se mergea a `cc-stage` (merge commit) **el mismo día**, antes de cualquier otro merge a `cc-stage`. Se documenta en ENVIRONMENTS.md y AGENTS.md para no repetir la brecha de PLATFORM-50.

## Decisiones técnicas que tomé (trade-offs)

- **Cliente Postgres para leer prod:** no hay `psql` local, y `supabase db query --db-url` deja la credencial visible en `ps`. Por eso uso el paquete `postgres` como devDependency de la raíz y leo la URL de un archivo dentro del proceso. La alternativa, instalar `libpq` con Homebrew, no agrega dependencias al repo pero sí a la máquina. Si prefieres esa, cambio a `psql` con `PGPASSFILE`.
- **Scripts en `scripts/cc-staging/` (raíz):** cruzan apps (admin, Railway, Supabase), y ahí ya está `supabase-local.sh`. Quedan fuera de `pnpm type-check`; los corro con `tsx` y un `tsc --noEmit` propio.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Prod no coincide con las 81 migraciones | G1b antes del push; hallazgo, no parche |
| Escritura accidental en prod | Solo el rol temporal (lo crea y lo borra Juan Carlos); export e import en procesos y credenciales separados |
| Credenciales en `ps` o en el historial | Siempre por archivo de entorno, nunca en argv |
| Urea phase0 distinta de prod | `ON CONFLICT DO UPDATE` + G4 compara modelo y hash del prompt |
| Anonimizar un chunk rompe su embedding | Se re-embebe solo ese chunk y queda registrado |
| `railway up` al environment equivocado | Wrapper con el environment fijo |
| `wrangler deploy` sin `--env` despliega a prod | Script con el env fijo, `--dry-run` y verificación del bundle |
| Admin con datos de salud expuesto | Cloudflare Access obligatorio, sin `preview_urls` |
| La línea base se contamina | `BASE_SHA` fijo, invariante y worktrees por fase |
| LLM no determinista / reranker sin versión | 3 corridas, criterios, misma ventana y revisión registrada |
| Diales locales distintos de prod | Comparación en memoria antes de cada fase |
| Bloqueo de IP de GitHub en el workflow | Es la primera prueba; se reporta |
| `cc-stage` se atrasa respecto de master | Política de hotfixes el mismo día |

## Archivos

- **`cc-stage`:**
  - `docs/tasks/platform-59-staging-cc.md` (primer commit);
  - `.gitignore`;
  - `scripts/cc-staging/{refs.ts, export-from-prod.ts, import-to-cc-staging.ts, seed-internal-user.ts, audit-railway-vars.ts, railway-up.sh, schema-equivalence.ts}`;
  - `apps/agent/scripts/regression/{run.ts, compare.ts, lib/numeric-claims.ts, agents.json, _template.json, README.md}`;
  - `apps/admin/wrangler.toml` y `package.json`;
  - `package.json` raíz (`postgres` como devDependency);
  - `docs/tasks/platform-59-results/`;
  - `docs/adr/007-…md`, `docs/ENVIRONMENTS.md`, `AGENTS.md`.
- **Después de #218:** `docs/adr/035-…md` (enmienda) y `apps/agent/scripts/simulate-price-scenarios.ts` (guard por allowlist).
- **Etapa B:** `apps/portal/wrangler.toml`, `apps/agenda/wrangler.toml` y sus `package.json`.

## Ítems a registrar en Request

- Número de WhatsApp de prueba para cc-staging (D5, segunda parte).
- Token de ingesta por cliente en lugar del `RUNTIME_SECRET` compartido, antes de prod con un segundo conector (#18).
- Retirar `/shadow` y `SHADOW_MODE` cuando deje de usarse como vía de humo.
- Fijar la versión del modelo del reranker de HuggingFace.

Portal y agenda **no** van a Request: son la Etapa B.

## Verificación y criterio de salida

- **G1b:** sin diferencias, o con diferencias decididas. **Fase 2:** 81 migraciones y la RPC revocada. **G4:** conteos exactos y cero `document_id` NULL.
- **Criterio de salida (G7):** `compare.ts` sin FALLA y cada REVISAR resuelto, en los tres agentes, antes de habilitar la tool.
- **Aceptación de la Etapa A:** sync `success` desde GitHub Actions, escenarios 1–6 con el prompt de Nicole y la documentación de la Fase 10.
- **Aceptación de la Etapa B:** portal y agenda en cc-staging detrás de Access y ENVIRONMENTS.md completo.

## Lo que no verifiqué

- Que `supabase link` lea `SUPABASE_DB_PASSWORD` del entorno (`--help` antes de la Fase 2).
- Que `railway up -p/-s/-e` funcione sin `link` en un worktree.
- Las columnas exactas del hash de config (se confirman contra el esquema de `BASE_SHA`).
- Si `postgres` resuelve el pooler en modo sesión de un proyecto nuevo.

## Después de aprobar

Copio este plan a `~/Projects/agenttic-vault/03-modelo/calibracion/platform-59-plan-v2.md`. En modo plan no puedo escribir fuera de este archivo.
