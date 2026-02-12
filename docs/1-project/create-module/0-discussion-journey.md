# Discussion Journey: createModule 발견 과정

---

**🧑 사용자**: Todo 만들어 보니 뭐가 부족해?

**🤖 AI**: Apps에서 `@/os-new/` 직접 import 6건, bridge폴더의 boilerplate, persistence 미구현, 타입의 `any` 도피, 키맵 등록 수동. **OS가 "컴포넌트"는 잘 제공하지만, "앱 개발 인프라"는 부족하다.**

---

**🧑 사용자**: 선언적으로 개발을 하고 싶은데 그게 안 되는 거잖아.

**🤖 AI**: `registerAppSlice` → 커맨드 → 키맵 → mapStateToContext → 뷰. 이 중 4번 mapStateToContext가 수동 접착제. 이상적으로는 하나의 선언으로 앱이 완성되어야 한다.

---

**🧑 사용자**: 최초의 생각은 Zone과 Item을 만들어주면 알아서 만들거라 생각했어. 근데 컴포넌트만 있다고 서비스가 되는 건 아냐.

**🤖 AI**: iOS가 UIView만 제공하고 "알아서 만들어"라고 했다면 안 됨. 우리 OS는 **UIKit은 있지만 Application Framework가 없는 상태**.

---

**🧑 사용자**: 브릿지가 아니라 컴포넌트로 조립이 될 거라 생각했어. htmx 같은 느낌.

**🤖 AI**: HTMX 스타일 — 컴포넌트 속성으로 상태와 행동을 정의. Radix가 이미 React에서 이 패턴 증명.

**🧑 사용자**: 아니지 value는 어디서 오는데?

**🤖 AI**: (찔림) Radix도 `value`는 `useState`에서 온다. 데이터 원천 문제는 안 풀림.

**🧑 사용자**: 커널이 서버가 되려면? 뷰에다가 데이터를 바인딩하는 게 아니어야 하는 거야.

**🤖 AI**: PULL(뷰가 커널에서 꺼냄)이 아니라 PUSH(커널이 뷰에 밀어넣음). 패러다임 전환.

---

**🧑 사용자**: OS.Zone에 커맨드를 덕지덕지 등록하는 게 아니라, 커맨드까지 다 완성된 Headless를 컴포넌트로 제공하는 거야.
```tsx
<TodoList.Zone asChild><div></div>
<TodoList.Item asChild><div></div>
```

**🤖 AI**: Radix가 UI 프리미티브를 headless로 만든 것처럼, 앱 비즈니스 로직을 headless 컴포넌트로 제공. **"Radix for app primitives"**.

---

**🧑 사용자**: `createModule`을 하면 `defineCommand`가 나오는 거야.

**🤖 AI**: 맞다. `registerAppSlice`와 같은 순서. 달라지는 건 산출물 — 상태만이 아니라 headless 컴포넌트가 나온다.

**🧑 사용자**: 근데 이렇게 가면 RTK 꼴이 날 수 있어.

**🤖 AI**: "하나로 모아서 편하게" → "하나가 너무 커서 학습 비용 폭발"의 함정.

**🧑 사용자**: RTK의 길을 걷는다. 다만 Zustand의 해결방법을 가지고.

**🤖 AI**: RTK의 범위 + Zustand의 간결함:
```ts
const TodoList = createModule("todo", (define) => ({
  state: INITIAL_STATE,
  addTodo: define.command("TODO_ADD", handler),
  keymap: { "Enter": "addTodo" },
}))
```

---

**🧑 사용자**: 우리의 철학은 뭐지? 관찰/검증/재현/복구. 커맨드 기반은 왜 검증이 쉽지?

**🤖 AI**: `(state, payload) → newState`. 순수함수. `f(x) = y`. 수학이니까 검증이 쉽다.

**🧑 사용자**: createModule로 만들면 여전히 테스트가 쉬워지나? 분리가 쉬워지나?

**🤖 AI**: (솔직한 답) createModule은 DX↑이지만 분리/격리↓. 핸들러를 개별 import해서 테스트할 수 없게 되는 위험.

---

**🧑 사용자**: 반대로 아주 쉬운 테스트를 짠다고 생각하자. 떠오르는 대로 테스트 코드를 짜봐.

**🤖 AI**:
```ts
const todo = createTodoModule();
todo.dispatch.addTodo({ text: "우유 사기" });
expect(todo.state.todos).toHaveLength(1);
```
DOM 없이 앱의 모든 행동을 테스트하는 **headless 인스턴스**.

**🧑 사용자**: 맞아. `createModule`을 하나 해두고 그걸로 테스트도 아주 쉽게 짤 수 있어야 돼. 초기화도 가능하고.

**🤖 AI**: 하나의 정의에서 프로덕션(headless 컴포넌트) + 테스트(headless 인스턴스) 두 가지가 나온다.

---

**🧑 사용자**: 그럼 뭐 해야겠어? 이미 Todo 테스트 코드가 있잖아?

**🤖 AI**: **기존 Todo 테스트를 createModule 스타일로 다시 짠다.** 테스트가 API를 설계한다.

---

**한 줄 요약**: "컴포넌트만 있다고 서비스가 안 된다"에서 출발하여, 기존 Todo 테스트를 createModule API로 재작성하는 것이 앱 프레임워크 설계의 첫 발걸음임을 발견했다.
