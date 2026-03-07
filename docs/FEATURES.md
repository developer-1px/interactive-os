# Feature Matrix

> **이 문서의 목적**: Interactive OS의 모든 기능을 한 눈에 본다.
>
> **상태 범례**: ✅ 구현 완료 · 🔧 부분 구현 · 📋 제안/미착수 · 🚧 진행 중
>
> **구조**: concept-map 18개 카테고리 = 이 문서의 섹션.
> 각 기능이 `docs/1-project/`의 프로젝트나 `docs/5-backlog/os-gaps.md`와 연결되면 링크한다.
>
> **갱신 규칙**: 기능이 추가/변경되면 이 문서를 갱신한다. `/status`는 프로젝트 현황, 이 문서는 기능 현황.

---

## Summary

| 카테고리 | 전체 | ✅ | 🔧 | 📋 |
|---------|------|-----|-----|-----|
| 1. Topology | 5 | 5 | 0 | 0 |
| 2. Navigation | 6 | 5 | 1 | 0 |
| 3. Focus | 6 | 6 | 0 | 0 |
| 4. Selection | 5 | 5 | 0 | 0 |
| 5. Activation | 4 | 2 | 0 | 2 |
| 6. Field | 9 | 8 | 1 | 0 |
| 7. Overlay | 7 | 5 | 2 | 0 |
| 8. Expansion | 4 | 4 | 0 | 0 |
| 9. Drag & Drop | 4 | 1 | 0 | 3 |
| 10. Clipboard | 4 | 4 | 0 | 0 |
| 11. History | 4 | 4 | 0 | 0 |
| 12. Data | 7 | 5 | 1 | 1 |
| 13. CRUD | 5 | 5 | 0 | 0 |
| 14. Command | 6 | 6 | 0 | 0 |
| 15. Pipeline | 6 | 6 | 0 | 0 |
| 16. ARIA | 5 | 4 | 0 | 1 |
| 17. App Framework | 8 | 8 | 0 | 0 |
| 18. Verification | 5 | 4 | 1 | 0 |
| **합계** | **100** | **91** | **6** | **7** |

---

## 1. Topology (공간 구조)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Zone | ✅ | zoneRegistry.test | `os-core/engine/registries/zoneRegistry.ts` | 22 role presets |
| Item | ✅ | computeItem tests | `os-core/headless/` | `Record<id, AriaItemState>` |
| Hierarchy | ✅ | tree.test, treegrid.test | `os-sdk/library/collection/treeUtils.ts` | parent-child, nested zones |
| Orientation | ✅ | navigate.test | Zone config `orientation` | horizontal, vertical, grid(2D) |
| Boundary | ✅ | navigate.test | Zone config `boundary` | wrap, stop, escape-to-parent |

---

## 2. Navigation (공간 이동)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Arrow Navigation | ✅ | navigate.test (30+) | `os-core/3-commands/navigate/` | 7 strategies: linear, spatial, corner, typeahead |
| Tab Navigation | ✅ | tab.test (8+) | `os-core/3-commands/interaction/tab.ts` | Cross-zone Tab/Shift+Tab |
| Typeahead | ✅ | typeahead.test (12) | `os-core/2-resolve/typeaheadFallbackMiddleware.ts` | Single-char jump |
| Home/End | ✅ | navigate.test | osDefaults keybinding | First/last item jump |
| Page Up/Down | 🔧 | — | osDefaults keybinding | Bound but no page-size logic |
| Cross-Zone | ✅ | tab.test, focus-showcase.spec | Tab + focus delegation | |

---

## 3. Focus (초점 시스템)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Focus Tracking | ✅ | sync-focus.test | `os-core/4-command/focus/` | focusedItemId, activeZoneId |
| Active Zone | ✅ | zoneRegistry.test | `os-core/engine/registries/zoneRegistry.ts` | Single active zone |
| Focus Stack | ✅ | stack.test (13) | `os-core/4-command/focus/stack.ts` | Modal push/pop |
| Focus Recovery | ✅ | recover.test | `os-core/3-commands/navigate/` | Auto-recover on item delete |
| Focus Sync | ✅ | virtualFocus.test | `os-core/4-command/focus/syncFocus.ts` | Virtual state → DOM |
| AutoFocus | ✅ | — | Zone config `autoFocus` | first/last/restore/selected |

---

