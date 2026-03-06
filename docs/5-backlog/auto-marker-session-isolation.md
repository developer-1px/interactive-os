# /auto 마커 세션 격리

> 2026-03-06 | Origin: 다른 세션의 마커를 오삭제한 사고

## 문제

`/auto` 파이프라인의 마커 `/tmp/.go-pipeline-active`가 글로벌 싱글톤.
여러 Claude Code 세션이 동시에 돌면:

1. 세션 A가 `/auto` 실행 중 마커 생성
2. 세션 B가 마커를 자기 것으로 오인하여 삭제
3. 세션 A의 Stop Hook이 작동하지 않음

design-principles #35("런타임 상태는 인스턴스에 귀속, 모듈 스코프 싱글톤 금지")와 동일한 구조 결함.

## 수정 방안

마커 파일에 세션 식별자를 포함:

```bash
# 생성 시
echo "$CLAUDE_SESSION_ID" > /tmp/.go-pipeline-active

# 삭제 시 (자기 것만)
if [ "$(cat /tmp/.go-pipeline-active 2>/dev/null)" = "$CLAUDE_SESSION_ID" ]; then
  rm /tmp/.go-pipeline-active
fi

# Stop Hook (자기 것만 반응)
if [ "$(cat /tmp/.go-pipeline-active 2>/dev/null)" = "$CLAUDE_SESSION_ID" ]; then
  # 파이프라인 계속
fi
```

## 확인 필요

- `CLAUDE_SESSION_ID` 환경변수가 실제로 존재하는지 (없으면 PID나 UUID 대안)
- `.claude/hooks/go-loop.sh`에서 세션 식별 가능한 값이 무엇인지
