#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a
: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo "BACKEND_PORT and FRONTEND_PORT must differ" >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1024 && port <= 65535 )) || { echo "Invalid assigned port" >&2; exit 1; }
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $port is already in use" >&2; exit 1; }
done
[[ -d "$project_dir/node_modules" ]] || { echo "Dependencies are missing; run npm ci" >&2; exit 1; }
cd "$project_dir"
node scripts/validate-config.js
npm run prisma:generate
npm run db:push:dev
node scripts/provision-admin.js

api_pid=''; proxy_pid=''
cleanup() {
  [[ -n "$proxy_pid" ]] && kill "$proxy_pid" 2>/dev/null || true
  [[ -n "$api_pid" ]] && kill "$api_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM
npm run dev -- --hostname 127.0.0.1 --port "$BACKEND_PORT" & api_pid=$!
for _ in $(seq 1 180); do
  curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/login" >/dev/null 2>&1 && break
  kill -0 "$api_pid" 2>/dev/null || { echo "Application exited during startup" >&2; wait "$api_pid"; exit 1; }
  sleep 0.25
done
curl --fail --silent "http://127.0.0.1:$BACKEND_PORT/login" >/dev/null || { echo "Application readiness timed out" >&2; exit 1; }
RUNTIME_PROXY_PORT="$FRONTEND_PORT" RUNTIME_PROXY_TARGET_PORT="$BACKEND_PORT" node scripts/runtime-proxy.mjs & proxy_pid=$!
echo "LuranAI is available at http://127.0.0.1:$FRONTEND_PORT (API $BACKEND_PORT)"
while kill -0 "$api_pid" 2>/dev/null && kill -0 "$proxy_pid" 2>/dev/null; do sleep 1; done
echo "A service exited unexpectedly" >&2
exit 1
