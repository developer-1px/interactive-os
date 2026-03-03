# Trigger ARIA 책임 — 순수 투영 프리미티브로의 전환

> 2026-03-04 02:40 | /discussion → /go

---

## Journey

**🧑 사용자**: Trigger에 대하여 논의하자.

**🤖 AI**: ZIFT 스펙(Intent Bridge, 6개 ARIA 속성)과 실제 구현(614줄, Overlay lifecycle 전체 관장)의 괴리를 발견. Item/Field는 headless 순수 계산으로 ARIA를 투영하지만, Trigger는 React 컴포넌트에서 직접 `useComputed()`로 계산하는 비대칭 확인.

---

**🧑 사용자**: ARIA 속성을 다루는 건 누구 책임인가.

**🤖 AI**: 3계층 분산 확인 — ① OS 자동(tabIndex, aria-selected), ② Facade 자동(Trigger: haspopup/expanded/controls), ③ 앱 수동(aria-label). Item은 `computeItem` headless 순수 계산인데 Trigger만 React 직접 투영 → 비대칭이 핵심 문제.

---

**🧑 사용자**: 순수 계산이 정배인데 가능해?

**🤖 AI**: 3개 ARIA 전부 순수 계산 가능. `aria-expanded`는 이미 커널 상태(`overlays.stack`) 의존. 나머지 2개는 정적 메타데이터. 안 되는 이유는 "trigger-overlay 관계를 커널에 등록하는 경로가 없기 때문".

---

**🧑 사용자**: `createTrigger` 함수를 쓰자.

**🤖 AI**: `CompoundTriggerConfig`에 이미 `id`, `role` 존재. Todo 앱이 `createTrigger({ id, role: "alertdialog" })` 패턴 사용 중 — 일반화 가능. 선언적 등록 경로 확보 → headless 순수 계산 가능.

---

**🧑 사용자**: 전부 `createTrigger` 경유로. 문제 되는 부분은?

**🤖 AI**: P1) Trigger의 "렌더링 역할"은 React DOM 필수 — `createTrigger`가 대체 불가? P2) Popover 위치 종속. P3) Dialog vs Popover 메커니즘 차이.

---

**🧑 사용자**: Item처럼 bypass 100% 하면 되지.

**🤖 AI**: 맞다. Item은 "상태→ARIA 투영. 끝." 렌더링은 Item의 관심사가 아님. Trigger도 동일. Portal/Popover/Dismiss/outside-click은 Trigger가 아니라 OS 또는 별도 Overlay 프리미티브의 책임. P1~P3 전부 사라짐.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **Trigger = Item과 동격의 순수 투영 프리미티브.** overlay 메타데이터를 `createTrigger`로 커널에 등록하고, ARIA(`aria-haspopup`, `aria-expanded`, `aria-controls`)를 headless 순수 계산한다. 렌더링(Portal/Popover/Dismiss)은 Trigger의 책임이 아니라 OS/Overlay 프리미티브로 분리한다. |
| **📊 Data** | (1) Item은 `computeItem`으로 headless 순수 계산, Trigger만 React 직접 투영 — 비대칭. (2) `CompoundTriggerConfig`에 `id`, `role` 이미 존재. (3) Trigger.tsx 614줄 중 대부분은 렌더링 — Trigger의 관심사가 아님. (4) Trigger ARIA 3개 모두 순수 계산 가능. |
| **🔗 Warrant** | "상태에서 계산 가능한 것은 OS가, 도메인 의미는 앱이" — Pit of Success 원칙. Item이 증명한 패턴을 Trigger에 동일 적용. |
| **📚 Backing** | W3C WAI-ARIA 1.2 — Trigger 관련 6개 속성 모두 상태 기반 계산 가능. Interaction OS rules.md "100% Observable" 원칙. |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | 현재 동작하는 코드를 리팩토링하는 비용. Overlay 렌더링 프리미티브의 설계가 필요. |
| **❓ Open Gap** | "Overlay 프리미티브"의 구체적 API 설계. `createTrigger` 확장 시 기존 사용처(Todo, Carousel, APG) 마이그레이션 범위. |
