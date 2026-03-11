# APG × OS Command BDD Matrix

> **목적**: W3C APG 스펙의 모든 키보드/마우스 입력을 ARIA 기반 BDD로 전수조사하여 커맨드 설계 완전성을 검증.
> **Ground Truth**: 각 행의 APG Source URL을 클릭하면 W3C 원문에서 직접 검증 가능.
> **갱신 시그널**: `/go APG 매트릭스`
>
> Source: https://www.w3.org/WAI/ARIA/apg/patterns/
> Last updated: 2026-03-03

## 범례

| 기호 | 의미 |
|------|------|
| ✅ | 커맨드 매핑 + 테스트 존재 |
| ⚠️ | 커맨드 존재, 테스트 부족 |
| ❌ | 파이프라인에 매핑 없음 |
| 🔲 | APG Optional, 아직 불필요 |
| (O) | APG에서 Optional로 명시 |

## 진행률

- [x] Listbox (2026-03-03)
- [x] Tree View (2026-03-03)
- [x] Tabs (2026-03-03)
- [x] Grid (2026-03-03)
- [x] Toolbar (2026-03-03)
- [x] Menu / Menubar (2026-03-03)
- [x] Radio Group (2026-03-03)
- [x] Accordion (2026-03-03)
- [x] Dialog (Modal) (2026-03-03)
- [x] Alert Dialog (2026-03-03) — Dialog 동일
- [x] Combobox (2026-03-03)
- [x] Checkbox (2026-03-03)
- [x] Switch (2026-03-03)
- [x] Slider (2026-03-03)
- [x] Spinbutton (2026-03-03)
- [x] Disclosure (2026-03-03)
- [x] Button (2026-03-03)
- [x] Menu Button (2026-03-04)

---

## Matrix

열 정의:
- **Input**: 물리적 키보드/마우스 입력
- **ARIA Condition**: 이 행이 적용되는 ARIA 상태/속성 조건 (Given/When)
- **Command**: 매핑되어야 하는 OS 커맨드
- **Options**: 커맨드에 필요한 옵션/파라미터
- **ARIA Effect**: 기대되는 ARIA 속성 변화 (Then)
- **APG Source**: W3C 원문 근거
- **Status**: 구현 상태

### Listbox

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (focus entry) | `role=listbox`, no selection | `FOCUS` | `entry: first` | focus → 첫 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| (focus entry) | `role=listbox`, `aria-selected` 있음 | `FOCUS` | `entry: selected` | focus → 선택된 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| (focus entry) | `role=listbox` + `aria-multiselectable=true`, 선택 있음 | `FOCUS` | `entry: selected` | focus → 첫 번째 선택 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=listbox` | `NAVIGATE` | `direction: down` | focus → 다음 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=listbox` + `aria-multiselectable=false` | `NAVIGATE` | `direction: down` | + `aria-selected` 이동 (O) | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=listbox` | `NAVIGATE` | `direction: up` | focus → 이전 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `Home` | `role=listbox` (O) | `NAVIGATE` | `direction: home` | focus → 첫 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `End` | `role=listbox` (O) | `NAVIGATE` | `direction: end` | focus → 마지막 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| Typeahead | `role=listbox` (O) | `NAVIGATE` | `typeahead: char` | focus → 매칭 option | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `Space` | `role=listbox` + `aria-multiselectable=true` (Rec) | `SELECT` | `mode: toggle` | `aria-selected` 토글 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ⚠️ |
| `Shift+ArrowDown` | `role=listbox` + `aria-multiselectable=true` (Rec)(O) | `NAVIGATE` | `direction: down, select: toggle` | focus 이동 + `aria-selected` 토글 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `Shift+ArrowUp` | `role=listbox` + `aria-multiselectable=true` (Rec)(O) | `NAVIGATE` | `direction: up, select: toggle` | focus 이동 + `aria-selected` 토글 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `Shift+Space` | `role=listbox` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range` | `aria-selected` 범위 (anchor~current) | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ⚠️ |
| `Ctrl+Shift+Home` | `role=listbox` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range, to: first` | `aria-selected` 처음까지 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | 🔲 |
| `Ctrl+Shift+End` | `role=listbox` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range, to: last` | `aria-selected` 끝까지 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | 🔲 |
| `Ctrl+A` | `role=listbox` + `aria-multiselectable=true` (O) | `SELECT_ALL` | — | 전체 `aria-selected=true` | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ✅ |
| `Ctrl+ArrowDown` | `role=listbox` + `aria-multiselectable=true` (Alt) | `NAVIGATE` | `direction: down, select: none` | focus 이동, 선택 변경 없음 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ⚠️ |
| `Ctrl+ArrowUp` | `role=listbox` + `aria-multiselectable=true` (Alt) | `NAVIGATE` | `direction: up, select: none` | focus 이동, 선택 변경 없음 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ⚠️ |
| `Ctrl+Space` | `role=listbox` + `aria-multiselectable=true` (Alt) | `SELECT` | `mode: toggle` | `aria-selected` 토글 | [Listbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard_interaction) | ⚠️ |

