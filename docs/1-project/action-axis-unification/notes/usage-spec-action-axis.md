# Usage Spec — Action Axis Unification

> **Design Spike**: 컴파일되지 않는 이상적 코드.
> **결론 기반**: activate/check/open/expand는 하나의 action 축의 mode.
> **스타일**: Radix-like composable + headless (React 없음, OS core만)

---

## 1. Headless API (os-core / os-sdk)

### 1.1 기본 패턴: zone.bind()에 모든 설정

```typescript
const app = defineApp("toolbar-demo", {});
const zone = app.createZone("my-toolbar");

// ── 모든 config는 zone.bind() 하나에 ──
const UI = zone.bind({
  role: "toolbar",
  navigate: { orientation: "horizontal", loop: true },
  tab: { behavior: "escape" },

  // Zone 기본 action (role preset에서 파생 가능)
  action: { mode: "activate" },

  // per-item override (이종 zone에서만 필요)
  items: {
    "bold":   { action: { mode: "check", aria: "pressed" } },
    "italic": { action: { mode: "check", aria: "pressed" } },
    "file":   { action: { mode: "open", overlayId: "file-menu" } },
    // "print"는 Zone 기본(activate) 그대로 → override 불필요
  },
});

// ── 동종 Zone — items override 불필요 ──
const checkZone = app.createZone("prefs");
const CheckUI = checkZone.bind({
  role: "checkbox",
  // role preset → action: { mode: "check" } 자동
  // 모든 Item이 동일 action → items map 불필요
});

const accZone = app.createZone("faq");
const AccUI = accZone.bind({
  role: "accordion",
  // role preset → action: { mode: "expand" } 자동
});
```

### 1.2 action mode 별 기본값 (암묵적)

```typescript
// 앱 개발자가 명시할 필요 없음 — mode에서 파생
const ACTION_DEFAULTS = {
  check:    { keys: ["Space"],          onClick: true  },
  activate: { keys: ["Space", "Enter"], onClick: true  },
  open:     { keys: ["Space", "Enter"], onClick: true  },
  expand:   { keys: ["Space", "Enter"], onClick: true  },
  select:   { keys: ["Space"],          onClick: true  },
  none:     { keys: [],                 onClick: false },
};

// mode별 기본 keys는 APG 스펙에서 파생.
// override 필요 시 items map에서 명시:
const SwitchUI = switchZone.bind({
  role: "switch",
  action: { mode: "check", keys: ["Space", "Enter"] },  // switch는 Enter도 토글
});
```

### 1.3 standalone action button

```typescript
// 현재: <Trigger onActivate={CMD()}>
// 이후: createAction (singleton Zone shorthand)

const printBtn = app.createAction("print-btn", {
  onActivate: PRINT_CMD(),
});

// 내부적으로 = app.createZone().bind({
//   action: { mode: "activate", onActivate: PRINT_CMD() }
// })

// standalone overlay trigger
const settingsBtn = app.createAction("settings-btn", {
  action: { mode: "open", overlayId: "settings-dialog" },
});
```

---

## 2. UI Binding (os-react)

### 2.1 Toolbar (toggle + menu + action 혼합)

```tsx
// Zone.bind가 반환하는 UI 컴포넌트
<UI.Zone className="toolbar" aria-label="Text Formatting">
  {/* toggle button — action.mode="check" */}
  <UI.Item id="bold" className="btn">B</UI.Item>
  <UI.Item id="italic" className="btn">I</UI.Item>

  {/* menu button — action.mode="open" */}
  <UI.Item id="file" className="btn">File ▾</UI.Item>

  {/* action button — action.mode="activate" */}
  <UI.Item id="print" className="btn">Print</UI.Item>
</UI.Zone>

{/* overlay는 별도 — overlayId로 연결 */}
<UI.Overlay id="file-menu">
  <FileMenu />
</UI.Overlay>
```

**JSX에는 action 설정이 없다.** headless에서 `createItem`으로 이미 선언됨.

### 2.2 standalone button

```tsx
// createAction의 bind
const PrintUI = printBtn.bind();

<PrintUI.Button className="btn">Print Page</PrintUI.Button>

// 내부적으로:
// <Zone(singleton)>
//   <Item id="print-btn">Print Page</Item>
// </Zone>
```

### 2.3 Accordion

```tsx
const accordion = app.createZone("faq");

const q1 = accordion.createItem("q1", {
  action: { mode: "expand" },
});
const q2 = accordion.createItem("q2", {
  action: { mode: "expand" },
});

const AccUI = accordion.bind({
  role: "accordion",
  navigate: { orientation: "vertical", loop: false },
});

// JSX
<AccUI.Zone>
  <AccUI.Item id="q1">Section 1</AccUI.Item>
  <AccUI.Panel for="q1">Content 1...</AccUI.Panel>

  <AccUI.Item id="q2">Section 2</AccUI.Item>
  <AccUI.Panel for="q2">Content 2...</AccUI.Panel>
</AccUI.Zone>
```

