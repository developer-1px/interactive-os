# OS Specification — Single Source of Truth

> 모든 동작 계약을 이 문서 하나로 관리한다.
> 코드는 이 문서를 따르고, 테스트는 이 문서를 검증한다.
>
> Last verified: 2026-02-16

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  App (defineApp)                                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │  OS Layer                                           ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            ││
│  │  │Listeners │→│ Keymaps  │→│ Commands │→ Effects   ││
│  │  │(1)       │ │          │ │(3)       │  (4)       ││
│  │  └──────────┘ └──────────┘ └──────────┘            ││
│  │       ↑              ↓            ↓                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            ││
│  │  │Components│ │ Contexts │ │  State   │            ││
│  │  │(6)       │ │(2)       │ │          │            ││
│  │  └──────────┘ └──────────┘ └──────────┘            ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  Kernel (packages/kernel)                           ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 2. State Shape

| Path | Type | Description |
|------|------|-------------|
| `os.focus.activeZoneId` | `string \| null` | 현재 활성 zone |
| `os.focus.zones[id].focusedItemId` | `string \| null` | zone 내 포커스된 아이템 |
| `os.focus.zones[id].lastFocusedId` | `string \| null` | 마지막 포커스 (restore용) |
| `os.focus.zones[id].recoveryTargetId` | `string \| null` | 삭제 후 복구 대상 |
| `os.focus.zones[id].selection` | `string[]` | 선택된 아이템 목록 |
| `os.focus.zones[id].expandedItems` | `string[]` | 확장된 아이템 목록 |
| `os.focus.focusStack` | `FocusStackEntry[]` | modal 복원용 스택 |

---

## 3. Command Behavior Table

> 각 커맨드의 Payload → State 변경 → Effect를 명세한다.
> Status: ✅ 구현 완료 + 테스트 | ⚠️ 구현됨 테스트 미흡 | ❌ 미구현/불완전

### 3.1 Focus Commands

| Command | Payload | State Change | Effects | Status |
|---------|---------|-------------|---------|--------|
| `FOCUS` | `{ zoneId, itemId }` | `activeZoneId = zoneId`, zone의 `focusedItemId = itemId` | `focus: itemId` | ✅ |
| `SYNC_FOCUS` | `{ zoneId, itemId }` | zone의 `focusedItemId = itemId`, `activeZoneId = zoneId` | — (no focus effect) | ✅ |
| `RECOVER` | `{ zoneId }` | `focusedItemId = recoveryTargetId \|\| lastFocusedId` | `focus: targetId` | ✅ |
| `STACK_PUSH` | `{ zoneId }` | focusStack에 현재 상태 push | — | ✅ |
| `STACK_POP` | `{}` | focusStack에서 pop, 이전 zone/item 복원 | `focus: restoredId` | ✅ |

### 3.2 Navigation Commands

| Command | Payload | Behavior (config-dependent) | Effects | Status |
|---------|---------|---------------------------|---------|--------|
| `NAVIGATE` | `{ direction }` | orientation에 따라 방향 필터링, loop/clamp 적용 | `focus: targetId` | ✅ |

**Navigate Config Matrix:**

| orientation | direction=down | direction=up | direction=left | direction=right |
|-------------|---------------|-------------|---------------|----------------|
| `vertical` | 다음 아이템 | 이전 아이템 | 무시 | 무시 |
| `horizontal` | 무시 | 무시 | 이전 아이템 | 다음 아이템 |
| `both` | 아래 가장 가까운 | 위 가장 가까운 | 왼쪽 가장 가까운 | 오른쪽 가장 가까운 |

| loop | 끝에서 방향키 |
|------|-------------|
| `true` | 처음/끝으로 순환 |
| `false` | 이동 없음 (clamp) |

| entry | zone 진입 시 |
|-------|------------|
| `first` | 첫 번째 아이템 |
| `last` | 마지막 아이템 |
| `restore` | lastFocusedId |
| `selected` | 선택된 아이템 (없으면 first) |

### 3.3 Tab Commands

| Command | Payload | Behavior (config-dependent) | Effects | Status |
|---------|---------|---------------------------|---------|--------|
| `TAB` | `{ direction }` | behavior에 따라 분기 | `focus: targetId` | ✅ |

**Tab Config Matrix:**

| behavior | Tab forward | Tab backward | 경계에서 |
|----------|------------|-------------|---------|
| `trap` | 다음 아이템 (순환) | 이전 아이템 (순환) | 처음/끝으로 wrap |
| `flow` | 다음 아이템 | 이전 아이템 | 다음/이전 zone으로 escape |
| `escape` | 다음 zone의 첫 아이템 | 이전 zone의 마지막 아이템 | zone 밖으로 즉시 이동 |

