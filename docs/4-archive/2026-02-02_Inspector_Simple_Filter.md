# Inspector Observability: The "Filters" Approach (Simpler)

## 1. 문제 재정의 (Problem Reframed)
이전 제안(Composite Tree)은 엔진에 부모-자식 관계 추적 로직(`Thread ID`, `Parent ID`)을 추가해야 하므로 구현 복잡도가 높았습니다.
**"더 쉬운 방법"**을 요청하셨으므로, 구조적 변경 없이 **"보여주는 방식(View)"**만 개선하는 필터링 전략을 제안합니다.

## 2. 제안: Visibility Levels (가시성 레벨)
복잡한 계층 구조를 만드는 대신, 각 커맨드에 **로그 레벨**을 부여하여 Inspector가 이를 필터링하게 합니다.

### 2.1. Command Definition
커맨드 정의 시 `log` 속성을 확장합니다.

```typescript
// 1. User Intent (Composite) - 사용자가 의도한 행위
export const DeleteTodoItem = defineCommand({
    id: 'DELETE_ITEM',
    log: 'user', // (Default) 일반 로그에 표시
    run: ... // 내부에서 다른 커맨드 호출
});

// 2. Implementation Detail (Atomic) - 내부 구현용
export const DeleteTodoData = defineCommand({
    id: 'DELETE_DATA',
    log: 'internal', // 'Verbose' 모드에서만 표시
    run: ...
});
```

### 2.2. Inspector UI
Inspector 상단에 단순한 **Toggle Switch** 하나만 추가합니다.
- `[ ] Show Internals` (Checked: 모든 커맨드 표시 / Unchecked: 'user' 레벨만 표시)

## 3. 장점 (Pros)
1. **Zero Engine Overhead**: 스토어/엔진 로직을 전혀 수정할 필요가 없습니다. 단순히 커맨드 정의(`metadata`)와 Inspector(`filter`)만 수정하면 됩니다.
2. **Flat & Simple**: 데이터 구조가 여전히 Flat 하므로 DB 저장이나 직렬화가 쉽습니다.
3. **Immediate Win**: 당장 적용 가능합니다. (`DeleteTodo`는 `user` 레벨, 내부의 `SetFocus`는 `internal` 레벨로 호출되도록 컨텍스트만 살짝 조정하면 됨)

## 4. 구현 예시 (Command Wrapper)
기존 `DELETE_TODO`를 리팩토링할 때:

```typescript
// Wrapper (Macro)
export const DeleteTodo = defineCommand({
    id: 'DELETE_TODO',
    log: 'user',
    run: (state) => {
        // 내부적으로 Atomic Actions 실행
        // 단, Atomic Actions를 직접 dispatch하는 대신,
        // 이 함수 내에서 로직을 수행하고 'Internal' 성격의 이벤트를 남길지는 선택 사항.
        // 가장 쉬운 건, 그냥 이 커맨드 하나만 로그에 남고, 
        // 결과 State는 한 번에 변하는 것입니다. (Atomic Batch Update)
        
        // 만약 내부 dispatch를 쓴다면:
        dispatch({ type: 'DELETE_DATA', payload: ... }); // log: 'internal'
        dispatch({ type: 'SET_FOCUS', payload: ... });   // log: 'internal'
    }
})
```

가장 쉬운 방법은 **"Atomic Action들은 로그에 남기지 않는다(log: false)"**는 규칙을 적용하는 것입니다.
Inspector에서 `DELETE_TODO` 하나만 깔끔하게 보이고, State는 결과적으로 두 단계가 합쳐진 상태로 보입니다.