### 2.4 Checkbox Group

```tsx
const checkGroup = app.createZone("preferences");

// 모든 Item의 action을 Zone 레벨에서 일괄 설정
const CheckUI = checkGroup.bind({
  role: "checkbox",  // role preset → action: { mode: "check" } 자동 적용
});

<CheckUI.Zone>
  <CheckUI.Item id="notifications">Notifications</CheckUI.Item>
  <CheckUI.Item id="dark-mode">Dark Mode</CheckUI.Item>
  <CheckUI.Item id="sounds">Sounds</CheckUI.Item>
</CheckUI.Zone>
```

### 2.5 Menu (overlay + items)

```tsx
const menu = app.createZone("file-menu");

const newFile = menu.createItem("new", {
  action: { mode: "activate", onActivate: NEW_FILE() },
});
const openFile = menu.createItem("open", {
  action: { mode: "activate", onActivate: OPEN_FILE() },
});
// submenu = open
const recent = menu.createItem("recent", {
  action: { mode: "open", overlayId: "recent-submenu" },
});

const MenuUI = menu.bind({
  role: "menu",
  navigate: { orientation: "vertical" },
  dismiss: { on: "Escape", restoreFocus: true },
});
```

---

## 3. Headless Test API

```typescript
const page = createHeadlessPage();

// Zone + Item + action 설정
page.goto("tb-1", {
  role: "toolbar",
  items: ["bold", "italic", "file"],
  focusedItemId: "bold",
  config: {
    navigate: { orientation: "horizontal", loop: true },
  },
  itemConfig: {
    "bold":   { action: { mode: "check", aria: "pressed" } },
    "italic": { action: { mode: "check", aria: "pressed" } },
    "file":   { action: { mode: "open", overlayId: "file-menu" } },
  },
});

// Space → bold 토글
await page.keyboard.press("Space");
await page.locator("#bold").toHaveAttribute("aria-pressed", "true");

// ArrowRight → file, Enter → 오버레이 열기
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Enter");
// file-menu overlay opens...
```

---

## 4. 컨셉맵 대입표

| # | 영역 | 커버 | Usage에서의 표현 | 빈칸/의문 |
|---|------|------|-----------------|----------|
| 1 | Topology | ✅ | createZone + createItem | |
| 2 | Navigation | ✅ | zone.bind({ navigate }) — action과 독립 | |
| 3 | Focus | ✅ | Zone 자동 관리 | |
| 4 | Selection | ✅ | action.mode="select" 또는 zone select config | mode="select"와 select축의 관계 명확화 필요 |
| 5 | Activation | ✅ | **action 축 통합**: check\|activate\|open\|expand\|select | 핵심 변경 |
| 6 | Field | ✅ | createItem({ field: { type } }) | |
| 7 | Overlay | ✅ | action.mode="open" + overlayId | Trigger 제거 → action으로 흡수 |
| 8 | Expansion | ✅ | action.mode="expand" | |
| 9 | Drag & Drop | ⏭ | scope 외 | |
| 10 | Clipboard | ⏭ | scope 외 | |
| 11 | History | ⏭ | scope 외 | |
| 12 | Data | ⏭ | scope 외 | |
| 13 | CRUD | ⏭ | scope 외 | |
| 14 | Command | ✅ | OS_CHECK, OS_ACTIVATE, OS_OVERLAY_OPEN — mode에서 결정 | OS_ACTIVATE 축소? |
| 15 | Pipeline | ✅ | SENSE→RESOLVE→COMMIT 전 경로 통과 | |
| 16 | ARIA | ✅ | action.aria 파생 (pressed/checked/expanded/haspopup) | |
| 17 | App Framework | ✅ | defineApp, createZone, createItem, bind | createAction(standalone) 신규 |
| 18 | Verification | ✅ | page.goto({ itemConfig: { action } }) | |

## 5. 빈칸 목록

### 자동 해결 (OS 내부)

- [x] onClick → action.mode에서 자동 파생 (tooltip 예외 없음)
- [x] keys → mode별 기본값 (APG 스펙 기반)
- [x] aria-haspopup → action.mode="open"에서 파생

### 선언 추가 필요 (API 확장)

- [ ] `action.mode="select"` vs Zone의 `select` config 중복 — select는 Zone 축인가 action mode인가?
- [ ] `createAction()` — standalone button shorthand API 신규 필요
- [ ] `itemConfig` in headless test — per-item action config 전달 방식

### 모델 확장 필요

- [ ] OS_ACTIVATE 역할 축소 — effect 제거 후 "app 콜백 전용"으로 재정의
- [ ] Trigger 컴포넌트 리팩토링 — action.mode="open"인 Item으로 전환, Trigger는 deprecated