## 4. Selection (선택)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Single Select | ✅ | os-commands.test | `os-core/3-commands/selection/` | follow-focus mode |
| Multi Select | ✅ | multi-select-commands.test | `os-core/3-commands/selection/` | Space toggle |
| Range Select | ✅ | multi-select-commands.test | Shift+Arrow | |
| Select All | ✅ | os-commands.test | `OS_SELECT_ALL` | Ctrl+A |
| Selection Clear | ✅ | os-commands.test | `OS_SELECTION_CLEAR` | Escape |

---

## 5. Activation (활성화)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Enter Activate | ✅ | os-commands.test, APG tests | `OS_ACTIVATE` | onAction callback |
| Space Toggle | ✅ | checkbox.test, switch.test | `OS_PRESS`, `OS_CHECK` | |
| Double-Click Edit | 📋 | — | — | 개념만 존재. OS 레벨 지원 없음 |
| Context Menu | 📋 | — | — | VISION.md 제안. Shift+F10, 우클릭 |

---

## 6. Field (속성 편집)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Edit Lifecycle | ✅ | field.test (14) | `os-core/3-commands/field/` | start → edit → commit/cancel |
| String (inline) | ✅ | field.test | Field config `type: "string"` | |
| String (tokens) | ✅ | — | Field config | Tag-style editing |
| String (block) | ✅ | — | Field config | Multi-line |
| String (editor) | ✅ | — | Field config | contentEditable |
| Boolean | ✅ | checkbox.test, switch.test | `OS_CHECK` / `OS_PRESS` | |
| Number | ✅ | spinbutton.test, slider.test | `OS_VALUE_CHANGE` | |
| Enum | 🔧 | combobox.test | — | combobox 동작하나 OS 레벨 추상화 미완 |
| IME Safety | ✅ | — | compositionstart/end guard | CJK input safe |
| Key Ownership | ✅ | — | `fieldKeyOwnership.ts` | Field vs Item claim |
| Boundary Escape | ✅ | — | — | Cursor at edge → spatial nav |

---

## 7. Overlay (레이어)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Dialog | ✅ | overlay.test (9) | `OS_OVERLAY_OPEN/CLOSE` | Modal focus trap |
| AlertDialog | ✅ | — | role preset | 확인 필요 modal |
| Popover | ✅ | — | role preset | Non-modal overlay |
| Menu | ✅ | menu.test | role preset + overlay | Popup menu |
| Tooltip | ✅ | tooltip.test | role preset | hover/focus info |
| Toast | 🔧 | — | `OS_NOTIFY` | aria-live 동작. 자동 해제 타이머 미구현 |
| Dismiss | 🔧 | escape.test | `resolveEscape.ts` | Escape 동작. outsideClick은 앱 레벨 [OG-015](5-backlog/os-gaps.md) |

---

## 8. Expansion (펼침/접힘)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Tree Expand | ✅ | expand.test, tree.test | `OS_EXPAND` | Right/Left arrow |
| Accordion | ✅ | accordion.test | role preset + expand | Single/multi panel |
| Disclosure | ✅ | disclosure.test | role preset + expand | |
| Tabs | ✅ | tabs.test | role preset `tablist` | Manual/auto activation |

---

## 9. Drag & Drop (물리적 이동)

> 📋 [VISION.md §5.2](2-area/official/VISION.md) 제안 모듈

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Keyboard Reorder | ✅ | os-commands.test | `OS_MOVE_UP/DOWN` | Alt+Arrow |
| Visual DnD | 📋 | — | — | DRAG_START/MOVE/END/DROP 커맨드 |
| Cross-Zone Transfer | 📋 | — | — | Zone A → Zone B 이동 |
| Drop Position | 📋 | — | — | before/after/inside 판단 |

---

## 10. Clipboard (클립보드)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Copy | ✅ | clipboard-commands.test | `OS_COPY` | Ctrl+C / Cmd+C |
| Cut | ✅ | clipboard-commands.test | `OS_CUT` | Cut marking |
| Paste | ✅ | clipboard-commands.test | `OS_PASTE` | Position-aware |
| Paste Bubbling | ✅ | — | `pasteBubbling.ts` | Child → parent zone |

---

## 11. History (시간 여행)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Undo | ✅ | history.test (13) | `OS_UNDO` | Ctrl+Z |
| Redo | ✅ | history.test | `OS_REDO` | Ctrl+Shift+Z |
| Noise Filtering | ✅ | history.test | `historyKernelMiddleware.ts` | Navigate 등 비의미 행위 제외 |
| Housekeeping Silence | ✅ | history.test | middleware option | 시스템 정리 기록 제외 |

