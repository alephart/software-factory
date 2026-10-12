---
tags: [calibracion, agente-revisor, caso-1]
fecha-plan: 2026-10-05
uso: conjunto de evaluación del agente revisor de planes
---

# Calibración: plan original de AGENT-38 (antes de los ajustes)

Volver a [[agente-revisor-de-planes]]

> **Para qué sirve:** es el **primer conjunto de evaluación** del `plan-reviewer-agent`.
> Es la primera versión del plan que presentó el builder, antes de la revisión humana.
> El plan aprobado (producto) vive en el repo: `docs/tasks/agent-38-plan.md`.
>
> **Cómo usarlo:** pasar este plan al agente, junto con AGENT-38 (con sus condiciones de
> triage), el ADR 035 y el brief **en su versión del 05/10, antes de las enmiendas**, y comparar
> sus hallazgos con la tabla de abajo.

## Hallazgos esperados

| # | Hallazgo | Lente | ¿Visible en este texto? |
|---|---|---|---|
| 1 | `consultar_precio`, `actualizado_en`, `encontrado`: nombres en español frente a la convención en inglés del repo | Convenciones | Sí |
| 2 | `parseProductRef` con formatos de URL de IMEC dentro de `apps/agent` (T2) | Frontera plataforma/cliente | Sí |
| 3 | Se elimina el corte de 14 días, que revierte la condición de triage "un precio incorrecto es peor que no dar precio" | Trazabilidad | Sí (requiere leer AGENT-38) |
| 4 | El guard de anomalía (<70%) no tiene salida para un cambio legítimo del cliente | Operación | Sí |
| 5 | `extractNumericClaims()` sin formatos COP definidos | Datos del mundo real | Sí |
| 6 | Una cifra válida de otro producto "verifica" una atribución equivocada | Datos del mundo real | Sí |
| 7 | Supuesto: hace falta Playwright (el sitio renderiza los precios en el HTML) | Supuestos no verificados | Parcial (requiere mirar el sitio) |
| 8 | T7 y la sensibilidad del handoff quedan fuera de alcance sin ítem en Request | Alcance | Sí |
| 9 | `x-runtime-secret` compartido entre conectores | Seguridad y tenancy | Sí |
| 10 | El rollout hace merge a master (deploy de admin en Cloudflare) y despliega a prod sin staging | Operación | Sí |
| 11 | La coincidencia de nombre con `ilike` no prioriza la exacta | Datos del mundo real | Sí |

El hallazgo 10 lo detectó el humano en la segunda revisión, no en la primera. También cuenta
para medir al agente.

---

## Texto del plan original

### Contexto

Un cliente de catálogo (IMEC, equipos médico-estéticos) pidió que su agente responda precios.
ADR 035 (opción B) decidió:
- una tabla estructurada de precios,
- una tool `consultar_precio`,
- una sincronización semanal desde el conector existente (`imec-scraper`).

El brief es `docs/tasks/agent-38-precios-catalogo.md`.

Decisiones tomadas en esta sesión:

| Tema | Decisión |
|---|---|
| Tenant | **`client_id`**. El catálogo es del negocio y lo comparten todas sus líneas (agentes): una sola sincronización por cliente. |
| T4 | **GitHub Actions en `imec-scraper`**, sin reescribir el scraper. Cron semanal + `workflow_dispatch`. Secrets en GitHub Secrets. El workflow **falla visiblemente** si la corrida o el endpoint fallan. httpx en lugar de Playwright queda fuera de alcance. |
| Alcance | **T1–T6 + T8 + T9**. T7 (alertas Resend + Plane) va en un ítem aparte. |
| Regla de 14 días | **Se elimina.** En pruebas con IMEC, "no hay precio" empuja al asesor y eso dispara el handoff, que apaga la conversación. La tool siempre devuelve el último precio sincronizado con su `actualizado_en`. Mantener los precios al día es trabajo del cliente; lo nuestro es que la sincronización refleje la página. La antigüedad se vigila con T8 (y T7 después), no quitándole el precio al agente. |
| Capa 2.5 | Buscar la cifra mencionada en la tabla de precios del cliente (determinístico). |

