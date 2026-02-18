# defineApp — PRD

## 배경

`createModule` 프로젝트(Phase 1)에서 commands + selectors + headless test instance를 검증 완료(21 unit, 11 E2E pass). 이후 "Zone binding에 대하여" 디스커션(2026-02-13)에서, 위젯의 Zone 바인딩이 Module이 이미 아는 정보를 반복하고 있음(§2.1 위반)을 발견.

결론: `createModule`을 `defineApp + createWidget`으로 진화시켜, **App이 상태를 소유**하고 **Widget이 Zone/Field 바인딩을 선언**하여 위젯에서 인터랙션 로직을 완전히 제거한다.

### 선행 프로젝트

- [create-module](file:///Users/user/Desktop/interactive-os/docs/1-project/create-module/) — Phase 1 완료, Phase 2(headless components)가 이 프로젝트의 시작점

## 목표

`createModule`을 `defineApp + createWidget`으로 **대체**하여:
1. **App** (`defineApp`) — 앱 상태를 소유하고, Widget을 생성하는 팩토리 반환
2. **Widget** (`createWidget`) — Zone/Field 바인딩 + 커맨드 핸들러를 선언, 렌더 컴포넌트 반환
3. **Trigger** (`createTrigger`) — Zone 밖 독립 버튼

## 범위

### In Scope
- `defineApp` API 설계 및 구현
- `createWidget` API 설계 및 구현 (Zone + commands + fields)
- `createTrigger` API 설계 및 구현
- 기존 `createModule` 기반 TodoModule을 `defineApp` 스타일로 마이그레이션 (v3)
- v3 위젯: `<TodoList.Zone>`, `<TodoSidebar.Zone>`, `<TodoList.Item>` 패턴
- E2E 테스트 — v3 페이지에서 기존 테스트 통과 확인
- 커맨드 네이밍 통일: `define.command("toggleTodo", handler)` (변수명 = 문자열)

### Out of Scope
- 앱 간 통신
- 서버 상태 (`defineResource`)
- 기존 `todoSlice` + v1 widgets 삭제 (별도 마이그레이션)
- `asChild` 패턴 (후속)

## 사용자 시나리오

### 시나리오 1: 앱 정의 + Widget 분리

```ts
const { createWidget, createTrigger } = defineApp("todo", INITIAL_STATE);

const TodoList = createWidget("list", (define) => {
  const toggleTodo = define.command("toggleTodo", handler);
  const deleteTodo = define.command("deleteTodo", handler);
  const startEdit = define.command("startEdit", handler);

  return {
    commands: { toggleTodo, deleteTodo, startEdit },
    zone: { role: "listbox", onCheck: toggleTodo, onAction: startEdit, onDelete: deleteTodo },
  };
});

const TodoSidebar = createWidget("sidebar", (define) => {
  const selectCategory = define.command("selectCategory", handler);
  return {
    commands: { selectCategory },
    zone: { role: "listbox", onAction: selectCategory },
  };
});
```

### 시나리오 2: 위젯에서 렌더만

```tsx
function TodoPage() {
  return (
    <>
      <TodoSidebar.Zone>
        {categories.map(c => <TodoSidebar.Item id={c.id} key={c.id} />)}
      </TodoSidebar.Zone>
      <TodoList.Zone>
        <TodoDraft.Field placeholder="Add task..." />
        {todos.map(t => <TodoList.Item id={t.id} key={t.id} />)}
      </TodoList.Zone>
    </>
  );
}
```

### 시나리오 3: 테스트 (변화 없음)

```ts
const app = TodoApp.create();
app.dispatch.addTodo({ text: "Buy milk" });
app.dispatch.toggleTodo({ id: 1 });
expect(app.select.visibleTodos()).toHaveLength(1);
```

## 기술 제약

1. **커널 변경 최소화**: `defineApp`은 OS 레이어 확장. 커널 core는 가능한 한 frozen.
2. **순수함수 유지**: 커맨드 핸들러는 `(ctx, payload) → { state }` 순수함수 구조.
3. **기존 API 호환**: `createModule`의 기존 사용처(`TodoModule.useComputed` 등)와 호환.
4. **FSD 대응**: App = 상태 단위, Widget = feature 단위로 자연스럽게 대응.
