# /plan — /auto 마커 세션 격리

> Date: 2026-03-06
> Trigger: /discussion Clear — 여러 세션의 /auto가 서로 간섭하지 않도록
> 선례: Jon Roosevelt "Ghost in the Machine" 3-script 패턴

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `.claude/hooks/session-start.sh` (신규) | 없음 | stdin JSON에서 `session_id` 파싱 → `CLAUDE_ENV_FILE`에 export | Clear | — | 새 세션에서 `echo $CLAUDE_SESSION_ID` 출력 확인 | CLAUDE_ENV_FILE 미지원 시 silent fail |
| 2 | `.claude/settings.local.json` | `hooks.Stop`만 등록 | `hooks.SessionStart` 추가 | Clear | →#1 | JSON 유효 | — |
| 3 | `.claude/commands/auto.md` | `touch /tmp/.go-pipeline-active` | `echo "$CLAUDE_SESSION_ID" > /tmp/.go-pipeline-$CLAUDE_SESSION_ID` + fallback | Clear | →#1 | /auto → 세션별 마커 생성 | CLAUDE_SESSION_ID 없으면 fallback UUID |
| 4 | `.claude/hooks/go-loop.sh` | 글로벌 마커 확인 + rm -f | stdin session_id → 세션별 마커 확인 + 자기 것만 삭제 | Clear | →#1 | 세션 A /auto 중 세션 B 종료 → A 마커 무사 | — |

## MECE

1. CE: 4행 실행 → 세션별 마커 격리 ✅
2. ME: 중복 없음
3. No-op: 없음

## 라우팅

승인 후 → `/go` (Meta — `.claude/` 인프라 수정, 4파일)
