# Discussion: Trigger → Pure Projection (Prop-Getter)

> Date: 2026-03-08
> Status: Concluded
> Next: /go — 구현

---

## 결론

**`<Trigger>` React 컴포넌트를 제거하고, prop-getter 함수로 대체한다.** Overlay는 별개 관심사로 분리한다.

```tsx
// Before
<TodoList.triggers.DeleteTodo>
  <button>삭제</button>
</TodoList.triggers.DeleteTodo>

// After
<button {...TodoList.triggers.deleteTodo(todoId)}>삭제</button>
```

---

## 확정된 원칙 (Knowledge)

### K1. Trigger는 선언(data-attributes)이지 컴포넌트(lifecycle)가 아니다
Trigger의 본질적 책임(id 태깅 + 콜백 등록)에 React 라이프사이클이 필요하지 않다.

### K2. Trigger(포인터)와 Focus(키보드)는 독립 축이다
키보드는 focus를 통해 대상을 결정하고, 포인터는 직접 가리킨다. 이 둘은 별도의 입력 채널.

### K3. Trigger의 대상은 payload(optional string ID)로 결정된다
`(focusId) => BaseCommand` 시그니처는 focus에 의존하는 설계 부채. payload로 명시적 바인딩.

### K4. 직렬화 경계는 Command 출력이지 Trigger 입력이 아니다
Pipeline의 직렬화 계약은 Command에 적용. Trigger는 입력 메커니즘으로, KeyboardEvent와 동급.

### K5. 1 trigger = 1 intent = 1 command
payload = who(대상), trigger name = what(행동). 복합 인자가 필요하면 trigger를 분리한다.

### K6. Trigger에 클로저를 전달하지 않는다
함수 자체는 무상태이지만, Pipeline이 클릭 시 찾을 수 있는 보관소에 넣는 행위에 라이프사이클이 생긴다.

### K7. Trigger는 신호다. 동적 데이터는 커맨드가 OS 상태에서 읽는다
defineApp으로 선언한 모든 데이터를 OS가 이미 알고 있다. 커맨드 핸들러가 상태에서 읽으면 된다.

### K8. Trigger와 Overlay는 관심사가 다르다. 완전히 분리한다
TriggerBase.tsx에 합쳐져 있던 두 관심사를 분리. Pipeline(PointerListener)도 이미 분리 처리 중.

---

## 구현 방향

### 변경 대상
1. `trigger.ts` — `createFunctionTrigger`가 `(payload?: string) => data-attributes` 반환
2. `senseMouse.ts` — `data-trigger-payload` 읽기 추가
3. `PointerListener.tsx` — `simple-trigger` 경로에서 payload → handler 전달
4. `TriggerBase.tsx` — Function Trigger 로직 제거 가능 (Overlay 로직은 별도 관리)

### 변경하지 않는 것
- Overlay (Dialog/Menu/Popover) — 별개 프로젝트
- Zone, Item, Field — 현재 scope 아님
