#!/usr/bin/env bash
# Instala el arnés de regresión en un repo de producto (copia, no enlace). No copia suites:
# las suites son del producto.
# Uso:
#   kit/harness/install.sh <repo> [--dest apps/agent/scripts/regression] [--force]
set -euo pipefail

KIT="$(cd "$(dirname "$0")" && pwd)"
REPO="${1:?Uso: install.sh <repo> [--dest <ruta>] [--force]}"; shift
DEST="apps/agent/scripts/regression"; FORCE=false
while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --force) FORCE=true; shift ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
done
[ -d "$REPO/.git" ] || { echo "$REPO no es un repo git" >&2; exit 1; }
TARGET="$REPO/$DEST"
mkdir -p "$TARGET/lib"

put() { # origen destino
  if [ -e "$2" ] && [ "$FORCE" != true ]; then echo "  existe, no se toca: $2 (usar --force)"; return; fi
  cp "$1" "$2"; echo "  escrito: $2"
}
for f in run.ts compare.ts ab.ts _template.json harness.config.example.json agents.example.json; do put "$KIT/$f" "$TARGET/$f"; done
for f in "$KIT"/lib/*.ts; do put "$f" "$TARGET/lib/$(basename "$f")"; done
put "$KIT/README.product.md" "$TARGET/README.md"

# Las corridas pueden tener datos del negocio: nunca entran a git.
IGNORE_LINE="$DEST/runs/"
grep -qxF "$IGNORE_LINE" "$REPO/.gitignore" 2>/dev/null || { echo "$IGNORE_LINE" >> "$REPO/.gitignore"; echo "  .gitignore: $IGNORE_LINE"; }

cat <<MSG

Listo. Falta, en el repo del producto:
  1. Copiar harness.config.example.json → harness.config.json y completar el ref de staging (y envFile).
  2. Copiar agents.example.json → agents.json con los agentes de staging.
  3. Una suite por agente (<alias>.json, desde _template.json), aprobada por el dueño de producto.
  4. Dependencias en la app del agente: zod, @supabase/supabase-js, dotenv, tsx.
  5. Si el runtime no es NestJS + Mastra con tablas platform_*, reescribir solo run.ts.
  6. Subirlo en un PR y anotar en el ítem de FACTORY la versión del kit instalada.
MSG
