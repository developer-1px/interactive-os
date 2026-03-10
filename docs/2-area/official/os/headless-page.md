# HeadlessPage

> Interactive OS의 테스트 인프라. DOM 없이 Playwright 수준의 상호작용 검증을 제공한다.

---

## Why

브라우저를 열지 않고도 모든 상호작용을 검증할 수 있어야 한다.

- **Zero Drift**: headless에서 통과하면 DOM도 동일하게 동작한다. OS가 상태를 가상으로 소유하기 때문.
- **100% Observable**: "브라우저에서 확인해주세요"는 금지. 자동화된 검증만 증거.
- **속도**: vitest에서 <1ms/test. Playwright E2E 대비 1000배.

## What

`createPage(app, Component?)`는 Playwright `Page`와 동형인 API를 DOM 없이 제공한다.

```ts
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";

const app = defineApp("test-app", {});
const zone = app.createZone("my-list");
zone.bind({ role: "listbox", getItems: () => ["a", "b", "c"] });

const { page, cleanup } = createPage(app);
page.goto("/");

page.keyboard.press("ArrowDown");
await expect(page.locator("#b")).toBeFocused();
await expect(page.locator("#b")).toHaveAttribute("aria-selected", "true");
cleanup();
```

### 1경계 원칙

> 테스트 시나리오에서 API는 `page`뿐.
> - `os` = 인프라 세부사항. locator 구현체 내부에 숨는다. 테스트 코드에서 import 금지 (APG 테스트).
> - `app` = fixture 설정(Arrange)에서만. 시나리오(Act+Assert)에서 등장하면 동형 위반.
> - 앱 통합 테스트 (todo, docs-viewer)에서는 `os` singleton을 state/dispatch에 사용 가능.

## Architecture: 3-Engine, 2-Track

동일한 테스트 코드가 3개 엔진에서 실행된다:

| Engine | 구현 | 환경 | 속도 |
|--------|------|------|------|
| **Headless** | `createPage()` | vitest (DOM 없음) | <1ms/test |
| **Browser** | `createBrowserPage()` | Inspector (real DOM) | ~100ms/step |
| **Playwright** | native Page | 실제 브라우저 | ~1s/test |

### 2-Track 운영

| Track | Engine | 주체 | 자동화 | 게이트 |
|-------|--------|------|--------|--------|
| **Machine** | Headless + Playwright | LLM/CI | 자동 | commit=headless, push=E2E |
| **Human** | Browser TestBot | 인간 | 수동 | archive 전 확인 |

**Zero Drift 증명**: 같은 TestScript가 headless와 E2E에서 동일한 결과를 내는 것이 경험적 증거.

### DOM 없이 어떻게 동작하는가

1. OS가 모든 상태를 가상으로 소유 (focusedItemId, selection, expanded, ARIA)
2. `simulateKeyPress()` — 브라우저 이벤트 대신 OS 상태에서 직접 `resolveKeyboard()` 호출
3. `simulateClick()` — DOM traversal 대신 `ZoneRegistry`에서 직접 아이템 조회
4. `computeItem()` — Zone 상태에서 ARIA 속성을 순수 함수로 계산
5. DOM은 이 상태의 **투영**일 뿐 — headless 검증 = DOM 검증

### Projection Mode — Item Discovery

Component가 제공되면(`createPage(app, Component)`), 아이템 목록은 **렌더링된 HTML에서 추출**된다:

```
renderToString(Component) → jsdom parse → querySelectorAll("[data-zone]") 내 [data-item] 추출
→ Map<zoneId, string[]> → ZoneRegistry.getItems에 주입
```

이것이 browser의 DOM scan(`el.querySelectorAll("[data-item]")`)의 headless 등가물이다.
**동일 인터페이스(getItems), 다른 소스(browser=real DOM, headless=renderToString).**

- **binding-provided getItems 우선**: `bind({ getItems })` 명시 시 projection으로 덮어쓰지 않음
- **projection-only zones**: getItems 없는 zone은 렌더링 결과가 유일한 아이템 소스
- **캐시 무효화**: click, press, dispatch 시 자동 무효화 → 다음 접근 시 lazy 재렌더링

## API Reference

### Factory

```ts
import { createPage } from "@os-devtool/testing/page";

// App-level: defineApp 기반, zone bindings 자동 해석
const { page, cleanup } = createPage(app);
const { page, cleanup } = createPage(app, Component);  // with projection
```