---

## 12. Data (데이터 구조)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Entity | ✅ | — | `NormalizedCollection.ts` | `{ id, ...fields }` |
| Collection | ✅ | collection tests (33) | `createCollectionZone.ts` | `{ entities, order }` |
| Tree | ✅ | tree tests (7) | `treeUtils.ts` | parentId, childIds |
| Flat List | ✅ | listbox tests (10) | — | 1D ordered |
| Grid | ✅ | grid tests (8) | — | 2D (rows x columns) |
| View Transform | 🔧 | — | `collectionView.ts` | filter/sort 존재, group/pagination 미완 |
| Master-Detail | 📋 | — | — | 선택 → 상세 연동. 패턴만 존재 |

---

## 13. CRUD (데이터 조작)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Create | ✅ | collection tests | collectionBindings `onCreate` | add, insert, duplicate |
| Read | ✅ | — | selector system | |
| Update | ✅ | field.test | Field edit pipeline | |
| Delete | ✅ | collection tests | `OS_DELETE` + undo toast | |
| Reorder | ✅ | os-commands.test | `OS_MOVE_UP/DOWN` | Keyboard-based |

---

## 14. Command (명령 시스템)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Command Type | ✅ | kernel tests (521) | `defineCommand()` | Named intent |
| Command Scoping | ✅ | — | `appState.ts` | App + Zone isolation |
| Command Dispatch | ✅ | kernel tests | `os.dispatch()` | Single entry point |
| Command Handler | ✅ | kernel tests | `state → nextState` | Pure function |
| Condition Guard | ✅ | command-when.test | `when:` predicate | |
| App vs OS Command | ✅ | — | Scope chain | Zone → App → GLOBAL fallback |

---

## 15. Pipeline (처리 흐름)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| P1 Sense | ✅ | — | `1-listen/` (4 listeners) | keyboard, mouse, pointer, clipboard |
| P2 Intent | ✅ | keybindings.test | `2-resolve/` | Key → command mapping |
| P3 Resolve | ✅ | — | `3-commands/` | Context-aware computation |
| P4 Commit | ✅ | kernel tests | `dispatch()` | Atomic state apply |
| P5 Sync | ✅ | sync-focus.test | `syncFocus.ts` | Virtual → DOM |
| P6 Audit | ✅ | — | Post-dispatch checks | Focus integrity |

---

## 16. ARIA (접근성 투영)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Role Presets | ✅ | rolePresets.test | `roleRegistry.ts` | 22 roles, 9 preset fields each |
| State Projection | ✅ | APG tests | `computeItem` | aria-selected, expanded, checked, pressed... |
| Property | ✅ | — | Zone metadata | labelledby, describedby, controls |
| Live Region | ✅ | — | `ariaLive` | alert, status, polite |
| Landmark | 📋 | — | — | navigation, main, complementary — OS 레벨 관리 없음 |

---

## 17. App Framework (앱 프레임워크)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| defineApp | ✅ | integration tests | `os-sdk/app/defineApp/` | Unique entry point |
| State | ✅ | — | `initialState` config | |
| Selector | ✅ | — | `defineSelector()` | State derivation |
| Condition | ✅ | — | `defineCondition()` | Reusable predicates |
| Zone Handle | ✅ | — | `createZone()` | Zone factory + bind |
| Bind | ✅ | — | `zone.bind()` | 8 callback types |
| Modules | ✅ | — | `os-sdk/app/modules/` | history, persistence, deleteToast, router |
| TestInstance | ✅ | all headless tests | `app.create()` | Headless test API |

---

## 18. Verification (검증)

> 관련 프로젝트: [`1-project/testing/`](1-project/testing/)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| HeadlessPage | ✅ | 41 test files | `os-devtool/testing/page.ts` | Playwright subset API |
| Headless Compute | ✅ | — | `computeItem`, `computeAttrs` | DOM-free ARIA calc |
| Headless Simulate | ✅ | — | `simulate.ts` | click, press, type |
| Cross-Zone Test | 🔧 | — | — | Single zone only. [OG-018](5-backlog/os-gaps.md) |
| Inspector (TestBot) | ✅ | browser E2E | `TestBotRegistry.ts` | Visual verification |

