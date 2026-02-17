# createModule — PROPOSAL

## 1. 핵심 아이디어

`registerAppSlice`를 확장하여, 상태 + 커맨드 + 셀렉터를 하나의 선언에 묶고, **headless 테스트 인스턴스**를 반환하는 `createModule` API를 만든다.

## 2. 현재 vs 목표 (Before / After)

### Before — 현재 Todo 테스트 (todo.test.ts)

```ts
// 16개 import, 6개 파일에서
import { kernel } from "@/os-new/kernel";
import { todoSlice } from "@apps/todo/app";
import { AddTodo, DeleteTodo, ToggleTodo, ... } from "@apps/todo/features/commands/list";
import { DuplicateTodo } from "@apps/todo/features/commands/clipboard";
import { MoveCategoryUp, ... } from "@apps/todo/features/commands/MoveCategoryUp";
import { selectVisibleTodos, selectStats, ... } from "@apps/todo/selectors";

// 수동 커널 상태 save/restore
let snap;
beforeEach(() => {
  snap = kernel.getState();
  vi.spyOn(Date, "now").mockImplementation(() => ++now);
  return () => { kernel.setState(() => snap); vi.restoreAllMocks(); };
});

// 테스트마다 헬퍼 필요
function state() { return todoSlice.getState(); }
function d(cmd) { kernel.dispatch(cmd); }
```

### After — createModule 스타일

```ts
// 1개 import
import { TodoModule } from "@apps/todo/module";

// 자동 격리
const app = TodoModule.create();

test("AddTodo creates item", () => {
  app.dispatch.addTodo({ text: "Buy milk" });
  expect(app.select.visibleTodos()).toHaveLength(1);
});
```

## 3. API 설계

### 3-1. createModule 정의

```ts
// src/os-new/createModule.ts

function createModule<S>(
  appId: string,
  initialState: S,
  factory: (define: ModuleDefine<S>) => ModuleDefinition<S>,
): Module<S>;

interface ModuleDefine<S> {
  command<T extends string, P = void>(
    type: T,
    handler: (ctx: { state: S }) => (payload: P) => { state: S } | undefined,
  ): CommandFactory<T, P>;
}

interface Module<S> {
  // 테스트용: 격리된 인스턴스 생성
  create(overrides?: Partial<S>): ModuleInstance<S>;

  // 프로덕션: 기존 API 호환
  useComputed<T>(selector: (s: S) => T): T;
  getState(): S;
  dispatch: Record<string, (payload?: any) => void>;

  // 커맨드 팩토리 노출 (기존 코드 호환)
  commands: Record<string, CommandFactory>;
}

interface ModuleInstance<S> {
  state: S;  // getter (현재 상태)
  dispatch: Record<string, (payload?: any) => void>;  // 커맨드 직접 호출
  select: Record<string, (...args: any[]) => any>;    // 셀렉터
  reset(): void;        // initialState로 복귀
  undo(): void;         // history undo
  redo(): void;         // history redo
}
```

### 3-2. Todo 모듈 정의 (목표)

```ts
// src/apps/todo/module.ts

import { createModule } from "@/os-new/createModule";
import { INITIAL_STATE } from "./features/todo_details/persistence";

// 핸들러는 별도 파일에서 import 가능 (순수함수 분리 유지)
import * as handlers from "./features/commands/list";
import * as clipboardHandlers from "./features/commands/clipboard";
import * as selectors from "./selectors";

export const TodoModule = createModule("todo", INITIAL_STATE, (define) => ({
  // 커맨드
  addTodo: define.command("TODO_ADD", handlers.addTodoHandler),
  deleteTodo: define.command("TODO_DELETE", handlers.deleteTodoHandler),
  toggleTodo: define.command("TODO_TOGGLE", handlers.toggleTodoHandler),
  startEdit: define.command("TODO_START_EDIT", handlers.startEditHandler),
  cancelEdit: define.command("TODO_CANCEL_EDIT", handlers.cancelEditHandler),
  updateTodoText: define.command("TODO_UPDATE_TEXT", handlers.updateTextHandler),
  syncDraft: define.command("TODO_SYNC_DRAFT", handlers.syncDraftHandler),
  clearCompleted: define.command("TODO_CLEAR_COMPLETED", handlers.clearCompletedHandler),
  duplicateTodo: define.command("TODO_DUPLICATE", clipboardHandlers.duplicateHandler),
  moveItemUp: define.command("TODO_MOVE_UP", handlers.moveUpHandler),
  moveItemDown: define.command("TODO_MOVE_DOWN", handlers.moveDownHandler),

  // 셀렉터
  selectors: {
    visibleTodos: selectors.selectVisibleTodos,
    categories: selectors.selectCategories,
    stats: selectors.selectStats,
    editingTodo: selectors.selectEditingTodo,
    todosByCategory: selectors.selectTodosByCategory,
  },
}));
```

## 4. 구현 전략

### Phase 1: createModule 코어 (이번 프로젝트 범위)

1. **`createModule.ts` 신규 작성** — `registerAppSlice` 위에 thin wrapper
2. **`Module.create()` 구현** — 격리된 커널 인스턴스 생성 + 커맨드/셀렉터 바인딩
3. **기존 Todo 테스트를 createModule 스타일로 재작성** — 검증
4. **기존 `todoSlice` + commands/는 유지** — 점진적 마이그레이션

### Phase 2: headless 컴포넌트 (후속 프로젝트)

- `Module.Zone`, `Module.Item` 등 headless React 컴포넌트 반환
- `asChild` 패턴
- keymap 자동 등록

## 5. 변경 범위

| 파일 | 변경 |
|------|------|
| `src/os-new/createModule.ts` | [NEW] 핵심 API |
| `src/apps/todo/module.ts` | [NEW] TodoModule 정의 |
| `src/apps/todo/tests/todo.test.ts` | [MODIFY] createModule 스타일로 재작성 |
| `src/os-new/appSlice.ts` | [MODIFY] createModule에서 내부 사용할 수 있도록 minor 조정 |

## 6. 리스크

| 리스크 | 완화 |
|--------|------|
| `Module.create()`가 매번 새 커널을 만들면 성능 부담 | 테스트 전용. 프로덕션에서는 기존 singleton 커널 사용 |
| 핸들러 export 형태 변경 | 핸들러 함수 자체는 변경 없음, wrapper만 추가 |
| 기존 테스트가 깨질 수 있음 | 기존 테스트 파일 유지, 새 테스트를 별도 파일로. 검증 후 이관 |

## 7. 대안

| 대안 | 기각 사유 |
|------|----------|
| Zone에 `slice` prop 추가만 | 테스트 인스턴스 격리 문제 해결 안 됨 |
| 기존 구조 유지 | Discussion에서 확인된 DX 문제 미해결 |
| 완전히 새로운 프레임워크 | RTK 함정. 진화가 혁명보다 안전 |
