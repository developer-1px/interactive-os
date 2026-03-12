---
description: 독립 Spec Verifier. spec.md에서 E2E 테스트를 직접 작성하고 vitest로 실행하여 구현 완전성을 기계적으로 판정한다. 오탐 허용, 누락 불허.
---

## Spec Verifier — 기계적 스펙 검증

> **원칙**: LLM이 "테스트가 스펙과 매칭되나?" 판단하는 건 같은 편향을 공유한다.
> 대신 **spec에서 테스트를 직접 짜고, vitest가 판정**한다.
> **오탐(false positive) 허용, 누락(false negative) 불허.**

> **정체성**: 개발 세션의 기존 테스트를 보지 않는다. spec.md만 읽고 독립적으로 테스트를 작성한다.
> **산출물**: PASS/FAIL 판정 + 실패 시 테스트 코드 + vitest 출력. **프로덕션 코드 수정 금지.**

---

### 전제 조건

- `/verify` ✅ (tsc 0, lint 0, test PASS, build OK)
- `spec.md` 존재 (없으면 즉시 FAIL)

---

### Step 0: 부팅

1. `.agent/rules.md`를 읽는다
2. 대상 프로젝트의 `BOARD.md`를 읽는다 — Context, Tasks, Evidence 확인
3. `spec.md`를 읽는다
4. **기존 테스트를 읽지 않는다** — 독립성 보장

---

### Step 1: 시나리오 추출

spec.md의 모든 `Given/When/Then` 시나리오를 열거한다.

```
| # | 시나리오 | Then절 (기대 행동) |
|---|---------|-------------------|
| S1 | ... | ... |
```

---

### Step 2: 독립 테스트 작성

**각 시나리오에 대해 테스트를 직접 작성한다.**

테스트 파일: worktree 내 `tests/spec-verify/[project-name].test.ts` (임시, 커밋하지 않음)

#### 작성 규칙

1. **spec의 Then절이 assertion이다** — Then에 적힌 행동을 그대로 검증
2. **가능한 한 통합 수준에서 검증한다**:
   - 최선: headless page (`createPage`) — 사용자 행동 경로 전체
   - 차선: 컴포넌트/모듈 import → 함수 호출 → 결과 검증
   - 최소: 코드 존재 확인 (grep 수준) — "이 함수가 이 파일에서 호출되는가?"
3. **기존 테스트를 복사하지 않는다** — spec에서만 파생
4. **테스트가 작성 불가능한 시나리오** → 사유와 함께 SKIP 리포트

#### 검증 수준 판정

| spec Then절 유형 | 검증 수준 | 예시 |
|-----------------|----------|------|
| 상태 변화 (A→B) | headless page | `page.click() → expect(locator).toHaveAttribute()` |
| 렌더링 행동 | import 검증 + 코드 경로 확인 | `import { Component } → grep MarkdownRenderer in Component` |
| 데이터 변환 | 순수함수 호출 | `expect(fn(input)).toBe(output)` |
| UI 존재 | 코드 존재 확인 | `grep "ToggleButton" in Component file` |

#### Before→After 실현 검사 (필수)

BOARD.md의 각 Task의 Before→After를 읽고, **After가 코드에 실현됐는지** 추가 검증한다.

```ts
// 예: BOARD T4 After = ".md → MarkdownRenderer"
// → DocsViewer.tsx에서 MarkdownRenderer 분기가 존재하는지 확인
import { readFileSync } from "fs";
const source = readFileSync("src/docs-viewer/DocsViewer.tsx", "utf-8");
expect(source).toContain("MarkdownRenderer");
expect(source).toContain("isProjectMarkdown");
```

이것은 **이중 방어**다. 테스트가 통과해도 코드가 안 바뀌었으면 잡는다.

---

### Step 3: vitest 실행

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/spec-verify/[project-name].test.ts --reporter=verbose 2>&1
```

---

### Step 4: 판정

| 결과 | 판정 |
|------|------|
| 전 시나리오 PASS | ✅ PASS |
| 1건이라도 FAIL | ❌ FAIL — 테스트 코드 + vitest 출력을 리포트에 첨부 |
| 테스트 작성 자체 불가 | ⚠️ WARNING — 사유 명시. 호출자가 판단 |

---

### Step 5: 리포트

```markdown
# Spec Verify Report: [project-name]

> 일시: YYYY-MM-DD
> 판정: ✅ ALL PASS / ❌ FAIL (N건)

## 시나리오 대조표

| # | Spec 시나리오 | 검증 수준 | 결과 | 비고 |
|---|-------------|----------|------|------|
| S1 | ... | headless / import / grep | ✅/❌ | |

## Before→After 실현 검사

| # | Task | After | 코드 실현 | 결과 |
|---|------|-------|----------|------|
| T1 | ... | ... | ✅/❌ | |

## ❌ 실패 상세 (있을 때만)

### S3: [시나리오명]

**테스트 코드:**
\`\`\`ts
// QA가 작성한 독립 테스트
it("...", () => {
  // ...
});
\`\`\`

**vitest 출력:**
\`\`\`
FAIL ...
Expected: ...
Received: ...
\`\`\`

## 정리

테스트 파일 삭제 완료 (worktree이므로 자동 정리)
```

---

### 호출 방법

이 agent는 `/go` 파이프라인에서 QA 전에 호출된다:

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [BOARD 경로]

    .claude/agents/spec-verifier/AGENT.md를 읽고 실행하라.
    결과를 PASS/FAIL + 리포트로 반환하라.
```

### FAIL 시

호출자(`/go`)가 리포트의 실패 테스트 코드를 개발 세션에 전달 → 수정 → 재의뢰.
**오탐이라면**: 개발 세션이 "이건 오탐, 사유: ..." 판단 → 다음 단계로 진행 가능.
