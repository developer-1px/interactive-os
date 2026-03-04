#!/bin/bash
# Stop Hook for /auto pipeline
# 마커 파일이 있으면 Claude 종료를 차단하고 /go 파이프라인을 계속한다.

INPUT=$(cat)

HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# 무한루프 방지: 이미 한 번 잡았는데 또 멈추려 하면 놔줌
if [ "$HOOK_ACTIVE" = "true" ]; then
  rm -f /tmp/.go-pipeline-active
  exit 0
fi

# /auto 파이프라인 활성 상태면 멈추지 않는다
if [ -f /tmp/.go-pipeline-active ]; then
  echo "/auto 파이프라인 진행 중. /go 판별표 #0부터 재판별하세요." >&2
  exit 2
fi

# 일반 대화면 정상 종료
exit 0
