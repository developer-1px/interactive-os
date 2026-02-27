# Headless Simulator Vision

## Journey

**🧑 사용자**: focus e2e 테스트 전부 다 깨지고 있어.

**🤖 AI**: Playwright e2e 25/29 실패 확인. `270a7c7` (push-based item discovery 커밋)이 범인. Phase 1(useMemo) 재실행 시 Phase 2(useLayoutEffect)의 getItems를 덮어쓰는 라이프사이클 불일치.

---

**🧑 사용자**: 수정하지말고 현상 분석까지만 해. 하고 싶은건 수정이 아냐.

**🤖 AI**: 근본 원인 = Phase 1/2 의존성 배열 불일치. Phase 1(15+ deps)이 재실행되면 Phase 2(groupId only)의 등록을 덮어씀.

---

**🧑 사용자**: 핵심 쟁점은 e2e에서는 검증 가능한데 vitest에서는 못한다. headless OS의 목적을 달성하지 못하고 있다는 증거다.

**🤖 AI**: 거짓 GREEN — vitest는 "0 regression" 판정, Playwright는 25 failures. createOsPage가 FocusGroup 라이프사이클을 우회하므로 원리적으로 감지 불가.

---

**🧑 사용자**: testing-library를 안 쓰는 게 우리의 목적. why: e2e는 LLM에 불편, vitest만으론 거짓 GREEN. goal: vitest에서 Playwright에 준하는 시뮬레이터. DOM → VDOM(OS)으로 치환. how: ?

**🤖 AI**: 3가지 방향 제시. B(OS Projection 계산기)가 가장 OS답다.

---

**🧑 사용자**: TestPage 레이어에서 해결. DOM 의존적인 부분을 더 얇게 떠야 한다. 깨진 e2e를 모사하는 vitest가 이번 프로젝트 목표.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Vitest에서 Playwright 수준 검증을 달성하려면 OS가 DOM 없이 투영(projection)을 계산할 수 있어야 한다. 현재 깨진 e2e를 vitest로 재현하는 것이 첫 번째 증명 |
| **📊 Data** | Playwright 25/29 FAIL, Vitest 0 regression (거짓 GREEN). Phase 1/2 라이프사이클 불일치는 createOsPage가 원리적으로 감지 불가 |
| **🔗 Warrant** | createOsPage는 React 컴포넌트 라이프사이클을 우회 → 투영 축 미검증. OS VDOM(가칭)이 있으면 React 없이 attrs 계산 가능 |
| **📚 Backing** | Hexagonal Architecture — core(OS)는 adapter(React) 없이 테스트 가능해야. Rules #2 "이 OS 위에서 이 OS를 테스트한다" |
| **⚖️ Qualifier** | 🔴 Complex — How 미확정. 장기 프로젝트 |
| **⚡ Rebuttal** | FocusItem의 attrs 로직이 복잡 (role 추론, expandable 결정 등). 전부 순수 함수화 시 중복 관리 비용. DOM 레이어를 "얇게 뜨는" 정도에 따라 난이도 상이 |
| **❓ Open Gap** | 1. OS VDOM의 구체적 형태? 2. FocusItem attrs를 어디까지 OS로 올릴 것인가? 3. 깨진 e2e 25개를 vitest로 재현하는 구체적 방법? |
