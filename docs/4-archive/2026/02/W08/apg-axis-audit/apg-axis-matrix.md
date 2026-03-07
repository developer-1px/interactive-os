# APG Pattern Axis Matrix

> APG 패턴 전수조사에서 발견한 keyboard interaction 축.
> 각 패턴의 APG 원문을 직접 읽고 추출한 결과.

## Composite Widget Patterns (우리 OS가 다루는 범위)

### 축 1: Tab Recovery (Tab 복귀 시 포커스 위치)

| Role | Tab 복귀 위치 | APG 원문 요약 |
|------|-------------|--------------|
| `listbox` (single) | **선택된 아이템** (없으면 첫 번째) | "If an option is selected, focus is set on the selected option" |
| `listbox` (multi) | **첫 번째 선택 아이템** (없으면 첫 번째) | "focus is set on the first option in the list that is selected" |
| `tree` (single) | **선택된 노드** (없으면 첫 번째) | "If a node is selected, focus is set on the selected node" |
| `tree` (multi) | **첫 번째 선택 노드** (없으면 첫 번째) | "focus is set on the first selected node" |
| `grid` | **마지막 포커스 셀** (없으면 첫 번째) | Keyboard Interface §7: "element that had focus the last time" |
| `tablist` | **활성 탭** (selected tab) | "places focus on the active tab element" |
| `toolbar` | **첫 번째** (또는 선택적으로 마지막 포커스) | "first control that is not disabled" / optionally "control that last had focus" |
| `menubar` | **첫 번째** (또는 선택적으로 마지막 포커스) | "first menuitem" / optionally "menuitem that last had focus" |
| `radiogroup` | **체크된 버튼** (없으면 첫 번째) | "If a radio button is checked, focus is set on the checked button" |
| `menu` | **첫 번째** (Tab으로 진입 불가) | "keyboard focus is placed on the first item" |

**축 값 추출**: `selected` | `lastFocus` | `first`
- `selected`: listbox, tree, tablist, radiogroup
- `lastFocus`: grid (기본), toolbar (선택적), menubar (선택적)
- `first`: toolbar (기본), menubar (기본), menu

### 축 2: Navigate Orientation (방향키 이동 축)

| Role | 방향 | APG 원문 요약 |
|------|------|--------------|
| `listbox` | **vertical** | "Down Arrow / Up Arrow" |
| `tree` | **vertical** (+ Left/Right for expand/collapse) | "Down Arrow / Up Arrow + Left/Right for open/close" |
| `grid` | **2D** (corner) | "Right/Left/Down/Up Arrow" |
| `tablist` | **horizontal** (기본) 또는 vertical | "Left Arrow / Right Arrow" (horizontal) |
| `toolbar` | **horizontal** (기본) | "Left Arrow / Right Arrow" |
| `menubar` | **horizontal** (top) + **vertical** (submenu) | "Left/Right in menubar, Up/Down in menu" |
| `radiogroup` | **both** | "Right Arrow and Down Arrow / Left Arrow and Up Arrow" |

**축 값**: `vertical` | `horizontal` | `corner` (2D) | `both`

### 축 3: Navigate Wrap (끝에서 처음으로 순환)

| Role | Wrap | APG 원문 요약 |
|------|------|--------------|
| `listbox` | **no** (명시 안 됨) | "Moves focus to the next/previous option" (no wrap mentioned) |
| `tree` | **no** | 순환 언급 없음 |
| `grid` | **no** | "focus does not move" at edges |
| `tablist` | **yes** | "If focus is on the last tab, moves focus to the first tab" |
| `toolbar` | **optional** | "Optionally, focus movement may wrap" |
| `menubar` | **yes** (submenu items) | Arrow wraps in menus |
| `radiogroup` | **yes** | "If focus is on the last button, focus moves to the first button" |

**축 값**: `wrap` | `nowrap`

### 축 4: Select Mode (선택 모드)

| Role | 선택 | APG 원문 요약 |
|------|------|--------------|
| `listbox` | **single** 또는 **multiple** | `aria-multiselectable` |
| `tree` | **single** 또는 **multiple** | `aria-multiselectable` |
| `grid` | **single** 또는 **multiple** (cell/row/column) | Select via Ctrl+Space, Shift+Space |
| `tablist` | **single** (항상) | 한 번에 한 탭만 활성 |
| `toolbar` | **none** | 선택 개념 없음 |
| `radiogroup` | **single** (항상) | 한 번에 한 라디오만 체크 |

**축 값**: `none` | `single` | `multiple`

### 축 5: Selection Follows Focus (포커스 이동 시 자동 선택)

| Role | SFF | APG 원문 요약 |
|------|-----|--------------|
| `listbox` (single) | **optional** | "Optionally, selection may also move with focus" |
| `tree` (single) | **optional** | "selection does not follow focus (see note)" |
| `tablist` | **optional** (추천됨) | "Optionally, activates the newly focused tab" |
| `radiogroup` | **always** | Arrow "uncheck the previously focused button, and check the newly focused button" |
| `grid` | **no** | 별도 선택 키 사용 |
| `toolbar` | **n/a** | 선택 없음 |

**축 값**: `auto` | `manual` | `always`

### 축 6: Tab Behavior (Tab 키 동작)