Fuera de alcance: lo sensible que es el handoff (ticket aparte), usar `agotado`, `product_ref` en
la metadata del RAG y modelos de decisión tipada.

### Paso 0 — Docs que cambian por las decisiones (primer commit)

- **ADR 035:** enmienda fechada.
  - Sin corte de 14 días: la tool devuelve el último precio con su fecha.
  - Nivel 2 pasa de "no dar precio" a "alerta + visible en admin".
  - Escenario 6 nuevo: sincronización vencida → da el último precio con su fecha y el admin lo muestra vencido.
  - Tenant `client_id`; T4 en GitHub Actions; T7 en un ítem aparte.
- **Brief AGENT-38:**
  - T5 sin la regla de 14 días.
  - Escenario 6 redefinido.
  - T4 con la decisión.
  - T7 marcado como separado.
  - Rama `feature/AGENT-38-precios-catalogo`.

### T1 — Migración (@database-agent)

Un archivo nuevo en `supabase/migrations/`, siguiendo el patrón de
`20260827000002_platform_agent_media.sql`.

**`platform_catalog_prices`**
- Columnas:
  - `id uuid pk`
  - `client_id → platform_clients ON DELETE CASCADE`
  - `product_ref text` (p. ej. `especial:123`)
  - `name`, `name_normalized`
  - `price numeric(14,2) NULL` (NULL = "Consultar con asesor")
  - `price_text`, `currency text DEFAULT 'COP'`, `url`
  - `out_of_stock bool`
  - `is_listed bool DEFAULT true` y `delisted_at`
  - `source_hash`, `synced_at`, `created_at`, `updated_at`
- Restricciones e índices:
  - `UNIQUE (client_id, product_ref)`
  - índices `(client_id, name_normalized)` y `(client_id, price)` (para la capa 2.5)

**`platform_catalog_sync_runs`**
- Columnas:
  - `id`, `client_id`, `source`
  - `started_at`, `finished_at`
  - `status` con `CHECK IN ('success','failed','anomaly')` y nombre de constraint
  - `total_products`, `products_with_price`, `baseline_products_with_price`
  - `error text`, `created_at`
- Índice `(client_id, started_at DESC)`.

**Reglas comunes**
- RLS: `service_role_all` + `internal_users_all` (`is_internal_user()`). Sin política de portal por ahora.
- `GRANT … TO authenticated, service_role` explícito; sin él, `supabase:reset` local falla con 42501.
- Trigger `update_updated_at_column()`.

**Verificación**
- Antes de escribir SQL: `information_schema.columns` en local.
- `pnpm supabase:reset`, luego `pnpm supabase:types:local`.

### T2 — Ingesta (`apps/agent`, módulo nuevo `src/catalog-prices/`)

**Contrato JSON del conector**
```
{ source, generated_at, currency,
  products: [{ product_ref, name, price|null, price_text, url, out_of_stock }] }
```

**Endpoints**
- `CatalogPricesController`, con el check inline `x-runtime-secret` igual que `knowledge.controller.ts`:
  - `POST /catalog-prices/:clientId/ingest` (payload validado con zod)
  - `POST /catalog-prices/:clientId/runs/failed`: el workflow reporta un fallo del scraper con su error.

**`CatalogPricesService.ingest`**
1. Línea base = `products_with_price` de la última corrida `success` del cliente.
2. Si hay línea base y los productos con precio del lote son menos del 70% de ella:
   - registra la corrida como `anomaly`,
   - **no escribe** precios,
   - responde **409**, así el workflow falla.
3. Si no:
   - hace upsert por `(client_id, product_ref)`, con `name_normalized` y `source_hash`;
   - los productos que faltan quedan con `is_listed=false` y `delisted_at`, sin borrarse;
   - registra la corrida como `success`.
4. Un payload inválido devuelve 400.

**Utilidades compartidas con la tool**
- `normalizeName()`: minúsculas, sin acentos, espacios colapsados.
- `parseProductRef(url)`: reconoce `/store/especial?id=N` y `/store/producto?id=N` y, si no coincide, compara la URL exacta.

