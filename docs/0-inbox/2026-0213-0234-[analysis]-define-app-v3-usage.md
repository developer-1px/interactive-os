# defineApp v3 Usage Guide

| 항목 | 내용 |
|------|------|
| 원문 | v3의 usage에 대해서 작성해봐 |
| 내(AI)가 추정한 의도 | defineApp + createWidget API의 실제 사용 패턴을 정리하여 다른 앱 마이그레이션 시 참고 문서로 활용하려 함 |
| 날짜 | 2026-02-13 |
| 상태 | 작성 완료 |

---

## 1. 개요

`defineApp`은 `createModule`을 대체하는 v3 앱 프레임워크다. 핵심 차이는 **Widget이 Zone/Field 바인딩을 소유**하여, UI 컴포넌트에서 수동 이벤트 매핑 코드를 완전히 제거한 것.

```
defineApp(id, state, options)
├── createWidget("name", factory) → { Zone, Item, Field, commands }
├── useComputed(selector) → reactive state
├── create() → headless test instance
└── commands → all widget commands merged
```

---

## 2. Usage 패턴

### 2-1. App 정의

```typescript
import { defineApp } from "@/os-new/defineApp";

export const TodoApp = defineApp<AppState>("todo-v3", INITIAL_STATE, {
    history: true,
    selectors: {
        visibleTodos: selectVisibleTodos,
        categories: selectCategories,
        stats: selectStats,
    },
});
```

**포인트**: 상태 타입 `<AppState>`, 초기값, 옵션(history, selectors)을 한 곳에서 선언.

---

### 2-2. Widget 정의 — Zone 바인딩

```typescript
export const TodoList = TodoApp.createWidget("list", (define) => {
    // 커맨드 정의
    const toggleTodo = define.command("toggleTodo", [], handler);
    const deleteTodo = define.command("deleteTodo", [], handler);
    const startEdit  = define.command("startEdit",  [], handler);
    // ... more commands

    return {
        // 커맨드 노출
        commands: { toggleTodo, deleteTodo, startEdit, /* ... */ },

        // Zone 바인딩 선언 — 이 선언이 Widget.Zone에 자동 주입됨
        zone: {
            role: "listbox",
            onCheck:    toggleTodo,
            onAction:   startEdit,
            onDelete:   deleteTodo,
            onCopy:     copyTodo,
            onCut:      cutTodo,
            onPaste:    pasteTodo,
            onMoveUp:   moveItemUp,
            onMoveDown: moveItemDown,
            onUndo:     undoCommand,
            onRedo:     redoCommand,
        },
    };
});
```

**핵심**: `zone` 객체의 이벤트 키 = OS.Zone의 prop 이름. 여기서 선언하면 `<TodoList.Zone>`이 자동 바인딩.

---

### 2-3. Widget 정의 — Field 바인딩

```typescript
export const TodoDraft = TodoApp.createWidget("draft", (define) => {
    const syncDraft = define.command("syncDraft", [], handler);
    const addTodo   = define.command("addTodo",   [], handler);

    return {
        commands: { syncDraft, addTodo },
        field: {
            onChange: syncDraft,   // 타이핑마다 호출
            onSubmit: addTodo,    // Enter 키
        },
    };
});
```

**포인트**: Field 위젯은 `onChange`, `onSubmit`, `onCancel` 세 이벤트만 지원. 간단.

---

### 2-4. UI 위젯에서 사용 — 0 바인딩

#### v2 (수동 바인딩 10줄):
```tsx
<OS.Zone
    id="listView" role="listbox"
    onCheck={cmds.toggleTodo({ id: OS.FOCUS })}
    onAction={cmds.startEdit({ id: OS.FOCUS })}
    onDelete={cmds.deleteTodo({ id: OS.FOCUS })}
    onCopy={cmds.copyTodo({ id: OS.FOCUS })}
    onCut={cmds.cutTodo({ id: OS.FOCUS })}
    onPaste={cmds.pasteTodo({ id: OS.FOCUS })}
    onMoveUp={cmds.moveItemUp({ focusId: OS.FOCUS })}
    onMoveDown={cmds.moveItemDown({ focusId: OS.FOCUS })}
    onUndo={cmds.undoCommand()}
    onRedo={cmds.redoCommand()}
>
```

#### v3 (자동 바인딩 0줄):
```tsx
<TodoList.Zone className="flex flex-col h-full">
    {children}
</TodoList.Zone>
```

**모든 바인딩이 `createWidget`의 `zone` 선언에서 자동 주입**됨.

---

### 2-5. Item과 Field 사용

