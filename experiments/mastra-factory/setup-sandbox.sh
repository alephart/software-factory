#!/usr/bin/env bash
# Crea el repo de juguete alephart/factory-sandbox (privado) con 3 issues, para probar Mastra Factory
# sin darle acceso a ningún repo real. Requiere gh autenticado. Uso: bash setup-sandbox.sh
set -euo pipefail
DIR="$HOME/Projects/agenttic/factory-sandbox"
mkdir -p "$DIR" && cd "$DIR"
git init -q -b main

cat > package.json <<'EOF'
{
  "name": "factory-sandbox",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
EOF

mkdir -p src test
cat > src/money.js <<'EOF'
// Formatea un valor en pesos colombianos para mostrarlo al contacto.
export function formatCOP(value) {
  return '$' + String(value);
}
EOF

cat > test/money.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCOP } from '../src/money.js';

test('formatea sin decimales', () => {
  assert.equal(formatCOP(500), '$500');
});
EOF

cat > README.md <<'EOF'
# factory-sandbox

Repo de juguete para probar Mastra Factory. No tiene datos reales.
Pruebas: `npm test` (Node 20+).
EOF

cat > AGENTS.md <<'EOF'
# AGENTS.md

- JavaScript con módulos ES, sin dependencias externas.
- Pruebas con `node --test`; todo cambio lleva su prueba.
- Textos para el usuario final en español.
EOF

git add -A && git commit -qm "Proyecto inicial"
gh repo create alephart/factory-sandbox --private --source . --push

gh issue create --title "formatCOP no usa separador de miles" \
  --body "formatCOP(1200000) devuelve \$1200000. Debe devolver \$1.200.000 (punto como separador de miles, sin decimales). Agregar la prueba."
gh issue create --title "Agregar parseCOP para leer montos escritos por el contacto" \
  --body "Necesitamos parseCOP(texto) que devuelva el número: '\$1.200.000' → 1200000, '95 mil' → 95000, '1,2 millones' → 1200000. Si no hay monto, null. Con pruebas."
gh issue create --title "Documentar en el README las funciones de dinero" \
  --body "Agregar al README una sección corta con formatCOP y parseCOP y un ejemplo de cada una."
echo "Listo: https://github.com/alephart/factory-sandbox"
