# Auto-Diagnostics on Test Failure

> Date: 2026-03-03

## Journey

**🧑 사용자**: 내가 놓치고 있는게 뭘까?

**🤖 AI**: Consumer AI가 os-sdk를 사용하는 경로가 없다 (오판).

---

**🧑 사용자**: os-sdk가 Consumer surface다. 700줄 Framework 수준이 올바른 추상화.

**🤖 AI**: (수정) 목표 = "AI + OS > AI alone". 10줄 마법이 아니라, 같은 700줄이라도 OS 위에서 쓰면 더 나은 앱.

---

**🧑 사용자**: skills + llm.txt 배포. 단, OS는 스스로 관찰 가능해야. 관찰을 통한 자가복구.

**🤖 AI**: MAPE-K 모델. 현재 관찰 도구(Inspector, TestBot)는 인간용. AI 소비 경로 부재.

---

**🧑 사용자**: headless 개념을 봐.

**🤖 AI**: headless brain = 테스트 도구가 아닌 "진실의 엔진". computeItem()이 DOM 없이 정답을 항상 계산. 자가관찰의 아키텍처적 전제조건이 이미 구현됨.

---

**🧑 사용자**: AI가 이슈 재현 테스트를 쓰고, 자동 로그를 보고, 스스로 해결하는 그림.

**🤖 AI**: TDD 자율 루프. headless이기 때문에 가능. 빠진 것 = "AI가 읽을 수 있는 자동 진단 출력".

---

**🧑 사용자**: AI가 이걸 활용을 거의 못해.

**🤖 AI**: Pre-trained Habit. 진단 API가 있어도 AI는 호출 안 함. Pull → Push 전환 필요. Pit of Success 원칙이 진단에 미적용.

---

**🧑 사용자**: 최소 경로 + diff 스키마 역추적은?

**🤖 AI**: changes[].path가 도메인을 내포 → 별도 분류기 없이 schema 구조 자체가 필터. Δ none이 가장 강한 signal.

---

**🧑 사용자**: 그건 이미 있어. 자동으로 출력하게 하는 게 문제야.

**🤖 AI**: onTestFailed (vitest) + dumpDiagnostics() 이미 4개 파일에서 검증. createAppPage()에 내장하면 테스트 파일 수정 0.

---

**🧑 사용자**: noise와 딱 필요한 만큼, 이게 어려운 거지?

**🤖 AI**: OS의 유한한 계약 구조가 noise 문제를 풀 수 있는 고유 강점. Simple(last N tx) → Smart(계약 기반) 점진 접근.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `createAppPage()`에 `onTestFailed` 자동 등록 + `dumpDiagnostics()`를 "최소 경로 + Δ none + schema path 필터 + zone snapshot"으로 강화하면, 새 인프라 0으로 AI 자율 진단 루프가 완성된다 |
| **📊 Data** | onTestFailed + dumpDiagnostics가 docs-viewer 4개 파일에서 이미 검증됨. Transaction[].changes[].path가 도메인을 내포. createAppPage()가 모든 OS 테스트의 유일한 진입점 |
| **🔗 Warrant** | Pit of Success = 올바른 것이 기본값. Push > Pull for AI. Schema path = 자동 noise 필터 |
| **📚 Backing** | IBM MAPE-K (2001), Pit of Success (Rico Mariani), Zero Drift (프로젝트 고유 원칙) |
| **⚖️ Qualifier** | Clear |
| **⚡ Rebuttal** | onTestFailed가 vitest 글로벌로 접근 가능한지 환경 확인 필요. 이중 등록 방지 (docs-viewer 기존 수동 등록 제거) |
| **❓ Open Gap** | 2단계(Smart 진단 — 계약 기반 hint)는 Simple 적용 후 패턴을 보고 설계 |
