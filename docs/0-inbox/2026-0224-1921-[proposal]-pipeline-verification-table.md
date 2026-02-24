# 파이프라인 검증 표 — Todo 앱 실증

| 항목 | 내용 |
|------|------|
| **원문** | 우리 소스 코드에 있는 Todo앱을 보고 표를 하나 만들어봐 |
| **내(AI)가 추정한 의도** | Discussion에서 도출된 "OS 파이프라인 = 테스트 표의 스키마" 가설을 실제 앱의 전체 상호작용으로 실증하여, LLM 테스트 품질 게이트의 구체적 형태를 확인하고 싶다 |
| **날짜** | 2026-02-24 |
| **상태** | 🔴 Proposal |

---

## 1. 개요

OS 파이프라인(감지→해석→주입→실행→파생→투사)의 각 단계를 **표의 열(column)**로 사용하여, Todo 앱의 모든 상호작용을 **전수 열거**한다.

이 표의 목적:
- **LLM이 테스트를 쓰기 전에** 이 표의 빈칸을 채우게 한다
- 각 빈칸이 OS 파이프라인의 정확한 위치에 대응되므로, "무엇을 검증할지" 추론이 불필요
- 채워진 표가 곧 테스트 코드의 스펙이 된다

### 표의 구조 (열 정의)

| 열 | OS 단계 | 의미 | 예시 |
|----|---------|------|------|
| **시나리오** | — | 사용자 의도 1문장 | "두 번째 할일을 완료 표시" |
| **트리거** | 1-listeners | 물리적 입력 | `keydown:Space`, `click` |
| **입력 데이터** | 1→keymaps | resolve 함수의 Input | `{ canonicalKey: "Space", isEditing: false, ... }` |
| **커맨드** | 3-commands | 발행된 커맨드 | `OS_CHECK({ targetId: "todo-2" })` → `toggleTodo({ id: "todo-2" })` |
| **상태 Before** | state | 변이 전 | `todos["todo-2"].completed = false` |
| **상태 After** | state | 변이 후 | `todos["todo-2"].completed = true` |
| **ARIA/관찰** | 6-components | 화면에 투사된 결과 | `aria-checked="true"` |

---

## 2. Todo 앱 파이프라인 검증 표

### Zone: `list` (role: listbox)

#### 2.1 Navigation — 목록 탐색

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| N1 | 다음 할일로 이동 | `keydown:ArrowDown` | `OS_NAVIGATE({ direction: "next" })` | `focusedItemId: "todo-1"` | `focusedItemId: "todo-2"` | `todo-2: data-focused, tabIndex=0` / `todo-1: tabIndex=-1` |
| N2 | 이전 할일로 이동 | `keydown:ArrowUp` | `OS_NAVIGATE({ direction: "prev" })` | `focusedItemId: "todo-2"` | `focusedItemId: "todo-1"` | `todo-1: data-focused, tabIndex=0` |
| N3 | 첫 번째 항목에서 위로 | `keydown:ArrowUp` | `OS_NAVIGATE({ direction: "prev" })` | `focusedItemId: "todo-1"` (첫 번째) | `focusedItemId: "todo-1"` (변화 없음) | 변화 없음 (listbox: loop=false) |
| N4 | 마지막 항목에서 아래로 | `keydown:ArrowDown` | `OS_NAVIGATE({ direction: "next" })` | `focusedItemId: "todo-3"` (마지막) | `focusedItemId: "todo-3"` (변화 없음) | 변화 없음 |
| N5 | Home | `keydown:Home` | `OS_NAVIGATE({ direction: "first" })` | `focusedItemId: "todo-3"` | `focusedItemId: "todo-1"` | `todo-1: data-focused` |
| N6 | End | `keydown:End` | `OS_NAVIGATE({ direction: "last" })` | `focusedItemId: "todo-1"` | `focusedItemId: "todo-3"` | `todo-3: data-focused` |

