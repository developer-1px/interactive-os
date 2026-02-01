# 감사 챕터 4: 사용성 및 보일러플레이트 (Usage & Boilerplate)
## "OS 수준" 경험을 위한 제로 보일러플레이트

**상태**: 🟠 NEEDS IMPROVEMENT (개선 필요)
**날짜**: 2026-02-01
**범위**: `components/`, 개발자 경험(DX), 소비 패턴

### 1. 문제 진단: "적극적인(Active)" 동어반복
현재 `TodoPanel.tsx`와 `Sidebar.tsx`에서 가장 눈에 띄는 보일러플레이트는 `active` 상태 판별 로직입니다.

**현재 코드**:
```tsx
<Option
    key={todo.id}
    id={todo.id}
    active={state.focusId === todo.id} // ⚠️ 개발자가 매번 수동으로 매칭해야 함
>
```

**비평**:
이 시스템은 이미 `FocusZone` 안에 있고, 레지스트리를 통해 포커스 흐름을 알고 있습니다. 개발자가 매번 `state.focusId === id`를 작성해야 하는 것은 "OS"가 아니라 "도구(Tool)" 수준에 머물러 있다는 증거입니다.
OS라면, 존(Zone) 안에 있는 아이템은 자신의 ID만 알면, 자신이 활성 상태인지 시스템이 알려줘야 합니다.

**제안된 해결책**:
`Option` 컴포넌트가 내부적으로 `CommandContext`를 구독하고 자신의 ID와 시스템의 `focusId`를 비교하도록 변경해야 합니다.
```tsx
// 목표 구문
<Option id={todo.id}> {children} </Option>
```

### 2. 커맨드 리터럴 지옥 (Literal Hell)
커맨드를 호출할 때마다 객체 리터럴을 생성하고 있습니다.

**현재 코드**:
```tsx
<Action command={{ type: 'TOGGLE_TODO', payload: { id: todo.id } }}>
```
이 방식은 타입 안전성은 있지만(제네릭 덕분에), 매우 장황하고 가독성을 해칩니다.

**제안된 해결책**:
"커맨드 팩토리(Command Factory)" 패턴을 도입하여 호출을 함수형으로 간소화해야 합니다.
```tsx
// 목표 구문
<Action command={TodoParams.Toggle(todo.id)}>
```
또는 더 나아가, `Option`이 `Action`을 암시적으로 포함할 수 있는 패턴을 고려해야 합니다.

### 3. Context 반복 호출
모든 컴포넌트 도입부에서 다음 코드가 반복됩니다:
```tsx
const { state, Action, Field, Option, ctx, FocusZone } = useTodoEngine();
```

이것은 컴포넌트가 `useTodoEngine`이라는 거대한 훅에 강하게 결합되게 만듭니다.
프리미티브(`Action`, `Option` 등)는 `todo_engine`과 무관하게 독립적으로 import 가능해야 하며, 내부적으로 Context를 통해 엔진과 연결되어야 합니다.

**권고 사항**:
1. `primitives`는 직접 import 하여 사용 (`import { Action } from '@/lib/primitives'`)
2. `state`는 필요한 부분만 선택적으로 구독 (`useTodoStore(s => s.todos)`)

### 4. 최종 목표: 제로 보일러플레이트 뷰
우리가 추구해야 할 `TodoPanel`의 이상적인 모습은 다음과 같습니다:

```tsx
<FocusZone id="todoList">
    {todos.map(todo => (
        <Option id={todo.id}>
            <Action.Trigger command={ToggleTodo(todo.id)}>
                <Icon completed={todo.completed} />
            </Action.Trigger>
            <EditableText value={todo.text} onCommit={UpdateText(todo.id)} />
        </Option>
    ))}
</FocusZone>
```

**결론**:
현재 구조는 기능적으로 완벽하지만, 작성자(개발자)에게 "기계적인 반복"을 강요합니다. OS 수준이 되려면 이 기계적인 부분을 내부로 숨겨야 합니다.
