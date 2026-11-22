---
tags: [modelo, fase-4, e2b, mastra, factory-server]
creado: 2026-11-16
actualizado: 2026-11-16
estado: en-curso
item: FACTORY-11 (fase 4) · FACTORY-12 (versión de Mastra)
---

# Fase 4: E2B, respaldo y versión de Mastra (16/11)

Volver a [[README]] · Estado: [[00-estado-actual]] · Costo: [[costo-por-item-2026-11-02]] · Plan: [[plan-fabrica-2026-10-24]]

Revisión del 16/11 en la noche: código de `factory-server` (`src/mastra/index.ts` y `node_modules` de `@mastra/factory` 0.24.0 y
`@mastra/e2b` 0.15.0), changelog de `@mastra/factory` (0.25 a 0.28) y de `@mastra/e2b` (0.15.1 a 0.17.0), y documentación de E2B.
**Nada se cambió ni se probó: todo lo de esta nota sale de leer código y changelog.** Las decisiones están abiertas (sección final).

## Proveedores de sandbox en lo desplegado (0.24)

`index.ts` elige el proveedor **una sola vez al arrancar**, en este orden:

1. **Local**, si `FACTORY_SANDBOX_PROVIDER=local` (hoy).
2. **Mastra Platform**, con `MASTRA_PLATFORM_ACCESS_TOKEN` o `MASTRA_PLATFORM_SECRET_KEY` más `MASTRA_PROJECT_ID` y `MASTRA_ENVIRONMENT_ID`
   (su backend se elige con `SANDBOX_PROVIDER=e2b|railway`).
3. **E2B directo**, con `E2B_API_KEY` → `new E2BFactorySandbox({ apiKey })`.
4. **Callback propio** (cualquier `MastraSandbox`), sin ajustes en la UI ni builds de plantilla.

- **Activar E2B no pide código:** agregar `E2B_API_KEY` en Railway, quitar `FACTORY_SANDBOX_PROVIDER` y redesplegar.
- **El cambio es global** (no hay proveedor por proyecto): `factory-sandbox` también pasa a E2B. Hacerlo sin tarjetas en vuelo;
  los checkouts de `/data` quedan huérfanos. Volver atrás: poner otra vez `FACTORY_SANDBOX_PROVIDER=local`.
- **Ajustes por proyecto** (UI) o con `defaults` en código: `cpuCount` (1–8, por defecto 2), `memoryMb` (512 MB a 8 GB, por defecto 1 GB),
  `idleTimeoutMinutes` (1–1440, por defecto 5).
- **Plantilla por repo:** E2B construye una imagen con el clon y el `setupCommand`, etiquetada por SHA; hay "Build now" para precalentar.
- **`E2B_API_KEY` no está en `.env.schema`:** declararla para que varlock la valide.

## Hallazgo 1 — la llave de Anthropic no entra a la sandbox

Corrige la nota del 16/11 ("la llave del modelo entra a la sandbox para que Claude Code funcione"): eso es de otros esquemas. En Mastra
Factory el agente corre en el servidor (Railway) y la sandbox solo ejecuta comandos. Lo único que el servidor inyecta es **`GH_TOKEN`**
(`workspace.js`); no hay `ANTHROPIC_API_KEY` en el código de sandbox de `@mastra/factory`.

- La llave aparte para los runs ya no se justifica por la sandbox; el workspace `factory` de Anthropic ya tiene límite de gasto.
- **El riesgo real es el `GH_TOKEN`:** lo lee cualquier comando del repo (un `postinstall` de una dependencia, por ejemplo).
  **Sin verificar:** si el token se emite acotado a un repo o cubre toda la instalación de la App.
- **Sin verificar:** si en la 0.24 la UI permite definir variables propias para la sandbox (en la 0.28 sí, cifradas).
- La sandbox de E2B sale a internet sin restricción por defecto; `E2BFactorySandbox` acepta `network` para limitarla (cambio de código).

