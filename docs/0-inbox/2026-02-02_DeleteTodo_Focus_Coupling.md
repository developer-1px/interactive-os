# DELETE_TODO와 Focus 로직의 결합도 분석 (Coupling Analysis)

## 1. 맥락 (Context)
사용자 지적: `DELETE_TODO` 커맨드가 데이터 삭제(`data.todos`)뿐만 아니라 다음 포커스 계산(`ui.focusId`)까지 동시에 수행하고 있습니다.
이는 **단일 책임 원칙(SRP)**을 위반하며, 데이터 제어 로직과 UI 제어 로직이 뒤섞여 있어 테스트와 유지보수를 어렵게 합니다.

## 2. 현황 분석 (Current Status)
`src/lib/todo_commands.ts`의 `DeleteTodo` 구현을 보면:

```typescript
run: (state, payload) => {
    // 1. 데이터 삭제 로직
    const remaining = state.data.todos.filter(...)

    // 2. UI 포커스 계산 로직 (상당히 복잡함)
    let nextFocus = state.ui.focusId;
    if (...) {
        // 다음/이전 아이템 찾기 로직...
        nextFocus = ...
    }

    // 3. 동시에 반환
    return {
        ...state,
        data: { ...state.data, todos: remaining },
        ui: { ...state.ui, focusId: nextFocus }
    };
}
```

### 문제점
1. **재사용성 저하**: 포커스 이동 없이 조용히 삭제만 하고 싶을 때(예: 백그라운드 정리) 이 커맨드를 사용할 수 없음.
2. **복잡도 증가**: 삭제 로직보다 포커스 계산 로직이 더 길어서 본질이 흐려짐.
3. **테스트 난이도**: "데이터가 잘 지워졌는가?"를 테스트하려면 포커스 상태까지 모킹해야 함.

## 3. 제안 (Proposal)
이 문제를 해결하기 위해 **Command Composition (커맨드 합성)** 패턴 도입을 제안합니다.

### 3.1. Atomic Commands 분리
1. `DELETE_TODO_DATA`: 순수하게 데이터만 삭제. (UI 상태 변경 없음 혹은 최소화)
2. `CALCULATE_NEXT_FOCUS`: 현재 포커스 아이템이 사라졌을 때 갈 곳을 계산하여 `SET_FOCUS`.

### 3.2. Composite Command (Macro)
이 두 가지를 묶어서 실행하는 상위 개념을 정의합니다.

```typescript
// Pseudo Code
export const DeleteItem = defineCompositeCommand({
    id: 'DELETE_ITEM',
    kb: ['Delete'],
    sequence: [
        // 1. 삭제 전 포커스 계산 (Pre-calculation) 혹은 삭제 후 보정?
        // 삭제 후에는 아이템을 찾을 수 없으므로, 삭제 전에 "삭제될 놈 다음 놈"을 기억해야 함.
        (state) => ({ type: 'STORE_NEXT_FOCUS_TARGET', payload: ... }),
        (state) => ({ type: 'DELETE_TODO_DATA', payload: ... }),
        (state) => ({ type: 'RESTORE_FOCUS', payload: ... })
    ]
});
```
또는, 리듀서 내에서 체이닝을 허용하는 구조로 개선이 필요합니다.

### 3.3. Immediate Action Plan
당장은 구조를 크게 뜯기 부담스럽다면, **Logic Extraction**부터 수행해야 합니다.
`findNextFocusId(todos, currentId)` 같은 순수 함수로 포커스 계산 로직을 분리하여 `DeleteTodo`의 `run` 함수 본문을 경량화하는 것이 1단계입니다.
