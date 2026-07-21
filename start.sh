#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ "${NODE_ENV:-}" == test && -n "${RUNTIME_PROJECT_SOURCE:-}" ]]; then
  ROOT="$RUNTIME_PROJECT_SOURCE"
fi
cd "$ROOT"

PORT="${PORT:-3000}"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required." >&2
  exit 1
fi

if [ ! -x node_modules/.bin/next ] || [ ! -x node_modules/.bin/prisma ]; then
  echo "Dependencies are missing. Run 'npm ci' explicitly before startup." >&2
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Stop that process or set PORT to another value." >&2
  exit 1
fi

node scripts/validate-config.js
npm run prisma:validate

echo "Starting LuranAI development server on http://localhost:$PORT"
echo "Database schema changes and seed data are never applied by this launcher."
exec npm run dev -- --port "$PORT"
