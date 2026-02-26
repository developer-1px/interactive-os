# 코어 프리미티브 (ZIFT)

Interactive OS의 4가지 핵심 프리미티브: **T**rigger, **F**ield, **I**tem, **Z**one

---

## Zone

### Why?

> **"관할권(Jurisdiction)의 경계를 정의한다."**

전통적인 웹 앱에서는 각 컴포넌트가 자체 키보드 이벤트 핸들러를 가지며, 이로 인해:
- 키바인딩 충돌 (여러 곳에서 `Cmd+S` 처리)
- 포커스 추적 어려움 (현재 어디에 집중?!)
- 테스트 불가능한 분산 로직

**Zone**은 이 문제를 해결합니다:
- 화면을 **영역(Area)**으로 분할
- 한 번에 **하나의 Zone만 Active**
- 키바인딩은 **Active Zone에서만 동작**

```
┌──────────────────────────────────────────┐
│  App                                     │
│  ┌─────────────┐  ┌────────────────────┐ │
│  │  Sidebar    │  │  Main Content      │ │
│  │  (Zone)     │  │  (Zone)            │ │
│  │   ○ Inbox   │  │   ┌──────────────┐ │ │
│  │   ○ Today   │  │   │ TodoPanel    │ │ │
│  │   ○ Archive │  │   │ (Zone)       │ │ │
│  │             │  │   └──────────────┘ │ │
│  └─────────────┘  └────────────────────┘ │
└──────────────────────────────────────────┘
```

### Usage

```tsx
import { Zone } from "@os/ui";

function App() {
  return (
    <div className="flex">
      {/* 사이드바 Zone */}
      <Zone id="sidebar" area="navigation" strategy="roving" layout="column">
        <Item id="inbox">Inbox</Item>
        <Item id="today">Today</Item>
      </Zone>

      {/* 메인 컨텐츠 Zone */}
      <Zone id="main" area="content" strategy="spatial" layout="column">
        <TodoList />
      </Zone>
    </div>
  );
}
```

### Key Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `id` | `string` | (필수) | 고유 식별자 |
| `area` | `string` | - | 영역 그룹 이름 |
| `strategy` | `"spatial" \| "roving"` | `"spatial"` | 네비게이션 전략 |
| `layout` | `"column" \| "row" \| "grid"` | `"column"` | 아이템 배치 방향 |
| `navMode` | `"clamped" \| "loop"` | `"clamped"` | 끝에서 동작 방식 |
| `allowedDirections` | `("UP" \| "DOWN" \| "LEFT" \| "RIGHT")[]` | - | 허용된 방향 |

### 핵심 원칙

**Zone은 순수 선언적(Purely Declarative)**입니다:
- 이벤트 핸들러 없음 (`onClick`, `onKeyDown` 없음)
- 메타데이터 등록과 DOM 마커 제공만 담당
- 모든 상호작용은 Global `InputEngine`이 처리

---

## Item

### Why?

> **"포커스 가능한 개별 객체를 정의한다."**

포커스 관리의 전통적 문제점:
- `tabIndex` 지옥 (수십 개의 `tabIndex` 수동 관리)
- `document.activeElement` 의존 (DOM과 State 불일치)
- 포커스 스타일링 중복

**Item**은 이 문제를 해결합니다:
- **Active Registration**: 마운트 시 자동으로 Zone에 등록
- **Virtual Focus**: DOM focus와 분리된 논리적 포커스
- **Payload Beacon**: 포커스 시 연관 데이터 자동 전파

### Usage

```tsx
import { Zone, Item } from "@os/ui";

function TodoList({ todos }) {
  return (
    <Zone id="todo-list" layout="column">
      {todos.map(todo => (
        <Item 
          key={todo.id} 
          id={todo.id}
          payload={todo}  // 포커스 시 자동 전달
        >
          {({ isFocused }) => (
            <div className={isFocused ? "ring-2 ring-blue-500" : ""}>
              {todo.text}
            </div>
          )}
        </Item>
      ))}
    </Zone>
  );
}
```

### Key Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `id` | `string \| number` | (필수) | 고유 식별자 |
| `payload` | `any` | - | 포커스 시 Store에 전달될 데이터 |
| `children` | `ReactNode \| (state) => ReactNode` | - | 렌더 함수 지원 |
| `asChild` | `boolean` | `false` | Radix 스타일 자식 위임 |
| `selected` | `boolean` | `false` | 선택 상태 오버라이드 |

### 렌더링 패턴

```tsx
// 1. Function as Child (Render Props)
<Item id="task-1">
  {({ isFocused, isSelected }) => (
    <div data-focused={isFocused}>Task 1</div>
  )}
</Item>

// 2. asChild (Radix 스타일)
<Item id="task-2" asChild>
  <li className="task-item">Task 2</li>
</Item>

// 3. Wrapper (기본)
<Item id="task-3" className="task-item">
  Task 3
</Item>
```

---

## Field

### Why?

> **"입력을 Command로 변환한다."**

전통적인 입력의 문제점:
- `onChange` 핸들러 지옥 (100개 Input = 100개 핸들러)
- 상태 동기화 복잡성
- IME(한글/일본어) 처리 버그

