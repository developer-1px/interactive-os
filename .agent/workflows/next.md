---
description: 다음 할 일을 자동으로 탐지하고, 기존 workflow 조합으로 실행한다.
---

1. **탐지 (Detect Next Action)**:
    - 우선순위 순서대로 신호를 확인한다. 첫 번째로 감지된 신호에서 멈춘다.

    **Priority 1 — 빌드/타입 에러**:
    // turbo
    - `npx tsc --noEmit 2>&1 | tail -20` 실행
    - 에러가 있으면 → **`/fix` workflow 실행** 후 다시 `/next`

    **Priority 2 — 실패하는 E2E 테스트**:
    // turbo
    - `npx playwright test --reporter=line 2>&1 | tail -20` 실행
    - 실패 테스트가 있으면 → 첫 번째 실패 테스트를 **`/diagnose` workflow로 분석** → 수정 → 커밋

    **Priority 3 — Inbox 미처리 문서**:
    - `docs/0-inbox/`에 미처리 문서가 있는지 확인
    - 있으면 → **`/para` workflow 실행** (actionable 분류 및 프로젝트 이동)

    **Priority 4 — task.md 미완료 항목**:
    - 현재 대화의 `task.md` 또는 `docs/1-project/` 내 체크리스트에서 `[ ]` 또는 `[/]` 항목 확인
    - 있으면 → 해당 작업을 직접 실행

    **Priority 5 — 할 일 없음**:
    - 위 모두 해당 없으면 → **`/todo` workflow 실행** (Now/Next/Later 제안)

2. **확인 (Confirm)**:
    - 탐지 결과를 사용자에게 보고: "다음은 [___]입니다. 시작할까요?"
    - 사용자 승인 시 해당 workflow 실행

3. **실행 후 커밋**:
    - 작업 완료 시 **`/cleanup` workflow 실행** (lint/type 정리)
    - `git add -A && git commit` 으로 커밋
    - "다음 `/next`를 실행할까요?" 로 루프 제안
