# OS 커맨드 아키텍처 논의 여정

## 배경
E2E 테스트 60/60 Vitest 통과, 하지만 Playwright E2E 실패. 원인 추적 중 `FocusListener`가 클릭 시 `FOCUS + SELECT`를 항상 디스패치하여 Todo 아이템이 의도치 않게 토글되는 문제 발견.

---

**🧑 사용자**: role에 따라 다른거지? command는 일방적으로 주는데 role이나 strategy에 따라 달라지도록 설계를 하려면 조금 더 추상적인 커맨드여야 할까?

**🤖 AI**: 맞습니다. 두 가지 방향이 있습니다 — Listener level에서 role을 보고 분기하는 Strategy 패턴, 또는 `OS_INTERACT` 같은 추상 커맨드를 보내고 handler에서 분기하는 방법. 추상화 수준의 sweet spot은 어디인가요?

---

**🧑 사용자**: 우리의 원칙과 워딩은 W3C ARIA APG에 있는데 거기에 나오는 워딩을 그대로 커맨드화 해야지

**🤖 AI**: *(APG 문서 조사)* APG가 이미 표준 용어를 정의해놨습니다:
- **Focus** = pointer (document.activeElement)
- **Selection** = aria-selected
- **Activate** = default action (Enter)
- **Expand** = aria-expanded

핵심 발견: APG에서 Space의 의미가 role마다 다릅니다 — `option`이면 select, `checkbox`면 check.

---

**🧑 사용자**: 그러면 Listener의 역할은 단순히 mouse를 command로 1:1로 바꾸는 게 아니라 전략에 따른 커맨드를 전달해주는 거네

**🤖 AI**: 맞습니다. 하지만 Listener에 전략 판단을 넣으면 L1이 L4(ZoneRegistry)에 의존하게 됩니다. 대안: Listener는 FOCUS만, Zone이 "selection follows focus" 전략을 자체 판단?

---

**🧑 사용자**: 일단 누군가가 있다고 치자. 그러면 걔는 무슨 일을 하는데?

**🤖 AI**: *(매핑 테이블 정리)* 같은 Space 키인데 role에 따라 SELECT 또는 CHECK이 나옵니다. 둘 다 "boolean 상태 뒤짚기"라는 같은 패턴의 다른 인스턴스. 커맨드를 나눌까, 하나로 합칠까?

---

**🧑 사용자**: 자 그러면 전략에 따라 분기를 해야하는건 정답이야 왜? 커맨드에 따라 가급적 하나의 역할을 하도록 해야 순수하고 디버깅이 쉬울테니까 말야.

**🤖 AI**: 단단한 논거입니다. 트랜잭션 로그에 `OS_SELECT`가 찍혔는데 어떤 때는 aria-selected, 어떤 때는 aria-checked를 바꾸면 로그만 보고 뭘 했는지 알 수 없습니다. **1 커맨드 = 1 ARIA 상태.**

> **W8 확정: SRP — 커맨드 이름이 곧 계약**

---

**🧑 사용자**: 둘다지 앱의 성격에 따라 원하는대로 정의할 수 있는거야. 우리에게 aria는 preset이지 절대헌법이 아냐

**🤖 AI**: 결정적인 구분! OS는 ARIA에서 영감 받은 **커맨드 프리미티브(레고 블럭)**를 제공. 앱은 Zone에서 조합:
```typescript
<OS.Zone onCheck={ToggleTodo} />   // "Space = CHECK 쓸래"
<OS.Zone onSelect={HighlightFile} /> // "Space = SELECT 쓸래"  
```

> **W10 확정: ARIA = preset, 절대헌법 아님**

---

**🧑 사용자**: Cmd+A면 뭘 보내줄거야? Cmd+Z는?

**🤖 AI**: *(핵심 통찰!)* 이것들은 role 상관없이 항상 같은 커맨드. 키 입력이 두 종류:

| 종류 | 예시 | 커맨드 고정? |
|------|------|------------|
| **확정** | Cmd+A, Cmd+Z | ✅ 항상 같음 |
| **맥락적** | Space, Enter, Click | ❌ Zone 의존 |

> **W12 확정: 확정 키 vs 맥락적 키**

---

**🧑 사용자**: Listener는 정직하게 "CMD+A" 이렇게 보내줄까? "SPACE" 이런식으로

**🤖 AI**: Raw input을 보내면 해석 책임이 커널로 옮겨질 뿐 제거되지 않습니다. `SELECT({mode:"range"})`가 `POINTER_DOWN({shift:true})`보다 트랜잭션 가독성이 높습니다. **해석된 의도를 보내되, 커맨드 어휘가 정확하면 됩니다.**

> **W15-16 확정: 해석된 의도 > Raw input**

---

**🧑 사용자**: 아니 스마트하도록 하는거야 그 기능을 Listener가 가져야 돼

**🤖 AI**: 확정! Listener = Smart Translator.

> **W19 확정: Listener는 Smart**

---

**🧑 사용자**: 그렇다면 마지막 관문 Listener가 똑똑해지려면 어떻게 감지를 할수 있을까?

**🤖 AI**: 두 가지 경로 — DOM에서 role 읽기 vs ZoneRegistry config 읽기. 둘은 같은 정보의 다른 표현.

**🧑 사용자**: Listener는 DOM을 전제로 하고 있어 그렇지?

**🤖 AI**: 그렇습니다. `document.addEventListener`로 이벤트를 받고, `closest()`, `getAttribute()`로 정보를 수집합니다. role도 DOM에서 읽으면 ZoneRegistry import 불필요.

> **W21 확정: DOM = Listener의 유일한 데이터 소스**

---

## 한 줄 요약

> **OS 커맨드 어휘는 ARIA 속성에서 직접 도출하고, Listener는 DOM의 role을 읽어 맥락적 키 입력을 정확한 커맨드로 번역하는 Smart Translator이다.**
