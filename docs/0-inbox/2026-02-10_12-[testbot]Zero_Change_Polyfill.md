# 기존 Playwright 코드 100% 호환 실행 계획 (Zero-Change Polyfill)

> 날짜: 2026-02-10
> 태그: testbot, playwright, polyfill, zero-change, vite-alias
> 상태: 확정 (Doc 11 대체)

---

## 1. 개요

**목표:** `e2e/` 폴더에 있는 Playwright 테스트 코드(`.spec.ts`)를 **단 한 줄도 수정하지 않고** TestBot(브라우저)에서 실행한다.

**핵심 전략:**
1.  **Vite Alias 활용:** 브라우저 번들링 시 `@playwright/test` 모듈을 우리가 만든 `polyfill` 구현체로 교체한다.
2.  **Browser-Side Polyfill:** `test()`, `expect()`, `page`, `locator` 등 Playwright API를 브라우저에서 `TestBotActions`로 매핑하여 구현한다.
3.  **Auto Discovery:** `import.meta.glob`를 사용하여 `e2e/**/*.spec.ts` 파일을 자동으로 불러와 TestBot에 등록한다.

---

## 2. 아키텍처

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│  e2e/auth.spec.ts           │      │  src/os/testBot/playwright  │
│                             │      │  (The Polyfill)             │
│  import { test } from       │      │                             │
│     "@playwright/test";     │ ───► │  export const test = ...    │ ◄── Vite Alias
│                             │      │  export const expect = ...  │     (@playwright/test)
│  test("Login", async () => {│      │                             │
│    await page.click(...)    │ ───► │  t.click(...)               │
│  });                        │      │                             │
└─────────────────────────────┘      └─────────────────────────────┘
```

### 2.1 파일 구조

```
src/os/testBot/playwright/
├── index.ts           # @playwright/test 모듈의 public API (test, expect 등)
├── shim.ts            # Page, Locator, Expect 클래스 구현
└── loader.tsx         # e2e 스펙 파일을 로드하고 TestBot 라우트를 등록하는 컴포넌트
```

### 2.2 Vite 설정 (`vite.config.ts`)

```typescript
resolve: {
  alias: {
    "@playwright/test": "/src/os/testBot/playwright/index.ts",
    // ...
  }
}
```

---

## 3. 상세 구현 계획

### 3.1 `test()` 함수 (Registry)

Playwright의 `test()` 함수는 실행 시 바로 테스트를 등록하는 역할을 한다. Polyfill은 이를 메모리 상의 레지스트리에 저장한다.

```typescript
// src/os/testBot/playwright/index.ts
export const registry = [];

export const test = (name: string, fn: Function) => {
  registry.push({ name, fn, type: 'test' });
};

test.describe = (name: string, fn: Function) => {
  // describe 블록 처리 (재귀적 구조 또는 플랫하게 매핑)
};

test.beforeEach = (fn: Function) => { ... };
```

### 3.2 `page` 객체 (Adapter)

`test` 함수가 실행될 때, `fn({ page })`에 전달할 가짜 `page` 객체를 생성한다. 이 객체는 `TestActions`를 내부적으로 호출한다.

```typescript
// src/os/testBot/playwright/shim.ts
export class ShimPage {
  constructor(private t: TestActions) {}

  locator(selector: string) {
    return new ShimLocator(this.t, selector);
  }

  async getByRole(role: string, options?: { name?: string }) {
    // TestBot은 selector 형태로 시맨틱 쿼리 지원
    return new ShimLocator(this.t, { role, ...options });
  }

  get keyboard() {
    return {
      press: (key: string) => this.t.press(key),
      type: (text: string) => this.t.type(text),
    };
  }
}
```

### 3.3 `locator` 및 `expect` (Mapping)

Playwright의 `locator().click()`은 비동기다. TestBot의 `t.click()`도 비동기다. 1:1 매핑된다.

```typescript
export class ShimLocator {
  constructor(private t: TestActions, private selector: Selector) {}

  async click(options?: { modifiers?: string[] }) {
    await this.t.click(this.selector, options);
  }
  
  // ... other methods
}

export const expect = (locator: ShimLocator) => {
  // TestActions.expect()를 호출하는 프록시 리턴
  return {
    toBeFocused: () => t.expect(locator.selector).toBeFocused(),
    toHaveAttribute: (k, v) => t.expect(locator.selector).toHaveAttribute(k, v),
    not: {
      toHaveAttribute: (k, v) => t.expect(locator.selector).toNotHaveAttribute(k, v),
    },
    // ...
  };
};
```

---

## 4. 실행 모델 (Loader)

TestBot 앱 내에서 `e2e` 테스트들을 실행하기 위해 `ShimLoader` 컴포넌트를 만든다.

```typescript
// src/os/testBot/playwright/loader.tsx
const modules = import.meta.glob('../../../../e2e/**/*.spec.ts', { eager: true });

export function usePlaywrightRoutes() {
  // 1. glob으로 로드된 모듈들을 순회
  // 2. 각 모듈이 실행되면서 'registry'에 테스트가 등록됨
  // 3. 등록된 테스트들을 TestBot.describe()로 변환하여 등록
  
  useTestBotRoutes("playwright-e2e", (bot) => {
    for (const item of registry) {
      bot.describe(item.name, async (t) => {
        const page = new ShimPage(t);
        await item.fn({ page });
      });
    }
  });
}
```

---

## 5. 제약 사항 및 해결

1.  **Node.js API 사용 불가**: `fs`, `child_process` 등을 사용하는 테스트는 브라우저에서 실패한다.
    - *해결:* 순수 UI 인터랙션 테스트(`page`, `expect`만 사용)에 집중한다. 현재 변환된 `aria-showcase` 등은 100% 호환된다.
2.  **`page.goto` 처리**:
    - *해결:* `ShimPage.goto(url)` 구현에서 내부 라우터(`history.pushState` 등)를 사용하여 SPA 네비게이션으로 처리한다. `useTestBotRoutes`가 이미 해당 페이지 컴포넌트를 마운트하고 있으므로, `goto`는 사실상 "리셋" 또는 "검증" 역할만 한다.

---

## 6. 결론

이 방식은 **"수정 없이(Zero-Change)"** 기존 코드를 실행할 수 있는 가장 강력하고 LLM 친화적인 방법이다. LLM은 그냥 평소대로 Playwright 코드를 짜면 되고, 실행 환경이 알아서 앱 내부로 적응(Polyfill)한다.
