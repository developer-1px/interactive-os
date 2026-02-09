# Core Library Usage Guide

> 날짜: 2026-02-09
> 태그: core, usage, API, primitives
> 상태: Draft
> 선행 문서: 01-[re-frame] 제안서, 03-[naming] 네이밍 컨벤션

---

## 0. 두 개의 레이어

이 라이브러리에는 두 부류의 사용자가 있다.

```
┌───────────────────────────────────────────────────────┐
│  App Developer (소비자)                                │
│  Zone, Item, Field, Trigger, Label                    │
│  → Radix처럼 primitive를 조합해서 UI를 만든다          │
│  → dispatch, store, defineCommand 같은 건 모른다       │
├───────────────────────────────────────────────────────┤
│  OS Developer (확장자)                                 │
│  defineCommand, defineEffect, defineContext, ...       │
│  → 새 커맨드, 이펙트, 센서를 추가한다                  │
│  → primitive 내부 구현을 수정한다                      │
└───────────────────────────────────────────────────────┘
```

**Part 1**은 앱 개발자를 위한 가이드.
**Part 2**는 OS 개발자를 위한 가이드.

---

# Part 1: App Developer — Primitives

앱 개발자는 5개의 primitive만 쓴다.

```
Zone    — 포커스 영역 (listbox, menu, grid, dialog, ...)
Item    — 포커스 가능한 요소
Field   — 텍스트 입력
Trigger — 커맨드 디스패치 버튼
Label   — Field의 히트 영역 확장
```

## 1. Zone — 포커스 영역

`role` 하나로 모든 키보드/포커스/선택 동작이 결정된다.

```tsx
<Zone role="listbox">
  {/* Arrow keys: 위아래 탐색 */}
  {/* Enter: activate */}
  {/* Space: select */}
  {/* Tab: 바깥으로 탈출 */}
  {/* Home/End: 처음/마지막 */}
</Zone>
```

### 역할 프리셋

| role | 방향 | 선택 | Tab | 특이사항 |
|---|---|---|---|---|
| `listbox` | vertical | single, followFocus | escape | typeahead 검색 |
| `menu` | vertical | none | trap | loop, Enter=activate |
| `menubar` | horizontal | none | escape | 가로 메뉴바 |
| `grid` | both | multiple | escape | 2D 화살표 탐색 |
| `tree` | vertical | single | escape | 확장/축소, 계층 탐색 |
| `tablist` | horizontal | single, followFocus | escape | loop |
| `toolbar` | horizontal | none | escape | 버튼 그룹 |
| `radiogroup` | vertical | single, followFocus | escape | 라디오 버튼 |
| `dialog` | vertical | none | trap | autoFocus, Esc=닫기 |
| `combobox` | vertical | single | trap | 검색 입력 + 팝업 |

### 커맨드 바인딩

Zone에 커맨드를 바인딩하면, 해당 키를 누를 때 자동 dispatch된다.

```tsx
<Zone
  role="listbox"
  onAction={StartEdit({ id: OS.FOCUS })}    // Enter
  onToggle={ToggleDone({ id: OS.FOCUS })}   // Space
  onDelete={DeleteItem({ id: OS.FOCUS })}   // Delete/Backspace
  onCopy={CopyItem({ id: OS.FOCUS })}       // Cmd+C
  onCut={CutItem({ id: OS.FOCUS })}         // Cmd+X
  onPaste={PasteItem({ id: OS.FOCUS })}     // Cmd+V
  onUndo={Undo({})}                          // Cmd+Z
  onRedo={Redo({})}                          // Cmd+Shift+Z
>
```

`OS.FOCUS`는 센티넬 값이다. 실행 시점에 **현재 포커스된 아이템의 ID**로 자동 치환된다.
앱 개발자는 "어떤 아이템에 포커스가 있는지"를 직접 추적할 필요가 없다.

### 설정 오버라이드

```tsx
<Zone
  role="listbox"
  navigate={{ orientation: "horizontal", loop: true }}
  select={{ mode: "multiple", range: true }}
  tab={{ behavior: "trap" }}
>
```

role 프리셋의 기본값을 부분적으로 덮어쓴다.

---

## 2. Item — 포커스 가능한 요소

