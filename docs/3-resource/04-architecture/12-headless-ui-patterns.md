---
last-reviewed: 2026-02-13
---

# Headless UI 패턴: 행동과 외형의 분리, 그리고 우리 커널의 위치

> UI 컴포넌트에서 로직·접근성·상태를 분리하여, 외형 없이 "뇌"만 제공하는 패턴의 역사·구현·진화.

## 왜 이 주제인가

interactive-os는 방금 `defineApp` → `createWidget` → `createTrigger` 3단 API를 완성했다. 이 API의 핵심은 **Zone/Field/Trigger의 이벤트 바인딩을 Widget 선언에서 소유**해서, UI 컴포넌트의 바인딩 코드를 0줄로 만드는 것이다.

```tsx
// v2: 수동 바인딩 10줄
<OS.Zone onCheck={cmds.toggleTodo({id: OS.FOCUS})} onDelete={cmds.deleteTodo({id: OS.FOCUS})} ...>

// v3: 자동 바인딩 0줄
<TodoList.Zone>{children}</TodoList.Zone>
```

이것은 업계에서 **Headless UI** 라고 부르는 패턴의 변형이다. 그런데 우리 구현은 Radix UI나 React Aria와 같은 기존 라이브러리와 결이 다르다 — 이들은 DOM 이벤트를 추상화하고, 우리는 **커널 커맨드 디스패치**를 추상화한다. 이 차이의 의미와 배경을 정리하려 한다.

---

## Background / Context

### "의존성 역전"의 역사

전통적 UI 컴포넌트는 로직과 외형이 한 몸이었다:

```
2010  jQuery UI    — $.datepicker()에 CSS가 하드코딩
2013  Bootstrap    — .btn-primary { background: #337ab7 }가 로직과 결합
2015  Material UI  — 구글 MD 스타일이 곧 컴포넌트의 정체성
```

문제는 **커스터마이제이션 세금(customization tax)** 이었다. 브랜드 디자인과 라이브러리 디자인이 충돌하면, `!important`와 스타일 오버라이드의 전쟁이 시작된다.

해결 방향은 **의존성 역전(DIP)** 이었다:

```
Before: UI 컴포넌트 → 고정된 스타일 (컴포넌트가 외형을 소유)
After:  UI 컴포넌트 → 추상 행동 ← 개발자가 외형을 주입 (행동이 추상화)
```

### 타임라인

```
2017  Downshift (Kent C. Dodds)    — 첫 대중적 headless 컴포넌트
        → render props로 autocomplete 로직만 제공, 외형은 소비자 책임

2019  Reach UI (Ryan Florence)     — 접근성 우선 headless primitives
        → WAI-ARIA 패턴을 hooks/compound components로 추상화

2020  Headless UI (Tailwind Labs)  — Tailwind와 완벽 호환하는 headless
        → Vue/React 모두 지원. "스타일은 Tailwind, 행동은 우리"

2020  React Aria (Adobe)           — 가장 엄격하고 포괄적인 headless
        → 3레이어 아키텍처: State Hook + Behavior Hook + Component

2021  Radix UI                     — Compound component + data-state
        → asChild, Portal, 자동 ARIA. shadcn/ui의 기반

2024  Ark UI (Chakra Core)         — Zag.js 위에 구축. 프레임워크 무관
        → 상태 머신 기반 headless. React/Vue/Solid/Svelte 모두 지원

2026  interactive-os defineApp     — Kernel dispatch 기반 headless
        → Zone/Field/Trigger가 커널 커맨드 바인딩을 소유
```

---

## Core Concept

### 1. Headless의 3가지 축

모든 headless 라이브러리는 **같은 3가지를 추상화**한다:

| 축 | 해결하는 문제 | 예시 |
|---|---|---|
| **State** | 열림/닫힘, 선택/미선택, 편집 중 등 | `isOpen`, `selectedIndex`, `value` |
| **Behavior** | 키보드 내비게이션, 포커스 관리, 드래그 | `onKeyDown → Arrow key 처리` |
| **Accessibility** | ARIA 속성, role, 스크린 리더 지원 | `aria-expanded`, `aria-selected` |

**스타일은 추상화하지 않는다.** 이것이 "headless"의 정의다.

### 2. API 패턴의 진화

Headless UI의 API는 세 단계를 거쳐 진화했다:

#### Phase 1: Render Props (2017~2019)

