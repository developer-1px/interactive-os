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
