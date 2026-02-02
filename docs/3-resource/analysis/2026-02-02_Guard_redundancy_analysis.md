# Guard vs. Trigger: `when`이 있는데도 `if` 가드가 필요한 이유

## 1. 질문 배경
User 님이 코드 리뷰 중 다음과 같은 질문을 주셨습니다:
> *"when이 있음에도 data type guard가 왜 또 필요한가요?"*

구체적으로 `todo_commands.ts`의 `MoveItemUp` 커맨드에서:
```typescript
when: Rule.and(
    Expect('activeZone').toBe('todoList'), // 이미 포커스가 리스트에 있음을 보장
    Expect('focusIndex').toBeGreaterThan(0)
),
run: (state) => {
    // 그런데 여기서 또 타입 체크를?
    if (typeof focusId !== 'number') return state; // Guard
    // ...
}
```

## 2. 분석 요약
이 중복은 의도된 **이중 안전장치(Defense in Depth)**이자, **TypeScript의 한계 보완**을 위한 필수적인 패턴입니다.

### 이유 1: 런타임 진입 경로의 다양성 (Runtime Safety)
`when` 조건은 **Interaction Layer(OS)**에서 커맨드를 "트리거할지 말지" 결정하는 **Gating Logic**입니다.
하지만 `run` 함수는 그 자체로 **순수한 로직 함수(Pure Function)**입니다. 이 함수는 OS(키보드)를 통하지 않고 실행될 수도 있습니다.

- **키보드 단축키**: OS가 `when`을 체크하고 `run`을 호출함 (안전)
- **마우스 클릭 / 컨텍스트 메뉴**: UI가 `when`을 체크하지 않고 직접 커맨드를 호출할 수도 있음 (잠재적 위험)
- **테스트 코드**: `run` 함수만 따로 떼어내어 유닛 테스트를 돌릴 때, `when` 컨텍스트 없이 호출될 수 있음

따라서 `run` 함수 내부는 외부의 보호(`when`)를 100% 신뢰하지 않고, **자신이 실행되기 위한 최소한의 데이터 무결성**을 스스로 검증해야 합니다. 이를 **Defensive Programming**이라고 합니다.

### 이유 2: TypeScript Type Narrowing (타입 좁히기)
TypeScript 컴파일러는 `when` 절과 `run` 절 사이의 논리적 연결을 완벽하게 추론하지 못합니다.

```typescript
// TS는 이 조건이...
when: Expect('focusIndex').toBeGreaterThan(0), // focusId가 number임을 함의하지만...

run: (state) => {
    // TS에게 "state.ui.focusId는 number야"라고 자동으로 알려주지 않습니다.
    // Pre-condition이 복잡해질수록 추론은 불가능해집니다.
    
    const id = state.ui.focusId; // 여전히 string | number | null
    
    // 따라서 아래와 같은 연산을 하려면 컴파일러를 안심시켜야 합니다.
    // id.toFixed() // Error!
    
    if (typeof id === 'number') {
         // 이제 TS는 id가 number임을 확신합니다.
    }
}
```

### 이유 3: Race Conditions & State Drift
드문 경우지만, 비동기 처리가 개입되거나 이벤트 루프의 미세한 차이로 인해, `when` 조건을 통과한 시점과 실제 `run`이 실행되는 시점 사이에 상태가 미세하게 변경될 가능성이 있습니다(특히 React의 Batch Update나 Concurrent Mode 등에서).
Logic 함수 내부의 Guard는 실행 **직전**의 상태(Snapshotted State)를 기준으로 판단하므로 가장 정확합니다.

## 3. 결론 및 제안
현재 구조는 올바른 **Antigravity Architectural Logic**을 따르고 있습니다.

1.  **OS Layer (`when`)**: "사용자가 이 기능을 **지금** 실행할 수 있는가?" (UX, Enable/Disable)
2.  **App Layer (`run` Guard)**: "이 로직을 실행하기에 데이터가 유효한가?" (Data Integrity, Crash Prevention)

이 두 가지는 서로 다른 목적을 가지므로, `when`이 있다고 해서 `run` 내부의 가드를 제거해서는 안 됩니다. 오히려 `run` 내부의 가드는 **Business Logic의 일부**로서 필수적입니다.