---

## Proposed Modules (미착수)

> 출처: [VISION.md §5.2](2-area/official/VISION.md)

| Module | Pipeline | Dependency | Priority | Notes |
|--------|----------|------------|----------|-------|
| Window Management | Spatial | Focus, Focus Stack | — | Z-order, multi-panel |
| Pointer Unification | Input | Focus | — | mouse + touch + pen 통합 |
| Touch Gesture | Input | Pointer | — | swipe, pinch, long-press |
| Drag & Drop | Behavior | Focus, Select, ARIA | — | Visual DnD + keyboard DnD |
| Context Menu | Behavior | Overlay, ARIA, Select | — | Right-click / Shift+F10 |
| Search / Filter | Behavior | Focus, Navigate | — | Multi-char, highlight |
| Transition | Output | ARIA | — | Animation + reduced-motion |
| Sound | Output | (독립) | — | Web Audio feedback |

---

## OS Gaps (알려진 결함)

> 전체 목록: [`5-backlog/os-gaps.md`](5-backlog/os-gaps.md)

| ID | Category | Summary | Status |
|----|----------|---------|--------|
| OG-004 | Builder | data-drag-handle 수동 부착 | Pending |
| OG-005 | Builder | 커서 메타 등록 API 없음 | Pending |
| OG-009 | os-core | Modifier keybindings 하드코딩 | Pending |
| OG-010 | os-core | Trigger → inputmap 흡수 | Pending |
| OG-013 | os-core | trigger:"change" headless commit | Pending |
| OG-014 | os-core | Cross-zone editingItemId | Pending |
| OG-015 | os-core | Overlay Escape dismiss (headless) | Pending |
| OG-016 | os-core | Dialog Tab trap (headless) | Pending |
| OG-017 | os-core | Dialog Enter confirm (headless) | Pending |
| OG-018 | os-core | Cross-zone headless test | Pending |

---

## APG Pattern Coverage

> 관련 프로젝트: [`1-project/apg/apg-suite/`](1-project/apg/apg-suite/)

| Pattern | Component | Test | Headless Green | Notes |
|---------|-----------|------|----------------|-------|
| accordion | ✅ | ✅ | 🚧 | |
| button | ✅ | ✅ | 🚧 | |
| carousel | ✅ | ✅ | 🚧 | |
| checkbox | ✅ | ✅ | 🚧 | |
| combobox | ✅ | ✅ | 🚧 | App export 없음 |
| dialog | ✅ | ✅ | 🚧 | App export 없음 |
| disclosure | ✅ | ✅ | 🚧 | |
| dropdown-menu | ✅ | ✅ | 🚧 | App export 없음 |
| feed | ✅ | ✅ | 🚧 | |
| listbox | ✅ | ✅ | 🚧 | App export 없음 |
| menu | ✅ | ✅ | 🚧 | App export 없음 |
| menu-button | ✅ | ✅ | 🚧 | |
| meter | ✅ | ✅ | 🚧 | |
| navtree | ✅ | ✅ | 🚧 | App export 없음 |
| radiogroup | ✅ | ✅ | 🚧 | |
| slider | ✅ | ✅ | 🚧 | |
| spinbutton | ✅ | ✅ | 🚧 | |
| switch | ✅ | ✅ | 🚧 | |
| tabs | ✅ | ✅ | 🚧 | |
| toolbar | ✅ | ✅ | 🚧 | App export 없음 |
| tooltip | ✅ | ✅ | 🚧 | |
| tree | ✅ | ✅ | 🚧 | |
| treegrid | ✅ | ✅ | 🚧 | |

> **22/22** 패턴 컴포넌트+테스트 존재. Headless Green 진행 중 ([apg-suite](1-project/apg/apg-suite/BOARD.md))

---

## Packages

| Package | Purpose | Entry |
|---------|---------|-------|
| `@kernel` | Command dispatch engine | `packages/kernel/` |
| `@os-core` | OS commands, registries, headless | `packages/os-core/` |
| `@os-react` | React listeners, ZIFT components | `packages/os-react/` |
| `@os-sdk` | App framework (defineApp, collection, modules) | `packages/os-sdk/` |
| `@os-devtool` | Testing (HeadlessPage, TestBot) | `packages/os-devtool/` |
| `@surface` | Surface rendering (TBD) | `packages/surface/` |
