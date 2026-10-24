---
tags: [modelo, decisiones, factory-server, consolidacion]
creado: 2026-10-23
estado: en-discusion
item: FACTORY-11
---

# Consolidación de investigaciones (23/10)

Volver a [[README]] · Relacionado: [[factory-server]] · [[06-factory-primer-recorrido]] · [[fabrica-y-productos]]

Junta lo que ya decidimos y probamos con lo que salió de una investigación aparte (GitHub Apps, Sentry, Railway, Supabase, R2,
Plane y cómo arman sus fábricas Stripe y Spotify). La conclusión corta: **la arquitectura actual se mantiene**; lo nuevo son
cinco decisiones, sobre todo cómo convertir los gates de proceso en gates de máquina.

## Lo que se mantiene (base probada)

- Puerta única en Plane (Request en CC, Inbox en Agenttia) con intake estructurado y plantillas versionadas.
- Mastra Factory como motor y UI, con nuestras skills (`factory-triage`, `factory-plan`, `factory-plan-review`, reviews generadas).
- Defensa en capas: plan-review en sesión nueva y con otro modelo, etiqueta `plan:aprobado`, review y re-review. Medida en [[06-factory-primer-recorrido]].
- cc-staging, suites de regresión con regla de decisión escrita antes de ver resultados, CI en cada PR.
- Principio de entrega: cada producto se entrega y opera sin la fábrica.
- Servidor de la Factory en un Droplet dedicado, sin credenciales de producción ([[factory-server]]).

## Lo que confirman los grandes

| Quién | Qué hacen | Qué nos dice |
|---|---|---|
| Stripe (Minions) | 1.300+ PRs mergeados por semana, sin código humano y con revisión humana. Fork de Goose. Devboxes y suite de tests construidos para ingenieros años antes que los agentes. Una sola puerta de herramientas (MCP interno *Toolshed*). Tope de 2 rondas de CI | Adoptar un motor abierto (Mastra) es el mismo patrón. La inversión que más rinde es la infraestructura de verificación (cc-staging + suites) |
| Spotify (Honk) | Agente de fondo sobre Claude Agent SDK, con un runtime de verificación de CI separado. Llegaron por Backstage → Fleet Management → Honk | **El cuello de botella pasó a ser la revisión, no escribir código.** Primero estandarizar, después automatizar |

