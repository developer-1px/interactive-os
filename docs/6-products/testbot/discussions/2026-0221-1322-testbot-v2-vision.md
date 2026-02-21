# TestBot v2 Vision — Discussion Journey

## Journey

**🧑 사용자**: 테스트봇을 다시 리뉴얼 고도화 할 시간이 왔어

**🤖 AI**: 현황 분석. TestBot v1은 Playwright Shim 기반, Todo 12/12 PASS, Playground 0/63. 아카이브 후 2주간 시스템 크게 진화. "리뉴얼 고도화"의 범위와 동기는?

---

**🧑 사용자**: 테스트봇2를 만들어야 하나? OS로만 동작하는걸 재현하는식으로 우리 OS에는 press click mousedown 등 최소한의 동작이 있는데 이걸 시각화 하고 실제로 반영하도록 하면 e2e는 아닌데 e2e에 준하는 검증도 가능하면서 시각화도 가능하다고 생각해

**🤖 AI**: 핵심 발견 — `createTestOsKernel`에 이미 `pressKey/click/attrs` 프리미티브가 headless로 존재. 이것을 브라우저에서 시각적으로 실행하면 TestBot v2의 엔진이 된다. Playwright Shim(40KB+)이 불필요해짐.

---

**🧑 사용자**: vitest의 코드를 그대로 활용하는데 시각화 + DOM 검증이 더해진다면 충분해. e2e를 안하겠다는건 아니니까

**🤖 AI**: 테스팅 피라미드 정리. TestBot v2 = Vitest 코드 그대로 + 시각화 + DOM 검증. Playwright E2E는 별도 유지.

---

**🧑 사용자**: playwright 테스트봇도 만든게 있으니 굳이 버리지는 않을건데 모든 테스트는 통합테스트 중심으로 특히 event(keyboard, mouse)를 시작으로 하는 테스트를 늘릴거야 지금은 dispatch위주

**🤖 AI**: 테스트 시작점 전환 인식. dispatch [4] → event [1]로 올리고, 도달점을 state [5] → DOM [7]로 내리면 전 파이프라인 커버.

---

**🧑 사용자**: 테스트 전용 페이지를 따로 둘거야 본 앱에서는 e2e를 해야지. 아니다. state를 강제 주입하도록 하면 되겠네 어차피 os와 app의 데이터 구조는 같도록 만들테니

**🤖 AI**: State Injection = setup 문제 해결. `kernel.setState(fixture)` 하나로 OS+앱 상태를 동시 주입. 별도 test page 불필요.

---

**🧑 사용자**: 테스트봇을 위해서 하는건 없어. 어디까지나 LLM은 vitest를 이용해서 개발한다. 이건 LLM이 테스트를 잘 만들었나 확인하는 인간의 용도요. 코드만으로는 제대로 만들었는지 따라가기가 너무 어려워

**🤖 AI**: **핵심 전환점**. TestBot v2는 "테스트 러너"가 아니라 "인간의 시각적 검증 도구"다. LLM의 개발 흐름에 무개입. vitest PASS만으로는 인간이 신뢰할 수 없을 때, 눈으로 확인하는 도구.

---

**🧑 사용자**: 이 논의는 진짜 너무 자주 하는데 /product 에 테스트봇을 올리자 How는 모르겠지만 비전은 안바뀔거야. LLM이 만든 테스트를 시각적으로 검증하는 도구

**한 줄 요약**: 비전은 확정됐다. 매번 재논의하지 말고 product에 박아라.

---

## Conclusion

### Why
코드만으로는 LLM이 작성한 테스트가 진짜 의미 있는지 인간이 따라가기 어렵다.

### Intent
LLM이 만든 vitest 테스트를 브라우저에서 시각적으로 재생하여, 인간이 눈으로 "맞다/아니다"를 판단하는 도구를 만든다.

### Warrants
- W1. Visual Verification (커서, 버블, 스탬프)은 불변 — 어떤 아키텍처든 유지
- W2. LLM이 작성, 인간이 검증 — 역할 분리가 핵심
- W3. vitest 코드가 유일한 원본 — TestBot을 위한 별도 코드 없음
- W4. OS 시그널(pressKey/click/attrs) 기반 — Playwright Shim 아닌 자체 파이프라인
- W5. Event 시작점 — dispatch가 아니라 DOM Event부터
- W6. State Injection — `kernel.setState(fixture)`로 setup
- W7. DOM 교차 검증 — headless가 놓치는 렌더링 갭 보완
- W8. "이 OS 위에서 이 OS를 테스트한다" (rules.md 검증 #2)
- W9. 기존 Playwright TestBot과 E2E는 별도 유지
- W10. How는 바뀔 수 있지만, 비전은 안 바뀐다 — product에 박는 이유

**한 줄 요약**: TestBot은 LLM이 만든 테스트를 인간이 시각적으로 검증하는 도구이며, 이 비전은 구현 방식이 바뀌어도 불변이다.
