# TestBot 구현 전략: 자체 구현 vs 라이브러리 활용

> 날짜: 2026-02-10
> 태그: testbot, strategy, testing-library, playwright
> 상태: 논의

---

## 1. 질문

TestBot을 유지한다면, 내부 구현을 어떻게 해야 하는가?

| 선택지 | 설명 |
|---|---|
| A | 현재처럼 전부 자체 구현 |
| B | Playwright 위에 구축 |
| C | 기존 라이브러리의 런타임 부품을 조합 |
| D | 인터페이스만 통일하고 러너는 분리 |

---

## 2. 선택지 B 검토: Playwright 위에 구축 — 불가

Playwright의 아키텍처:

```
Node.js Process              Browser
┌──────────┐    CDP/WebSocket    ┌──────────┐
│ Playwright│ ←──────────────── │  Chrome   │
│ (test.ts) │ ──────────────→  │  (app)    │
└──────────┘                    └──────────┘
```

Playwright는 **별도 프로세스**에서 브라우저를 원격 조종한다. 앱 내부에서 실행할 수 없다.

- `@playwright/test`는 Node.js 전용 (브라우저에서 import 불가)
- CDP 기반이라 브라우저 밖에서만 동작
- 같은 런타임 접근(kernel.getState() 등)이 원리적으로 불가

**결론: Playwright 위에 TestBot을 구축하는 것은 불가능하다.**

Cypress도 마찬가지 문제가 있다. 같은 브라우저에서 돌긴 하지만 **별도 iframe**이고, `cy.*` 체이닝 모델은 동기적 코드 흐름과 호환되지 않으며, Inspector 패널 안에 내장할 수 없다.

---

## 3. 선택지 C 검토: 런타임 부품 조합 — 유력

TestBot의 기능을 분해하면:

```
TestBot = 쿼리 + 이벤트 + 어설션 + 대기 + 커서 + 오케스트레이션 + Inspector
          ─────────────────────────────   ─────────────────────────────────
          기존 라이브러리로 대체 가능        자체 구현 필수
```

### 대체 가능한 부분

#### @testing-library/dom (8KB gzip)

```
npm: @testing-library/dom
브라우저 실행: ✅ (순수 DOM API만 사용)
```

TestBot이 직접 구현한 것 중 이 라이브러리가 더 잘하는 것:

| TestBot 현재 | @testing-library/dom | 차이 |
|---|---|---|
| `getByText()` — O(n) 스캔, descendant count 휴리스틱 | `screen.getByText()` — TextMatcher, exact/regex 지원 | TL이 더 정확하고 유연 |
| `getByRole()` — 20개 implicit role 수동 매핑 | `screen.getByRole()` — 전체 WAI-ARIA role 지원, accessible name 계산 | TL이 압도적으로 완전 |
| `getAllByText()` — leaf node 스캔 | `screen.getAllByText()` | TL이 표준 |
| — | `screen.getByLabelText()`, `getByPlaceholderText()`, `getByDisplayValue()` | TestBot에 없는 쿼리 |
| 없음 (고정 delay) | **`waitFor(callback, { timeout })`** | TL의 waitFor가 핵심 |

**`waitFor`가 이미 있다.** TestBot의 P0 개선 사항(waitFor 도입)을 직접 구현할 필요 없이 가져다 쓸 수 있다.

```typescript
import { screen, waitFor } from "@testing-library/dom";

// TestBot assertion 내부에서 사용
async toBeFocused() {
  await waitFor(() => {
    expect(document.activeElement).toBe(el);
  }, { timeout: 1000 });
}
```

#### @testing-library/user-event (5KB gzip)

```
npm: @testing-library/user-event
브라우저 실행: ✅
```

| TestBot 현재 | user-event | 차이 |
|---|---|---|
| `click()` — mousedown/focus/mouseup/click 수동 dispatch | `userEvent.click(el)` — 전체 이벤트 시퀀스 (pointerdown/mousedown/pointerup/mouseup/click) | UE가 더 현실적 |
| `press()` — keydown/keyup 수동 dispatch | `userEvent.keyboard("{ArrowDown}")` — 전체 키보드 시퀀스, modifier 지원 | UE가 더 정확 |
| `type()` — keydown/keyup + input.value 수동 설정 | `userEvent.type(el, text)` — 실제 입력 시뮬레이션, composition event 포함 | UE가 더 현실적 |

**user-event의 이벤트 시퀀스가 실제 브라우저와 더 가깝다.** TestBot은 mousedown→focus→mouseup→click 4단계만 발생시키지만, 실제 브라우저는 pointerenter→pointerdown→mousedown→... 등 더 많은 이벤트를 발생시킨다.

### 대체 불가능한 부분 (자체 구현 유지)

