# Projection Next API — Todo App Usage Scenarios

> 작성일: 2026-03-12
> 맥락: /discussion에서 수렴된 "headless 컴포넌트 반환" 모델을 Todo 앱에 적용한 이상적 usage
> 원칙: item.field(name)은 ARIA 봉인 unstyled 컴포넌트 반환. React는 배치+디자인만. entity scope 차단.

---

## 현재 코드 vs 새 모델 — 핵심 차이

```tsx
// ❌ 현재: LLM이 entity를 직접 참조
const todo = TodoApp.useComputed(s => s.data.todos[todoId]);
<TodoList.Item id={todo.id}>
  <Checkbox checked={todo.completed} />   // entity 직접 참조
  <span>{todo.text}</span>                 // entity 직접 참조
  <button {...TodoList.triggers.DeleteTodo(todoId)}>삭제</button>
</TodoList.Item>

// ✅ 새 모델: entity scope 차단. item.field()가 유일한 데이터 출구
<TodoList.Zone>
  {(item) => (
    <div>
      {item.field("completed")}    // unstyled checkbox + aria-checked 봉인
      {item.field("text")}         // unstyled text 봉인
      {item.trigger("Delete")}     // unstyled button + trigger 봉인
    </div>
  )}
</TodoList.Zone>
```

---

## Usage 1: 기본 Todo List

가장 단순한 형태. 체크박스 + 텍스트 + 삭제 버튼.

```tsx
// app.ts — headless 레이어 (변화 없음에 가까움)
const listCollection = createCollectionZone(TodoApp, "list", {
  ...fromEntities(
    (s: AppState) => s.data.todos,
    (s: AppState) => s.data.todoOrder,
  ),
  fields: {
    completed: (todo) => todo.completed,   // boolean
    text: (todo) => todo.text,             // string
  },
  filter: (state) => (item) => item.categoryId === state.ui.selectedCategoryId,
});

export const TodoListUI = listCollection.bind("listbox", {
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  triggers: {
    Delete: (fid) => deleteTodo({ id: fid }),
  },
});
```

```tsx
// ListView.tsx — React 레이어. 배치 + 디자인만.
function ListView() {
  return (
    <TodoList.Zone className="space-y-2">
      {(item) => (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white
                        data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400
                        data-[selected=true]:bg-indigo-50">

          {/* checkbox — unstyled <input type="checkbox"> + aria-checked 봉인 */}
          <label className="relative w-5 h-5 shrink-0">
            <span className="sr-only">Complete</span>
            {item.field("completed")}
            <span className="absolute inset-0 rounded-full border-2 border-slate-300
                             peer-checked:bg-indigo-600 peer-checked:border-indigo-600
                             flex items-center justify-center">
              <Check size={12} className="text-white" />
            </span>
          </label>

          {/* text — unstyled <span> 봉인 */}
          <div className="flex-1 text-sm text-slate-700">
            {item.field("text")}
          </div>

          {/* trigger — unstyled <button> + data-trigger-id 봉인 */}
          <div className="text-slate-400 hover:text-red-500">
            {item.trigger("Delete")}
          </div>
        </div>
      )}
    </TodoList.Zone>
  );
}
```

**headless test가 검증하는 것:**
- `item.field("completed")` → `<input checked aria-checked="true">` (renderToString)
- `item.field("text")` → `<span>우유 사기</span>` (renderToString)
- keyboard ArrowDown → 다음 아이템 focus
- Space → toggleTodo dispatch → checked 토글

---

## Usage 2: 인라인 편집

편집 모드에서 텍스트 필드가 나타나는 패턴.

```tsx
// app.ts
export const TodoListUI = listCollection.bind("listbox", {
  fields: {
    completed: (todo) => todo.completed,
    text: (todo) => todo.text,
  },
  edit: {
    field: "text",
    onCommit: updateTodoText,
    onCancel: cancelEdit(),
    trigger: "enter",
  },
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  triggers: {
    Delete: (fid) => deleteTodo({ id: fid }),
    StartEdit: (fid) => startEdit({ id: fid }),
  },
});
```

```tsx
// TaskItem — editing이 item context에 포함
function ListView() {
  return (
    <TodoList.Zone className="space-y-2">
      {(item) => (
        <div className="flex items-center gap-3 p-4 rounded-xl border
                        data-[editing=true]:ring-2 data-[editing=true]:ring-indigo-500">

          <label className="relative w-5 h-5 shrink-0">
            {item.field("completed")}
            <span className="absolute inset-0 rounded-full border-2" />
          </label>

          <div className="flex-1">
            {/* item.edit("text")는 편집 중이면 <input>, 아니면 <span> 반환 */}
            {item.edit("text", {
              className: "w-full bg-transparent outline-none text-sm",
              placeholder: "What needs to be done?",
            })}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            {item.trigger("StartEdit", {
              className: "p-1.5 hover:bg-slate-100 rounded",
            })}
            {item.trigger("Delete", {
              className: "p-1.5 hover:text-red-500 rounded",
            })}
          </div>
        </div>
      )}
    </TodoList.Zone>
  );
}
```

