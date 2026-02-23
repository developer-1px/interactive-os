# Discussion: DOM_ITEMS 해석 아키텍처

## Journey

**🧑 사용자**: state monitor에서 state 변화가 없을때 반영이 안 되고 있어.

**🤖 AI**: `useComputed`가 state 변화에만 반응. rAF polling 제안.

**🧑 사용자**: rAF 반대야. 커맨드가 있는 input 단위로 기록하도록.

**🤖 AI**: inspector port에 subscribeTransactions 추가 제안.

**🧑 사용자**: 왜 그렇게 하고 싶은지 말해봐.

**🤖 AI**: 데이터 생산지에서 알림이 나와야 한다고 생각. 하지만 inspector 밖에서도 관찰 가능.

**🧑 사용자**: 그게 책임에 부합해?

**🤖 AI**: 안 부합. 기록 주체의 책임. inspector port 확장이 정답.

**🧑 사용자**: 설계에서 제일 신경써야 하는게 뭐지?

**🤖 AI**: **엔트로피.** subscribeTransactions는 새 패턴. 기존 notify() 재사용이면 0개 추가.

**🧑 사용자**: 인스펙터가 본체 성능에 영향 미치면 안돼.

**🤖 AI**: useSyncExternalStore dedup으로 비용 ≈ 0. processCommand 끝에 notify() 1줄.

---

**🧑 사용자**: 빌더에서 ArrowDown이 안 돼. (Inspector 로그 제공)

**🤖 AI**: getItems가 root blocks만 반환. itemFilter가 DOM data-level 읽음. tree에서 0개 → early return.

**🧑 사용자**: headless로 가는 결정이 잘못된 걸까? 의심을 해볼래?

**🤖 AI**: DOM_ITEMS는 "렌더된 것 = 네비게이션 대상" 자동 동기. accessor는 뷰 로직 재구현 필요.

**🧑 사용자**: 기존 방식을 변경하는 선택지가 있으면 더 나은 선택 가능해?

---

**🧑 사용자**: headless는 DOM과 무관하게 데이터 구조를 만들고 DOM은 투영만 할뿐이야.

**🤖 AI**: data-level은 tree depth의 투영. 원본은 state의 tree 구조.

**🧑 사용자**: LLM이 스스로 브라우저 없이도 재현 가능해야 해.

**🧑 사용자**: 우리가 찾은 해법이 createPage였어. renderToString으로 DOM_ITEMS 확인 가능.

**🧑 사용자**: renderToString이 정석이고 없는게 특수한 경우야?

**🤖 AI**: 둘 다 정석인데 레벨이 다름. Unit: pure headless(getItems). Integration: headless+React(renderToString).

---

## Conclusion

### Why
commands가 DOM_ITEMS context를 DI로 받으면서도, getItems?.()를 직접 호출하는 이중 경로가 있었음. getItems는 뷰 로직을 state에서 재구현하려는 시도인데, flat에서는 OK, tree에서는 깨짐.

### Intent
DOM_ITEMS context라는 기존 DI 메커니즘을 올바르게 사용. commands는 inject만. provider가 환경에 따라 해석.

### Warrants
- W1. DI를 쓰면서 DI를 안 쓰는 건 설계 모순
- W2. 혼합의 우아함 = 결정이 provider에 캡슐화됨
- W3. DOM_RECT은 본질적 view concern — mock 수용
- W4. DOM_ITEMS(존재 여부)는 데이터 concern이어야 하되, React rendering이 최종 결정자
- W5. renderToString = headless에서 React 렌더 결과 확보 가능
- W6. Unit(getItems)과 Integration(renderToString)은 다른 레벨의 정석

### 한 줄 요약
**commands는 DOM_ITEMS를 inject만 하고, provider가 환경(browser/headless+React/pure headless)에 따라 해석한다.**
