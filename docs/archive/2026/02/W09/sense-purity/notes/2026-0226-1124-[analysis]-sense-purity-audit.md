# Sense 순수화 감사 — DOM 인터페이스 vs 순수 객체 분리

| 항목 | 내용 |
|------|------|
| **원문** | DOM과 순수 객체 인터페이스를 분리해서 표로 만들어봐. 코드에 되어 있는 것과 아닌 것을 분리하는 표를 작성해 |
| **내(AI)가 추정한 의도** | |
| 경위 | PointerListener 리팩토링 중 senseMouse.ts가 HTMLElement를 받는 것을 발견. /doubt + /discussion에서 "sense도 순수함수여야" 주장 수렴 |
| 표면 | 전체 리스너의 DOM 의존 함수 vs 순수 함수 현황 분류표 |
| 의도 | 순수화 리팩토링의 정확한 scope와 우선순위를 결정하기 위한 전수 조사 |
| **날짜** | 2026-02-26 |
| **상태** | 분석 완료 |

---

## 1. 개요 (Overview)

OS의 5-Phase Pipeline 원칙: **Physical Event → Sense → Translate → Dispatch → Effect**

- **Translate** (resolve 함수) = 순수함수, **우리만의 interface**를 받음 ✅
- **Sense** 함수 = DOM 읽기 + 변환 로직이 **혼합**된 상태 ❌

목표: Sense 함수가 **우리만의 순수 interface**를 받도록 분리하여, **변환 로직을 vitest에서 테스트 가능**하게 만든다.

---

## 2. 표 1 — 전체 함수 DOM/순수 분류

### ✅ 이미 순수한 함수 (vitest 테스트 가능)

| 함수 | 파일 | 입력 interface | DOM 타입? | vitest? | 테스트 |
|------|------|----------------|-----------|---------|--------|
| `resolvePointerDown` | `resolvePointer.ts` | `PointerInput` (순수) | ❌ | ✅ | 13 tests |
| `resolvePointerMove` | `resolvePointer.ts` | `PointerMoveInput` (순수) | ❌ | ✅ | 13 tests |
| `resolvePointerUp` | `resolvePointer.ts` | `GestureState` (순수) | ❌ | ✅ | 13 tests |
| `resolveMouse` | `resolveMouse.ts` | `MouseInput` (순수) | ❌ | ✅ | 10 tests |
| `resolveClick` | `resolveClick.ts` | `ClickInput` (순수) | ❌ | ✅ | — |
| `resolveKeyboard` | `resolveKeyboard.ts` | `KeyboardInput` (순수) | ❌ | ✅ | 24 tests |
| `resolveClipboardShim` | `headless.ts` | `string` | ❌ | ✅ | — |
| `simulateKeyPress` | `headless.ts` | `HeadlessKernel, string` | ❌ | ✅ | 다수 통합 |
| `simulateClick` | `headless.ts` | `HeadlessKernel, string` | ❌ | ✅ | 다수 통합 |

### ❌ DOM 의존 함수 (순수화 필요)

| 함수 | 파일 | 현재 입력 | DOM API 사용 | 목표 순수 interface | 난이도 |
|------|------|-----------|-------------|-------------------|--------|
| `senseMouseDown` | `senseMouse.ts` | `HTMLElement, Event` | `closest`, `getAttribute`, `getElementById`, `querySelector` | `MouseDownSense` | 🟡 Medium |
| `senseClick` | `senseMouse.ts` | `HTMLElement` | `closest`, `getAttribute`, `os.getState()` | `ClickSenseInput` | 🟢 Easy |
| `getDropPosition` | `senseMouse.ts` | `Event, HTMLElement` | `querySelectorAll`, `getBoundingClientRect`, `closest` | `DropSenseInput` | 🟡 Medium |
| `senseKeyboard` | `KeyboardListener.tsx` | `KeyboardEvent` | `document.activeElement`, `closest`, `getAttribute`, `os.getState()` | `KeyboardSenseInput` | 🟡 Medium |
| `seedCaretFromPoint` | `senseMouse.ts` | `x, y, fieldId` | `caretRangeFromPoint`, `getElementById`, `createRange` | ⛔ 순수화 불가 | — |

