# Discussion Journey: Zone Binding과 createModule의 진화

## 도입

**🧑 사용자**: Zone binding에 대하여 (디스커션 시작)

**🤖 AI**: v2 ListView의 Zone binding 코드를 제시. 10개 이벤트 바인딩, `OS.FOCUS` placeholder, payload 형태 불일치 등을 지적.

---

## "이미 바인딩을 다 했는데?"

**🧑 사용자**: 아니 이미 createModule할때 바인딩을 다했는데?

**🤖 AI**: 맞다 — Module이 모든 커맨드를 알고 있는데, Zone은 그걸 모르고 위젯이 수동으로 이어붙이고 있다. 이중 선언이다.

---

## Zone 이벤트가 곧 커맨드?

**🧑 사용자**: addTodo: define.command("ADD_TODO", ...) 같은 이름을 지을 필요가 없지 않나? Zone의 보편적 바인딩과 커맨드를 연결하면 되지

**🤖 AI**: Zone 이벤트(onCheck, onDelete)가 곧 커맨드가 되면 중간 레이어가 사라진다고 동의.

**🧑 사용자**: 그렇게 만들면 TodoApp.addTodo() 이런걸 못하게 되는거 아냐?

**🤖 AI**: 테스트 코드를 비교해보니, `app.dispatch.onSubmit()`은 가독성이 떨어진다. 커맨드 이름(도메인)과 Zone 이벤트(인터랙션)는 별도 역할.

---

## §2.1 "하나의 개념 = 하나의 이름"

**🧑 사용자**: 이벤트 기반 네이밍은 OS 커맨드 이야기. 앱은 앱의 철학을 따라야지. 내가 말하고 싶었던건 "같은 개념을 다른 이름으로 표현하지 않는다"야.

**🤖 AI**: 핵심은 §2.1이었다. `toggleTodo`와 `onCheck`가 같은 매핑을 두 곳에서 표현하는 것이 위반.

**🧑 사용자**: toggleTodo라고 지을거면 command("toggleTodo") 이렇게 지어야지.

**🤖 AI**: `define.command("TOGGLE_TODO")` — 변수명(camelCase)과 문자열(SCREAMING_CASE)도 이중 표현. 통일해야.

---

## 커맨드 = 일급 객체

**🧑 사용자**: 저렇게(inline) 하면 단일로 못쓰잖아

**🤖 AI**: 커맨드를 독립 상수로 먼저 선언하고, commands(테스트) + zones(키보드) + Trigger(마우스) 세 곳에서 같은 참조를 공유.

---

## 5 Why

**🧑 사용자**: 지금 설계의 5why?

**🤖 AI**: 근본 원인 = createModule에 "앱 인터랙션 선언" 역할이 없어서 위젯이 공백을 메꿈 → 이중 선언 발생.

---

## 모듈 중첩

**🧑 사용자**: createModule이야. nested하게 작성하면 되지. TodoRoot, TodoSidebar, TodoList... 얼마든지

**🤖 AI**: 1 Module = 1 Zone. 중첩 조합으로 앱을 구성하면 모놀리식 문제 해결.

---

## defineApp + createWidget

**🧑 사용자**: createModule을 반환하는 `const { createWidget } = defineApp()` 이런 개념?

**🤖 AI**: App이 상태를 소유하고, Widget이 Zone+커맨드를 선언하며 상태를 공유. 모든 Widget의 commands가 하나의 dispatch에 합쳐짐.

**🧑 사용자**: 대체하는거야. app + widget이라는 조합명 FSD도 떠올리고 좋은거 같아

---

**한줄요약**: Zone 바인딩의 이중 선언 문제에서 출발하여, §2.1 원칙과 5 Why를 통해 `createModule` → `defineApp + createWidget` 아키텍처로 진화하는 설계를 도출했다.
