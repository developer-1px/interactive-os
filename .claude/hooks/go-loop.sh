#!/bin/bash
# Stop Hook for /auto pipeline (session-isolated)
# 세션별 마커 파일로 격리 — 다른 세션의 /auto를 건드리지 않는다.

INPUT=$(cat)

HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

# session_id를 알 수 없으면 간섭하지 않고 정상 종료
if [[ -z "$SESSION_ID" ]]; then
  exit 0
fi

MARKER="/tmp/.go-pipeline-${SESSION_ID}"

# 무한루프 방지: 이미 한 번 잡았는데 또 멈추려 하면 놔줌
if [ "$HOOK_ACTIVE" = "true" ]; then
  rm -f "$MARKER"
  exit 0
fi

# 이 세션의 /auto 파이프라인이 활성 상태면 멈추지 않는다
if [ -f "$MARKER" ]; then
  echo "/auto 파이프라인 진행 중. /go 판별표 #0부터 재판별하세요." >&2
  exit 2
fi

# 일반 대화면 정상 종료
exit 0
