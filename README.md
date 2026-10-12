# software-factory

La fábrica de software de Agenttic: **una forma de trabajar**, no una dependencia.
Define cómo pasa un pedido de la idea a producción (intake → triage → planning → building → review → salida)
y entrega a cada producto las piezas para trabajar así.

## Qué hay aquí

```
software-factory/
├── vault/      conocimiento de la fábrica (Obsidian, en español)
│               modelo, plantillas de proceso, calibraciones, lecciones y el artículo
└── kit/        lo que se copia a los productos
    ├── agents/   agentes de Claude Code: revisores y builders base
    ├── ci/       workflows modelo de GitHub Actions (CI, tag y release)
    ├── harness/  arnés de regresión genérico para agentes conversacionales
    └── docs/     esqueletos de README, AGENTS.md, ENVIRONMENTS.md y CODEOWNERS
```

Para retomar el trabajo: leer `vault/00-estado-actual.md` y `vault/README.md`.

## Productos

| Producto | Repo | Tracker |
|---|---|---|
| Conversion Chat | `alephart/conversion-platform` | Plane, workspace `conversion-chat` |
| Agenttia | (por crear) | Plane, workspace `agenttia` |

El trabajo **de la fábrica** se sigue en el proyecto FACTORY del workspace `agenttia`.

## Principio: el producto se entrega sin la fábrica

Si alguien se lleva un producto, recibe su repo y sus cuentas, y un equipo nuevo lo continúa **sin la fábrica y sin ajustes**.

- **Copiar, no enlazar.** Una pieza del kit se copia al repo del producto y pasa a ser suya. Nada de submódulos ni paquetes que haya que descargar de aquí.
- **El producto se explica solo.** Su documentación basta para instalar, desplegar, probar y operar. Ninguna referencia al vault ni a esta carpeta.
- **Cuentas propias por producto.** GitHub, Supabase, Railway, Cloudflare, dominio, correo, Google y llaves de LLM no se comparten entre productos.
- **Copias versionadas.** Cada pieza lleva versión e historial; un producto puede quedarse en una versión anterior.

Detalle: `vault/03-modelo/fabrica-y-productos.md`.

## Instalar una pieza en un producto

1. Leer el `README.md` de la carpeta del kit (p. ej. `kit/agents/README.md`).
2. Copiar los archivos al repo del producto y completar lo que esté entre `< >`.
3. Revisar que la copia no mencione el vault ni la fábrica.
4. Subirlo en un PR del producto, con su revisión normal.
5. Anotar en el ítem de FACTORY qué versión quedó instalada en qué producto.

## Convenciones

- **Carpetas raíz y de desarrollo en inglés** (`vault`, `kit`, `agents`, `ci`, `harness`, `docs`).
  El contenido (notas, archivos, ramas de contenido) puede ir en cualquier idioma.
- Nada pasa a producción sin el OK explícito de un humano.
- En Plane: verificar el workspace antes de escribir; en los proyectos de entrada (Request, Inbox) solo se usa **Intake**.
