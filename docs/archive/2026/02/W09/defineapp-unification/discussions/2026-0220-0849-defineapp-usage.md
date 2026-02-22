# defineApp Usage 일원화 — Discussion

## Journey

**🧑 사용자**: defineApp의 사용법과 usage에 대해서 일원화하고 싶어.

**🤖 AI**: 현재 Todo와 Builder 앱의 defineApp 소비 패턴을 비교 분석. 6가지 비일관성 발견 (Undo 소속, 핸들러 타입, Export 패턴, useComputed 캐스팅, kernel 직접 참조, collection 패턴).

**🧑 사용자**: 소비 패턴이 다르다는 것 자체가 API 설계가 에이전트에게 비효율적이라는 의미야.

**🤖 AI**: "Pit of Success" 원칙 부재로 진단. API가 레일을 제공하지 않아 에이전트가 매번 동일 판단을 반복.

---

**🧑 사용자**: 원칙의 부재는 rules에 항상 추가. 더 없니?

**🤖 AI**: 8개 학문적 원칙을 기존 rules에 부연으로 추가: Pit of Success, Make Illegal States Unrepresentable, POLA, Hollywood Principle, SRP, CQS, Ubiquitous Language, Convention over Configuration.

---

**🧑 사용자**: 우리 컨셉은 headless야. 로직 먼저고 뷰는 바인딩하면 되는 방식.

**🤖 AI**: Hexagonal Architecture (Ports & Adapters)로 명명. Project #1로 rules.md 최상단에 추가. 이 원칙으로 Complicated → Clear로 전환되는 문제들 확인.

---

**🧑 사용자**: Zone Item Trigger Field를 직접 쓰는 패턴에 /doubt.

**🤖 AI**: Zone/Item/Field는 `bind()` 경유 ✅, **Trigger만 OS 원시 직접 import** ❌. bind()가 Trigger를 반환하지 않는 것이 근본 원인.

**🧑 사용자**: Item에 onPress 넣으면 Trigger 존재 이유가 사라지는데?

**🤖 AI**: Item = 존재(identity), Trigger = 행동(action). 합치면 SRP 위반. Item 안에 Trigger 여럿 필요한 케이스(TaskItem 5개 버튼) 증명.

---

**🧑 사용자**: bind가 Trigger 반환하면 다 해결돼? createTrigger의 최초 논의가 왜였지?

**🤖 AI**: bind() → Trigger만으로 부족. 뷰가 커맨드 팩토리를 여전히 알아야 함. createTrigger의 Dynamic overload가 이미 존재하지만 `payload: unknown`이라 Pit of Success 되지 못해 원시로 탈출.

**🧑 사용자**: `TodoDeleteButton payload={todo}` 인게 훨씬 낫지 않아?

**🤖 AI**: 정답. 로직 레이어에서 `createTrigger(factory)` 선언, 뷰는 payload만 전달. 필요한 변경: `createDynamicTrigger`의 제네릭 P 추론 1건.

**🧑 사용자**: createTrigger는 커맨드가 고정이야. 그래도 괜찮아?

**🤖 AI**: 고정이어야 맞다. Trigger = 의도의 이름. 번역기는 번역만 한다 (SRP).

**🧑 사용자**: 이렇게 만들어야 disabled나 focus도 함께 해결할 수 있지.

**🤖 AI**: createTrigger가 커맨드의 when 가드를 알고 있으므로 disabled/focus/aria 자동 처리 가능. 원시 Trigger는 불가능.

---

> **한 줄 요약**: defineApp의 Pit of Success는 createTrigger의 타입 안전한 Dynamic overload를 canonical 패턴으로 확립하고, headless-first 원칙에 따라 로직→뷰 하향 바인딩을 강제하는 것이다.

---

## Conclusion

### Why
defineApp의 소비 패턴이 앱마다 분산되어, 에이전트가 매번 동일한 의사결정을 반복하는 비효율 발생.

### Intent
Pit of Success로 작동하는 canonical defineApp usage를 확정하고, 이를 API 구조로 강제한다.

### Warrants

| # | Warrant |
|---|---------|
| W1 | defineApp API 프리미티브 자체는 일관적이나, 조합 방법에 대한 제약이 없다 |
| W2 | 제약 없는 유연성 = 에이전트에게 반복적 판단 비용 (entropy) |
| W3 | Pit of Success (Rico Mariani) — 잘못 쓰기가 더 어려운 API |
| W4 | Make Illegal States Unrepresentable (Yaron Minsky) — `as unknown as`는 타입 결함의 신호 |
| W5 | Convention over Configuration (DHH) — 관례가 없으면 에이전트가 매번 결정 반복 |
| W6 | 8개 학문적 원칙이 rules.md에 공식화됨 |
| W7 | Headless-first (Project #1) — 상태→조건→커맨드→뷰 바인딩 하향 정의 |
| W8 | Hexagonal Architecture (Alistair Cockburn) — 코어가 먼저, 어댑터는 나중 |
| W9 | 키보드는 선언적(bind config), 마우스는 명령적(직접 Trigger) — 비대칭 = 설계 미스 |
| W10 | Item = 존재, Trigger = 행동. SRP로 분리 정당 |
| W11 | createTrigger(factory)가 이미 존재하지만 payload: unknown → Pit of Success 되지 못함 |
| W12 | createTrigger가 커맨드의 when 가드를 알고 있으면 disabled/focus/aria 자동 처리 가능 |

### 실행 항목

1. **createDynamicTrigger 제네릭 P 추론 수정** — 타입 안전한 payload
2. **createTrigger를 canonical Trigger 패턴으로 확정** — 원시 Trigger import 금지
3. **Undo/Redo 앱-레벨 통합** — generic 팩토리 추출
4. **Builder 핸들러 타입 명시 제거** — 추론에 위임
5. **useComputed 캐스팅 해소** — API 타입 개선
6. **Export 패턴 통일** — Namespaced export 관례 확정
7. **Builder 미사용 BoundComponents 정리** — BuilderSidebarUI/BuilderCanvasUI 활용 또는 제거
8. **kernel 직접 참조 격리** — imperative 브릿지 app.ts에서 분리

> **한 줄 요약**: 로직이 먼저이고, 뷰가 로직에 바인딩되는 Headless-first 원칙 하에, createTrigger의 타입 안전한 factory overload를 Pit of Success로 만들어 defineApp의 canonical usage를 확립한다.