Item은 **프로젝션 전용**이다. 이벤트 핸들러가 없다.
스토어의 상태를 data attribute로 반영할 뿐이다.

```tsx
<Item id="card-1">
  <span>Card Title</span>
</Item>
```

### 자동 설정되는 속성

Item은 OS 상태에 따라 자동으로 다음 속성을 설정한다:

```html
<!-- 포커스됨 -->
<li data-focused="true" tabindex="0" aria-current="true">

<!-- 선택됨 -->
<li data-selected="true" aria-selected="true">

<!-- 확장됨 (tree) -->
<li data-expanded="true" aria-expanded="true">

<!-- 비활성 -->
<li aria-disabled="true">
```

### Tailwind로 스타일링

```tsx
<Item
  id={card.id}
  className={`
    rounded-lg border transition-all
    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500
    data-[selected=true]:bg-indigo-50 data-[selected=true]:border-indigo-200
    aria-disabled:opacity-40
  `}
>
```

앱 개발자는 `isFocused` 같은 상태를 직접 구독하지 않는다.
CSS selector만으로 모든 상태 스타일링이 가능하다.

### 다형성 (Polymorphic)

```tsx
<Item id="tab-1" as="button">Tab 1</Item>
<Item id="link-1" as="a" href="/page">Link</Item>
<Item id="card-1" asChild>
  <MyCustomCard />  {/* props가 cloneElement로 전달됨 */}
</Item>
```

---

## 3. Field — 텍스트 입력

Field는 `contentEditable` 기반 인라인 편집 프리미티브다.
React의 `onChange`가 아니라, **OS 파이프라인을 통해** 텍스트 변경이 처리된다.

```tsx
<Field
  name="DRAFT"
  value={draft}
  onChange={SyncDraft}       // 매 키 입력마다 dispatch
  onSubmit={AddTodo}         // Enter 시 dispatch
  onCancel={CancelEdit({})}  // Escape 시 dispatch
  placeholder="Add a new task..."
/>
```

### 커맨드 팩토리에 자동 주입

`onChange`와 `onSubmit`은 커맨드 팩토리 함수다.
Field가 현재 텍스트를 `{ text }` 페이로드로 자동 주입한다.

```tsx
// 팩토리 정의
const SyncDraft = (payload: { text: string }) =>
  ({ type: "SYNC_DRAFT", payload });

// Zone에서 사용
<Field
  value={draft}
  onChange={SyncDraft}
  // 사용자가 "hello" 타이핑 → SyncDraft({ text: "hello" }) dispatch
/>
```

### 컨텍스트에 따른 페이로드 조합

```tsx
<Field
  value={draftText}
  onChange={(p) => SyncDraft({ columnId: column.id, text: p.text })}
  onSubmit={(p) => AddCard({ columnId: column.id, text: p.text })}
/>
```

---

## 4. Trigger — 커맨드 디스패치 버튼

클릭 시 커맨드를 dispatch하는 버튼. `onClick` 대신 `onPress`를 쓴다.

```tsx
<Trigger onPress={ToggleDone({ id: todo.id })}>
  <div className="w-5 h-5 rounded-full border">
    <Check />
  </div>
</Trigger>
```

### asChild 패턴 (Radix 스타일)

```tsx
<Trigger onPress={StartEdit({ id: todo.id })} asChild>
  <button className="p-1.5 hover:bg-slate-100 rounded-lg">
    <PencilIcon size={14} />
  </button>
</Trigger>
```

`asChild`일 때 Trigger는 DOM에 렌더되지 않고, 자식에게 onPress 동작을 주입한다.

---

## 5. Label — 히트 영역 확장

Field를 감싸서 클릭 가능 영역을 넓힌다. CSS `:has()`로 Field 포커스 상태에 반응.

```tsx
<Label className="flex items-center gap-3 p-4 rounded-xl border-dashed border-2
  has-[[data-focused=true]]:border-solid
  has-[[data-focused=true]]:border-indigo-400
  has-[[data-focused=true]]:ring-2"
>
  <Plus />
  <Field name="DRAFT" value={draft} onChange={SyncDraft} onSubmit={AddTodo} />
</Label>
```

---

## 6. 실전: Todo 앱 전체 구조

