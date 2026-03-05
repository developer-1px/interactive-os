# DnD 회고 Discussion: OS gap과 파이프라인 개선

## Journey

**🧑 사용자**: 드래그앤 드롭 만드는 전 과정을 회고 하고 싶어

**🤖 AI**: 타임라인 정리 — 6단계 전부 PASS인데 브라우저에서 4개 버그. Testing Trophy 프레임 적용. 순수함수 테스트만으로는 OS 프리미티브 연결 보장 불가.

---

**🧑 사용자**: 고민인 부분은 드래그는 분명 os gap이긴 했어. 이걸 e2e로 잡기 않겠다고 만든게 우리 os란 말이지

**🤖 AI**: 재정의 — "브라우저에서 확인해야 했다 = OS 추상화가 부족했다." 4개 버그 중 3개가 OS gap. 문제는 파이프라인이 아니라 OS.

---

**🧑 사용자**: 우리는 os를 만드는거지 서비스를 만드는게 아냐. os gap이 발견되면 지금 하던걸 백로그에 두고 os 개선부터 하는게 맞아

**🤖 AI**: /go 원칙 재확인 — "모든 프로젝트의 목적은 앱의 완성이 아니라 OS의 완성." audit에 OS gap → feature Blocked 게이트 필요.

---

**🧑 사용자**: LLM이 os gap을 발견할 수 있나?

**🤖 AI**: 솔직한 자기 진단 — "LLM은 체크리스트 실행기. 새로운 gap 카테고리 발견은 사람의 몫. 발견된 gap의 재발 방지(체크리스트화)가 LLM의 몫."

---

**🧑 사용자**: audit가 공격적인가? bind test 단계는?

**🤖 AI**: audit grep 5개 중 이번 버그를 잡는 것 = 0개. "앱→브라우저"만 보고 "OS 내부 계약"은 안 봄. bind test는 headless 커맨드 시뮬레이션이 먼저.

---

**🧑 사용자**: audit는 누구보다 공격적이어야 해 0건이면 의심하도록

**🤖 AI**: OWASP 원칙 — "0건 = 체크리스트 부족 의심." Red Team 정체성 + R&R + 0건 규칙 반영.

---

**🧑 사용자**: retrospect의 사후 대책이 약해. MECE 액션아이템 추출을 강화하고 싶어

**🤖 AI**: KPT의 Try = "발견"이지 "반영"이 아님. Try → MECE 추출 → 반영 추적이 완전한 루프.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | DnD 파이프라인 실패의 근본 원인은 OS 추상화 gap이다. OS gap 발견 시 feature를 중단하고 OS 개선을 우선해야 하며, audit는 Red Team으로서 0건을 의심해야 한다. LLM은 체크리스트 실행기이며, 새로운 gap 카테고리 발견은 사람의 몫이다 |
| **📊 Data** | 4개 버그 중 3개 OS gap (onReorder void, Listener 충돌, drag-handle convention). audit grep 5개 중 이 버그를 잡는 것 = 0개 |
| **🔗 Warrant** | "브라우저에서 확인해야 했다 = OS 추상화 부족." 키보드는 headless test로 완전 검증 가능 — DnD도 같은 수준이어야 한다 |
| **📚 Backing** | Testing Trophy (Kent C. Dodds), OWASP Testing Guide "0 findings = insufficient testing", Gesture Recognizer 패턴 (Figma, VS Code) |
| **⚖️ Qualifier** | 🟡 Complicated — 방향은 잡혔으나 구체적 구현(PointerListener, headless DnD test) 필요 |
| **⚡ Rebuttal** | "앱이 os.dispatch를 호출하면 OS gap" 기준이 모든 상황에 맞는지는 추가 검증 필요 |
| **❓ Open Gap** | audit 카테고리 확장의 완전성 — 아직 발견 안 된 gap 카테고리가 있을 수 있음 |
