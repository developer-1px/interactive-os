#!/bin/bash
# Vite dev server smoke test — all configs
# Starts each vite config, requests index, checks for module resolution errors.
# Exit 0 = all OK, Exit 1 = error detected

cd "$(dirname "$0")/.."

source ~/.nvm/nvm.sh && nvm use > /dev/null 2>&1

FAIL=0

for CONFIG in vite.config.ts vite.docs.config.ts; do
  [ ! -f "$CONFIG" ] && continue

  PORT=$((5570 + RANDOM % 100))
  LOG="/tmp/vite-smoke-$(basename "$CONFIG")-$$.log"

  lsof -t -i :"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true

  npx vite --config "$CONFIG" --port "$PORT" > "$LOG" 2>&1 &
  PID=$!
  sleep 1

  curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null || true
  sleep 1

  kill $PID 2>/dev/null || true
  wait $PID 2>/dev/null || true

  if grep -qi "Failed to resolve import\|ERR_LOAD\|Pre-transform error" "$LOG"; then
    echo "❌ $CONFIG:"
    grep -i "Failed to resolve import\|ERR_LOAD\|Pre-transform error" "$LOG" | head -3
    FAIL=1
  else
    echo "✅ $CONFIG"
  fi

  rm -f "$LOG"
done

exit $FAIL