### Tree View

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (focus entry) | `role=tree`, single, no selection | `FOCUS` | `entry: first` | focus → 첫 treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| (focus entry) | `role=tree`, `aria-selected` 있음 | `FOCUS` | `entry: selected` | focus → 선택된 treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowRight` | `role=treeitem` + `aria-expanded=false` | `NAVIGATE` | chain: `onRight: [expand]` | `aria-expanded` → `true` | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowRight` | `role=treeitem` + `aria-expanded=true` | `NAVIGATE` | `direction: right` | focus → 첫 자식 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `ArrowRight` | `role=treeitem` (end node) | — | — | 변화 없음 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=treeitem` + `aria-expanded=true` | `NAVIGATE` | chain: `onLeft: [collapse]` | `aria-expanded` → `false` | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=treeitem` (closed/end) + 부모 있음 | `NAVIGATE` | `direction: left` | focus → 부모 treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `ArrowLeft` | `role=treeitem` (root, closed/end) | — | — | 변화 없음 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=tree` | `NAVIGATE` | `direction: down` | focus → 다음 visible treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=tree` | `NAVIGATE` | `direction: up` | focus → 이전 visible treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `Home` | `role=tree` | `NAVIGATE` | `direction: home` | focus → 첫 treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `End` | `role=tree` | `NAVIGATE` | `direction: end` | focus → 마지막 visible treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `Enter` | `role=tree` | `ACTIVATE` | — | default action (select 또는 toggle expand) | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| Typeahead | `role=tree` (O) | `NAVIGATE` | `typeahead: char` | focus → 매칭 treeitem | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `*` | `role=tree` (O) | `EXPAND` | `action: expandSiblings` | 같은 레벨 전체 `aria-expanded=true` | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | 🔲 |
| `Space` | `role=tree` + `aria-multiselectable=true` (Rec) | `SELECT` | `mode: toggle` | `aria-selected` 토글 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `Shift+ArrowDown` | `role=tree` + `aria-multiselectable=true` (Rec)(O) | `NAVIGATE` | `direction: down, select: toggle` | focus 이동 + `aria-selected` 토글 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `Shift+ArrowUp` | `role=tree` + `aria-multiselectable=true` (Rec)(O) | `NAVIGATE` | `direction: up, select: toggle` | focus 이동 + `aria-selected` 토글 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `Shift+Space` | `role=tree` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range` | `aria-selected` 범위 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `Ctrl+Shift+Home` | `role=tree` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range, to: first` | `aria-selected` 처음까지 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | 🔲 |
| `Ctrl+Shift+End` | `role=tree` + `aria-multiselectable=true` (Rec)(O) | `SELECT` | `mode: range, to: last` | `aria-selected` 끝까지 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | 🔲 |
| `Ctrl+A` | `role=tree` + `aria-multiselectable=true` (O) | `SELECT_ALL` | — | 전체 `aria-selected=true` | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ✅ |
| `Ctrl+ArrowDown` | `role=tree` + `aria-multiselectable=true` (Alt) | `NAVIGATE` | `direction: down, select: none` | focus 이동, 선택 변경 없음 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `Ctrl+ArrowUp` | `role=tree` + `aria-multiselectable=true` (Alt) | `NAVIGATE` | `direction: up, select: none` | focus 이동, 선택 변경 없음 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |
| `Ctrl+Space` | `role=tree` + `aria-multiselectable=true` (Alt) | `SELECT` | `mode: toggle` | `aria-selected` 토글 | [Tree §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboard_interaction) | ⚠️ |

