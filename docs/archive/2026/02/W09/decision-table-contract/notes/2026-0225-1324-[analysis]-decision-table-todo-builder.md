# 결정 테이블 실증 — Todo × Builder 8열 비교

| 항목 | 내용 |
|------|------|
| **원문** | todo도 지금 있는 테스트 코드와 코드를 기반으로 하나 만들어보고 builder도 하나 만들어봐. 어떻게 구성이 되나 보자 |
| **내(AI)가 추정한 의도** | 8열 결정 테이블(Zone/Given/When/Intent/Condition/Command/Effect/Then)을 단순 앱(Todo)과 복잡 앱(Builder)에 각각 적용하여 구조의 범용성과 축약 패턴을 실증하고 싶다 |
| **날짜** | 2026-02-25 |
| **상태** | 🟢 Analysis |

---

## 1. 8열 구조 (복습)

| # | 열 | 파이프라인 위치 | 역할 |
|---|-----|--------------|------|
| 0 | **Zone** | — | 네임스페이스 |
| 1 | **Given** | 테스트 셋업 | 초기 상태 (items, focus, selection, editing, attrs) |
| 2 | **When** | 입력 | 물리적 입력 |
| 3 | **Intent** | OS 1차 분기 | OS가 번역한 의도 |
| 4 | **Condition** | App 2차 분기 | 같은 Intent 안에서 갈라지는 App 조건 |
| 5 | **Command** | dispatch | 실행되는 커맨드 |
| 6 | **Effect** | side effect | 부수효과 (dispatch, overlay, toast) |
| 7 | **Then** | assertion | 기대 상태 변화 |

---

## 2. Todo — List Zone 결정 테이블

> 근거: `app.ts` bind() 선언 + `todo-bdd.test.ts` 기존 테스트

### Zone: list (role: listbox)

#### When: Space

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T1 | focused=A, !editing | Space | **check** | — | `toggleTodo({id:A})` | — | `todos[A].completed` 반전 |

> Intent=check는 Space 1개뿐. Condition 분기 없음. **1행.**

#### When: Enter

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T2 | focused=A, !editing | Enter | **action** | — | `startEdit({id:A})` | `OS_FIELD_START_EDIT` | `ui.editingId=A` |

> Intent=action도 1:1. Condition 분기 없음. **1행.**

#### When: Backspace / Delete

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T3 | focused=A, sel=[] | Backspace | **delete** | `selection=[]` | `requestDelete([A])` | `OS_OVERLAY_OPEN(dialog)` | `pendingDeleteIds=[A]` |
| T4 | focused=A, sel=[A,B] | Backspace | **delete** | `selection.length>0` | `requestDelete([A,B])` | `OS_OVERLAY_OPEN(dialog)` | `pendingDeleteIds=[A,B]` |
| T5 | focused=A, sel=[] | Delete | **delete** | `selection=[]` | `requestDelete([A])` | `OS_OVERLAY_OPEN(dialog)` | `pendingDeleteIds=[A]` |

> Intent=delete에서 Condition 2분기(sel 유무). When이 2종(Backspace/Delete)이지만 대칭. **3행.**

#### When: Escape

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T6 | sel=[A,B,C] | Escape | **dismiss** | `selection.length>0` | `OS_SELECTION_CLEAR` | — | `selection=[]`, focus 유지 |

> `dismiss.escape="deselect"` 설정. 1행.

#### When: ArrowDown / ArrowUp

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T7 | focused=A, items=[A,B,C] | ArrowDown | **navigate** | mid | `OS_NAVIGATE(next)` | — | `focusedItemId=B` |
| T8 | focused=C (last) | ArrowDown | **navigate** | last (경계) | `OS_NAVIGATE(next)` | — | `focusedItemId=C` (멈춤) |
| T9 | focused=B | ArrowUp | **navigate** | mid | `OS_NAVIGATE(prev)` | — | `focusedItemId=A` |
| T10 | focused=A (first) | ArrowUp | **navigate** | first (경계) | `OS_NAVIGATE(prev)` | — | `focusedItemId=A` (멈춤) |

> navigate + position 경계. 대칭 포함 **4행.** (Home/End도 비슷한 구조 +2행)

#### When: Shift+ArrowDown / Shift+ArrowUp

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T11 | focused=A, sel=[] | Shift+ArrowDown | **range_select** | anchor=A | `OS_SELECT_RANGE` | — | `sel=[A,B], focused=B` |
| T12 | focused=B, sel=[A,B] | Shift+ArrowDown | **range_select** | extending | `OS_SELECT_RANGE` | — | `sel=[A,B,C], focused=C` |
| T13 | focused=C, sel=[A,B,C] | Shift+ArrowUp | **range_select** | contracting | `OS_SELECT_RANGE` | — | `sel=[A,B], focused=B` |