```tsx
// Downshift — render prop 패턴
<Downshift onChange={handleChange}>
  {({ getInputProps, getMenuProps, isOpen }) => (
    <div>
      <input {...getInputProps()} />
      {isOpen && (
        <ul {...getMenuProps()}>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  )}
</Downshift>
```

**특징**: 로직을 함수의 인자로 받아서 소비자가 직접 JSX를 구성. `getInputProps()` 같은 "prop getter"가 접근성 속성을 자동 주입.

**한계**: 깊은 중첩(render prop hell), 타입 추론 어려움, 재사용 단위가 함수 하나에 묶임.

#### Phase 2: Hooks (2019~2021)

```tsx
// React Aria — hooks 패턴
function MySelect(props) {
  const state = useSelectState(props);               // State 레이어
  const ref = useRef(null);
  const { triggerProps, menuProps } = useSelect(      // Behavior 레이어
    props, state, ref
  );

  return (
    <>
      <button ref={ref} {...triggerProps}>Select</button>
      <Popover>
        <Listbox {...menuProps} state={state} />
      </Popover>
    </>
  );
}
```

**특징**: 상태(useSelectState)와 행동(useSelect)이 별도 hooks로 분리. 소비자가 DOM 구조를 완전히 통제.

**한계**: hook이 많아지면 조립 복잡도 상승. "올바른 연결 순서"를 개발자가 알아야 함.

#### Phase 3: Compound Components (2021~현재)

```tsx
// Radix UI — compound component 패턴
<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>확인</Dialog.Title>
      <Dialog.Close asChild>
        <button>닫기</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**특징**: `Root`가 Context Provider 역할. 자식 컴포넌트들이 Context를 통해 암묵적으로 상태 공유. `asChild`로 DOM 요소를 소비자가 결정.

**핵심 개념 — `data-state`**: Radix는 컴포넌트의 내부 상태를 `data-state="open"` 같은 HTML 속성으로 노출한다. 이것만으로 CSS 기반 스타일링이 가능하다:

```css
[data-state="open"] { opacity: 1; }
[data-state="closed"] { opacity: 0; }
```

### 3. React Aria의 3레이어 아키텍처

Adobe의 React Aria는 headless 아키텍처의 교과서적 구현이다:

```
┌─────────────────────────────────────────┐
│ Layer 3: React Aria Components          │  ← 편의 레이어 (선택)
│   <DatePicker>, <Select>, <Menu>        │
├─────────────────────────────────────────┤
│ Layer 2: React Aria Hooks               │  ← 행동 + 접근성
│   useButton, useSelect, useFocusRing    │
├─────────────────────────────────────────┤
│ Layer 1: React Stately                  │  ← 순수 상태 로직
│   useSelectState, useToggleState        │
│   (React 무관, 프레임워크 이식 가능)      │
└─────────────────────────────────────────┘
```

**핵심 통찰**: Layer 1(Stately)은 **React에 의존하지 않는 순수 상태 로직**이다. 이것이 headless의 극단적 형태 — 프레임워크조차 headless하게 만든 것이다.

---

## 우리 커널의 Headless: 무엇이 다른가

### 업계 Headless vs. 커널 Headless

| 차원 | Radix / React Aria | interactive-os (`defineApp`) |
|---|---|---|
| **추상화 대상** | DOM 이벤트 → ARIA 행동 | 커널 커맨드 → Zone/Field 바인딩 |
| **상태 위치** | React Context / Hook | 커널 Store (StateLens 격리) |
| **행동 정의** | 라이브러리가 내장 (onKeyDown 등) | **앱이 선언** (zone.onCheck = toggleTodo) |
| **스타일링** | 소비자 책임 (변함없음) | 소비자 책임 (변함없음) |
| **테스트** | React Testing Library 필요 | **`app.create()` → DOM 없이 테스트** |
| **접근성** | 라이브러리가 ARIA 주입 | OS.Zone/Item이 role + aria-* 주입 |

### 핵심 차이: "행동의 소유권"

Radix의 `<Dialog.Close>`는 **"닫기 행동"을 라이브러리가 미리 정의**한 것이다. 소비자는 트리거만 연결한다.

우리 Widget의 `zone.onDelete = deleteTodo`는 **"삭제 행동"을 앱이 정의**한 것이다. 프레임워크는 바인딩 채널(Zone)만 제공한다.

```
Radix:    Library defines behavior → Consumer styles it
Kernel:   App defines behavior     → Widget binds it → Consumer styles it
                                     ↑ 이 레이어가 추가됨