Fuentes: [ByteByteGo — Stripe Minions](https://blog.bytebytego.com/p/how-stripes-minions-ship-1300-prs),
[Port — Stripe](https://software-factories.port.io/stripe), [Spotify — Honk](https://backstage.spotify.com/honk-webinar),
[Ry Walker — in-house coding agents](https://rywalker.com/research/in-house-coding-agents).

**Lo que aportan y no tenemos todavía:**
1. **Tope de rondas:** 2 rondas de review/CI por tarea; a la tercera, escala a una persona.
2. **Una sola puerta de herramientas:** un conjunto curado de MCP (Plane, Sentry, docs del repo) para todas las sesiones. Verificar si Mastra 0.24 deja configurar MCP por sesión.
3. **Métricas del sistema:** % de PRs mergeados sin reescritura humana, incidentes atribuibles a PRs de agente, costo por tarea, tiempo de Intake a merge, horas de revisión por PR.

## Decisiones

| | Tema | Estado | Dirección |
|---|---|---|---|
| A | **Gate de merge** | **Camino feliz probado (24/10)**; faltan 2 casos | El veredicto de la review sale como comentario (limitación del token en Mastra 0.24) y el CI de CC avisa pero no bloquea. Propuesta: check obligatorio `factory-verdict` (Action que pasa solo con `Verdict: approve` sobre el head actual) + que los checks bloqueen de verdad. Se prueba en `factory-sandbox` público; ver "Decisión del 24/10" |
| B | **Plane ↔ Factory** | **Decidida (24/10)** | Ambos workspaces en Free (sin integración nativa). Plane decide el qué y el si (triage de producto); GitHub el cómo (triage técnico y todo lo demás). Puente con dos skills del kit corridas por Claude Code. Ver "Decisión B" |
| C | **Sentry** | **Decidida (24/10)** | Solo `apps/agent` de CC, plan Developer (gratis), una organización de Sentry por producto, región US, privacidad de entrada, alertas mínimas. Ver "Decisión C" |
| D | **Railway dentro del gate** | **Decidida (24/10)** | Autodeploy desde GitHub con *Wait for CI*, junto con REQUEST-9 (Config as Code). Ver "Decisión D" |
| E | **Infraestructura de la SF** | Confirmada | Droplet dedicado, Postgres en el Droplet, sin Redis, túnel con nombre, `unattended-upgrades`. **E2B como gate duro** antes de instalar la App en cualquier repo de producto |

## Decisión C (24/10): Sentry

**Alcance:** solo `apps/agent` de CC (Railway; NestJS + Mastra + AI SDK v6). Las apps Next.js en Cloudflare (OpenNext) después, previa verificación del soporte de Sentry en Workers.
Es un **ítem de CC, por el flujo de CC** (toca el runtime: DoD completa con gate de regresión); se encadena después de D/REQUEST-9.

| Tema | Decisión |
|---|---|
| Plan y cuentas | Developer (gratis): 1 usuario (Juan Carlos; Nicole es producto), 5.000 errores y 5M spans/mes. **Una organización de Sentry por producto** (CC ahora, Agenttia después): se entrega con el producto |
| Región | **US** |
| Qué se mide | Errores + trazas con muestreo (arranque ~20%) + agent tracing (modelo, tokens, latencia, tools) → costo por cliente y por agente |
| Privacidad | `recordInputs`/`recordOutputs` en `false`, `sendDefaultPii: false`, `beforeSend` que limpia teléfonos y texto de mensajes. A Sentry van tiempos, tokens, errores e IDs, **nunca contenido de conversaciones** (pacientes de clínicas) |
| Releases | `release` = SHA del commit que expone Railway en el deploy; con D, cada deploy viene de un commit que pasó CI |
| Protecciones | Spike protection por proyecto. Alertas solo por **issue nuevo** y **regresión** (no por evento), con intervalo por issue (p. ej., una vez cada 24 h); agrupar el ruido con fingerprints; filtros de entrada para errores conocidos; *archivar hasta que escale* lo que no se va a atender ya |
| Seer | Fuera (exige plan pago, USD 40/mes por contribuidor activo) |

**De Sentry al Intake (puente de B):**
- **Ahora:** las alertas llegan al correo con una etiqueta de Gmail (`sentry`). Una skill del kit, `sentry-to-plane`, la corre Claude Code a pedido:
  lee los correos etiquetados (MCP de Gmail), trae el detalle del issue (MCP de Sentry) y **propone** cada ítem de Intake en Request; se crea solo con OK.
  Mismo patrón que `plane-to-factory` / `factory-to-plane`: sin servicio nuevo.
- **Si el volumen lo pide:** webhook de una *Internal Integration* de Sentry → Cloudflare Worker → API de Plane (`intake create`). Más robusto que leer correos,
  pero es un módulo: solo con volumen real. Crear ítems de Intake sin persona en medio arriesga llenar el Intake de ruido.

## Decisión D (24/10): Railway dentro del gate

**Problema:** el runtime de agentes de CC se despliega con `railway up` desde la CLI, sin pasar por el CI (ADR 037). Es el camino a producción con menos control.

**Decisión:** autodeploy desde GitHub con ***Wait for CI***: Railway espera a que terminen los workflows de GitHub Actions del commit
y **se salta el deploy si alguno falla** (o si no terminan en 2 h). Producción ← `master`; `cc-agent` (staging) ← `cc-stage`.
[Docs](https://docs.railway.com/deployments/github-autodeploys.md)

- **No depende del plan de GitHub:** aunque CC siga en `alephart` Free sin protección de rama, nada llega a Railway sin CI en verde.
- **Requisito:** el workflow de CI debe tener `on: push` con la rama que se despliega (hoy corre en PRs).
- **Lo que no cubre:** `railway up` sigue funcionando → regla: CLI solo para emergencias, documentadas en el runbook.
  Un push directo a `master` no tiene review (eso lo da el Pro personal). Migraciones: siguen antes del merge (DoD), no se confían a *Wait for CI*.

**Junto con REQUEST-9:** Config as Code está deprecado; `railway.json`/`railway.toml` funcionan hasta el **2026-12-01** (corte duro) y el reemplazo es
Infrastructure as Code (`.railway/railway.ts`). [Docs](https://docs.railway.com/config-as-code.md). Un solo ítem de CC, **por el flujo de CC, no por la Factory**:
1. Migrar la configuración a `.railway/railway.ts`.
2. Autodeploy con *Wait for CI* en staging (`cc-stage` → `cc-agent`), probado con un PR real.
3. Igual en producción; regla de la CLI en `docs/ENVIRONMENTS.md` y ADR.

## Requisito de seguridad: en quién confían las skills (24/10)

**Qué ya hace Mastra** (verificado en `@mastra/factory@0.24.0`, `integrations/platform/github/event-worker.js` y `integrations/github/rules.js`):
un comentario **solo despierta a la Factory** si su autor tiene permiso `write`, `maintain` o `admin` en el repo; los bots se ignoran salvo una lista explícita.
Un desconocido en un repo público **no puede disparar** triage, build ni feedback al builder.

**Lo que queda abierto:** nuestras skills (`factory-triage`, `factory-plan`, `factory-plan-review`) **leen todo el hilo del issue** y tratan los comentarios
humanos como respuestas que mandan sobre los supuestos. Un comentario de cualquiera queda en el hilo y entra al contexto cuando una persona de confianza
mueve la tarjeta (inyección por texto, no por disparo).

**Requisito:** las skills solo cuentan como respuesta humana los comentarios de autores con `write`/`maintain`/`admin` o de una lista explícita
(por ejemplo, Nicole con rol *Triage*, que Mastra no cuenta como disparador). El resto se ignora y se menciona. Cambio en las skills, **no un módulo**.
Mientras tanto, en `factory-sandbox` (público): *Interaction limits* → solo colaboradores.

**Plane no es el resguardo para esto:** en un repo privado solo comentan los colaboradores, igual que en Plane solo los miembros. Un módulo Plane ↔ Mastra
se justificaría por otras razones (que la conversación con producto o clientes viva en Plane, o volumen), no por seguridad.

## Decisión B (24/10): Plane ↔ Factory

**Principio:** cada decisión se escribe donde la lee quien la va a usar. Plane decide el **qué** y el **si**; GitHub, el **cómo**.
No se duplican textos: GitHub guarda el detalle y Plane la bitácora (resúmenes).

**Flujo**
1. Entra al Intake de Plane (SANDBOX, Request en CC, Inbox en Agenttia).
2. **Triage de producto en Plane** (liviano): ¿es real y tiene evidencia? ¿duplicado o ya resuelto? ¿lo queremos? ¿ahora o después? ¿a qué proyecto?
   → rechazar, posponer, marcar duplicado o aceptar (estados nativos del Intake).
3. **Si se acepta: ¿va a la Factory?** Label `destino:*`:
   - `destino:factory`: cumple los criterios (abajo) → `plane-to-factory` crea el issue en GitHub y deja el enlace en Plane.
   - `destino:persona`: lo hace alguien a mano en su proyecto, con la plantilla de [[triage]] completa, como hasta ahora.
   - `destino:decision`: falta una decisión de diseño (ADR o discusión); al resolverse pasa a uno de los dos anteriores.
   El motivo de un "no va a la Factory" va en un comentario, no en labels.
4. **En GitHub, todo lo técnico:** `factory-triage`, preguntas y **respuestas humanas en el issue** (tuyas o de Nicole), plan, revisión, build, review, merge.
5. **Plane recibe dos resúmenes** (`factory-to-plane`): el del triage técnico (decisión, puntos, enlace) y el cierre al merge.
6. Los "Para registrar en el Intake" vuelven al Intake de Plane.

**Criterios de `destino:factory`** (todos): cambio de código en un repo con la Factory instalada (hoy `factory-sandbox`; después Agenttia;
CC no hasta tener gate); verificable con pruebas o suite de regresión; no es un hotfix urgente de producción; alcance ≤ ~8 puntos (si no, partir antes).
**No va:** contenido de conocimiento, prompts en el admin, configuración, trato con el cliente, decisiones de diseño grandes.

**División de los triages:** en Plane, triage de producto en pocas líneas (+ `destino:*`); en GitHub, el técnico completo (`factory-triage`).
La plantilla [[triage]] v0.5 completa queda para lo que no va a la Factory. Evita hacer dos veces el mismo diagnóstico.

**Skills del puente** (en `kit/` de `software-factory`; las corre Claude Code a pedido de una persona, nada se escribe sin OK):
- `plane-to-factory`: ítem aceptado con `destino:factory` → issue en GitHub con el ID de Plane en el cuerpo y label `origen:plane`; enlace de vuelta en Plane.
- `factory-to-plane`: resumen del triage técnico y cierre al merge en Plane ([[comentario-por-fase]]); propone cada "Para registrar en el Intake" como `intake create`, uno por uno.
- **Prioridad baja:** registrar un hallazgo a mano tomó < 2 min (ejercicio del 24/10). El riesgo es el olvido, no el tiempo:
  primero una línea en la [[definition-of-done]] ("los 'Para registrar en el Intake' del PR quedaron registrados o descartados con motivo").

**Labels y nombres** (regla de idioma: nombres de recursos en inglés; contenido y labels en español con `clave:valor`):

| Dónde | Label | Uso |
|---|---|---|
| Plane | `destino:factory`, `destino:persona`, `destino:decision` | Decisión del triage de producto. **Son por proyecto:** crearlos en SANDBOX, Request (CC) e Inbox (Agenttia) |
| GitHub | `origen:plane` | Issue nacido de Plane (a esos se les avisa al cerrar) |
| GitHub | `plan:aprobado` | Ya existe; lo exige el tablero (se queda: está en `work-board.ts` y en dos skills) |
| GitHub | `status:auto-approved`, `status:changes-requested`, `status: auto-triaged` | Los impone Mastra: excepción en inglés, no se renombran |

**Otras decisiones:**
- Proyecto **SANDBOX** en Plane (workspace `agenttia`) para los ítems de `factory-sandbox`; no se ensucia el backlog real.
- **Nicole como colaboradora** del repo para responder en el issue las preguntas que son decisiones de producto (no consume asiento). Sus decisiones quedan con su nombre.

**Reconsiderar** Plane Pro o un webhook en factory-server solo si el volumen pasa de ~5 ítems/semana o el puente toma tiempo real.
Pro no lo resuelve todo: una organización por workspace y comentarios atribuidos al bot.

## Prueba del gate `factory-verdict` (24/10)

**Montaje:** `factory-sandbox` público (escaneo previo con gitleaks: historial limpio; 51 issues/PRs/comentarios revisados sin datos
sensibles), workflow `.github/workflows/factory-verdict.yml` (PR #13), variable `FACTORY_BOT_LOGIN=agenttic-factory-dev[bot]`,
ruleset `main protegido` (check `factory-verdict` obligatorio, sin bypass, rama al día, sin force push) y etiquetas `status:*`.

**Recorrido:** issue #14 "formatCOP no valida el tipo" (hallazgo del PR #12 que nunca se había registrado) → triage → decisiones
humanas en el issue (lanzar `TypeError`, no aceptar strings numéricos) → plan → plan-review → build → PR #15 → review → merge.

| Momento | Resultado |
|---|---|
| PR #13 (abierto por una persona) | ✅ "PR humano: no aplica" |
| PR #15 recién abierto | ⏳ *pending* "esperando la review de la Factory sobre c6ab5d2", *Required*; **botón de merge deshabilitado** |
| Review publica `Verdict: approve` + `Reviewed head: c6ab5d2` (14:45:12 UTC) | ✅ a los 8 s: "approve sobre c6ab5d2 (0 ronda(s) de cambios)"; PR `clean`, merge habilitado |
| Merge | Hecho. La tarjeta pasó **sola** a Done (el ruleset y el repo público no afectan la sincronización) |

**Conclusión:** la regla de proceso "merge solo con `Verdict: approve` sobre el último head" ya es un gate de máquina, sin esperar
a que Mastra resuelva el token de revisión separado. El revisor detectó el check por su cuenta ("check propio de la Factory").

**Pendiente de probar (no olvidar):**
- [ ] *Request changes* → check en rojo; a las 2 rondas, "escalar a una persona". Aún no vimos el formato real de ese comentario: es el punto con más riesgo.
- [ ] Commit nuevo después de un *approve* → el check vuelve a *pending* con el SHA nuevo.
- [ ] Renombrar el job del workflow (hoy "factory-verdict / verdict") a `publicar-estado`, para que no se confunda con el estado obligatorio.
- [ ] Al llevarlo a productos: el repo debe tener plan que permita rulesets (Team en `Alephart-Co` para Agenttia; Pro personal para CC).

**Hallazgos del recorrido para el Intake:** notación exponencial en `formatCOP` (`1e21` → `'$1e+21'`), registrado a mano por Juan Carlos
(práctica del puente de la decisión B).

## Decisión del 24/10: cuentas de GitHub

| Cuenta | Qué vive ahí | Plan |
|---|---|---|
| `alephart` (personal) | `conversion-platform` (CC), **sin transferir** | Free por ahora |
| `Alephart-Co` (organización) | La fábrica (`factory-server`, `factory-sandbox`) y **Agenttia** | Team cuando el repo de Agenttia reciba PRs de la Factory (después de E2B) |

- **Por qué:** CC no se mueve (principio de entrega intacto, sin reconectar Cloudflare). Mapeo limpio con Plane si algún día hay Pro:
  `Alephart-Co` ↔ workspace `agenttia`, `alephart` ↔ workspace `conversion-chat`.
- **El gate se prueba en `factory-sandbox` público** (rulesets gratis en repos públicos), previo escaneo de secretos del historial.
- **Consecuencia aceptada:** CC sigue sin gate que bloquee (CI solo avisa). **La Factory no entra a CC** hasta que exista ese gate
  (Pro personal, ~USD 4/mes) y la App esté en *Any account* (runbook, "Fase 4").
- Agenttia comparte organización con la fábrica: secretos solo a nivel de repo, nada que dependa de la organización, y al entregarlo se transfiere el repo.

## Lo que se descartó en la investigación (y por qué)

- **Factory en Railway con Postgres de Railway:** el sandbox corre builds dentro del contenedor (se pagaría por uso) y la cuenta de Railway tiene el runtime de CC en producción, lo que rompe "cero credenciales de producción en la Factory".
- **Executor en GitHub Actions:** Mastra Factory ejecuta en su propio sandbox (local, luego E2B); no aplica.
- **Triage Agent nativo de Plane:** exige Pro y da 100 créditos de agente por asiento/mes (~20–40 por corrida). Ya tenemos `factory-triage`.
- **Supabase para la SF:** ver [[factory-server]] (decisión del 23/10).
- **R2:** buena opción de almacenamiento (egress gratis, ya estamos en Cloudflare), pero sin necesidad concreta todavía.

## Huecos abiertos que salieron de la revisión

- Ningún bloqueo técnico impide un merge sin `Verdict: approve` → A.
- La regla "solo Intake" choca con Plane: aceptar un ítem lo deja en el Backlog del mismo proyecto; el triage debe incluir moverlo al proyecto de módulo (REQUEST-1 y 10 quedaron en el Backlog de Request).
- Metadatos del intake (Línea, Tipo, Cliente/agente) en texto libre: ningún agente ni filtro los usa de forma fiable. Candidatos a etiquetas o propiedades.
- REQUEST-10 (EMA, alta) sin responsable; el congreso es el 27–28/11. Va por el flujo de CC, no por la Factory.
