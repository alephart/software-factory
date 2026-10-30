---
tags: [estado, handoff]
actualizado: 2026-10-29
---

# Estado actual — leer primero al iniciar una sesión nueva

Volver a [[README]]

> Este archivo es el **traspaso entre sesiones**. Al empezar una conversación nueva: leer este
> archivo y el [[README]]. Al cerrar una sesión: actualizarlo.
> **Fuente de verdad del producto:** Plane (comentarios por fase) y el repo (`master`, `docs/tasks/`).
> Este archivo resume; no duplica.

## Dónde estamos (29/10)

**Plan vigente:** [[plan-fabrica-2026-10-24]] · **Decisiones:** [[consolidacion-2026-10-23]] (A–E, cuentas de GitHub, seguridad de las skills).
El historial de sesiones está abajo, de la más nueva a la más vieja.

| Frente | Estado |
|---|---|
| **Fábrica (FACTORY-11)** | Fases 1 y 2 cerradas. **Fase 3, bloque 1 cumplido (29/10):** el issue #19 de `factory-sandbox` llegó a Done en `https://factory.alephart.co` (Railway) con el bot de producción `agenttic-factory[bot]`: triage → plan v1 (AJUSTAR) → v2 (APROBAR) → build (PR #20) → review → merge. La tarjeta de Review la crea el webhook. Runbook: `factory-server/docs/runbook-railway.md` |
| **Gate de merge** | `factory-verdict` **reforzado contra bots** (PR #18 de `factory-sandbox`) y App de producción sin permiso *Workflows*. Probado con el bot de producción: camino feliz y commit tras *approve* (vuelve a *pending*; la re-review sale sola). Falta *request changes* y 2 rondas |
| **Skills** | Regla de confianza fusionada (PR #5) y vista funcionando en el #19. Cuatro hallazgos del 29/10 por corregir (ver la sesión del 29/10) |
| **Plane ↔ Factory (B)** | Decidido. Hecho: `origen:plane`. Falta: proyecto SANDBOX, labels `destino:*`, invitar a Nicole (*Triage*) |
| **CC** | Piloto en producción. Ítem **D + REQUEST-9** (Railway con *Wait for CI*, Config as Code vence el **2026-12-01**) y después **C (Sentry)**, por el flujo de CC. Congelado 23–28/11 (congreso de EMA). REQUEST-10 (EMA) en curso por el flujo de CC |
| **Agenttia** | Repo en `Alephart-Co` cuando llegue la fase 4 (E2B → Team → primer ítem por la Factory) |

**Siguiente (en orden):**
1. Rama de skills en `factory-server`: `factory-plan` publica cada versión del plan en un **comentario nuevo** (hoy edita el anterior con `PATCH`);
   `factory-triage`, `factory-plan` y `factory-plan-review` leen `updated_at` y tratan un comentario editado después de la etapa que lo usó
   como decisión nueva, con la hora de la edición; `factory-plan-review` lee el hilo con el shell, sin guardarlo en `/tmp` para abrirlo con Read.
2. Issue nuevo en `factory-sandbox` para *request changes* y 2 rondas (bloque 2); sirve también para probar la rama de skills.
3. Borrar el túnel de Cloudflare ("Factory Agenttia in alephart.co"): ya no hace falta.
4. WorkOS: revocar la llave sin uso (*Last used: Never*); Branding y nombre del equipo (hoy "Xanxeiman's Team").
5. Costo de la primera semana (*Usage* del workspace de Railway) frente a los ~USD 48 del Droplet; costo por ítem en Anthropic (*Usage* por modelo y workspace).
6. Antes de la fase 4 (sin cambios): que `railway-start.sh` espere al puerto 5432 y el respaldo diario a R2.

**Recordatorios:** *Auto-approve tools* se apaga con cada reinicio o redeploy (revisarlo siempre). *Interaction limits* de `factory-sandbox` vencen el **2027-04-27**.

## 29/10 — bloque 1 cumplido: primer recorrido en Railway

**Higiene antes del recorrido**
- *Interaction limits* activos en `factory-sandbox` ("solo colaboradores", hasta 2027-04-27). `FACTORY_BOT_LOGIN=agenttic-factory[bot]`.
  *Restart Policy* = Always y límite duro de gasto confirmados en Railway.
- `agenttic-factory-dev` desinstalada de `Alephart-Co` (no suspendida). Se reinstala al volver a desarrollo en local (por ejemplo, para el artículo).
- `factory-server`: PR #6 (`fase-3`) y PR #7 (`railway-backups`: runbook de Railway, WorkOS, *Workflows: No access*, `AGENTS.md` con Railway como servidor en uso) fusionados.

**Gate reforzado contra bots** (`factory-sandbox` PR #18, junto con el renombre del job a `publicar-estado`)
- Hueco que cerró: con `pull_request`, un PR desde una rama del repo corre su propia versión del workflow; el bot podía editar
  `factory-verdict.yml` y aprobarse. Ahora `pull_request_target` (versión de `main`; seguro porque el job no ejecuta código del PR).
- Solo un autor de tipo `User` pasa como "PR humano"; cualquier otro bot queda en rojo. Un PR del bot que toque `.github/` queda en rojo.
- Ya estaba bien: el ruleset solo acepta `factory-verdict` publicado por GitHub Actions (`integration_id` 15368).
- La App de producción tiene **Workflows: No access** (verificado): sin eso, un PR del bot podría agregar un workflow que publique el estado.
- El PR que cambia el disparador no puede evaluarse a sí mismo: se disparó una vez con un comentario (`issue_comment` corre con `main`).

**Recorrido del #19** (formatCOP con decimales sin separador de miles)
- Triage (`agenttic-factory[bot]`): dejó la decisión como pregunta, con propuesta y argumento contrario; no creó etiquetas.
- Decisiones de Juan Carlos en el issue: redondear a pesos enteros (simétrico, cero sin signo); luego, cambio sobre #16: los valores
  pequeños dan `$0` y el `TypeError` queda solo desde 1e21; descartado registrar `parseCOP` con decimales sin escala.
- Plan v1 → revisión con **Opus 5.5**: AJUSTAR con un bloqueante real (`-0.0000005` lanzaba `TypeError`). Plan v2 → APROBAR.
- Build → PR #20 (46 pruebas; 6 fallan sin el cambio) → review `approve` → `factory-verdict` verde en ~10 s → commit vacío → *pending*
  con el SHA nuevo → re-review lanzada sola por el push (~2 min) → verde → merge → Done.
- **`plan:aprobado` la pone `factory-plan-review` al APROBAR (por diseño, guía paso 4); la aprobación humana es pulsar Build.**
  En el #19 Juan Carlos la quitó y la volvió a poner a mano tras la revisión: sin efecto, la revisión ya había aprobado.

**Hallazgos para las skills** (van a la rama del punto 1 de "Siguiente")
1. `factory-plan` publica el v2 editando el comentario del v1: la revisión anterior queda citando un texto que ya no se ve en el hilo.
2. Las skills arman el hilo con `created_at`, sin `updated_at`: un comentario humano editado se atribuye a su hora original (pasó en el #19).
3. `factory-plan-review` guarda el hilo en `/tmp` con el shell y la herramienta Read no lo encuentra (2 de 2 veces; se recupera sola).
   Read y el shell de la sandbox no comparten `/tmp`.
4. "Registrar en el Intake del tracker" es ambiguo en un repo sin proyecto de Plane: hoy es un issue nuevo en el mismo repo.
- Menores: el triage no ejecutó pruebas y no vio que el #1 ya pedía "sin decimales"; puso como "fuera de alcance" un caso que entraba en el ítem.

**Regla para personas:** cada decisión en un **comentario nuevo**; no editar un comentario que ya leyó una etapa (si hay error, otro comentario que lo corrija).

**Otros**
- **Crédito de Anthropic agotado** a mitad del recorrido: se acabó el saldo prepagado de febrero (gasto del 29/10 ~USD 0,47). Recarga y
  recarga automática activadas. Hoy los agentes de CC usan OpenAI; si un producto usa Anthropic, organización propia o límite por workspace
  para que la Factory no lo deje sin saldo.
- **Commits *Unverified*:** los commits que Claude hace en la nube con el nombre de Juan Carlos van firmados con la llave de la sesión
  (`unknown_key`). Para Agenttia y CC: opción A (Claude prepara, Juan Carlos hace el commit firmado desde el Mac). No agregar esa llave a la cuenta.
- **Atribución en commits del bot:** Mastra agrega `Co-Authored-By: mastra-platform[bot]`. Decidir para Agenttia y CC.
- Commits del bot sin firma: no importa mientras el ruleset no exija firmas.

## 28/10 23:59 — fábrica creada

- *Create factory*: `Alephart-Co/factory-sandbox` (`main`), intake configurado después, cuentas personales, `anthropic/claude-sonnet-5-5`
  con llave del workspace `factory` de Anthropic (runbook-servidor 1.5).
- La sesión de usuario arranca bien en Railway: clon y checkout con la App de producción, `exit=0` (la sandbox escribe en `/data/sandboxes`).
- *Settings → Behavior* bloqueado en la fábrica nueva (404 en `/api/agent-controller/code/sessions/<id-de-la-fábrica>`): lee la sesión
  propia de la fábrica, que nace con el primer trabajo. Se habilitó tras un *Investigate* desde el intake. Queda en el runbook de Railway.

## 28/10 22:15 — dentro de la Factory

- Bucle de login (`ERR_TOO_MANY_REDIRECTS`): la `WORKOS_API_KEY` en Railway estaba **recortada**. Pista decisiva: *API Keys → Last used: Never*
  y el usuario sin sesiones, con autenticación y MFA en *succeeded*. Mastra se traga el error del canje en `/auth/callback` y reinicia el login.
- WorkOS Production quedó con: Email + Password, MFA TOTP obligatorio, registro cerrado, Initiate login URI `/auth/login`.
- Runbook del servidor (sección 1.3, rama `factory-11/railway-backups`): Redirects, métodos, MFA y el síntoma del bucle.

## 28/10 00:10 — servidor de la Factory arriba en Railway

- Servicio `factory` desplegado; `https://factory.alephart.co` responde con certificado de Railway (CNAME *DNS only*) y redirige a WorkOS. El túnel sigue (se borra al final).
- Errores de arranque y su causa (quedan en el runbook): llave de cifrado guardada con el nombre `_KEY_ID`; `ENOTFOUND` (host de `DATABASE_URL`
  escrito a mano → ahora `${{postgres.RAILWAY_PRIVATE_DOMAIN}}`); `ECONNREFUSED` (Postgres reiniciándose al mismo tiempo); `28P01` (la imagen solo lee
  `POSTGRES_PASSWORD` en el primer arranque; se alineó con `ALTER USER` desde *railway ssh*, tomando el valor de la variable).
- **Hueco:** `factory` no espera a Postgres; con la política por defecto queda caída tras ~10 reintentos. Cubierto con *Restart Policy* = Always;
  antes de la fase 4, que `railway-start.sh` espere al puerto 5432.
- **Hueco:** sin `WORKOS_*`, la Factory no falla: usa el login de la plataforma de Mastra. Verificado que redirige a WorkOS.
- `factory-server` rama `factory-11/railway-backups` (subida, sin PR): contraseña en hex, `DATABASE_URL` con referencias, comandos probados, *Restart Policy*, errores de arranque.

## 27/10 21:15 — Railway en marcha

- PRs #5 (`confianza-skills`) y #6 (`fase-3`) de `factory-server` fusionados en `master`. `setpriv` confirmado en la imagen base.
- Railway: workspace **Factory** (Hobby), proyecto **factory-agenttia**, servicio **postgres** (`pgvector/pgvector:pg18`) en verde. El primer deploy crasheó
  porque salió antes de cargar variables y volumen; con "Apply changes" quedó bien.
- **Hobby no permite crear ni programar backups** (es Pro). Decisión: sin backups en la prueba; **cron a R2 antes de la fase 4** (plan 4.1b).
- **Hueco nuevo:** WorkOS con registro abierto dejaría entrar a cualquiera (y el servidor le crea organización). Se cierra desactivando el registro y creando los usuarios a mano.
- Rama `factory-11/railway-backups` en `factory-server` (subida, sin PR): runbook con la sección de backups y WorkOS cerrado.
- **Siguiente:** servicio `factory` (sección 3, sin desplegar) → WorkOS Production (4.1) → GitHub App de producción → Anthropic → desplegar.

## 26/10 23:55 — fase 3: se prueba Railway antes del Droplet

- Paso 0 hecho: la imagen se construye en local (podman, arm64): `skills:test`, `board:test` y `build` en verde. Falta probar el **arranque** (varlock, llave PEM).
- **Revisión de E:** primero Railway, en un workspace propio de la Factory, con nuestro Dockerfile; Droplet como alternativa. Ver [[consolidacion-2026-10-23]].
- `factory-server` rama `factory-11/fase-3`: `deploy/railway-start.sh` y `docs/runbook-railway.md` (commit `51a54ff`); ruta nueva del túnel en el runbook del Droplet (`c582eaf`). Falta push.
- Túnel de Cloudflare creado ("Factory Agenttia in alephart.co"): **sobra si Railway funciona** (borrarlo).
- *Interaction limits*: en `factory-sandbox` todavía no estaba activo al 26/10 (opción "Limit to repository collaborators", 6 meses).
- **Siguiente:** push y merge de `factory-11/fase-3` y `factory-11/confianza-skills`; runbook de Railway desde la sección 1.

## 26/10 22:30 — bloque 0 en marcha

- **Hecho por Juan Carlos desde el 24/10:** `origen:plane` en `factory-sandbox`; pie de atribución quitado del PR #13; segundo recorrido feliz
  (issue #16 notación exponencial → PR #17, `factory-verdict` en verde por approve). Aún **sin probar** *request changes* ni commit tras approve.
- **0.2 hecho (falta push y PR):** `factory-server` rama `factory-11/confianza-skills` (commit `bbbdb0f`): `factory-plan` 0.6, `factory-plan-review` 0.5,
  `factory-triage` 0.5 verifican el permiso del autor o "Decisores de producto" en `AGENTS.md`. `skills:test` OK.
- **0.3 hecho (falta PR):** rama `renombrar-job-verdict` en `factory-sandbox` (subida): job → `publicar-estado`; el estado sigue siendo `factory-verdict`.
- **Pendiente del bloque 0:** *Interaction limits* (0.1, no estaba activo), SANDBOX y `destino:*` en Plane, invitar a Nicole, integrar ramas a `master` (0.6),
  sección "Decisores de producto" en el `AGENTS.md` de `factory-sandbox` cuando Nicole acepte.
- **Siguiente:** bloque 1 (fase 3), paso 0 del runbook: construir la imagen en el Mac.

## 24/10 10:00 — gate `factory-verdict` probado (camino feliz)

- Cuentas de GitHub decididas: CC se queda en `alephart` (sin transferir); fábrica y Agenttia en `Alephart-Co`. Team cuando Agenttia reciba PRs de la Factory.
  **La Factory no entra a CC** hasta tener gate que bloquee (Pro personal) y la App en *Any account*.
- `factory-sandbox` ahora es **público** (historial y comentarios auditados). Workflow `factory-verdict` (PR #13) + ruleset `main protegido`.
- Recorrido issue #14 → PR #15: merge **bloqueado** sin review y **habilitado** solo con `Verdict: approve` sobre el último head. Detalle en [[consolidacion-2026-10-23]].
- **Pendiente de probar del gate:** *request changes* (rojo y escalado a las 2 rondas) y commit nuevo tras *approve* (vuelve a *pending*). Renombrar el job a `publicar-estado`.
- Nuevo issue en el sandbox: notación exponencial en `formatCOP` (hallazgo del PR #15).
- **Decisión B tomada (24/10 tarde):** Plane decide el qué y el si; GitHub el cómo. Labels `destino:factory|persona|decision` (Plane) y `origen:plane` (GitHub);
  skills `plane-to-factory` y `factory-to-plane` en el kit (prioridad baja: primero la línea en la DoD); proyecto SANDBOX en Plane; Nicole colaboradora del repo.
  Detalle en [[consolidacion-2026-10-23]].
- **Por hacer de B:** crear SANDBOX en Plane y los labels `destino:*` (por proyecto); `origen:plane` en `factory-sandbox`; invitar a Nicole; línea nueva en la DoD.
- **Decisión D tomada:** Railway con autodeploy + *Wait for CI*, en un solo ítem de CC junto con REQUEST-9 (vence 2026-12-01). Por el flujo de CC.
- **DoD v0.3:** línea de "Para registrar en el Intake".
- **Requisito de seguridad nuevo:** las skills solo cuentan comentarios de autores con permiso (Mastra ya filtra los disparadores; nuestras skills leen todo el hilo).
  Pendiente: *Interaction limits* en `factory-sandbox` (al 26/10 **no** estaba activo). Nicole se invita por email con rol *Triage*.
- **Decisión C tomada:** Sentry Developer solo en `apps/agent`, una organización por producto, región US, sin contenido de conversaciones, alertas mínimas;
  al Intake con la skill `sentry-to-plane` (Gmail + MCP de Sentry, con OK). Ítem de CC después de D/REQUEST-9.
- **Las cinco decisiones (A–E) quedaron cerradas.** **Plan desde el 24/10:** [[plan-fabrica-2026-10-24]] (bloques 0–5, dependencias, fechas y criterios de salida). Siguiente: bloque 0.

## 23/10 23:05 — consolidación de investigaciones (este chat sigue con la decisión A)

- Nota nueva: [[consolidacion-2026-10-23]]. La arquitectura se mantiene; quedan cinco decisiones (A gate de merge, B Plane ↔ GitHub
  con ambos workspaces en Free, C Sentry, D Railway fuera del gate, E infraestructura confirmada con E2B como gate duro).
- **En curso: A.** Check obligatorio `factory-verdict` + que los checks bloqueen (depende del plan de GitHub de cada producto).

## 23/10 22:55 — FACTORY-11 fase 3: despliegue escrito, falta montar el servidor (chat nuevo)

**Dónde quedó:**
- `factory-server` **ya está en GitHub** (`Alephart-Co/factory-server`): `master` con mejoras de prioridad alta (PR #1),
  `dependences-control` (PR #3) y `AGENTS.md` (PR #4). Rama **`factory-11/fase-3`** subida, 2 commits, **sin PR**:
  `deploy/` (Dockerfile, Compose de producción, plantillas `.env` y `app.env`, `backup.sh`) y `docs/runbook-servidor.md`
  (de crear el Droplet a ver Done, con casillas).
- Vault: `factory-11/fase-2` y `docs/agents-md` siguen sin integrar a `master`; esta nota va en `factory-11/fase-3` (sale de `docs/agents-md`).

**Decisiones del 23/10** (detalle en [[factory-server]], sección "Fase 3"):
- **Postgres en el Droplet**, no Supabase. Supabase serviría (pgvector), pero con conexión directa o *Session pooler* (Mastra usa
  *advisory locks*), org propia y plan Pro; se descarta por costo, latencia y porque es estado de la Factory, no de un producto.
- **Sin Redis:** un solo proceso, igual que en la fase 2. Se agrega con `REDIS_URL` si llegan varias réplicas.
- **Túnel con nombre:** `cloudflared` como servicio del Compose con el token del túnel; ningún puerto abierto salvo SSH.
  Sin Cloudflare Access en esta fase (WorkOS ya exige login).
- **Sandbox local en la fase 3**, solo `factory-sandbox`. E2B (ya soportado con `E2B_API_KEY`, sin cambiar código) **antes de
  instalar la App en cualquier repo de producto**, no "al salir a prod".
- **La App de `Alephart-Co` no obliga a mudar productos:** con *Any account* se instala en la cuenta de CC o Agenttia (fase 4).
  Principio de entrega intacto.
- **Parches del SO** con `unattended-upgrades` (reinicio automático 04:30 Bogotá) y actualización mensual de imágenes.
- **NVIDIA Inception y DigitalOcean Hatch:** revisados, no se aplica por ahora (no descartado). Hatch no cubre Anthropic ni GPU;
  los dos excluyen consultoras y estudios de desarrollo: si se aplica, como empresa de producto (Agenttia, CC).

**Siguiente:**
1. Paso 0 del runbook en el Mac: `docker compose -f deploy/docker-compose.prod.yml build app` (la imagen **no se ha probado**).
   Confirmar al arrancar que `varlock` toma el entorno del contenedor y que la llave PEM llega bien desde `app.env`.
2. PR de `factory-11/fase-3` en `factory-server` y merge.
3. Runbook, secciones 1–6: Droplet, túnel, WorkOS *Production*, GitHub App de producción, workspace `factory` de Anthropic,
   respaldo y recorrido hasta Done.
4. Integrar el vault a `master` (`factory-11/fase-2` → `docs/agents-md` → `factory-11/fase-3`).

**Pendientes chicos (sin cambios):** etiquetas `status:*` en `factory-sandbox`, issue "formatCOP no valida el tipo" (sirve como
issue del recorrido de prueba), cerrar el túnel temporal.

## 23/10 12:10 — traspaso a la fase 3 de FACTORY-11 (chat nuevo)

**Dónde quedó:** fases 1 y 2 cerradas. Dos recorridos completos en `factory-sandbox` (#2 `parseCOP`, PR #11; #3 README, PR #12),
el segundo ya con las mejoras de prioridad alta. Skills de la fábrica en v0.4/v0.5. Guía de operación y requisitos en
`factory-server/docs/factory-skills.md`. Conclusiones en [[06-factory-primer-recorrido]].

**Estado de los repos (todo local, sin subir):**
- `factory-server`: ramas `factory-11/skills-fase-2` → `factory-11/mejoras-alta` (HEAD `46dc0c5`). **Sin remoto**: hay que crear
  `alephart-co/factory-server` (privado) y subirlo.
- `software-factory` (vault): rama `factory-11/fase-2` sin integrar a `master` (se integra con fast-forward).

**Fase 3 — objetivo** (ver [[factory-server]]): Droplet dedicado en DigitalOcean (8 GB / 4 vCPU), Docker Compose (Postgres+pgvector,
Redis), túnel fijo de Cloudflare a `factory.alephart.co`, WorkOS *Production*, respaldos diarios de Postgres, y el mismo flujo
de `factory-sandbox` hasta Done en el servidor. Requisitos que salieron de la fase 2 y aplican en el servidor:
- `MASTRACODE_PUBLIC_URL=https://factory.alephart.co` (sin ella ninguna review publica veredicto).
- Webhook de la GitHub App a `https://factory.alephart.co/web/github/webhook` (ruta exacta); si hay Cloudflare Access, dejar pasar solo esa ruta.
- *Auto-approve plans* apagado; *Auto-approve tools* se apaga con cada reinicio.
- Etiquetas `plan:aprobado`, `status:auto-approved`, `status:changes-requested` en cada repo.
- **Aislamiento real** de la sandbox (E2B o usuario del sistema dedicado): hoy solo tiene HOME propio. Requisito antes de productos.
- GitHub App de producción (hoy `agenttic-factory-dev` es de desarrollo) y llave de Anthropic de organización con límite de gasto.
- Modelo por defecto Sonnet 5.5; revisión del plan con Opus 5.5.

**Pendientes chicos:** crear `status:auto-approved` y `status:changes-requested` en `factory-sandbox`; registrar el issue
"formatCOP no valida el tipo" (hallazgo de la review del PR #12); cerrar el túnel temporal.
**Anotado para después:** Plane ↔ GitHub (sección en [[06-factory-primer-recorrido]]). Los 3 issues urgentes de CC van por el flujo de CC, no por la Factory.

## 23/10 11:45 — mejoras de prioridad alta

- **Building exige `plan:aprobado`** (tablero Work propio) y **sandbox con HOME propio**: hechas y verificadas con el issue #3
  (Build bloqueado sin etiqueta; revisión APROBAR la puso; PR #12 con autor `agenttic-factory-dev[bot]`). `factory-server` rama
  `factory-11/mejoras-alta`. **Token de revisión separado:** bloqueado por Mastra 0.24 (mitigación de proceso documentada).
- **Siguiente:** review y merge del PR #12; subir `factory-server` a `alephart-co/factory-server`; modelo por defecto Sonnet 5.5;
  fase 3 (servidor, túnel fijo, aislamiento real). Plane ↔ GitHub queda anotado para cuando lleguemos.

## 23/10 — FACTORY-11 fase 2 cerrada; dirección Plane ↔ GitHub

- **PR #11 de factory-sandbox fusionado** tras re-review *approve* (37/37). Fase 2 cerrada; comentario en FACTORY-11.
- **Plane ↔ GitHub (propuesta, sin módulo propio):** Plane Inbox como entrada y aceptación → etiqueta `github` → la integración nativa de
  Plane crea el issue → la Factory lo toma. Comentarios bidireccionales = bitácora en Plane. Pendientes de Intake al cierre con
  Claude Code + MCP (`intake create`). Detalle y lo que hay que validar en [[06-factory-primer-recorrido]].
- **Siguiente:** spike Plane ↔ GitHub (plan Pro, una org por workspace, atribución de comentarios); mejoras de prioridad alta;
  subir `factory-server` a `alephart-co/factory-server`; fase 3.

## 22/10 23:15 — FACTORY-11 fase 2: recorrido completo con nuestras skills

- `factory-sandbox` #2 (`parseCOP`) llegó de triage a re-review **aprobada** con las skills de la fábrica (v0.4, `factory-server`
  rama `factory-11/skills-fase-2`, 5 commits, sin remoto todavía). Falta: decidir "1,000 mil" y **merge del PR #11**.
- La prueba sacó 9 defectos (2 de seguridad de proceso: una sesión de usuario aprobó en nombre de una persona; el builder construyó un
  plan viejo). Todos corregidos o documentados. Conclusiones, modelos y mejoras en [[06-factory-primer-recorrido]].
- Webhooks en local con `cloudflared tunnel --url http://localhost:4111` (URL temporal). `.env` con `MASTRACODE_PUBLIC_URL=http://localhost:4111`.
- **Siguiente:** las 3 mejoras de prioridad alta (Build exige APROBAR, aislar la sandbox, token de revisión), modelo por defecto
  Sonnet 5.5, más issues para medir, y subir `factory-server` a `alephart-co/factory-server`. Después, fase 3 (servidor).

## 22/10 — FACTORY-11 fase 2: skills escritas, falta probarlas

- En `factory-server` (sin commit todavía): `factory-triage`, `factory-plan` (+ plantilla), `factory-plan-review` (nueva) y
  `factory-review`/`factory-rereview` generadas con `npm run skills:build`. Verificado con el código de Mastra que el servidor las sirve
  (`npm run skills:list`) y que `tsc` pasa. Detalle y hallazgos en [[factory-server]]; uso en `factory-server/docs/factory-skills.md`.
- **Cambio de diseño:** sin subagentes en la Factory, el plan-reviewer corre en una **sesión nueva** antes de pulsar Build.
- **Siguiente:** commit en `factory-server`; reiniciar `pnpm dev`; *Auto-approve plans* apagado; recorrer un issue nuevo de
  `factory-sandbox` con las skills nuevas. Sigue pendiente lo de la fase 1 (merge del PR #10, cerrar #9) y los webhooks (túnel o fase 3).

## 22/10 08:30 — FACTORY-11: fase 1 casi cerrada, sigue la fase 2

- Issue #9 de `factory-sandbox` recorrido en la Factory local: triage, plan, build (PR #10) y revisión lanzada a mano
  (aprobó, pero no publicó el veredicto: sin webhooks no hay tarjeta de Review). Falta: merge del PR #10, cerrar #9, ver Done.
- Lecciones en [[factory-server]]: WorkOS obligatorio, llave de Anthropic en workspace, webhooks necesarios para Review.
- **Siguiente: fase 2.** Nuestras skills en `factory-server/src/mastra/public/factory-skills/`: triage con aprobación
  humana y sin crear etiquetas, plan con nuestra plantilla, plan-reviewer independiente, review con reglas del repo.
  Requiere conectar la carpeta `~/Projects/agenttic/factory-server` en la sesión.
- Aparte: webhooks en local (túnel temporal) o esperar a la fase 3 (servidor en `factory.alephart.co`).

## 22/10 00:20 — dónde quedó FACTORY-11 (fase 1, local)

- `factory-server` corre en local (`pnpm dev`, `localhost:4111`) con WorkOS Staging, GitHub App `agenttic-factory-dev`
  en `alephart-co` y Haiku 5.5 (llave del workspace `factory-dev` de Anthropic). El triage y el plan del issue #6 funcionaron.
- El #6 se enredó: hubo merge manual antes de Review (PR #7) y luego un revert (PR #8). `main` tiene el revert, así que el bug sigue.
- **Para retomar:** tarjeta #6 a Canceled; cerrar el issue #6 y borrar la rama `factory/issue-6`; crear el issue nuevo (será el #9);
  recorrerlo esperando entre etapas (en local sin webhooks la sincronización tarda 1–5 min) y hacer el merge solo después del Review.
- Lección: en local, no tocar GitHub a mano mientras la tarjeta avanza.

## 21/10 — al retomar (pausa del 13 al 20/10)

- **CC:** canal de EMA en producción. Para el Go de IMEC se agregó `request_advisor` (aviso a un asesor sin pausar al agente),
  con ADR 038 y suite de ORIANA v2 probada con el arnés (PR #239, en `cc-stage`; `cc-stage` va 9 commits adelante de `master`).
  **Ojo:** el número 038 ya lo tomó `request_advisor`; el ADR de conocimiento pasa a **039** y el ADR 034 sigue diciendo "ver ADR 036".
- **Fábrica:** FACTORY-1 Done; FACTORY-2 y 3 en Review & QA; FACTORY-10 (Mastra) decidido: nuestras piezas + Mastra como motor y UI,
  en repo nuevo y servidor propio; local solo para desarrollo (ver [[05-mastra-factory-prueba]]). Sigue FACTORY-11.

## 11/10 — lo que avanzó (Claude Code, cotejado en GitHub y Plane)

- **PLATFORM-62 Done:** cc-staging completo (portal y agenda sin workers.dev, Access solo en el admin, desvío de correos con `EMAIL_REDIRECT_TO`,
  seed y humo de agenda). **Suites v2** de Buitrago y Urea con agendamiento, **aprobadas por Nicole** (AGENT-44) y con línea base v2.
- **PLATFORM-63 Done:** **CI** en cada PR (type-check, lint, pruebas) y **tag + GitHub Release automáticos** cuando los 3 Workers quedan en verde.
  Verificado en el release real v0.13.2. Límites: el CI avisa pero no bloquea (plan gratuito); Railway (agent) no entra en el gate. PLATFORM-65 descartado.
- **Releases:** 0.13.1 (agenda BOOKING-7/8 + PLATFORM-62) y 0.13.2 (CI y releases). REQUEST-8 cerrado.
- **BOOKING-5, 7 y 10 Done.** BOOKING-10 es el **primer ítem con estimación Fibonacci** (1 punto, abierto y cerrado en 12 minutos: carril express).
- **ADR 036 (cc-staging, ramas y acceso) y ADR 037 (CI y releases)** escritos (PR #238, en `cc-stage`; falta subir a master).
- **Nuevo e importante para la fábrica:** PLATFORM-64, promover un agente probado en cc-staging a producción con todo su setup y sin datos de prueba.

**Desvíos de proceso detectados en el cotejo del 11/10:**
1. **Numeración de ADR en conflicto:** el ADR 034 dice "Reemplazado (ver ADR 036, pendiente)", pero el 036 ahora es cc-staging.
   El ADR de conocimiento pasa a ser **ADR 038** y hay que corregir la línea del 034.
2. **Hallazgos fuera de la puerta única:** AGENT-44/45, BOOKING-5 a 10 y PLATFORM-63 a 65 se crearon directo en los proyectos de módulo, sin pasar por Request.
   El 09/10 los hallazgos sí iban a Request. Hay que decidir la regla (ver decisiones abiertas). REQUEST-19 "prueba" es basura.
3. **Estimaciones:** solo BOOKING-10 tiene puntos; los demás ítems nuevos no.
4. **Cierres sin línea de esfuerzo** ni formato DoD (las horas siguen pendientes).
5. **Puntos 4–6 del cotejo del 10/10:** runbook marcado como ejecutado en `cc-stage` (falta master); plan v2.2 sigue fuera del repo;
   el registro del humo no aparece. CODEOWNERS de suites y `plan-reviewer-agent` siguen sin estar en el repo.

## Caso 1 — estado al 10/10

| Ítem | Estado en Plane | Para cerrar |
|---|---|---|
| PLATFORM-59 — staging de CC | **Done** (10/10 16:26). Etapa B separada en **PLATFORM-62** (In Progress) | — |
| AGENT-38 — precios del catálogo | Review & QA. Código, migración y sync en prod; tool apagada | Go del cliente → habilitar la tool en ORIANA, prueba en prod, `PRICES_SCHEDULE_ENABLED=true` en imec-scraper |
| AGENT-37 — prompt de ORIANA | Review & QA | Prompt final en ORIANA de prod **y versionado** (el probado difiere del de `docs/tasks/agent-37-oriana-prompt-precios.md`) |
| REQUEST-1 | Backlog (desalineado) | Con 37 y 38 en Done + comentario en el padre |
| REQUEST-8 | **Done** (11/10) | Cerrado con PLATFORM-59 y 62; PLATFORM-60 sigue aparte |
| REQUEST-3 | **Done** (10/10 19:07) | — |

## Cotejo de la salida a prod contra la DoD v0.2 (10/10)

**Cumple:** migración antes del merge; merge commit; deploy de runtime y Workers; RLS verificada; sync de precios en prod;
etapa B separada en su propio ítem (sin "parciales"); release y CHANGELOG (0.13.0); tool apagada hasta validar con el cliente.

**Resuelto el 10/10 (registrado en PLATFORM-59):**
1. ~~Rol temporal `cc_staging_export` en prod~~: **borrado** (confirmado por Juan Carlos).
2. ~~G7~~: **confirmado**, los REVISAR son variación del modelo.
3. ~~Cifra del Suero Hydra~~: **corregida** en el conocimiento de staging y prod.
8. ~~Cierres sueltos~~: AGENT-28, PORTAL-14 y PLATFORM-48 a **Done** (evidencia: `d135dbc`, `f785d59`); PLATFORM-50 **cancelado** (obsoleto por la decisión del 04/10); REQUEST-3 a **Done**.

**Lo revisa Juan Carlos (con Claude Code):**
4. Runbook en master desactualizado: dice "EN PAUSA" con todas las casillas sin marcar; debería decir EJECUTADO 10/10.
5. Humo: el cierre no menciona `/health` ni la prueba de un agente de prod "igual que antes".
6. Plan v2.2 de PLATFORM-59 sigue sin estar en el repo.

**Decidido:**
7. Prompts: **no se versionan por ahora**. Versionarlos bien es una herramienta del admin por cliente (candidato a Request más adelante).
   Mientras tanto, el texto final del prompt se pega en el comentario de cierre del ítem (DoD v0.2).

**Pendiente:** formato DoD con línea de esfuerzo humano y puntos (horas de Juan Carlos y Nicole por etapa).

**Límites conocidos que salen con el release:** escenario 4 (equipo ambiguo) → REQUEST-12, aceptado por el cliente; formato del precio → REQUEST-13.

## Request: cola por triar

- **En Intake (sin triar):** REQUEST-2, 4, 5, 6 y 7 (n8n en el repo, conocimiento editable 4+5, alertas de sync, handoff que apaga la conversación). REQUEST-3 Done.
- **En Backlog, registrados durante el caso 1:** REQUEST-9 (Railway retira Config as Code el 2026-12-01, **alta**),
  10 (EMA no usa los textos exactos, **alta**), 11 (5 casos de la línea base), 12 (ambigüedad en `get_catalog_price`),
  13 (formato del precio), 14 (token de ingesta por cliente), 15 (WhatsApp de prueba en cc-staging), 16 (reranker y `/shadow`),
  17 (verificar cifras antes de enviar, **alta**), 18 (política de envíos de IMEC).
- **Creados directo en módulos el 11/10 (sin triar por Request):** AGENT-45 (flujo de descuentos), BOOKING-6 (Google "app no verificada"),
  BOOKING-8 (invitación de Google a cualquier correo), BOOKING-9 (festivos), PLATFORM-64 (promoción staging → prod).

## Piezas del harness ya en uso

| Pieza | Dónde |
|---|---|
| Puerta única de entrada | Plane → proyecto **Request** (Intake) |
| Plantillas intake v0.4, triage v0.4, DoD v0.2, runbook de salida, comentario por fase, asistente de intake | `04-plantillas/` |
| Guía para producto (Nicole) | Página en Plane (Request) |
| Etiquetas `linea:*`, `causa:*` | Plane → Agent y PLATFORM (son por proyecto) |
| Subagentes builder | repo `.claude/agents/`: runtime, database, admin, portal, portal-design, booking, calendar |
| Agente de Review | repo `.claude/agents/reviewer-agent.md`. Primer bloqueante real en AGENT-38 |
| Agente de Planning | v0.2, en `04-plantillas/agentes/plan-reviewer-agent.md`. Calibración 2 hecha (PLATFORM-59). Falta llevarlo al repo |
| **Entorno previo a prod** | `cc-staging` (nuevo). Flujo `feature → cc-stage → master` |
| **Suite de regresión por agente** | `apps/agent/scripts/regression/` (ORIANA, DIEGO, UREA, suites v1). Arnés `run.ts`, `compare.ts`, `ab.ts` |
| **Regla de A/B fijada antes de correr** | `docs/tasks/platform-59-results/ab-regla.md` |
| **Runbook de salida a prod** | `docs/tasks/platform-59-salida-a-prod.md` (candidato a plantilla) |
| **CI** (11/10) | type-check, lint y pruebas en cada PR; tag y Release automáticos tras el deploy en verde (ADR 037, `docs/VERSIONING.md`) |
| **Suites v2 aprobadas por producto** | Buitrago y Urea con agendamiento (AGENT-44) |

## Decisiones abiertas

- ~~Retro del caso 1~~ **Decidido el 10/10:** holdout en punto medio (suite visible con CODEOWNERS + set holdout fuera del repo); Fibonacci al triar y horas humanas al cerrar; gate de regresión 3 + 10 corridas. Ya en [[definition-of-done]] v0.2 y [[triage]] v0.4.
- **Modelo de conocimiento:** **ADR 038** (reemplaza al 034; el número 036 lo tomó cc-staging), prerequisito de REQUEST-4 y 5. Mientras tanto, puente manual.
- **Puerta única vs. hallazgos en caliente:** ¿un hallazgo que aparece mientras se construye entra por Request o se crea directo en el módulo con enlace al ítem padre y se tría en el lote semanal?
- **PLATFORM-64** (promoción de agentes staging → prod) es la pieza que convierte cc-staging en la línea de onboarding de agentes: candidato a caso 2.
- **Agenttia (PLATFORM-60, To Do):** tag `agenttia-v2-base`, repo propio, entornos heredados. Después de que los precios estén en prod.
  Regla del puente: los fixes van de CC a Agenttia, nunca al revés.

## Reglas del flujo

- **El plan aprobado vive en el repo**, en `docs/tasks/<ítem>-plan.md` junto a su brief, y se enlaza en Plane.
  ⚠ PLATFORM-59 no lo cumple: la v2.2 solo está en el vault (`03-modelo/calibracion/platform-59-plan-v2.2.md`).
- **El vault guarda conocimiento de la fábrica**, no artefactos del producto. La excepción es el material de calibración.
- **Antes de escribir un archivo en el repo**, verificar si ya existe y su estado en git.
- **Regresión antes de habilitar:** todo cambio en el runtime se valida contra la suite de los agentes en producción,
  con línea base tomada **antes** del cambio y regla de decisión escrita **antes** de ver resultados.
- **Nada en prod sin OK explícito**, paso por paso (runbook).

## Decisiones del 12/10

- **Estructura:** `software-factory` (molde) + productos (`conversion-platform`, `agenttia`) como instancias. Ver [[fabrica-y-productos]].
- **Principio de entrega:** cada producto debe poder entregarse y operarse **sin la fábrica y sin ajustes**: se copia, no se enlaza;
  cuentas e infraestructura propias por producto; el repo se explica solo; nada en el repo apunta al vault.
- **Caso 2 = PLATFORM-60** (crear `software-factory` + arrancar Agenttia instalando el molde). **Caso 3 = PLATFORM-64** (promoción staging → prod).
- **ADR de conocimiento = 038** (el 036 lo tomó cc-staging).

## Acceso a Plane (12/10)

| Conector | Workspace (slug) | Cómo | Proyectos |
|---|---|---|---|
| `Plane_So` | `conversion-chat` | OAuth (claude.ai) | Request, Agent, Platform, Portal, Booking, Marketing |
| `plane-agenttia` | `agenttia` | stdio local en Claude Desktop (`uvx plane-mcp-server`, PAT) | Inbox, Platform, Agent, Marketing |

- **Regla:** antes de cualquier escritura, verificar el workspace con `workspace retrieve`.
- **Ojo con los identificadores repetidos:** ambos workspaces tienen `PLATFORM`, `AGENT` y `MARKETING`.
  En notas y comentarios que crucen workspaces, escribir el prefijo: **CC PLATFORM-60** / **AG PLATFORM-1**.
- Agenttia ya tiene **INBOX** como puerta de entrada (equivalente a Request de CC).

## Backlog de la fábrica — Plane `agenttia` → proyecto **FACTORY** (creado el 12/10)

Estimación Fibonacci activa; estados Backlog → Todo → In Progress → Review & QA → Done / Cancelled.

| Ítem | Qué | Pts | Prioridad |
|---|---|---|---|
| FACTORY-1 | Kit `software-factory` con el vault adentro (CC PLATFORM-60 parte A) — **Done** (repo `alephart/software-factory`) | 5 | alta |
| FACTORY-2 | Agentes base versionados en `kit/agents` — **Review & QA** (falta instalar en CC) | 3 | alta |
| FACTORY-3 | CI modelo y arnés genérico en `kit/ci` y `kit/harness` v0.1, con `install.sh` — **Review & QA** (se prueba al instalar en Agenttia) | 5 | media |
| FACTORY-4 | Holdout: CODEOWNERS de suites + set holdout fuera del repo | 3 | media |
| FACTORY-5 | Regla de puerta única para hallazgos en caliente — **Done** | 1 | alta |
| FACTORY-6 | Horas del caso 1 y cierre de la retro | 1 | media |
| FACTORY-7 | Triage por lotes como ritual semanal | 2 | media |
| FACTORY-8 | Calibración 1 del `plan-reviewer-agent` | 2 | baja |
| FACTORY-9 | Artículo: estructura v2 y borrador 1–6 | 3 | baja |

## Próximos pasos de la fábrica

Reemplazado por el plan [[plan-fabrica-2026-10-24]] y por "Siguiente" en "Dónde estamos" (arriba). La lista del 12/10 queda en el historial de git.

## Cómo retomar en una conversación nueva

```
Retomamos la software factory: FACTORY-11 fase 3 (servidor en Railway). Lee ~/Projects/agenttic/software-factory/vault/00-estado-actual.md,
el README del vault, vault/03-modelo/plan-fabrica-2026-10-24.md, vault/03-modelo/consolidacion-2026-10-23.md y
~/Projects/agenttic/factory-server/docs/runbook-railway.md (rama factory-11/fase-3 o master si ya se fusionó).
Conecta las carpetas software-factory y factory-server.
```
