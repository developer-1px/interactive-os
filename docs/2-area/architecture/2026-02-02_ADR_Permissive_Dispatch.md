# Architecture Debate: 왜 Dispatch는 `when` 조건을 강제하지 않는가?

## 1. 질문의 핵심
User 님의 질문은 Interaction Architecture의 가장 근본적인 딜레마를 관통합니다:
> *"when 조건이 안 맞으면 실행을 못하게 시스템 레벨에서 막아야 하는 것 아닌가?"*

즉, **"Strict Logic (엄격한 논리)"** vs **"Permissive Logic (허용적 논리)"** 사이의 설계 철학에 대한 질문입니다.
현재 시스템은 **Permissive Logic**을 채택하고 있으며, 그 이유는 다음과 같습니다.

## 2. 설계 철학: Headless & System Intent

### A. Context Availability (컨텍스트 유무)
`when` 조건은 대부분 **UI 상태(Context)**에 의존합니다.
- `activeZone == "sidebar"` (사용자가 사이드바를 보고 있는가?)
- `isDraftFocused == true` (인풋창에 커서가 있는가?)

하지만 **Command Engine**은 UI가 없는(Headless) 환경에서도 돌아가야 합니다.
- **백그라운드 동기화**: 서버에서 데이터를 받아와 `ADD_TODO`를 실행할 때, 화면이 꺼져있거나 포커스가 없어도 실행되어야 합니다.
- **초기화 스크립트**: 앱이 켜질 때 `SelectCategory`를 호출하여 기본값을 세팅해야 하는데, 이때는 아직 "Active Zone"이라는 개념이 확립되기 전일 수 있습니다.

만약 `dispatch`가 `when`을 강제한다면, **"시스템이 로직을 수행하려면 반드시 UI 흉내를 내야 하는"** 모순에 빠지게 됩니다.

### B. User Intent vs. System Intent
우리는 커맨드의 호출자를 두 가지로 나눕니다.

1.  **User Intent (사용자 의도)**: 키보드, 마우스 클릭 등.
    - **통제 필요**: 사용자는 바보 같은 짓을 할 수 있습니다(입력창에서 이동 키 누르기).
    - **해결책**: UI Layer(Keybinding, Button)에서 `when`을 체크하여 **진입 자체를 차단**합니다.
    - *"버튼이 비활성화(Disabled)되어 못 누름"*

2.  **System Intent (시스템 의도)**: 코드, 매크로, 테스트, 초기화 로직.
    - **신뢰**: 개발자가 코드로 `dispatch`를 호출했다면, 그것은 명확한 의도가 있는 것입니다.
    - **해결책**: `when`을 체크하지 않고 즉시 실행합니다. 다만, 데이터가 깨지지 않게 **최소한의 가드(`run` 내부 Guard)**만 수행합니다.
    - *"강제로 실행하지만, 데이터가 널(Null)이면 안전하게 리턴"*

## 3. 대안: Strict Mode 도입 가능성
만약 보안이 매우 중요하거나, 복잡한 상태 머신(State Machine)이라면 **Strict Dispatch**가 필요할 수 있습니다.

```typescript
// Strict Dispatch 예시
dispatch(action, force = false) {
    if (!force && !evalContext(cmd.when)) {
        throw new Error("Context Violation");
    }
    // ...
}
```
하지만 Todo 앱과 같은 "생산성 도구"에서는 유연성(Flexibility)과 반응성(Responsiveness)이 더 중요하므로, 기본적으로는 **Permissive**하게 설계하고, UI Layer에서 엄격하게 필터링하는 방식을 택했습니다.

## 4. 결론
> **"UI는 깐깐하게(Gatekeeper), 엔진은 유연하게(Workhorse)"**

이것이 현재 아키텍처의 핵심 원칙입니다.
`when`은 "사용자가 지금 버튼을 눌러도 되는가?"를 판단하는 **UX 규칙**이고,
`run` 내부 가드는 "이 코드가 실행되어도 뻗지 않는가?"를 판단하는 **안전 규칙**입니다.
이 두 역할(Role)을 분리함으로써, 우리는 UI가 없는 CLI, 백엔드, 혹은 테스트 환경에서도 똑같은 엔진 코드를 재사용할 수 있게 됩니다.