## Hallazgo 2 — la hora de Hobby no es por sesión

- La hora es de **ejecución continua** y se reinicia con cada pausa y reanudación; una sandbox pausada se conserva sin vencimiento y no
  cobra (docs de E2B, *How long does a sandbox live?*).
- `@mastra/e2b` crea las sandboxes con `onTimeout: 'pause'` y se reconecta sola en el siguiente comando. Una tarjeta que espera horas a
  una persona no consume la hora.
- **Riesgo:** `idleTimeoutMinutes` no mide inactividad. El plazo se fija al crear o reconectar y no vimos que se extienda con la
  actividad. Con 5 minutos, un `pnpm install` o una suite larga quedaría congelada a mitad y el reintento volvería a lanzar el comando.
- **Qué medir** (cambia frente a lo anotado el 16/11): el comando más largo y el turno continuo más largo del build, no la sesión entera.
  También el tiempo y el tamaño del build de la plantilla, y si 1 GB alcanza (probablemente no para el monorepo).

## Cuándo se detiene la sandbox en la 0.24

- **Al terminar la tarjeta (Done o Canceled) ya se detiene:** `retireTerminalSessions` en `factory.js` retira las sesiones de la tarjeta
  y `SessionRetirementCoordinator` detiene su sandbox (en E2B, detener = pausar). Límite: solo si el proceso del servidor todavía la
  tiene abierta; después de un redeploy queda al plazo del proveedor.