```tsx
function TodoApp() {
  const { state, dispatch } = useTodoStore();

  return (
    <Zone
      id="todo-list"
      role="listbox"
      onAction={StartEdit({ id: OS.FOCUS })}
      onToggle={ToggleDone({ id: OS.FOCUS })}
      onDelete={DeleteTodo({ id: OS.FOCUS })}
      onCopy={CopyTodo({ id: OS.FOCUS })}
      onPaste={PasteTodo({ id: OS.FOCUS })}
      onUndo={Undo({})}
      onRedo={Redo({})}
    >
      {/* Draft Input */}
      <Label className="... has-[[data-focused=true]]:ring-2">
        <Plus />
        <Field
          name="DRAFT"
          value={state.draft}
          onChange={SyncDraft}
          onSubmit={AddTodo}
          placeholder="Add a new task..."
        />
      </Label>

      {/* Task Items */}
      {state.todos.map((todo) => (
        <Item
          key={todo.id}
          id={String(todo.id)}
          className="flex items-center gap-3 p-4 rounded-xl border
            data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500
            data-[selected=true]:bg-indigo-50"
        >
          {/* Checkbox */}
          <Trigger onPress={ToggleDone({ id: todo.id })}>
            <Checkbox checked={todo.done} />
          </Trigger>

          {/* Title */}
          {todo.isEditing ? (
            <Field
              name="EDIT"
              value={todo.editDraft}
              onChange={SyncEditDraft}
              onSubmit={CommitEdit}
              onCancel={CancelEdit({})}
            />
          ) : (
            <span>{todo.text}</span>
          )}

          {/* Actions */}
          <Trigger onPress={DeleteTodo({ id: todo.id })} asChild>
            <button className="p-1 hover:bg-red-50 rounded">
              <Trash size={14} />
            </button>
          </Trigger>
        </Item>
      ))}
    </Zone>
  );
}
```

**앱 개발자가 한 것:**
- `role="listbox"` 선언 → 키보드 탐색, 선택, 포커스 관리 전부 자동
- `onAction`, `onToggle`, `onDelete` 바인딩 → 키보드 단축키 자동
- `Item` + `data-[focused]` → 포커스 스타일링
- `Trigger onPress` → 클릭 액션
- `Field onChange/onSubmit` → 텍스트 입력

**앱 개발자가 하지 않은 것:**
- `addEventListener("keydown")`
- `element.focus()` 호출
- `isFocused` 상태 추적
- `ArrowUp/ArrowDown` 처리
- `aria-selected`, `tabindex` 수동 설정
- `scrollIntoView` 호출

---

## 7. 실전: 칸반 보드 (중첩 Zone)

```tsx
function KanbanBoard() {
  return (
    <Zone id="board" role="menubar">
      {/* 가로 탐색: 컬럼 간 이동 (← →) */}
      {columns.map((col) => (
        <Item key={col.id} id={`col-header-${col.id}`} as="div">
          <ColumnHeader column={col} />

          {/* 세로 탐색: 카드 간 이동 (↑ ↓) */}
          <Zone
            id={`col-${col.id}`}
            role="listbox"
            navigate={{ orientation: "vertical", entry: "restore" }}
            onAction={StartEditCard({ id: OS.FOCUS })}
            onDelete={DeleteCard({ id: OS.FOCUS })}
            onCopy={CopyCard({ id: OS.FOCUS })}
            onPaste={PasteCard({ id: OS.FOCUS })}
          >
            {col.cards.map((card) => (
              <Item
                key={card.id}
                id={card.id}
                className="rounded-lg shadow-card
                  data-[focused=true]:ring-2 data-[focused=true]:ring-brand"
              >
                <CardContent card={card} />
              </Item>
            ))}

            {/* Draft */}
            <Field
              name={`DRAFT-${col.id}`}
              value={col.draft}
              onChange={(p) => SyncDraft({ columnId: col.id, text: p.text })}
              onSubmit={(p) => AddCard({ columnId: col.id, text: p.text })}
              placeholder="Add a card..."
            />
          </Zone>
        </Item>
      ))}
    </Zone>
  );
}
```

Zone이 중첩되면 **seamless navigation**이 자동으로 동작한다:
- `col-1`의 마지막 카드에서 `↓` → `col-1` 탈출 → `col-2`로 진입
- `col-2`에서 `←` → `col-1`으로 수평 이동
- 각 Zone은 독립적인 포커스/선택 상태를 가진다

