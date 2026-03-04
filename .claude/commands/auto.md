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
touch /tmp/.go-pipeline-active
```

위 Bash 명령을 실행한다.

**Step 2**: `/go` 파이프라인 진입

`.claude/commands/go.md`를 읽고 그대로 실행한다.
`/go`의 모든 규칙이 동일하게 적용된다.

### 안전장치

- **Ctrl+C**: 사용자가 언제든 중단 가능
- **`stop_hook_active=true`**: 무한루프 방지. Hook이 한 번 잡았는데 또 멈추면 마커를 삭제하고 종료 허용
- **수동 해제**: `rm /tmp/.go-pipeline-active`로 마커 수동 삭제 가능

### 주의

- `/auto`는 `/discussion` Clear 이후에만 사용한다
- 대화형 작업(discussion, elicit 등)에는 `/go`를 쓴다
- `/auto` 실행 중에는 사용자 입력 없이 자율 진행된다
