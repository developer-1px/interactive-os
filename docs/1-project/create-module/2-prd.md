# createModule — PRD

## 배경

Discussion (2026-02-12)에서 발견: OS에 UIKit(Zone, Item, Trigger)은 있지만 Application Framework가 없다. 앱 개발자가 상태 등록, 커맨드 정의, 키맵, 컨텍스트 매핑, persistence를 각각 다른 파일에서 수동으로 연결해야 한다. 이는 "구조를 선언하면 동작한다"는 철학에 어긋난다.

## 목표

`registerAppSlice`를 `createModule`로 진화시켜, **하나의 선언에서 headless 컴포넌트(프로덕션) + headless 인스턴스(테스트)를 반환**하는 앱 프레임워크를 만든다.

## 범위

### In Scope
- `createModule` API 설계 및 구현
- 기존 `registerAppSlice` 위에 thin wrapper로 구현
- 기존 Todo 앱을 createModule로 마이그레이션
- 기존 Todo 테스트를 createModule 스타일로 재작성
- headless 인스턴스 (`Module.create()`) 반환

### Out of Scope (Phase 2+)
- headless React 컴포넌트 반환 (`Module.Zone`, `Module.Item`)
- 앱 키맵 동적 등록 API
- `asChild` 패턴
- 서버 상태 (`defineResource`)
- 앱 간 통신

## 사용자 시나리오

### 시나리오 1: 앱 모듈 정의
```ts
const TodoModule = createModule("todo", INITIAL_STATE, (define) => ({
  addTodo: define.command("TODO_ADD", (ctx) => (payload) => ({
    state: { ...ctx.state, todos: [...ctx.state.todos, newTodo(payload.text)] }
  })),
  toggleTodo: define.command("TODO_TOGGLE", handler),
  deleteTodo: define.command("TODO_DELETE", handler),
}))
```

### 시나리오 2: 테스트 작성
```ts
test("할 일을 추가한다", () => {
  const app = TodoModule.create();
  app.dispatch.addTodo({ text: "우유 사기" });
  expect(app.state.todos).toHaveLength(1);
});

test("초기화", () => {
  const app = TodoModule.create();
  app.dispatch.addTodo({ text: "우유" });
  app.reset();
  expect(app.state.todos).toHaveLength(0);
});
```

### 시나리오 3: React에서 사용 (기존 방식 유지)
```tsx
// createModule은 기존 useComputed도 지원
const todos = TodoModule.useComputed(s => s.data.todos);
```

## 기술 제약

1. **커널 변경 금지**: createModule은 순수 OS 레이어 확장. `createKernel.ts`는 frozen.
2. **순수함수 유지**: 커맨드 핸들러는 `(state, payload) → newState` 순수함수 구조 불변.
3. **기존 API 호환**: `registerAppSlice`의 기존 사용처가 깨지면 안 됨.
4. **관찰/검증/재현/복구**: 모든 커맨드는 커널 dispatch를 거쳐 transaction log에 기록.