**포인트:**
- `item.edit("text")` = 편집 가능 필드. OS가 편집/읽기 모드 전환을 소유
- `item.trigger("StartEdit")` = Enter 키와 동일한 동작의 포인터 트리거
- headless: Enter → `startEdit` → `item.edit("text")`가 input 반환 → renderToString으로 검증

---

## Usage 3: Sidebar (카테고리 선택)

단순 리스트 + 선택(followFocus).

```tsx
// app.ts
const sidebarCollection = createCollectionZone(TodoApp, "sidebar", {
  ...fromEntities(
    (s: AppState) => s.data.categories,
    (s: AppState) => s.data.categoryOrder,
  ),
  fields: {
    text: (cat) => cat.text,
    count: (cat, state) => {
      // 파생 데이터도 field로 선언 가능
      return Object.values(state.data.todos)
        .filter(t => t.categoryId === cat.id).length;
    },
  },
});

export const TodoSidebarUI = sidebarCollection.bind("listbox", {
  onAction: (cursor) => selectCategory({ id: cursor.focusId }),
  options: { select: { followFocus: true } },
});
```

```tsx
// Sidebar.tsx
function Sidebar() {
  return (
    <div className="w-64 bg-slate-50 border-r p-4">
      <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">
        Categories
      </h3>
      <TodoSidebar.Zone className="space-y-1">
        {(item) => (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm
                          data-[selected=true]:bg-indigo-100 data-[selected=true]:text-indigo-900
                          data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-300
                          hover:bg-slate-100 cursor-pointer">
            {/* text — <span>Inbox</span> */}
            <span className="font-medium">
              {item.field("text")}
            </span>
            {/* count — <span>3</span> — 파생 데이터도 동일 경로 */}
            <span className="text-xs text-slate-400 tabular-nums">
              {item.field("count")}
            </span>
          </div>
        )}
      </TodoSidebar.Zone>
    </div>
  );
}
```

**포인트:**
- `item.field("count")` = 파생 데이터. `(cat, state) =>` 시그니처로 전체 state 접근 가능
- followFocus: ArrowDown → focus 이동 + 선택. headless 검증 가능
- category entity를 LLM이 직접 참조할 경로 없음

---

## Usage 4: Toolbar (트리거만)

아이템 없이 트리거만 있는 Zone.

```tsx
// app.ts
export const TodoToolbarUI = toolbarZone.bind("toolbar", {
  triggers: {
    ToggleView: () => toggleView(),
    Undo: () => undoCommand(),
    Redo: () => redoCommand(),
    ClearCompleted: () => clearCompleted(),
  },
});
```

```tsx
// TodoToolbar.tsx
function TodoToolbar() {
  return (
    <TodoToolbar.Zone className="flex items-center gap-2 px-4 py-2 border-b">
      {(zone) => (
        <>
          {zone.trigger("ToggleView", {
            className: "p-2 hover:bg-slate-100 rounded-lg",
            children: <LayoutGrid size={16} />,
          })}

          <div className="flex-1" />

          {zone.trigger("Undo", {
            className: "p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30",
            children: <Undo2 size={16} />,
          })}
          {zone.trigger("Redo", {
            className: "p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30",
            children: <Redo2 size={16} />,
          })}

          <div className="w-px h-5 bg-slate-200" />

          {zone.trigger("ClearCompleted", {
            className: "text-xs text-red-500 hover:text-red-700 px-2 py-1",
            children: "Clear completed",
          })}
        </>
      )}
    </TodoToolbar.Zone>
  );
}
```

**포인트:**
- 아이템 없는 Zone → `(zone)` 콜백. `zone.trigger()`만 사용
- trigger가 `children`과 `className`을 받음 — 시각은 열려있고, 행동(command)은 봉인
- headless: Tab으로 toolbar 진입 → ArrowRight으로 trigger 간 이동

---

## Usage 5: Draft 입력 (Field Zone)

새 todo 추가를 위한 텍스트 입력.

```tsx
// app.ts
const draftZone = TodoApp.createZone("draft");

export const TodoDraftUI = draftZone.bind("textbox", {
  field: {
    name: "DRAFT",
    onCommit: addTodo,
    trigger: "enter",
    resetOnSubmit: true,
    schema: z.string().min(1),
  },
});
```