> **3행.**

#### When: Cmd+Arrow

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T14 | focused=B, order=[A,B,C] | Meta+ArrowUp | **move** | — | `moveItemUp` | — | `order=[B,A,C]` |
| T15 | focused=B, order=[A,B,C] | Meta+ArrowDown | **move** | — | `moveItemDown` | — | `order=[A,C,B]` |

> **2행.**

#### When: Clipboard

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T16 | focused=A | Meta+C | **copy** | — | `copyTodo` | clipboard write | item 유지, clipboard에 A |
| T17 | focused=A | Meta+X | **cut** | — | `cutTodo` | clipboard write | item 제거, clipboard에 A |
| T18 | clipboard에 A | Meta+V | **paste** | — | `pasteTodo` | — | 새 todo 추가 |
| T19 | focused=A | Meta+D | **duplicate** | — | `duplicateTodo` | — | A 복제본 추가 |

> **4행.**

#### When: Cmd+A

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T20 | 5 items 표시 중 | Meta+A | **select_all** | — | `OS_SELECT_ALL` | — | 5개 모두 선택 |

> **1행.**

#### When: Mouse

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| T21 | items=[A,B] | Click(B) | **click** | — | `OS_FOCUS+OS_SELECT` | — | focused=B, selected=B |
| T22 | focused=A | Shift+Click(C) | **range_click** | — | `OS_SELECT_RANGE` | — | sel contains C |
| T23 | focused=A | Meta+Click(B) | **toggle_click** | — | `OS_SELECT_TOGGLE` | — | sel contains B |

> **3행.**

### Todo List Zone 합계: **23행**

현재 `todo-bdd.test.ts`의 it() 수: **30개** (§1.1~§1.5 + §ARIA)

차이 7행 = Dialog 후속 시나리오(cancel, confirm, undo 복원) + ARIA 속성 검증. 이들은 list zone의 "직접 입력" 테이블이 아니라 **연쇄(sequence) 시나리오**이므로 별도 표.

---

## 3. Builder — Canvas Zone 결정 테이블

> 근거: `app.ts` bind() + `hierarchicalNavigation.ts` drillDown/drillUp + `builder-canvas-decision-table.md`

### Zone: canvas (role: grid)

#### When: Enter

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B1 | focused=section, !editing, children=[groups] | Enter | **activate** | level=section, hasChildren(group) | `drillToFirstChild` | `OS_FOCUS(group-1)` | focusedItemId=group-1, filter=group |
| B2 | focused=section, !editing, children=[items only] | Enter | **activate** | level=section, hasChildren(item only) | `drillToFirstChild` | `OS_FOCUS(item-1)` | focusedItemId=item-1 (grandchild fallback) 🔴 |
| B3 | focused=group, !editing, children=[items] | Enter | **activate** | level=group, hasChildren | `drillToFirstChild` | `OS_FOCUS(item-1)` | focusedItemId=item-1, filter=item |
| B4 | focused=group, !editing, children=[] | Enter | **activate** | level=group, !hasChildren | `drillToFirstChild` | — | no-op |
| B5 | focused=item, !editing | Enter | **activate** | level=item | `startFieldEdit` | `OS_FIELD_START_EDIT` | editingItemId=item |
| B6 | editing=true | Enter | **field_commit** | isEditing=true | `OS_FIELD_COMMIT` | — | editingItemId=null, field 저장 |

> Intent 2개(activate, field_commit). activate 아래 Condition 5분기. **6행.**

#### When: Escape

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B7 | editing=true | Escape | **field_cancel** | isEditing=true | `OS_FIELD_CANCEL` | — | editingItemId=null, text 원복 |
| B8 | focused=item, !editing | Escape | **dismiss** | level=item | `drillUp(drillToParent)` | `OS_FOCUS(parent-group)` | focusedItemId=group, filter=group |
| B9 | focused=group, !editing | Escape | **dismiss** | level=group | `drillUp(drillToParent)` | `OS_FOCUS(parent-section)` | focusedItemId=section, filter=section |
| B10 | focused=section, !editing | Escape | **dismiss** | level=section | `drillUp(forceDeselect)` | `OS_ESCAPE({force:true})` | focusedItemId=null (deselect) |
| B11 | focused=item, !editing, no group parent | Escape | **dismiss** | level=item, !groupParent | `drillUp` | `OS_FOCUS(section)` | focusedItemId=section (fallback) 🔴 |