| restoreFocus | 의미 |
|-------------|------|
| `true` | zone 언마운트 시 이전 포커스 복원 (dialog) |
| `false` | 복원 안함 |

### 3.4 Selection Commands

| Command | Payload | State Change | Effects | Status |
|---------|---------|-------------|---------|--------|
| `SELECT` | `{ targetId, meta }` | meta.cmd → toggle, meta.shift → range, 기본 → set | — | ✅ |
| `SELECTION_SET` | `{ items }` | `selection = items` | — | ✅ |
| `SELECTION_ADD` | `{ items }` | `selection += items` | — | ✅ |
| `SELECTION_REMOVE` | `{ items }` | `selection -= items` | — | ✅ |
| `SELECTION_TOGGLE` | `{ items }` | 각 item toggle | — | ✅ |
| `SELECTION_CLEAR` | `{}` | `selection = []` | — | ✅ |
| `OS_SELECT_ALL` | `{}` | `selection = DOM_ITEMS 전체` | — | ✅ |

**Select Config Matrix:**

| mode | 동작 |
|------|------|
| `none` | 선택 불가 |
| `single` | 하나만 선택 |
| `multiple` | 여러 개 선택 가능 |

| followFocus | 동작 |
|------------|------|
| `true` | 포커스 이동 시 자동 선택 (radio, tablist) |
| `false` | Enter/Space/Click으로만 선택 |

| disallowEmpty | 동작 |
|--------------|------|
| `true` | 최소 1개 항상 선택 (radio, tablist) |
| `false` | 모두 선택 해제 가능 |

| range | 동작 |
|-------|------|
| `true` | Shift+Click으로 범위 선택 |
| `false` | 범위 선택 불가 |

| toggle | 동작 |
|--------|------|
| `true` | Cmd/Ctrl+Click으로 토글 |
| `false` | 토글 불가 |

### 3.5 Interaction Commands

| Command | Payload | Behavior | Effects | Status |
|---------|---------|----------|---------|--------|
| `ACTIVATE` | `{ targetId }` | onAction 콜백 dispatch | `dispatch: onAction` | ✅ |
| `OS_CHECK` | `{ targetId }` | onCheck 콜백 dispatch | `dispatch: onCheck` | ✅ |
| `ESCAPE` | `{}` | dismiss.escape 설정에 따라: close→onDismiss, deselect→selection clear | `dispatch: onDismiss` | ✅ |
| `OS_DELETE` | `{}` | onDelete 콜백 dispatch (선택된 아이템 대상) | `dispatch: onDelete` | ✅ |
| `OS_MOVE_UP` | `{}` | onMoveUp 콜백 dispatch | `dispatch: onMoveUp` | ✅ |
| `OS_MOVE_DOWN` | `{}` | onMoveDown 콜백 dispatch | `dispatch: onMoveDown` | ✅ |
| `OS_UNDO` | `{}` | onUndo 콜백 dispatch | `dispatch: onUndo` | ✅ |
| `OS_REDO` | `{}` | onRedo 콜백 dispatch | `dispatch: onRedo` | ✅ |

### 3.6 Clipboard Commands

| Command | Payload | Behavior | Effects | Status |
|---------|---------|----------|---------|--------|
| `OS_COPY` | `{}` | onCopy 콜백 dispatch (선택된 아이템 대상) | `dispatch: onCopy` | ✅ |
| `OS_CUT` | `{}` | onCut 콜백 dispatch (선택된 아이템 대상) | `dispatch: onCut` | ✅ |
| `OS_PASTE` | `{}` | onPaste 콜백 dispatch | `dispatch: onPaste` | ✅ |

### 3.7 Expand Commands

| Command | Payload | State Change | Effects | Status |
|---------|---------|-------------|---------|--------|
| `EXPAND` | `{ targetId, expanded }` | expandedItems에 추가/제거 | — | ✅ |

### 3.8 Field Commands

| Command | Payload | Behavior | Effects | Status |
|---------|---------|----------|---------|--------|
| `FIELD_START_EDIT` | `{ fieldId }` | editing 상태 진입 | — | ✅ |
| `FIELD_COMMIT` | `{ fieldId, value }` | 값 커밋, editing 종료 | — | ✅ |
| `FIELD_CANCEL` | `{ fieldId }` | 취소, editing 종료 | — | ✅ |

