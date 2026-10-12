# kit/ci — CI modelo, versiones y releases

**Versión:** 0.1 (12/10) · Extraído del CI y del flujo de releases de Conversion Chat (en uso desde v0.13.2).

| Archivo (en el producto) | Qué hace |
|---|---|
| `.github/workflows/ci.yml` | Type-check, lint y pruebas en cada PR a producción y a staging |
| `.github/workflows/release.yml` | Con changesets pendientes, abre el PR "chore: version packages" |
| `.github/workflows/release-tag.yml` + `scripts/release-tag.sh` | Tag anotado `vX.Y.Z` y GitHub Release cuando los checks de despliegue quedan en verde |
| `.github/release-checks.txt` | Lista de checks que forman el gate del tag (uno por línea) |
| `.changeset/config.json` | Configuración de changesets (paquetes privados, sin publicar a npm) |

## Instalar

```bash
kit/ci/install.sh <repo-del-producto> --prod-branch <rama> --staging-branch <rama> [--deploy-app <slug>]
```

Reemplaza los marcadores `__PROD_BRANCH__`, `__STAGING_BRANCH__` y `__DEPLOY_APP__` (por defecto
`cloudflare-workers-and-pages`), no pisa archivos existentes sin `--force` y lista lo que falta.

## Lo que el producto debe tener

- Monorepo pnpm + turbo con scripts raíz `type-check`, `lint` y `test`.
- `package.json` raíz con `version` y `CHANGELOG.md` con secciones `## [X.Y.Z]` separadas por `---` (lo escribe una persona).
- `docs/VERSIONING.md` y un ADR que expliquen el flujo, incluido lo que se despliega a mano y no entra en el gate.

## Límites conocidos

- En repo privado con plan gratuito el CI avisa pero no bloquea: la regla es no mergear en rojo.
- `check_run` solo dispara desde la rama por defecto: la rama de producción debe ser la rama por defecto del repo.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-12 | Extracción desde CC: ramas y app de despliegue como marcadores, checks del gate en `.github/release-checks.txt` |
