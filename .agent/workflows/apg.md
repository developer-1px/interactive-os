---
description: W3C APG 스펙 기반으로 APG 패턴을 구현·검증한다. 스펙이 유일한 근거다. 즉흥 금지.
---

## /apg — W3C APG 패턴 구현 워크플로우

> **원칙**: W3C APG Example이 **유일한 근거**다. Example의 표와 코드를 그대로 따른다.
> **산출물**: `{pattern}.apg.md` (DT + Example Source) + `{pattern}.apg.test.ts` (Playwright-subset)
> **금지**: 스펙을 읽지 않고 기억이나 추측으로 테스트를 작성하는 것. 카테고리 재발명 금지.
> **표준 참조**: `tests/apg/accordion.apg.md` — 이 파일이 포맷의 정답이다.

---

### Step 0: 대상 패턴 확인

1. 어떤 APG 패턴을 다룰지 확인한다.
2. **Example이 여러 개인가?** (e.g., Tabs: Auto + Manual)
   - 1 Example → `{pattern}.apg.md`
   - N Examples → `{pattern}-{example}.apg.md` (각각 분리)
3. 기존 구현 확인: Showcase 컴포넌트? 테스트 파일? `.apg.md`?

---

### Step 1: W3C APG Example 페이지 읽기 (필수)

> **Example 페이지가 진실이다.** Pattern 페이지(개요)가 아니라 Example 페이지를 읽는다.

```
URL: https://www.w3.org/WAI/ARIA/apg/patterns/{pattern}/examples/{example}/
```

**3개 섹션을 반드시 읽는다**:

1. **Keyboard Interaction** 표 → DT Keyboard 섹션의 소스
2. **Role, Property, State, and Tabindex Attributes** 표 → DT ARIA Attributes 섹션의 소스
3. **Example HTML/JS/CSS** → `.apg.md` Example Source 섹션에 verbatim 복사

---

### Step 2: `.apg.md` 작성 — Decision Table + Example Source

> **DT 행 1개 = `it()` 1개.** 이것이 핵심 강제 메커니즘이다.
> **누락 검증 = W3C 표의 행 수 vs DT 행 수.** 숫자 불일치 = 누락.

파일: `tests/apg/{pattern}.apg.md` (또는 `{pattern}-{example}.apg.md`)

**DT 행의 3개 소스**:

| 소스 | DT 섹션 | 예시 |
|------|---------|------|
| W3C Keyboard Interaction 표 | `### Keyboard` | K1-Kn |
| W3C ARIA Attributes 표 | `### ARIA Attributes` | A1-An |
| Example 코드의 암묵적 행동 | `### Initial State`, `### Panel Sync`, `### Click` 등 | I1-In, P1-Pn, C1-Cn |

**DT 컬럼 (Keyboard/Click 등)**:

```
| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
```

- **Setup**: Playwright API로 기술 (`click("#id")`, `press("ArrowDown")`)
- **Input**: 하나의 키/클릭
- **Assert**: Playwright 검증 (`"#id" aria-expanded="true"`, `"#id" toBeFocused`)
- **W3C Wording**: 원문 verbatim 인용
- **Test**: `it()` 블록의 테스트 이름

**Signal (Traffic Light)**:

| Signal | Meaning |
|--------|---------|
| 🟢 | test exists + passes |
| 🔴 | test exists + fails (OS gap 또는 구현 미완) |
| ⬜ | not covered (no test) |
| ➖ | N/A (browser default, React rendering layer 등) |

**Coverage 섹션** (파일 하단):

```
🟢 20  🔴 1  ➖ 3  total 24
```

**Example Source 섹션**: W3C Example의 HTML, JavaScript, CSS를 verbatim 복사.

---

### Step 3: `.apg.test.ts` 작성 — Playwright-subset API

> DT의 각 행을 `it()` 블록으로 변환한다. DT에 없는 테스트를 쓰지 않는다.

파일: `tests/apg/{pattern}.apg.test.ts`

**API (Playwright-subset)**:

```typescript
import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";

const page = createPage(App, Component);
page.goto("/");

// Interaction
await page.locator("#id").click();
await page.keyboard.press("ArrowDown");

// Assertion
await expect(page.locator("#id")).toBeFocused();
await expect(page.locator("#id")).toHaveAttribute("aria-expanded", "true");
```

**규칙**:
- `page.locator("#id")` — `#` prefix 필수 (Playwright 호환)
- `osExpect` 사용 (`@os-testing/expect`)
- `dispatch()` 금지 — `click()`, `keyboard.press()` 만 사용
- App에 `getItems` bind 필수 (headless goto 모드 전제조건)

**실행**:

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose tests/apg/{pattern}.apg.test.ts 2>&1 | tail -30
```

---

### Step 4: Signal 갱신

테스트 결과에 따라 `.apg.md`의 Signal을 갱신한다:
- PASS → 🟢
- FAIL → 🔴 (원인 기재: OS gap, 구현 미완 등)
- headless 미지원 → ➖ (이유 기재)

Coverage 섹션의 합계를 갱신한다.

---

### Step 5: 🔴 해소 (있는 경우)

🔴 행이 있으면:
1. **OS gap**: `BOARD.md` Unresolved에 기록. 별도 OS 프로젝트에서 해결.
2. **구현 미완**: Showcase 컴포넌트 또는 OS 코드 수정 → 🟢 전환.
3. **테스트 오류**: DT 재확인 → 테스트 수정.

---

### Step 6: 최종 게이트

```bash
# tsc
npm run typecheck 2>&1 | tail -3

# regression
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/apg/ 2>&1 | tail -6
```

---

### 완료 기준

- [ ] W3C APG Example 페이지 직접 읽음 (Step 1)
- [ ] `.apg.md` 작성 — DT + Example Source (Step 2)
- [ ] `.apg.test.ts` 작성 — DT 행 = it() 1:1 (Step 3)
- [ ] Signal 갱신 — 🟢/🔴/➖ 정확 (Step 4)
- [ ] 🔴 해소 또는 Unresolved 기록 (Step 5)
- [ ] tsc 0 + regression 0 (Step 6)

---

### Multi-Example 패턴 규칙

Example이 여러 개인 패턴 (e.g., Tabs Auto + Manual):

1. **파일 분리**: `{pattern}-{example}.apg.md` + `{pattern}-{example}.apg.test.ts`
2. **각 파일이 독립**: 자체 DT, 자체 Example Source, 자체 Coverage
3. **기존 통합 파일 삭제**: `{pattern}.apg.test.ts` → 분리 후 삭제

---

### 마지막 Step: Knowledge 반영

> `_middleware.md` §3 "종료 시" 규약을 따른다.
> OS gap 발견 시 → `BOARD.md` Unresolved에 기록.
