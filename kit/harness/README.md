# kit/harness — arnés de regresión de agentes

**Versión:** 0.1 (12/10) · Extraído del arnés que validó en producción el caso de precios de IMEC en Conversion Chat.

| Archivo | Depende del runtime | Qué hace |
|---|---|---|
| `run.ts` | sí (NestJS + Mastra, tablas `platform_*`) | Corre la suite contra staging y guarda evidencia en `runs/` |
| `compare.ts` | no | Barrido: candidato contra línea base, criterios PASA / REVISAR / FALLA |
| `ab.ts` | no | A/B de los ítems marcados, test exacto de Fisher |
| `lib/config.ts` | no | Lee `harness.config.json` y `agents.json` |
| `lib/criteria.ts`, `lib/types.ts`, `lib/numeric-claims.ts` | no | Criterios, esquema de la suite, extractor de cifras |
| `_template.json` | — | Plantilla de suite |
| `README.product.md` | — | Se instala como `README.md` en el producto: se explica solo, sin referencias a la fábrica |

## Instalar

```bash
kit/harness/install.sh <repo-del-producto> [--dest apps/agent/scripts/regression]
```

Copia el arnés (sin suites), agrega `runs/` al `.gitignore` y lista lo que falta: configuración, agentes,
suites aprobadas por producto y dependencias (`zod`, `@supabase/supabase-js`, `dotenv`, `tsx`).

## Qué se configura por producto (`harness.config.json`)

| Clave | Para qué | En CC |
|---|---|---|
| `stagingSupabaseRef` | Único proyecto contra el que corre | ref de cc-staging |
| `envFile` | Credenciales de staging (ignorado por git) | `.env.cc-staging` |
| `guardedTools` | Tools que el candidato no puede tener ni nombrar | `["get_catalog_price"]` mientras estuvo apagada |
| `defaultRuns`, `ab` | Barrido de 3 y regla del A/B (0,40 y p < 0,05) | valores por defecto |
| `forbiddenEnvPrefixes`, `requiredEnv`, `dials`, `configFields` | Seguridad y procedencia | valores por defecto |

## Verificación del kit

Compila en modo estricto (`tsc --strict`, zod 4) y se probó con corridas sintéticas: `compare.ts` marca
cifras sin fuente y tool vigilada; `ab.ts` marca un cambio de fuente 10/10 → 2/10 (p = 0,001).
`run.ts` solo se puede probar contra un staging real: la primera instalación (Agenttia) es su prueba.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-12 | Extracción desde CC: configuración en `harness.config.json`, aliases desde `agents.json`, tools vigiladas configurables, sin referencias a CC |
