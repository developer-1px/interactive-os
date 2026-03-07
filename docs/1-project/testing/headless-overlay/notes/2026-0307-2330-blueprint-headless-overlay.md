# Blueprint: Headless Overlay Lifecycle

## 1. Goal

**UDE (Undesirable Effects):**
- OG-015: Headless Escape on dialog overlay doesn't trigger dismiss/close
- OG-016: Headless doesn't support overlay focus trap (Tab cycles within dialog)
- OG-017: Overlay zone navigation (focus to confirm button + Enter) not supported in headless
- OG-018: Cross-zone headless test blocked (page.goto sets single activeZoneId)
- Todo delete confirmation dialog untestable in headless
- "Browser confirm needed" = rules.md #2 violation

**Done Criteria:**
Headless page에서 overlay(dialog/menu/popover) 전체 생명주기를 시뮬레이션할 수 있다:
1. Trigger 클릭 → overlay zone 자동 활성화
2. Overlay 내 Tab cycling (trap)
3. Overlay 내 navigation + activation (Enter)
4. Escape → overlay dismiss + focus restore to invoker
5. 위 모든 동작이 `page.keyboard.press()` / `page.click()` 만으로 가능 (dispatch 금지)

## 2. Why

**근본 원인**: rules.md #2 위반 — "100% Observable"

Browser overlay flow:
```
click trigger → TriggerPortal mounts <Zone role="dialog"> → auto-register in ZoneRegistry
→ OS_OVERLAY_OPEN → overlay stack push → activeZoneId = overlay
→ Escape → OS_ESCAPE → OS_OVERLAY_CLOSE → stack pop → focus restore
```

Headless overlay flow:
```
click trigger → ??? (no TriggerPortal, no Zone mount) → overlay zone never exists
→ Escape → resolveKeyboard → no overlay zone → nothing happens
```

**Root cause**: Browser의 overlay zone 등록은 React 렌더링(TriggerPortal → Zone)에 의존한다.
Headless에는 React 렌더링이 없으므로 overlay zone이 존재하지 않는다.
이것은 Zero Drift 위반이다 — 브라우저에서 되는 것이 headless에서 안 된다.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| A1: overlay zone을 headless에서 자동 등록해야 한다 | **Yes** — OS 계약. 앱 개발자가 수동 setupZone하는 것은 OS 책임 회피 | — |
| A2: overlay zone의 items/role 정보가 필요하다 | **Partially** — role은 TriggerOverlayRegistry에 있음. items는 앱 bind config에 있을 수 있음 | items 없이 role만으로 시작, items는 lazy discovery |
| A3: focus restore는 DOM(querySelector) 없이 불가능하다 | **No** — focusStack에 invoker zone+item이 저장되어 있음. State만으로 복원 가능 | state-based focus restore |
| A4: Tab trap은 DOM tabIndex에 의존한다 | **No** — OS_TAB "trap" behavior는 순수 state 로직. DOM 불필요 | 이미 동작함 (zone만 등록되면) |
| A5: 모든 overlay gap을 한번에 해결해야 한다 | **No** — Escape dismiss만 해결해도 가장 큰 gap 해소. Tab trap은 zone 등록이 되면 자동으로 따라옴 | 점진적 해결 가능 |

**핵심 발견**: A3, A4 무효화. overlay zone이 headless에 등록되기만 하면, Escape/Tab/Navigation은 기존 OS 로직이 자동 처리한다. **문제는 zone 등록 하나**.

## 4. Ideal

해결 완료 후의 headless DX:

```typescript
// 앱 개발자 테스트 코드 (이상적)
const page = createHeadlessPage(TodoApp, TodoComponent);
await page.goto("/");

// 1. delete button이 있는 item에서 trigger 클릭
page.click("delete-btn");  // → overlay zone 자동 활성화

// 2. dialog 내 navigation
page.keyboard.press("Tab");       // close-btn → confirm-btn (trap)
page.keyboard.press("Shift+Tab"); // confirm-btn → close-btn (trap)

// 3. dialog 내 activation
page.keyboard.press("Enter");     // confirm action

// 4. Escape dismiss
page.keyboard.press("Escape");    // → dialog close + focus restore to invoker

// 5. 검증
expect(page.activeZoneId()).toBe("list");  // invoker zone 복원
expect(page.focusedItemId("list")).toBe("item-1");  // invoker item 복원
```