> Intent 2개(field_cancel, dismiss). dismiss 아래 4분기. **5행.**

#### When: `\` (Backslash)

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B12 | focused=item, !editing | `\` | **drillUp** | level=item | `drillUp` | `OS_FOCUS(parent)` | focusedItemId=parent |
| B13 | focused=group, !editing | `\` | **drillUp** | level=group | `drillUp` | `OS_FOCUS(section)` | focusedItemId=section |
| B14 | focused=section, !editing | `\` | **drillUp** | level=section | `forceDeselect` | `OS_ESCAPE({force})` | focusedItemId=null |
| B15 | editing=true (non-field char) | `\` | **drillUp** | isEditing, field !owns `\` | `drillUp` | — | drillUp 실행 ⚠️경합 |
| B16 | editing=true (contenteditable) | `\` | **field_input** | isEditing, field owns `\` | (Field 소유) | — | `\` 텍스트 입력 🔴 |

> `\` vs Escape 차이: Escape는 field_cancel, `\`는 field가 소유 여부에 따라 갈림. **5행.**

#### When: ArrowDown / ArrowUp

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B17 | focused=section, !editing, mid | ArrowDown | **navigate** | level=section, mid | `OS_NAVIGATE(next)` | — | 다음 section (corner navigation) |
| B18 | focused=section, !editing, last | ArrowDown | **navigate** | level=section, last | `OS_NAVIGATE(next)` | — | no-op (경계) |
| B19 | focused=group, !editing, mid | ArrowDown | **navigate** | level=group, mid | `OS_NAVIGATE(next)` | — | 다음 group (같은 section 내) |
| B20 | focused=item, !editing, mid | ArrowDown | **navigate** | level=item, mid | `OS_NAVIGATE(next)` | — | 다음 item |
| B21 | editing=true, field owns key | ArrowDown | **field_cursor** | isEditing, fieldOwns=true | (Field 소유) | — | 커서만 이동 |
| B22 | editing=true, field releases key | ArrowDown | **navigate** | isEditing, fieldOwns=false | `OS_NAVIGATE(next)` | — | 다음 item (draft 패턴) |

> ArrowUp은 대칭 (+5행). **6행 + 대칭 5행 = 11행.** (실제 작성은 6행 + "ArrowUp: 대칭" 표기)

#### When: ArrowLeft / ArrowRight

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B23 | !editing | ArrowRight | **navigate** | — | `OS_NAVIGATE(right)` | — | DOM_RECTS 기반 우측 요소 |
| B24 | editing, field owns | ArrowRight | **field_cursor** | fieldOwns=true | (Field 소유) | — | 텍스트 내 커서 우이동 |
| B25 | editing, field releases | ArrowRight | **navigate** | fieldOwns=false | `OS_NAVIGATE(right)` | — | 우측 요소 |

> ArrowLeft 대칭. **3행 + 대칭 = 6행.**

#### When: Clipboard (Cmd+C/X/V)

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B26 | focused=dynamic item (section/card) | Meta+C | **copy** | isDynamic=true | `canvasCollection.copy` | clipboard write (구조) | item 유지 |
| B27 | focused=static item (field) | Meta+C | **copy** | isDynamic=false | `canvasCollection.copyText` | clipboard write (텍스트) | field text 복사 |
| B28 | focused=dynamic item | Meta+X | **cut** | isDynamic=true | `canvasCollection.cut` | clipboard write | item 제거 |
| B29 | focused=static item | Meta+X | **cut** | isDynamic=false | — | — | no-op (PRD 1.3) |
| B30 | clipboard=block, focused=dynamic | Meta+V | **paste** | isDynamic, clip=block | `pasteBubbling` | — | 새 block 추가 |
| B31 | clipboard=text, focused=static | Meta+V | **paste** | !isDynamic, clip=text | `updateFieldByDomId` | — | field 값 갱신 |

> dynamic/static 분기 + clipboard 타입 분기. **6행.**

#### When: Printable chars (a-z, 0-9)

| # | Given | When | Intent | Condition | Command | Effect | Then |
|---|-------|------|--------|-----------|---------|--------|------|
| B32 | focused=item, !editing | `a`~`z`, `0`~`9` | **typing_entry** | level=item | `drillDown` (→ startFieldEdit) | `OS_FIELD_START_EDIT` | editingItemId=item, 문자 입력 |
| B33 | focused=section/group, !editing | `a`~`z`, `0`~`9` | **typing_entry** | level≠item | `drillDown` (→ drillToFirstChild) | `OS_FOCUS(child)` | focusedItemId=child |

> **2행.**

### Builder Canvas Zone 합계

| When | 행 수 | 핵심 분기 |
|------|------|----------|
| Enter | 6 | intent(2) × condition(level, hasChildren) |
| Escape | 5 | intent(2) × condition(level, groupParent) |
| `\` | 5 | intent(2) × condition(level, fieldOwnership) |
| Arrow ↕ | 6+대칭 | intent(2) × condition(level, fieldOwnership, position) |
| Arrow ↔ | 3+대칭 | intent(2) × condition(fieldOwnership) |
| Clipboard | 6 | condition(isDynamic, clipboardType) |
| Typing | 2 | condition(level) |
| **합계** | **~33행** (대칭 축약 시) | |

빌더 캔버스 분석의 원래 41행에서 **Intent 컷 + 대칭 축약으로 ~33행**.

---

## 4. 비교 분석 — Todo vs Builder

### 구조적 차이

| 비교 축 | Todo (list) | Builder (canvas) |
|---------|-------------|-----------------|
| **Zone role** | listbox | grid |
| **행 수** | 23 | ~33 |
| **Intent 종류** | 8 (check, action, delete, dismiss, navigate, range_select, move, copy/cut/paste) | 7 (activate, field_commit/cancel/cursor/input, dismiss, navigate, copy/cut/paste, typing_entry) |
| **Intent당 Condition 분기** | 대부분 0~1개 | 2~5개 |
| **앱 고유 Condition 축** | selection 유무 (1축) | level(3값) × hasChildren(2값) × isDynamic(2값) × fieldOwnership(2값) (4축) |
| **대칭 입력** | ArrowDown/Up, Backspace/Delete | ArrowDown/Up, ArrowLeft/Right |
| **Intent 컷 효과** | 미미 (분기 없음) | 강력 (isEditing이 Intent를 분할) |

### 핵심 발견

1. **단순 앱은 Intent 열이 자명**하다 — Todo의 모든 Intent에서 Condition 분기가 0~1개. 표의 복잡도가 When(입력) 개수에 비례.

2. **복잡 앱은 Intent가 컷 포인트**다 — Builder에서 Enter의 Intent 2개(activate/field_commit)가 Condition 공간을 6→5+1로 분할. 없으면 level × isEditing × hasChildren 전수 열거로 폭발.

3. **대칭 축약은 ~20% 절감** — ArrowDown/Up, Left/Right를 대칭으로 처리하면 41→33.

4. **Clipboard가 가장 복잡한 앱 조건** — Builder의 dynamic/static 분기 + clipboard 타입 분기. OS가 아닌 App이 결정하는 순수 앱 레벨 Condition.

5. **23행 vs 33행** — 빌더가 Todo의 1.4배. 체감 복잡도(41분기)보다 실제 표 행 수는 적음. Intent 컷 + 대칭의 효과.

---

## 5. Cynefin 도메인 판정

🟢 **Clear** — 두 앱의 코드(bind() 선언 + callback 구현)에서 표를 기계적으로 추출 가능. 파이프라인 순서대로 열을 매핑하면 끝.

## 6. 인식 한계

- **Builder sidebar/panel zone 미포함**: 이 분석은 canvas zone만 다룸. sidebar(tree CRUD)와 panel(accordion navigation)은 별도 표 필요.
- **연쇄 시나리오 미포함**: Dialog confirm → undo → 복원 같은 multi-step 시나리오는 이 단일 입력-결과 표로 표현 불가. 별도 "시퀀스 테이블" 필요.
- **마우스 인터랙션 부분적**: Builder canvas의 re-click → drillDown, DnD 등은 미포함.
- **fieldOwnership 판정**: `\` 키의 field ownership은 Field 타입(contenteditable vs input)에 의존하며 런타임 확인 필요.

## 7. 열린 질문

1. **연쇄 시나리오(multi-step)를 어떻게 표현할 것인가?** Delete → Dialog → Confirm → Toast → Undo 같은 흐름은 단일 행으로 안 됨. 별도 "시퀀스 테이블" 또는 "연쇄 행(Chained Rows)"?
2. **대칭 축약 표기법**: ArrowDown/ArrowUp을 한 행으로 묶고 "대칭" 표기하는 공식 방법은?
3. **마우스 인터랙션**: 클릭(click, re-click, shift+click, meta+click, 더블클릭)을 같은 표에 넣을 것인가, 별도 표?

---

> **한줄요약**: 8열 결정 테이블을 Todo(23행)와 Builder(33행)에 적용한 결과, Intent 열이 빌더에서 조합 폭발을 분할하는 핵심 컷이 되며, 단순 앱에서는 자명한 열로 축약 가능함을 실증.