| 기능 | 이유 |
|---|---|
| **커서 애니메이션** (cursor.ts, 471줄) | TestBot 고유. 어떤 라이브러리에도 없음 |
| **Inspector Panel** (TestBotPanel, SuiteDetails) | 앱 내 Inspector 통합. 자체 UI |
| **오케스트레이션** (testBot.ts, TestBotActions.ts) | describe/beforeEach, resetKey 패턴, speed 제어 |
| **Global API** (globalApi.ts) | `window.__TESTBOT__` LLM 인터페이스 |
| **Step 기록** (StepResult, SuiteResult) | 커서 스탬프, 실시간 UI와 연동 |
| **Kernel 통합** (향후) | expectState, expectTransaction |

---

## 4. 선택지 C 적용 시 아키텍처

```
┌─────────────────────────────────────────────────┐
│ TestBot                                          │
│                                                  │
│  ┌──────────────────────┐  ┌──────────────────┐ │
│  │ @testing-library/dom │  │ user-event       │ │
│  │ • getByRole          │  │ • click          │ │
│  │ • getByText          │  │ • keyboard       │ │
│  │ • waitFor            │  │ • type           │ │
│  └──────────┬───────────┘  └────────┬─────────┘ │
│             │                        │           │
│  ┌──────────▼────────────────────────▼─────────┐ │
│  │ TestActions (어댑터 레이어)                    │ │
│  │ • click() → cursor.moveTo + UE.click        │ │
│  │ • press() → cursor.showBubble + UE.keyboard │ │
│  │ • expect() → TL.waitFor + cursor.showStatus │ │
│  └──────────┬──────────────────────────────────┘ │
│             │                                    │
│  ┌──────────▼──────────┐  ┌──────────────────┐  │
│  │ Cursor (자체)        │  │ Orchestration    │  │
│  │ • moveTo, ripple     │  │ • describe       │  │
│  │ • showBubble, stamp  │  │ • beforeEach     │  │
│  │ • trackElement       │  │ • runAll/Suite   │  │
│  └─────────────────────┘  └──────────────────┘  │
│                                                  │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Inspector UI (자체)  │  │ Global API (자체) │  │
│  │ • TestBotPanel       │  │ • __TESTBOT__     │  │
│  │ • SuiteDetails       │  │ • runAll/summary  │  │
│  └─────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

**교체되는 코드:**

| 현재 파일 | 줄 수 | 교체 대상 |
|---|---|---|
| `selectors.ts` (getByText, getByRole, findByRole...) | 107줄 | `@testing-library/dom` |
| `implicitRoles.ts` (수동 role 매핑) | 57줄 | `@testing-library/dom` (내장) |
| `createActions.ts` 이벤트 부분 (mousedown/keydown 수동 dispatch) | ~150줄 | `@testing-library/user-event` |
| assertion 내 고정 delay (wait(60), wait(150)) | ~30줄 | `@testing-library/dom` waitFor |
| **합계** | **~344줄 제거** | |

**유지되는 코드:**

| 파일 | 줄 수 | 이유 |
|---|---|---|
| `cursor.ts` | 471 | 고유 기능 |
| `createActions.ts` 래퍼 부분 | ~200 | 커서 + TL/UE 연결 |
| `testBot.ts` | 160 | 오케스트레이션 |
| `TestBotActions.ts` | 162 | 제어 메서드 |
| `TestBotStore.ts` | 110 | 상태 관리 |
| `globalApi.ts` | 132 | LLM API |
| UI 3파일 | 544 | Inspector |
| 기타 | ~100 | entities, context 등 |
| **합계** | **~1,880줄 유지** | |

**결과: 2,600줄 → 1,880줄. 344줄의 취약한 자체 구현을 검증된 라이브러리로 교체.**

---

## 5. 선택지 D 검토: 인터페이스 통일 + 러너 분리

C와 독립적으로, **테스트 시나리오의 이식성**을 위해 인터페이스를 추상화한다.

### 5.1 공통 인터페이스

```typescript
// packages/testbot/core/TestActions.ts
interface TestActions {
  click(target: Selector, modifiers?: Modifiers): Promise<void>;
  press(key: string, modifiers?: Modifiers): Promise<void>;
  type(text: string): Promise<void>;
  wait(ms: number): Promise<void>;

  getByRole(role: string, options?: { name?: string }): Promise<string>;
  getByText(text: string): Promise<string>;
  getAllByText(text: string): Promise<string[]>;

  expect(target: Selector): Expectations;
}

