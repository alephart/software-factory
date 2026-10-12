#!/usr/bin/env bash
# Crea el tag anotado vX.Y.Z y el GitHub Release cuando el commit de la rama de producción ya está
# desplegado en verde.
#
# La versión sale del package.json raíz de ESE commit y las notas, de la sección [X.Y.Z] del
# CHANGELOG.md raíz del mismo commit. Los dos los escribe una persona (flujo en docs/VERSIONING.md).
#
# Gate: cada check run listado en .github/release-checks.txt (uno por línea), de la app DEPLOY_APP, en
# success. Lo que se despliega a mano no entra, así que el tag no garantiza que eso esté desplegado.
#
# Entradas (variables de entorno): SHA, REPO (owner/repo), GH_TOKEN, PROD_BRANCH, DEPLOY_APP; opcionales
# DRY_RUN=true (no escribe nada) e IGNORE_EXISTING_TAG=true (solo con DRY_RUN: ensayo sobre un release ya publicado).
set -euo pipefail

: "${SHA:?Falta SHA}"
: "${REPO:?Falta REPO}"
DRY_RUN="${DRY_RUN:-false}"
IGNORE_EXISTING_TAG="${IGNORE_EXISTING_TAG:-false}"

PROD_BRANCH="${PROD_BRANCH:?Falta PROD_BRANCH}"
DEPLOY_APP="${DEPLOY_APP:?Falta DEPLOY_APP}"
CHECKS_FILE=".github/release-checks.txt"
[ -f "$CHECKS_FILE" ] || { echo "::error::Falta $CHECKS_FILE"; exit 1; }
REQUIRED_CHECKS=()
while IFS= read -r line; do
  [[ -z "${line// }" || "$line" == \#* ]] || REQUIRED_CHECKS+=("$line")
done < "$CHECKS_FILE"
[ "${#REQUIRED_CHECKS[@]}" -gt 0 ] || { echo "::error::$CHECKS_FILE no lista ningún check"; exit 1; }

notice() { echo "::notice::$*"; }
fail() { echo "::error::$*"; exit 1; }

if [ "$IGNORE_EXISTING_TAG" = true ] && [ "$DRY_RUN" != true ]; then
  fail "IGNORE_EXISTING_TAG solo se permite con DRY_RUN=true"
fi

git fetch -q origin "$PROD_BRANCH" --tags

# 1. Solo commits que están en la rama de producción.
if ! git merge-base --is-ancestor "$SHA" "origin/$PROD_BRANCH"; then
  notice "${SHA:0:7} no está en $PROD_BRANCH: nada que hacer"
  exit 0
fi

# 2. Versión del producto (package.json raíz) en ese commit.
version="$(git show "$SHA:package.json" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version")"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "La versión raíz '$version' en ${SHA:0:7} no es X.Y.Z"
tag="v$version"

# 3. Si ya hay tag, no se hace nada (un release tiene un solo tag aunque tenga varios merges).
if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1; then
  if [ "$IGNORE_EXISTING_TAG" = true ]; then
    notice "(ensayo) el tag $tag ya existe; se ignora para evaluar el resto"
  else
    notice "El tag $tag ya existe: nada que hacer"
    exit 0
  fi
fi

# 4. Gate: todos los checks requeridos en verde para este commit.
checks="$(gh api "repos/$REPO/commits/$SHA/check-runs?per_page=100" \
  --jq ".check_runs[] | select(.app.slug == \"$DEPLOY_APP\") | \"\(.name)\t\(.status)\t\(.conclusion)\"")"

pending=false
failed=false
for name in "${REQUIRED_CHECKS[@]}"; do
  line="$(printf '%s\n' "$checks" | awk -F'\t' -v n="$name" '$1 == n { print $2 "\t" $3 }' | tail -1)"
  if [ -z "$line" ]; then
    echo "  falta:     $name"
    pending=true
    continue
  fi
  status="${line%%$'\t'*}"
  conclusion="${line##*$'\t'}"
  if [ "$status" != completed ]; then
    echo "  en curso:  $name"
    pending=true
  elif [ "$conclusion" != success ]; then
    echo "  FALLÓ ($conclusion): $name"
    failed=true
  else
    echo "  ok:        $name"
  fi
done

if [ "$failed" = true ]; then
  notice "Un check requerido falló en ${SHA:0:7}: no se crea $tag"
  exit 0
fi
if [ "$pending" = true ]; then
  notice "Faltan checks requeridos en ${SHA:0:7}: se reevalúa con el siguiente"
  exit 0
fi

# 5. Notas: la sección [X.Y.Z] del CHANGELOG raíz de ese commit. Sin notas no se crea nada.
notes="$(mktemp)"
git show "$SHA:CHANGELOG.md" \
  | awk -v v="$version" '$0 ~ "^## \\[" v "\\]" { f = 1; next } /^---$/ { if (f) exit } f' > "$notes"
grep -q '[^[:space:]]' "$notes" || fail "El CHANGELOG.md raíz no tiene la sección [$version] en ${SHA:0:7}"

if [ "$DRY_RUN" = true ]; then
  echo "(ensayo) crearía el tag anotado $tag en ${SHA:0:7} y el Release con estas notas:"
  sed 's/^/    /' "$notes"
  exit 0
fi

# 6. Tag anotado y Release.
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git tag -a "$tag" "$SHA" -m "Release $version"
if ! git push origin "$tag"; then
  notice "El tag $tag apareció mientras tanto (otra evaluación se adelantó): nada que hacer"
  exit 0
fi
gh release create "$tag" --verify-tag --title "$tag" --notes-file "$notes"
notice "Creado $tag en ${SHA:0:7} con su Release"