- **Entre etapas no se detiene:** queda encendida hasta el plazo. Eso es lo que agrega la 0.28 (#29981), junto con detener desde
  cualquier proceso.
- **Costo de no tenerlo:** como máximo un plazo por cada despertar. Con 60 min y 2 vCPU / 4 GB, ~USD 0,17 por despertar
  (USD 0,000014 por vCPU-segundo y USD 0,0000045 por GiB-segundo); centavos frente a ~USD 5 de tokens por ítem.
- **Hacerlo nosotros** pediría usar piezas internas de Mastra (el registro de sandboxes por sesión no es API pública): frágil y de poco
  valor. La palanca sin código es el plazo: más corto = menos espera pagada, más riesgo de congelar un comando largo.
- **Hueco:** las sandboxes pausadas no se borran solas (E2B las conserva sin vencimiento); solo se destruyen al borrar la sesión.
  **Decidido el 16/11 (Juan Carlos): se resuelve con una limpieza periódica** (ver "Pendiente: limpieza de sandboxes pausadas").

## Pendiente: limpieza de sandboxes pausadas

**Por hacer** (decidido el 16/11; es parte de la fase 4 y condición para dejar E2B en uso continuo). Con E2B, cada sesión de cada
tarjeta deja una sandbox pausada que nadie borra: Mastra solo la destruye al borrar la sesión, y E2B no les pone vencimiento.

- **Qué debe hacer:** destruir cada cierto tiempo las sandboxes pausadas que ya no sirven y dejar registro de cuántas borró.
- **Por definir con Juan Carlos:**
  - Criterio: sandboxes de tarjetas en Done o Canceled con más de N días, y sandboxes huérfanas (sin sesión en la Factory).
    Nunca las de tarjetas en vuelo: una tarjeta que espera a una persona tiene su sandbox pausada y la necesita.
  - Vía: borrar la sesión desde la Factory (Mastra destruye la sandbox y mantiene su base coherente) o borrar directo en E2B con su
    API (más simple, pero la Factory queda apuntando a una sandbox que ya no existe; la 0.24 crea una nueva si la sesión despierta).
  - Dónde corre: el mismo servicio cron del respaldo (4.1b) u otro.
  - Frecuencia y N.
- **Probado el 22/11 (01:05):** borrar una sesión desde la Factory destruye su sandbox en E2B en segundos (sesión de usuario de
  verificación; la sandbox desapareció de *Sandboxes*). Es la vía limpia: Mastra borra la VM y mantiene su base coherente.
- **Lo que no hace la 0.24 sola:** al pasar una tarjeta a Done o Canceled retira sus sesiones **sin borrarlas** (detiene, no destruye),
  así que sus sandboxes quedan pausadas para siempre. Borrar la sesión también borra su conversación: decidir cuánto tiempo se guarda
  (N días) antes de borrar.
- **Antes de definir, verificar:** cuántas sandboxes deja un ítem completo (se ve en el primer recorrido en `factory-sandbox`), si E2B
  cobra o limita el almacenamiento de las pausadas, y cómo identifica Mastra cada sandbox (metadato `mastra-sandbox-id` = id de sesión).

## Tiempos de los ítems ya recorridos (medido el 22/11 desde GitHub)

Fuente: fechas de comentarios, etiquetas, commits y cierre en `Alephart-Co/factory-sandbox` (API de GitHub). Todos con la sandbox
**local** y un repo mínimo (sin dependencias): sirven para el flujo, no para el tiempo de install o pruebas de un monorepo.
Minutos desde que se abre el issue.

| Issue | Triage | Respuesta humana | Plan | Revisión del plan | Commit del build | Review | Cierre | Notas |
|---|---|---|---|---|---|---|---|---|
| #16 (24/10) | 0 | 6 | 8 | 11 | 14 | 18 | **18** | Camino feliz, sin esperas |
| #24 (02/11) | 4 | 8 | 11 | 16 | 19 | 21 | **29** | Con una ronda de *request changes* provocada (25–26) |
| #14 (24/10) | 4 | 20 | 22 | 25 | 47 | 88 | **92** | 22 min hasta el build y 41 hasta la review: esperas humanas |
| #19 (29/10) | 20 | 34 | 37 | 60 → AJUSTAR, 121 APROBAR | 140 | 178 | **189** | Plan ajustado; ~60 min de espera entre las dos revisiones |
| #21 (02/11) | 0 | 7 | 11 | 18 | 139 | 144 | **193** | 121 min esperando el Build; pruebas del gate y *Update branch* al final |

**Lo que dicen:**

- **El agente trabaja en minutos:** triage, plan, revisión del plan y review tardan 2–7 min cada uno; el build hasta el commit, 2–10 min
  desde que se pide. Una corrección tras *request changes*, menos de 1 min. Ninguna etapa del agente se acercó a los 60 min de E2B.
- **El tiempo total lo ponen las esperas humanas:** un ítem chico sale en **18–30 min** si la persona está atenta, y en **1,5–3 h**
  si hay un ajuste del plan o la persona se aparta. Las esperas largas (40–120 min) están siempre antes de Build y de Review.
- **Intervenciones humanas en un ítem sin tropiezos: 6**, no 4: Investigate (o el triage automático), responder el triage, mover a
  Planning, lanzar la revisión del plan en una sesión nueva, Build, Review y merge. Dos de ellas (lanzar la revisión del plan y la
  review) son pasos de "apretar un botón" sin decisión: candidatas a automatizar (en la 0.28 la review del PR puede arrancar sola).
- **Para E2B:** con estas etapas, un plazo de 15–30 min cubriría el trabajo del agente en un repo chico. **No se baja todavía:**
  falta medir install, build y pruebas del monorepo real (decisión 4).

## Automatizaciones posibles en la 0.24 (revisado el 22/11 en el código)

Propuesta de Juan Carlos: bajar las intervenciones humanas. La 0.24 permite reglas propias por evento de GitHub
(`new GithubIntegration({ rules: { issueCommentCreated, pullRequestOpened, … } })`, en `index.ts`) que devuelven decisiones
(`transition`, `invokeSkill`, `sendMessage`), y un ajuste por proyecto `autoRunEnabled` (*Auto-start runs*): apagado, todo
`invokeSkill` queda *proposed* esperando aprobación.

| Intervención | Cómo automatizarla en la 0.24 | Cuidado |
|---|---|---|
| Lanzar la review del PR | Encender *Auto-start runs*: los PRs de la Factory ya llegan como candidatos a arrancar solos | También arranca solo el triage de issues nuevos de autores con escritura (deseable) |
| Mover a Planning al responder el triage | Regla en `issueCommentCreated`: comentario de una persona con escritura, tarjeta en Triage → `transition` a `planning` | Responder no siempre es aprobar: exigir una señal explícita en el comentario (p. ej. `/plan`). Reemplaza el re-triage por defecto de ese evento: conservarlo cuando no hay señal |
| Lanzar la revisión del plan | Regla en `issueCommentCreated` sobre el comentario del bot con `<!-- agenttic-factory-plan -->` → `invokeSkill` de `factory-plan-review` en otra sesión | Corre con el modelo por defecto del proyecto (hoy Sonnet), no con Opus: la 0.24 no deja modelo por etapa. Comprobar que la sesión de la regla es independiente de la del plan . **Probado a mano el 22/11 (#27):** revisión con Sonnet 5.5, APROBAR; seguir su calidad en los próximos ítems |
| Build | **Se queda humano** (no negociable en `AGENTS.md`); además la 0.24 no tiene evento de etiqueta para engancharlo | — |

Orden propuesto: primero el recorrido con el flujo actual (línea base), después las automatizaciones en una rama, una a la vez y
probadas en `factory-sandbox`.

## Versión de Mastra: 0.24 frente a 0.28

La estable es **0.28.0 (12/11)**, no la 0.26: 0.25.0 (28/10), 0.26.0 (30/10), 0.27.0 (03/11), 0.28.0 (12/11). Pide `@mastra/core` 1.83.0,
`@mastra/code-sdk` 1.19.0, `@mastra/platform-workspace` 1.13.0 y `@mastra/e2b` 0.17.0. Fuente: `mastracode/factory/CHANGELOG.md` y
`workspaces/e2b/CHANGELOG.md` en `mastra-ai/mastra`; fechas con `npm view`. Se filtraron las 226 entradas por sandbox, tableros, reviews,
skills, modelos y migraciones; las de Slack, Linear e interfaz no se leyeron una por una.

**Qué se rompe de lo nuestro:**

| Pieza nuestra | Qué cambia | Versión |
|---|---|---|
| Gate `plan:aprobado` (`boards/work-board.ts`) | Envuelve `workBoard.transitionPolicy`, que deja de existir: todas las transiciones fallan con `transitionPolicy is not a function` (#29860). Las políticas de transición quedan obsoletas a favor de `nextPhases` y `exitTool` (#29039) | 0.27–0.28 |
| Arranque (`index.ts`) | Pasar un tablero `work` propio en `boards` lanza error; `includeDefaultBoards` se ignora; `reviewBoard` ya no se exporta. El tablero propio se guarda con `factory.upsertBoard()` | 0.28 |
| Tablero Review | Retirado. La review de PRs pasa a la fase `pr-review` del tablero Work (#28978, #29346). Un proyecto existente lo conserva mientras tenga tarjetas abiertas | 0.27–0.28 |
| Triage | Corre una sola vez por tarjeta: un comentario ya no lo despierta (#29230). Se puede restaurar con una regla propia | 0.27 |
| Plan y build | Comparten una sesión `work` (#28721). Los planes siempre esperan a una persona con `submit_plan`; el ajuste *Auto-approve plans* desaparece (#29039) | 0.26–0.27 |
| Build | Skill nueva `factory-build`; el build insiste como objetivo, hasta 20 corridas (#29707). Sin medir su costo | 0.28 |
| Base de datos | Los tableros pasan a guardarse por proyecto (#29317) y las tarjetas cambian de estructura con migración (#28961) | 0.27–0.28 |
| `factory-verdict` | Mastra publica un comentario de estado "Reviewing…" en cada PR (#29597): comprobar que el gate lo ignora | 0.28 |

Nuestras cinco skills siguen siendo nuestras, pero hay que comprobar que el tablero nuevo las llama (ahora por `runner.skill`, editable
en Settings › Boards y Settings › Skills).

**Qué ganaríamos:**

- **E2B:** la sandbox se detiene al terminar cada etapa (#29981); arreglo de `gh` y `git push` con 401 en sesiones largas, con token
  nuevo al reconectar (#29824); variables de entorno de la sandbox desde la UI, cifradas (#29923); matar un proceso mata los que lanzó
  (e2b 0.16.1); mejores mensajes cuando la sandbox se cuelga (#28792). No hay nada que arregle el plazo que no se extiende.
- **Costo por ítem:** no hay modelo por etapa (la palanca 2 sigue pendiente). El triage único ahorra la corrida extra del 02/11.

**Tres caminos:**

| Camino | A favor | En contra |
|---|---|---|
| **A.** E2B sobre la 0.24, respaldo, y subir después | Aislamiento real en días; un cambio a la vez; el respaldo llega antes de las migraciones | Riesgo del 401 en sesiones largas; lo medido del flujo cambia al subir |
| **B.** Subir a 0.28 primero, luego E2B | E2B se prueba con los arreglos y con el flujo definitivo | Varias sesiones antes de tener aislamiento; migra la base sin respaldo; mezcla dos cambios grandes |
| **C.** Respaldo, subir a 0.28, y E2B al final | El orden más seguro para la base | El que más demora el aislamiento, que es lo que bloquea entrar a CC |

Subir no es "una sesión": es rehacer el tablero y volver a validar el flujo completo. Merece su propio ítem, y ahí se decide si el gate
`plan:aprobado` se rehace sobre el mecanismo nuevo o se reemplaza por el `submit_plan` nativo.

## 4.1b — respaldo: opciones

| Opción | A favor | En contra |
|---|---|---|
| **A.** Servicio cron en el proyecto de Railway: `pg_dump -Fc` a R2 (`deploy/backup.sh` adaptado) | Red privada; copia fuera de Railway; es lo que pide el runbook | Imagen propia con `pg_dump` de la misma versión mayor que el servidor |
| **B.** GitHub Actions programado | Gratis, con historial de ejecuciones | Obliga a exponer Postgres por el proxy TCP público |
| **C.** Railway Pro (backups y PITR) | Sin código | La copia sigue dentro de Railway: no sobrevive a borrar el volumen |

**Huecos, cualquiera sea la opción:** el dump trae las credenciales cifradas (sin `FACTORY_CREDENTIAL_ENCRYPTION_KEY` no se recuperan: la
prueba de restauración debe descifrar una); en qué cuenta de Cloudflare vive el bucket (la Factory no es CC ni Agenttia, y CC se muda
después del 29/11); retención con regla de ciclo de vida del bucket para que el token del cron sea solo de escritura; aviso si el respaldo
no corre; dónde se prueba la restauración (Docker local o un Postgres temporal).

## Decisiones (16/11)

**Cerradas por Juan Carlos el 16/11 (22:53):**

1. **Versión:** E2B sobre la 0.24 (camino A). La subida a la 0.28 queda como ítem aparte, después del respaldo.
2. **Plazo y tamaño** del primer recorrido en `factory-sandbox`: 60 min y 4 GB; se ajusta con datos.
3. **Llave de Anthropic:** se sigue con la del workspace `factory` actual. No se crea una aparte.
4. **Monorepo:** se mide después del primer recorrido en `factory-sandbox` (falta elegir cómo: script con el SDK de E2B, copia privada
   en `Alephart-Co` o App en CC).
5. **Limpieza de sandboxes pausadas:** se hace, y es importante. Falta definir criterio, vía, dónde corre y frecuencia.

**Abierta:**

6. **Respaldo (4.1b):** opción, cuenta de Cloudflare y dónde se prueba la restauración.
