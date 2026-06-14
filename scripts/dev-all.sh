#!/usr/bin/env bash
# Launch all MCP servers and the Next.js frontend concurrently.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

start_server() {
  local name="$1"
  local dir="$2"
  local port="$3"
  echo "Starting $name on port $port..."
  (
    cd "$ROOT/mcp-servers/$dir"
    if [ ! -d ".venv" ]; then
      python3 -m venv .venv
      .venv/bin/pip install -q -r requirements.txt
    fi
    .venv/bin/uvicorn main:app --port "$port" --reload
  ) &
}

start_server "library-server"  "library-server"  8001
start_server "cafeteria-server" "cafeteria-server" 8002
start_server "events-server"    "events-server"    8003

echo "Starting Next.js frontend..."
(
  cd "$ROOT/frontend"
  npm run dev
) &

echo "All services starting. Press Ctrl+C to stop."
wait
