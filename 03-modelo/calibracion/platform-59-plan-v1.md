# Plan — PLATFORM-59: staging mínimo de Conversion Chat (`cc-staging`)

## Contexto

AGENT-38 (precios de catálogo) está terminado en local y en el PR #218 (draft), pero no se puede
mergear ni validar con IMEC porque Conversion Chat (CC) no tiene un staging propio: los staging
actuales (Supabase `gbkjpnteijduqsvzsnns`, environment `staging` de Railway, Workers `*-staging`)
corren la v2 de Agenttia y **no se tocan**. PLATFORM-59 crea un entorno nuevo, `cc-staging`, que
reproduce producción de CC desde `master`, con tres agentes reales copiados (IMEC, Dr. Buitrago,
Urea) **sin canales, sin secretos y sin datos de usuarios finales**.

Sirve para dos cosas, en este orden: (1) probar que `master` reproduce el esquema de producción y
medir una **línea base** de comportamiento de los tres agentes; (2) meter el PR #218, medir el
**candidato** con la tool apagada, y solo si no hay regresiones, probar el workflow de precios y los
escenarios 1–6 con la tool encendida en IMEC. Este documento es solo el plan: no se ejecuta nada.

## Decisiones tomadas

Del brief y de tus respuestas:

- Todo lo nuevo se llama `cc-staging`: proyecto Supabase, environment de Railway, Worker
  `conversionchat-platform-cc-staging`, rama `cc-stage`. En `imec-scraper`, el GitHub Environment
  `staging` **significa cc-staging** (se documenta; no se renombra).
- Datos: cliente + agente de IMEC, Dr. Buitrago y Urea, UUIDs conservados. Nada de conversaciones,
  leads, contactos, canales ni secretos. El agente de IMEC usa el mismo proveedor y modelo que en prod.
- **Documentos:** se re-ingestan desde `portal_documents.processed_content` (lo mismo que hace el botón
  de admin, sin tocar R2). Los que no lo tengan: solo con tu OK explícito, después de contarlos.
- **Lecturas de prod autorizadas** (solo lectura, sin imprimir secretos): cliente y agente de los 3;
  `platform_agent_defaults`; los planes que referencian, por `slug`; `portal_documents`; conteos de
  `platform_agent_knowledge`; y los valores de variables de Railway de prod/staging **comparados en
  memoria**, imprimiendo solo nombres. Nada más, y ninguna escritura.
- **Credenciales:** archivos locales ignorados por git (`apps/agent/.env.cc-staging`,
  `apps/admin/.env.cc-staging`, `~/cc-staging-export/.env.export`). Nunca se imprimen ni se commitean.
- Cada comando remoto (`gh`, `supabase`, `railway`, `wrangler`, MCP) se muestra antes de correrlo.
- Nada de `supabase link` en el árbol principal: `--db-url`. Rama y deploys siempre desde un
  **worktree** de `cc-stage`, verificando la rama justo antes (compartes el directorio).

Mis decisiones por defecto (dime si alguna no te sirve): merge de #218 → `cc-stage` con rebase (como el
resto del repo); 3 corridas por pregunta en cada fase; `PORTAL_URL`/`AGENDA_URL` del Worker con un
placeholder `.invalid` (no existen portal ni agenda en cc-staging); sin Resend ni WasenderAPI en cc-staging.

## Qué necesito de ti, y cuándo

