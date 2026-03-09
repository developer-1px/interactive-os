---
description: 논의 도구. 복잡한 문제를 이해하기 위해 Goal에서 역추적하여 분해한다. 실행 계획은 /plan이 담당.
---

## /divide — Goal-Driven Backward Chaining

> **What**: 목표에서 역추적하여 미충족 전제조건을 재귀적으로 분해.
> **Output**: 모든 leaf가 ✅(충족) 또는 🔨(Work Package)인 전제조건 트리.
> **Constraint**: 코드 변경 없음. 모든 판정에 코드 증거.

### 핵심 규칙

1. **AI가 먼저 전체를 조사하고, 결과를 한번에 보여준다**:
   - 코드를 읽고, 증거를 모으고, 분해를 완료한 뒤 → 추론 과정 + Task + 근거를 제시
   - ⛔ subgoal 하나마다 사용자에게 물어보지 않는다.
   - 사용자에게 묻는 건 **Gap(불확실한 부분)만**.

2. **Cynefin 게이트 — Complex에서만 멈춘다**:
   - Complicated(방향은 잡힘, 더 분해 필요)는 **알아서 진행**.
   - **Complex(진짜 정보 부족 · 진짜 충돌 · 진짜 선택 불가)에서만 멈추고 물어본다.**

3. **AI가 판단을 먼저 밝힌다**:
   - 분해 방향, 충족 판정 등에서 AI의 추천 + 이유를 먼저 제시한 뒤 확인을 구한다.
   - "어떻게 할까요?"로 끝내지 않는다.

4. **leaf 기준**:
   - 🔨 Work Package는 **한 턴에 해결 가능한 크기**여야 한다.
   - 그보다 크면 더 분해한다. 그보다 작으면 상위 WP에 합친다.

### 🚀 Cynefin 라우팅

| Cynefin | 상황 | 행동 |
|---------|------|------|
| 🔴 **Complex — 정보 부족** | 판정에 필요한 정보가 없다 | Gap 질문 (멈춤) |
| 🔴 **Complex — 충돌 감지** | Constraints끼리, 또는 Constraint와 현실이 충돌 | → `/conflict` (해소 후 `/divide` 복귀) |
| 🔴 **Complex — 선택 불가** | 분해 방향이 2개 이상, 근거로 결정 불가 | → `/blueprint` (해소 후 `/divide` 복귀) |
| 🔴 **Complex — Goal 의문** | 분해하다 Goal 자체가 잘못됐다고 판단 | → `/discussion` 복귀 (Goal 재정의) |
| 🟡 **Complicated** | 방향은 잡혔으나 더 분해 필요 | **알아서 진행** (멈추지 않음) |
| 🟢 **Clear** | 모든 leaf 판정 완료 | Report 작성 → `/go` 제안 |

> `/conflict`, `/blueprint`는 **탈출 밸브**다. 해소 후 `/divide`로 복귀하여 분해를 이어간다.
> `/discussion` 복귀는 **Goal 자체의 재검토**가 필요할 때만.

### Procedure

#### Step 1: Problem Frame (합의 게이트)

Goal, Constraints, Variables를 정의한다.

1. 대화 맥락, BOARD.md, 코드를 읽고 3요소를 추론
2. 각 항목에 확신도 표기: 🟢 확실 / 🟡 추정 / 🔴 모름
3. 사용자에게 제시하고 확인받는다

> **이것이 유일한 사전 합의 게이트다.** 이후는 자율 조사.

#### Step 2: 자율 조사 (Backward Chain)

Problem Frame 확인 후, AI가 **알아서 전체를 조사**한다.

1. Goal에서 역추론: "이게 되려면?" → 전제조건(MECE) 분해
2. 각 전제조건을 `grep_search` → `view_file`로 코드 증거 조사
3. 충족(✅) / 미충족(❌) / 불확실(❓) 판정
4. 미충족이면 재귀적으로 더 분해
5. leaf(더 분해 불가 + 미충족)는 🔨 Work Package로 표기
6. 조사 중 Complex 발견 시 → 해당 지점을 ❓로 마킹하고 계속 진행

#### Step 3: 결과 제시

자율 조사가 끝나면, **한번에 전체를 보여준다**:

```
### 추론 과정
[Goal에서 어떻게 분해했는지, 왜 이 가지를 선택했는지]

### Backward Chain
| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| 0     | [goal]  | ❌   | —        |
| 1     | A       | ✅   | `file:L42` |
| 1     | B       | ❌   | —        |
| 2     | B1      | ✅   | `file:L100` |
| 2     | B2      | ❌   | —        |
| ...

### Work Packages
| WP | Subgoal | Chain (왜 필요한가) | Evidence |
|----|---------|-------------------|----------|
| 1  | B2      | Goal ← B ← B2    | `file:L200` |

### ❓ Gaps (확인 필요)
- [불확실한 판정들, 사용자에게 물어볼 것]
```

#### Step 4: Gap 해소 → Clear

- Gap이 있으면: 사용자에게 물어보고, 답변 반영 후 트리 업데이트
- Gap이 없으면: 바로 Clear → Report 확정
- 사용자가 분해에 동의하지 않으면: 해당 가지만 재조사

#### Step 5: Exit

Cynefin = 🟢 Clear 도달 시:
1. Report 확정 + 저장
2. `/go` 제안

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

| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| ...

### Work Packages

| WP | Subgoal | Chain (왜 필요한가) | Evidence |
|----|---------|-------------------|----------|
| ...

### Residual Uncertainty

- (none, or list)
```

### Definition of Done

- [ ] Problem Frame 합의 완료
- [ ] 모든 leaf가 ✅ 또는 🔨
- [ ] 🔨은 한 턴에 해결 가능한 크기
- [ ] 모든 판정에 코드 증거
- [ ] Constraints 위반 없음 (또는 `/conflict`로 해소됨)
- [ ] Gap 해소 완료
- [ ] Report 저장: `docs/1-project/[project-name]/REPORT.md`
- [ ] `/go` 제안