**Field**는 이 문제를 해결합니다:
- **Command 바인딩**: 입력 → Command 자동 변환
- **ContentEditable 기반**: 자연스러운 텍스트 편집
- **IME 안전**: 한글/일본어 조합 중 안전한 처리

### Usage

```tsx
import { Field } from "@os/ui";

function TodoItem({ todo }) {
  return (
    <Item id={todo.id}>
      <Field
        name={todo.id}
        value={todo.text}
        placeholder="할 일을 입력하세요..."
        
        // 타이핑마다 호출 (debounced 권장)
        onChange={UpdateDraft({ id: todo.id })}
        
        // Enter/Blur시 호출
        onSubmit={SaveTodo({ id: todo.id })}
      />
    </Item>
  );
}
```

### Key Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `value` | `string` | (필수) | 표시할 텍스트 값 |
| `name` | `string` | - | 포커스 추적용 ID |
| `placeholder` | `string` | - | 빈 상태 힌트 |
| `multiline` | `boolean` | `false` | 멀티라인 모드 |
| `onChange` | `Command` | - | 입력마다 dispatch |
| `onSubmit` | `Command` | - | Enter/Blur시 dispatch |
| `onCancel` | `Command` | - | Escape시 dispatch |
| `commitOnBlur` | `boolean` | `true` | Blur시 자동 커밋 |

### 동작 흐름

```
┌─────────────────────────────────────────────────┐
│  User Types: "안녕"                              │
├─────────────────────────────────────────────────┤
│  1. IME 조합 시작 (ㅎ → 하 → 한...)              │
│  2. IME 조합 완료 → onChange dispatch        │
│  3. User presses Enter                          │
│  4. onSubmit dispatch                           │
│  5. Engine 처리 → State 업데이트 → Field re-render│
└─────────────────────────────────────────────────┘
```

---

## Trigger

### Why?

> **"클릭을 Command로 변환한다."**

버튼 핸들러의 전통적 문제점:
- 비즈니스 로직이 onClick에 직접 작성됨
- 동일 로직이 버튼/단축키/메뉴에서 중복됨
- 테스트 시 UI 클릭 시뮬레이션 필요

**Trigger**는 이 문제를 해결합니다:
- 클릭 → Command 변환만 담당
- 로직은 중앙 Engine에서 처리
- 키보드 단축키와 동일한 Command 사용

### Usage

```tsx
import { Trigger } from "@os/ui";

function TodoItem({ todo }) {
  return (
    <Item id={todo.id}>
      <span>{todo.text}</span>
      
      {/* 간단한 버튼 */}
      <Trigger onPress={ToggleTodo({ id: todo.id })}>
        <button>✓</button>
      </Trigger>
      
      {/* asChild로 기존 컴포넌트 활용 */}
      <Trigger 
        onPress={DeleteTodo({ id: todo.id })}
        asChild
      >
        <IconButton icon="trash" />
      </Trigger>
    </Item>
  );
}
```

### Key Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `onPress` | `Command` | (필수) | 클릭 시 dispatch할 커맨드 |
| `children` | `ReactNode` | - | 버튼 내용 |
| `asChild` | `boolean` | `false` | 자식 요소에 이벤트 위임 |
| `allowPropagation` | `boolean` | `false` | 이벤트 버블링 허용 |

### 패턴: 동일 Command, 다양한 Trigger

```tsx
// 키보드 단축키 (osRegistry에서)
{ key: "Delete", command: "DELETE_TODO" }

// 버튼 클릭
<Trigger onPress={DeleteTodo({ id })}>
  <button>Delete</button>
</Trigger>

// 컨텍스트 메뉴
<MenuItem onPress={DeleteTodo({ id })}>
  삭제
</MenuItem>

// 모두 동일한 Engine 로직 실행!
```

---

## 조합 예시: Complete Todo Item

```tsx
import { Zone, Item, Field, Trigger } from "@os/ui";

function TodoItem({ todo }) {
  return (
    <Item id={todo.id} payload={todo}>
      {({ isFocused }) => (
        <div className={`flex gap-2 p-2 ${isFocused ? "bg-blue-50" : ""}`}>
          
          {/* 체크박스 */}
          <Trigger onPress={ToggleTodo({ id: todo.id })}>
            <button>{todo.done ? "☑" : "☐"}</button>
          </Trigger>
          
          {/* 텍스트 편집 */}
          <Field
            name={todo.id}
            value={todo.text}
            active={isFocused}
            onSubmit={UpdateTodo({ id: todo.id })}
          />
          
          {/* 삭제 버튼 */}
          <Trigger onPress={DeleteTodo({ id: todo.id })}>
            <button>🗑</button>
          </Trigger>
          
        </div>
      )}
    </Item>
  );
}

function TodoList({ todos }) {
  return (
    <Zone id="todo-list" strategy="roving" layout="column">
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </Zone>
  );
}
```

---

## 설계 원칙 요약

| 원칙 | 설명 |
|------|------|
| **View는 Passive** | 컴포넌트는 상태 투영만, 로직은 Engine에서 |
| **Command Centricity** | 모든 액션은 직렬화 가능한 Command |
| **Virtual Focus** | DOM focus 의존 제거, Store 기반 포커스 |
| **Active Registration** | 마운트 시 자동 등록, 수동 관리 불필요 |
| **Zero Handler** | View에 비즈니스 로직 핸들러 없음 |
