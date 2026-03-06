#!/bin/bash
# SessionStart Hook: session_id를 CLAUDE_ENV_FILE에 주입하여 세션 격리 지원
# 참고: Jon Roosevelt "Ghost in the Machine" 패턴

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

if [[ -n "$SESSION_ID" ]] && [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  echo "export CLAUDE_SESSION_ID='$SESSION_ID'" >> "$CLAUDE_ENV_FILE"
fi

exit 0
