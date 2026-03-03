# Discussion: Zone의 initial 상태 — Config vs Command

> 2026-03-02T20:17 — 2026-03-02T20:43

## Journey

**🧑 사용자**: 아코디언/탭은 데이터가 없고, 트리/리스트는 아이템, 라디오는 필드. 이 구분에 대한 표준 개념을 논의하고 싶다.

**🤖 AI**: 3분류 제시 — Structure Zone(void), Collection Zone(T[]), Value Zone(T). Zone의 output contract.

---

**🧑 사용자**: 맞아. 근데 내부적으로는 구분 안 해. 탭도 on/off, 아코디언도 on/off. 전부 데이터로 처리해야 해.

**🤖 AI**: ZoneState.selection은 동형 — OS 내부에 구분 없음. 3분류는 앱↔OS 계약 경계에서만 발현. (W5, W6)

---

**🧑 사용자**: 그러면 앱에서 OS에게 탭을 열어달라는 API는?

**🤖 AI**: Usage spike 4개 시나리오. Config(초기) / User Command(런타임) / App Command(프로그래밍). 3계층 제시.

---

**🧑 사용자**: 초기 상태를 커맨드로 다루면 타이밍 지옥. 커맨드가 아닌 건 커맨드가 아닌 걸로 관리해야.

**🤖 AI**: 동의. OS_INIT_SELECTION은 "커맨드인 척하는 설정값". Config는 bind에 선언, 타이밍 없음.

---

**🧑 사용자**: 런타임 제어는 그냥 커맨드 하면 되지. 네 "런타임 제어"가 뭐야?

**🤖 AI**: 과잉이었음. **2계층으로 충분: Config(초기) + Command(런타임, 전부).** Clear.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **Zone 초기 상태는 Config(bind 선언), 런타임 변경은 Command. 2계층.** Config는 `bind({ initial: { selection, expanded } })`로 ZoneState 생성 시 포함. `OS_INIT_SELECTION`은 제거. |
| **📊 Data** | OS_INIT_SELECTION 타이밍 이슈 직접 경험 (os.setState 크래시 → OS_SELECT activeZoneId 미존재 → OS_INIT_SELECTION 우회) |
| **🔗 Warrant** | 사용자 의도 없는 초기화는 커맨드가 아니다. 커맨드는 런타임 의도. |
| **📚 Backing** | Declarative vs Imperative initialization (React 선언적 모델), Pit of Success (잘못 만들기가 더 어려운 구조) |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | bind()에서 initial을 받으면 Zone 재마운트 시 초기값 재적용 이슈 (idempotent 보장 필요) |
| **❓ Open Gap** | 없음 |
