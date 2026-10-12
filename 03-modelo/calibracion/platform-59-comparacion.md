---
tags: [calibracion, planning, agente]
creado: 2026-10-07
---

# Calibración 2 — revisión del plan de PLATFORM-59

Volver a [[agente-revisor-de-planes]] · Plan revisado: `platform-59-plan-v1.md` · Respuesta del agente: `platform-59-plan-reviewer-v1.md`

## Montaje

- **Plan:** lo escribió Claude Code (sonnet) el 07/10.
- **Revisión humana con IA consejera** (Claude, en el chat): 5 puntos principales y 4 menores, **antes** de correr el agente.
  No se le pasaron al agente.
- **Agente:** `plan-reviewer-agent` v0.1, opus, contexto limpio, 6 min 20 s, 46 herramientas, ~170k tokens.
  Recibió: plan, ítem de Plane textual, brief, D1–D5, sección del estado actual y el repo (`origin/master` + rama del #218).
- **Veredicto del agente:** AJUSTAR, con 5 bloqueantes, 11 ajustes y 7 notas (23 en total).
- **Veredicto consolidado:** AJUSTAR.

## Cruce de hallazgos

| Hallazgo | Humano + IA | Agente | Comentario |
|---|---|---|---|
| Admin público, sin Cloudflare Access | ✔ | ✔ #15 | Consolidado como bloqueante para el deploy del admin |
| El rol temporal de lectura es una escritura en prod; `read_only` se salta con `SET` | ✔ | ✔ #6 | — |
| El arnés local no iguala las variables de Railway | ✔ (genérico) | ✔ #10 (lista de variables) | El agente fue más preciso |
| El criterio 1 genera ruido / no se puede aplicar | ✔ (ruido de la `rag_query`) | ✔ #1, #20 | El agente dio otra razón (chunks legacy), pero esa razón era falsa: ver abajo |
| Falta el prompt de AGENT-37 antes de los escenarios con la tool | ✔ | ✘ | Escape del agente: lente **Trazabilidad entre ítems** |
| Orden de salida a prod (migración antes del merge) | ✔ | ~ #14 (flujo y hotfixes) | Escape parcial |
| REQUEST-3 no se cierra con una sola sección | ✔ | ~ #14 | — |
| `extractNumericClaims` no existe en master | ✘ | ✔ #2 | Solo se ve abriendo el código |
| Portal y agenda quedan fuera en silencio | ✘ | ✔ #3 | Trazabilidad contra el ítem: el humano no comparó con Plane |
| `db push` limpio ≠ equivalente a prod | ✘ | ✔ #5 | — |
| El endpoint `/shadow` sí existe | ✘ | ✔ #7 | Supuesto falso del plan |
| Cifras del system prompt cuentan como válidas | ✘ | ✔ #8 | — |
| El hash de config cambia con el seed | ✘ | ✔ #9 | — |
| G1 tiene que ir antes de las variables de Railway | ✘ | ✔ #11 | Bien la conclusión, mal la evidencia: ver abajo |
| Tools que dependen de datos no copiados | ✘ | ✔ #12 | — |
| Enmienda de ADR, wrapper de `railway up`, merge commit, FK de planes, `webhook_path`… | ✘ | ✔ #13, #16, #17, #19, #22, #23 | — |

**Resumen:** el agente encontró 3 de los 5 puntos principales del humano y unos 15 que el humano no vio.
El humano encontró 1 que el agente no vio (AGENT-37) y 1 parcial (salida a prod).

## Errores del agente (falsos o mal sustentados)

1. **#1 "conocimiento legacy" de Buitrago y Urea: falso.** Se apoyó en `migrate-knowledge.ts` (26/05) y en el contexto
   que le pasamos ("Urea puede tener configuración legacy"). En prod los documentos se rehicieron después de `ac525d3`
   (document_id, chunking por tipo) y se curaron a mano. Era un **supuesto, no un hallazgo**. Parte de la culpa es del
   prompt: el contexto que le dimos traía una afirmación vieja.
2. **#11 "Urea corre con `claude-sonnet-4-6`": falso para prod.** Lo sacó de la migración de seed de fase 0
   (`ON CONFLICT DO NOTHING`); en prod el agente usa `gpt-4.1-mini`. Aun así, la conclusión sirve: en cc-staging, Urea
   nace con el seed viejo y el import tiene que sobrescribirlo.
3. **Severidad del #4 (inventario):** marcado como bloqueante; la auditoría del 04/10 sí existió. Bajado a *ajusta*.

## Desvíos de sus reglas

- Escribió un archivo en `/tmp` (`git show … > /tmp/dbgen_master.ts`).
- Usó `git grep`, `grep` y `sed` por Bash, fuera de lo permitido.
- No corrió comandos remotos y no usó el razonamiento del plan como evidencia.

## Cambios que salen de esta calibración (agente v0.2)

| Cambio | Lente / sección |
|---|---|
| "Una migración de seed o un script viejo no es evidencia del estado de prod: repórtalo como supuesto" | Supuestos no verificados |
| "Afirmaciones del contexto que recibes (estado, notas) también se verifican; no son evidencia" | Principio |
| "Las dependencias con otros ítems abiertos (p. ej. un prompt de otro ítem que la prueba necesita) se listan" | Trazabilidad |
| "Si el plan llega a prod, debe decir el orden de salida: migración, merge, deploy, humo" | Operación |
| Lista cerrada de comandos de Bash permitidos (`git log/show/diff/status/grep/ls-tree`) y prohibido escribir en cualquier ruta, `/tmp` incluido | Reglas |
| El veredicto se guarda fuera del modo plan de Claude Code (en modo plan no puede escribir) | Flujo |

## Métricas

| Métrica | Valor |
|---|---|
| Hallazgos del agente | 23 (5 bloquea / 11 ajusta / 7 notas) |
| Falsos o mal sustentados | 2 (#1, #11) + 1 con severidad alta de más (#4) |
| Escapes del agente detectados por el humano | 1 completo (AGENT-37) + 1 parcial (salida a prod) |
| Hallazgos solo del agente | ~15 |
| Costo | 6 min 20 s, ~170k tokens |