### Tabs

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Tab` (진입) | `role=tablist` | `FOCUS` | `entry: selected` | focus → `aria-selected=true`인 tab | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ⚠️ |
| `Tab` (탈출) | `role=tablist` 안에서 | `TAB` | `direction: forward` | focus → tabpanel | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=tablist` + horizontal | `NAVIGATE` | `direction: left, loop: true` | focus → 이전 tab (wrap) | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ✅ |
| `ArrowRight` | `role=tablist` + horizontal | `NAVIGATE` | `direction: right, loop: true` | focus → 다음 tab (wrap) | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ✅ |
| `ArrowLeft/Right` | `role=tablist` + auto activation | `NAVIGATE` | + `followFocus` | + `aria-selected` 이동 (O) | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ✅ |
| `Space` / `Enter` | `role=tablist` (manual activation) | `ACTIVATE` | — | `aria-selected` → focused tab | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ✅ |
| `Home` | `role=tablist` (O) | `NAVIGATE` | `direction: home` | focus → 첫 tab | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ⚠️ |
| `End` | `role=tablist` (O) | `NAVIGATE` | `direction: end` | focus → 마지막 tab | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | ⚠️ |
| `Shift+F10` | `role=tab` + popup menu | — | — | 연관 메뉴 열기 | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | 🔲 |
| `Delete` | `role=tablist` (O) | `DELETE` | — | tab 삭제 + focus → 다음 tab | [Tabs §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboard_interaction) | 🔲 |

