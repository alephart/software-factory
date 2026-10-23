# AGENTS.md — software-factory

**Qué es:** la fábrica de software de Agenttic. **Una forma de trabajar, no una dependencia:** define cómo pasa un pedido de la
idea a producción (intake → triage → planning → building → review → salida) y entrega a cada producto las piezas para trabajar así.
**Contenido:** `vault/` (conocimiento de la fábrica, Obsidian, en español) y `kit/` (lo que se copia a los productos).
**Productos:** Conversion Chat (`alephart/conversion-platform`, piloto) y Agenttia (core, por crear). Servidor de agentes de la
fábrica: `Alephart-Co/factory-server`.

**Al empezar una sesión:** leer `vault/00-estado-actual.md` (traspaso entre sesiones) y `vault/README.md` (mapa del vault).
**Al cerrar una sesión:** actualizar `vault/00-estado-actual.md` con lo que avanzó, lo pendiente y cómo retomar.

---

## Glosario

| Término | Significado |
|---|---|
| **Puerta única** | Todo pedido entra por el Intake: proyecto **Request** (Conversion Chat) o **Inbox** (Agenttia) en Plane |
| **Triage** | Diagnostica y decide (causa raíz, prioridad, puntos Fibonacci); no diseña la solución |
| **Gate** | Punto de aprobación humana (plan, merge, salida a prod) |
| **Kit** | Piezas que se copian a un producto y pasan a ser suyas (agentes, CI, arnés de regresión, esqueletos de docs) |
| **Factory** | Mastra Factory con las skills de la fábrica (`factory-server`); hoy solo con repos de prueba |

## Estructura

```
vault/
├── 00-estado-actual.md   traspaso entre sesiones: leer primero, actualizar al cerrar
├── README.md             mapa del vault, tesis y línea de tiempo
├── 01-investigacion/     02-diagnostico/   03-modelo/ (+ calibracion/)
├── 04-plantillas/        intake, triage, DoD, runbook, comentario por fase, agentes
├── 05-articulo/          artículo público: anonimizado
└── 06-lecciones/         lecciones numeradas, una por caso o prueba
kit/
├── agents/   ci/   harness/   docs/
experiments/              pruebas sueltas (no son kit ni vault)
```

## Reglas del vault

- **Español** para el contenido; enlaces estilo Obsidian `[[nota]]`; cada nota con frontmatter (`tags`, `creado`, `actualizado`,
  `estado`, y `item` si corresponde a un ítem de Plane).
- **El vault guarda conocimiento de la fábrica, no artefactos de producto.** La excepción es el material de calibración
  (`03-modelo/calibracion/`). Los planes, ADR y briefs de un producto viven en el repo del producto.
- **Plantillas versionadas:** cada ajuste sube la `version` del frontmatter y agrega una fila al historial de la plantilla.
- **`05-articulo/`:** nada de nombres de clientes, empresas, claves, IDs de proyectos ni URLs internas.
- **Lecciones:** numeradas (`06-lecciones/0N-nombre.md`) y enlazadas desde `vault/README.md`.
- **Fuente de verdad:** Plane (comentarios por fase) y el repo de cada producto. El vault resume; no duplica.
- No versionar el estado de la ventana de Obsidian (`.obsidian/workspace.json`).

## Reglas del kit

- **Copiar, no enlazar.** Una pieza se copia al repo del producto y desde ahí es del producto. Nada de submódulos ni paquetes.
- **Genérico:** sin nombres de producto, de clientes ni rutas al vault o a este repo.
- **Versión e historial** en cada pieza; un producto puede quedarse en una versión anterior.
- **El producto se explica solo:** lo que se copia trae su propia documentación.

## Plane

| Workspace | Acceso | Proyectos |
|---|---|---|
| `conversion-chat` | conector `Plane_So` (OAuth) | Request, Agent, Platform, Portal, Booking, Marketing |
| `agenttia` | conector `plane-agenttia` (local, PAT) | Inbox, Platform, Agent, Marketing, **FACTORY** (trabajo de la fábrica) |

- **Antes de escribir:** verificar el workspace (`workspace retrieve`).
- **Identificadores repetidos** entre workspaces (`PLATFORM`, `AGENT`, `MARKETING`): en notas y comentarios que crucen, usar prefijo
  (**CC PLATFORM-60**, **AG PLATFORM-1**).
- **En Request o Inbox, siempre `intake create`, nunca `workitem create`.**
- Los hallazgos que aparecen mientras se construye un ítem ya triado van al proyecto de módulo, enlazados al ítem padre.
- Al cerrar una fase de un ítem: comentario con la plantilla `04-plantillas/comentario-por-fase.md` (evidencia, no narración).

## Principios

```
✅ El producto se entrega y opera sin la fábrica y sin ajustes
✅ Medir antes de cambiar; cada estándar nuevo sale de un caso real y queda versionado
✅ Una cosa a la vez; sin over-engineering
✅ Nada en producción sin OK explícito, paso por paso (runbook)
✅ Regresión antes de habilitar: línea base antes del cambio y regla de decisión escrita antes de ver resultados
✅ Verificar contra la fuente (código, Plane, git) antes de afirmar; el contexto resumido no es evidencia

❌ No escribir en el vault artefactos de producto
❌ No referencias al vault desde los productos
❌ No credenciales ni IDs en el vault fuera de lo estrictamente operativo, y nunca en 05-articulo/
```

## Idioma y nombres

- Conversación, contenido y documentación en **español**.
- Nombres de carpetas raíz y de desarrollo en **inglés** (`agents`, `harness`, `docs`); las carpetas de contenido, ramas y archivos
  pueden ir en español.

## Git y PRs

- Rama principal: **`master`**. Trabajo en ramas y PR.
- Commits y PRs en español, descriptivos, con el ítem de Plane cuando aplique (`FACTORY-11: …`).
- **Sin atribución de herramientas de IA:** nada de `Co-Authored-By` de Claude, "Generated with Claude Code" ni enlaces de sesión
  en commits ni PRs.