```

이 "Widget binds it" 레이어가 바로 `createWidget`의 역할이다. Radix에는 없는 계층이다.

### `createTrigger` — Compound Component의 커널 버전

`createTrigger`는 Radix의 Dialog 패턴을 커널 커맨드 시스템 위에 재구현한 것이다:

```tsx
// Radix Dialog
<Dialog.Root>
  <Dialog.Trigger><button>삭제</button></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Close onClick={onDelete}>확인</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>

// interactive-os createTrigger
const DeleteConfirm = TodoApp.createTrigger({
  id: "delete-confirm",
  confirm: TodoList.commands.deleteTodo,
});

<DeleteConfirm.Root>
  <DeleteConfirm.Trigger><button>삭제</button></DeleteConfirm.Trigger>
  <DeleteConfirm.Portal title="삭제 확인">
    <DeleteConfirm.Confirm>확인</DeleteConfirm.Confirm>
    <DeleteConfirm.Dismiss>취소</DeleteConfirm.Dismiss>
  </DeleteConfirm.Portal>
</DeleteConfirm.Root>
```

차이: `Confirm`에 `onClick` 핸들러를 직접 연결하지 않는다. `confirm: deleteTodo`를 **선언**하면, 커널이 디스패치한다.

### Headless Testing: DOM이 필요 없는 테스트

업계 headless 라이브러리의 "headless"는 **스타일이 없다**는 뜻이지, DOM과 분리되었다는 뜻은 아니다. 테스트하려면 여전히 `@testing-library/react`로 렌더해야 한다.

우리 `defineApp`의 `create()`는 진짜로 headless한 테스트 인스턴스를 만든다:

```typescript
// DOM 없이, React 없이, 순수 로직 테스트
const app = TodoApp.create();
app.dispatch.addTodo({ text: "Test" });
expect(app.state.data.todos).toHaveLength(1);

const stats = app.select.stats();
expect(stats.active).toBe(1);
```

이것은 React Aria의 Layer 1(Stately)을 **앱 레벨에서 달성**한 것이다. Stately가 "Select 컴포넌트의 상태 로직"을 분리하듯, `create()`는 "Todo 앱의 전체 비즈니스 로직"을 분리한다.

---

## Best Practice + Anti-Pattern

### ✅ Do

| 원칙 | 설명 |
|---|---|
| **Widget = Focus 영역** | 1 Zone(keyboard focus boundary) = 1 Widget으로 분리하라 |
| **행동은 선언, 스타일은 자유** | `zone.onCheck = toggleTodo`처럼 선언만 하고, TSX에서 className만 신경 쓰라 |
| **Compound Component로 복합 UI** | Dialog, Tooltip 같은 multi-part UI는 `createTrigger`의 Root/Trigger/Content 패턴을 따르라 |
| **테스트는 headless로 먼저** | `app.create()`로 비즈니스 로직을 모두 검증한 후, E2E는 통합 확인에만 사용하라 |
| **asChild로 DOM 통제** | `<Widget.Item asChild>`로 자식에 props를 전달하면, `<li>`, `<div>` 등 DOM 요소를 소비자가 결정 |

### ❌ Don't

| Anti-Pattern | 왜 위험한가 |
|---|---|
| **Widget에 스타일 하드코딩** | headless의 핵심 가치를 스스로 파괴. Zone/Field는 className만 받아야 |
| **`OS.Zone` 직접 사용 (v2 패턴)** | 10줄 바인딩 코드가 모든 위젯에 반복됨. Widget.Zone으로 캡슐화하라 |
| **하나의 Widget에 모든 커맨드** | Zone 경계를 무시하면 키보드 포커스 관리가 불가능해짐 |
| **테스트에서 DOM 렌더링** | `app.create()`로 테스트 가능한 로직을 RTL로 테스트하면 속도와 유지보수 모두 저하 |
| **`onClick`으로 커널 우회** | Trigger를 쓰지 않고 `onClick={() => dispatch(cmd)}`하면, 커널의 미들웨어 체인을 건너뜀 |

---

## 흥미로운 이야기들

### Kent C. Dodds의 "Inversion of Control"

Downshift의 창시자 Kent C. Dodds는 headless 패턴을 **"제어의 역전"** 으로 설명했다. 프레임워크의 `IoC Container`가 객체 생성을 역전하듯, headless 컴포넌트는 **렌더링을 역전**한다. "내가 어떻게 보일지는 내가 결정하지 않겠다. 너(소비자)가 결정하라."

이 철학은 우리 커널에서 한 단계 더 나아갔다: **"어떤 행동을 할지도 내가 결정하지 않겠다. 앱이 선언하라."** Radix가 렌더링을 역전했다면, 우리는 **행동까지 역전**한 것이다.

### "asChild" 패턴의 기원 — Polymorphic Components의 진화

`asChild`이 등장하기 전에는 `as` prop이 있었다:

```tsx
// 구형: as prop (Styled Components, Chakra)
<Button as="a" href="/">링크 버튼</Button>

