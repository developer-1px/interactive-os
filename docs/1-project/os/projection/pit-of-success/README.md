# Projection Pit of Success

> OS의 headless → DOM 투영 모델을 재설계하여, LLM이 ARIA/데이터를 빠뜨리거나 틀리게 쓸 수 없는 구조를 만든다.

## Why

현재 bind() API는 LLM이 entity를 직접 참조(`{todo.title}`)하고, ARIA를 수동으로 동기화해야 한다. LLM의 pre-trained habit으로 인해 ARIA 환각, 데이터 경로 이중화, 동기화 누락이 발생한다. headless test는 E2E 비용 절감이 목표인데, entity 데이터가 OS에 도달하지 않으면 검증 불가 → E2E가 여전히 필요.

## Summary

`item.field(name)` → unstyled component(data + ARIA 봉인) 반환. LLM은 배치+디자인만. entity scope 차단. Condition을 item-level로 확장하여 조건부 렌더링도 headless가 검증 가능.

### 불변 전제

- P1. headless = E2E 100% 대체
- P2. headless에서 renderToString 사용
- P3. React = 디자인 + 배치만
- P4. 프레임워크 소비자 = LLM

### Item Context API (세 축)

- `item.field(name)` — 보이는 것 (unstyled component 반환)
- `item.when(name)` — 보이냐 마냐 / 어떻게 보이냐 (boolean 반환)
- `item.trigger(name)` — 행동 (unstyled button 반환)

## Prior Art

- AG Grid: god-object props (`data` + `node` + `api`)
- Radix/Ark UI: data-attr auto-inject
- React Aria Components: render props for interaction state
- SwiftUI: compiler-enforced binding
- Redux: child self-resolve (anti-pattern for LLM)