> Source: `packages/os-devtool/src/testing/page.ts`

### Page

```ts
page.goto(url: string): void           // URL 이동 — zones 등록 + 초기 상태 설정
page.click(selector: string, opts?): void  // 아이템 클릭
page.content(): string                 // 직렬화된 HTML (Projection 필요)

page.keyboard.press(key: string): void  // "ArrowDown", "Enter", "Shift+Tab"
page.keyboard.type(text: string): void  // 텍스트 입력 (field editing)

page.locator(selector: string): Locator // Playwright-compatible locator
```

### Locator

```ts
const loc = page.locator("#item-id");     // #id selector (Playwright 동형)

loc.click(opts?: { modifiers?: ("Meta"|"Shift"|"Control")[] }): void
loc.getAttribute(name: string): string | null
loc.inputValue(): string
```

### Assertions

```ts
expect(loc).toBeFocused()                 // 포커스 검증
expect(loc).toHaveAttribute(name, value)  // ARIA 속성 검증
expect(loc).toBeChecked()                 // aria-checked
expect(loc).toBeDisabled()                // aria-disabled
expect(loc).not.toBeFocused()             // 부정
```

> Source: `packages/os-devtool/src/testing/expect.ts`

### osExpect (Playwright Isomorphic)

```ts
import { expect as osExpect } from "@os-devtool/testing/expect";

// locator + plain value 통합 — Playwright expect()와 동일 시그니처
await osExpect(page.locator("#item")).toBeFocused();
await osExpect(page.locator("#item")).toHaveAttribute("aria-selected", "true");
```

## Playwright Strict Subset

테스트 코드에서 허용되는 API는 이것뿐이다:

```
page.goto("/")                          page.click("item-id")
page.keyboard.press("key")             page.keyboard.type("text")
page.locator("#id").click()             page.locator("#id").getAttribute()
expect(loc).toHaveAttribute()           expect(loc).toBeFocused()
page.content()
```

`dispatch()`, `getState()`, 내부 함수 직접 호출은 **금지**. OS Pipeline을 건너뛰면 "vitest GREEN + browser FAIL" 거짓 검증이 된다.

## 사용 패턴

### APG 패턴 테스트

inline `defineApp` + `zone.bind`로 fixture를 구성하고, `page`만으로 검증.

```ts
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";

const ITEMS = ["apple", "banana", "cherry"];

function createListbox(focusedItem = "apple") {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("fruits");
  zone.bind({ role: "listbox", getItems: () => ITEMS });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

it("ArrowDown moves focus", () => {
  const { page, cleanup } = createListbox("apple");
  page.keyboard.press("ArrowDown");
  await expect(page.locator("#banana")).toBeFocused();
  cleanup();
});
```

### 앱 통합 테스트

실제 앱의 bind 경로를 검증. `os` singleton으로 state/dispatch 접근 가능.

```ts
import { createPage } from "@os-devtool/testing/page";
import { os } from "@os-core/engine/kernel";
import { TodoApp } from "@apps/todo/app";
import TodoPage from "@pages/TodoPage";

const { page, cleanup } = createPage(TodoApp, TodoPage);
page.goto("/");

page.keyboard.press("ArrowDown");
await expect(page.locator("#todo_2")).toBeFocused();

const state = os.getState().apps[TodoApp.__appId];
```

### TestScript ONE Format

testbot 파일 + runScenarios로 보일러플레이트 제거.

```ts
// testbot-myapp.ts — scenarios declare zone + role + scripts only.
export const zones = ["my-zone"];
export const route = "/my-app";
export const group = "My App";
export const scenarios: TestScenario[] = [
  { zone: "my-zone", role: "listbox", scripts: myScripts },
];

// test file
import { runScenarios } from "@os-devtool/testing/runScenarios";
import { MyApp } from "./app";
import { MyView } from "./MyView";
import { scenarios } from "./testbot-myapp";
runScenarios(scenarios, MyApp, MyView);
```

## Links

- **Knowledge**: `.agent/knowledge/testing-tools.md` (에이전트용 도구 선택 기준)
- **Knowledge**: `.agent/knowledge/verification-standards.md` (검증 표준)
- **Source**: `packages/os-devtool/src/testing/`
