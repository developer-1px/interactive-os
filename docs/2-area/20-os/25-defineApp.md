# defineApp — OS Application Framework

> Area: 20-os
> Source: src/os/defineApp.ts, defineApp.types.ts, defineApp.bind.ts, defineApp.widget.ts, defineApp.trigger.ts, defineApp.testInstance.ts
> Last synced: 2026-02-18

## 개요

`defineApp`은 OS 위에서 앱을 정의하는 핵심 API이다. 커널 위에 상태, 커맨드, Zone/Field 바인딩, 테스트 인스턴스를 선언적으로 구성한다.

## Entity Tree

```
App (= parent Scope)
  ├── State
  ├── Selector[]       (state → T, branded, named)
  ├── Condition[]      (state → boolean, branded, named)
  ├── Command[]        (flat handler, when guard)
  ├── Zone[]           (child Scope, nestable)
  │   ├── Command[]
  │   ├── ZoneBindings  (role, onCheck, onAction, onDelete, ...)
  │   ├── FieldBindings (onChange, onSubmit, onCancel)
  │   └── Keybindings[] (key, command, when)
  └── Widget[]         (createWidget — high-level zone factory)
```

## API Surface

### defineApp(appId, initialState, options?)

앱을 정의한다. 반환:
- `condition(name, predicate)` → Condition (branded)
- `selector(name, select)` → Selector (branded)
- `command(type, handler, opts?)` → CommandFactory
- `createZone(name)` → ZoneHandle
- `createTrigger(command)` → React trigger component
- `useComputed(selector)` → reactive hook
- `getState()` → current state
- `create(overrides?)` → TestInstance (headless kernel)

### ZoneHandle

Zone은 커맨드의 스코프 경계다:
- `command(type, handler, opts?)` → 이 zone에 등록되는 커맨드
- `createZone(name)` → 중첩 zone
- `bind(config)` → BoundComponents (Zone, Item, Field, When)

### BoundComponents (bind의 반환)

`bind()`는 OS 컴포넌트와 Zone 바인딩을 결합한 렌더 컴포넌트를 반환:
```tsx
const TodoList = listZone.bind({
  role: "listbox",
  onCheck: toggleTodo,
  onAction: startEdit,
  onDelete: deleteTodo,
  field: { onChange: updateDraft, onSubmit: addTodo, onCancel: clearDraft },
  keybindings: [{ key: "Meta+Z", command: undoCommand }],
});

// Usage — zero binding boilerplate
<TodoList.Zone>
  <TodoList.Field name="draft" placeholder="Add task..." />
  {todos.map(t => <TodoList.Item id={t.id} key={t.id} />)}
</TodoList.Zone>
```

### TestInstance (Headless Kernel)

`app.create(overrides?)` 로 테스트용 커널을 생성:
```ts
const inst = TodoApp.create({ todos: [{ id: "1", text: "test" }] });
inst.dispatch(TOGGLE_TODO({ id: "1" }));
expect(inst.state.todos[0].done).toBe(true);
```

## 설계 결정 (ADR)

### ADR-1: Flat Handler (curried → flat)
- 이전: `(ctx) => (payload) => result` (커링)
- 현재: `(ctx, payload) => result` (flat)
- 이유: 커링은 불필요한 복잡도. flat이 더 읽기 쉽고 타입 추론이 단순

### ADR-2: Branded Types (Condition, Selector)
- Symbol로 브랜딩하여 일반 함수와 구별
- `useComputed(selector)` — selector가 branded여야만 호출 가능
- 이유: 잘못된 함수 전달을 컴파일 타임에 방지

### ADR-3: Zone Binding via bind()
- Zone 이벤트 → 커맨드 매핑을 `bind()`에서 선언
- 반환값 BoundComponents가 OS 컴포넌트를 래핑
- 이유: 렌더 코드에서 바인딩 보일러플레이트 완전 제거

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/os/defineApp.ts` | 핵심 구현 |
| `src/os/defineApp.types.ts` | 타입 정의 |
| `src/os/defineApp.bind.ts` | bind() — BoundComponents 생성 |
| `src/os/defineApp.widget.ts` | createWidget — high-level factory |
| `src/os/defineApp.trigger.ts` | createTrigger — 트리거 컴포넌트 |
| `src/os/defineApp.testInstance.ts` | TestInstance — headless kernel |
| `src/os/appSlice.ts` | appSlice — kernel 등록 |
