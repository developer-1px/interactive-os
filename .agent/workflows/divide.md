---
description: 실행 없이 Cynefin 분해 보고서만 작성한다. /solve의 입력을 만든다.
---

## /divide — Technical Spike · MECE Issue Tree

> **What**: Cynefin-guided Technical Spike (XP) that produces a MECE Issue Tree decomposed to Work Package level (WBS).
> **Output**: Issue Tree where every leaf node is Clear + Hypothesis Statement per leaf.
> **Constraint**: No code changes. No user interaction mid-process. Minimum 3 iterations.

### Theoretical Basis

| Framework | Source | Role in /divide |
|-----------|--------|----------------|
| **Cynefin** | Dave Snowden | Domain assessment per node (Clear / Complicated / Complex) |
| **WBS Decomposition** | PMI PMBOK | Decompose until every leaf is a Work Package |
| **MECE** | McKinsey | Decomposition dimension must be Mutually Exclusive, Collectively Exhaustive |
| **Issue Tree** | Strategy Consulting | Recursive branching structure for problem decomposition |
| **Spike** | Extreme Programming | Deliverable is knowledge, not code |
| **Empiricism** | Scrum | Every assessment must be evidence-based — no speculation |

### Procedure

```
begin spike:
  queue ← [initial problem as root node]
  iteration ← 0

  while (queue has Complicated or Complex nodes) {

    node ← select node with max uncertainty (triage)

    // — Cynefin Domain Assessment —
    match classify(node):

      case Complex:
        // Probe–Sense–Respond (Cynefin PSR)
        probe   → view_file_outline to map structure
        sense   → choose MECE decomposition dimension
                   (module / responsibility / layer / state)
        respond → branch Issue Tree → enqueue child nodes

      case Complicated:
        // Sense–Analyze–Respond (Cynefin SAR)
        sense   → grep_search to trace code paths
        analyze → view_file to confirm logic
        respond → reclassify as Clear, record Hypothesis Statement (1 sentence)

      case Clear:
        // Verify — view_code_item to validate hypothesis
        record Hypothesis Statement + code location as evidence

    iteration++
  }

  // Progressive Elaboration gate
  if (iteration < 3) {
    // Verification iteration: re-validate Clear nodes against code
    continue loop
  }

end spike → deliver report
```

### Code Investigation Protocol

**Evidence-based assessment — no speculation.** Every iteration must include reading actual code.

| Cynefin Domain | Cynefin Cycle | Tool | Goal |
|----------------|---------------|------|------|
| Complex | Probe–Sense–Respond | `view_file_outline` | Choose MECE dimension → branch |
| Complicated | Sense–Analyze–Respond | `grep_search` → `view_file` | Reclassify as Clear |
| Clear | Verify | `view_code_item` | Validate Hypothesis Statement |

### Report Output

**저장 경로**: `docs/1-project/[project-name]/REPORT.md`
- BOARD.md가 있는 프로젝트 폴더와 같은 레벨에 생성한다.
- 이미 REPORT.md가 존재하면 덮어쓴다 (최신 분석이 우선).
- 프로젝트 폴더를 특정할 수 없으면 사용자에게 한 번만 확인한다.

### Report Format (Issue Tree)

```markdown
## /divide Report — [Topic]

### Iteration Log

| # | Node | Before | After | Cynefin Cycle | Action |
|---|------|--------|-------|---------------|--------|
| 1 | [node] | Complex | → 3 children | PSR | MECE split by [dimension] |
| 2 | [child] | Complicated | Clear | SAR | Found [what] in [file] |
| 3 | [child] | Clear | Clear (verified) | Verify | Confirmed at [file:line] |

### Issue Tree (Final)

| Leaf Node (Work Package) | Hypothesis Statement | Evidence (code location) |
|--------------------------|---------------------|------------------------|
| A | ... | `path/to/file.ts:L42` |
| B | ... | `path/to/file.ts:L100` |

### Residual Uncertainty

- (none, or list remaining unknowns)
```

### Definition of Done

- [ ] Every leaf node is Clear (Work Package level)
- [ ] Minimum 3 iterations completed (Progressive Elaboration)
- [ ] Every iteration includes code reading (Evidence recorded)
- [ ] MECE validation: leaf nodes collectively exhaust the problem
- [ ] No user interaction during spike (Spike principle)
- [ ] Report saved to `docs/1-project/[project-name]/REPORT.md`
