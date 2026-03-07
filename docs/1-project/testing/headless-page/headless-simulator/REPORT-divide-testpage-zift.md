# /divide Report — TestPage ZIFT Invariant Interface Coverage

## Problem Frame

| | 내용 | 확신도 |
|---|------|-------|
| **Objective** | TestPage가 ZIFT 불변 인터페이스(Zone/Item/Field/Trigger)의 완전한 headless 검증 도구가 된다. Playwright 동형 API로 모든 ZIFT 인터랙션을 커버. | 🟢 |
| **Constraints** | headless-simulator가 Active Focus — 코어 수정은 이 방향으로만. `app.zone()` 데이터 모델(from/to/entity/with[])은 미래 구현이므로 TestPage 범위 밖. | 🟢 |
| **Variables** | TestPage의 현재 API 범위 vs ZIFT 인터페이스가 요구하는 검증 범위의 갭 | 🟢 |

---

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| **0** | **TestPage가 ZIFT 4개 인터페이스를 완전히 headless 검증** | ❌ | — | → A(Zone), B(Item), C(Field), D(Trigger), E(Playwright 동형) |
| **1** | **A. Zone verification** | ⚠️ | — | → A1~A5 |
| 2 | A1. Multi-zone tab navigation | ✅ | `tests/integration/os/tab.test.ts:155-391` — escape/trap/flow, 3+ zone cycle | — |
| 2 | A2. Zone role presets | ✅ | `roleRegistry.ts` — resolveRole() 6 presets. `page.goto(zone, {config})` passes role | — |
| 2 | A3. Zone config overrides (navigate/tab/select/dismiss) | ✅ | `page.ts:159` — `resolveRole(role, overrides)`. `FocusGroupConfig` covers all | — |
| 2 | A4. Zone modules headless coverage (9 modules) | ⚠️ | — | → A4a~A4i |
| 3 | A4a. crud (create/delete/duplicate) | ✅ | `onAction`, `onDelete`, `onCheck` in ZoneBindings. `OS_DELETE` tested | — |
| 3 | A4b. reorder | ✅ | `onMoveUp/Down`, Meta+Arrow tested (`todo-sidebar.test.ts:51-78`) | — |
| 3 | A4c. reparent | ✅ | Tree-paste tested (`tree-paste.test.ts:32-48`), Alt+Arrow | — |
| 3 | A4d. clipboard | ✅ | Meta+c/x/v shim (`simulate.ts:62-68`), `onCopy/Cut/Paste` | — |
| 3 | A4e. select | ✅ | Shift+Arrow range, Meta+click toggle, Meta+A all (`focus.test.ts:109-262`) | — |
| 3 | A4f. activate | ✅ | Enter → `onAction`, click → focus+activate (`todo-bdd.test.ts`) | — |
| 3 | A4g. history | ✅ | `onUndo/onRedo`, `undoCommand()`/`redoCommand()` dispatch | — |
| 3 | A4h. deleteToast | ⚠️ | `OS_DELETE` works, toast는 UI-only (headless 불가). Focus recovery는 동작 | 🔨 WP-TOAST |
| 3 | A4i. **dnd (drag & drop)** | ❌ | `simulate.ts`에 drag 시뮬레이션 없음. `onReorder` prop은 있으나 headless 호출 경로 없음 | 🔨 WP-DND |
| 2 | A5. `app.zone()` data model (from/to/entity/with[]) | N/A | 미래 구현. 현재 범위 밖 (Constraint) | — |
| **1** | **B. Item verification** | ⚠️ | — | → B1~B4 |
| 2 | B1. computeItem/computeAttrs | ✅ | `compute.ts:L18-200` — 완전한 Item ARIA 계산. `page.attrs(id)` 노출 | — |
| 2 | B2. ItemState (isFocused/isSelected/isAnchor) | ✅ | `headless.types.ts:L61-64` — ItemResult.state 완전 일치 | — |
| 2 | B3. ARIA attrs 커버리지 | ✅ | `ItemAttrs`: selected, checked, pressed, expanded, current, disabled, valuenow/min/max, controls, hidden | — |
| 2 | B4. **Locator assertion helpers** | ❌ | `locator().toBeFocused()` 만 존재. `toBeSelected/Expanded/Checked/Pressed/Disabled` 없음 | 🔨 WP-LOCATOR |
| **1** | **C. Field verification** | ❌ | — | → C1~C4 |
| 2 | C1. Field value read/write | ✅ | `FieldRegistry.getValue(id)`, `page.keyboard.type(text)`. 동작 확인됨 | — |
| 2 | C2. **page.field() API wrapper** | ❌ | `page.ts`에 field() 메서드 없음. `FieldRegistry` 직접 접근만 가능 | 🔨 WP-FIELD-API |
| 2 | C3. **isEditing state** | ❌ | `ZoneState.editingItemId`만 존재 (zone-level). Field-scoped isEditing 없음. `FieldState`에도 없음 | 🔨 WP-FIELD-EDITING |
| 2 | C4. IME composition state | ❌ | 전혀 없음. DOM-only 관심사인지, headless에서 필요한지 판단 필요 | ⚠️ 범위 불확실 |
| **1** | **D. Trigger verification** | ❌ | — | → D1~D3 |
| 2 | D1. computeTrigger() headless 함수 | ✅ | `compute.ts:L207-224` — aria-haspopup, aria-expanded, aria-controls 완전 계산 | — |
| 2 | D2. **page.trigger() API wrapper** | ❌ | `page.ts`에 trigger() 메서드 없음. `computeTrigger`는 있지만 미노출 | 🔨 WP-TRIGGER-API |
| 2 | D3. resolveElement() 통합 | ✅ | `compute.ts:L242` — Item + Trigger attrs 자동 병합. `page.locator(id).attrs` 사용 가능 | — |
| **1** | **E. Playwright 동형성** | ⚠️ | — | → E1~E4 |
| 2 | E1. locator() API | ✅ | `page.locator(id)` — attrs, getAttribute, click, toHaveAttribute, toBeFocused | — |
| 2 | E2. keyboard.press/type | ✅ | `page.keyboard.press(key)`, `page.keyboard.type(text)` — Playwright 동형 | — |
| 2 | E3. click with modifiers | ✅ | `page.click(id, {shift, meta, ctrl})` — `locator.click({modifiers})` 도 지원 | — |
| 2 | E4. **Assertion helpers 완성** | ❌ | `toBeFocused()` 만 존재 | → B4 (WP-LOCATOR과 동일) |

