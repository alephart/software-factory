---
tags: [modelo, agente, planning, nivel-2]
version: 0.1
creado: 2026-10-05
estado: diseño
---

# Agente revisor de planes (etapa Planning)

Volver a [[README]] · Relacionado: [[flujo-planning-a-done]] · Agente hermano: `reviewer-agent` (etapa Review)

> **Propósito:** revisar el plan de un builder **antes de escribir código** y detectar lo que hoy
> detecta un humano a ojo: convenciones rotas, lógica de un cliente filtrada a la plataforma,
> condiciones de triage revertidas sin registro, supuestos no verificados y huecos de operación.
> **Regla:** revisa y reporta; no reescribe el plan. La aprobación del plan sigue siendo humana.

---

## Por qué existe

En el planning de AGENT-38 (05/10/2026), todos los problemas importantes del plan los encontró
una revisión humana con IA consejera, no el builder ni el `reviewer-agent`:

| # | Hallazgo | Lente |
|---|---|---|
| 1 | Nombres en español (`consultar_precio`, `actualizado_en`) en un repo con ids y campos en inglés. El error venía del ADR y del brief, y pasó por dos documentos sin que nadie lo notara | Convenciones |
| 2 | `parseProductRef` con formatos de URL de un cliente dentro de `apps/agent` | Frontera plataforma/cliente |
| 3 | Se eliminó el corte de 14 días, que revertía una condición del triage ("un precio incorrecto es peor que no dar precio") | Trazabilidad |
| 4 | El guard de anomalía no tenía salida: un cambio legítimo del cliente bloqueaba todas las sincronizaciones siguientes | Operación |
| 5 | El parser de cifras no contemplaba los formatos reales de COP (`$95.000`, `$ 95,000`, `95 mil`) | Datos del mundo real |
| 6 | Una cifra válida de otro producto podía "verificar" una atribución equivocada | Datos del mundo real |
| 7 | Se suponía que hacía falta Playwright; el sitio renderiza los precios en el servidor | Supuestos no verificados |
| 8 | Lo que quedó fuera de alcance (alertas, sensibilidad del handoff) no tenía ítem en Request | Alcance |
| 9 | Secreto de ingesta compartido entre conectores | Seguridad y tenancy |

Ninguno era un bug de código: eran **defectos de diseño**. El `reviewer-agent` los habría visto
tarde (en review, con el código ya escrito) o nunca, porque revisa el código **contra** el plan.
Si el plan está mal, el código "cumple".

## Dónde va en el flujo

```
Triage → [ADR] → Brief → Plan del builder → ▶ revisor de planes → gate humano → Building → reviewer-agent → merge
```

- Corre **una vez por plan**, y otra vez si el plan cambia de forma sustancial.
- Su veredicto se adjunta como comentario en el ítem de Plane, igual que el del `reviewer-agent`.
- El humano aprueba el plan **con el veredicto a la vista**.

## Principio: revisión independiente

- Revisa contra **fuentes**, no contra la intención del planner: el ítem de Plane (con las
  condiciones de triage), el ADR, el brief, `AGENTS.md`, `docs/AGENT_BEHAVIOR_LAYERS.md` y el
  **código existente**.
- No usa el razonamiento del plan como evidencia. Si el plan dice "siguiendo el patrón de X", lo
  verifica abriendo X.
- Cada hallazgo cita su evidencia: archivo:línea, documento o ítem.

## Lentes de revisión (checklist v0.1)

1. **Trazabilidad**
   - Cada condición del ítem de triage está cubierta, o cambiada **explícitamente**, con su razón registrada en el ítem y en el ADR.
   - Cada decisión nueva del plan quedó reflejada en el ADR (enmienda fechada) y en el brief.
2. **Convenciones del repo**
   - Para cada nombre nuevo (tool, campo, tabla, módulo, archivo), compara con **al menos dos ejemplos existentes** y cítalos.
   - Revisa idioma, formato (snake_case o camelCase), prefijos de tablas y estructura de carpetas.
