# 🔴 Red Team Report: defineApp v5 PoC

> **대상**: `src/os/poc/defineApp-v5.ts`, `src/os/poc/usage-v5.ts`
> **일자**: 2026-02-14
> **방법**: 설계 결정의 약점, 엣지케이스, 숨은 가정을 공격적으로 제기

---

## Attack 1: "Zone = 키보드 스코프"는 거짓이다

디스커션에서 확정한 W20: *"Zone의 존재 이유는 키보드 모호함 해소"*

**그런데 usage-v5.ts L214-228:**
```ts
const TodoListUI = listZone.bind({
  role: "listbox",
  onCheck: toggleTodo,   // ← Space뿐 아니라 마우스 체크박스 클릭도
  onAction: startEdit,   // ← Enter뿐 아니라 마우스 더블클릭도
  onDelete: deleteTodo,  // ← Delete뿐 아니라 컨텍스트 메뉴 삭제도
});
```

`onCheck`, `onAction`, `onDelete`는 **마우스에서도 발생**한다. Zone은 키보드만의 문제가 아니라
**"이 영역에서 일어나는 모든 인터랙션의 커맨드 매핑"**이다.

W20이 틀리면 → Zone의 존재 이유 재정의 필요 → entity model 흔들림.

**심각도: 높음** — 핵심 Warrant가 잘못됐을 수 있다.

---

## Attack 2: Scope 버블링이 증명되지 않았다

디스커션에서 확정한 핵심: "Zone = child Scope, 커맨드 해소는 kernel 버블링으로"

**그런데 defineApp-v5.ts L213:**
```ts
const handlerRegistry = new Map<string, { handler; when? }>();
```

**flat Map 하나**. App command와 Zone command가 구분 없이 같은 Map에 들어간다.

```ts
TodoApp.command("UNDO", ...);        // → handlerRegistry.set("UNDO", ...)
listZone.command("TOGGLE_TODO", ...); // → handlerRegistry.set("TOGGLE_TODO", ...)
```

같은 type 문자열이면 **나중에 등록한 게 이긴다.** Scope 구분 없음. 버블링 없음.

**"Zone = child scope"는 주장일 뿐, v5 PoC에서 증명되지 않았다.**

만약 두 Zone이 같은 command type을 등록하면?

```ts
const listZone = TodoApp.createZone("list");
const sidebarZone = TodoApp.createZone("sidebar");
listZone.command("SELECT", listHandler);
sidebarZone.command("SELECT", sidebarHandler);  // ← listHandler를 덮어씀!
```

**원칙 7 위반**: 증명 없는 통과는 통과가 아니다.

**심각도: 높음** — v5의 핵심 차별점(Zone = scope)이 실제로는 구현되지 않았다.

---

## Attack 3: `setState`가 여전히 public — 이중 경로 escape hatch

v4 review에서 `builderUpdateField`의 `setState` 직접 호출이 🔴였다.
v5 usage에서는 사용하지 않지만, **API에는 여전히 존재한다:**

```ts
// defineApp-v5.ts L184
setState(updater: (prev: S) => S): void;
```

아무 코드에서나:
```ts
TodoApp.setState((prev) => produce(prev, d => { d.data.todos[999] = ...; }));
```

이것은:
- Command pipeline 우회 ✅
- when guard 우회 ✅
- Transaction 기록 우회 ✅
- Middleware 우회 ✅

**"단일 파이프라인" 원칙을 API 레벨에서 위반 가능하게 열어둔 것.**

사용하지 않는다고 해서 API에 존재하는 것 자체가 문제.
LLM이 코딩하면 → `setState`를 보고 쓸 수 있다 → 이중 경로 발생.

**심각도: 중간** — PoC 내부에서는 미사용이나, 외부 API에 노출됨.

---

## Attack 4: Condition 이름 중복 — uniqueness 미보장

```ts
const canUndo = TodoApp.condition("canUndo", (s) => s.history.past.length > 0);
const canUndo2 = TodoApp.condition("canUndo", (s) => s.history.future.length > 0); // 같은 이름!
```

현재 구현 (`defineApp-v5.ts` L217-224):
```ts
function defineCondition(name, predicate) {
  const cond = { name, evaluate: predicate, ... };
  conditionRegistry.push(cond);  // ← 중복 체크 없음
  return cond;
}
```

DevTools에 "canUndo"가 2개 뜬다. 하나는 true, 하나는 false. 어느 게 진짜?

**심각도: 낮음** — production에서 `Map<string, Condition>` + 중복 오류로 해결 가능.

---

## Attack 5: `when` guard + handler guard = 이중 방어? 아니면 이중 경로?

`PASTE_TODO` 정의:
```ts
const pasteTodo = listZone.command("PASTE_TODO", (ctx) => {
  const clip = ctx.state.ui.clipboard;
  if (!clip) return;               // ← handler 내부 guard
  // ...
}, { when: hasClipboard });         // ← when guard
```

