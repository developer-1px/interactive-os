# 통합 테스트 시나리오: Playwright + TestBot 듀얼 러너

> 날짜: 2026-02-10
> 태그: testbot, playwright, unified-runner, architecture
> 상태: 제안

---

## 1. 개요

현재 상태:
- `e2e/` — Playwright 전용 스펙 11개 (74 테스트)
- `src/pages/*/tests/` — TestBot 전용 테스트 (동일한 시나리오의 다른 코드)

Doc 09에서 정의한 "하나의 시나리오, 두 개의 러너"를 구현한다.

**목표:** 시나리오를 한 번만 작성하고, Playwright와 TestBot 양쪽에서 실행한다.

---

## 2. 현재 API 차이 분석

### TestBot (src/pages/aria-showcase/tests/TabsTest.tsx)

```typescript
export function defineTabsTests(bot: TestBot) {
  bot.describe("Tabs: Horizontal Navigation", async (t) => {
    await t.click("#tab-account");
    await t.expect("#tab-account").toBeFocused();
    await t.press("ArrowRight");
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
  });
}
```

### Playwright (e2e/aria-showcase/tabs.spec.ts)

```typescript
test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("Horizontal Navigation", async ({ page }) => {
    await page.locator("#tab-account").click();
    await expect(page.locator("#tab-account")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-security")).toHaveAttribute("aria-selected", "true");
  });
});
```

### 핵심 차이

| 동작 | TestBot | Playwright |
|---|---|---|
| click | `t.click("#id")` | `page.locator("#id").click()` |
| press | `t.press("Key")` | `page.keyboard.press("Key")` |
| click + meta | `t.click("#id", { meta: true })` | `page.locator("#id").click({ modifiers: ["Meta"] })` |
| expect focused | `t.expect("#id").toBeFocused()` | `expect(page.locator("#id")).toBeFocused()` |
| expect attr | `t.expect("#id").toHaveAttribute(a, v)` | `expect(page.locator("#id")).toHaveAttribute(a, v)` |
| expect !attr | `t.expect("#id").toNotHaveAttribute(a, v)` | `expect(page.locator("#id")).not.toHaveAttribute(a, v)` |
| wait | `t.wait(ms)` | `page.waitForTimeout(ms)` |
| suite 정의 | `bot.describe(name, fn)` | `test(name, fn)` |
| beforeEach | `bot.beforeEach(fn)` | `test.beforeEach(fn)` |

**결론:** API 형태(signature)는 다르지만, 의미(semantics)는 1:1이다. 어댑터로 브리지 가능하다.

---

## 3. 설계: TestActions 기준 통합

### 3.1 전략 선택

TestBot의 `TestActions` 인터페이스를 **공통 시나리오 언어**로 사용:

```typescript
// TestActions 인터페이스 (이미 존재)
interface TestActions {
  click(target: Selector, modifiers?: KeyModifiers): Promise<void>;
  press(key: string, modifiers?: KeyModifiers): Promise<void>;
  wait(ms: number): Promise<void>;
  expect(selector: string): Expectations;
}
```

이 인터페이스 기준으로 시나리오를 작성하고, 각 러너가 구현체를 제공한다.

### 3.2 구조

```
tests/scenarios/              ← 공통 시나리오 (러너 무관)
├── aria-showcase/
│   ├── tabs.ts
│   ├── disclosure.ts
│   ├── menu.ts
│   ├── grid.ts
│   ├── radiogroup.ts
│   ├── listbox.ts
│   ├── toolbar.ts
│   ├── tree.ts
│   └── complex-patterns.ts
├── focus-showcase/
│   └── focus-showcase.ts
└── builder/
    └── builder-spatial.ts

e2e/                          ← Playwright 러너 (얇은 어댑터)
├── aria-showcase/
│   └── tabs.spec.ts          ← import { tabsScenario } + playwrightAdapter
└── ...

src/pages/*/tests/            ← TestBot 러너 (기존)
├── TabsTest.tsx              ← import { tabsScenario } + bot.describe
└── ...
```

### 3.3 시나리오 파일 형태

```typescript
// tests/scenarios/aria-showcase/tabs.ts

import type { TestActions } from "@os/testBot";

export interface ScenarioRunner {
  describe(name: string, fn: (t: TestActions) => Promise<void>): void;
  beforeEach?(fn: (t: TestActions) => Promise<void>): void;
}

export function tabsScenarios(runner: ScenarioRunner) {
  runner.describe("Tabs: Horizontal Navigation", async (t) => {
    await t.click("#tab-account");
    await t.expect("#tab-account").toBeFocused();
    await t.press("ArrowRight");
    await t.expect("#tab-security").toBeFocused();
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "false");
  });

  runner.describe("Tabs: Home/End Navigation", async (t) => {
    await t.click("#tab-security");
    await t.expect("#tab-security").toBeFocused();
    await t.press("Home");
    await t.expect("#tab-account").toBeFocused();
    await t.press("End");
    await t.expect("#tab-disabled").toBeFocused();
  });
}
```

### 3.4 Playwright 어댑터

