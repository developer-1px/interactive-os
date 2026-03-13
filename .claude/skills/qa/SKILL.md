---
description: 독립 QC agent를 실행한다. fresh context에서 블랙박스 출하 판정 (빌드 게이트 + spec 기반 독자 테스트 + 체크리스트).
---

## /qa → QC Agent 위임

> 이 스킬은 런처다. 실제 로직은 `.claude/agents/qa/AGENT.md`에 있다.
> QC = Quality Control (출하 판정). QA(품질 개선)가 아니다.

### 실행

`/go` Phase 3(Check)에서 자동 호출되거나, 사용자가 `/qa`를 직접 호출하면:

1. 대상 프로젝트의 BOARD.md 경로를 확인한다
2. Agent tool로 위임한다:

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [path]
    .claude/agents/qa/AGENT.md를 읽고 실행하라.
    결과를 체크리스트 + 리포트로 반환하라.
```

3. 반환된 판정을 호출자에게 전달한다

### FAIL 시

1. 체크리스트의 FAIL 항목을 개발 세션에 전달
2. 📦 QC 테스트를 개발 세션에 전달 → **중복 제거 후 내부 반영** (자산)
3. 수정 완료 → 재의뢰

### Meta 모드

BOARD.md Size = Meta이면 QC agent가 자동으로 Meta QC(문서 4게이트)를 실행한다.
별도 인자 불요 — AGENT.md가 Size 필드를 읽고 판단.
