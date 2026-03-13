---
description: /go 파이프라인을 자율 모드로 실행한다. Stop Hook이 종료를 차단하여 Done 마킹까지 멈추지 않는다.
---

## /auto — 자율 파이프라인 실행

> `/auto`는 `/go`의 자율 실행 버전이다.
> Stop Hook이 활성화되어, 각 워크플로우 완료 시 멈추지 않고 다음 단계로 자동 진행한다.
> Done 마킹에 도달하면 자동 종료. `/archive`는 사용자 수동 호출.

### 핵심 원리

```
/auto [target] = 마커 ON + target 실행
```

- **target 기본값**: `/go`
- **지원 target**: `/go`, `/go --os`, `/wip`

1. 마커 파일을 생성한다 (target 포함) → Stop Hook이 활성화됨
2. target 스킬을 실행한다
3. 워크플로우 완료 시 멈추려 하면 → Stop Hook이 "계속하라"고 지시
4. 종료 조건 도달 시 마커 삭제 → 정상 종료
   - `/go` target: Done 마킹(`/retrospect` 완료) 시 삭제
   - `/wip` target: 사용자 Ctrl+C 또는 context 소진 시 삭제

### 실행

**Step 1**: 마커 활성화

인자에서 target을 파싱한다. 인자가 없으면 기본값 `go`.

```bash
# 세션별 격리: CLAUDE_SESSION_ID가 있으면 사용, 없으면 UUID 생성
GO_ID="${CLAUDE_SESSION_ID:-$(uuidgen)}"
TARGET="${1:-go}"  # 인자에서 target 파싱 (go, go --os, wip)
echo "$TARGET" > "/tmp/.go-pipeline-${GO_ID}"
echo "GO_PIPELINE_ID=$GO_ID TARGET=$TARGET"
```

위 Bash 명령을 실행한다. 출력된 `GO_PIPELINE_ID`와 `TARGET`을 기억한다.

**Step 2**: target 스킬 실행

| target | 행동 |
|--------|------|
| `/go` | `.claude/skills/go/SKILL.md`를 읽고 실행. 기존과 동일 |
| `/go --os` | `/go`를 `--os` 플래그와 함께 실행. OS 설계 모드: usage→stub→red→green |
| `/wip` | `.claude/skills/wip/SKILL.md`를 읽고 실행. 한 사이클 완료(Clear→execute 또는 Complex→pushback) 후 **다시 `/wip`을 반복** |

- `/wip` target 시 루프: `/wip` 한 사이클 완료 → stop hook이 재개 지시 → `/wip` 재실행 (새 백로그 항목 선택)
- `/go` target 시: 기존 `/auto` 동작과 동일

### 안전장치

- **Ctrl+C**: 사용자가 언제든 중단 가능
- **`stop_hook_active=true`**: 무한루프 방지. Hook이 한 번 잡았는데 또 멈추면 마커를 삭제하고 종료 허용
- **수동 해제**: `rm /tmp/.go-pipeline-*`로 마커 수동 삭제 가능

### 유효 범위

- **`/auto`의 자율 실행은 단일 context window 내에서만 유효하다.**
- 세션이 context 소진으로 끊기면, 마커는 살아있지만 context가 리셋된다.
- 재개 시: 사용자가 `/go`를 다시 호출하면 BOARD.md 기반으로 상태 복원 후 재개.
- 즉, 세션 간 상태 복원의 실질 메커니즘은 마커가 아니라 **BOARD.md의 Now/Done**.

### 주의

- `/auto` (또는 `/auto /go`)는 `/discussion` Clear 이후에만 사용한다
- `/auto /wip`은 언제든 사용 가능 — 백로그 자율 숙성 루프
- 대화형 작업(discussion, elicit 등)에는 `/go`를 쓴다
- `/auto` 실행 중에는 사용자 입력 없이 자율 진행된다
