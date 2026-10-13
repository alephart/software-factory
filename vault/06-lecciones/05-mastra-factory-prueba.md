---
tags: [leccion, herramientas, mastra, nivel-4]
creado: 2026-10-12
estado: en curso
item: FACTORY-10
---

# Prueba de Mastra Factory (12/10)

Volver a [[README]] · Relacionado: [[flujo-planning-a-done]] · [[escalera-de-madurez]]

## Qué queríamos saber

Si Mastra Factory (beta del 08/09/2026, Apache-2.0) sirve como tablero y orquestador de la fábrica (nivel 4),
en lugar de construir uno propio. Su tablero es casi nuestro flujo: Intake → Triage → Planning → Build → Review → Done,
con gates humanos (arrancar tarjeta, aceptar tarea, aprobar plan, merge).

## Lo que sí sabemos (leyendo el código)

- **Ajustable:** las integraciones implementan una interfaz común (`FactoryIntegration`); hay GitHub, GitLab, Linear,
  Jira, Slack e incident.io. **Plane no existe**, pero se escribe tomando Linear como molde.
- **Tablero en código:** `defineBoard` y skills por etapa (`factory-triage`, `factory-plan`, `factory-review`…).
- **Agente constructor:** MastraCode, propio de Mastra. Lee archivos de proyecto de Claude Code (skills, `.mcp.json`),
  pero **no es Claude Code**.
- **Dependencia fuerte de la plataforma de Mastra:** login, base de datos (Neon), Redis, sandboxes y la
  conexión con GitHub pasan por `platform.mastra.ai` salvo que se autoaloje todo (GitHub App propia, WorkOS, E2B…).

## Lo que pasó (≈4 h, sin ver el tablero)

1. **Local (`npm run dev`):** la Factory arrancó, pero no reconoció la instalación de GitHub.
   Un corte de red pasajero (`ENOTFOUND`/`ETIMEDOUT` a Neon) confundió el diagnóstico al inicio.
2. Al repetir con la red estable, GitHub devolvió la instalación (`installation_id=170796061`, `setup_action=install`),
   pero `GET /web/github/status` respondió `installations: []`, `reason: not_connected`.
   Organización del `.env` = organización de la sesión (`org_01KX4N…`): no era un cruce de organizaciones.
3. **Nube (`pnpm run deploy`, proyecto `my-factory`):** despliegue correcto (Neon + Redis gestionados).
   El mismo bucle: Connect GitHub → página de configuración de la App en GitHub → no regresa.
4. Ruido propio que sumó: tres instalaciones (`mastra-factory-tes`, `mastra-factory-test`, `my-factory`),
   cada una con su proyecto y su base de datos; la plataforma no permite borrar proyectos.

**Conclusión:** la falla está del lado de la plataforma de Mastra (la instalación de GitHub no queda
"usable" para la organización). No depende de nuestra red ni de nuestra configuración.

