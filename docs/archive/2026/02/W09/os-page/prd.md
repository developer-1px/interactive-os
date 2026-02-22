# OS Page — PRD

> **Owner**: os-page
> **Status**: Draft

## 1. 핵심 개념

**OS Page** = Playwright의 `Page`와 동형(isomorphic)인, 커널 기반 headless integration test 인터페이스.

```
Playwright Page = Browser Context + DOM + Event Pipeline
OS Page         = Isolated Kernel  + State + Command Pipeline
```

## 2. API Surface

### 2.1 Factory

```ts
// 앱이 있는 Page (Full Stack)
const page = TodoApp.createPage(overrides?: Partial<S>);

// 앱이 없는 Page (OS-only, 기존 createTestOsKernel 대체)
const page = createOSPage(overrides?: Partial<AppState>);
```

### 2.2 Page Interface

```ts
interface OSPage<S> {
  // ── Navigation ──
  goto(zoneId: string, opts?: {
    focusedItemId?: string | null;
    items?: string[];
    config?: Partial<FocusGroupConfig>;
  }): void;

  // ── Keyboard (Playwright 동형) ──
  keyboard: {
    press(key: string): void;   // "ArrowDown", "Shift+ArrowDown", "Delete", "Enter"
  };

  // ── Mouse ──
  click(itemId: string, opts?: { shift?: boolean; meta?: boolean }): void;

  // ── Query ──
  focusedItemId(zoneId?: string): string | null;
  selection(zoneId?: string): string[];
  activeZoneId(): string | null;

  // ── DOM Projection (headless) ──
  attrs(itemId: string, zoneId?: string): ItemAttrs;

  // ── App State (Playwright에 없는 보너스) ──
  readonly state: S;

  // ── Lifecycle ──
  reset(): void;
}
```

### 2.3 Assertions (Phase 2)

```ts
// Playwright 스타일 (Optional — Phase 2)
page.expect(itemId).toBeFocused();
page.expect(itemId).toHaveAttribute("aria-selected", true);
```

## 3. 내부 구현 전략

### 3.1 격리 커널 생성

`defineApp.create({ withOS: true })`에서 이미 제공하는 격리 커널을 재사용:
- `createKernel<AppState>({ os: initialAppState.os, apps: { [appId]: initialState } })`
- 앱 커맨드 전체 등록 (flatHandlerRegistry)
- OS 커맨드 등록 (OS_FOCUS, OS_NAVIGATE, OS_SELECT 등)

### 3.2 pressKey 연결

`createTestOsKernel.pressKey()` 로직을 추출:
1. 현재 zone/focused item에서 `KeyboardInput` 구성
2. `resolveKeyboard(input)` → OS 커맨드 목록
3. `kernel.dispatch(cmd)` 각각 실행

**추가 필요**: zone의 콜백(onDelete, onAction, onCheck)도 키→커맨드 변환에 참여.
- `resolveKeyboard`는 Delete → ??? (OS_ACTIVATE? custom?)
- zone.bind()에서 `onDelete`가 있으면 Delete 키가 이 콜백을 호출해야 한다.
- 이 매핑은 `osDefaults` 키맵에 이미 있을 수 있음 → 확인 필요.

### 3.3 click 연결

`createTestOsKernel.click()` 로직을 추출:
1. `MouseInput` 구성
2. `resolveMouse(input)` → OS 커맨드 목록
3. `kernel.dispatch(cmd)` 각각 실행

### 3.4 attrs 연결

`createTestOsKernel.attrs()` 로직을 그대로 추출:
- 순수 함수: `(kernelState, itemId, zoneId) → ItemAttrs`

### 3.5 zone.bind() 콜백 등록

`zone.bind({ onDelete, onAction, keybindings })` 선언이 headless 커널에서도 동작해야 한다.
- 현재 이 콜백들은 `ZoneRegistry`에 등록됨
- headless에서도 `ZoneRegistry.register(zoneId, { onDelete, onAction, ... })` 호출 필요
- `page.goto(zoneId)` 시 자동 등록

## 4. 마이그레이션 경로

| Phase | 대상 | 방법 |
|-------|------|------|
| **Phase 1** | OS Page 최소 구현 | `pressKey/click/attrs` + Todo PoC |
| **Phase 2** | `createTestOsKernel` 대체 | OS Page로 재구현, APG 테스트 마이그레이션 |
| **Phase 3** | TestBot v2 연결 | OS Page = headless runtime, ReplayPanel = visual runtime |
| **Phase 4** | ShimPage 레거시화 | DOM 기반 shim → OS Page로 전환 |

## 5. 검증 시나리오

### S1: Todo List Navigation

```ts
const page = TodoApp.createPage();
// Setup: 3개 todo 추가
page.dispatch(addTodo({ text: "A" }));
page.dispatch(addTodo({ text: "B" }));
page.dispatch(addTodo({ text: "C" }));

// Zone 활성화
page.goto("list", { items: Object.keys(page.state.data.todos) });

// 키보드 네비게이션
page.keyboard.press("ArrowDown");
expect(page.focusedItemId()).toBe(/* 두 번째 todo ID */);
expect(page.attrs(page.focusedItemId()!).tabIndex).toBe(0);
```

### S2: Todo Delete via Keyboard

```ts
const page = TodoApp.createPage();
page.dispatch(addTodo({ text: "Delete me" }));
const id = Object.keys(page.state.data.todos)[0]!;

page.goto("list", { items: [id] });
page.click(id);
page.keyboard.press("Delete");

expect(page.state.ui.pendingDeleteIds).toContain(id);
```

### S3: APG Listbox (OS-only Page)

```ts
const page = createOSPage();
page.goto("listbox", {
  items: ["apple", "banana", "cherry"],
  config: { navigate: { orientation: "vertical", loop: false } },
});

page.keyboard.press("ArrowDown");
expect(page.focusedItemId()).toBe("apple");
expect(page.attrs("apple").tabIndex).toBe(0);
```

## 6. Glossary

| 도메인 개념 | 코드 이름 | 근거 |
|---|---|---|
| 격리된 앱 테스트 환경 | `TestPage` (interface) | 테스트 컨텍스트. `OSPage`는 OS가 주어라 오해. `Page`는 범용. |
| Factory 메서드 | `createPage()` | Playwright 동형. 기존 `createZone`, `createTrigger` 패턴과 일관. |
| zone 이동 | `goto(zoneId)` | Playwright `page.goto()` 동형. `activate`는 OS_ACTIVATE 충돌. |
| 키보드 입력 | `keyboard.press(key)` | Playwright 완전 동형. |
| 마우스 클릭 | `click(itemId)` | Playwright 동형. itemId 기반 (CSS selector 대신). |
| ARIA 속성 조회 | `attrs(itemId)` | 기존 `createTestOsKernel.attrs()` 일관성. |
| 파일 위치 | `defineApp.page.ts` | `defineApp.testInstance.ts` 모듈 concern 분할 패턴. |
