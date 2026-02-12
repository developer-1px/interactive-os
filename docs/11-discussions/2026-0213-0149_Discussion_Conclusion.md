# Discussion Conclusion: Zone Binding과 createModule의 진화

## Why

createModule v2 검증 후, 위젯의 Zone 바인딩 코드가 Module이 이미 아는 정보를 반복하고 있음을 발견. §2.1 "하나의 개념 = 하나의 이름" 위반.

## Intent

createModule이 Zone/Field 바인딩까지 선언하여 위젯에서 인터랙션 로직을 완전히 제거하고, 위젯은 렌더에만 집중하게 만든다.

## Warrants

### 현상 분석
- W1. Zone은 보편적 시맨틱 이벤트(onCheck, onDelete 등)를 정의
- W2. Module은 모든 커맨드를 이미 선언
- W3. 위젯 JSX에서 수동 바인딩 = **이중 선언** (Module이 아는 걸 다시 적음)
- W4. 근본 원인: createModule에 "앱 인터랙션 선언" 역할이 아직 없음

### 설계 원칙
- W5. 커맨드 이름(도메인)과 Zone 이벤트(인터랙션)는 별도 역할 — 둘 다 유지
- W6. `define.command("toggleTodo", handler)` — 문자열 = 변수명 = 커맨드ID (§2.1)
- W7. 커맨드를 독립 상수(일급 객체)로 선언 → commands/zones/Trigger 세 곳에서 공유
- W8. handler 분리는 강제하지 않음 — 간단하면 인라인, 복잡하면 분리
- W9. Module instance 테스트(Level 2)가 sweet spot

### 아키텍처 결론
- W10. **1 Module = 1 Zone이 아니라, `defineApp` + `createWidget` 계층 구조**
- W11. `defineApp("todo", STATE)` → `{ createWidget, createTrigger }` — App이 상태를 소유
- W12. Widget = Zone + commands within app state context — 상태 공유 문제 해결
- W13. 모든 Widget의 commands가 `app.dispatch`에 합쳐짐 → 테스트는 하나의 진입점
- W14. FSD(Feature-Sliced Design)와 자연스럽게 대응
- W15. `createModule`을 **대체**하는 새 API

## 진화 경로

```
v1: todoSlice + 5개 커맨드 파일 + 위젯이 전부 조립
v2: createModule(commands + selectors) + 위젯이 Zone 바인딩
v3: defineApp(상태) + createWidget(zone + commands) + 위젯은 렌더만
```

## v3 핵심 API

```ts
const { createWidget, createTrigger } = defineApp("todo", INITIAL_STATE);

const TodoList = createWidget("list", (define) => {
  const toggleTodo = define.command("toggleTodo", handler);
  const deleteTodo = define.command("deleteTodo", handler);

  return {
    commands: { toggleTodo, deleteTodo },
    zone: { role: "listbox", onCheck: toggleTodo, onDelete: deleteTodo },
  };
});

// 위젯: 렌더만
<TodoList.Zone>
  {todos.map(t => <TodoList.Item id={t.id} />)}
</TodoList.Zone>

// 테스트: 변화 없음
app.dispatch.toggleTodo({ id: 1 });
```

**한줄요약**: createModule은 `defineApp(상태소유) + createWidget(Zone+커맨드)`으로 진화하여, 위젯에서 인터랙션 바인딩을 완전히 제거하고 렌더에만 집중하게 만든다.