### 3.9 Overlay Commands

| Command | Payload | Behavior | Effects | Status |
|---------|---------|----------|---------|--------|
| `OVERLAY_OPEN` | `{ overlayId }` | 오버레이 열기, 포커스 이동 | — | ✅ |
| `OVERLAY_CLOSE` | `{ overlayId }` | 오버레이 닫기, 포커스 복원 | — | ✅ |

---

## 4. Effect Contract

| Effect Key | Payload | DOM Action | Registered |
|------------|---------|-----------|-----------|
| `focus` | `itemId: string` | `el.focus({ preventScroll: true })` | ✅ |
| `scroll` | `itemId: string` | `el.scrollIntoView({ block: "nearest" })` | ✅ |
| `blur` | — | `document.activeElement.blur()` | ✅ |
| `click` | `itemId: string` | `el.click()` | ✅ |

---

## 5. Context Contract

| Context | Returns | Used By |
|---------|---------|---------|
| `DOM_ITEMS` | `string[]` — 활성 zone의 아이템 ID 목록 (DOM 순서) | NAVIGATE, TAB, SELECT, DELETE 등 |
| `DOM_RECTS` | `Map<string, DOMRect>` — 활성 zone 아이템의 위치 | NAVIGATE (spatial) |
| `ZONE_CONFIG` | `FocusGroupConfig` — 활성 zone의 설정 | NAVIGATE, TAB, SELECT, ACTIVATE 등 |
| `DOM_ZONE_ORDER` | `ZoneOrderEntry[]` — 모든 zone의 DOM 순서 + first/last item | TAB (cross-zone escape) |

---

## 6. Keymap Table

### 6.1 Navigation (when: navigating)

| Key | Command | Args |
|-----|---------|------|
| `ArrowDown` | NAVIGATE | `{ direction: "down" }` |
| `ArrowUp` | NAVIGATE | `{ direction: "up" }` |
| `ArrowLeft` | NAVIGATE | `{ direction: "left" }` |
| `ArrowRight` | NAVIGATE | `{ direction: "right" }` |
| `Home` | NAVIGATE | `{ direction: "home" }` |
| `End` | NAVIGATE | `{ direction: "end" }` |
| `Tab` | TAB | `{ direction: "forward" }` |
| `Shift+Tab` | TAB | `{ direction: "backward" }` |

### 6.2 Interaction (when: navigating)

| Key | Command | Args |
|-----|---------|------|
| `Enter` | ACTIVATE | `{}` |
| `Escape` | ESCAPE | `{}` |
| `Delete` / `Backspace` | OS_DELETE | `{}` |
| `Alt+ArrowUp` | OS_MOVE_UP | `{}` |
| `Alt+ArrowDown` | OS_MOVE_DOWN | `{}` |
| `Meta+Z` | OS_UNDO | `{}` |
| `Meta+Shift+Z` | OS_REDO | `{}` |
| `Meta+A` | OS_SELECT_ALL | `{}` |

### 6.3 Clipboard (when: navigating)

| Key | Command | Args |
|-----|---------|------|
| `Meta+C` | OS_COPY | `{}` |
| `Meta+X` | OS_CUT | `{}` |
| `Meta+V` | OS_PASTE | `{}` |

### 6.4 Field (when: editing)

| Key | Command | Args |
|-----|---------|------|
| `Enter` | FIELD_COMMIT | `{}` |
| `Escape` | FIELD_CANCEL | `{}` |

### 6.5 Special (KeyboardListener)

| Key | Condition | Behavior |
|-----|-----------|----------|
| `Space` | checkbox/switch role OR zone.onCheck | OS_CHECK (W3C APG override) |

---

## 7. ARIA Role Preset Table

> 각 role이 어떤 config를 세팅하는지의 진실의 원천.

| Role | orient | loop | entry | select.mode | followFocus | tab | activate | dismiss.esc | autoFocus |
|------|--------|------|-------|------------|------------|-----|----------|------------|-----------|
| `group` | V | — | — | none | — | flow | — | — | — |
| `listbox` | V | ✗ | selected | single | ✓ | escape | — | — | — |
| `menu` | V | ✓ | first | none | — | trap | auto | close | ✓ |
| `menubar` | H | ✓ | restore | none | — | escape | auto | — | — |
| `radiogroup` | V | ✓ | selected | single | ✓ | escape | — | — | — |
| `tablist` | H | ✓ | selected | single | ✓ | escape | auto | — | — |
| `toolbar` | H | ✓ | restore | none | — | escape | — | — | — |
| `grid` | 2D | ✗ | — | multiple | ✗ | escape | — | — | — |
| `treegrid` | 2D | ✗ | — | multiple | ✗ | escape | manual | — | — |
| `tree` | V | ✗ | selected | single | ✗ | escape | manual | — | — |
| `dialog` | V | — | — | — | — | trap | — | close | ✓ |
| `alertdialog` | V | — | — | — | — | trap | — | close | ✓ |
| `combobox` | V | ✗ | — | single | ✓ | escape | — | close | — |
| `feed` | V | ✗ | — | — | — | escape | — | — | — |
| `accordion` | V | ✗ | — | — | — | escape | manual | — | — |
| `disclosure` | — | — | — | — | — | flow | manual | — | — |

