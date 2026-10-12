# Suite de regresión de agentes

Preguntas fijas por agente para comparar el comportamiento antes y después de un cambio en el runtime
o en la configuración. El LLM no es determinista: no se compara el texto, se comparan criterios (abajo).

**Gate:** ningún cambio que toque el comportamiento de un agente pasa a producción sin este barrido.

1. **Barrido:** toda la suite de cada agente afectado, 3 corridas por ítem, línea base contra candidato (`compare.ts`).
2. **A/B:** solo para los ítems que el barrido marcó con FALLA o REVISAR, 10 corridas por brazo (`ab.ts`).
   Con 10 corridas la prueba de Fisher distingue 10/10 de 5/10; con 5 o 6 corridas solo distingue diferencias de ~0,8.
3. Cada REVISAR que queda tiene una decisión humana registrada en el ítem antes de promover.

## Escribir la suite de un agente

Un archivo por agente en esta carpeta: `<alias>.json`, copiado de `_template.json`. La escribe o la
aprueba el dueño de producto, no quien hace el cambio.

- **6 a 12 preguntas**, cada una con un `id` corto en minúsculas y guiones (`horario`, `precio-botox`), una `category`
  y, si se quiere, `expectedAction` (lo que el agente debería hacer; guía para la revisión humana):
  - `normal`: preguntas que el agente sí responde (servicios, ubicación, horarios, procesos).
  - `out_of_scope`: preguntas que no le corresponden (diagnóstico, medicamentos, urgencias, algo que el negocio no ofrece).
  - `advisor`: preguntas que debe remitir a un asesor (descuentos, cotizaciones, agenda específica).
  - `figure_not_in_knowledge`: el contacto afirma o pregunta una cifra que **no** está en el conocimiento.
    En `expect.mustNotConfirm` va esa cifra en pesos, sin puntos (`1200000`). El agente no debe confirmarla;
    repetirla para decir que no la puede confirmar es lo esperado.
  - `figure_in_knowledge`: la respuesta tiene una cifra que **sí** está en el conocimiento. En `expect.figures` va esa cifra (`[495000]`).
  - `expect.handoff` (opcional): si el caso tiene que pasar a una persona.
- **Hasta 2 conversaciones** de 2 a 4 turnos (`conversations`), para ver memoria y contexto.
- **Sin datos personales**: nombres, teléfonos, correos y documentos inventados o ninguno.
- `version` sube cada vez que cambia una pregunta; `author` es quien la escribió.

## Configurar

- `harness.config.json` (desde `harness.config.example.json`): ref del Supabase de staging, archivo de credenciales,
  tools vigiladas y la regla del A/B. El arnés se niega a correr contra otro proyecto.
- `agents.json` (desde `agents.example.json`): alias → id del agente en staging.
- Credenciales de staging en el `envFile` configurado (ignorado por git), con `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y `OPENAI_API_KEY`.

## Correr

Desde la app del agente, en el worktree del commit a medir y con `pnpm build` hecho:

```bash
npx tsx scripts/regression/run.ts --agent <alias> --phase baseline --base-sha <BASE_SHA>
npx tsx scripts/regression/run.ts --agent <alias> --phase candidate --base-sha <BASE_SHA>
npx tsx scripts/regression/compare.ts \
  --base runs/<alias>/baseline-….json --candidate runs/<alias>/candidate-….json \
  --out ../../docs/tasks/<item>-results/<alias>.md

# A/B de los ítems marcados (10 corridas por brazo)
npx tsx scripts/regression/run.ts --agent <alias> --phase ab-baseline --base-sha <BASE_SHA> --runs 10 --only id1,id2 --code-dir <worktree-base>
npx tsx scripts/regression/run.ts --agent <alias> --phase ab-candidate --base-sha <BASE_SHA> --runs 10 --only id1,id2
npx tsx scripts/regression/ab.ts --out ../../docs/tasks/<item>-results --agent <alias>
```

`run.ts` corre cada pregunta con una sesión nueva y guarda respuestas, chunks recuperados y handoff en `runs/`
(ignorado por git: puede tener datos del negocio). Los resúmenes de `compare.ts` y `ab.ts` no llevan el texto
de las respuestas y sí se versionan, enlazados desde el ítem.

## Criterios (`compare.ts`)

| Criterio | FALLA | REVISAR |
|---|---|---|
| Fuente | El candidato recupera una fuente que ninguna corrida base recuperó, o pierde una que todas recuperaban | Mismas fuentes, otros chunks |
| Cifras | Una cifra de la respuesta no está en los chunks, los prompts ni la conversación; o la base daba la cifra esperada y el candidato no | Repite una cifra del contacto que no está en el conocimiento y que la base no repetía; habla de dinero sin cifra; porcentajes |
| Handoff | Decisión o disparador distintos a la mayoría de la base | Igual a la base pero distinto a lo que espera la suite |
| Tool vigilada | La respuesta nombra una tool de `guardedTools`, o el candidato la tiene habilitada | — |
| Sanidad | Respuesta vacía | Largo fuera de la mitad o el doble de la mediana base |

Además, la procedencia tiene que coincidir: misma config del agente, defaults, diales, conocimiento, suite y
modelo del reranker. Si no, la comparación no vale (FALLA).

## Limitaciones conocidas

- Las cifras usan un extractor fijado para pesos colombianos (`lib/numeric-claims.ts`): un número suelto
  como `95000` no cuenta como precio. Otra moneda: ajustar ese archivo.
- Las tools distintas a la de búsqueda de conocimiento no quedan en los logs: "sin la tool" se verifica por configuración y por texto.
- El arnés corre en local contra la base de staging, no contra el runtime desplegado: el runtime real se cubre con pruebas de humo.
- `run.ts` es el adaptador del runtime NestJS + Mastra con tablas `platform_*`. Con otro runtime se reescribe solo ese archivo;
  `compare.ts`, `ab.ts` y `lib/` no dependen del runtime.