interface Expectations {
  toBeFocused(): Promise<void>;
  toHaveAttribute(attr: string, value: string): Promise<void>;
  toNotHaveAttribute(attr: string, value: string): Promise<void>;
  toExist(): Promise<void>;
  toNotExist(): Promise<void>;
  toHaveValue(value: string): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toBeVisible(): Promise<void>;
  toBeDisabled(): Promise<void>;
  toHaveCount(n: number): Promise<void>;
}
```

### 5.2 테스트 시나리오 (러너 무관)

```typescript
// tests/scenarios/listbox.ts
export function listboxTests(describe: DescribeFn) {
  describe("ArrowDown navigates to next option", async (t) => {
    await t.click({ role: "option", name: "Item 1" });
    await t.press("ArrowDown");
    await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
  });

  describe("Home moves to first option", async (t) => {
    await t.click({ role: "option", name: "Item 3" });
    await t.press("Home");
    await t.expect({ role: "option", name: "Item 1" }).toBeFocused();
  });
}
```

### 5.3 TestBot 러너 (앱 내)

```typescript
// 앱 내 등록
useTestBotRoutes("listbox", (bot) => {
  listboxTests(bot.describe);
});
```

TestBot 러너가 `TestActions`를 구현:
- `click()` → 커서 이동 + user-event.click + 스탬프
- `expect()` → waitFor + 커서 status
- 실시간 시각 피드백, Inspector 통합

### 5.4 Playwright 러너 (CI)

```typescript
// playwright/listbox.spec.ts
import { listboxTests } from "../tests/scenarios/listbox";
import { createPlaywrightActions } from "./adapter";

test.describe("Listbox", () => {
  listboxTests((name, fn) => {
    test(name, async ({ page }) => {
      await page.goto("/showcase/listbox");
      await fn(createPlaywrightActions(page));
    });
  });
});
```

Playwright 어댑터가 `TestActions`를 구현:
- `click()` → `page.click(selector)` 또는 `page.getByRole().click()`
- `expect()` → `expect(page.locator()).toBeFocused()`
- headless, CI 최적화

### 5.5 어댑터 구현 난이도

| TestActions 메서드 | Playwright 어댑터 | 복잡도 |
|---|---|---|
| `click(selector)` | `page.click(selector)` | 낮음 |
| `click({ role, name })` | `page.getByRole(role, { name }).click()` | 낮음 |
| `press(key)` | `page.keyboard.press(key)` | 낮음 |
| `type(text)` | `page.keyboard.type(text)` | 낮음 |
| `expect(sel).toBeFocused()` | `expect(page.locator(sel)).toBeFocused()` | 낮음 |
| `expect(sel).toHaveText(t)` | `expect(page.locator(sel)).toHaveText(t)` | 낮음 |
| `getByRole(role)` | `page.getByRole(role)` 의 selector 반환 | 중간 |

Playwright 어댑터는 **~100줄**이면 된다. 1:1 매핑이 거의 완벽하다.

---

## 6. 추천 전략: C + D

**Phase 1: 내부 품질 개선 (C)**
- `@testing-library/dom` 도입 → 쿼리 + waitFor 교체
- `@testing-library/user-event` 도입 → 이벤트 시뮬레이션 교체
- 자체 구현 344줄 제거, 검증된 라이브러리로 대체
- **기존 테스트 시나리오 변경 없음** (TestActions 인터페이스 유지)

**Phase 2: 인터페이스 분리 (D)**
- `TestActions` 인터페이스를 독립 모듈로 추출
- 테스트 시나리오를 러너 무관하게 작성
- Playwright 어댑터 구현 (~100줄)
- CI에서 같은 시나리오를 headless로 실행

### 의존성 크기

| 패키지 | gzip 크기 | 비고 |
|---|---|---|
| `@testing-library/dom` | ~8KB | 쿼리 + waitFor |
| `@testing-library/user-event` | ~5KB | 이벤트 시뮬레이션 |
| **합계** | **~13KB** | 344줄 자체 구현 대체 |

devDependency로 추가. 프로덕션 번들에 포함되지 않음 (TestBot 자체가 dev-only).

---

## 7. 요약

```
Playwright 위에 구축       → ❌ 불가 (별도 프로세스, 브라우저 내 실행 불가)
Cypress 위에 구축          → ❌ 비실용적 (iframe 모델, cy.* 체이닝)
전부 자체 구현 유지         → ⚠️ 가능하지만 344줄이 취약
TL/UE 부품 조합 + 자체 껍질 → ✅ 추천 (검증된 쿼리/이벤트 + 고유 커서/Inspector)
인터페이스 통일 + CI 어댑터  → ✅ 추천 (시나리오 1회 작성, 러너 2개)
```

| 결정 | 내용 |
|---|---|
| **쿼리 엔진** | `@testing-library/dom` 채택 (getByRole, waitFor) |
| **이벤트 엔진** | `@testing-library/user-event` 채택 |
| **커서/Inspector/오케스트레이션/Global API** | 자체 구현 유지 |
| **테스트 시나리오** | `TestActions` 인터페이스로 러너 무관하게 작성 |
| **CI** | Playwright 어댑터 (~100줄)로 같은 시나리오 실행 |
