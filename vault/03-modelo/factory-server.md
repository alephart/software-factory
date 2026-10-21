---
tags: [modelo, infraestructura, factory-server]
creado: 2026-10-21
estado: decidido
item: FACTORY-11
---

# Servidor de la Factory (factory-server)

Volver a [[README]] · Relacionado: [[fabrica-y-productos]] · [[05-mastra-factory-prueba]]

## Decisiones (21/10)

| Tema | Decisión |
|---|---|
| Motor y UI | Mastra Factory autoalojada, ejecutando **nuestras skills** (`src/mastra/public/factory-skills/`, copiadas del kit) |
| Repo | `alephart-co/factory-server` (nuevo, privado). Separado de `software-factory` (vault + kit) |
| Servidor | DigitalOcean, Droplet **dedicado** de 8 GB / 4 vCPU / 160 GB (~USD 48/mes) |
| Dominio | `factory.alephart.co` |
| Entrada pública | Túnel de Cloudflare (sin puertos abiertos) |
| Acceso | Cloudflare Access delante de la Factory (piloto); WorkOS cuando entre más gente |
| Base de datos | Postgres con pgvector + Redis en el mismo Droplet (Docker Compose) |
| Agentes | En el mismo Droplet mientras solo se toquen repos de prueba; **E2B más adelante**, antes de tocar CC o Agenttia |
| GitHub | GitHub App propia en la organización `alephart-co` |
| Modelos | Llaves propias (Anthropic, OpenAI u otros), con límite de gasto |
| Local | Solo desarrollo: `pnpm dev` + docker-compose en el Mac |

## Reglas

- **Droplet dedicado:** no se comparte con n8n ni con nada que tenga credenciales de productos.
- **Cero credenciales de producción** en el servidor de la Factory.
- Cloudflare Access debe dejar pasar sin login la ruta de webhooks de GitHub (y solo esa).
- Respaldo diario de Postgres; la llave de cifrado de credenciales y los secretos de firma se guardan fuera del Droplet.

## Fases

1. **Local:** crear `factory-server` sin plataforma, GitHub App propia, un issue de `factory-sandbox` hasta Done con las skills de Mastra.
2. **Nuestras skills:** triage con aprobación humana y sin crear etiquetas, plan con nuestra plantilla, plan-reviewer independiente, review con reglas del repo.
3. **Servidor:** Droplet + Docker Compose + túnel + Access + respaldos; el mismo issue de prueba hasta Done.
4. **Primer producto:** con E2B, Agenttia (caso 2).
