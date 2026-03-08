# Spec — action-centric-trigger

> 한 줄 요약: 무의미한 Trigger 컴포넌트 래퍼를 폐기하고 순수 속성 투영 방식의 action-centric 이벤트 위임을 도입한다.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 Action-Centric Spread
**Story**: OS 개발자로서, Trigger 컴포넌트 래퍼 없이 순수 객체 전개를 통해 이벤트 감지를 구성하기 원한다. 그래야 렌더링 오버헤드를 없애고 React 상향식 이벤트 종속에서 벗어나 파이프라인의 이벤트 감지 일관성(Pit of Success)을 달성할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. 개발자가 `button` 같은 Native 요소를 렌더링하면서 `...zone.triggers.myAction(id)` 를 spread한다.
2. 해당 속성이 주입되어 DOM에 렌더링된다. (이벤트 핸들러인 onClick 등은 전혀 주입되지 않는다)
3. 사용자가 해당 `button`을 클릭하면 `PointerListener`가 전역에서 이벤트를 감지하고 `resolveTriggerClick` 을 호출하여 명령을 디스패치한다.

**Scenarios (Given/When/Then):**

Scenario: 순수 데이터 속성 투영
  Given `const triggerProps = zone.triggers('id', onActivate)`을 호출했을 때
  When 반환값을 검사하면
  Then 결괏값은 `{ 'data-trigger-id': 'id', role: ..., 'aria-haspopup': ... }` 형태의 순수 객체여야 한다.
  And 결괏값 내부에 `onClick`, `onPointerDown` 같은 함수형 이벤트 프로퍼티가 없어야 한다.

Scenario: 글로벌 이벤트 기반 Trigger 발동
  Given DOM에 `<button data-trigger-id="test-trigger" />`가 렌더링되어 있고
  And OS Kernel Registry에 해당 ID의 `onActivate` 콜백이 등록(bind)되어 있을 때
  When 사용자가 해당 `<button>` 요소를 클릭(포인터 이벤트 감지)하면
  Then `PointerListener`에서 `senseClickTarget`이 이를 trigger로 인식하고
  And 커맨드가 정상적으로 파이프라인(dispatch)에 접수되어야 한다.

Scenario: 복합 Overlay (Compound) Trigger 투영
  Given `zone.overlay('menuId', { role: 'menu' })`를 통해 Trigger 객체를 생성했을 때
  When `Trigger` 컴포넌트를 사용하면
  Then 더 이상 자식에게 onClick 이벤트를 주입하지 않는다.
  And `data-trigger-id="menuId-trigger"` 와 `aria-haspopup="true"` 등의 ARIA 프로퍼티를 투영해야 한다.

## 2. 상태 인벤토리 (State Inventory)
- 본 태스크는 별개의 신규 Interaction 상태를 추가/수정하지 않음. 
- Trigger 활성/비활성 여부나 포커스, 선택, 오버레이 상태는 기존 OS 파이프라인 State 구조를 그대로 따른다.

## 3. 범위 밖 (Out of Scope)
- `<Item>` 이나 `<Field>` 등 다른 Zone 요소들을 Prop-getter 방식으로 전환하는 작업은 별도의 프로젝트(/bind 등)로 분리한다. 이번 스코프는 오로지 **Trigger**에 대한 순수 투영 도입에 한정한다.
