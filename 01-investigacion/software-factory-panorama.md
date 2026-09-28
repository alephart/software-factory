---
tags: [investigacion, software-factory]
creado: 2026-09-28
---

# Software Factory con agentes — panorama

Volver a [[README]]

## Definición

La "fábrica" no es el agente de código, sino el sistema que lo rodea: una cola de intake que decide qué trabajo vale la pena empezar, espacios de trabajo aislados para que agentes en paralelo no choquen, una capa de herramientas compartida, verificación automatizada y un gate de merge explícito.

Flujo de referencia: issue → triage → planning → implementación → testing → verificación → review → aprobación humana → despliegue. Los agentes trabajan en varias etapas, la automatización coordina los traspasos y el juicio humano entra en checkpoints definidos.

Nuestro flujo simplificado: **Intake → Triage → Planning → Building → Review → Done** (ver [[ajustes-al-planteamiento]] para la etapa de Operación que falta).

## Los cinco niveles (Dan Shapiro, enero 2026)

Modelo inspirado en los niveles de conducción autónoma:

| Nivel | Nombre | Rol humano |
|---|---|---|
| 0 | Spicy autocomplete | Escribe el código, la IA sugiere |
| 1 | Coding intern | IA hace boilerplate, revisión total |
| 2 | Junior developer | Pair programming, revisa cada línea |
| 3 | Developer | Revisor de lo que generan los agentes |
| 4 | Engineering team | Escribe specs, ya no lee código |
| 5 | Dark factory | Nadie revisa el código generado |

Shapiro estima que ~90% de quienes se dicen "AI-native" están en el nivel 2.

## Caso de referencia: StrongDM

Equipo de tres personas con desarrollo no interactivo: specs y escenarios guían a agentes que escriben, prueban y convergen sin revisión humana. Los humanos diseñan especificaciones, curan escenarios y miran puntajes.

Técnicas clave:

- **Escenarios como holdout set.** Igual que en ML, los agentes no ven los escenarios de validación mientras programan. Resuelve el problema de que el agente escriba el código y también sus propios tests.
- **Digital Twin Universe.** Clones de comportamiento de los servicios externos (identidad, chat, documentos) para probar sin tocar producción, sin límites de tasa ni costos, y con mejor gobernanza de datos.
- **Calidad estadística.** En vez de pass/fail, fracción de trayectorias de usuario exitosas sobre todos los escenarios.

## Prácticas por etapa

- **Intake/Triage:** la calidad del contexto en el intake determina el resto. Buen primer agente: uno de triage.
- **Building:** dos agentes en el mismo directorio generan choques; las fábricas caseras se estancan cerca del cuarto agente concurrente. Solución simple: git worktrees.
- **Review:** el nuevo cuello de botella. Los agentes abren PRs más rápido de lo que se pueden revisar. Se recomiendan gates humanos en especificación y merge.
- **Memoria entre etapas:** evita que triage recree ítems ya existentes o que monitoreo re-alerte incidentes ya escalados.

## Matices y riesgos

- El cuello de botella pasa de programar a especificar.
- No está probado que un equipo pequeño con fábrica iguale de forma confiable a uno tradicional grande.
- Niveles 4–5 exigen specs ejecutables, verificación independiente, permisos acotados, rollback y ownership humano claro.
- La fábrica completa cuesta dinero; los patrones de fondo (holdouts, validación determinista, orquestación) son baratos y accesibles.
- Saltar directo a la dark factory sin pasar por los niveles bajos lleva a enviar código roto o inseguro sin que nadie lo note.

## Fuentes

- https://www.faros.ai/blog/software-factory
- https://www.firecrawl.dev/blog/ai-software-factory
- https://mastra.ai/blog/software-factory
- https://www.augmentcode.com/guides/what-is-a-software-factory
- https://simonwillison.net/2026/Jan/28/the-five-levels/
- https://simonwillison.net/2026/Feb/7/software-factory/
- https://www.strongdm.com/blog/the-strongdm-software-factory-building-software-with-ai
- https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/
- https://env.dev/ai/agentic-coding-levels
- https://darkfactory.dev/blog/what-is-dark-factory-software-development
