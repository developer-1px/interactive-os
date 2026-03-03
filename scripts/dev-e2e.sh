#!/bin/bash

echo "🚀 Launching TestBot Dev Environment..."

# 1. Clear any existing debug instance
lsof -ti :9222 | xargs kill -9 2>/dev/null

# 2. Use an isolated user profile to avoid conflicts with your main browser
USER_DATA_DIR="/tmp/chrome-testbot-profile"

# 3. Launch Chrome with Remote Debugging (MacOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --remote-debugging-port=9222 \
    --user-data-dir="$USER_DATA_DIR" \
    --no-first-run \
    --no-default-browser-check \
    "http://localhost:5173" &
    
  echo "✅ Chrome launched in debug mode (Port 9222)"
else
  echo "⚠️  Auto-launch supports macOS only. Launch Chrome manually with --remote-debugging-port=9222"
fi

# 4. Start the dev server
npm run dev
