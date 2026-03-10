#!/bin/bash
# PostToolUse audit log — logs file access to JSONL (token cost: 0)
#
# Captures Read/Edit/Write/Bash tool calls with timestamps.
# Output: .claude/session-logs/YYYY-MM-DD.jsonl

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION=$(echo "$INPUT" | jq -r '.session_id // empty')

# Extract the primary parameter depending on tool type
DETAIL=$(echo "$INPUT" | jq -r '
  .tool_input.file_path //
  .tool_input.command //
  .tool_input.pattern //
  empty
')

# Skip if no meaningful detail
[ -z "$DETAIL" ] && exit 0

LOG_DIR="$(cd "$(dirname "$0")/.." && pwd)/session-logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).jsonl"

# Append one JSON line — minimal fields, no content
printf '{"ts":"%s","session":"%s","tool":"%s","detail":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$SESSION" \
  "$TOOL" \
  "$DETAIL" \
  >> "$LOG_FILE"