**Negative Branch:**
- NB1: overlay zone에 items가 없으면 Tab/Navigation 불가 → items 주입 경로 필요
- NB2: 중첩 overlay (dialog 위에 confirm dialog) → focusStack LIFO가 이미 처리

## 5. Inputs

| 입력 | 위치 | 역할 |
|------|------|------|
| OS_OVERLAY_OPEN/CLOSE | `os-core/4-command/overlay/overlay.ts` | overlay stack 관리 |
| OS_STACK_PUSH/POP | `os-core/4-command/focus/stack.ts` | focus 저장/복원 |
| OS_ESCAPE | `os-core/4-command/dismiss/escape.ts` | escape → overlay close 라우팅 |
| OS_TAB | `os-core/4-command/tab/tab.ts` | trap behavior |
| simulateKeyPress | `os-devtool/testing/simulate.ts` | headless 키 시뮬레이션 |
| page.ts | `os-devtool/testing/page.ts` | headless page API |
| page.click() | `os-devtool/testing/page.ts` | trigger 클릭 시뮬레이션 |
| TriggerOverlayRegistry | `os-core/engine/registries/triggerRegistry.ts` | trigger→overlay 매핑 |
| ZoneRegistry | `os-core/engine/registries/zoneRegistry.ts` | zone 등록/조회 |
| roleRegistry | `os-core/engine/registries/roleRegistry.ts` | role별 preset (dismiss, tab 등) |
| dialog.apg.test.ts | `tests/apg/dialog.apg.test.ts` | 기존 dialog 테스트 (6 pass) |
| dropdown-menu.apg.test.ts | `tests/apg/dropdown-menu.apg.test.ts` | 기존 menu 테스트 (8 pass) |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | page.click(triggerId) → overlay zone 자동 등록 | click이 `findItemCallback` 경로만 탐 — overlay zone 미등록 | click 시 TriggerOverlayRegistry 조회 → 자동 overlay zone 활성화 | **High** | — |
| G2 | overlay zone의 role/items 정보 | TriggerOverlayRegistry에 role 있음. items는 앱 bind config에 있을 수 있음 | overlay zone items 주입 경로: bind config의 triggers[].overlay.items 또는 getItems() | **High** | G1 |
| G3 | Escape → OS_OVERLAY_CLOSE → focus restore (state-based) | focus restore가 `document.querySelector` DOM effect에 의존 | headless용 focus restore: state에서 focusStack.pop() → activeZoneId + focusedItemId 직접 설정 | **High** | G1 |
| G4 | Tab trap in overlay zone | OS_TAB trap behavior는 구현됨 | overlay zone이 등록되면 자동 동작. G1 해결 시 자동 해소 | **Med** | G1 |
| G5 | overlay 내 Enter activation | OS_ACTIVATE는 구현됨 | overlay zone이 등록되면 자동 동작. G1 해결 시 자동 해소 | **Med** | G1 |
| G6 | 중첩 overlay (dialog → confirm) | focusStack LIFO 구현됨 | G1의 자동 등록이 중첩도 처리하면 자동 해소 | **Low** | G1 |

**핵심 구조**: G1(자동 등록)이 해결되면 G4, G5, G6이 자동 해소. 실제 작업은 G1 + G2 + G3.

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | overlay zone items 선언 경로 설계 | Complicated | — | bind config의 triggers[].overlay에 items/getItems 추가 방법 결정. page.goto()가 overlay items를 미리 수집하는 구조 |
| T2 | page.click(triggerId) overlay 자동 활성화 | Clear | T1 | click 시 TriggerOverlayRegistry 조회 → overlay zone 자동 등록 + OS_OVERLAY_OPEN dispatch + activeZoneId 전환 |
| T3 | headless focus restore (state-based) | Clear | T2 | OS_OVERLAY_CLOSE 후 focusStack에서 invoker를 읽어 activeZoneId + focusedItemId를 state로 직접 복원. DOM effect 불필요 |
| T4 | Red: dialog overlay 테스트 작성 | Clear | — | dialog.apg.test.ts 보강: Tab trap, Escape dismiss, focus restore, Enter confirm |
| T5 | Green: T4 테스트 통과 | Clear | T2, T3, T4 | T2+T3 구현으로 T4 테스트 통과 |
| T6 | Red: dropdown-menu overlay 테스트 | Clear | T5 | dropdown-menu.apg.test.ts에 overlay 시나리오 추가 |
| T7 | Regression: 기존 APG 테스트 전수 통과 | Clear | T5 | vitest run tests/apg/ — 391+ tests pass |