**Pruebas (`*.spec.ts`, mock de Supabase como en `rag.service.spec.ts`)**
- upsert
- producto desaparecido
- caída mayor a 30% → `anomaly` sin escritura
- primera corrida sin línea base
- payload inválido

### T3 — Conector (`/Users/dev100/Projects/imec-scraper`, otro repo)

- Flag `--prices-only` en `scraper.py`:
  - corre solo el descubrimiento, sin caché de descubrimiento (equivale a `--rediscover`);
  - toma las tarjetas `CARDS_JS` (`precio`, `precio_texto`, `agotado`);
  - deriva `product_ref` de la URL;
  - escribe `data/precios.json` con el contrato de T2.
- Sin reescribir nada más.
- `scripts/sync-prices.sh`:
  1. corre `--prices-only`;
  2. hace `curl --fail-with-body` del JSON al endpoint de ingesta;
  3. si falla, hace POST best-effort a `runs/failed` y sale con código distinto de 0.

  Es la misma ruta para local y para CI.
- **Hecho:** una corrida local produce alrededor de 181 productos con precio de 241.

### T4 — GitHub Actions (`imec-scraper/.github/workflows/sync-prices.yml`)

- **Disparo:** `schedule` semanal (lunes 11:00 UTC, que son las 06:00 en Colombia) + `workflow_dispatch`.
- **Pasos:** Python, `pip install -r requirements.txt`, `playwright install --with-deps chromium`, `scripts/sync-prices.sh`.
- **Secrets:** `PRICES_INGEST_URL` (incluye el `clientId`) y `RUNTIME_SECRET`.
- **Falla visible:** un error del scraper, un 4xx/5xx o un 409 de anomalía hacen que el job falle y GitHub notifique.
- **Riesgo anotado:** el sitio podría bloquear las IPs de los runners de GitHub.
- **Limitación de verificación:** los runners de GitHub no llegan a tu Supabase local. En local se verifica `sync-prices.sh` contra el agent local. La corrida real del workflow (programada + manual) se hace contra producción después del deploy, como parte del rollout.

### T5 — Tool `consultar_precio` (@runtime-agent)

**Archivos**
- `apps/agent/src/skills/catalog-price/consultar-precio.skill.ts`
  - `buildConsultarPrecioTool(clientId, catalogPricesSvc)`, siguiendo el patrón de `save-lead-city.skill.ts`.
  - Input zod `{ url?, nombre? }`, con refine: al menos uno de los dos.
- `CatalogPricesService.lookup(clientId, { url, nombre })`, solo sobre filas con `is_listed=true`.

**Salidas**
- Con URL: `parseProductRef` y fila exacta.
- Con nombre: `ilike` sobre `name_normalized`.
- Una sola fila con precio:
  `{ encontrado: true, nombre, precio, precio_texto, moneda, url, agotado, actualizado_en }`
- Fila sin precio: `{ encontrado: false, url }`, para que el agente comparta el enlace (escenario 2).
- Varias coincidencias: `{ encontrado: false, opciones: [{ nombre, url }] }`, máximo 5 (escenario 4).
- Ninguna coincidencia: `{ encontrado: false }`.
- Sin corte por antigüedad.

**Registro de la tool**
- `packages/config/src/constants.ts`: entrada `consultar_precio` en `AGENT_TOOL_INSTRUCTIONS`. Su `promptText` dice solo **cuándo** llamarla; la aclaración "puede variar" queda en el prompt del agente (AGENT-37). El checkbox del admin aparece solo desde `agent-card.tsx`.
- `agent-runtime.service.ts`, en `buildAgent()`: `if (toolsEnabled.includes('consultar_precio'))` con `config.clientId`.
- `packages/config/src/prompt-layers.ts`: entrada `tool_consultar_precio`. `prompt-layers.sync.spec.ts` la valida.

**Pruebas:** URL, nombre único, nombre ambiguo, sin precio, no encontrado.

### T6 — Conflictos con reglas existentes (@runtime-agent)

**Capa 3**
- `buildInstructions()` recibe un flag nuevo, `priceToolEnabled`.
- Si está activo, se agrega a la fidelidad: los resultados de `consultar_precio` son fuente válida de precios y se copian tal cual, con su fecha.