**Legend**: V=vertical, H=horizontal, 2D=both, ✓=true, ✗=false, —=default

---

## 8. Listener Contract

### 8.1 KeyboardListener

| Step | Action |
|------|--------|
| 1 | `e.defaultPrevented \|\| e.isComposing` → 무시 |
| 2 | Inspector 내부 (`[data-inspector]`) → 무시 |
| 3 | `getCanonicalKey(e)` → 정규화된 키 문자열 |
| 4 | `isEditing` 판단 (input/textarea/contentEditable) |
| 5 | Space + checkbox/switch → `OS_CHECK` 오버라이드 |
| 6 | `Keybindings.resolve(key, { isEditing })` → binding |
| 7 | binding 없음 → `kernel.resolveFallback(e)` |
| 8 | binding 있음 → `kernel.dispatch(command)` + `e.preventDefault()` |

### 8.2 FocusListener

| Event | Action |
|-------|--------|
| `mousedown` | `ZoneRegistry`에서 zone/item 탐색 → `FOCUS` + `SELECT` dispatch |
| `focusin` | 다른 zone으로 포커스 이동 시 `SYNC_FOCUS` dispatch |
| `MutationObserver` | 포커스된 요소 제거 시 `RECOVER` dispatch |

---

## 9. Component Contract

### 9.1 FocusGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | (required) | Zone ID |
| `role` | `ZoneRole` | `"group"` | ARIA role preset |
| `navigate` | `Partial<NavigateConfig>` | — | 네비 오버라이드 |
| `tab` | `Partial<TabConfig>` | — | Tab 오버라이드 |
| `select` | `Partial<SelectConfig>` | — | 선택 오버라이드 |
| `activate` | `Partial<ActivateConfig>` | — | 활성화 오버라이드 |
| `dismiss` | `Partial<DismissConfig>` | — | 해제 오버라이드 |
| `onAction` | `BaseCommand` | — | Enter/Space 시 dispatch |
| `onDismiss` | `BaseCommand` | — | Escape 시 dispatch |
| `onSelect` | `BaseCommand` | — | 선택 변경 시 dispatch |
| `onCheck` | `BaseCommand` | — | Space로 체크 시 dispatch |
| `onDelete` | `BaseCommand` | — | Delete 시 dispatch |
| `onCopy/Cut/Paste` | `BaseCommand` | — | 클립보드 시 dispatch |
| `onMoveUp/Down` | `BaseCommand` | — | 이동 시 dispatch |
| `onUndo/Redo` | `BaseCommand` | — | 실행취소 시 dispatch |

### 9.2 FocusItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | (required) | Item ID |
| `disabled` | `boolean` | `false` | 비활성화 |
| `as` | `ElementType` | `"div"` | 렌더링 요소 |
| `asChild` | `boolean` | `false` | cloneElement 모드 |

**Derived ARIA attributes:**

| Attribute | Source | Rule |
|-----------|--------|------|
| `tabIndex` | `visualFocused` | focused → 0, else → -1 |
| `aria-current` | `isFocused && isGroupActive` | 시각적 포커스 표시 |
| `aria-selected` | `selection.includes(id)` | non-checked roles |
| `aria-checked` | `selection.includes(id)` | radio/checkbox/switch roles |
| `aria-expanded` | `expandedItems.includes(id)` | treeitem/menuitem roles |
| `aria-disabled` | `disabled` prop | — |
| `data-item-id` | `id` prop | Listener/Effect 탐색용 |
| `data-focused` | `visualFocused` | CSS 스타일링용 |
| `data-selected` | `isSelected` | CSS 스타일링용 |

---

## 10. Middleware

| Middleware | Trigger | Behavior | Status |
|-----------|---------|----------|--------|
| `historyKernelMiddleware` | state-changing commands | Undo/Redo 스택 관리 | ✅ |
| `macFallbackMiddleware` | unhandled keyboard events | Mac 특수 키 처리 | ✅ |

