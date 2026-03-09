---
description: /go 파이프라인을 자율 모드로 실행한다. Stop Hook이 종료를 차단하여 /archive까지 멈추지 않는다.
---

## /auto — 자율 파이프라인 실행

> `/auto`는 `/go`의 자율 실행 버전이다.
> Stop Hook이 활성화되어, 각 워크플로우 완료 시 멈추지 않고 다음 단계로 자동 진행한다.
> `/archive`에 도달하면 자동 종료.

### 핵심 원리

```
/auto = 마커 ON + /go
```

1. 마커 파일을 생성한다 → Stop Hook이 활성화됨
2. `/go` 파이프라인을 그대로 실행한다
3. 워크플로우 완료 시 멈추려 하면 → Stop Hook이 "계속하라"고 지시
4. `/archive` 단계에서 마커 삭제 → 정상 종료

### 실행

**Step 1**: 마커 활성화

```bash
# 세션별 격리: CLAUDE_SESSION_ID가 있으면 사용, 없으면 UUID 생성
GO_ID="${CLAUDE_SESSION_ID:-$(uuidgen)}"
echo "$GO_ID" > "/tmp/.go-pipeline-${GO_ID}"
echo "GO_PIPELINE_ID=$GO_ID"
```

위 Bash 명령을 실행한다. 출력된 `GO_PIPELINE_ID`를 기억한다 — 이후 마커 삭제 시 사용.

**Step 2**: `/go` 파이프라인 진입

`.claude/skills/go/SKILL.md`를 읽고 그대로 실행한다.
`/go`의 모든 규칙이 동일하게 적용된다.

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

- `/auto`는 `/discussion` Clear 이후에만 사용한다
- 대화형 작업(discussion, elicit 등)에는 `/go`를 쓴다
- `/auto` 실행 중에는 사용자 입력 없이 자율 진행된다
