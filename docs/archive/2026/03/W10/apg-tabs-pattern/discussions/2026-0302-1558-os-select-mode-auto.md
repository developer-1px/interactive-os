# Discussion: OS_SELECT Mode Auto-Resolution

**🧑 사용자**: 탭 만들면서 어땠어? 상세 회고하자.

**🤖 AI**: 3번 연속 잘못된 원인을 짚음. `selectedItems` 추측, `useZoneContext()` 오용, `OS_ACTIVATE` manual-only 조건.

---

**🧑 사용자**: 반성이 아니라 장치 관점에서 보자. OS가 제공해야 하는 것.

**🤖 AI**: 3개 버그 중 2개는 "raw 접근이 가능해서" 발생. 1개는 기존 추상화가 새 유스케이스 미커버.

---

**🧑 사용자**: 만들어서 해결했는지 우회했는지 구분해봐.

**🤖 AI**: 5건 중 3건 ✅ 진짜 생성(Item.Content, contentRoleMap, disallowEmpty). 2건 🟡 우회(zoneName 직접 사용, OS_ACTIVATE if문).

---

**🧑 사용자**: SELECT건 ACTIVATE건 멀티와 싱글을 구분하는게 없어서 그런거 아냐?

**🤖 AI**: 핵심 발견. `Space → OS_SELECT({ mode: "toggle" })` — 키바인딩이 mode를 강제. zone이 single인지 multi인지 모름. 커맨드가 런타임에 보정.

---

**🧑 사용자**: activate = select이 탭만 아니라 전체 ARIA에서 맞나?

**🤖 AI**: 15개 role 전수 대조. OS_ACTIVATE select fallback은 모든 role에서 안전. 부작용 0건.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `OS_SELECT`의 mode를 optional로 만들고, 생략 시 zone config에서 자동 결정 (single→replace, multi→toggle). 키바인딩을 `Space → OS_SELECT()`로 변경. |
| **📊 Data** | 3개 버그 중 2개가 "키바인딩이 mode를 강제"하여 커맨드가 런타임 보정하는 구조에서 발생. OS_ACTIVATE select fallback은 15개 ARIA role 전수 대조에서 부작용 0건. |
| **🔗 Warrant** | mode를 zone config가 결정하면: (1) disallowEmpty 가드 불필요 (2) toggle 보정 불필요 (3) O(1) 확장 — role 추가해도 if문 안 늘어남 |
| **📚 Backing** | W3C APG: manual activation = explicit select. Pit of Success (rules.md): 잘못 만들기가 더 어려운 구조 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | 명시적 mode가 필요한 케이스(Shift+Click range select)에서는 mode를 계속 넘길 수 있어야 함. optional이면 양쪽 커버 |
| **❓ Open Gap** | 없음 |