---

## Work Packages

| WP | Subgoal | Chain | Evidence | 규모 | headless-simulator Phase |
|----|---------|-------|----------|------|-------------------------|
| **WP-LOCATOR** | Locator assertion helpers 완성 | Goal ← B ← B4, Goal ← E ← E4 | `page.ts:352-374` — toBeFocused만 존재 | S | Phase 2 (T9 인접) |
| **WP-FIELD-API** | page.field(id) API wrapper | Goal ← C ← C2 | `FieldRegistry` 존재하나 page 미노출 | S | Phase 4 (T14 인접) |
| **WP-FIELD-EDITING** | Field isEditing state headless 노출 | Goal ← C ← C3 | `ZoneState.editingItemId` zone-level만 존재 | M | Phase 4 (T14 인접) |
| **WP-TRIGGER-API** | page.trigger(id) API wrapper | Goal ← D ← D2 | `computeTrigger` 존재하나 page 미노출 | S | Phase 3 (T11 인접) |
| **WP-DND** | DnD headless simulation | Goal ← A ← A4 ← A4i | `simulate.ts`에 drag 없음 | L | Phase 3+ (별도) |
| **WP-TOAST** | deleteToast headless equivalent | Goal ← A ← A4 ← A4h | Toast = UI-only. headless 대안 필요 | S | Backlog |

---

## Work Package 상세

### WP-LOCATOR (S) — Locator Assertion Helpers

**현재**: `locator(id).toBeFocused()` 만 존재
**목표**: Playwright `expect(locator).toHaveAttribute()` 동형으로 ZIFT 상태 검증

```typescript
// 추가할 helpers:
locator(id).toBeSelected()     // aria-selected === true
locator(id).toBeExpanded()     // aria-expanded === true
locator(id).toBeChecked()      // aria-checked === true
locator(id).toBePressed()      // aria-pressed === true
locator(id).toBeDisabled()     // aria-disabled === true
locator(id).toBeCurrent()      // aria-current === "true"
```

**구현**: `page.ts:352-374`에 6개 메서드 추가. 내부는 `computeAttrs` 호출 → boolean 리턴.
**의존**: 없음. `computeAttrs`가 이미 모든 값을 계산함.

### WP-FIELD-API (S) — page.field() Wrapper

**현재**: `FieldRegistry.getValue(id)` 직접 접근만 가능
**목표**: TestPage에서 Field 상태를 Playwright 스타일로 조회

```typescript
page.field(fieldId) → {
  value: FieldValue;
  isDirty: boolean;
  isValid: boolean;
  error: string | null;
}
```

**구현**: `page.ts`에 `field()` 메서드 추가. 내부는 `FieldRegistry.getField(id).state` 리턴.
**의존**: FieldRegistry (이미 존재).