3. **Frontera plataforma / cliente**
   - En el código compartido no hay nada específico de un cliente: URLs, formatos, reglas, nombres.
   - Prueba mental: si mañana llega un segundo cliente, ¿hay que tocar código de plataforma?
4. **Datos del mundo real**
   - Formatos reales de entrada: moneda, números, fechas, idioma, URLs.
   - Casos borde: vacío, duplicado, ambiguo, coincidencia parcial frente a exacta.
5. **Operación**
   - Dónde se prueba **de verdad**: ¿el entorno existe?
   - Orden de migraciones y `--dry-run`.
   - Rollback.
   - Guards con salida de emergencia.
   - Observabilidad: ¿cómo se entera el equipo si algo falla?
6. **Seguridad y tenancy**
   - Secretos compartidos.
   - RLS y aislamiento entre clientes.
   - Endpoints que escriben datos de un cliente.
7. **Alcance**
   - Lo que queda fuera tiene ítem en Request.
   - Nada fuera de alcance se cuela en las tareas.
8. **Supuestos no verificados**
   - Lista lo que el plan da por hecho sin evidencia: "requiere navegador", "el endpoint existe", "la tabla tiene esa columna".
   - Para cada supuesto, cómo verificarlo o si ya se verificó.

## Formato de respuesta

```
## Veredicto: APROBAR | AJUSTAR | REPLANTEAR

### Hallazgos
| # | Lente | Hallazgo | Evidencia | Severidad (bloquea / ajusta / nota) |

### Supuestos no verificados
- supuesto → cómo verificarlo

### Preguntas para el humano
- decisiones que el plan no puede tomar solo

### Ítems a registrar en Request
- lo que quedó fuera de alcance y no tiene ítem
```

- **APROBAR:** sin bloqueantes.
- **AJUSTAR:** hay bloqueantes que se corrigen dentro del plan.
- **REPLANTEAR:** el enfoque contradice el ADR o una condición de triage sin justificación.

## Implementación

- **Fase 1:** subagente de Claude Code, `.claude/agents/plan-reviewer-agent.md`.
  - Herramientas de solo lectura: Read, Grep y Glob. Bash solo para una lista cerrada de comandos `git` de lectura; no escribe en ninguna ruta.
  - Modelo distinto al del builder que escribió el plan (en PLATFORM-59: plan con sonnet, revisión con opus).
  - El veredicto se guarda **fuera del modo plan** de Claude Code: en modo plan no puede escribir archivos.
  - Se invoca a mano después de que el builder presenta su plan.
- **Fase 2:** gate de la etapa Planning en el harness de Mastra. El plan no pasa a building sin veredicto.
- **Costo:** una corrida por plan, sobre documentos y fragmentos de código. Es barato comparado con una vuelta de building.

## Calibración y mejora

- **Calibración 2 (07/10, PLATFORM-59):** ver [[platform-59-comparacion]]. El agente encontró 3 de los 5 puntos del humano y ~15 que el humano no vio; tuvo 2 hallazgos falsos (tomó un seed y un script viejo como estado de prod) y se le escapó una dependencia con otro ítem (el prompt de AGENT-37).
- **Conjunto de evaluación inicial:** el plan original de AGENT-38, antes de los ajustes. El agente debería encontrar la mayoría de los 9 hallazgos de la tabla. Lo que no encuentre muestra qué lente hay que reforzar.
- **Bucle de aprendizaje:** cada defecto que se le escape y aparezca después (en review, en producción o lo detecte un humano) se convierte en una regla nueva de la lente correspondiente, y la checklist sube de versión.
- **Métricas:**
  - hallazgos por plan y por lente;
  - hallazgos que escaparon a etapas posteriores;
  - proporción de veredictos AJUSTAR o REPLANTEAR.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-05 | Diseño inicial a partir de los hallazgos del planning de AGENT-38 |
| 0.2 | 2026-10-07 | Calibración con PLATFORM-59: reglas nuevas en Supuestos, Trazabilidad y Operación; comandos permitidos |