```tsx
// DraftInput.tsx
function DraftInput() {
  return (
    <TodoDraft.Zone>
      {(zone) => (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed
                        border-slate-200 hover:border-indigo-300
                        has-[[data-focused=true]]:border-solid
                        has-[[data-focused=true]]:border-indigo-400
                        has-[[data-focused=true]]:ring-2
                        has-[[data-focused=true]]:ring-indigo-400/30">
          <Plus size={18} className="text-slate-400" />
          {/* zone.field()는 textbox zone의 input 반환 */}
          {zone.field("DRAFT", {
            className: "flex-1 bg-transparent outline-none text-sm",
            placeholder: "Add a new task...",
          })}
        </div>
      )}
    </TodoDraft.Zone>
  );
}
```

**포인트:**
- textbox zone → `zone.field("DRAFT")`가 `<input>` 반환
- Enter → onCommit → addTodo. headless에서 `page.keyboard.type("우유 사기"); page.keyboard.press("Enter")` 검증
- schema validation(zod)도 OS가 소유

---

## Usage 6: 검색 (change trigger field)

타이핑할 때마다 즉시 반영되는 검색.

```tsx
// app.ts
export const TodoSearchUI = searchZone.bind("textbox", {
  field: {
    name: "SEARCH",
    onCommit: setSearchQuery,
    trigger: "change",    // 타이핑마다 commit
    onCancel: clearSearch(),
  },
  triggers: {
    Clear: () => clearSearch(),
  },
});
```

```tsx
// SearchBar.tsx
function SearchBar() {
  return (
    <TodoSearch.Zone>
      {(zone) => (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border
                        bg-slate-50 hover:border-slate-300
                        has-[[data-focused=true]]:border-indigo-400
                        has-[[data-focused=true]]:bg-white">
          <Search size={15} className="text-slate-400 shrink-0" />

          {zone.field("SEARCH", {
            className: "flex-1 bg-transparent outline-none text-sm",
            placeholder: "Search tasks...",
          })}

          {/* Clear 버튼 — 검색어 있을 때만 노출은 React의 몫 */}
          {zone.trigger("Clear", {
            className: "p-0.5 rounded text-slate-400 hover:text-slate-600",
            children: <X size={14} />,
          })}
        </div>
      )}
    </TodoSearch.Zone>
  );
}
```

---

## Usage 7: 삭제 확인 Dialog (Overlay)

오버레이 패턴. trigger → dialog open → confirm/cancel.

```tsx
// app.ts
const DeleteDialog = listCollection.overlay("delete-dialog", {
  role: "alertdialog",
  confirm: confirmDeleteTodo(),
});
```

```tsx
// DeleteConfirm.tsx
function DeleteConfirm() {
  return (
    <DeleteDialog.Portal>
      {(dialog) => (
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Delete items?</h3>
              <p className="text-sm text-slate-500 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            {/* dialog.dismiss() — 닫기 버튼, aria + focus restore 봉인 */}
            {dialog.dismiss({
              className: "px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg",
              children: "Cancel",
            })}
            {/* dialog.confirm() — 확인 버튼, command dispatch 봉인 */}
            {dialog.confirm({
              className: "px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg",
              children: "Delete",
            })}
          </div>
        </div>
      )}
    </DeleteDialog.Portal>
  );
}
```

**포인트:**
- `dialog.dismiss()`, `dialog.confirm()` = unstyled button + command 봉인
- focus stack push/pop이 OS에 의해 자동
- headless: `OS_OVERLAY_OPEN` → dialog zone 활성 → Enter(confirm) 검증 가능

---

## Usage 8: Bulk Actions (선택 기반 동작)

다중 선택 시 나타나는 액션 바.

```tsx
// ListView.tsx 하단
function BulkActionBar() {
  return (
    <TodoList.Selection>
      {(selection) =>
        selection.count > 1 ? (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20
                          flex items-center gap-3 px-5 py-2.5
                          bg-slate-900 text-white rounded-2xl shadow-xl">
            <span className="text-sm font-semibold tabular-nums">
              {selection.count} selected
            </span>
            <div className="w-px h-5 bg-slate-700" />

            {selection.trigger("BulkDelete", {
              className: "flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 rounded-lg",
              children: <><Trash2 size={13} /> Delete</>,
            })}
            {selection.trigger("BulkToggle", {
              className: "flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 rounded-lg",
              children: <><CheckCheck size={13} /> Complete</>,
            })}
          </div>
        ) : null
      }
    </TodoList.Selection>
  );
}
```