**Capa 2.5** (`agent-runtime.service.ts:299-322`, `anti-repetition.ts`)
- Helper nuevo `extractNumericClaims()`, que convierte las cifras del mensaje a números, junto a `containsUnverifiedClaim`.
- Si `consultar_precio` está habilitada y hay cifras, se buscan en `platform_catalog_prices` filas del cliente con `price` igual a alguna de ellas:
  - **Hay coincidencia:** se inyecta "la cifra corresponde al precio de referencia de <producto> (actualizado <fecha>)".
  - **No hay coincidencia:** se inyecta "verifica la cifra con `consultar_precio` y corrige con el precio de referencia". Reemplaza el "no la confirmes", que empujaba al asesor y al handoff.
- La verificación contra el RAG sigue igual para cifras que no son precios cuando `consultar_precio` no está habilitada.
- `prompt-layers.ts`: actualizar `claim_verification_context`.

**Pruebas:** en `agent-runtime.service.spec.ts` (bloque claim verification), cifra correcta, cifra incorrecta y tool deshabilitada (comportamiento actual intacto). En `anti-repetition.spec.ts`, el parser de cifras.

### T8 — Visibilidad en `apps/admin`

- Componente nuevo `PriceSyncStatusCard` en `apps/admin/src/app/(dashboard)/clients/[id]/`, en el stack de `tabs/agent-tab.tsx`.
- Datos: query nueva en el `Promise.all` de `clients/[id]/page.tsx` con `activeTab === "agent"` y `createServiceClient()`.
- La card muestra:
  - última sincronización exitosa,
  - productos con precio sobre el total,
  - estado de la última corrida,
  - **badge "vencida"** si la última sincronización exitosa tiene más de 8 días (una corrida semanal perdida).
- Se muestra solo si el cliente tiene corridas.

### T9 — Documentación

- `docs/AGENT_BEHAVIOR_LAYERS.md`:
  - capa 4: tabla con `consultar_precio`, y agregar `send_media`, que ya faltaba;
  - capa 2.5: el cambio de la verificación de cifras;
  - capa 3: la nota de fidelidad para precios.
- ADR 035: queda "Implementado" cuando esté en producción.

### Verificación (todo en local)

1. `pnpm supabase:reset` aplica las migraciones de `master` más la nueva. Se usa el cliente y agente semilla (`c1000000-…0001` / `a0000000-…0001`, `seed.sql`).
2. `pnpm --filter agent test` y `pnpm type-check` en verde.
3. Agent local (`pnpm dev:agent` contra Supabase local), luego `imec-scraper/scripts/sync-prices.sh` con `PRICES_INGEST_URL=http://localhost:3003/catalog-prices/<clientId>/ingest`. Se espera alrededor de 181/241 en `platform_catalog_sync_runs`.
4. Anomalía: re-enviar un JSON recortado al 50% → 409, corrida `anomaly`, precios intactos.
5. Admin local (`pnpm dev:admin`): la card muestra el estado. Forzar `synced_at` viejo → badge "vencida".
6. Escenarios 1–6 con el agente: hoy no hay endpoint para conversar en local; el único camino es el webhook de canal, que responde por el proveedor real. Propuesta: un script de escenarios (`apps/agent/scripts/`) que levante el contexto Nest y llame al runtime con un canal no-op. Si eso se alarga, se prueba a mano y cada resultado se registra en AGENT-38, como dice el brief.
7. Antes del merge: @reviewer-agent con el brief y el ADR 035, y su veredicto como comentario en AGENT-38.

### Orden de entrega y rollout

- **Orden:** Paso 0 → T1 → T2 → T5 → T6 → T3 → T4 → T8 → T9. Cada tarea se cierra con un resumen breve (qué se hizo, cómo se verificó, qué quedó pendiente).
- **Rollout a producción, después de tu aprobación:**
  1. migración a prod;
  2. merge a master;
  3. `railway up -e production -d`;
  4. secrets en GitHub;
  5. `workflow_dispatch`;
  6. habilitar `consultar_precio` en el agente de IMEC.
