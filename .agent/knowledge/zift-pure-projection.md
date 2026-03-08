### Trigger는 순수 속성 투영(Prop-Getter)이다 (Action-Centric Event Delegation)

> Trigger는 렌더링 가능한 React 컴포넌트(`<Trigger asChild>`) 래퍼가 아니며, 어떠한 이벤트 핸들러(`onClick`)도 포함하지 않는 순수 식별자/상태 반환 함수(`zone.triggers.xxx()`)로 소비된다.

React의 '상향식(Bottom-up) 이벤트 처리 관성'을 벗어나, Stimulus JS와 같은 글로벌 위임 구조(Event Delegation)를 강제하기 위해 Trigger는 이벤트 관련 Props를 전혀 가지지 않는다. 오직 이벤트 감지의 "표적지" 역할만을 수행한다.

- **근거**: 컴포넌트에 `onClick`이나 렌더 사이클이 몰입되면 프레젠테이션(UI)과 행위(Action)가 강결합된다. 오직 `data-trigger-id` 이름표만 달면 OS Pipeline 레벨에서 일괄 SENSE, RESOLVE 하므로 중앙 집중적이고 견고한 구조(Pit of Success)가 완성된다.
- **위배 시**: 이벤트 제어권이 여러 하위 컴포넌트로 분산되어 레이스 컨디션 및 디버깅 불능에 빠지거나, Layer 1에서 전역 이벤트를 Intercept하기 어려워진다.
- **적용 예시**:
  ```tsx
  // BAD: 기존 컴포넌트 래핑
  <Trigger asChild><button onClick={...} /></Trigger>

  // GOOD: Action-Centric Spread (순수투영)
  <button {...zone.triggers.myAction()} className="..." />
  // => 반환 구조: { "data-trigger-id": "myAction_1", "aria-haspopup": "dialog", "aria-expanded": true }
  ```