**Confirmado (21:37):** es el bug abierto [mastra-ai/mastra#26655](https://github.com/mastra-ai/mastra/issues/26655)
(11/10, impacto alto; PR #26661 abierto). Una App instalada en una **cuenta personal** de GitHub queda ligada a la sesión
del usuario y no a la llave de organización que usa la Factory. **Instalarla en una organización de GitHub sí funciona.**
Salida aplicada (21:54): `factory-sandbox` transferido a la organización `alephart-co`; la Factory ya conecta y muestra el tablero.

## Decisión (provisional)

- **Seguir con la salida:** App instalada en una organización de GitHub de pruebas. Seguir #26655 para cuando lo arreglen.
- La idea sigue en pie: tablero + gates + skills por etapa es lo que queremos para el nivel 4.
  Antes de adoptarlo hay que resolver tres cosas: Plane (integración propia), Claude Code como constructor
  y la dependencia de la plataforma (o autoalojar).
- Mientras tanto, la fábrica sigue con Claude Code + Plane + kit.

## Lecciones para la fábrica

- **Ponerle límite de tiempo a una prueba antes de empezar** (aquí: 2 puntos) y cortarla cuando se pasa, con nota.
- **Una sola instalación por prueba.** Reinstalar sin limpiar multiplicó proyectos y bases de datos y confundió el diagnóstico.
- **Leer el código y las rutas de estado** (`/web/github/status`) acortó el diagnóstico más que la documentación.
- **Nunca pegar un `.env` en el chat**; basta el nombre del host o de las variables.

## Pendiente de limpieza

- Proyectos `mastra-factory-tes`, `mastra-factory-test` y `my-factory` en la plataforma (inactivos, plan Starter).
- GitHub App "Mastra Platform" con acceso a `factory-sandbox` y `my-factory`: desinstalar si se descarta.
- Repos `alephart/factory-sandbox` y `alephart/my-factory`: archivar al cerrar FACTORY-10.

## Recorrido del issue #1 (12/10, 22:00) — Triage y Planning

Tiempo: ~2,5 min de Intake a plan listo. Modelo: Claude Haiku 5.5 (~14k tokens hasta el plan).

| Hizo | Frente a nuestro flujo |
|---|---|
| Reprodujo el bug antes de opinar (corrió la prueba) | Igual o mejor que nuestro triage: verifica en vez de suponer |
| Detectó el duplicado #4 y recomendó cerrarlo | Lo que pide la puerta única; lo hizo solo |
| Severidad, confianza, esfuerzo e impacto, publicados como comentario en el issue de GitHub | Equivale al comentario por fase + estimación (en GitHub, no en Plane) |
| Creó etiquetas en el repo sin preguntar | Contra nuestra regla de no crear sin permiso; ojo en repos reales |
| Pasó de Triage a Planning sin aprobación (por ser bug) | Nuestro triage siempre lo aprueba una persona |
| Plan con cambio, prueba, verificación por casos y **fuera de alcance** | Muy parecido a nuestra plantilla de plan |
| Se detuvo: "auto-aprobado de planes desactivado" | El gate humano del plan funciona |

**Falta frente a la fábrica:** no hubo revisión independiente del plan (el mismo agente investiga y planea; no hay plan-reviewer con otro modelo).

## Build → Review (22:12–22:13)

- Aprobación del plan = botón **Build** en la tarjeta (nombre poco claro: no dice "aprobar"). Antes de aprobar se puede
  pedir ajustes al plan por chat ("Ask Mastra Code…"), equivalente conversado al AJUSTAR del plan-reviewer.
- Proveedor y modelo los elige el humano en settings (aquí: Anthropic, Claude Haiku 5.5).
- Build en ~1 min: **guardias de repo** antes de editar, antes del push y antes del PR (patrón que no tenemos escrito en
  nuestros builders); cambio y prueba según plan; suite 2/2 + reproducción manual; rama `factory/issue-1`; PR #5 sin el
  archivo del plan; pasó solo a Review y asignó la revisión al humano. Dejó pendientes explícitos (cerrar #4; plan sin versionar).
- Gasto de todo el recorrido: ~17,5k tokens de Haiku.
- Por ver: si `factory-review` revisa el PR en una sesión independiente, y si el merge mueve la tarjeta a Done.

## Review (22:13–22:22)

- **Revisión independiente:** sesión aparte ("Review sessions"), no la del builder. Equivale a nuestro reviewer-agent.
- **Primera vuelta: cambios necesarios.** Bloqueante real: con decimales (`formatCOP(1200.5)`) la expresión agrupaba también
  la parte decimal y daba un monto engañoso; además la descripción del PR afirmaba algo falso ("sin decimales").
  El plan había dejado decimales fuera de alcance, pero el revisor vio que el cambio los empeoraba.
- **Corrección y segunda vuelta: aprobado**, con prueba de decimales agregada. El ciclo cambios → corrección → re-revisión
  ocurrió sin intervención humana.
- **Costo:** ~15–20 min en las dos vueltas (mucho más que construir).

## Conclusión preliminar (a confirmar tras el merge)

El flujo de Mastra Factory coincide casi uno a uno con el nuestro y aporta lo que nos falta automatizar:
tablero visible, gates configurables, guardias de repo, revisión independiente con ciclo de corrección.
Lo que habría que adaptar: integración con Plane, reglas propias (no crear etiquetas ni pasar triage sin aprobación),
revisión independiente del plan y la dependencia de la plataforma (bug #26655: solo funciona con organizaciones de GitHub).
