# createTrigger 설계 논의 — 대화록

## 주제
`createTrigger` API 설계 — defineApp의 마지막 퍼즐 조각

---

**🧑 사용자**: createTrigger가 있으면 좋지 않을까?

**🤖 AI**: Zone/Field은 자동 바인딩인데 Trigger만 수동이라는 비대칭. 그런데 Zone/Field은 1:1인 반면 Trigger는 1:N이라 같은 패턴 적용이 어려움. 보일러플레이트 제거인가, 캡슐화인가?

**🧑 사용자**: 둘 다. 그리고 Modal 같은 거 만들 때 Dismiss와 함께.

**🤖 AI**: Modal은 고정 액션(confirm/dismiss)이라 Trigger 선언과 잘 맞음. Trigger 선언은 "액션 이름 → 커맨드 맵"이 될 수 있음. 아이템 스코프(delete + payload)도 같은 API로?

**🧑 사용자**: 둘 다.

---

**🤖 AI**: `trigger` 키가 `commands` 키와 중복되는 이중 선언 — 정당한가?

**🧑 사용자**: 아니 createWidget처럼 그것 마저도 감출 거야. 그냥 headless하게.

**🤖 AI**: headless 컴포넌트를 생성하는 거군요. `<TodoList.Delete payload={{ id }}>`. 그런데 `commands`와 `triggers` 두 곳에 같은 커맨드가 존재하는 이중성은?

**🧑 사용자**: *(3가지 안을 스스로 기각하며 도달)*
1. `<TodoList.Trigger onPress={...}>` — ❌ 수동 바인딩 그대로
2. `<TodoList.Trigger.XXX>` — ❌ Widget에 강제 내장
3. `const TodoAddButton = createTrigger(...)` — ✅ **독립 단위**

---

**🤖 AI**: `createTrigger`가 감추는 코드는 3줄. 진짜 존재 이유는?

**🧑 사용자**: headless하잖아. createTrigger를 만드는 시점에는 TodoList가 있는데 React에서는 TodoList를 계속 hook으로 가져와야 하니까.

**🤖 AI**: *(핵심 발견)* — `createWidget`이 하는 일의 본질은 **커맨드 바인딩을 모듈 스코프로 끌어올리는 것**. Trigger만 이 분리를 못 지키고 있었다. createTrigger는 **마지막 퍼즐 조각**.

---

**🧑 사용자**: 네가 만들어봐. Radix 참고해서 trigger portal dismiss까지.

**🤖 AI**: *(구현)* Simple trigger + Compound trigger(Dialog) 두 오버로드로 `createTrigger` 구현. TodoToolbarV3에 ClearDialog(확인 모달) 적용.

**🧑 사용자**: 네가 보기에는 어때?

**🤖 AI**: *(Red Team)* Simple은 좋다. Compound는 OS.Dialog를 재포장한 것에 불과 — 추가 가치 희박. Simple만 남기는 게 낫지 않나?

---

**🧑 사용자**: OS Dialog는 Command가 필요 없으니까?

**🤖 AI**: *(Red Team 철회)* — 맞다. OS.Dialog는 열기/닫기만 처리. **앱 커맨드는 모른다.** `Dialog.Close onPress={cmd}`를 쓰면 React가 커맨드를 알아야 해서 모듈 스코프 분리가 깨진다. Compound createTrigger는 재포장이 아니라 **OS가 모르는 앱 커맨드를 바인딩하는 것**.

**🧑 사용자**: App이 아니니까 다이얼로그만 쓰고 싶다면 OS만 써도 괜찮을 거 같아.

**🤖 AI**: 깔끔한 경계: **OS = 앱 커맨드 없는 순수 프리미티브, defineApp = OS + 앱 커맨드 브릿지**.

---

**🧑 사용자**: v1 → v2 → v3로 오면서 진화되었다고 느껴?

**🤖 AI**: 반만. v1→v2는 리팩토링, v2→v3는 소유권 이전. 앱 기능은 동일. 코드가 아니라 **설계 원칙의 발견**이 진짜 진화.

**🧑 사용자**: 우리의 철학과 더 가까워지는 방향으로 가고 있다고 생각해?

**🤖 AI**: *(선언문 참조 후)* "번역기는 번역만 한다" — v3에서 Zone/Field/Trigger 3축 구현. "순수 뷰" — 바인딩 0줄. 다만 레이어 증가로 "구조가 스펙" 원칙과 긴장. **방향은 맞지만, 결과가 아니라 과정에서 가까워진 것.**

