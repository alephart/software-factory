---
tags: [diagnostico, roles]
creado: 2026-09-28
---

# Roles actuales por etapa

Volver a [[README]] · Ver también [[problemas-por-etapa]]

## Equipo

- **Fundador técnico (Juan Carlos):** lidera todo el desarrollo, arquitectura y ADRs; dirige a los agentes de código.
- **Producto / cliente (Nicole):** desde el inicio. Thinking de producto, revisiones, curación de contenido, contacto con el cliente (conoce sus dolores y necesidades y los transmite para iniciar implementaciones o mejoras). Soporte técnico al equipo de ventas y a los clientes.
- **Claude / agentes de código:** análisis, planning (ADRs), implementación vía Claude Code con subagentes.

## Mapa

| Etapa | Quién la ejecuta hoy |
|---|---|
| Intake | Producto/cliente |
| Triage | Fundador técnico + IA, informal |
| Planning | Fundador técnico + IA (ADRs) |
| Building | Agentes de código dirigidos por el fundador |
| Review | Producto revisa a ojo; fundador revisa código |
| Done | Sin dueño definido |
| Operación/Soporte | Producto/cliente |
| Curación de conocimiento | Producto/cliente |

## Hallazgo

Dos personas sostienen todos los gates. Una concentra el conocimiento del cliente y la otra el técnico, y casi todo es **tácito**: no está escrito en artefactos que un agente o un humano nuevo pueda usar.

Pasar de artesanal a fábrica = **convertir conocimiento tácito en artefactos**.