```tsx
// Item — OS.Item 래퍼
<TodoList.Item id={String(todo.id)} className="...">
    {/* todo 내용 */}
</TodoList.Item>

// Field — onChange/onSubmit/onCancel 자동 주입
<TodoDraft.Field
    name="DRAFT"
    value={draft}
    placeholder="Add a new task..."
/>

// Edit Field — onCancel도 자동 주입됨
<TodoEdit.Field
    name="EDIT"
    value={editDraft}
    autoFocus
    blurOnInactive={true}
/>
```

---

### 2-6. OS.Trigger (마우스 액션)

Widget.Zone은 키보드 이벤트를 처리한다. 마우스 클릭은 여전히 `OS.Trigger` 사용:

```tsx
// 특정 아이템에 대한 직접 커맨드 (마우스 클릭)
<OS.Trigger onPress={TodoList.commands.toggleTodo({ id: todo.id })}>
    <button>Toggle</button>
</OS.Trigger>

<OS.Trigger onPress={TodoList.commands.deleteTodo({ id: todo.id })}>
    <button>Delete</button>
</OS.Trigger>
```

---

### 2-7. 상태 읽기

```tsx
// 위젯 UI에서 상태 구독 — App 레벨의 useComputed 사용
const state = TodoApp.useComputed((s) => s);
const todos = TodoApp.useComputed((s) => s.data.todos);
```

---

### 2-8. 테스트 (Headless)

```typescript
import { TodoApp } from "@apps/todo/v3/app";

test("addTodo creates item", () => {
    const app = TodoApp.create();          // 격리된 테스트 인스턴스
    const before = Object.keys(app.state.data.todos).length;

    app.dispatch.addTodo({ text: "Test" }); // 모든 Widget 커맨드 통합 접근
    expect(Object.keys(app.state.data.todos).length).toBe(before + 1);

    const stats = app.select.stats();       // 셀렉터도 사용 가능
    expect(stats.active).toBe(before + 1);

    app.reset();                             // 초기 상태로 복원
});
```

---

### 2-9. 페이지 조립

```tsx
// TodoPageV3.tsx
export default function TodoPageV3() {
    return (
        <OS.Zone id="main" role="toolbar" className="h-full flex">
            <SidebarV3 />     {/* TodoSidebar.Zone 내장 */}
            <TodoPanelV3 />   {/* TodoList.Zone + TodoDraft.Field 내장 */}
        </OS.Zone>
    );
}
```

---

## 3. 결론 / 제안

### Widget 분해 기준

| 기준 | 설명 |
|------|------|
| 1 Zone = 1 Widget | 키보드 포커스 영역(listbox, toolbar)별로 Widget 분리 |
| 1 Field = 1 Widget | 입력 필드(draft, edit)별로 Widget 분리 |
| Commands-only | Zone/Field 없이 커맨드만 있으면 `zone`/`field` 생략 |

### 마이그레이션 체크리스트

1. `createModule` → `defineApp(id, state, { selectors })` 교체
2. 커맨드를 Zone/Field 단위로 Widget에 분배
3. Widget의 `zone` / `field` 객체에 이벤트 매핑 선언
4. UI 컴포넌트에서 `OS.Zone` → `Widget.Zone` 교체
5. `OS.Field` → `Widget.Field` 교체
6. `Module.create()` → `App.create()` 테스트 교체
7. `Module.useComputed()` → `App.useComputed()` 교체

---

## 4. 해법 유형

🟢 **Known** — API 설계가 확정되고 구현/테스트 완료. 다른 앱에 동일 패턴 적용 가능.

---

## 5. 인식 한계

- 현재 Todo 앱만 마이그레이션 완료. 다른 복잡도의 앱(예: Kanban, Builder)에서도 이 패턴이 적합한지는 미확인.
- `Widget.Zone`의 OS.FOCUS 주입이 모든 커맨드 시그니처에 동일하게 `{ id: OS.FOCUS }`를 넣는데, `focusId`처럼 다른 키를 사용하는 커맨드에 대해서는 커스텀 매핑이 필요할 수 있음.
- 런타임 퍼포먼스 비교(v2 vs v3)는 수행하지 않음.

---

## 6. 열린 질문

1. `TodoList`의 `undoCommand`/`redoCommand`가 `TodoToolbar` UI에서도 OS.Trigger로 참조됨. 커맨드 소유 위치(List vs Toolbar)가 최적인가?
2. `Widget.Zone`이 `OS.FOCUS`를 `{ id: OS.FOCUS }`로 고정 주입하는데, `{ focusId: OS.FOCUS }` 같은 다른 키를 사용하는 커맨드는 현재 방식으로 바인딩되지 않음. 범용 매핑이 필요한가?

---

> **한줄요약**: `defineApp + createWidget` v3 API는 App이 상태를, Widget이 Zone/Field 바인딩을 소유하여, UI 컴포넌트의 바인딩 코드를 0줄로 만드는 패턴이며, Todo 앱에서 검증 완료됨.
