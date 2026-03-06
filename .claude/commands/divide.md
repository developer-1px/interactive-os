---
description: Goal에서 역추적하여 Work Package를 도출한다. /solve의 입력을 만든다.
---

## /divide — Goal-Driven Backward Chaining

> **What**: 목표에서 역추적하여 미충족 전제조건을 재귀적으로 분해.
> **Output**: 모든 leaf가 ✅(충족) 또는 🔨(Work Package)인 전제조건 트리.
> **Constraint**: 코드 변경 없음. 모든 판정에 코드 증거.

### 핵심 규칙

1. **매 턴 하나의 subgoal만 처리한다**:
   - **Investigate**: 현재 subgoal에 대해 코드 증거를 조사
   - **Judge**: 충족(✅) / 미충족(❌) / 불확실(❓) 판정
   - **Decompose 또는 Gap**: 미충족이면 전제조건 분해 제안, 불확실이면 Gap 질문
   - ⛔ 여러 subgoal을 한 턴에 몰아서 처리하지 않는다.

2. **Cynefin 게이트 — 산출물 전 필수**:
   - 매 턴 끝에 Cynefin을 판정한다.
   - **Clear가 아니면 Report를 만들지 않는다.** Gap 질문으로 불확실성을 해소한다.
   - Cynefin 기준: **"이 분해가 MECE인가? 빠진 가지는 없는가?"**

3. **AI가 판단을 먼저 밝힌다**:
   - 분해 방향, 충족 판정 등에서 AI의 추천 + 이유를 먼저 제시한 뒤 확인을 구한다.
   - "어떻게 할까요?"로 끝내지 않는다.

4. **leaf 기준**:
   - 🔨 Work Package는 **한 `/solve` 세션에 해결 가능한 크기**여야 한다.
   - 그보다 크면 더 분해한다. 그보다 작으면 상위 WP에 합친다.

### 🚀 Cynefin 라우팅

| Cynefin | 상황 | 행동 |
|---------|------|------|
| 🔴 **Complex — 정보 부족** | 판정에 필요한 정보가 없다 | Gap 질문 (계속 `/divide`) |
| 🔴 **Complex — 충돌 감지** | Constraints끼리, 또는 Constraint와 현실이 충돌 | → `/conflict` (해소 후 `/divide` 복귀) |
| 🔴 **Complex — 선택 불가** | 분해 방향이 2개 이상, 근거로 결정 불가 | → `/blueprint` (해소 후 `/divide` 복귀) |
| 🔴 **Complex — Goal 의문** | 분해하다 Goal 자체가 잘못됐다고 판단 | → `/discussion` 복귀 (Goal 재정의) |
| 🟡 **Complicated** | 방향은 잡혔으나 더 분해 필요 | 다음 subgoal로 진행 |
| 🟢 **Clear** | 모든 leaf 판정 완료, MECE 확인 | Report 작성 → `/go` 제안 |

> `/conflict`, `/blueprint`는 **탈출 밸브**다. 해소 후 `/divide`로 복귀하여 분해를 이어간다.
> `/discussion` 복귀는 **Goal 자체의 재검토**가 필요할 때만. 분해를 포기하는 것이 아니라 출발점을 바로잡는 것이다.

### Phases

#### Phase 0: Problem Frame

Goal, Constraints, Variables를 정의한다.

1. 대화 맥락, BOARD.md, 코드를 읽고 3요소를 추론
2. 각 항목에 확신도 표기: 🟢 확실 / 🟡 추정 / 🔴 모름
3. Cynefin 판정:
   - **Complicated 이상이면 Phase 1 진입 허용** (🟡 추정 항목은 분해하면서 선명해진다)
   - Complex면 Gap 질문으로 최소한의 방향을 잡는다
   - ⛔ Phase 0에서 Clear를 요구하지 않는다 — 코드를 봐야 선명해지는 것들이 있다

#### Phase 1: Backward Chain

매 턴 하나의 subgoal을 처리하며, 전제조건을 분해한다.

**턴 사이클:**
1. 현재 subgoal을 선택한다
2. `grep_search` → `view_file`로 코드 증거를 조사한다
3. 판정한다: ✅ 충족 / ❌ 미충족 / ❓ 불확실
4. ❌이면: "이게 되려면?" 역추론 → 전제조건(MECE)을 제안
5. ❓이면: Gap 질문
6. Constraints 위반 감지 시: ⚠️ flag → Cynefin 라우팅
7. 누적 구조 업데이트 + Cynefin 판정

**Depth-1 분해 후 반드시 사용자에게 큰 가지를 확인받는다.**

#### Phase 2: Work Packages → Exit

모든 leaf 판정 완료, Cynefin = 🟢 Clear 도달 시:
1. Report 작성
2. `/go` 제안

### 누적 구조 (매 턴 끝에 표시)

| 요소 | 내용 |
|------|------|
| **📌 Current Subgoal** | 지금 처리 중인 subgoal |
| **🌳 Current Path** | root → ... → current (현재 위치까지의 경로만) |
| **🆕 This Turn** | 이번 턴에 변경된 판정 (✅/❌/🔨) |
| **📋 Evidence** | E1. ... / E2. ... (NEW) — 누적 |
| **⚖️ Cynefin** | Clear / Complicated / Complex + 근거 |
| **🚀 Next** | Cynefin 라우팅 결과 |
| **❓ Gap** | 질문 (Clear가 아닐 때) |

### Code Investigation Protocol

| 판정 | Tool | 목적 |
|------|------|------|
| 충족 여부 | `grep_search` → `view_file` | subgoal이 이미 코드에 존재하는가? |
| 전제조건 도출 | `view_file_outline` | 구조를 보고 역추론 |
| 증거 확정 | `view_code_item` | 충족/미충족 근거 |

### Report Format (🟢 Clear 도달 시에만 작성)

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
| 0 | [goal] | ❌ | — |
| 1 | A | ✅ | `file:L42` |
| ...

### Work Packages

| WP | Subgoal | Chain (왜 필요한가) | Evidence |
|----|---------|-------------------|----------|
| 1 | ... | Goal ← B ← B2 | `file:L200` |

### Residual Uncertainty

- (none, or list)
```

### Definition of Done

- [ ] Problem Frame 3요소 Complicated 이상
- [ ] 모든 leaf가 ✅ 또는 🔨
- [ ] 🔨은 한 `/solve` 세션 크기
- [ ] 모든 판정에 코드 증거
- [ ] Constraints 위반 없음 (또는 `/conflict`로 해소됨)
- [ ] 최종 Cynefin = 🟢 Clear
- [ ] Report 저장: `docs/1-project/[project-name]/REPORT.md`
- [ ] `/go` 제안
