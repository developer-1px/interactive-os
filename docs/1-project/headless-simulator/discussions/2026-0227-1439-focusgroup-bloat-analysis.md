# FocusGroup 비대화 분석

## Journey

**🧑 사용자**: FocusGroup을 통로로만 쓰고 최대한 줄여보자고 했는데 500줄을 넘어가는 이유가 뭘까?

**🤖 AI**: 603줄 해부 → 17개 콜백이 4번 반복(Props, destructure, callbacksRef, buildZoneEntry) → ~120줄이 순수 배관. 원인은 "소유하지 않는 데이터를 중계하는 비용".

---

**🧑 사용자**: Zone이 커지는 건 이해하지만 FocusGroup은 delegate인데? ...props로 bypass하면 되지 않나?

**🤖 AI**: Zone→FocusGroup이 동일 17개 props의 거울 복사. 원인: FocusGroup이 "독립 사용"과 "위임 사용" 두 모드를 동시 지원하기 때문.

---

**🧑 사용자**: 원래 초기에는 각자 역할이 있었고 Zone이 퍼사드 개념으로 만들어졌는데... 히스토리가 이해돼?

**🤖 AI**: git log 추적 → 352줄→503줄(+43%) = `6455e9c`(Zone 분리)에서 등록 책임을 FocusGroup에 남긴 것이 기점. 이후 headless + push-based accessor가 누적.

---

**🧑 사용자**: Zone이 퍼사드인데 FocusGroup 없애면 Zone이 FocusGroup이 되어버리는 거 아냐?

**🤖 AI**: 합치는 게 아니라 "등록"이라는 책임을 FocusGroup에서 빼는 것. FocusGroup의 603줄 중 320줄(53%)이 등록+콜백중계 — FocusGroup 고유 책임 아님. 프로덕션 독립 사용 0건 확인.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | FocusGroup에서 등록·콜백중계를 Zone으로 이관. FocusGroup은 `role→config→context` 순수 변환기(~150줄)로 축소 |
| **📊 Data** | 603줄 중 320줄(53%)= 등록+콜백 중계. 프로덕션 독립 사용 0건. showcase 25건 = Zone으로 대체 가능 |
| **🔗 Warrant** | 17개 콜백×4회 반복 = rules.md #11 "복제본을 동기화하려는 순간이 물어야 하는 순간" |
| **📚 Backing** | Ports & Adapters (Cockburn) — React 컴포넌트(뷰)가 인프라 등록을 직접 수행하는 것은 어댑터 위반 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | showcase 25개 마이그레이션 필요. standalone FocusGroup 사용처 존재 (test/showcase only) |
| **❓ Open Gap** | 없음 — 독립 사용 0건으로 불확실성 해소 |