---

# Part 2: OS Developer — Core API

OS 개발자는 5개의 프리미티브로 시스템을 확장한다.

```
defineCommand    — 이벤트 핸들러 (순수함수)
defineHandler    — 상태만 바꾸는 핸들러 (defineCommand의 단순 버전)
defineEffect     — 부수효과 실행기
defineContext    — 읽기 전용 컨텍스트 제공자
defineComputed   — 파생 상태 (캐시/구독)
```

## 8. defineCommand — 새 OS 커맨드 추가

```typescript
defineCommand("NAVIGATE", [inject("dom-items"), inject("zone-config")], (ctx, payload) => {
  const { state } = ctx;
  const items = ctx["dom-items"] as string[];
  const config = ctx["zone-config"] as FocusGroupConfig;
  const zone = state.focus.zones[state.focus.activeZoneId!];

  const nextId = resolveNavigation(items, zone.focusedItemId, payload.direction, config);

  return {
    state: updateZone(state, state.focus.activeZoneId!, { focusedItemId: nextId }),
    focus: nextId,
    scroll: nextId,
  };
});
```

**규칙:**
- `ctx`는 읽기 전용. 직접 변이 금지.
- 반환값은 `EffectMap`. 부수효과를 **데이터로 선언**한다.
- DOM 접근은 `inject`로 선언한 컨텍스트에서만.
- 스토어 직접 접근 금지. `ctx.state`만 읽는다.

### EffectMap 키

```typescript
return {
  state: nextState,           // 상태 업데이트
  focus: "item-3",           // element.focus()
  scroll: "item-3",          // element.scrollIntoView()
  dispatch: { type, payload }, // 다른 이벤트 큐에 추가
  defer: { event, ms: 100 },  // 지연 dispatch
  clipboard: "text",         // 클립보드 쓰기
  // ... 앱이 defineEffect로 추가한 커스텀 키도 사용 가능
};
```

## 9. defineEffect — 새 부수효과 추가

EffectMap의 키를 실제로 실행하는 핸들러.

```typescript
// 내장
defineEffect("focus", (targetId: string) => {
  document.getElementById(targetId)?.focus({ preventScroll: true });
});

defineEffect("scroll", (targetId: string) => {
  document.getElementById(targetId)?.scrollIntoView({ block: "nearest" });
});

// 앱 확장
defineEffect("toast", (message: string) => {
  toastStore.add({ message, duration: 3000 });
});

defineEffect("http", async ({ url, onSuccess, onFailure }) => {
  try {
    const data = await fetch(url).then(r => r.json());
    dispatch({ type: onSuccess, payload: data });
  } catch (err) {
    dispatch({ type: onFailure, payload: err });
  }
});
```

## 10. defineContext — 새 컨텍스트 제공자

커맨드가 `inject(id)`로 요청할 수 있는 외부 데이터 소스.
DOM 쿼리처럼 비용이 드는 데이터를 **필요한 커맨드에서만** 수집.

```typescript
defineContext("dom-items", () => {
  const zoneId = getState().focus.activeZoneId;
  if (!zoneId) return [];
  const el = document.getElementById(zoneId);
  return Array.from(el?.querySelectorAll("[data-focus-item]") ?? []).map(e => e.id);
});

defineContext("dom-rects", () => {
  const items = resolveContext("dom-items") as string[];
  return new Map(items.map(id => [id, document.getElementById(id)!.getBoundingClientRect()]));
});

defineContext("zone-config", () => {
  const zoneId = getState().focus.activeZoneId;
  return zoneRegistry.get(zoneId)?.config ?? defaultConfig;
});
```

`NAVIGATE`는 `[inject("dom-items"), inject("dom-rects")]`가 필요하지만,
`ACTIVATE`는 `ctx.state`만 읽으면 된다. 불필요한 DOM 쿼리를 하지 않는다.

## 11. defineComputed — 파생 상태

Primitive 내부에서 구독하는 캐싱된 파생 상태.