### Grid (Data Grid + Layout Grid)

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `ArrowRight` | `role=grid` (data) | `NAVIGATE` | `direction: right` | focus → 오른쪽 cell (clamp) | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ✅ |
| `ArrowLeft` | `role=grid` (data) | `NAVIGATE` | `direction: left` | focus → 왼쪽 cell (clamp) | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ✅ |
| `ArrowDown` | `role=grid` (data) | `NAVIGATE` | `direction: down` | focus → 아래 cell (clamp) | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ✅ |
| `ArrowUp` | `role=grid` (data) | `NAVIGATE` | `direction: up` | focus → 위 cell (clamp) | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ✅ |
| `ArrowRight` | `role=grid` (layout), 끝 | `NAVIGATE` | `direction: right, wrap: row` | focus → 다음 행 첫 cell (O) | [Grid §kbd-layout](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_layout_grids) | 🔲 |
| `PageDown` | `role=grid` | `NAVIGATE` | `direction: pageDown` | focus N행 아래 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | 🔲 |
| `PageUp` | `role=grid` | `NAVIGATE` | `direction: pageUp` | focus N행 위 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | 🔲 |
| `Home` | `role=grid` | `NAVIGATE` | `direction: home` | focus → 현재 행 첫 cell | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `End` | `role=grid` | `NAVIGATE` | `direction: end` | focus → 현재 행 마지막 cell | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Ctrl+Home` | `role=grid` | `NAVIGATE` | `direction: home, scope: grid` | focus → 첫 행 첫 cell | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | 🔲 |
| `Ctrl+End` | `role=grid` | `NAVIGATE` | `direction: end, scope: grid` | focus → 마지막 행 마지막 cell | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | 🔲 |
| `Ctrl+Space` | `role=grid` | `SELECT` | `mode: column` | column 선택 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Shift+Space` | `role=grid` | `SELECT` | `mode: row` | row 선택 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Ctrl+A` | `role=grid` | `SELECT_ALL` | — | 전체 cell 선택 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ✅ |
| `Shift+ArrowRight` | `role=grid` | `SELECT` | `extend: right` | selection 오른쪽 확장 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Shift+ArrowLeft` | `role=grid` | `SELECT` | `extend: left` | selection 왼쪽 확장 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Shift+ArrowDown` | `role=grid` | `SELECT` | `extend: down` | selection 아래 확장 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |
| `Shift+ArrowUp` | `role=grid` | `SELECT` | `extend: up` | selection 위 확장 | [Grid §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboard_interaction_for_data_grids) | ⚠️ |

---

### Toolbar

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (focus entry) | `role=toolbar`, 첫 진입 | `FOCUS` | `entry: first` (disabled skip) | focus → 첫 enabled control | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ✅ |
| (focus entry) | `role=toolbar`, 재진입 | `FOCUS` | `entry: restore` | focus → 마지막 focused control (O) | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ✅ |
| `Tab` / `Shift+Tab` | `role=toolbar` | `TAB` | `escape` | focus 탈출 | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=toolbar` (horizontal) | `NAVIGATE` | `direction: left, loop: optional` | focus → 이전 control (wrap O) | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ✅ |
| `ArrowRight` | `role=toolbar` (horizontal) | `NAVIGATE` | `direction: right, loop: optional` | focus → 다음 control (wrap O) | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ✅ |
| `Home` | `role=toolbar` (O) | `NAVIGATE` | `direction: home` | focus → 첫 element | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ⚠️ |
| `End` | `role=toolbar` (O) | `NAVIGATE` | `direction: end` | focus → 마지막 element | [Toolbar §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/#keyboard_interaction) | ⚠️ |

### Menu / Menubar

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (focus entry) | `role=menubar`, 첫 진입 | `FOCUS` | `entry: first` | focus → 첫 menuitem | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| (focus entry) | `role=menubar`, 재진입 | `FOCUS` | `entry: restore` | focus → 마지막 focused menuitem (O) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| (focus entry) | `role=menu` (submenu) | `FOCUS` | `entry: first, autoFocus: true` | focus → 첫 menuitem (자동) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `Tab` / `Shift+Tab` | `role=menubar` | `TAB` | `escape` | focus 탈출 + 모든 메뉴 닫기 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `Enter` | `role=menuitem` + submenu 있음 | `EXPAND` | `action: expand` + `FOCUS(first child)` | submenu 열기 + focus → 첫 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `Enter` | `role=menuitem` + submenu 없음 | `ACTIVATE` | — | activate + 메뉴 닫기 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `Space` | `role=menuitemcheckbox` (O) | `SELECT` | `aria: "checked"`, `mode: toggle` | `aria-checked` 토글 (메뉴 유지) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `Space` | `role=menuitemradio` (O) | `SELECT` | `mode: replace` | `aria-checked` 이동 (메뉴 유지) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `Space` | `role=menuitem` + submenu (O) | `EXPAND` | `action: expand` | submenu 열기 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `Space` | `role=menuitem` + no submenu (O) | `ACTIVATE` | — | activate + 메뉴 닫기 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `ArrowDown` | `role=menubar`, menuitem + submenu | `EXPAND` | + `FOCUS(first child)` | submenu 열기 + focus → 첫 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `ArrowDown` | `role=menu` (vertical) | `NAVIGATE` | `direction: down, loop: optional` | focus → 다음 item (wrap O) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=menu` (vertical) | `NAVIGATE` | `direction: up, loop: optional` | focus → 이전 item (wrap O) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=menubar`, menuitem + submenu (O) | `EXPAND` | + `FOCUS(last child)` | submenu 열기 + focus → 마지막 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | 🔲 |
| `ArrowRight` | `role=menubar` (horizontal) | `NAVIGATE` | `direction: right, loop: optional` | focus → 다음 menubar item (wrap O) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `ArrowRight` | `role=menu`, menuitem + submenu | `EXPAND` | + `FOCUS(first child)` | submenu 열기 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `ArrowRight` | `role=menu`, no submenu, parent=menubar | `DISMISS` + `NAVIGATE` | close submenu + next menubar item | 닫기 + menubar 다음 item으로 이동 | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `ArrowLeft` | `role=menubar` (horizontal) | `NAVIGATE` | `direction: left, loop: optional` | focus → 이전 menubar item (wrap O) | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=menu` (submenu of menu) | `DISMISS` | close submenu | submenu 닫기 + parent로 focus | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `ArrowLeft` | `role=menu` (submenu of menubar) | `DISMISS` + `NAVIGATE` | close + prev menubar item | 닫기 + menubar 이전 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `Home` | `role=menu` / `role=menubar` | `NAVIGATE` | `direction: home` | focus → 첫 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| `End` | `role=menu` / `role=menubar` | `NAVIGATE` | `direction: end` | focus → 마지막 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ⚠️ |
| Typeahead | `role=menu` / `role=menubar` (O) | `NAVIGATE` | `typeahead: char` | focus → 매칭 item | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | 🔲 |
| `Escape` | `role=menu` | `DISMISS` | `escape: close` | 메뉴 닫기 + invoker로 focus | [Menu §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboard_interaction) | ✅ |

### Accordion

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Enter` / `Space` | accordion header, `aria-expanded=false` | `ACTIVATE` | `effect: "toggleExpand"` → `EXPAND(expand)` | `aria-expanded` → `true`, panel 표시 | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ✅ |
| `Enter` / `Space` | accordion header, `aria-expanded=true` | `ACTIVATE` | `effect: "toggleExpand"` → `EXPAND(collapse)` | `aria-expanded` → `false`, panel 숨김 | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ✅ |
| `Tab` | accordion | `TAB` | `native` | 모든 focusable 포함 (panel 내용 포함) | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ✅ |
| `ArrowDown` | accordion header (O) | `NAVIGATE` | `direction: down` | focus → 다음 header | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ✅ |
| `ArrowUp` | accordion header (O) | `NAVIGATE` | `direction: up` | focus → 이전 header | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ✅ |
| `Home` | accordion header (O) | `NAVIGATE` | `direction: home` | focus → 첫 header | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ⚠️ |
| `End` | accordion header (O) | `NAVIGATE` | `direction: end` | focus → 마지막 header | [Accordion §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboard_interaction) | ⚠️ |

### Dialog (Modal) / Alert Dialog

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (dialog open) | `role=dialog` / `role=alertdialog` | `FOCUS` | `autoFocus: first focusable` | focus → dialog 내 첫 focusable (또는 제목) | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) / [Alert §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) | ✅ |
| (background) | `role=dialog` | — | `inert: true` | dialog 외부 비활성 (조작 불가) | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) | ✅ |
| `Tab` | `role=dialog` | `TAB` | `trap`, cycle forward | focus → 다음 tabbable (마지막→첫째 순환) | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) | ✅ |
| `Shift+Tab` | `role=dialog` | `TAB` | `trap`, cycle backward | focus → 이전 tabbable (첫째→마지막 순환) | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) | ✅ |
| `Escape` | `role=dialog` | `DISMISS` | `escape: close` | dialog 닫기 | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) | ✅ |
| (dialog close) | `role=dialog` / `role=alertdialog` | `FOCUS` | `restore: invoker` | focus → invoking element (없으면 logical next) | [Dialog §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboard_interaction) | ✅ |

