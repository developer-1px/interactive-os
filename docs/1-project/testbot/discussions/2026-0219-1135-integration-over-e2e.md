# Discussion: 에이전트 개발 루프에서 E2E 대신 통합 테스트

## Journey

**🧑 사용자**: 너는 네가 개발하면서 e2e가 아닌 통합테스트로 분석하거나 만들 수 없을까? 우리의 OS가 그러기 위해 만든건데?

**🤖 AI**: OS의 Headless Kernel은 DOM 없이 커맨드→상태 변화를 증명할 수 있도록 설계되어 있다. 현재 `createTestKernel`(OS 통합)과 `defineApp.testInstance`(앱 유닛) 두 인프라가 존재하지만, OS×App 수직 통합 테스트가 없다. 에이전트가 E2E에 의존하는 것은 rules.md Rule 6("가장 빠른 피드백부터")을 위반하고 있다.

---

**🧑 사용자**: 맞아. e2e가 필요한건 내가 눈으로 확인이 필요해서야. 너는 개발할때 e2e가 아니라 통합테스트로 검증했으면 좋겠어. 유닛테스트는 빵빵하지만 늘 요구사항이 제대로 만들어지지 못하고 하위 호환성 보장도 안되고 있고

**🤖 AI**: 유닛 테스트는 핸들러 메카닉을 검증하지만, 요구사항(시나리오)은 검증하지 못한다. 예: `deleteTodo`가 상태를 바꾸는 것과 "삭제 후 focus가 이웃으로 이동하는 것"은 다른 수준. 이 Gap에 통합 테스트가 들어가야 한다. 시나리오 서술 단위로 Option A(OS 커맨드 직접)와 Option B(유저 행동 시뮬레이션) 제안.

---

**🧑 사용자**: 원래는 B이고 싶었어 그렇게 만드니 e2e랑 뭐가 다르냐라고 하더라고

**🤖 AI**: 그 반론은 핵심을 놓쳤다. 차이는 "무엇을 테스트하느냐"가 아니라 "무엇을 빼느냐"다. 같은 시나리오, DOM/브라우저/React 제거, 1000x 빠름. Martin Fowler의 **Subcutaneous Test** 패턴이 정확히 이것. 올바른 답은 "Option B의 API + Option A의 구현" — Intent 서술(`t.activate()`) + OS 커맨드 dispatch.

---

**🧑 사용자**: 테스트 봇은 나중에 일단 전통적인 통합테스트 방식으로 테스트 해보자. 다만 OS 레벨에서

**🤖 AI**: Clear 판정. `createTestKernel` 패턴으로 OS 레벨 통합 테스트 확장. 현재 FOCUS, TAB만 있고 NAVIGATE, ESCAPE, CLIPBOARD 등이 빠져있다.

---

**🧑 사용자**: 그래서 뭘 먼저 통합 테스트를 해볼건데?

**🤖 AI**: NAVIGATE가 1번. 가장 많이 쓰이고, 가장 복잡하고, 최근 followFocus 버그가 여기서 났다. 통합 테스트가 있었으면 밀리초 만에 잡혔을 것.

---

> 한 줄 요약: TestBot은 나중에, 지금은 `createTestKernel`로 NAVIGATE부터 전통적 OS 통합 테스트를 확장한다.

---

## Conclusion

### Why
에이전트(AI)가 기능 개발 시 E2E에 의존하면 피드백 루프가 느리고, 유닛 테스트만으로는 요구사항 수준의 검증과 하위 호환성 보장이 안 된다.

### Intent
OS Headless Kernel 기반 통합 테스트를 에이전트의 기본 개발/검증 루프로 채택하여, 밀리초 단위로 요구사항을 증명한다.

### Warrants
- W1. OS Headless Kernel은 DOM 없이 커맨드→상태를 순수하게 증명 가능
- W2. rules.md Rule 6: "가장 빠른 피드백부터" — 현재 에이전트가 위반 중
- W3. Goal 10: "이 OS 위에서 이 OS를 만든다" — Dogfooding
- W4. `/test` 워크플로우 Level 2 정의는 있으나 실제 구현 부재
- W5. 유닛 = 메카닉 검증, 통합 = 요구사항(시나리오) 검증 — 다른 수준
- W6. ZoneBindings가 선언적이므로 headless 바인딩 재생 가능 (미래 TestBot에서 활용)
- W7. 하위 호환성 감지가 현재 E2E뿐 → 피드백 느림
- W8. Subcutaneous Test (Fowler): UI 바로 아래를 잘라 같은 시나리오를 UI 없이 검증
- W9. "무엇을 테스트하느냐"가 아니라 "무엇을 빼느냐"가 E2E와의 차이
- W10. TestBot Intent API는 별도 프로젝트로 분리, 지금은 전통적 방식 우선
- W11. NAVIGATE의 followFocus 버그가 최근 실제 발생 — 통합 테스트 첫 ROI 증거

### 결정
1. `createTestKernel` 기반 전통적 통합 테스트를 OS 커맨드 레벨에서 확장
2. 우선순위: NAVIGATE → NAVIGATE+SELECT → ESCAPE → FIELD
3. TestBot(Intent API)은 나중에 별도 프로젝트로
4. E2E는 "사용자의 눈" 역할로 유지

> 한 줄 요약: **유닛은 메카닉, E2E는 눈 — 그 사이의 "요구사항 증명"을 OS Headless 통합 테스트가 채운다.**
