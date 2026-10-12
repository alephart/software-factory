#!/usr/bin/env bash
# Instala el CI modelo en un repo de producto (copia, no enlace).
# Uso:
#   kit/ci/install.sh <repo> --prod-branch <rama> --staging-branch <rama> [--deploy-app <slug>] [--force]
# Ejemplo:
#   kit/ci/install.sh ../agenttia --prod-branch main --staging-branch stage
set -euo pipefail

KIT="$(cd "$(dirname "$0")" && pwd)"
REPO="${1:?Uso: install.sh <repo> --prod-branch <rama> --staging-branch <rama> [--deploy-app <slug>] [--force]}"; shift
PROD=""; STAGING=""; DEPLOY_APP="cloudflare-workers-and-pages"; FORCE=false
while [ $# -gt 0 ]; do
  case "$1" in
    --prod-branch) PROD="$2"; shift 2 ;;
    --staging-branch) STAGING="$2"; shift 2 ;;
    --deploy-app) DEPLOY_APP="$2"; shift 2 ;;
    --force) FORCE=true; shift ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
done
[ -n "$PROD" ] && [ -n "$STAGING" ] || { echo "Faltan --prod-branch y --staging-branch" >&2; exit 1; }
[ -d "$REPO/.git" ] || { echo "$REPO no es un repo git" >&2; exit 1; }

render() { # origen destino
  if [ -e "$2" ] && [ "$FORCE" != true ]; then echo "  existe, no se toca: $2 (usar --force)"; return; fi
  mkdir -p "$(dirname "$2")"
  sed -e "s/__PROD_BRANCH__/$PROD/g" -e "s/__STAGING_BRANCH__/$STAGING/g" -e "s/__DEPLOY_APP__/$DEPLOY_APP/g" "$1" > "$2"
  echo "  escrito: $2"
}

render "$KIT/workflows/ci.yml"          "$REPO/.github/workflows/ci.yml"
render "$KIT/workflows/release.yml"     "$REPO/.github/workflows/release.yml"
render "$KIT/workflows/release-tag.yml" "$REPO/.github/workflows/release-tag.yml"
render "$KIT/scripts/release-tag.sh"    "$REPO/scripts/release-tag.sh"
chmod +x "$REPO/scripts/release-tag.sh"
render "$KIT/changeset-config.json"     "$REPO/.changeset/config.json"
[ -e "$REPO/.github/release-checks.txt" ] || { cp "$KIT/release-checks.example.txt" "$REPO/.github/release-checks.txt"; echo "  escrito: $REPO/.github/release-checks.txt (COMPLETAR)"; }

if grep -rn "__PROD_BRANCH__\|__STAGING_BRANCH__\|__DEPLOY_APP__" "$REPO/.github" "$REPO/scripts/release-tag.sh" "$REPO/.changeset" 2>/dev/null; then
  echo "Quedaron marcadores sin reemplazar" >&2; exit 1
fi
cat <<MSG

Listo. Falta, en el repo del producto:
  1. Completar .github/release-checks.txt con los checks de despliegue.
  2. Scripts raíz type-check, lint y test (turbo), y @changesets/cli como devDependency.
  3. package.json raíz con "version" y CHANGELOG.md con secciones "## [X.Y.Z]" (ver docs/VERSIONING.md).
  4. Ensayo: gh workflow run "Release tag" --ref $PROD -f dry_run=true
  5. Subirlo en un PR y anotar en el ítem de FACTORY la versión del kit instalada.
MSG