// 문제: TypeScript가 'a'의 props를 추론하지 못함
// <Button as="a" href="/" target="_blank">  ← target이 타입 에러?
```

`as` prop은 **타입 안전성과 DX가 충돌**했다. Radix가 `asChild`를 도입하여 이 문제를 해결했다:

```tsx
// 신형: asChild prop (Radix)
<Dialog.Trigger asChild>
  <Button>열기</Button>   {/* Button의 타입이 그대로 보존됨 */}
</Dialog.Trigger>
```

내부적으로 `asChild`는 `Slot` 컴포넌트를 사용하여, 자기 자신의 DOM을 렌더하는 대신 자식의 DOM에 props를 병합(merge)한다. 이것이 우리 `Widget.Item`의 `asChild` prop과 같은 메커니즘이다.

### shadcn/ui — "라이브러리가 아닌 코드"

2023년 가장 영향력 있는 UI 접근은 shadcn/ui였다. 이것은 npm 패키지가 아니라, **CLI로 소스 코드를 프로젝트에 복사**하는 방식이다. Radix Primitives + Tailwind CSS를 조합하여, 개발자가 생성된 코드를 **직접 수정**할 수 있게 했다.

```
전통: npm install ui-library → 블랙박스
shadcn: npx shadcn-ui add button → 소스가 프로젝트에 복사됨
```

이 "코드를 소유하라" 철학은 headless의 논리적 귀결이다. 외형뿐 아니라 **컴포넌트 코드 자체**도 소비자의 것이 된다.

### Zag.js — 상태 머신이 headless의 미래?

Chakra UI 팀이 만든 [Zag.js](https://zagjs.com)는 headless 컴포넌트를 **유한 상태 머신(FSM)** 으로 모델링한다. 모든 컴포넌트의 행동이 상태 전이 테이블로 정의된다:

```typescript
// Zag.js 내부 — Accordion의 상태 머신
{
  states: {
    idle: {
      on: {
        "TRIGGER.CLICK": { target: "focused", actions: ["setFocusedValue"] },
      },
    },
    focused: {
      on: {
        "TRIGGER.CLICK": { actions: ["toggle"] },
        "CONTENT.KEYDOWN": { actions: ["handleKeyDown"] },
      },
    },
  },
}
```

이 모델의 장점은 **프레임워크 완전 무관**이라는 점이다. 같은 상태 머신을 React, Vue, Solid, Svelte 어댑터가 소비한다. 우리 커널의 `defineCommand` + 미들웨어 파이프라인이 비슷한 역할을 한다 — 커맨드 핸들러는 React를 모르고, `OS.Zone`이 React 어댑터 역할을 한다.

---

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|---|---|---|---|---|
| Kent C. Dodds — "Inversion of Control" | headless 패턴의 원리를 가장 명확히 설명 | [블로그](https://kentcdodds.com/blog/inversion-of-control) | ⭐⭐ | 30분 |
| React Aria Architecture | 3레이어 아키텍처와 접근성 설계의 교과서 | [공식 문서](https://react-spectrum.adobe.com/react-aria/why.html) | ⭐⭐⭐ | 1시간 |
| Radix UI Composition | asChild, data-state, compound pattern 실전 | [Radix Docs: Composition](https://www.radix-ui.com/primitives/docs/guides/composition) | ⭐⭐⭐ | 45분 |
| Zag.js 소스 코드 | FSM 기반 headless의 내부 동작 | [GitHub: chakra-ui/zag](https://github.com/chakra-ui/zag) | ⭐⭐⭐⭐ | 2시간 |
| Downshift v9 useCombobox 소스 | render props → hooks 마이그레이션의 실제 | [GitHub: downshift-js](https://github.com/downshift-js/downshift) | ⭐⭐⭐ | 1시간 |
| "The Evolution of Headless UI" | 업계 트렌드 종합 (shadcn, Radix, Ark) | [LogRocket Blog](https://blog.logrocket.com/guide-headless-ui-components-react/) | ⭐⭐ | 30분 |