#### 2.2 Selection — 항목 선택

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| S1 | 클릭으로 단일 선택 | `mousedown` on todo-2 | `OS_FOCUS` + `OS_SELECT({ mode: "replace" })` | `selection: []` | `selection: ["todo-2"]`, `focusedItemId: "todo-2"` | `todo-2: aria-selected="true"` |
| S2 | Shift+Click 범위 선택 | `mousedown+shift` on todo-3 | `OS_SELECT({ mode: "range" })` | `selection: ["todo-1"]`, `anchor: "todo-1"` | `selection: ["todo-1","todo-2","todo-3"]` | 3개 모두 `aria-selected="true"` |
| S3 | Meta+Click 토글 선택 | `mousedown+meta` on todo-2 | `OS_SELECT({ mode: "toggle" })` | `selection: ["todo-1"]` | `selection: ["todo-1","todo-2"]` | 2개 `aria-selected="true"` |
| S4 | Shift+ArrowDown 범위 확장 | `keydown:Shift+ArrowDown` | `OS_NAVIGATE` + `OS_SELECT({ mode: "range" })` | `selection: ["todo-1"]` | `selection: ["todo-1","todo-2"]`, `focusedItemId: "todo-2"` | 2개 `aria-selected="true"` |
| S5 | Meta+A 전체 선택 | `keydown:Meta+A` | `OS_SELECT_ALL()` | `selection: []` | `selection: ["todo-1","todo-2","todo-3"]` | 전체 `aria-selected="true"` |
| S6 | Escape로 선택 해제 | `keydown:Escape` | `OS_ESCAPE()` | `selection: ["todo-1","todo-2"]` | `selection: []` | 전체 `aria-selected` 제거 |

#### 2.3 Check — 완료 토글

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| C1 | Space로 완료 토글 | `keydown:Space` | `OS_CHECK` → `toggleTodo({ id })` | `todos["todo-1"].completed: false` | `todos["todo-1"].completed: true` | `aria-checked="true"` |
| C2 | 완료 해제 | `keydown:Space` | `OS_CHECK` → `toggleTodo({ id })` | `todos["todo-1"].completed: true` | `todos["todo-1"].completed: false` | `aria-checked="false"` |
| C3 | 클릭으로 체크 (Trigger) | `click` on ToggleTodo trigger | `toggleTodo({ id })` | `completed: false` | `completed: true` | `aria-checked="true"` |

#### 2.4 Activate — 편집 시작

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| A1 | Enter로 편집 시작 | `keydown:Enter` | `OS_ACTIVATE` → `startEdit({ id })` | `ui.editingId: null` | `ui.editingId: "todo-1"`, OS: `editingItemId: "todo-1"` | Field 활성화, contenteditable 노출 |
| A2 | 더블클릭으로 편집 시작 | `dblclick` on StartEdit trigger | `startEdit({ id })` | `ui.editingId: null` | `ui.editingId: "todo-1"` | Field 활성화 |

#### 2.5 Field — 편집 중 동작

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| F1 | Enter로 편집 확정 | `keydown:Enter` (editing) | `OS_FIELD_COMMIT` → `updateTodoText({ text })` | `ui.editingId: "todo-1"`, `text: "Buy milk"` | `ui.editingId: null`, `todos["todo-1"].text: "Buy eggs"` | Field 비활성화, 텍스트 갱신 |
| F2 | Escape로 편집 취소 | `keydown:Escape` (editing) | `OS_FIELD_CANCEL` → `cancelEdit()` | `ui.editingId: "todo-1"` | `ui.editingId: null` (텍스트 변경 없음) | Field 비활성화, 원래 텍스트 |
| F3 | 편집 중 ArrowDown | `keydown:ArrowDown` (editing) | (없음 — Field가 키를 소유) | — | — | 커서가 필드 내에서 이동 |

