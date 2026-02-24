---
description: Complex 항목을 자율적으로 해결하는 4단계 래더. /go에서 호출된다.
---

## /solve — Divide & Conquer Decision Ladder

> **What**: A 4-step Decision Ladder that autonomously resolves Complex items through decomposition, analysis, and integrative thinking.
> **Escalation**: Only when options are Mutually Exclusive AND Irreversible.
> **Test-first**: Assertion without evidence violates Empiricism — no execution without a test.

> **Classification**: Leaf workflow. Does not call other workflows. Recurses internally.

### Theoretical Basis

| Framework | Source | Role in /solve |
|-----------|--------|---------------|
| **Cynefin** | Dave Snowden | Domain assessment per item |
| **RCA / 5 Whys** | Toyota / Lean | Root cause identification before any fix |
| **TDD (Red-Green)** | XP / Kent Beck | Every Clear/Complicated item is executed test-first |
| **Decision Matrix** | PMBOK | Structured options evaluation with trade-offs |
| **Integrative Thinking** | Roger Martin | Synthesize opposing intents into a third option |
| **Problem Reframing** | Design Thinking | When all options are complex, reframe the problem |
| **Escalation** | ITIL / PM | Report to user only when autonomous resolution is impossible |

### Decision Ladder (execute in order)

#### Step 1: Root Cause Analysis & Cynefin Assessment

- ⚠️ **Gate**: No code changes before assessment is complete.
- Before touching code, output the following **RCA & Cynefin Assessment** in markdown:

```markdown
### 🔍 RCA & Cynefin Assessment
- **Symptom**: [what is broken / what needs to be done]
- **Root Cause**: [why it happened — apply 5 Whys]
- **Cynefin Domain**: [Clear / Complicated / Complex / Chaotic]
- **Evidence**: [logs, stack traces, relevant file:line references]
```

- Only after the assessment is output may tools be used to modify code.
- If assessed as **Complex** → decompose and delegate to `/divide` workflow.
- If assessed as **Clear / Complicated** → execute via **TDD Execution Protocol** below.

##### TDD Execution Protocol (Clear / Complicated items)

```
1. Red — Write test first
   - Declare the expected behavior as a test.
   - Derive from PRD Acceptance Criteria if available; otherwise the item itself is the spec.
   - Skip criteria: type-only changes, documentation, config changes.
     Record rationale when skipping.

2. Green — Minimal implementation
   - Write the minimum code to pass the test.
   - No workarounds or logic duplication. Verify SRP compliance.

3. Verify — All tests pass
   - Run new test + existing test suite.
   - On failure: fix in place. Do not misclassify failure as increased complexity.
     Do not proceed until green.
```

#### Step 2: Options Analysis (Decision Matrix)

- For remaining Complex items, enumerate options (A, B, C...).
- Evaluate each option's trade-offs using a Decision Matrix.
- ⚠️ **Complexity Guard — Problem Reframing**: If ALL options appear complex, the problem is likely misframed. Stop evaluating options and apply **5 Whys to the problem definition itself**. A simpler solution may emerge at the end of the causal chain.
- If one option has **overwhelming advantage** → select and execute via TDD Protocol. Record rationale.
- If a **known solution** exists (best practice, project precedent) → apply it.
- If a single option can be selected → **Resolved. Exit ladder.**

#### Step 3: Integrative Thinking (Synthesis)

- Extract the **intent (Why)** behind each opposing option.
- Search for a **third option (C)** that satisfies the intents of both A and B simultaneously.
- If C is found → execute via TDD Protocol. **Resolved. Exit ladder.**
- If C is not found → proceed to Step 4.

#### Step 4: Escalation — Report to User

- Reaching this step means all options satisfy ALL of the following:
  - ❌ Cannot be decomposed further
  - ❌ No overwhelming advantage (trade-offs are balanced)
  - ❌ Integrative Thinking failed (options are Mutually Exclusive)
  - ❌ Irreversible (cannot be undone)
- Only in this case: report to user and halt.
- Report format:
  ```
  ### /solve Escalation — Decision Required
  **Item**: [what]
  **Attempted**:
  - Step 1: [RCA & decomposition result]
  - Step 2: [Options Analysis result]
  - Step 3: [Integrative Thinking attempt result]
  **Remaining Options**:
  | Option | Intent | Irreversibility | Trade-off |
  **Why escalating**: [Mutually Exclusive + Irreversible — rationale]
  ```