### Combobox

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `ArrowDown` | `role=combobox`, popup available | `EXPAND` + `NAVIGATE` | open popup + focus first/next | popup 열기 + focus → popup 내 item | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | ⚠️ |
| `ArrowUp` | `role=combobox`, popup available (O) | `EXPAND` + `NAVIGATE` | open popup + focus last | popup 열기 + focus → 마지막 item | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | 🔲 |
| `Escape` | `role=combobox`, popup visible | `DISMISS` | `close popup` | popup 닫기 (+clear O) | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | ✅ |
| `Enter` | `role=combobox`, selection in popup | `ACTIVATE` | `accept suggestion` | 선택값 수락 + popup 닫기 | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | ⚠️ |
| `Alt+ArrowDown` | `role=combobox` (O) | `EXPAND` | — | popup 표시 (focus 이동 없음) | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | 🔲 |
| `Alt+ArrowUp` | `role=combobox`, popup visible (O) | `DISMISS` | — | popup 닫기 + focus → combobox | [Combobox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction) | 🔲 |
| `ArrowDown` | `role=combobox` popup listbox 안 | `NAVIGATE` | `direction: down` | focus + select 다음 option | [Combobox §kbd-listbox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#listbox_popup_keyboard_interaction) | ⚠️ |
| `ArrowUp` | `role=combobox` popup listbox 안 | `NAVIGATE` | `direction: up` | focus + select 이전 option | [Combobox §kbd-listbox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#listbox_popup_keyboard_interaction) | ⚠️ |
| `Enter` | `role=combobox` popup listbox 안 | `ACTIVATE` | `accept + close` | 수락 + popup 닫기 + cursor 이동 | [Combobox §kbd-listbox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#listbox_popup_keyboard_interaction) | ⚠️ |
| `Escape` | `role=combobox` popup listbox 안 | `DISMISS` | `close + focus combobox` | popup 닫기 + combobox focus | [Combobox §kbd-listbox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#listbox_popup_keyboard_interaction) | ⚠️ |

---

### Radio Group

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| (focus entry) | `role=radiogroup`, checked 있음 | `FOCUS` | `entry: selected` | focus → checked radio | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |
| (focus entry) | `role=radiogroup`, checked 없음 | `FOCUS` | `entry: first` | focus → 첫 radio | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |
| `Tab` / `Shift+Tab` | `role=radiogroup` | `TAB` | `escape` | focus 탈출 | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |
| `Space` | `role=radio` | `SELECT` | `mode: replace` | `aria-checked=true` (focused radio) | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |
| `ArrowRight` / `ArrowDown` | `role=radiogroup` | `NAVIGATE` | `direction: next, loop: true` | focus → 다음 + `aria-checked` 이동 (wrap) | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |
| `ArrowLeft` / `ArrowUp` | `role=radiogroup` | `NAVIGATE` | `direction: prev, loop: true` | focus → 이전 + `aria-checked` 이동 (wrap) | [Radio §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboard_interaction) | ✅ |

### Checkbox

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Space` | `role=checkbox` | `SELECT` | `aria: "checked"`, `mode: toggle` | `aria-checked` 토글 (true↔false, +mixed) | [Checkbox §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/#keyboard_interaction) | ✅ |

### Switch

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Space` | `role=switch` | `SELECT` | `aria: "checked"`, `mode: toggle` | `aria-checked` 토글 (on↔off) | [Switch §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/switch/#keyboard_interaction) | ✅ |
| `Enter` | `role=switch` (O) | `SELECT` | `aria: "checked"`, `mode: toggle` | `aria-checked` 토글 | [Switch §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/switch/#keyboard_interaction) | ✅ |

### Slider

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `ArrowRight` | `role=slider` | `VALUE_CHANGE` | `action: increment` | `aria-valuenow` +1 step | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=slider` | `VALUE_CHANGE` | `action: increment` | `aria-valuenow` +1 step | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `ArrowLeft` | `role=slider` | `VALUE_CHANGE` | `action: decrement` | `aria-valuenow` -1 step | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=slider` | `VALUE_CHANGE` | `action: decrement` | `aria-valuenow` -1 step | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `Home` | `role=slider` | `VALUE_CHANGE` | `action: setMin` | `aria-valuenow` → `aria-valuemin` | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `End` | `role=slider` | `VALUE_CHANGE` | `action: setMax` | `aria-valuenow` → `aria-valuemax` | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `PageUp` | `role=slider` (O) | `VALUE_CHANGE` | `action: incrementLarge` | `aria-valuenow` + largeStep | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |
| `PageDown` | `role=slider` (O) | `VALUE_CHANGE` | `action: decrementLarge` | `aria-valuenow` - largeStep | [Slider §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboard_interaction) | ✅ |

### Button

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Space` | `role=button` | `ACTIVATE` | — | button action 실행 | [Button §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/button/#keyboard_interaction) | ✅ |
| `Enter` | `role=button` | `ACTIVATE` | — | button action 실행 | [Button §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/button/#keyboard_interaction) | ✅ |

### Disclosure

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `Enter` | disclosure button | `ACTIVATE` | `effect: "toggleExpand"` → `EXPAND(toggle)` | `aria-expanded` 토글 | [Disclosure §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/#keyboard_interaction) | ✅ |
| `Space` | disclosure button | `ACTIVATE` | `effect: "toggleExpand"` → `EXPAND(toggle)` | `aria-expanded` 토글 | [Disclosure §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/#keyboard_interaction) | ✅ |

### Spinbutton

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| `ArrowUp` | `role=spinbutton` | `VALUE_CHANGE` | `action: increment` | value 증가 | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=spinbutton` | `VALUE_CHANGE` | `action: decrement` | value 감소 | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |
| `Home` | `role=spinbutton` | `VALUE_CHANGE` | `action: setMin` | value → min | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |
| `End` | `role=spinbutton` | `VALUE_CHANGE` | `action: setMax` | value → max | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |
| `PageUp` | `role=spinbutton` (O) | `VALUE_CHANGE` | `action: incrementLarge` | value + largeStep | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |
| `PageDown` | `role=spinbutton` (O) | `VALUE_CHANGE` | `action: decrementLarge` | value - largeStep | [Spinbutton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/#keyboard_interaction) | ✅ |

### Menu Button

| Input | ARIA Condition | Command | Options | ARIA Effect | APG Source | Status |
|-------|---------------|---------|---------|-------------|-----------|--------|
| Click | `button[aria-haspopup]` | `ACTIVATE` → `OS_OVERLAY_OPEN` | `type: menu` | menu 열기 + focus → 첫 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `Enter` | `button[aria-haspopup]` | `ACTIVATE` → `OS_OVERLAY_OPEN` | `type: menu` | menu 열기 + focus → 첫 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `Space` | `button[aria-haspopup]` | `ACTIVATE` → `OS_OVERLAY_OPEN` | `type: menu` | menu 열기 + focus → 첫 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `ArrowDown` | `button[aria-haspopup]` (O) | `ACTIVATE` → `OS_OVERLAY_OPEN` | `type: menu` | menu 열기 + focus → 첫 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | 🔲 |
| `ArrowUp` | `button[aria-haspopup]` (O) | `ACTIVATE` → `OS_OVERLAY_OPEN` | `type: menu` | menu 열기 + focus → 마지막 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | 🔲 |
| `Escape` | `role=menu` (popup) | `DISMISS` | `escape: close` | menu 닫기 + focus → button | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `ArrowDown` | `role=menu` | `NAVIGATE` | `direction: down, loop: true` | focus → 다음 menuitem (wrap) | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `ArrowUp` | `role=menu` | `NAVIGATE` | `direction: up, loop: true` | focus → 이전 menuitem (wrap) | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |
| `Enter` | `role=menuitem` | `ACTIVATE` | — | action 실행 + menu 닫기 + focus → button | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ⚠️ |
| `Home` | `role=menu` | `NAVIGATE` | `direction: home` | focus → 첫 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ⚠️ |
| `End` | `role=menu` | `NAVIGATE` | `direction: end` | focus → 마지막 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ⚠️ |
| Typeahead | `role=menu` (O) | `NAVIGATE` | `typeahead: char` | focus → 매칭 menuitem | [MenuButton §kbd](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboard_interaction) | ✅ |

---

## Gap Summary

### ❌ 파이프라인 매핑 없음 (고유 8건)

| # | Input | ARIA Condition | 필요한 커맨드 | 비고 |
|---|-------|---------------|-------------|------|
| G1 | `Shift+Space` | listbox/tree + multiselectable | `SELECT(mode: range)` | anchor~current 범위선택 |
| G2 | `Ctrl+ArrowDown/Up` | listbox/tree + multiselectable (Alt) | `NAVIGATE(select: none)` | focus만 이동, 선택 유지 |
| G3 | `Ctrl+Space` | listbox/tree + multiselectable (Alt) | `SELECT(mode: toggle)` | 현재 item 선택 토글 |
| G4 | `Ctrl+Space` | grid | `SELECT(mode: column)` | column 단위 선택 |
| G5 | `Shift+Space` | grid | `SELECT(mode: row)` | row 단위 선택 |
| G6 | `Shift+ArrowRight` | grid | `SELECT(extend: right)` | 2D 수평 확장 선택 |
| G7 | `Shift+ArrowLeft` | grid | `SELECT(extend: left)` | 2D 수평 확장 선택 |
| G8 | `Ctrl+ArrowDown/Up` | tree + multiselectable | `NAVIGATE(select: none)` | G2 중복, tree 별도 |

### 발견된 커맨드 옵션 누락

| 커맨드 | 기존 옵션 | APG에서 발견된 누락 옵션 |
|--------|----------|----------------------|
| `NAVIGATE` | `direction`, `loop` | `select: "none"` (Ctrl+Arrow), `select: "toggle"` (Shift+Arrow) |
| `SELECT` | `mode: replace/toggle/range` | `mode: column`, `mode: row`, `extend: direction` |
| `FOCUS` | `entry: first/selected` | `entry: restore` (toolbar/menubar 재진입) |
| `EXPAND` | `expand/collapse` | `expandSiblings` (tree `*` key) |
| `VALUE_CHANGE` | `increment/decrement` | `incrementLarge/decrementLarge` (PageUp/Down) |
| `DELETE` | — | 새 커맨드 필요 (tablist) |

### 코드 검증 근거 (2026-03-03)

| 검증 항목 | 소스 파일 | 결과 |
|----------|---------|------|
| `entry: selected/restore` | `roleRegistry.ts` L190,219,229,239,250,286 | ✅ listbox/menubar/radio/tablist/toolbar/tree |
| `autoFocus/restoreFocus` | `roleRegistry.ts` L300,302,310,312 | ✅ dialog/alertdialog |
| `Shift+ArrowDown/Up` | `osDefaults.ts` L60-67 | ✅ keybinding 등록 확인 |
| `Ctrl+Arrow` | `grep -r` 전수검색 | ❌ 0건 (sensor/resolver/keybinding 전체) |
| `Ctrl+Space` | `grep -r` 전수검색 | ❌ 0건 |
| `Shift+Space` | `grep -r` 전수검색 | ❌ 0건 |
| `value.largeStep` | `roleRegistry.ts` L377 | ✅ `largeStep: 10` |
| modifier encoding | `getCanonicalKey.ts` L42-48 | ✅ Meta/Ctrl/Alt/Shift prefix |