#### 2.6 Clipboard — 복사/잘라내기/붙여넣기

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| CB1 | 복사 | `keydown:Meta+C` | `OS_COPY` → `copyTodo({ ids })` | `selection: ["todo-1"]` | 상태 변화 없음, clipboard에 todo-1 저장 | — |
| CB2 | 잘라내기 | `keydown:Meta+X` | `OS_CUT` → `cutTodo({ ids, focusId })` | `todoOrder: ["1","2","3"]`, `selection: ["2"]` | `todoOrder: ["1","3"]`, clipboard에 todo-2, `focusedItemId: "todo-3"` | todo-2 사라짐, todo-3에 포커스 |
| CB3 | 붙여넣기 | `keydown:Meta+V` | `OS_PASTE` → `pasteTodo({ afterId })` | clipboard에 todo-2, `focusedItemId: "todo-1"` | `todoOrder: ["1","new-id","3"]`, `focusedItemId: "new-id"` | 새 항목 나타남, 포커스 이동 |
| CB4 | 다중 선택 잘라내기 | `keydown:Meta+X` | `cutTodo({ ids: ["1","2"] })` | `todoOrder: ["1","2","3"]`, `selection: ["1","2"]` | `todoOrder: ["3"]`, `focusedItemId: "todo-3"` | 2개 사라짐 |

#### 2.7 Ordering — 순서 변경

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| O1 | Alt+ArrowDown으로 아래로 | `keydown:Alt+ArrowDown` | `moveItemDown({ id })` | `todoOrder: ["1","2","3"]`, focused: "1" | `todoOrder: ["2","1","3"]` | 목록 순서 변경 |
| O2 | Alt+ArrowUp으로 위로 | `keydown:Alt+ArrowUp` | `moveItemUp({ id })` | `todoOrder: ["1","2","3"]`, focused: "2" | `todoOrder: ["2","1","3"]` | 목록 순서 변경 |
| O3 | 첫 항목에서 위로 이동 | `keydown:Alt+ArrowUp` | `moveItemUp({ id })` | focused: "1" (첫 번째) | 변화 없음 (가장자리) | 변화 없음 |

#### 2.8 Delete — 삭제 (Dialog 연동)

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| D1 | Delete 키로 삭제 요청 | `keydown:Delete/Backspace` | `OS_DELETE` → `requestDeleteTodo({ ids })` | `pendingDeleteIds: []` | `pendingDeleteIds: ["todo-1"]`, overlay: dialog 열림 | AlertDialog 나타남 |
| D2 | Dialog에서 확인 | `click` confirm 버튼 | `confirmDeleteTodo()` | `pendingDeleteIds: ["todo-1"]` | todo-1 제거, overlay 닫힘, toast "1 task deleted" | 항목 사라짐, toast 표시 |
| D3 | Dialog에서 취소 | `click` cancel / `Escape` | `cancelDeleteTodo()` | `pendingDeleteIds: ["todo-1"]` | `pendingDeleteIds: []`, overlay 닫힘 | Dialog 닫힘, 항목 유지 |
| D4 | Toast에서 Undo | `click` Undo action | `undoCommand()` | todo-1 삭제됨 | todo-1 복원 | 항목 복원 |
| D5 | 다중 선택 삭제 | `keydown:Delete` | `requestDeleteTodo({ ids: selection })` | `selection: ["1","2"]` | dialog "Delete 2 tasks?" | Dialog에 개수 표시 |

#### 2.9 Undo/Redo

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| U1 | Undo | `keydown:Meta+Z` | `OS_UNDO` → `undoCommand()` | (직전 상태 변이 후) | 직전 상태로 복원 | 이전 상태 반영 |
| U2 | Redo | `keydown:Meta+Shift+Z` | `OS_REDO` → `redoCommand()` | (undo 후) | undo 이전 상태로 복원 | 복원 상태 반영 |

#### 2.10 Duplicate

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| DU1 | Meta+D로 복제 | `keydown:Meta+D` | `duplicateTodo({ id })` | `todoOrder: ["1","2"]`, focused: "1" | `todoOrder: ["1","new-id","2"]` | 복제된 항목 나타남 |

---

### Zone: `sidebar` (role: listbox)