---

## 한 줄 요약

> `createTrigger`는 "OS = 순수 프리미티브, defineApp = 앱 커맨드 브릿지"라는 아키텍처 경계를 발견하게 한 촉매이며, 이 발견 자체가 v1→v3 진화의 실체이다.


---

# createTrigger 설계 논의 — 결론

## Why
v3 `defineApp + createWidget`에서 Zone/Field 바인딩은 모듈 스코프로 이전됐지만, **Trigger(마우스 클릭)만 React에 바인딩 지식이 누출**되고 있었다. 이 비대칭을 해소하여 "React = 순수 렌더링"을 완성하고 싶었다.

## Intent
`createTrigger`를 `createWidget`의 형제 API로 만들어, **OS 프리미티브에 앱 커맨드를 모듈 스코프에서 바인딩**하는 패턴을 Zone/Field/Trigger 세 축 전체에서 일관되게 달성한다.

## Warrants (확정된 논거)

| # | Warrant | 유형 |
|---|---------|------|
| W1 | Widget이 바인딩을 소유하면 UI 코드에서 수동 매핑이 사라진다 | 검증됨 (v3 Zero Binding) |
| W2 | Trigger는 1:N 관계이므로 Zone/Field과 다른 매칭 방식 필요 | 구조적 |
| W3 | Modal 같은 고정 액션 패턴은 Trigger 선언과 잘 맞음 | 사례 |
| W4 | `createTrigger`는 headless 컴포넌트를 생성 — OS.Trigger를 감춤 | 설계 |
| W5 | createTrigger로 Widget UI에서 `OS` import 완전 제거 가능 | 효과 |
| W6 | `createTrigger`는 Widget의 자식이 아니라 **형제** — defineApp 1급 개념 | 설계 결정 |
| W7 | 핵심 가치는 코드량이 아니라 **커맨드 바인딩의 모듈 스코프 분리** | 핵심 |
| W8 | Radix compound pattern(Trigger/Portal/Content/Dismiss)이 overlay UI 표준 | 참조 |
| W9 | 기존 OS.Trigger/Dialog/Modal 엔진 위에 감싸는 Layer 3 — 새 엔진 불필요 | 효율 |
| W10 | Simple trigger: 1줄이지만 모든 컴포넌트에서 반복 → 프레임워크 삽입 정당 | 근거 |
| W11 | Compound trigger: OS.Dialog가 **앱 커맨드를 모르기 때문에** 필요 | 핵심 반전 |
| W12 | **OS = 순수 프리미티브, defineApp = 앱 커맨드 브릿지** — 경계 확립 | 아키텍처 원칙 |
| W13 | 앱이 아니면 OS.Dialog를 직접 쓰면 됨 — 두 레이어의 대상이 다름 | 경계 |
| W14 | v1→v2는 리팩토링, v2→v3는 소유권 이전 — 진짜 전환은 v3에서만 | 평가 |
| W15 | v3는 Todo에서만 검증된 가설 — 복잡한 앱에서 추가 검증 필요 | 한계 |
| W16 | 코드보다 **설계 원칙의 발견**이 진짜 진화 | 메타 |
| W17 | v3는 "번역기는 번역만 한다" 원칙을 3축에서 구현 | 철학 정합 |
| W18 | 레이어 증가로 "구조가 스펙" 원칙과 긴장 — 추적 깊이 증가 | 긴장 |
| W19 | 방향은 맞지만, 결과가 아니라 과정에서 가까워진 것 | 최종 판단 |

## 발견된 아키텍처 원칙

> **OS 레이어는 앱 커맨드를 모른다.**
> `createWidget`과 `createTrigger`는 동일한 존재 이유를 가진다:
> "OS 프리미티브 + 앱 커맨드"를 모듈 스코프에서 엮는 브릿지.

```
OS (Layer 1-2)                    defineApp (Layer 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OS.Zone   — 포커스/키보드          createWidget → Widget.Zone
OS.Field  — 텍스트 입력            createWidget → Widget.Field
OS.Trigger — 클릭                  createTrigger → headless button
OS.Dialog — 열기/닫기              createTrigger → compound + 앱 커맨드
```

## 한 줄 요약

> `createTrigger`는 OS 프리미티브에 앱 커맨드를 모듈 스코프에서 바인딩하는 브릿지이며, 이를 통해 "번역기는 번역만 한다"는 프로젝트 철학이 Zone/Field/Trigger 세 축 모두에서 일관되게 달성된다.
