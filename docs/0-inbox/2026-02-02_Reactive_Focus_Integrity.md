# Reactive Focus Integrity (Self-Healing Focus)

## 1. 문제 분석: "SET_FOCUS가 원흉인가?"
사용자의 지적대로 `SET_FOCUS`(혹은 포커스 이동 로직)를 커맨드마다 일일이 구현하는 패턴 자체가 복잡도의 원인입니다.
- `DELETE_TODO`: 삭제 후 포커스 계산 필요.
- `MOVE_CATEGORY`: 카테고리 이동 후 포커스 조정 필요.
- `FILTER_CHANGE`: 필터링 후 포커스 아이템이 사라지면?

모든 데이터 변경 커맨드가 "내 변경으로 인해 포커스가 망가지지 않을까?"를 걱정해야 합니다. 이는 **높은 결합도(Coupling)**입니다.

## 2. 해결 방안: Focus as an Invariant (불변식으로서의 포커스)
포커스는 데이터의 상태에 종속적인 **파생 상태(Derived State/Result)**이거나, 시스템이 항상 유효성을 보장해야 하는 **불변식(Invariant)**이어야 합니다.

### 제안: Auto-Healing Middleware (Reducer Level)
리듀서의 마지막 단계에서 항상 포커스 유효성을 검사합니다.

```typescript
// todo_engine.tsx (Concept)

// 1. 커맨드 실행 (순수하게 데이터만 건드림)
const newState = reducer(state, action);

// 2. 포커스 무결성 체크 (Healer)
const healedState = ensureFocusIntegrity(newState, state.ui.focusId);

return healedState;
```

### `ensureFocusIntegrity` 함수
1. 현재 `focusId`가 `newState.data.todos`에 존재하는가?
2. 존재하면 OK.
3. 존재하지 않으면? (삭제됨)
   - 이전에 존재했었나? (Yes) -> 그럼 "삭제된 위치" 주변의 아이템을 찾아 자동으로 재할당.
   - fallback -> `DRAFT`

## 3. 결과 (Outcome)
1. **Command Simplification**: `DeleteTodo`는 이제 정말 "삭제"만 하면 됩니다. 포커스 신경 끌 수 있습니다.
2. **Robustness**: 어떤 방식(외부 동기화, 대량 삭제 등)으로 데이터가 변해도 포커스가 증발하지 않습니다.
3. **Consistency**: 포커스 이동 규칙(다음 아이템 가기 등)이 한 곳에서 관리됩니다.

## 4. 결론
`SET_FOCUS` 커맨드 자체는 "사용자의 명시적 이동"을 위해 필요하지만, "데이터 변경에 따른 부수적 이동"에 사용되는 것은 잘못된 패턴입니다. 이를 **System Automatic** 영역으로 넘기는 것이 정답입니다.
