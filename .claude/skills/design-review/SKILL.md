---
description: 아키텍처 Red Team agent를 실행한다. 폴더 구조, LOC, 네이밍, 의존성, 설계 긴장을 fresh context에서 진단.
---

## /design-review → Agent 위임

> 이 스킬은 런처다. 실제 로직은 `.claude/agents/design-review/AGENT.md`에 있다.

### 실행

사용자가 `/design-review [범위]`를 호출하면:

1. 범위를 확인한다 (인자가 있으면 해당 경로, 없으면 프로젝트 전체)
2. Agent tool로 위임한다:

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    범위: [path]
    .claude/agents/design-review/AGENT.md를 읽고 실행하라.
    결과를 Design Tension Report로 반환하라.
```

3. 반환된 리포트를 사용자에게 전달한다
