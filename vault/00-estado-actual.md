---
tags: [estado, handoff]
actualizado: 2026-10-23
---

# Estado actual — leer primero al iniciar una sesión nueva

Volver a [[README]]

> Este archivo es el **traspaso entre sesiones**. Al empezar una conversación nueva: leer este
> archivo y el [[README]]. Al cerrar una sesión: actualizarlo.
> **Fuente de verdad del producto:** Plane (comentarios por fase) y el repo (`master`, `docs/tasks/`).
> Este archivo resume; no duplica.

## Dónde estamos

- **Piloto:** Conversion Chat (`master` = producción). **Core futuro:** Agenttia.
- **Flujo de ramas vigente:** `feature → cc-stage → master`, con `cc-staging` como entorno previo a prod
  (Supabase `cc-staging`, Railway `cc-agent`, Workers `stg.*`; admin detrás de Cloudflare Access). Documentado en `docs/ENVIRONMENTS.md`.
- **Caso 1 (precios de IMEC):** **en producción desde el 10/10** (PR #223, merge commit `04dfb95`; release 0.13.0).
  La tool `get_catalog_price` sigue **apagada** en ORIANA de prod: IMEC probó en staging y aprobó; se habilita con el Go del cliente.
- **Fábrica:** el caso 1 es el primer ítem que recorre el flujo completo. Retrospectiva medida en
  [[04-caso-1-retrospectiva]]. Estándares nuevos del 10/10: [[definition-of-done]] v0.2, [[triage]] v0.4,
  [[runbook-salida-a-prod]], [[comentario-por-fase]]; Fibonacci activa en Plane.

## 21/10 — al retomar (pausa del 13 al 20/10)

- **CC:** canal de EMA en producción. Para el Go de IMEC se agregó `request_advisor` (aviso a un asesor sin pausar al agente),
  con ADR 038 y suite de ORIANA v2 probada con el arnés (PR #239, en `cc-stage`; `cc-stage` va 9 commits adelante de `master`).
  **Ojo:** el número 038 ya lo tomó `request_advisor`; el ADR de conocimiento pasa a **039** y el ADR 034 sigue diciendo "ver ADR 036".
- **Fábrica:** FACTORY-1 Done; FACTORY-2 y 3 en Review & QA; FACTORY-10 (Mastra) decidido: nuestras piezas + Mastra como motor y UI,
  en repo nuevo y servidor propio; local solo para desarrollo (ver [[05-mastra-factory-prueba]]). Sigue FACTORY-11.

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
  Ya: *Interaction limits* en `factory-sandbox`. Nicole se invita por email con rol *Triage*.
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

0. **Separar cuentas de CC y Agenttia** (prerrequisito del principio de entrega): org de Supabase de cc-staging, environment `staging` de Agenttia en el Railway de CC.
1. **Higiene (una tanda de Claude Code):** subir `cc-stage` a master (ADR 036/037, runbook ejecutado); corregir la línea del ADR 034 a "ver ADR 038";
   plan v2.2 de PLATFORM-59 al repo; `plan-reviewer-agent` al repo; CODEOWNERS de `apps/agent/scripts/regression/`.
2. **Decidir la regla de la puerta única** para hallazgos en caliente y borrar REQUEST-19.
3. **Triage por lotes con Fibonacci:** Request 2, 4–7, 9–18 + los ítems directos del 11/10. Primero lo que tiene fecha o es alto: REQUEST-9 (Railway, 01/12), 10 y 17.
4. **Caso 2 con los estándares nuevos** (puntos al triar, horas al cerrar, DoD v0.2): es el "después" del artículo.
5. Horas del caso 1 (tabla A/B/C, pendiente) y habilitar ORIANA con el Go de IMEC.
6. ADR 038 (conocimiento) · PLATFORM-60 (Agenttia) · artículo, estructura v2.

## Cómo retomar en una conversación nueva

```
Retomamos la software factory: FACTORY-11 fase 3 (servidor). Lee ~/Projects/agenttic/software-factory/vault/00-estado-actual.md,
el README del vault, vault/03-modelo/factory-server.md y ~/Projects/agenttic/factory-server/docs/runbook-servidor.md
(rama factory-11/fase-3 o master si ya se fusionó). Conecta las carpetas software-factory y factory-server.
```