```typescript
// tests/adapters/playwright.ts

import { test, expect, type Page } from "@playwright/test";
import type { TestActions, Expectations, KeyModifiers } from "./types";
import type { ScenarioRunner } from "./types";

function createPlaywrightActions(page: Page): TestActions {
  return {
    async click(target: string, modifiers?: KeyModifiers) {
      const opts: any = {};
      if (modifiers?.meta) opts.modifiers = ["Meta"];
      if (modifiers?.shift) opts.modifiers = [...(opts.modifiers || []), "Shift"];
      if (modifiers?.ctrl) opts.modifiers = [...(opts.modifiers || []), "Control"];
      if (modifiers?.alt) opts.modifiers = [...(opts.modifiers || []), "Alt"];
      await page.locator(target).click(opts);
    },

    async press(key: string, modifiers?: KeyModifiers) {
      let combo = key;
      if (modifiers?.meta) combo = `Meta+${combo}`;
      if (modifiers?.shift) combo = `Shift+${combo}`;
      if (modifiers?.ctrl) combo = `Control+${combo}`;
      if (modifiers?.alt) combo = `Alt+${combo}`;
      await page.keyboard.press(combo);
    },

    async wait(ms: number) {
      await page.waitForTimeout(ms);
    },

    expect(selector: string): Expectations {
      const loc = page.locator(selector);
      return {
        toBeFocused: () => expect(loc).toBeFocused(),
        toHaveAttribute: (attr, value) => expect(loc).toHaveAttribute(attr, value),
        toNotHaveAttribute: (attr, value) => expect(loc).not.toHaveAttribute(attr, value),
        toExist: () => expect(loc).toBeAttached(),
        toNotExist: () => expect(loc).not.toBeAttached(),
        toHaveValue: (value) => expect(loc).toHaveValue(value),
        toHaveText: (text) => expect(loc).toHaveText(text),
        toBeVisible: () => expect(loc).toBeVisible(),
        toBeDisabled: () => expect(loc).toBeDisabled(),
        toHaveCount: (n) => expect(loc).toHaveCount(n),
      };
    },

    async getByText(text: string) { return `text=${text}`; },
    async getByRole(role: string, name?: string) { return `role=${role}[name="${name}"]`; },
    async getAllByText(text: string) { return [`text=${text}`]; },
    async type(text: string) { await page.keyboard.type(text); },
  };
}

export function playwrightRunner(path: string): ScenarioRunner & { page: Page } {
  // 아래에서 사용:
  // e2e/aria-showcase/tabs.spec.ts 에서 호출
  let _page: Page;

  test.beforeEach(async ({ page }) => {
    _page = page;
    await page.goto(path);
  });

  return {
    get page() { return _page; },
    describe(name, fn) {
      test(name, async ({ page }) => {
        await fn(createPlaywrightActions(page));
      });
    },
  };
}
```

### 3.5 사용 예시

```typescript
// e2e/aria-showcase/tabs.spec.ts (변경 후)
import { test } from "@playwright/test";
import { tabsScenarios } from "../../tests/scenarios/aria-showcase/tabs";
import { playwrightRunner } from "../../tests/adapters/playwright";

test.describe("Tabs", () => {
  const runner = playwrightRunner("/aria-showcase");
  tabsScenarios(runner);
});
```

```typescript
// src/pages/aria-showcase/tests/TabsTest.tsx (변경 후)
import type { TestBot } from "@os/testBot";
import { tabsScenarios } from "../../../../tests/scenarios/aria-showcase/tabs";

export function defineTabsTests(bot: TestBot) {
  tabsScenarios(bot);  // TestBot은 이미 ScenarioRunner 인터페이스 호환
}
```

---

## 4. 상태 문제: TestBot은 stateful, Playwright는 isolated

**중요 차이:** TestBot은 같은 페이지에서 모든 suite를 순차 실행(상태 공유). Playwright는 각 test마다 새 페이지(상태 격리).

### 해결: 시나리오는 항상 self-contained로 작성

- 각 `runner.describe()`는 초기 상태에서 시작한다고 가정
- TestBot 러너에서 `beforeEach`로 페이지 리셋 (`resetKey` 증가)
- 이미 TestBot에 `beforeEach` 훅이 존재하므로 활용 가능

---

## 5. 구현 단계

### Phase 1: 인프라 (어댑터 + 타입)
- `tests/scenarios/types.ts` — `ScenarioRunner` 인터페이스 정의
- `tests/adapters/playwright.ts` — Playwright → TestActions 어댑터 구현

### Phase 2: 시나리오 추출
- 기존 TestBot 테스트 파일 (`src/pages/*/tests/*.tsx`)의 시나리오 로직을 `tests/scenarios/`로 이동
- 각 시나리오가 self-contained인지 확인 (stateful → stateless 변환)

### Phase 3: 소비자 전환
- `e2e/*.spec.ts` → `playwrightRunner` + 시나리오 import 형태로 변환
- `src/pages/*/tests/*.tsx` → 시나리오 import + `bot`에 전달 형태로 변환

### Phase 4: 검증
- `npm run test:e2e` — 동일한 결과
- TestBot 앱 내 실행 — 동일한 시각적 시연

---

## 6. 주의사항

1. **tsconfig 경로 설정**: `tests/` 디렉토리가 `e2e/`와 `src/` 양쪽에서 접근 가능해야 함
2. **TestBot의 `ScenarioRunner` 호환성**: `TestBot` 인터페이스가 이미 `describe(name, fn)` 메서드를 가지고 있으므로, `ScenarioRunner`와 구조적으로 호환됨. 별도 래핑 불필요
3. **Playwright `test()` 등록 타이밍**: Playwright는 모듈 로드 시 `test()`가 호출되어야 함 (lazy 불가). `playwrightRunner`는 이를 고려한 설계

---

## 7. 요약

```
Before:
  TestBot 테스트 = src/pages/*/tests/*.tsx (TestBot API)
  Playwright 테스트 = e2e/*.spec.ts (Playwright API)
  → 같은 시나리오를 두 번 작성

After:
  시나리오 = tests/scenarios/*.ts (TestActions 인터페이스)
  TestBot 러너 = bot.describe → 시나리오 import
  Playwright 러너 = playwrightAdapter → 시나리오 import
  → 시나리오 한 번 작성, 러너만 교체
```
