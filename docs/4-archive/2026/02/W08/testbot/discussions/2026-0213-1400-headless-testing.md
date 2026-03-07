# Journey

**🧑 사용자**: 우리 철학 맨처음에 rule에도 강력하게 여기서 개발해보는건 모두 OS의 개밥먹기라는거 그래서 OS를 이용해서 OS위에서 headless하게 테스트 코드를 만들어가고 했으면 좋겠거든?

**🤖 AI**: 좋은 접근이다. OS를 만들면서 외부 도구에 의존하는 건 자기부정이 될 수 있다.
그런데 "OS 위에서 headless하게"라는 게 구체적으로 어떤 레이어를 말하는 건가? `dispatch` 레벨인가, 아니면 가상 사용자(TestBot) 레벨인가? 그리고 OS로 OS를 테스트할 때 인프라 자체의 신뢰성은 어떻게 확보하나? (Bootstrap Problem)

**🧑 사용자**: 그건 필요없어 이걸로 만들 수 있다는것 자체가 OS의 증명이고 그건 내일이야

**🤖 AI**: 명쾌하다. "구축 가능성 자체가 증명"이라는 논리(Self-hosting Compiler)로 부트스트랩 딜레마를 해결했다.
그렇다면 내일 구현할 때는 Kernel 레벨부터 시작할까, 아니면 TestBot 레벨부터 시작할까?

**🧑 사용자**: 맞아 그 방식도 workflow화 할거야.

**🤖 AI**: 이 철학을 일회성이 아니라 `/test` 워크플로우로 강제하겠다는 뜻이군.
그럼 기존의 Playwright 기반 `/test`는 어떻게 되는 건가? 대체인가, 공존인가?

**🧑 사용자**: 확장하자 유닛(핸들러) 통합(커맨드) e2e(playwright+testBot)

**🤖 AI**: 완벽하다. 3단계 레이어(Unit/Integration/E2E)로 확장하고, 각 단계에 맞는 Dogfooding 레벨을 적용하자.

---
**한 줄 요약**: 사용자의 철학적 선언("OS로 OS를 테스트한다")에서 시작하여, 3단계 테스트 전략(Unit/Int/E2E)으로 구체화됨.

---
# Discussion: OS Dogfooding & Headless Testing Strategy

## Why
OS를 개발하는 프로젝트가 외부 도구(Playwright, Jest 등)에 전적으로 의존하는 것은 "우리 OS는 실제로 쓸 수 없다"고 고백하는 것과 같다. OS의 커널과 프리미티브(Command, Handler, State)가 충분히 강력하다면, 테스트 인프라 역시 그 위에서 구축될 수 있어야 한다.

## Intent
테스트 전략을 **OS Dogfooding** 철학에 맞춰 재정의한다. 외부 프레임워크는 렌더링 검증(E2E)에만 제한적으로 사용하고, 논리 검증(Unit/Integration)은 OS 자체의 Headless 런타임을 통해 수행한다. 이를 통해 OS의 성숙도를 증명하고 개발 프로세스 자체가 제품을 검증하는 순환 구조를 만든다.

## Warrants
1. **Self-Validation (자기 증명)**: OS를 만드는 프로젝트가 자기 OS를 사용하지 않으면, 그 유용성을 스스로 부정하는 모순에 빠진다.
2. **Headless Maturity (성숙도 지표)**: UI 없이 커널 위에서 로직을 완벽하게 검증할 수 있다는 것은, 비즈니스 로직과 뷰가 완벽하게 분리되었음을 증명한다.
3. **Construction is Proof (구축이 곧 증명)**: 별도의 메타 검증 없이, 테스트 런타임을 OS 위에서 구현해내는 과정 자체가 OS 커널의 강력함을 증명하는 행위다.
4. **Process as Product (프로세스의 제품화)**: 이 철학은 단순한 마음가짐이 아니라, 누구나 따를 수밖에 없는 워크플로우(`/test`)로 구체화되어야 한다.

## Architecture
테스트의 계층을 명확히 분리하고 각 레이어에 맞는 런타임을 정의한다.

1. **Unit Level (Handler)**
    - 대상: 개별 Command Handler
    - 런타임: **Pure TS / Headless Kernel**
    - 방식: 특정 커멘드 실행 시 상태 변화(State Mutation) 검증
2. **Integration Level (Command Flow)**
    - 대상: 여러 커멘드가 연쇄되는 시나리오 (Saga)
    - 런타임: **Headless Kernel (Virtual User)**
    - 방식: UI 렌더링 없이 커널 위에서 시나리오 실행 및 결과 상태 검증
3. **E2E Level (User Experience)**
    - 대상: 실제 브라우저 렌더링 및 사용자 인터랙션
    - 런타임: **Playwright + TestBot**
    - 방식: `TestBot` 컴포넌트가 브라우저 내에서 실제 OS API를 호출하며 시각적/기능적 정합성 검증

## Todo
- [ ] `/test` 워크플로우를 단순 Playwright 생성기에서 3단계(Unit/Int/E2E) 전략 생성기로 확장
- [ ] Headless Kernel Runtime 프로토타입 구현 (내일)
- [ ] TestBot을 활용한 E2E 테스트 패턴 정립

---
**한 줄 요약**: "OS를 테스트하는 가장 완벽한 방법은, OS 스스로가 테스터가 되는 것이다."