| Role | Tab 동작 | APG 원문 요약 |
|------|---------|--------------|
| `listbox` | **escape** | Tab으로 진입, Tab으로 탈출 |
| `tree` | **escape** | Tab으로 진입, Tab으로 탈출 |
| `grid` | **escape** | Tab으로 진입, Tab으로 탈출 |
| `tablist` | **escape** (Tab → tabpanel로) | "moves focus to the next element in the page tab sequence outside the tablist" |
| `toolbar` | **escape** | "Tab and Shift+Tab: Move focus into and out of the toolbar" |
| `menubar` | **escape** | Tab 탈출 시 모든 메뉴 닫음 |
| `radiogroup` | **escape** | Tab으로 진입, Tab으로 탈출 |
| `dialog` | **trap** | Tab이 모달 내에 갇힘 |

**축 값**: `escape` | `trap`

### 축 7: Activate Action (Enter/Space 동작)

| Role | Enter | Space | APG 원문 요약 |
|------|-------|-------|--------------|
| `listbox` (multi) | — | **toggle selection** | "Space: changes the selection state" |
| `tree` | **activate** (open/close 또는 select) | **toggle selection** (multi) | "Enter: activates a node" |
| `grid` | 셀 편집 진입 | — | Cell editing pattern |
| `tablist` | **activate tab** | **activate tab** | "Space or Enter: Activates the tab" |
| `toolbar` | **activate control** | 컨트롤에 따라 다름 | 내부 위젯 동작 |
| `radiogroup` | — | **check** | "Space: checks the focused radio button" |

**축 값**: `activate` | `select` | `check` | `edit` | `none`

### 축 8: Dismiss (ESC 동작)

| Role | ESC 동작 | APG 원문 요약 |
|------|---------|--------------|
| `dialog` | **close** | 모달 닫기 |
| `menu` | **close** | 서브메뉴 닫기, 부모로 복귀 |
| `combobox` (popup) | **close popup** | 팝업 닫기 |
| `listbox` / `tree` / `grid` | **none** (명시 안 됨) | ESC 동작 없음 |
| `toolbar` | **none** | ESC 동작 없음 |

**축 값**: `close` | `deselect` | `none`

### 축 9: Expand/Collapse (확장/축소)

| Role | 확장 키 | APG 원문 요약 |
|------|--------|--------------|
| `tree` | **Left/Right Arrow** | Right opens, Left closes |
| `accordion` | **Enter/Space** on header | Toggle section |
| `menu` | **Right Arrow** opens submenu, **Left Arrow** closes | Submenu navigation |
| `disclosure` | **Enter/Space** on trigger | Toggle content |
| 기타 | **n/a** | 확장 개념 없음 |

**축 값**: `arrow` | `action` | `none`

---

## 갭 분석: 현재 구현 vs APG 축

| 축 | 현재 config 키 | 구현 상태 | 갭 |
|---|---------------|---------|-----|
| Tab Recovery | `navigate.entry` | ✅ 스키마 + rolePreset + **런타임 반영 완료** | — |
| Navigate Orientation | `navigate.orientation` | ✅ vertical/horizontal/corner | — |
| Navigate Wrap | `navigate.loop` | ✅ wrap/nowrap | — |
| Select Mode | `select.mode` | ✅ none/single/multiple | — |
| Selection Follows Focus | `select.followFocus` | ✅ true/false | — |
| Tab Behavior | `tab.behavior` | ✅ escape/trap/flow | — |
| Activate Action | `activate.mode` | ✅ automatic/manual | — |
| Dismiss | `dismiss.escape` | ✅ close/deselect/none | — |
| Expand/Collapse | `EXPAND` command | ✅ tree/treegrid | — |

### 해결된 갭

1. ~~**`tab.recovery`**: resolveTabEscapeZone이 navigate.entry를 무시~~ → **해결!** ZoneOrderEntry에 entry/selectedItemId/lastFocusedId 추가, resolveTabEscapeZone에서 entry별 분기 구현
2. ~~**Focus vs Selection 시각 구분**~~ → `data-selected` + `data-focused` + `data-anchor` 이미 존재. CSS만 추가 가능

### 남은 미세 갭 (Optional)

1. **FocusItem의 tabIndex**: listbox/tree에서 Tab 재진입 시 `tabIndex=0`이 selected item에 갈지 lastFocused에 갈지 — DOM_ZONE_ORDER의 entry 사용으로 해결됨 (커맨드 레벨에서 올바른 아이템으로 포커스)

---

## resolveRole()에서 자동 파생 매트릭스

```
Role         → tabRecovery   selFollowsFocus  orientation  wrap    selectMode  tabBehavior
─────────────┼──────────────┼────────────────┼────────────┼───────┼───────────┼──────────
listbox      │ selected     │ true           │ vertical   │ no    │ single    │ escape
tree         │ selected     │ false          │ vertical   │ no    │ single    │ escape
grid         │ (first)      │ false          │ both       │ no    │ multiple  │ escape
tablist      │ selected     │ true           │ horizontal │ yes   │ single    │ escape
toolbar      │ restore      │ n/a            │ horizontal │ yes   │ none      │ escape
menubar      │ restore      │ n/a            │ horizontal │ yes   │ none      │ escape
radiogroup   │ selected     │ true           │ vertical   │ yes   │ single    │ escape
dialog       │ (first)      │ n/a            │ vertical   │ no    │ none      │ trap
```