### ⚠️ 비-Sense 로직이 Sense 파일에 섞인 것

| 함수 | 파일 | 문제 | 분류 | 조치 |
|------|------|------|------|------|
| `handleSelectModeClick` | `senseMouse.ts` | `resolveClick` + `os.dispatch` = Controller | Controller | PointerListener로 이동 |
| `seedCaretFromPoint` | `senseMouse.ts` | `FieldRegistry.updateCaretPosition` = Side Effect | Side Effect | PointerListener로 이동 |

---

## 3. 표 2 — 목표 순수 interface 설계

### `MouseDownSense` — senseMouseDown의 순수 입력

| 필드 | 타입 | 현재 DOM 소스 | 비고 |
|------|------|--------------|------|
| `isInspector` | `boolean` | `target.closest("[data-inspector]")` | |
| `isLabel` | `boolean` | `target.closest("[data-label]")` | |
| `labelTargetItemId` | `string \| null` | `label.getAttribute("data-for")` → `resolveFocusTarget` | |
| `labelTargetGroupId` | `string \| null` | 동상 | |
| `itemId` | `string \| null` | `findFocusableItem(target)` → `getAttribute("data-item-id")` | |
| `groupId` | `string \| null` | `resolveFocusTarget(item).groupId` | |
| `hasAriaExpanded` | `boolean` | `item.hasAttribute("aria-expanded")` | |
| `itemRole` | `string \| null` | `item.getAttribute("role")` | |
| `shiftKey` | `boolean` | `e.shiftKey` | |
| `metaKey` | `boolean` | `e.metaKey` | |
| `ctrlKey` | `boolean` | `e.ctrlKey` | |
| `altKey` | `boolean` | `e.altKey` | |

→ **`senseMouseDown(input: MouseDownSense): MouseInput | null`** = 순수함수

### `ClickSenseInput` — senseClick의 순수 입력

| 필드 | 타입 | 현재 DOM 소스 | 비고 |
|------|------|--------------|------|
| `isInspector` | `boolean` | `target.closest("[data-inspector]")` | |
| `isExpandTrigger` | `boolean` | `target.closest("[data-expand-trigger]")` | |
| `isCheckTrigger` | `boolean` | `target.closest("[data-check-trigger]")` | |
| `clickedItemId` | `string \| null` | `findFocusableItem` → `getAttribute("data-item-id")` | |
| `activeZoneId` | `string \| null` | `os.getState().os.focus.activeZoneId` | ⚠️ Store 접근 |
| `focusedItemId` | `string \| null` | `zone.focusedItemId` | ⚠️ Store 접근 |
| `activateOnClick` | `boolean` | `ZoneRegistry.get(zoneId).config` | ⚠️ Registry 접근 |
| `reClickOnly` | `boolean` | `ZoneRegistry.get(zoneId).config` | ⚠️ Registry 접근 |
| `isCurrentPage` | `boolean` | `clickedEl?.getAttribute("aria-current")` | |

→ 주의: senseClick + handleSelectModeClick을 합치면 **resolveClick의 입력과 거의 동일**

### `DropSenseInput` — getDropPosition의 순수 입력

| 필드 | 타입 | 현재 DOM 소스 | 비고 |
|------|------|--------------|------|
| `clientY` | `number` | `e.clientY` | |
| `items` | `Array<{ itemId: string; top: number; bottom: number }>` | `querySelectorAll("[data-item-id]")` → `getBoundingClientRect` | 아이템 목록 + rect |

→ **`getDropPosition(input: DropSenseInput): { overItemId: string; position: "before" \| "after" } \| null`** = 순수함수

