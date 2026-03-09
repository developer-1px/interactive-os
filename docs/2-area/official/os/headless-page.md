# HeadlessPage

> Interactive OS의 테스트 인프라. DOM 없이 Playwright 수준의 상호작용 검증을 제공한다.

---

## Why

브라우저를 열지 않고도 모든 상호작용을 검증할 수 있어야 한다.

- **Zero Drift**: headless에서 통과하면 DOM도 동일하게 동작한다. OS가 상태를 가상으로 소유하기 때문.
- **100% Observable**: "브라우저에서 확인해주세요"는 금지. 자동화된 검증만 증거.
- **속도**: vitest에서 <1ms/test. Playwright E2E 대비 1000배.

## What

`createHeadlessPage()`는 Playwright `Page`와 동형인 API를 DOM 없이 제공한다.

```ts
import { createHeadlessPage } from "@os-devtool/testing";

const page = createHeadlessPage();
page.setupZone("my-list", { items: ["a", "b", "c"], role: "listbox" });

page.keyboard.press("ArrowDown");
expect(page.locator("#b")).toBeFocused();
expect(page.locator("#b")).toHaveAttribute("aria-selected", "true");
```

## Architecture: 3-Engine

동일한 테스트 코드가 3개 엔진에서 실행된다:

| Engine | 구현 | 환경 | 속도 |
|--------|------|------|------|
| **Headless** | `createHeadlessPage()` | vitest (DOM 없음) | <1ms/test |
| **Browser** | `createBrowserPage()` | Inspector (real DOM) | ~100ms/step |
| **Playwright** | native Page | 실제 브라우저 | ~1s/test |

### DOM 없이 어떻게 동작하는가

1. OS가 모든 상태를 가상으로 소유 (focusedItemId, selection, expanded, ARIA)
2. `simulateKeyPress()` — 브라우저 이벤트 대신 OS 상태에서 직접 `resolveKeyboard()` 호출
3. `simulateClick()` — DOM traversal 대신 `ZoneRegistry`에서 직접 아이템 조회
4. `computeItem()` — Zone 상태에서 ARIA 속성을 순수 함수로 계산
5. DOM은 이 상태의 **투영**일 뿐 — headless 검증 = DOM 검증

### Projection Mode — Item Discovery

Component가 제공되면(`createHeadlessPage(app, Component)`), 아이템 목록은 **렌더링된 HTML에서 추출**된다:

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
// OS-level: Zone을 수동으로 setup
createHeadlessPage(): HeadlessPage

// App-level: defineApp 기반, zone bindings 자동 해석
createHeadlessPage(app: AppHandle, Component?: FC): AppPage
```

> Source: `packages/os-devtool/src/testing/page.ts`

### Page

```ts
page.keyboard.press(key: string): void     // "ArrowDown", "Enter", "Shift+Tab"
page.keyboard.type(text: string): void      // 텍스트 입력 (field editing)

page.click(itemId: string): void            // 아이템 클릭
page.goto(url: string): void                // URL 이동 (App-level)
page.setupZone(id: string, opts?): void     // Zone 등록 (OS-level)

page.focusedItemId(zoneId?): string | null  // 현재 포커스
page.selection(zoneId?): string[]           // 선택된 아이템들
page.activeZoneId(): string | null          // 활성 Zone
page.attrs(itemId: string): ItemAttrs       // ARIA 속성 조회
```

### Locator

```ts
const loc = page.locator("#item-id");       // #id selector (Playwright 동형)

loc.getAttribute(name: string): string | null
loc.inputValue(): string
loc.click(opts?: { modifiers?: ("Meta"|"Shift"|"Control")[] }): void
```

### Assertions

```ts
expect(loc).toBeFocused()                   // 포커스 검증
expect(loc).toHaveAttribute(name, value)    // ARIA 속성 검증
expect(loc).toBeChecked()                   // aria-checked
expect(loc).toBeDisabled()                  // aria-disabled
expect(loc).not.toBeFocused()               // 부정
```

> Source: `packages/os-devtool/src/testing/expect.ts`

### setupZone Options

```ts
page.setupZone("zone-id", {
  items?: string[],                  // 아이템 ID 목록
  role?: ZoneRole,                   // "listbox", "tree", "grid", "tablist", ...
  config?: Partial<FocusGroupConfig>,// orientation, boundary, selection 등
  focusedItemId?: string | null,     // 초기 포커스
  initial?: {
    selection?: string[],            // 초기 선택
    expanded?: string[],             // 초기 펼침
  },
  expandableItems?: Set<string>,     // 펼칠 수 있는 아이템
  treeLevels?: Map<string, number>,  // 트리 깊이 (tree/treegrid)
});
```

## Playwright Strict Subset

테스트 코드에서 허용되는 API는 이것뿐이다:

```
page.locator("#id").click()          page.keyboard.press("key")
page.locator("#id").getAttribute()   page.keyboard.type("text")
expect(loc).toHaveAttribute()        expect(loc).toBeFocused()
```

`dispatch()`, `getState()`, 내부 함수 직접 호출은 **금지**. OS Pipeline을 건너뛰면 "vitest GREEN + browser FAIL" 거짓 검증이 된다.

## 사용 패턴

### Tier 1: OS 커널 테스트

앱 코드 없이 OS 자체의 커맨드 파이프라인을 검증.

```ts
import { createHeadlessPage } from "@os-devtool/testing";

const page = createHeadlessPage();
page.setupZone("list", { items: ["a", "b", "c"], role: "listbox" });

page.keyboard.press("ArrowDown");
expect(page.focusedItemId()).toBe("b");
```

### Tier 2: 앱 통합 테스트

실제 앱의 bind 경로를 검증.

```ts
import { createHeadlessPage } from "@os-devtool/testing";
import { TodoApp } from "@apps/todo/app";
import { TodoView } from "@apps/todo/TodoView";

const page = createHeadlessPage(TodoApp, TodoView);
page.goto("/todo");

page.keyboard.press("ArrowDown");
expect(page.locator("#todo-1")).toBeFocused();
```

### TestScript ONE Format

testbot 파일 + runScenarios로 보일러플레이트 제거.

```ts
// testbot-myapp.ts
export const scenarios: TestScenario[] = [
  { zone: "my-zone", items: [...], role: "listbox", scripts: myScripts },
];

// test file
import { runScenarios } from "@os-devtool/testing/runScenarios";
import { scenarios } from "./testbot-myapp";
runScenarios(scenarios);
```

## Links

- **Knowledge**: `.agent/knowledge/testing-tools.md` (에이전트용 도구 선택 기준)
- **Knowledge**: `.agent/knowledge/verification-standards.md` (검증 표준)
- **Feature Matrix**: `docs/FEATURES.md` Section 18 (Verification)
- **Concept Map**: `docs/3-resource/concept-map.md` Section 18
- **Source**: `packages/os-devtool/src/testing/`
