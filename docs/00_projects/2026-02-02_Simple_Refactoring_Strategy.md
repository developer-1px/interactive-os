# Simplest Solution: Logic Extraction (Helper Functions)

## 1. 핵심 (Core Concept)
"Composite Command"라는 거창한 시스템을 만들지 않습니다.
Inspector 기능을 수정할 필요도 없습니다.

그냥 **코드를 깔끔하게 함수로 분리**하고, 하나의 커맨드(`DELETE_TODO`)에서 순차적으로 호출하면 됩니다.

## 2. 해결 방안 (Solution)

### Before (Current)
`DELETE_TODO` 커맨드 안에 모든 로직이 뒤섞여 있음.

### After (Proposed)
로직을 순수 함수(Helper)로 분리합니다.

```typescript
// src/lib/logic/todo_helpers.ts

// 1. 순수 데이터 삭제 로직
export function deleteTodoData(state: AppState, id: string): AppState {
    const remaining = state.data.todos.filter(t => t.id !== id);
    return { ...state, data: { ...state.data, todos: remaining } };
}

// 2. 포커스 계산 로직
export function resolveNextFocus(state: AppState, deletedId: string): AppState {
    // ... 복잡한 다음 포커스 찾기 로직 ...
    const nextId = calculateNextId(...);
    return { ...state, ui: { ...state.ui, focusId: nextId } };
}
```

### Command Definition
커맨드는 단순히 이 함수들을 조립(Compose)하기만 합니다.

```typescript
// src/lib/todo_commands.ts

export const DeleteTodo = defineCommand({
    id: 'DELETE_TODO',
    run: (state, payload) => {
        // 1단계: 포커스 정리 (삭제될 놈이 포커스면 이동)
        let s = resolveNextFocus(state, payload.id);
        
        // 2단계: 데이터 삭제
        s = deleteTodoData(s, payload.id);
        
        return s;
    }
});
```

## 3. 결과 (Outcome)
1. **Inspector**: `DELETE_TODO` 딱 하나만 찍힙니다. (깔끔함)
2. **SRP**: 데이터 로직과 UI 로직이 함수 단위로 분리되어 테스트가 쉽습니다.
3. **Architecture**: 새로운 프레임워크나 룰이 필요 없습니다. 그냥 평범한 리팩토링입니다.

이것이 가장 **Simple**한 방법입니다.
