# kit/agents

Agentes de Claude Code que la fábrica instala en los productos. Se **copian** a `.claude/agents/` del repo
del producto y desde ese momento son del producto: se editan allí y no dependen de este kit.

| Archivo | Versión | Para qué |
|---|---|---|
| `plan-reviewer-agent.md` | 0.3 | Revisa un plan antes de construir (etapa Planning). Solo lee. |
| `reviewer-agent.md` | 0.3 | Revisa el cambio terminado contra la spec (etapa Review). Solo lee. |
| `database-agent.md` | 0.2 | Builder de Supabase/PostgreSQL. |
| `builder-agent.template.md` | 0.1 | Plantilla para crear el builder de un área (runtime, admin, portal…). |

## Instalar en un producto

```bash
cp kit/agents/plan-reviewer-agent.md kit/agents/reviewer-agent.md <repo>/.claude/agents/
cp kit/agents/database-agent.md <repo>/.claude/agents/          # si usa Supabase
cp kit/agents/builder-agent.template.md <repo>/.claude/agents/<area>-agent.md   # y completar
```

Antes de hacer commit en el producto:

- Los agentes asumen que el repo tiene `AGENTS.md`, `docs/ENVIRONMENTS.md`, `docs/adr/` y `docs/tasks/`
  (esqueletos en `kit/docs/`).
- Ningún archivo copiado debe mencionar rutas del vault ni la fábrica.
- Se hace en un PR del producto, con su revisión normal.

## Actualizar una copia

Cada archivo lleva su **versión** y un **historial**. Para llevar una mejora a un producto:
comparar la versión instalada con la del kit, copiar o fusionar a mano y subir la versión en el historial del producto.
Un producto puede quedarse en una versión anterior: nada se rompe.

## Reglas comunes

- Los revisores solo leen. La aprobación del plan y el merge son humanos.
- Tracker (Plane): verificar el workspace antes de escribir; los hallazgos fuera de alcance van al **Intake**
  del proyecto de entrada (`intake create`), nunca como ítem de trabajo directo.
