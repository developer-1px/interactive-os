---
description: Goal에서 역추적하여 Work Package를 도출한다. /solve의 입력을 만든다.
---

## /divide — Goal-Driven Backward Chaining Spike

> **What**: 목표에서 역추적하여 미충족 전제조건을 재귀적으로 분해.
> **Output**: 모든 leaf가 ✅(충족) 또는 🔨(Work Package)인 전제조건 트리.
> **Constraint**: 코드 변경 없음. 최소 3 iteration. 모든 판정에 코드 증거.

### Theoretical Basis

| Framework | Source | Role |
|-----------|--------|------|
| **Backward Chaining** | AI/Logic Programming | Goal → 전제조건 역추론 |
| **Problem Framing** | Optimization Theory | Constraints / Variables / Objective 구분 |
| **Empiricism** | Scrum | 모든 판정은 코드 증거 기반 |

### Step 0: Problem Framing

Goal, Constraints, Variables를 정의한다.

1. **먼저 스스로 추론한다**:
   - BOARD.md, discussion, 대화 맥락, 코드를 읽고 3요소를 추론
   - 각 항목에 **확신도**를 표기: 🟢 확실 / 🟡 추정 / 🔴 모름

2. **추론한 전제로 Procedure를 끝까지 실행한다** (중간에 멈추지 않음)

3. **Report 완성 후** 🟡/🔴 항목이 있으면 결과와 함께 확인:
   "이 전제로 분해했습니다. 🟡 항목이 맞는지 확인해주세요."

### Procedure

```
begin spike:
  goal ← Objective (Step 0에서 확정)

  function solve(subgoal, depth):

    // 1. 이미 충족인가?
    evidence ← grep_search / view_file로 코드 확인
    if subgoal is satisfied:
      return ✅ Clear

    // 2. 이게 되려면 뭐가 필요한가? (역추론)
    preconditions ← "이 subgoal이 충족되려면?" 분해
    // 각 precondition은 MECE

    // 3. constraints 위반 체크
    for each precondition:
      if precondition violates Constraints:
        flag ⚠️ conflict → 대안 탐색

    // 4. 각 precondition을 재귀
    for each precondition:
      solve(precondition, depth + 1)

    // leaf: 더 분해할 수 없고 미충족 → Work Package
    return 🔨 Work Package

  solve(goal, 0)
end spike → deliver report
```

### Code Investigation Protocol

| 판정 | Tool | 목적 |
|------|------|------|
| 충족 여부 | `grep_search` → `view_file` | subgoal이 이미 코드에 존재하는가? |
| 전제조건 도출 | `view_file_outline` | 구조를 보고 역추론 |
| 증거 확정 | `view_code_item` | 충족/미충족 근거 |

### Report Format

```markdown
## /divide Report — [Goal 1문장]

### Problem Frame

| | 내용 |
|---|------|
| **Objective** | ... |
| **Constraints** | ... |
| **Variables** | ... |

### Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | [goal] | ❌ | — | → A, B |
| 1 | A | ✅ | `file:L42` | — |
| 1 | B | ❌ | — | → B1, B2 |
| 2 | B1 | ✅ | `file:L100` | — |
| 2 | B2 | ❌ | — | 🔨 Work Package |

### Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence |
|----|---------|-------------------|----------|
| B2 | ... | Goal ← B ← B2 | `file:L200` |

### Residual Uncertainty

- (none, or list)
```

### Definition of Done

- [ ] Problem Frame 3요소 확정 (Objective, Constraints, Variables)
- [ ] 모든 leaf가 ✅ 또는 🔨
- [ ] 최소 depth 3 도달
- [ ] 모든 판정에 코드 증거
- [ ] Constraints 위반 없음 (또는 ⚠️ flagged)
- [ ] Report 저장: `docs/1-project/[project-name]/REPORT.md`
