# Discussion: Focus/ARIA 테스트 전략 재정립

> 2026-02-20 10:12 ~ 10:22

## Journey

**🧑 사용자**: focus나 aria 테스트 전략을 다시 세우고 싶어

**🤖 AI**: 현재 3가지 계층(Unit, Headless Integration, Visual/E2E)이 있는데, 구체적 Pain Point는?

---

**🧑 사용자**: 테스트 개수도 많고 커버리지도 높은데 정작 APG 스펙을 충족하지 못하는건 발견할때마다 많아. 순수함수를 테스트하는게 무슨 의미인가 싶어서

**🤖 AI**: → **Goodhart's Law** 발견. 커버리지가 목표가 되면서 실제 품질(APG 준수)과 괴리. Source of Truth가 "코드 구현"이 아니라 "W3C APG 스펙"이어야 한다 (**Contract Testing**).

---

**🧑 사용자**: 우리는 DOM의 접점을 최소화 시켰어. Headless Kernel만으로 가능하지 않을까? 그러려고 커널과 OS를 올린건데?

**🤖 AI**: → **Functional Core / Imperative Shell** (Gary Bernhardt). Kernel이 Core이므로 APG 행동 계약은 Headless에서 검증 가능. DOM 프로젝션은 기계적 매핑이므로 스모크로 충분. 단, 전제: 프로젝션 버그로 APG 위반이 발생한 적이 있는가?

---

**🧑 사용자**: 그런 적 없어. DOM 접점이 매우 얇고 선언적이야. 시각화는 추후 별도 주제.

**🤖 AI**: 전제 검증 완료. Widget Pattern별(A) vs Capability별(B) vs App별(C) 테스트 조직?

---

**🧑 사용자**: A+B 둘 다. A 중심, B는 하위 호환성. A+B 갖춰지면 C로.

**한 줄 요약**: 순수함수 커버리지가 아닌 W3C APG 스펙 기반 Contract Testing으로 전환, Headless Kernel 계층에서 2-Layer(Widget Contract + Capability Regression) 구조.

---

## Conclusion

### Why
커버리지 지표(%)가 높아도 APG 스펙 위반이 반복 발견됨. 순수함수 단위 테스트는 구현 세부사항을 검증할 뿐, 사용자 행동 계약을 보장하지 않음.

### Intent
테스트의 Source of Truth를 코드 구현에서 W3C APG 스펙으로 전환하여, 커버리지가 아닌 행동 준수를 검증한다.

### Warrants
- W1. Unit만으로는 오케스트레이션 버그 발견 불가 (Delete→Focus Draft 사례)
- W2. **Goodhart's Law** — 커버리지 지표 ≠ 품질
- W3. **Contract Testing** — Source of Truth = W3C APG 스펙
- W4. **Functional Core / Imperative Shell** — Kernel이 Core이므로 Headless 검증 충분
- W5. DOM 프로젝션은 순수 매핑 — 프로젝션 버그 전례 없음
- W6. **Testing Trophy** — 사용 방식과 가까운 테스트일수록 높은 신뢰도
- W7. 2-Layer: Widget Contract(Top-Down) + Capability Regression(Bottom-Up)
- W8. 점진적 확장: A+B → C(App Integration)

**한 줄 요약**: APG 스펙이 테스트의 법이고, Headless Kernel이 법정이다.
