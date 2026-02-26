# Push-Based Item Discovery — Discussion

> 생성일: 2026-02-27 01:53

## Journey

**🧑 사용자**: headless하지 못하게 하는 레거시 OS 구현들을 전수조사하자. 특히 React 의존적인 것들.

**🤖 AI**: OS 코드 전수 grep 실행. 핵심 발견: `2-contexts/index.ts`의 아이템 발견 메커니즘이 `querySelectorAll("[data-item-id]")`에 전적으로 의존. Zone 등록(T1에서 해결)과 달리 아이템 발견은 여전히 DOM Pull.

---

**🧑 사용자**: 쟁점이 뭐야?

**🤖 AI**: 핵심 쟁점은 1개: Item Discovery Ownership. Thesis(DOM Pull) vs Antithesis(Push). 해소 전략 A(Push model), B(getItems 의무화), C(Hybrid) 제시. AI는 Hybrid 추천.

---

**🧑 사용자**: 우리는 모든 것을 push 기반으로 만들거야. 완전한 체질 개선 100%.

**🤖 AI**: Hybrid 기각. 100% Push 확정. 순서 보장, typeahead 라벨 등 DOM이 공짜로 주는 것들의 대체 방법이 Gap.

---

**🧑 사용자**: DOM_ITEMS와 DOM_RECTS는 context에서 제공하기로 했다. 이건 정당하다.

**🤖 AI**: 3계층 분리 확정: (1) 논리적 아이템(getItems push), (2) 물리적 아이템(DOM_ITEMS inject), (3) 위치(DOM_RECTS inject). sense 패턴과 일치.

---

**🧑 사용자**: renderToString에서 DOM을 parse해서 동일하게 시뮬레이션 구성.

**🤖 AI**: renderToString → HTML parse → data-item-id 추출 → DOM_ITEMS simulate. 브라우저와 동일한 inject 인터페이스. Clear 판정.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 아이템 발견을 Push 100%로 전환. 2-contexts의 querySelectorAll 전부 제거. DOM 정보(DOM_ITEMS, DOM_RECTS)는 context inject으로 격리. 브라우저=real DOM sense / headless=renderToString parse로 동일 인터페이스. |
| **📊 Data** | 2-contexts/index.ts에 querySelectorAll 6곳. headless-zone-registry T1/T2에서 Zone 등록은 push 전환 완료. createOsPage.goto()가 getItems inject으로 이미 headless 동작 중. |
| **🔗 Warrant** | rules.md #2: "코어는 어댑터 없이 테스트 가능(Headless)". rules.md #9: "OS 코드는 DOM을 직접 조작하지 않는다". sense 패턴은 DOM→데이터 변환이므로 정당. |
| **📚 Backing** | Hexagonal Architecture (Alistair Cockburn) — 코어가 먼저, 어댑터는 연결. Dependency Inversion — 고수준이 저수준에 의존하지 않고, 추상(inject 인터페이스)에 의존. |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | renderToString parse는 Rect 시뮬레이션의 정밀도가 낮음 — 2D 그리드 네비게이션 테스트 시 한계 가능. 하지만 1D 리스트/트리는 순서만으로 충분. |
| **❓ Open Gap** | DOM_ITEMS inject를 FocusGroup이 하는가 FocusItem이 하는가? ctx.inject 메커니즘의 구체적 API. |