| Antes de | Qué | Detalle |
|---|---|---|
| Fase 2 | Proyecto Supabase `cc-staging` | Org y plan son tu decisión (el free permite 2 proyectos y el staging actual ya ocupa uno). Me das el ref. Necesito la URL del **pooler en modo sesión** (la directa puede ser solo IPv6), la service key y la publishable key, en los archivos locales. |
| Fase 3 | Environment `cc-staging` de Railway, **vacío** | Créalo vacío, **no duplicado**: duplicar un environment copia sus secretos. Servicio `agent`, con un dominio público generado `*.up.railway.app` (no `agenttia.me`, que es de la otra marca). Variables por nombre: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY` (llave **propia**, idealmente con tope de gasto), `RUNTIME_SECRET` (nuevo) y `RAG_THRESHOLD` con el valor de prod. Sin deploy trigger. |
| Fase 4a | Conexión de **solo lectura** a prod | Preferida: un rol temporal con `SELECT` solo en las tablas listadas en la Fase 4 (te dejo el SQL), que borras al terminar. Alternativa: la URL actual con `options=-c default_transaction_read_only=on`. Va en `~/cc-staging-export/.env.export`, separada de las credenciales de cc-staging. |
| Fase 4b | Revisión de privacidad (gate G2) | Tú o Nicole miran el reporte de PII de Dr. Buitrago y Urea (sector salud) antes de importar. Yo solo veo conteos y ubicaciones, no el contenido. |
| Fase 6 | Las suites de Nicole | `apps/agent/scripts/regression/<agente>.json` para los 3. Yo entrego el esquema, una plantilla y un README. **Sin ellas no hay línea base.** |
| Fase 7 | OK para el merge (gate G5) | Mergear #218 a `cc-stage` es tu decisión. |
| Fase 9 | Environment `staging` en `alephart/imec-scraper` con `PRICES_INGEST_URL` y `RUNTIME_SECRET` | La URL apunta al Railway de cc-staging e incluye el `clientId` de IMEC. |

Gates donde me detengo y espero tu decisión: **G1** resultado del descubrimiento en prod · **G2** privacidad ·
**G3** originales de R2 (solo si hay documentos sin `processed_content`) · **G4** seed verificado ·
**G5** merge de #218 · **G6** habilitar la tool.

## Orden de ejecución

### Fase 1 — Rama `cc-stage` (sin riesgo remoto)
1. Worktree `../cp-ccstage` desde `origin/master`; rama `cc-stage`.
2. **Primer commit:** el brief (los dos textos) como `docs/tasks/platform-59-staging-cc.md`. Luego `git push -u origin cc-stage`.
3. Commits de infraestructura (ver "Archivos"): `.gitignore` primero, antes de crear cualquier `.env.cc-staging`; luego el
   environment de wrangler, los scripts de staging y el arnés de regresión.
4. `gh pr edit 218 --base cc-stage` (comando remoto, te lo muestro). El diff del PR no cambia: se calcula contra el merge-base (`master`).
5. **Invariante de la línea base:** `git diff origin/master..cc-stage -- apps/agent/src packages supabase/migrations`
   **vacío**. Se registra en la provenance de cada corrida.

### Fase 2 — Supabase `cc-staging` con `master`
1. `supabase db push --db-url "$CC_STAGING_DB_URL" --dry-run`: deben salir **exactamente las 81 migraciones de master**, sin las de AGENT-38.
2. Push. Verifico por nombre que quedaron 81, que la extensión `vector` existe (es la única que piden las migraciones) y que
   `match_platform_agent_knowledge` ya está revocada a PUBLIC.
3. **Si el dry-run o el push fallan, es un hallazgo, no un parche:** `master` no reproduce prod. Me detengo y lo reporto.
4. Lo que ya trae el esquema: `platform_agent_defaults`, el partner "Conversion Chat" (id fijo) y 5 clientes de demostración con
   emails `*.pending.local` (Aurea, Angélica, Profamilia, Juan Fernando, Innova Hogar). **Urea probablemente es el agente
   "Clínica Urea (Aurea)" ya sembrado**, así que el import hace `ON CONFLICT DO UPDATE` por id.
5. En paralelo (no bloquea): redactar el environment de wrangler y la suite con Nicole.

### Fase 3 — Railway `cc-staging` (código de master)
1. **Auditoría de variables**, solo nombres (API GraphQL de Railway + `jq`, los valores nunca se imprimen):
   - nombres fuera de la lista blanca (requeridas arriba + `RAG_*`/`RERANKER_*` si existen + `RAILWAY_*`);
   - **prohibidas:** `WASENDERAPI_*`, `META_*`, `YCLOUD_*`, `N8N_BASE_URL`, `SHADOW_MODE`, `R2_*`, `ANTHROPIC_API_KEY`
     (salvo que un agente use un modelo claude), `ENCRYPTION_KEY`;
   - nombres cuyo **valor contenga** el ref de prod `ljmtpuoooxucdubjbeox`, el del otro staging `gbkjpnteijduqsvzsnns`,
     `agenttia.me` o un bucket de R2 existente;
   - (autorizado) nombres cuyo valor sea **idéntico** al de la misma variable en prod o en el Railway `staging`: detecta una llave reutilizada.
2. Deploy: `railway up -p <proyecto> -s agent -e cc-staging -d` desde el worktree de `cc-stage`, con flags explícitos (el CLI los soporta; verifico `--help` antes).
3. Humo: `/health` 200 y los logs de arranque (el reranker descarga el modelo de HuggingFace en cada arranque; `healthcheckTimeout` es 300 s).

### Fase 4 — Seed (prod en solo lectura)
**4a. Descubrimiento** (solo ids, nombres, conteos, modelos y formas de JSON): confirmo que existen los 3 clientes y qué agente es "Urea";
modelo de cada agente (confirmo que ninguno es claude); cuántos documentos tienen `processed_content` NULL; qué campos legacy trae cada
fila (columnas o claves de JSON que no encajen con el esquema de `master`: `mix_prompt`, `wasender_*`, `last_channel_message`, claves
inesperadas en `channels`/`metadata`/`n8n_tools`, `status` o `temperature` fuera de CHECK). **Te lo reporto: gate G1.**

**4b. Export** (script propio, con **solo** la conexión de lectura de prod): lista **explícita** de columnas (no `SELECT *`). Se descartan o anulan
`channels`, `channel_credentials`, `channel_session_id`, `n8n_tools`, `n8n_agent_id`, `webhook_path`, `auth_user_id`, `phone` y `metadata`
(solo las claves que apruebes). `email` pasa a `<id>@pending.local`. Salida en `~/cc-staging-export/`, **fuera del repo**.
Un chequeo automático falla si hay `@`, teléfonos, `sk-` o `eyJ` fuera de los campos de texto; y los campos de texto (prompts y documentos)
pasan por un **escáner de PII que reporta conteos y ubicaciones, no contenido**. **Gate G2.** Si hay documentos sin `processed_content`: **G3**.

**4c. Import** (otro proceso, **solo** credenciales de cc-staging, con allowlist de `SUPABASE_URL`): planes por `slug`
(solo existen en `seed.sql`, no en migraciones) → `platform_agent_defaults` (el prompt de plataforma y el modelo por defecto de prod; sin esto la
línea base no sería comparable) → clientes → agentes con `channels='{}'`, `channel_credentials='{}'`, `channel_session_id=NULL`,
`channel_connection_status='not_configured'`, `n8n_tools='[]'`, **`followup_enabled=false`**, `runtime_enabled=false`, `rag_namespace=id` → `create_default_build_stages` →
`portal_documents` (con `processed_content` y `document_type`; `r2_key` a un valor inerte para que nada pueda apuntar a objetos de prod).
Idempotente: puedo re-sembrar.

**4d. Usuario interno:** `auth.admin.createUser` con contraseña generada (tú la guardas en tu gestor) + fila `SUPER_ADMIN` en `platform_internal_users`.

**4e. Re-ingesta:** `POST /knowledge/:agentId/ingest` al Railway de cc-staging, con `document_id` y `document_type`, replicando `ingestDocumentAction`
(texto como `.md`). Verifico que los conteos de chunks y las fuentes por agente coinciden con prod (conteos de solo lectura). **G4 (seed verificado).**
Al terminar borro `~/cc-staging-export/`.

### Fase 5 — Precondiciones de la línea base (checklist)
Seed verificado (G4) · hash de `platform_agent_defaults` y de la config de cada agente iguales a prod · modelos fijos · `followup_enabled=false` verificado ·
Railway sin credenciales de canal · worktree de `cc-stage` en el commit base con el invariante de la Fase 1 · `pnpm build` del agent ahí ·
suites de Nicole presentes · conocimiento y config **congelados** hasta terminar el candidato.

### Fase 6 — LÍNEA BASE (b)
3 corridas × cada pregunta × 3 agentes (IMEC con la tool apagada, que es como está en prod). Un JSON por corrida en `apps/agent/scripts/regression/runs/` (ignorado por git).

### Fase 7 — Meter el PR #218 (c)
1. **G5 (tu OK).** Merge de #218 → `cc-stage` con rebase.
2. `db push --dry-run` debe listar **solo** la migración de AGENT-38; después push.
3. Redeploy de Railway desde un **worktree nuevo** con el commit candidato; repito la auditoría y comparo los valores de variables antes/después **en memoria**: no debe cambiar ninguna.
4. **Admin, una sola vez aquí** (así ya incluye la card): `[env.cc-staging]` con todas sus vars (wrangler no hereda), `wrangler deploy --env cc-staging --dry-run`,
   verifico en el bundle `.open-next` que `NEXT_PUBLIC_SUPABASE_URL` es el de cc-staging y que no aparece el ref de prod ni el del otro staging (imprimo solo conteos), y
   cargo los secrets con `wrangler secret put --env cc-staging` leyendo del archivo (3 o 4: `SUPABASE_SECRET_KEY`, `RUNTIME_SECRET`, `ENCRYPTION_KEY` y R2 solo si hay bucket). Sin `RESEND_API_KEY` ni `WASENDERAPI_API_KEY`.
   Un `wrangler deploy` sin `--env` despliega a **producción**: el script lleva siempre `--env cc-staging` y nunca lo corro a mano sin él.
5. **Prueba de humo:** `/health`; la `publishable key` es **rechazada** en `match_platform_agent_knowledge` (AGENT-21); las tablas nuevas de AGENT-38 tienen RLS activo y
   los advisors de Supabase de cc-staging no marcan nada nuevo; `POST /catalog-prices/:clientId/ingest` sin secret da 403; el admin lista los clientes y abre la pestaña del agente
   (la card no se muestra hasta que haya una corrida: es el comportamiento esperado).

### Fase 8 — CANDIDATO (d)
Mismas suites, mismos agentes, tool apagada, 3 corridas, comparación con el arnés. **Cualquier FALLA detiene el plan antes de habilitar la tool.**
Cada REVISAR necesita una decisión humana registrada. Conclusión que se escribe: *"ninguna regresión detectada por estos criterios, con 3 corridas por pregunta"*, no una garantía.

### Fase 9 — Precios en cc-staging (e)
1. `gh workflow run sync-prices.yml -R alephart/imec-scraper -f environment=staging` (primera corrida desde IPs de GitHub; te muestro el comando) y sigo la corrida.
   Si el sitio bloquea los runners, se reporta y se decide.
2. Verifico en cc-staging: `platform_catalog_sync_runs` con `success` y los conteos esperados.
3. **G6.** Recién ahí habilito `get_catalog_price` en el agente de IMEC de cc-staging (UPDATE a `tools_enabled`, comando visible).
4. Escenarios 1–6 con el modelo real contra cc-staging (`simulate-price-scenarios.ts` con el guard cambiado de "solo local" a una allowlist del ref de cc-staging) y una corrida informativa de la suite de IMEC con la tool encendida.
5. Resultados a AGENT-38 y PLATFORM-59.

### Fase 10 — Documentación
`docs/ENVIRONMENTS.md`: sección **cc-staging** con cómo se despliega cada pieza (Railway por CLI desde `cc-stage`, Worker con `deploy:cc-staging`, Supabase con `--db-url`),
las reglas ("nunca `wrangler deploy` sin `--env`", "environment de Railway vacío, no duplicado") y el **rollback** por pieza (Railway: redeploy del deployment anterior;
Worker: `wrangler rollback --env cc-staging`; migración de AGENT-38: aditiva, se apaga la tool y se vuelve al commit anterior; cc-staging es desechable: se recrea con los scripts idempotentes).
Una línea en `AGENTS.md`. Estado en los tickets.

## Arnés de regresión

**Qué hace:** corre `AgentRuntimeService.process()` **localmente**, desde `dist/` del worktree correspondiente, contra la base de cc-staging, una sesión nueva por pregunta (y 1–2 conversaciones
de 3 turnos por agente, porque #218 toca memoria y contexto). No toca el runtime: lee lo que ya queda en la base.

**Limitación que acepto y dejo escrita:** no existe un endpoint para conversar con el agente desplegado (solo el webhook de canal). La regresión mide el **mismo commit**, pero en mi máquina; no valida el
runtime de Railway. Eso lo cubren el humo y la ingesta HTTP real (prueban Railway → base → OpenAI) y la auditoría de variables.

**Archivos** (`apps/agent/scripts/regression/`): `run.ts` (hermano de `simulate-price-scenarios.ts`, que no se modifica), `compare.ts`, `agents.json` (alias → UUID), `_template.json`,
`README.md` para Nicole, `<agente>.json` de Nicole (versionados, **sin datos personales**), `runs/` (ignorado).

**Esquema de la suite:** `{ agent, version, questions: [{ id, category: normal | figure_not_in_knowledge | figure_in_knowledge | handoff, text, expect: { handoff?, figures?, mustNotConfirm? } }], conversations?: [{ id, turns: [..3] }] }`.

**Guardas:** `SUPABASE_URL` debe ser exactamente el ref de cc-staging (allowlist; rechaza prod y el otro staging); falla si el agente tiene `followup_enabled` o credenciales de canal; sin `WASENDERAPI_*` en su entorno.

**Cada corrida guarda** (provenance): git sha y rama, invariante del diff vs `master`, nº de migraciones, hash de la config del agente y de `platform_agent_defaults`, modelo, `tools_enabled`, conteo de chunks por fuente. Por pregunta: respuesta, `rag_query` del log
(ids → `(source, chunk_index, score)` resueltos en la misma base), fila de `platform_handoff_control`, cifras de la respuesta.

**Criterios** (no se compara texto exacto; estados PASA / FALLA / REVISAR):
1. **Fuente recuperada:** FALLA si el candidato recupera una fuente que ninguna corrida base recuperó, o no recupera una que todas las base recuperaron; REVISAR si solo cambian orden, `chunk_index` o score.
2. **Ningún precio inventado:** las cifras de la respuesta (`extractNumericClaims`) deben estar en los chunks recuperados o en la pregunta, si no, FALLA. REVISAR si repite una cifra de la pregunta que no está en el conocimiento (posible confirmación) o si hay "$/pesos/millón" sin cifra parseada. Para "cifra SÍ en el conocimiento" se exige que aparezca si la mayoría de la base la dio.
3. **Handoff:** misma decisión y mismo `triggered_by` que la mayoría de la base, y lo que Nicole espere en `expect`.
4. **Sin la tool:** `tools_enabled` no incluye `get_catalog_price` y ninguna respuesta nombra `get_catalog_price`/`consultar_precio`.
5. **Sanidad:** respuesta no vacía; REVISAR si el largo se aparta mucho de la mediana base.

**Limitaciones conocidas del arnés:** el `95000` suelto no se reconoce como cifra (decisión de AGENT-38); `request_handoff` y las otras tools no se registran en `platform_runtime_logs`, así que la comprobación de "tool apagada" es por configuración
y por texto, no por intercepción de llamadas; los precios dichos en palabras ("un millón") caen en REVISAR.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `master` no reproduce el esquema de prod | El dry-run lo dice antes de escribir; es un hallazgo y se reporta, no se parchea |
| Los planes reales solo existen en `seed.sql` | Se exportan por `slug` y se insertan antes que los clientes |
| `platform_agent_defaults` de prod distinto al de migración | Se copia; sin eso la línea base no es comparable |
| Urea ya existe sembrada por una migración, con ids fijos | `ON CONFLICT DO UPDATE` por id; verifico qué queda |
| PII en prompts y documentos (Buitrago y Urea son del sector salud) | Escáner que reporta conteos, revisión humana (G2), export fuera del repo y borrado al terminar |
| Export de prod con la credencial equivocada | Dos procesos: el export solo tiene la conexión de lectura de prod; el import solo tiene la de cc-staging con allowlist |
| Duplicar el environment de Railway copia secretos | Se crea vacío; la auditoría de nombres y de valores lo detecta |
| `wrangler deploy` sin `--env` despliega a producción | Script fijo con `--env cc-staging`, `--dry-run` primero y verificación del bundle |
| `NEXT_PUBLIC_*` de un `.env.local` ganando al de cc-staging | Verifico el bundle antes del deploy |
| Cron de follow-up dentro del arnés | `followup_enabled=false` verificado y sin credenciales de canal |
| La línea base se contamina con código de #218 | Worktrees separados por fase y el invariante del diff |
| El LLM no es determinista | 3 corridas, criterios en vez de texto, REVISAR con decisión registrada |
| El reranker descarga el modelo de HuggingFace sin versión fijada | Misma máquina y misma ventana de tiempo para línea base y candidato; se anota en la provenance |
| La regresión local no valida el runtime de Railway | Se declara; humo e ingesta HTTP reales; variables auditadas |
| Free tier de Supabase / RAM de Nano (la caída de prod del 23/09) | Decisión tuya antes de la Fase 2; son 3 agentes y poco volumen |
| La corrida de GitHub Actions puede fallar por bloqueo de IP | Es justamente la primera prueba; se reporta y se decide |
| `supabase db push --db-url` con el pooler o IPv6 | Pooler en modo sesión; dry-run primero |
| Hay ramas `stage` (Agenttia) y `cc-stage` parecidas | Verifico la rama justo antes de cada deploy y de cada comando remoto |
| Cache de build de Cloudflare con código viejo | Verifico qué versión quedó desplegada después de cada deploy |

## Archivos (rama `cc-stage`)

- `docs/tasks/platform-59-staging-cc.md` — el brief, en el primer commit.
- `.gitignore` — `.env.cc-staging*`, `apps/agent/scripts/regression/runs/`, `cc-staging-export/`.
- `apps/admin/wrangler.toml` y `apps/admin/package.json` — `[env.cc-staging]` y `deploy:cc-staging` (con `dotenv -e .env.cc-staging … --env cc-staging`).
- `apps/agent/scripts/staging/` — `export-from-prod.ts` (usa `supabase db query --db-url … --output-format json`; sin dependencias nuevas), `import-to-cc-staging.ts`, `ingest-documents.ts`, `seed-internal-user.ts`, auditoría de variables de Railway.
- `apps/agent/scripts/regression/` — lo descrito arriba.
- `docs/ENVIRONMENTS.md` y `AGENTS.md` — Fase 10.
- Después de mergear #218: `apps/agent/scripts/simulate-price-scenarios.ts` (guard por allowlist).

Reutilizo: el patrón `createRequire`/`dist` de `simulate-price-scenarios.ts`; `extractNumericClaims` de `apps/agent/src/agent/anti-repetition.ts`; la lógica de `ingestDocumentAction`
(`apps/admin/src/app/(dashboard)/clients/actions.ts`); `inviteUserAction` y `seed.sql` para el usuario interno; `migrate-knowledge.ts` como patrón de copia entre proyectos.

## Verificación y criterio de salida

- Fase 2: 81 migraciones por nombre; la RPC rechaza la publishable key. Fase 3: `/health` 200, auditoría sin nombres ni valores indebidos. Fase 4: conteos de chunks y fuentes iguales a prod.
- **Criterio de salida antes de habilitar la tool:** el reporte de `compare.ts` sin ningún FALLA y con cada REVISAR resuelto, en los tres agentes.
- Aceptación final: sync de precios `success` desde GitHub Actions, escenarios 1–6 con el modelo real y `docs/ENVIRONMENTS.md` actualizado.

## Lo que no verifiqué (lo confirmo durante la ejecución)

El formato exacto de `supabase db query --output-format json`; el pooler de un proyecto nuevo; dónde vive realmente Urea y cuántos documentos de cada agente tienen `processed_content`;
que `railway up -p … -s … -e …` funcione sin `link` en un worktree; y qué trae realmente la fila de prod de cada agente (los campos legacy).
