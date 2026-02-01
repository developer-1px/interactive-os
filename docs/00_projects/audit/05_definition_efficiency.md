# 감사 챕터 5: 정의의 효율성 - 보일러플레이트의 역습
## "4중 과세" (The Tax of Four)

**상태**: 🔴 CRITICAL (중대 문제)
**날짜**: 2026-02-01
**범위**: `types.ts`, `todo_commands.ts`, `factories.ts`, `todo_engine.tsx`

### 1. 문제 진단: 하나의 기능을 위해 4곳을 수정해야 한다
현재 시스템에서 새로운 커맨드(예: `ARCHIVE_TODO`)를 추가하려면 다음 4단계를 거쳐야 합니다:

1.  **Type Declaration** (`types.ts`): `TodoCommand` 유니온에 `{ type: 'ARCHIVE_TODO', ... }` 추가.
2.  **String Union** (`types.ts`): `CommandType`에 `'ARCHIVE_TODO'` 문자열 추가.
3.  **Implementation** (`todo_commands.ts`): `defineCommand`로 로직 구현.
4.  **Factory Creation** (`factories.ts`): `ArchiveTodo` 헬퍼 함수 생성.

이것은 "기능 추가"라는 하나의 논리적 행위에 대해 너무 많은 "행정적 비용"을 요구합니다. 이는 개발자가 새로운 기능을 추가하는 것을 주저하게 만들며, 실수(누락)를 유발합니다.

### 2. 수동 배선 (Manual Wiring)의 위험
커맨드를 정의한 후에도, 이를 사용하려면 레지스트리에 "등록"해야 합니다.

```typescript
// todo_commands.ts
export const TodoListCommands = [ ... ];
TodoListCommands.forEach(cmd => TODO_LIST_REGISTRY.register(cmd));

// todo_engine.tsx
[CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY].forEach(reg => { ... });
```

이 "리스트에 추가"하는 행위조차 수동입니다. 만약 `TodoListCommands` 배열에 새 커맨드를 넣는 것을 깜빡하면, 타입 에러는 발생하지 않지만 런타임에 커맨드가 침묵하며 실패합니다. 이것은 가장 위험한 종류의 버그입니다.

### 3. 제안: "정의가 곧 타입이자 팩토리다" (Inferred Architecture)
TypeScript의 강력한 추론(Inference) 기능을 사용하여 이 4단계를 1단계로 압축해야 합니다.

**이상적인 미래 (Future Vision)**:
```typescript
// commands.ts (Single Source of Truth)
export const ArchiveTodo = define.command<{ id: number }>({
    id: 'ARCHIVE_TODO',
    run: (state, payload) => { ... }
});

// types.ts (Auto-Generated)
export type AppCommand = InferCommand<typeof ArchiveTodo>; // { type: 'ARCHIVE_TODO', payload: ... }
```

이렇게 하면 개발자는 `define.command` 하나만 작성하면 타입과 팩토리, ID가 자동으로 도출됩니다. 레지스트리 또한 객체(Module)를 통째로 임포트하여 자동 등록할 수 있습니다.

### 결론
"사용성(Usage) 보일러플레이트"는 해결했지만, "유지보수(Maintenance) 보일러플레이트"가 심각합니다. 이것이 해결되지 않으면 프로젝트 규모가 커질수록 생산성이 급격히 하락할 것입니다.
