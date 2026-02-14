# defineApp v5 — Design Specification

> **확정 일자**: 2026-02-14
> **경로**: Discussion → Red/Blue 합의 → PoC 검증 (tsc + 26 runtime assertions)

---

## Entity Tree

```
App (= parent Scope)
  ├── State
  ├── Selector[]           (state → T, branded, named)
  ├── Condition[]          (state → boolean, branded, named)
  ├── Command[]            (type + handler + when?, app-level)
  └── Zone[]               (= child Scope, recursive)
        ├── role            (ARIA)
        ├── Command[]       (zone-scoped)
        ├── Keybinding[]    (key → command, when?)
        ├── Bindings        (event → command)
        ├── Zone[]          (nested, zone.createZone())
        └── UI              (Zone, Item, Field, When components)
```

## Warrants (확정된 설계 원칙)

| # | Warrant |
|---|---------|
| W15 | 커맨드는 일급 객체 (import 가능한 상수). 문자열 키만으로 존재 불가 |
| W16 | handler는 ctx를 mutate하지 않고 새 state를 반환 |
| W17 | when guard의 command-level co-location |
| W20' | **Zone = 인터랙션 바운더리.** 키보드 + 마우스 + 복사/붙여넣기 + 포커스 등 OS 인터랙션 |
| W26 | **when = dispatch guard.** kernel이 차단. routing-only가 아님 |
| W28 | **Condition = 이름 붙은 boolean predicate.** Selector와 분리 |
| W29 | Boilerplate 비용 = 0 (LLM이 코딩). 설계 기준은 관찰가능성 최대화 |
| W30 | Zone의 scope 버블링은 kernel의 기존 `scopedCommands` + `parentMap`으로 구현 |
| W31 | Zone은 재귀적으로 중첩 가능. `zone.createZone()`으로 child scope 생성 |

## API Surface

### App

```ts
const TodoApp = defineApp<TodoState>("todo", INITIAL, { history: true });

// Condition — 이름 붙은 boolean predicate (when guard용)
const canUndo = TodoApp.condition("canUndo", (s) => s.history.past.length > 0);

// Selector — 이름 붙은 데이터 파생
const visibleTodos = TodoApp.selector("visibleTodos", (s) => ...);

// App-level command (Undo, Redo 등 Zone에 속하지 않는 것)
const undo = TodoApp.command("UNDO", handler, { when: canUndo });
```

### Zone

```ts
const listZone = TodoApp.createZone("list");
const itemZone = listZone.createZone("item"); // nested

// Zone-scoped command
const toggleTodo = listZone.command("TOGGLE_TODO", handler);
const startEdit = listZone.command("START_EDIT", handler, { when: isNotEditing });

// Bind → React components
const TodoListUI = listZone.bind({
    role: "listbox",
    onCheck: toggleTodo,
    onAction: startEdit,
    onUndo: undo,          // app-level command in zone binding
    keybindings: [
        { key: "Meta+Z", command: undo, when: canUndo },
    ],
});
```

### Test

```ts
const app = TodoApp.create();
app.dispatch(toggleTodo({ id: 1 }));
console.assert(app.dispatch(undo()) === false); // blocked by when
app.evaluate(canUndo);                          // Condition query
app.select(visibleTodos);                       // Selector query
```

### DevTools

```ts
TodoApp.conditions(); // 전수 열거
TodoApp.selectors();  // 전수 열거
```

## Red/Blue 합의 사항

| 항목 | 결정 |
|------|------|
| setState | public API에서 제거. 내부 인프라/DevTools만 접근 |
| Condition 이름 | 중복 시 throw |
| when + handler 이중 guard | when이 보장하면 handler에서 생략 |
| dispatch chain | TestInstance에서 result.dispatch 재귀 처리 |
| Immer 사용 | 관례로 충분. 타입 강제 불필요 |
| getState() | 인프라/DevTools용 유지. 앱 코드는 selector 사용 |
| when 없는 커맨드 | 비대칭 수용. when은 선택적 |

## PoC 파일

| 파일 | 용도 |
|------|------|
| `src/os/poc/defineApp-v5.ts` | 타입 + 최소 런타임 구현 |
| `src/os/poc/usage-v5.ts` | Todo 앱 전체 usage + 26 assertions |

## 다음 단계 (Production 전환)

| 우선순위 | 항목 |
|---------|------|
| P0 | `createZone` → `kernel.group` 통합 (scope 버블링 증명) |
| P1 | 기존 `defineApp.ts` (v3)를 v5 API로 교체 |
| P1 | Todo v3 앱을 v5 API로 마이그레이션 |
| P2 | Builder 앱 v5 마이그레이션 |
| P2 | lint rule: 앱 코드 getState() 경고 |