#### 2.11 Sidebar Navigation & Selection

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| SB1 | ArrowDown으로 카테고리 이동 | `keydown:ArrowDown` | `OS_NAVIGATE` + `selectCategory({ id })` (followFocus) | `focusedItemId: "cat-1"`, `selectedCategoryId: "cat-1"` | `focusedItemId: "cat-2"`, `selectedCategoryId: "cat-2"` | `cat-2: aria-selected="true"`, list 내용 변경 |
| SB2 | Enter로 카테고리 선택 | `keydown:Enter` | `OS_ACTIVATE` → `selectCategory({ id })` | `selectedCategoryId: "cat-1"` | `selectedCategoryId: "cat-2"` | list 영역에 해당 카테고리의 todos 표시 |
| SB3 | Tab으로 list zone 이동 | `keydown:Tab` | `OS_TAB` | activeZone: "sidebar" | activeZone: "list" | sidebar 비활성, list 활성 |

---

### Zone: `draft` (role: textbox)

#### 2.12 Draft — 새 할일 추가

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| DR1 | 텍스트 입력 후 Enter | `keydown:Enter` | `OS_FIELD_COMMIT` → `addTodo({ text })` | `todoOrder: ["1","2"]` | `todoOrder: ["1","2","new-id"]`, 필드 초기화 | 새 할일 나타남, 입력 필드 비움 |
| DR2 | 빈 텍스트로 Enter | `keydown:Enter` | `OS_FIELD_COMMIT` (schema 실패) | — | 변화 없음 | validation 에러 (min 1) |
| DR3 | Tab으로 list zone 이동 | `keydown:Tab` | `OS_TAB` | activeZone: "draft" | activeZone: "list" | draft 비활성, list 활성 |

---

### Zone: `search` (role: textbox)

#### 2.13 Search — 검색 필터

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| SE1 | 텍스트 입력 (change) | `input` event | `OS_FIELD_COMMIT` → `setSearchQuery({ text })` | `searchQuery: ""` | `searchQuery: "buy"` | list 필터링됨 ("buy" 포함 항목만) |
| SE2 | Escape로 검색 초기화 | `keydown:Escape` | `OS_FIELD_CANCEL` → `clearSearch()` | `searchQuery: "buy"` | `searchQuery: ""` | 전체 목록 복원 |

---

### Zone: `toolbar` (role: toolbar)

#### 2.14 Toolbar

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| TB1 | View 토글 (키보드) | `keydown:Meta+Shift+V` | `toggleView()` | `viewMode: "list"` | `viewMode: "board"` | 보드 뷰 표시 |
| TB2 | 완료 항목 삭제 | click ClearDialog confirm | `clearCompleted()` | 완료된 todo 3개 | 완료된 todo 삭제, toast "3 completed tasks cleared" | 완료 항목 사라짐 |

---

### Cross-Zone: Tab / Zone 전환

#### 2.15 Zone Navigation

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| Z1 | Tab으로 다음 Zone | `keydown:Tab` | `OS_TAB({ direction: "next" })` | `activeZoneId: "sidebar"` | `activeZoneId: "list"` | sidebar → list 포커스 이동 |
| Z2 | Shift+Tab으로 이전 Zone | `keydown:Shift+Tab` | `OS_TAB({ direction: "prev" })` | `activeZoneId: "list"` | `activeZoneId: "sidebar"` | list → sidebar 포커스 이동 |
| Z3 | 클릭으로 Zone 전환 | `mousedown` on list item | `OS_FOCUS({ zoneId: "list" })` | `activeZoneId: "sidebar"` | `activeZoneId: "list"`, `focusedItemId: "todo-1"` | list 활성화 |

---

### Overlay: AlertDialog (delete, clear)

#### 2.16 Dialog 상호작용

| # | 시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA/관찰 |
|---|---------|--------|--------|-------------|------------|-----------|
| OV1 | Dialog 열림 → 포커스 트랩 | (자동) | `OS_OVERLAY_OPEN` + `OS_STACK_PUSH` | `overlays.stack: []` | `overlays.stack: [{ id, type: "dialog" }]` | dialog에 포커스 갇힘 |
| OV2 | Tab이 Dialog 안에 갇힘 | `keydown:Tab` | `OS_TAB` (trap 모드) | dialog 내부 첫 버튼 | dialog 내부 다음 버튼 (순환) | 포커스가 dialog 밖으로 안 나감 |
| OV3 | Dialog → Escape → 취소 | `keydown:Escape` | `cancelDeleteTodo()` | dialog 열림 | dialog 닫힘, 이전 포커스 복원 | 포커스가 list 항목으로 복원 |

