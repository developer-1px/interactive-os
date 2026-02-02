# 분석: 'when' 조건의 실행 보장과 한계

## 1. 질문 배경
User 님의 핵심 질문:
> *"애초에 `when` 조건이 맞지 않으면 `run`이 아예 실행되지 않는 구조가 아닌가요?"*

즉, 시스템 레벨에서 `when`이 `false`이면 `dispatch` 자체가 막히므로, `run` 내부의 방어 로직(Guard)은 불필요한 죽은 코드(Dead Code)가 아닌지 묻는 날카로운 지적입니다.

## 2. 팩트 체크: 현재 시스템 구조
코드를 분석해본 결과, 대답은 **"아니오, 실행될 수 있습니다"** 입니다.
시스템은 철저하게 **Input Layer(입력)**와 **Execution Layer(실행)**로 분리되어 있습니다.

### A. Input Layer (Keybindings, UI) -> `Gated`
```typescript
// Component 또는 KeyListener 레벨
if (evalContext(cmd.when, context)) {
    dispatch(cmd.id); // 조건이 맞을 때만 dispatch 호출
}
```
*   OS(키보드 이벤트), 메뉴, 버튼 등 "정상적인 사용자 입력"은 이 계층을 통하므로 `when`이 보장됩니다.
*   User 님이 말씀하신 "구조적 차단"은 이 **껍데기(Shell)** 레벨에서만 유효합니다.

### B. Execution Layer (Store, Reducer) -> `Unguarded`
```typescript
// src/lib/command.tsx (createCommandStore)
dispatch: (action) => set((prev) => {
    const cmd = registry.get(action.type);
    
    // 🚨 중요: 여기서 'cmd.when'을 다시 체크하지 않습니다!
    // 그냥 레지스트리에서 찾아서 바로 run()을 때려버립니다.
    const nextInnerState = cmd.run(prev.state, action.payload);
    
    return { state: nextInnerState };
})
```
*   `store.dispatch`는 **Raw Command Runner**입니다.
*   누군가 `dispatch({ type: 'MOVE_FOCUS_UP' })`를 직접 호출하면, `when` 조건(예: `activeZone == 'sidebar'`)과 상관없이 무조건 실행됩니다.

## 3. `run`이 뚫릴 수 있는 시나리오
다음과 같은 상황에서 `when` 보호막 없이 `run`이 호출될 수 있습니다.

1.  **DevTools / Console**: 개발자 도구에서 디버깅을 위해 강제로 커맨드를 날릴 때 (`dispatch(...)`)
2.  **Test Environment**: 전체 UI나 Context를 띄우기 무거워서, 로직(`run`)만 임포트해서 단위 테스트를 돌릴 때
3.  **Complex Macros**: 여러 커맨드를 묶어서 실행하는 메타 커맨드가 내부적으로 하위 커맨드를 호출할 때
4.  **Race Condition**: `when`이 `true`여서 입력을 받았는데, 비동기 큐에 의해 `dispatch`가 처리되는 찰나의 순간에 상태가 변해버렸을 때

## 4. 결론: "Trust but Verify"
Antigravity 아키텍처 원칙에 따라:

*   **`when` (Context Guard)**: "이 문을 열 수 있는 자격증이 있는가?" (Permission/Trigger)
*   **`run` Guard (Data Guard)**: "이 문을 열고 들어가서 발을 디딜 땅이 있는가?" (Safety/Integrity)

따라서 **`run` 내부의 가드는 중복이 아니라, 시스템의 견고함(Robustness)을 위한 최후의 보루**입니다. 이를 제거하면 엔진의 안전성이 외부(UI) 구현에 의존하게 되므로, 유지보수성이 떨어집니다.

---
**추가 제안**:
만약 정말로 `run` 실행 시점에도 `when`을 강제하고 싶다면, `dispatch` 함수 내부에 `evalContext` 로직을 심을 수도 있습니다. 하지만 이는 퍼포먼스 오버헤드가 있고, Context 없는 Headless 실행을 어렵게 만드는 단점이 있어 권장되지 않는 패턴입니다.