### WP-FIELD-EDITING (M) — isEditing Headless State

**현재**: `ZoneState.editingItemId`만 존재 (어떤 **Item**이 편집 중인지). Field-scoped 편집 상태 없음.
**목표**: `page.field(fieldId).isEditing` — deferred mode 진입/이탈 감지

**문제**: `editingItemId`는 Item 단위. Field가 Item에 속하므로, itemId → fieldId 매핑 필요.
**의존**: Field → Item 매핑 메커니즘 (현재 `zoneEntry.fieldId`로 1:1 존재하나 N:1은 미지원)

### WP-TRIGGER-API (S) — page.trigger() Wrapper

**현재**: `computeTrigger(kernel, id)` 함수 존재하나 page API 미노출
**목표**: TestPage에서 Trigger ARIA 상태 조회

```typescript
page.trigger(triggerId) → {
  isOpen: boolean;           // overlay 열림 여부
  "aria-haspopup": string;   // dialog | menu | listbox | ...
  "aria-controls": string;   // overlay ID
}
```

**구현**: `page.ts`에 `trigger()` 메서드 추가. 내부는 `computeTrigger(os, id)` 리턴.
**의존**: 없음. `computeTrigger`와 `TriggerOverlayRegistry` 이미 존재.

### WP-DND (L) — Drag & Drop Headless Simulation

**현재**: `simulate.ts`에 drag 이벤트 시뮬레이션 없음. `onReorder` prop은 있으나 호출 경로 없음.
**목표**: headless에서 DnD 기반 reorder/reparent를 시뮬레이션

**복잡도**: DOM DnD API(dragstart/dragover/drop)를 headless 추상화해야 함.
대안: reorder/reparent는 이미 keyboard(Meta+Arrow, Alt+Arrow)로 커버됨.
DnD 고유 검증 = "드래그 앤 드롭 시 같은 커맨드가 디스패치되는가?" → 이는 UI adapter 검증이므로 headless 범위 밖일 수 있음.

**판단 필요**: DnD headless가 반드시 필요한가, 아니면 keyboard 커버리지로 충분한가?

### WP-TOAST (S) — DeleteToast Headless

**현재**: Toast는 순수 UI (overlay + timer). Headless에서 "삭제 후 되돌리기" 흐름 검증 불가.
**대안**: Toast의 본질 = Undo 기회. `page.dispatch(undoCommand())`로 동일 효과 검증 가능.
**판단**: Backlog. History 모듈이 Toast의 headless 대안.

---

## headless-simulator BOARD 매핑

| WP | BOARD Phase | 기존 Task | 관계 |
|----|------------|-----------|------|
| WP-LOCATOR | Phase 2 | T9 (`page.isFocused`) | T9 확장 — isFocused 외 6개 helper 추가 |
| WP-FIELD-API | Phase 4 | T14 (Field 분리) | T14 전제조건 — Field headless API 먼저 정의 |
| WP-FIELD-EDITING | Phase 4 | T14 (Field 분리) | T14와 동시 수행 가능 |
| WP-TRIGGER-API | Phase 3 | T11 (Trigger 정리) | T11 전제조건 — Trigger headless API 먼저 정의 |
| WP-DND | 별도 | 없음 | 새 Phase 또는 Backlog |
| WP-TOAST | Backlog | 없음 | History 모듈로 대체 가능 |

---

## Residual Uncertainty

- **C4 (IME composition)**: headless에서 IME를 시뮬레이션해야 하는가? DOM compositionstart/end 이벤트는 headless 불가. OS가 IME를 추상화해야 하는지 미확정.
- **WP-DND**: DnD의 headless 필요성. Keyboard로 동일 커맨드를 트리거할 수 있다면, DnD headless는 "UI adapter 검증"이므로 headless 범위 밖일 수 있음.
- **WP-FIELD-EDITING**: N:1 Field→Item 매핑이 필요해지면 FieldRegistry 구조 변경 필요.

---

## Summary

```
ZIFT 인터페이스 불변 검증 커버리지:
  Zone:    ████████░░ 80% (8/9 modules, DnD 미지원)
  Item:    █████████░ 90% (compute 완전, helper 부족)
  Field:   ████░░░░░░ 40% (값 R/W만, API/상태 미노출)
  Trigger: ███████░░░ 70% (compute 완전, API 미노출)
  PW 동형: ████████░░ 80% (locator 기본만)

Work Packages: 6건
  S(Small): 4건 (LOCATOR, FIELD-API, TRIGGER-API, TOAST)
  M(Medium): 1건 (FIELD-EDITING)
  L(Large): 1건 (DND)
```
