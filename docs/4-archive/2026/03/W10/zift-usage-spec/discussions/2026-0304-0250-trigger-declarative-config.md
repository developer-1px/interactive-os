## Trigger Declarative Config — Discussion

### Journey

**🧑 사용자**: Trigger에 대하여 — ARIA 속성을 다루는 건 누구 책임인가?

**🤖 AI**: Zone/Item처럼 computeTrigger 순수 함수로 headless 계산 가능. TriggerBinding.overlay 메타데이터로 등록.

---

**🧑 사용자**: MenuButton을 createTrigger 경유로 바꾸자

**🤖 AI**: createCompoundTrigger 확장, MenuButtonPattern 마이그레이션 완료. 그러나 클릭/Enter/Space/ArrowDown 각각 개별 패치.

---

**🧑 사용자**: 하나씩 고치지 말고 큰 그림으로 고쳐봐

**🤖 AI**: MECE 분석 시도 → toolbar Zone 제거 + TriggerBase에 `if (overlayRole === "menu")` 분기 추가 제안

---

**🧑 사용자**: 니가 Zone처럼 축분리를 안하고 Trigger를 전부 분기로 구현하겠다고 생각하니까 이렇게 되는거야. 로직 트리를 그려서 Zone처럼 선언적으로 MECE가 가능하게 고민해봐

**🤖 AI**: Zone의 rolePreset(축 분리 Config)을 Trigger에도 적용: TriggerConfig = {open, focus, aria}. 프리셋 테이블.

---

**🧑 사용자**: resolveKeyboard는 의도만 전달하면 그만인거야. 정답을 알면서 왜 그래?

**🤖 AI**: 맞다. resolveKeyboard가 보내는 의도(OS_ACTIVATE, OS_NAVIGATE)는 이미 올바르다. Trigger는 수신 측에서 Config 조회로 해석.

---

**🧑 사용자**: Trigger를 우선하고 그 다음 Item Zone 순으로 처리. 현재 내가 어디 소속인지 확인하고 config 순으로 따르면서 없으면 위로 버블링

**🤖 AI**: **Field → Trigger → Item → Zone → Global** 체인 확정. 기존 resolveKeyboard 버블링 패턴과 동일.

---

### Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Trigger에 TriggerConfig (축 분리 프리셋) + resolveKeyboard Trigger layer 추가. 분기 0. |
| **📊 Data** | Zone rolePreset 구조(FocusGroupConfig 9축), resolveKeyboard 4-layer chain, resolveItemKey 패턴 |
| **🔗 Warrant** | Zone이 증명: 선언형 Config + 순수 해석 = MECE 조합, 새 role 추가 시 분기 0 |
| **📚 Backing** | W3C APG Menu Button spec, ZIFT Responder Chain 아키텍처 |
| **⚖️ Qualifier** | 🟡 Complicated |
| **⚡ Rebuttal** | Click 경로는 resolveKeyboard가 아닌 PointerListener → activate.onClick 메커니즘. 별도 통합 필요 |
| **❓ Open Gap** | Click → OS_ACTIVATE 변환을 어디서 처리할지 (Zone activate.onClick vs Trigger 자체) |