**포인트:**
- `TodoList.Selection` = 선택 상태를 노출하는 headless 컴포넌트
- `selection.count`, `selection.trigger()` = 데이터+행동 봉인
- 시각(position, color, 애니메이션)은 React가 100% 소유

---

## Usage 9: Board View (같은 데이터, 다른 레이아웃)

같은 bind 선언으로 list와 board 뷰를 모두 지원.

```tsx
// BoardView.tsx — 같은 TodoList.Zone, 다른 배치
function BoardView() {
  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {/* 카테고리별 칼럼 */}
      <Column title="To Do" filter="active" />
      <Column title="In Progress" filter="inProgress" />
      <Column title="Done" filter="completed" />
    </div>
  );
}

function Column({ title, filter }: { title: string; filter: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <h3 className="text-sm font-bold text-slate-500 mb-3">{title}</h3>
      {/* 같은 Zone, 다른 배치 — headless 검증은 동일 */}
      <TodoList.Zone filter={filter} className="space-y-2">
        {(item) => (
          <div className="bg-white rounded-lg border p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {item.field("completed")}
              <span className="text-sm font-medium">
                {item.field("text")}
              </span>
            </div>
            <div className="flex gap-1">
              {item.trigger("Delete", {
                className: "text-xs text-slate-400",
                children: "삭제",
              })}
            </div>
          </div>
        )}
      </TodoList.Zone>
    </div>
  );
}
```

**포인트:**
- **같은 headless 선언, 다른 React 배치** — 이것이 분리의 힘
- list view든 board view든 headless test는 동일한 검증 수행
- 시각적 차이(grid vs list)는 React만의 관심사

---

## Usage 10: 드래그 앤 드롭

드래그 상태도 headless에서 제공.

```tsx
<TodoList.Zone className="space-y-2">
  {(item) => (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border",
      item.isDragging && "opacity-30 scale-95",
      item.isDropTarget && "border-indigo-500",
    )}>
      {/* drag handle — headless가 봉인한 drag initiation */}
      {item.dragHandle({
        className: "text-slate-300 cursor-grab active:cursor-grabbing",
        children: <GripVertical size={16} />,
      })}

      {item.field("completed")}
      <span className="flex-1">{item.field("text")}</span>

      {/* drop indicator — 위치 기반 */}
      {item.dropIndicator("before", {
        className: "h-0.5 bg-indigo-500 rounded-full -mt-1",
      })}
    </div>
  )}
</TodoList.Zone>
```

---

## 공통 패턴 요약

### item callback의 API 표면

```typescript
interface ItemContext<T> {
  // 데이터 — entity scope 차단. 이것만이 유일한 데이터 출구
  field(name: keyof Fields<T>): ReactNode;                // unstyled component
  field(name: keyof Fields<T>, opts: StyleOpts): ReactNode; // + className/style

  // 편집 — 읽기/편집 모드 자동 전환
  edit(name: string, opts?: EditOpts): ReactNode;

  // 행동 — command 봉인
  trigger(name: string): ReactNode;
  trigger(name: string, opts: TriggerOpts): ReactNode;

  // 드래그
  dragHandle(opts?: StyleOpts): ReactNode;
  dropIndicator(position: "before" | "after", opts?: StyleOpts): ReactNode;

  // 상태 — data-* 속성으로도 노출 (CSS 셀렉터용)
  isFocused: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  isEditing: boolean;
}

interface StyleOpts {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;       // trigger/handle의 시각적 내용물
}
```

### LLM이 하는 것 / 안 하는 것

| LLM이 하는 것 | LLM이 안 하는 것 |
|--------------|----------------|
| `className` 지정 | `aria-*` 속성 |
| layout 구조 (`div`, `flex`, `grid`) | `role` 속성 |
| 아이콘 선택 (`<Check />`, `<Trash2 />`) | `tabIndex` |
| 조건부 렌더링 (`isEditing ? ... : ...`) | `checked`, `onChange` |
| 애니메이션 (`transition`, `animate-in`) | `data-trigger-id` |
| wrapper div로 감싸기 | entity 직접 참조 (`todo.text`) |

### headless test가 검증하는 것

```typescript
// renderToString → HTML 파싱으로 전부 검증 가능
test("todo 체크 토글", () => {
  page.goto("/");
  page.keyboard.press("Space");

  // item.field("completed") 가 반환한 컴포넌트의 checked 상태
  expect(page.locator(":focus")).toHaveAttribute("aria-checked", "true");

  // item.field("text")가 반환한 컴포넌트의 텍스트
  expect(page.content()).toContain("우유 사기");
});
```