---

## 3. 표 구조 분석

### 총 시나리오 수: **52개**

| Zone | 카테고리 | 시나리오 수 |
|------|---------|-----------|
| list | Navigation | 6 |
| list | Selection | 6 |
| list | Check | 3 |
| list | Activate/Edit | 2 |
| list | Field | 3 |
| list | Clipboard | 4 |
| list | Ordering | 3 |
| list | Delete+Dialog | 5 |
| list | Undo/Redo | 2 |
| list | Duplicate | 1 |
| sidebar | Nav+Select | 3 |
| draft | Create | 3 |
| search | Filter | 2 |
| toolbar | Actions | 2 |
| cross-zone | Tab | 3 |
| overlay | Dialog | 3 |
| **합계** | | **51** |

### 검증 축별 테스트 분포

| 경계 (실패 축) | 해당 열 | 테스트 방식 | 커버리지 |
|-------------|---------|-----------|---------|
| ①② Input→Command | 트리거 → 커맨드 | `resolve*` 순수함수 테스트 | 모든 행 |
| ④ Command→State | 커맨드 → 상태 After | `dispatch` + state 검증 | 모든 행 |
| ⑤ State→ARIA | 상태 After → ARIA/관찰 | `computeAttrs` 순수함수 테스트 | 모든 행 |

**핵심**: 하나의 시나리오 행이 **3개의 독립된 테스트**를 생성한다.

---

## 4. 결론 / 제안

### Claim

**"테스트를 써라"가 아니라 "이 표의 빈칸을 채워라"가 올바른 지시다.**

- LLM은 빈칸 채우기에 뛰어나다 (W6)
- 표의 열(column)이 OS 파이프라인에서 오면, "무엇을 검증할지" 추론이 불필요 (W9)
- `/doubt`가 효과적인 이유와 동일한 메커니즘: 코드 전에 구조화된 표 3단계 (W7)

### 적용 방식 (제안)

1. **기능 추가/버그 수정 전**: 해당 시나리오를 이 표 형태로 나열
2. **표의 각 행**: `시나리오 | 트리거 | 커맨드 | 상태 Before | 상태 After | ARIA` 6열 채우기
3. **표가 채워진 후**: 각 행이 자동으로 3개의 테스트(Input→Cmd, Cmd→State, State→ARIA)로 변환

---

## 5. Cynefin 도메인 판정

🟡 **Complicated** — 표의 구조는 OS 파이프라인에서 자명하게 도출된다. 선택지가 남은 건 "표에서 코드로의 변환을 자동화할 것인가, 수동으로 할 것인가"와 "모든 시나리오에 6열 전체가 필요한가" 두 가지다.

## 6. 인식 한계

- 이 표는 **정적 분석 + 코드 리딩**에 기반하며, 실제 런타임에서 누락된 시나리오가 있을 수 있다
- DnD(드래그앤드롭)은 `reorderTodo`가 있지만, 드래그 입력 → 커맨드 해석 경로의 상세는 생략했다
- `bulkToggleCompleted`처럼 Bulk Action Bar에서만 접근 가능한 커맨드의 트리거 경로는 Trigger 컴포넌트 분석이 추가로 필요하다

## 7. 열린 질문

1. **표에서 코드로의 변환**: 이 표의 행을 `.test.ts` 파일로 자동 생성하는 도구가 필요한가, 아니면 LLM이 표를 보고 코드를 쓰는 것으로 충분한가?
2. **3개 축 전부 테스트**: 모든 시나리오에서 3개 실패 축을 모두 테스트할 것인가, 빈도/위험도에 따라 선택할 것인가?
3. **워크플로우 통합**: 이 표를 `/red` 또는 `/go`의 필수 Step으로 박을 것인가?

---

> **한줄요약**: OS 파이프라인의 6단계가 곧 테스트 표의 6열이며, Todo 앱 전체를 51개 시나리오로 전수 열거하면 "무엇을 테스트할지" 자체가 자명해진다 — LLM에게 "테스트를 써라"가 아니라 "이 표의 빈칸을 채워라"가 정답이다.
