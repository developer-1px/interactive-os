# defineApp — PROPOSAL

## 1. 핵심 아이디어

`createModule`을 `defineApp + createWidget`으로 **대체**하여:
- **App**이 상태를 소유하고 Widget 팩토리를 반환
- **Widget**이 Zone/Field 바인딩 + 커맨드를 선언하고 렌더 컴포넌트(`.Zone`, `.Item`, `.Field`)를 반환
- 위젯 코드에서 인터랙션 바인딩이 **완전히 사라짐**

## 2. 현재 vs 목표

### v2 (현재 createModule)

```tsx
// ListViewV2.tsx — 바인딩 10줄
const cmds = TodoModule.commands;
<OS.Zone
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

### v3 (목표 defineApp)

```tsx
// ListViewV3.tsx — 바인딩 0줄
<TodoList.Zone>
  <TodoDraft.Field placeholder="Add task..." />
  {todos.map(t => <TodoList.Item id={t.id} key={t.id} />)}
</TodoList.Zone>
```

## 3. API 설계

### 3-1. defineApp

```ts
function defineApp<S>(
  appId: string,
  initialState: S,
): {
  createWidget: <W>(name: string, factory: WidgetFactory<S, W>) => Widget<S, W>;
  createTrigger: (name: string, handler: Handler<S>) => TriggerComponent;
  create: (overrides?: Partial<S>) => AppInstance<S>;  // 테스트용
  useComputed: <T>(selector: (s: S) => T) => T;        // 프로덕션
};
```

### 3-2. createWidget

```ts
type WidgetFactory<S, W> = (define: WidgetDefine<S>) => {
  commands: Record<string, Command>;
  zone?: ZoneDeclaration;     // Zone 이벤트 → 커맨드 매핑
  field?: FieldDeclaration;   // Field 이벤트 → 커맨드 매핑
};

interface WidgetDefine<S> {
  command<P>(name: string, handler: (ctx: { state: S }) => (payload: P) => { state: S }): Command;
}

// Widget이 반환하는 렌더 컴포넌트
interface Widget<S, W> {
  Zone: React.FC<{ children: ReactNode }>;   // zone 선언이 내장된 OS.Zone
  Item: React.FC<{ id: string | number }>;   // OS.Item
  Field: React.FC<FieldProps>;                // zone 선언이 내장된 OS.Field
  Trigger: React.FC<TriggerProps>;            // OS.Trigger
}
```

### 3-3. 커맨드 선언 (일급 상수)

```ts
const { createWidget } = defineApp("todo", INITIAL_STATE);

const TodoList = createWidget("list", (define) => {
  // 커맨드 = 독립 상수, 문자열 = 변수명
  const toggleTodo = define.command("toggleTodo", (ctx) => (payload) => ({
    state: produce(ctx.state, draft => { /* ... */ }),
  }));
  const deleteTodo = define.command("deleteTodo", handler);
  const startEdit = define.command("startEdit", handler);

  return {
    commands: { toggleTodo, deleteTodo, startEdit },
    zone: {
      role: "listbox",
      onCheck: toggleTodo,     // 타입 안전한 직접 참조
      onAction: startEdit,
      onDelete: deleteTodo,
    },
  };
});
```

### 3-4. 전체 Todo App 구조

```ts
// todo/app.ts
export const { createWidget, createTrigger, create, useComputed } = defineApp("todo", INITIAL_STATE);

// todo/widgets/list.ts
export const TodoList = createWidget("list", (define) => { /* ... */ });

// todo/widgets/sidebar.ts
export const TodoSidebar = createWidget("sidebar", (define) => { /* ... */ });

// todo/widgets/draft.ts
export const TodoDraft = createWidget("draft", (define) => { /* ... */ });
```

## 4. 구현 전략

### Phase 1: defineApp + createWidget 코어

1. **`defineApp.ts` 구현** — 기존 `createModule.ts` 기반, 상태 소유 + Widget 팩토리
2. **`createWidget` 구현** — Zone/Field 선언과 렌더 컴포넌트 생성
3. **Widget 렌더 컴포넌트** — `Widget.Zone`, `Widget.Item`, `Widget.Field`
4. **payload 자동 주입** — Zone이 `OS.FOCUS`를 자동으로 커맨드 payload에 주입
5. **커맨드 네이밍 통일** — `define.command("toggleTodo", handler)` (문자열 = 변수명)

### Phase 2: Todo v3 마이그레이션 + 검증

1. **TodoList, TodoSidebar, TodoDraft 위젯 작성** — `createWidget` 기반
2. **v3 위젯 작성** — `<TodoList.Zone>` 패턴
3. **`/playground/todo-v3` 라우트 등록**
4. **E2E 테스트 실행** — v3에서 기존 테스트 통과 확인
5. **기존 createModule 테스트 호환** — dispatch API 동일

## 5. 변경 범위

| 파일 | 변경 |
|------|------|
| `packages/kernel/src/defineApp.ts` | [NEW] defineApp + createWidget API |
| `src/apps/todo/app.ts` | [MODIFY] `defineApp("todo", state)` 사용 |
| `src/apps/todo/widgets-v3/*.tsx` | [NEW] v3 위젯 (Widget.Zone 패턴) |
| `src/pages/TodoPageV3.tsx` | [NEW] v3 페이지 |
| `src/routes/_minimal/playground.todo-v3.tsx` | [NEW] 라우트 |
| `e2e/todo/todo-v3.spec.ts` | [NEW] E2E spec |

## 6. 리스크

| 리스크 | 완화 |
|--------|------|
| Zone 컴포넌트에 module 바인딩 기능 추가 → 커널 변경 필요 | Widget.Zone이 OS.Zone을 래핑하여 props 자동 주입 |
| payload 자동 주입(`OS.FOCUS`)의 타입 안전성 | Generic으로 커맨드 payload 타입 추론 |
| 기존 createModule 사용처 호환 | defineApp이 createModule의 모든 API를 포함 |
| Widget 간 커맨드 이름 충돌 | `appId/widgetName/commandName` 네임스페이스 |

## 7. 대안

| 대안 | 기각 사유 |
|------|-----------|
| createModule에 zones 옵션만 추가 | Module이 점점 비대해짐. Widget 분리 X |
| Zone에 module prop만 추가 | 상태 공유, 다중 Zone 문제 미해결 |
| 기존 v2 구조 유지 | §2.1 위반(이중 선언) 지속. DX 개선 불가 |
