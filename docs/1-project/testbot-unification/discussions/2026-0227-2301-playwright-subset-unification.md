# TestBot 최종 진화 통합 — Playwright 서브셋 단일화

## Journey

**🧑 사용자**: 5개 세대(v1~v5)가 쌓였는데 최종 진화 통합을 어떻게 해야 할까?

**🤖 AI**: 5,653줄(v1~v3) vs 564줄(v5 POC). 2축 구조(headless/browser) 제안.

---

**🧑 사용자**: 지난 버전 제거 OK. 가장 진화된 1개만 남기고, 테스트 작성 일원화.

**🤖 AI**: "2엔진 1API" 제안. v1~v3 전량 retire. 4단계 퇴역 계획.

---

**🧑 사용자**: `bot.`보다 `page.`로 — Playwright interface와 동일하게. 실제 E2E에서도 돌아가도록.

**🤖 AI**: Playwright 네이밍 채택. `Page`, `Locator` 인터페이스.

---

**🧑 사용자**: Playwright naming 그대로가 LLM 친화적. 기존 이름 관성은 버려.

**🤖 AI**: W8 추가 — LLM 학습 데이터 최대 활용. `OsPage` → `Page`, `OsLocator` → `Locator`.

---

**🧑 사용자**: 100% Playwright 호환은 아냐 (v1 실패 반복). 하지만 우리가 쓰는 서브셋은 E2E에서 네이티브로 돌아가야 해.

**🤖 AI**: 핵심 역전 — v1은 Playwright→Browser shim (실패). 새 접근은 서브셋→Playwright 네이티브(shim 0줄). 6개 메서드만 구현.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Playwright 서브셋 6개 메서드(`locator`, `click`, `press`, `toHaveAttribute`, `toBeFocused`, `getAttribute`)를 공통 인터페이스로 정의. 3개 어댑터(headless/browser/Playwright native)가 구현. v1~v3은 전량 retire. |
| **📊 Data** | v1~v3 = 5,653줄, v5 POC = 564줄로 같은 기능 증명. 6개 소비자만 마이그레이션 필요. |
| **🔗 Warrant** | W9: "서브셋 ⊂ 상위집합" — 우리 테스트가 이미 유효한 Playwright 코드이므로 E2E shim 불필요. W8: Playwright naming = LLM 학습 비용 0. |
| **📚 Backing** | Adapter Pattern (GoF), POLA (Rules #6), "이름은 법이다" (Rules #9), "OS 위에서 OS 테스트" (Rules §검증 2) |
| **⚖️ Qualifier** | Clear |
| **⚡ Rebuttal** | 서브셋 확장 시 Playwright API와의 gap이 커질 수 있음. 당장은 6개로 충분하나, fill/type/drag 등 추가 시 인터페이스 설계 재검토 필요. |
| **❓ Open Gap** | 없음 |