같은 조건(`clipboard !== null`)을 **2곳에서 체크**한다.

- `when: hasClipboard` → dispatch 시 kernel이 체크
- `if (!clip) return;` → handler 내부에서 또 체크

이것은:
- **방어적 프로그래밍**인가? → 좋은 것
- **원칙 2(단일 파이프라인) 위반**인가? → when이 dispatch guard라면, handler는 when 통과를 전제해도 됨

v5 디스커션에서 "when이 dispatch guard면 handler에서 같은 체크 안 해도 됨"이라고 했다.
그런데 실제 코드에서는 여전히 이중 체크.

**질문**: when이 있으면 handler에서 같은 조건을 생략해도 안전한가?
만약 **프로그래밍적 dispatch**에서 when이 bypass된다면? → handler guard 필요.
하지만 v5에서 when은 항상 체크한다고 했다 → handler guard는 불필요한 중복.

**심각도: 낮음** — 방어적이지만 원칙적으로는 중복.

---

## Attack 6: dispatch chain에서 when이 silent fail

Handler에서 다른 커맨드를 dispatch:
```ts
const complexAction = app.command("COMPLEX", (ctx) => ({
  state: newState,
  dispatch: pasteTodo(),  // ← when: hasClipboard
}));
```

`COMPLEX` handler는 성공하지만, 이후 `pasteTodo()`의 dispatch에서 when이 실패하면?

현재 `TestInstance.dispatch` (L297-310):
```ts
dispatch(command) {
  const entry = handlerRegistry.get(command.type);
  if (entry.when && !entry.when.evaluate(testState)) return false;
  const result = entry.handler({ state: testState }, command.payload);
  if (result?.state) testState = result.state;
  return true;
  // ← result.dispatch는 처리하지 않음!
}
```

**`dispatch` 체인이 아예 구현되지 않았다.** `HandlerResult.dispatch`가 무시된다.

이것은 production kernel에서는 `executeEffects`가 처리하지만, TestInstance에서는 누락.

**심각도: 중간** — PoC 테스트에서 dispatch 체인 시나리오가 검증 불가.

---

## Attack 7: Shallow copy로 인한 state 공유

```ts
// defineApp-v5.ts L290
let testState = overrides ? { ...initialState, ...overrides } : { ...initialState };
```

Shallow copy. `INITIAL.data.todos`는 `{}`이므로 빈 객체라 문제 안 되지만:

```ts
const app1 = TodoApp.create();
const app2 = TodoApp.create();
// app1.state.history === app2.state.history → true! (같은 참조)
```

두 테스트 인스턴스가 **중첩 객체를 공유**. 한쪽 변경이 다른 쪽에 영향.

Immer `produce`를 쓰므로 실질적으로 immutable update라 보호되지만,
**직접 참조 비교(===)하는 테스트가 있으면** 예기치 않은 결과.

**심각도: 낮음** — Immer가 보호하지만 structuralSharing 가정에 의존.

---

## Attack 8: 논리적 모순 — when + handler 둘 다 void return

```ts
const commitEdit = editZone.command("COMMIT_EDIT", (ctx) => {
  const { editingId } = ctx.state.ui;
  if (editingId === null) return;   // ← void return = no state change
  // ...
}, { when: isEditing });
```

`when: isEditing`이 통과했다 = `editingId !== null`.
그런데 handler에서 `if (editingId === null) return;` — 이건 **dead code**.

Dead code의 존재는 "when을 신뢰하지 못한다"는 의미.
신뢰하면 제거해야 하고, 신뢰하지 않으면 when의 의미가 없다.

**심각도: 낮음** — 논리적 불일치. production에서 when을 신뢰하도록 정리 필요.

---

## 총평

| # | 공격 | 심각도 | 본질 |
|---|------|--------|------|
| 1 | "Zone = 키보드"는 거짓 | **높음** | Warrant W20 재검토 필요 |
| 2 | Scope 버블링 미구현 | **높음** | 핵심 주장이 증명 안 됨 |
| 3 | setState public | 중간 | 이중 경로 escape hatch |
| 4 | Condition 이름 중복 | 낮음 | uniqueness 미보장 |
| 5 | when + handler 이중 체크 | 낮음 | 원칙적 중복 |
| 6 | dispatch chain 미구현 | 중간 | TestInstance 한계 |
| 7 | Shallow state copy | 낮음 | Immer가 보호 |
| 8 | Dead code in handler | 낮음 | when 신뢰 불일치 |

**핵심 공격 2개:**
1. **W20("Zone = 키보드") 재검토** — Zone은 키보드만이 아니라 모든 인터랙션의 커맨드 매핑
2. **Scope 버블링 미증명** — v5의 핵심 차별점인데 flat Map으로 구현 → "증명 없는 통과"