### `KeyboardSenseInput` — senseKeyboard의 순수 입력

KeyboardInput은 이미 순수 interface. senseKeyboard의 역할이 곧 DOM→KeyboardInput 변환.
**senseKeyboard 내부에 변환 로직이 거의 없고 DOM 읽기만 있으므로, 추가 분리 불필요.**

---

## 4. 표 3 — 현재 상태 vs 목표 요약

| # | 함수 | 현재 | 목표 | Gap |
|---|------|------|------|-----|
| 1 | `resolvePointerDown/Move/Up` | ✅ 순수 | ✅ | — |
| 2 | `resolveMouse` | ✅ 순수 | ✅ | — |
| 3 | `resolveClick` | ✅ 순수 | ✅ | — |
| 4 | `resolveKeyboard` | ✅ 순수 | ✅ | — |
| 5 | `senseMouseDown` | ❌ HTMLElement | ✅ `MouseDownSense` | **순수 interface 추출** |
| 6 | `senseClick` | ❌ HTMLElement + Store | ✅ `ClickSenseInput` → 사실상 ClickInput과 병합 가능 | **순수화 + 스코프 축소** |
| 7 | `getDropPosition` | ❌ HTMLElement | ✅ `DropSenseInput` | **rect 배열로 추상화** |
| 8 | `senseKeyboard` | ❌ KeyboardEvent | ✅ 이미 KeyboardInput으로 직접 변환 | **분리 이득 적음** (로직 없이 순수 읽기만) |
| 9 | `handleSelectModeClick` | ❌ Sense 파일에 Controller | PointerListener로 이동 | **위치 이동** |
| 10 | `seedCaretFromPoint` | ❌ 순수화 불가 (DOM API) | PointerListener에 남김 | **이동만** |

---

## 5. Cynefin 도메인 판정

🟢 **Clear** — `resolvePointer`가 이미 이 패턴의 선례. "DOM 읽기 → 순수 객체 → 순수함수"의 3단 분리는 확립된 아키텍처.
- #5, #7: `MouseDownSense`, `DropSenseInput` 추출 = `PointerInput` 패턴 반복
- #6: `senseClick` → `ClickSenseInput` = `ClickInput`과 거의 동일 → 병합 검토
- #8: `senseKeyboard` = 로직이 없는 순수 DOM 읽기. 분리 효과 대비 비용이 큼 → 우선순위 낮음

## 6. 인식 한계 (Epistemic Status)

- `senseKeyboard`의 변환 로직 비중은 정적 분석에 기반. 실제로 조건 분기(isEditing 등)가 있지만 headless.ts가 이미 이를 직접 조립하는 선례가 있어 분리 이득이 적다고 판단.
- `seedCaretFromPoint`는 `document.caretRangeFromPoint`가 순수화 불가능한 브라우저 전용 API.

## 7. 열린 질문 (Complex Questions)

1. **scope**: #5~#7의 순수화를 unified-pointer-listener 프로젝트에 T7로 추가할 것인가, 별도 프로젝트(`sense-purity`)로 할 것인가?
2. **#6 병합**: `senseClick`을 순수화하면 `ClickInput`과 거의 동일 — 두 인터페이스를 병합할 것인가, 2단을 유지할 것인가?
3. **#8 우선순위**: `senseKeyboard`는 변환 로직이 최소 — 지금 순수화할 가치가 있는가, 나중으로 미룰 것인가?

---

> **3줄 요약**:
> resolve 함수 9개는 이미 순수 (✅). sense 함수 4개가 DOM 타입을 직접 받아 vitest 불가 (❌).
> `resolvePointer`의 `PointerInput` 패턴을 `senseMouseDown`, `senseClick`, `getDropPosition`에 반복 적용하면 변환 로직까지 vitest 테스트 가능.
> `handleSelectModeClick` + `seedCaretFromPoint`는 Sense 파일에서 제거 → PointerListener로 이동.
