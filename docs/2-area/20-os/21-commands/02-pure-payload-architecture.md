# [아키텍처] OS.FOCUS를 통한 명시적 페이로드 해결

## 1. 개요
이전의 "암시적 미들웨어 해결(Implicit Middleware Resolution)" 방식은 페이로드의 누락 여부가 모호하다는 문제점이 제기되었습니다.
이에 대한 해결책으로, **"Explicit Sentinel Value (명시적 예약어)"** 패턴을 채택합니다.
UI 호출부에서 `OS.FOCUS`라는 명시적인 상수를 페이로드로 전달함으로써, "현재 포커스된 대상을 사용하겠다"는 의도를 분명히 합니다.

## 2. 분석

### 🚨 암시적 해결의 문제점 (이전 방식)
- `DeleteTodo({})` 호출 시, 이것이 "전체 삭제"를 의도한 것인지, "포커스 삭제"를 의도한 것인지, 아니면 "실수"인지 구분하기 어려움.
- 코드를 읽는 사람 입장에서 `id`가 어디서 오는지 추적하기 힘듦.

### ✅ 제안: OS.FOCUS 센티넬 패턴
UI 컴포넌트나 키바인딩 정의에서 페이로드에 **`OS.FOCUS`**라는 예약어를 명시적으로 주입합니다.
미들웨어는 이 예약어를 감지했을 때만 OS 상태(Store)를 조회하여 실제 값으로 치환(Resolve)합니다.

#### 흐름
1. **Definition**: `export const OS = { FOCUS: "__OS_FOCUS_SENTINEL__" } as const;`
2. **Trigger**: `dispatch(DeleteTodo({ id: OS.FOCUS }))`
   - "이 커맨드는 현재 OS가 포커스하고 있는 ID를 타겟으로 한다"는 의도가 코드에 명시됨.
3. **Middleware (Smart Dispatcher)**:
   - 페이로드를 순회하며 값이 `OS.FOCUS`인 필드를 찾음.
   - 해당 필드를 `useFocusStore.getState().focusedItemId`로 교체.
   - 교체된 후 로그: `Dispatching [DELETE_TODO] payload: { id: 123 } (resolved from OS.FOCUS)`
4. **Command Reducer (Pure)**:
   - 입력: `(state, { id: 123 })`
   - 리듀서는 여전히 순수하며, `OS.FOCUS` 예약어의 존재를 모름.

## 3. 구현 예시

> **현재 구현 위치**: `src/os/entities/FocusTarget.ts` 및 `src/os/features/command/middleware/`

### 센티넬 컨텍스트
```typescript
// src/os/entities/FocusTarget.ts
export const OS = {
  FOCUS: Symbol.for("OS.FOCUS"), // 또는 unique string
  SELECTION: Symbol.for("OS.SELECTION")
} as const;
```

### 타입 정의
```typescript
// Command Payload Type
type TodoPayload = {
  id: number | typeof OS.FOCUS; // Union Type으로 명시
};

export const DeleteTodo = defineCommand<TodoPayload>({
  id: "DELETE_TODO",
  run: (state, payload) => {
     // Runtime에는 이미 number만 넘어옴 (Middleware가 보장)
     const targetId = payload.id as number;
     delete state.data.todos[targetId];
  }
});
```

### 해결 미들웨어
```typescript
const payloadResolver = (action: AnyAction) => {
  const nextPayload = { ...action.payload };
  
  if (nextPayload.id === OS.FOCUS) {
    const focusId = useFocusStore.getState().focusedItemId;
    if (!focusId) {
       console.warn("Operation aborted: No focus found.");
       return null; // 중단
    }
    nextPayload.id = Number(focusId);
  }
  
  return { ...action, payload: nextPayload };
}
```

## 4. 결론
이 방식은 **"명시성(Explicitness)"**과 **"순수성(Purity)"**을 모두 만족합니다.
- **Developer**: `OS.FOCUS`를 씀으로써 의도를 명확히 표현.
- **Debugger**: `OS.FOCUS`가 언제 `123`으로 변했는지 추적 가능.
- **Reducer**: 여전히 순수 데이터만 처리.

---
*Antigravity 아키텍처 보고서 (2026-02-03)*
