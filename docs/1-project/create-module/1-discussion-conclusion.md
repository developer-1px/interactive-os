# Discussion Conclusion: createModule — OS 앱 프레임워크의 다음 단계

## Why

컴포넌트(Zone, Item, Trigger)만으로는 서비스가 되지 않는다. OS에 UIKit은 있지만 Application Framework가 없다. 앱 개발자가 브릿지 코드를 수동으로 작성해야 하며, 이는 선언문의 "구조를 선언하면 동작한다"는 철학에 어긋난다.

## Intent

`registerAppSlice`를 `createModule`로 진화시켜, 하나의 선언에서 headless 컴포넌트(프로덕션) + headless 인스턴스(테스트)를 모두 반환하는 앱 프레임워크를 만든다.

## Warrant 전체 구조

| # | Warrant |
|---|---------|
| W1 | 선언문 작성 직후 설계 방향 재점검이 필요하다 |
| W2 | Facade가 앱이 필요한 것을 다 제공 못 한다 (6건의 직접 import) |
| W3 | bridge/mapStateToContext = 보일러플레이트 |
| W4 | 앱 커맨드 타입이 any로 도피 |
| W5 | 앱 등록이 분산 (상태/키맵/컨텍스트/persistence 각각 다른 파일) |
| W6 | 하나의 선언으로 앱이 완성되어야 "플랫폼"이다 |
| W7 | 컴포넌트만 있다고 서비스가 되는 게 아니다 — OS = UIKit + Application Framework |
| W8 | iOS/Android가 강한 이유는 View가 아니라 앱 라이프사이클, 데이터 추상화 |
| W9 | HTMX 철학: 컴포넌트 트리가 곧 어플리케이션 상태의 원천 |
| W10 | Radix/React Aria가 React에서 "컴포넌트 = 선언" 패턴이 동작함을 증명 |
| W11 | Zone은 이미 onSelect/onDelete/onAction으로 반쯤 선언적 |
| W12 | Radix도 value는 외부에서 온다 — 컴포넌트 선언만으론 데이터 원천 문제 미해결 |
| W13 | HTMX는 서버를 데이터 원천으로 함 — 커널이 우리의 서버 |
| W14 | 뷰에 데이터를 바인딩하면 브릿지가 생긴다 — 방향을 뒤집어야 함 |
| W15 | Radix의 headless 패턴을 앱 비즈니스 로직에 적용하면 bridge가 사라진다 |
| W16 | 뷰 개발자는 CSS만, 로직 개발자는 headless만 — 관심사 완전 분리 |
| W17 | createModule = registerAppSlice의 진화 — 상태 등록 → 앱 전체 등록 |
| W18 | 결과물이 headless 컴포넌트면 앱 개발 = "선언 + 템플릿" 2단계로 축소 |
| W19 | defineCommand는 group이 필요하고, group은 등록 후 나온다 — 순서 유지 가능 |
| W20 | 기존 registerAppSlice 패턴을 깨지 않으면서 확장 — 진화지 혁명이 아니다 |
| W21 | RTK는 "편하게 해줄게"가 "더 복잡해"로 귀결 — 팩토리 패턴의 함정 |
| W22 | Zustand이 증명: 하나의 함수에 상태와 액션을 넣어도 복잡해지지 않는다 |
| W23 | createModule에서 관찰/검증/재현/복구는 커널을 통과하므로 자동 보장 |
| W24 | 커맨드가 순수함수이기 때문에 관찰/검증/재현/복구 가능 — 이 구조를 깨트리면 끝 |
| W25 | createModule에 묶으면 핸들러 독립 테스트가 어려워질 수 있음 — DX와 격리의 트레이드오프 |
| W26 | 테스트가 API를 설계한다 — 가장 자연스러운 테스트가 가장 올바른 인터페이스 |
| W27 | createModule은 두 산출물: 프로덕션용(headless 컴포넌트) + 테스트용(headless 인스턴스) |

## 최종 설계 결정

```ts
const TodoModule = createModule("todo", INITIAL_STATE, (define) => ({
  addTodo: define.command("TODO_ADD", handler),
  toggleTodo: define.command("TODO_TOGGLE", handler),
  deleteTodo: define.command("TODO_DELETE", handler),
  keymap: { "Backspace": "deleteTodo" },
  context: (state) => ({ isEditing: !!state.editingId }),
}))

// 프로덕션: <TodoModule.Zone asChild>
// 테스트:   TodoModule.create()
```

## 다음 액션

**기존 Todo 테스트(`todo.test.ts`)를 createModule 스타일로 다시 작성한다.** 그 테스트가 createModule의 API 스펙이 되며, 테스트를 통과시키는 것이 구현의 첫 번째 마일스톤이다.

---

**한 줄 요약**: 컴포넌트만으론 서비스가 안 된다 — createModule로 상태/커맨드/키맵을 하나의 선언에 묶고, headless 컴포넌트(프로덕션)와 headless 인스턴스(테스트)를 동시에 반환하는 앱 프레임워크가 OS의 다음 단계다.