---

## 11. Test Coverage Map

> E2E: 26 tests (`focus-showcase.spec.ts`)
> Unit: 다수 (`navigate`, `tab`, `escape`, `expand`, `stack`, `field`, `overlay`, `rolePresets`, `roleHelpers`, etc.)

| Spec Area | E2E Tests | Unit Tests | Status |
|-----------|-----------|------------|--------|
| Entry: first/last | ✅ | ✅ `navigate.test` | ✅ |
| Entry: restore | ✅ | ✅ `navigate.test` | ✅ |
| Navigate (vertical loop) | ✅ | ✅ `navigate.test` | ✅ |
| Navigate (horizontal clamp) | ✅ | ✅ `navigate.test` | ✅ |
| Navigate (2D grid) | ✅ | — | ⚠️ spatial은 DOM 의존, E2E로 충분 |
| Navigate (Home/End) | ✅ | ✅ `navigate.test` | ✅ |
| Navigate (orthogonal ignored) | ✅ | ✅ `navigate.test` | ✅ |
| Navigate (typeahead) | — | ✅ `typeahead.test` | ✅ 구현 + 테스트 |
| Select (Cmd+Click toggle) | ✅ | ✅ | ✅ |
| Select (Shift+Click range) | ✅ | ✅ | ✅ |
| Select (single toggle) | ✅ | ✅ | ✅ |
| Select (followFocus/radio) | ✅ | — | ✅ E2E 충분 |
| Tab (trap + Shift+Tab) | ✅ | ✅ `tab.test` | ✅ |
| Tab (escape + Shift+Tab) | ✅ | ✅ `tab.test` | ✅ |
| Tab (flow + Shift+Tab) | ✅ | ✅ `tab.test` | ✅ |
| Activate (automatic) | ✅ | — | ✅ E2E 충분 |
| Activate (manual + listbox preset) | ✅ | — | ✅ §7 preset 검증 |
| Dismiss (escape=deselect) | ✅ | ✅ `escape.test` | ✅ |
| Dismiss (escape=close) | ✅ | ✅ `escape.test` | ✅ |
| Expand (tree toggle) | ✅ | ✅ `expand.test` | ✅ |
| Expand (collapsed skip) | ✅ | ✅ `expand.test` | ✅ |
| Focus Stack (single modal) | ✅ | ✅ `stack.test` | ✅ |
| Focus Stack (nested modals) | ✅ | ✅ `stack.test` | ✅ |
| ARIA: tabIndex roving | ✅ | — | ✅ E2E 충분 |
| ARIA: data-focused | ✅ | — | ✅ E2E 충분 |
| Clipboard (copy/cut/paste) | ✅ `dogfooding` | ✅ | ✅ |
| Delete (single/multi) | ✅ `dogfooding` | ✅ | ✅ |
| Undo/Redo | ✅ `dogfooding` | ✅ `history.test` | ✅ |
| Field (edit/commit/cancel) | — | ✅ `field.test` | ✅ state 전환 검증 |
| Overlay (open/close) | — | ✅ `overlay.test` | ✅ G3 해결 |
| Role Presets (§7 table) | — | ✅ `rolePresets.test` | ✅ 17 roles × 9 fields |
| Role Helpers (child/check/expand) | — | ✅ `roleHelpers.test` | ✅ |

---

## Appendix: Known Gaps (코드 역추적에서 발견)

| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| G1 | ~~`tabEscape` effect 미등록~~ | ~~Critical~~ | ✅ 수정됨 — TAB 커맨드가 직접 zone 이동 처리 |
| G2 | ~~Field 커맨드 테스트 없음~~ | ~~Medium~~ | ✅ `field.test.ts` — 14개 unit test |
| G3 | ~~Overlay 커맨드 테스트 없음~~ | ~~Medium~~ | ✅ `overlay.test.ts` — 9개 unit test |
| G4 | `recoveryTargetId` 동작 미검증 | Low | RECOVER 커맨드의 E2E 없음 |
| G5 | `seamless` 네비게이션 미구현 확인 필요 | Low | builderBlock/application role에서 사용 |
| G6 | ~~`typeahead` 네비게이션 미구현~~ | ~~Low~~ | ✅ `typeahead.ts` 구현 + 12개 unit test |
| G7 | ~~History middleware unit test 부재~~ | ~~Medium~~ | ✅ `history.test.ts` — 13개 unit test |