```typescript
// Layer 2: state에서 직접 추출
defineComputed("focused-item", (state, [_, zoneId]) =>
  state.focus.zones[zoneId]?.focusedItemId
);

// Layer 3: 다른 computed를 조합
defineComputed(
  "is-focused",
  (args) => [["focused-item", args[1]]],
  ([focusedItemId], [_, _zoneId, itemId]) => focusedItemId === itemId
);
```

FocusItem primitive 내부에서 사용:

```typescript
// FocusItem.tsx (OS 내부 코드)
function FocusItem({ id }: { id: string }) {
  const { groupId } = useFocusGroupContext();
  const isFocused = useComputed(["is-focused", groupId, id]);
  const isSelected = useComputed(["is-selected", groupId, id]);

  return (
    <div
      data-focused={isFocused}
      data-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      aria-selected={isSelected}
    >
      {children}
    </div>
  );
}
```

**앱 개발자는 `useComputed`를 직접 쓰지 않는다.**
`data-[focused=true]` CSS selector가 그 역할을 대신한다.

## 12. Middleware — 횡단 관심사

```typescript
use({
  id: "transaction",
  before: (context) => {
    context.snapshot = takeSnapshot();
    return context;
  },
  after: (context) => {
    TransactionLog.add({
      event: context.event,
      diff: computeDiff(context.snapshot, takeSnapshot()),
    });
    return context;
  },
});
```

## 13. 새 센서 추가

```typescript
// DragSensor.tsx
function DragSensor({ children }) {
  const onDragStart = (e: DragEvent) => {
    dispatch({ type: "DRAG_START", payload: { itemId: e.target.id } });
  };
  const onDrop = (e: DragEvent) => {
    dispatch({ type: "DROP", payload: { targetId: e.target.id } });
  };

  return <div onDragStart={onDragStart} onDrop={onDrop}>{children}</div>;
}

// 커맨드 등록
defineCommand("DRAG_START", (ctx, { itemId }) => ({
  state: assocIn(ctx.state, ["drag", "activeItem"], itemId),
}));

defineCommand("DROP", (ctx, { targetId }) => ({
  state: reorderItem(ctx.state, ctx.state.drag.activeItem, targetId),
  dispatch: { type: "app/items-reordered" },
}));
```

기존 코드 수정 0개. 새 파일만 추가.

---

## 14. 테스트

### 커맨드 테스트 — 순수함수, DOM 불필요

```typescript
test("NAVIGATE down moves to next item", () => {
  const ctx = {
    state: {
      focus: {
        activeZoneId: "list",
        zones: { list: { focusedItemId: "item-1" } },
      },
    },
    "dom-items": ["item-1", "item-2", "item-3"],
    "zone-config": { navigate: { orientation: "vertical", loop: false } },
  };

  const fx = commands.get("NAVIGATE")!(ctx, { direction: "down" });

  expect(fx.state.focus.zones.list.focusedItemId).toBe("item-2");
  expect(fx.focus).toBe("item-2");
});
```

### 이펙트 테스트 — 개별 모킹

```typescript
test("focus effect calls element.focus()", () => {
  const mockEl = { focus: vi.fn() };
  vi.spyOn(document, "getElementById").mockReturnValue(mockEl as any);

  effects.get("focus")!("item-2");

  expect(mockEl.focus).toHaveBeenCalledWith({ preventScroll: true });
});
```

---

## 15. 레이어 요약

```
┌──────────────────────────────────────────────────┐
│  App Developer                                   │
│                                                  │
│  Zone ─ Item ─ Field ─ Trigger ─ Label           │
│  "role로 선언하고, data attribute로 스타일링"      │
│                                                  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │  이 경계 아래는 앱 개발자가 알 필요 없음  │     │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
├──────────────────────────────────────────────────┤
│  OS Developer                                    │
│                                                  │
│  dispatch ─────────────────────────── 단일 진입점 │
│    ├─ middleware (before)                         │
│    ├─ inject("dom-items", "zone-config")         │
│    ├─ defineCommand handler → EffectMap           │
│    ├─ middleware (after)                          │
│    ├─ defineEffect("state")  → store.setState    │
│    ├─ defineEffect("focus")  → el.focus()        │
│    └─ defineEffect("scroll") → el.scrollIntoView │
│                                                  │
│  defineComputed → useComputed (primitive 내부용)  │
└──────────────────────────────────────────────────┘
```
