# Declarative Zone & Item 명세 (Specification)

이 문서는 Interactive OS의 핵심 네비게이션을 선언적(Declarative)으로 처리하기 위한 **Zone**과 **Item** 컴포넌트의 인터페이스 및 사용법을 정의합니다.

---

## 1. Core Concept: Focus Topology & Layout
하드코딩된 키 이벤트 핸들러(`handleKeyDown`) 대신, 컴포넌트의 **배치(Topology)**와 **내부 구조(Layout)**를 정의하여 이동 로직을 OS에 위임합니다.

### A. Macro Topology (Zone 간 이동)
- **Neighbors**: 현재 Zone의 상하좌우에 어떤 Zone이 있는지 정의합니다.
- 예: "내 왼쪽엔 사이드바가 있다" -> `ArrowLeft` 입력 시 사이드바의 마지막 포커스 지점으로 이동.

### B. Micro Topology (Item 간 이동)
- **Layout**: Zone 내부 아이템들의 배열 방식 (수직 리스트, 수평 그리드 등).
- 예: `layout="row"` -> `ArrowRight/Left`로 아이템 이동.

---

## 2. Interface Definitions

### `Zone` Primitive
Zone은 포커스 컨텍스트의 경계(Boundary)이자 네비게이션의 단위입니다.

```typescript
type Direction = 'up' | 'down' | 'left' | 'right';

interface ZoneNeighbors {
  up?: string;    // Zone ID
  down?: string;
  left?: string;
  right?: string;
}

interface ZoneProps {
  /** 고유 식별자 (필수) */
  id: string;
  
  /** 
   * Zone 간 이동 규칙 정의 (Macro Topology)
   * 정의되지 않은 방향은 이동 불가 (Bump Effect)
   */
  neighbors?: ZoneNeighbors;

  /**
   * Zone 내부 아이템 배치 방식 (Micro Topology)
   * - 'column': 수직 리스트 (ArrowUp/Down) - Default
   * - 'row': 수평 리스트 (ArrowLeft/Right) - Kanban Columns 등
   * - 'grid': 2D 격자 (All Arrows)
   */
  layout?: 'column' | 'row' | 'grid';

  /** 
   * Grid 레이아웃일 경우 한 행의 아이템 수 
   * (layout='grid' 일 때만 유효)
   */
  gridColumns?: number;

  /** 기본 포커스 아이템 ID (Zone 진입 시) */
  defaultFocusId?: string;

  children: React.ReactNode;
}
```

### `Item` Primitive
Item은 실제 포커스를 받을 수 있는 최소 단위입니다.

```typescript
interface ItemProps {
  /** 고유 식별자 (필수) */
  id: string | number;

  /** 
   * 순서 강제 지정 (옵션)
   * 생략 시 DOM 렌더링 순서 또는 Virtual List 인덱스를 따름
   */
  index?: number;

  /** 포커스/액티브 상태에 따른 스타일링을 위한 헬퍼 */
  className?: string;

  children: React.ReactNode;
}
```

---

## 3. Usage Examples

### Case 1: Standard Layout (Sidebar + List)

사이드바는 왼쪽에 고정, 투두 리스트는 오른쪽에 위치하며 수직스크롤됩니다.

```tsx
// App.tsx Layout
<div className="flex">
  
  {/* Sidebar Zone */}
  <Zone 
    id="sidebar" 
    neighbors={{ right: 'todoList' }} // 오른쪽으로 가면 투두리스트
    layout="column"
  >
    <Item id="inbox">Inbox</Item>
    <Item id="today">Today</Item>
  </Zone>

  {/* Todo List Zone */}
  <Zone 
    id="todoList" 
    neighbors={{ left: 'sidebar' }} // 왼쪽으로 가면 사이드바
    layout="column"
  >
    {todos.map(todo => (
      <Item id={todo.id}>{todo.text}</Item>
    ))}
  </Zone>

</div>
```

### Case 2: Kanban Board (Nested Zones)

칸반 보드는 **가로로 배치된 컬럼들(Zones)**의 집합입니다.
Top-level Zone이 'Row' 레이아웃을 가지고, 각 컬럼은 'Column' 레이아웃을 가집니다.

```tsx
<Zone 
  id="boardBoard" 
  neighbors={{ left: 'sidebar' }}
  layout="row" // 내부 아이템(여기서는 카테고리 컬럼)들이 가로로 배치됨
>
  {categories.map(category => (
    // 각 컬럼 자체가 하나의 중첩된 Zone (Nested Zone)
    <Zone 
      key={category.id}
      id={`col_${category.id}`}
      layout="column" // 컬럼 내부는 수직 리스트
      className="w-80"
    >
      {/* Header Item (컬럼 자체 선택 가능 시) */}
      <Item id={`header_${category.id}`}>{category.title}</Item>
      
      {/* Task Items */}
      {category.todos.map(todo => (
        <Item id={todo.id}>{todo.text}</Item>
      ))}
    </Zone>
  ))}
</Zone>
```

### Case 3: Grid (App Grid / Gallery)

```tsx
<Zone 
  id="appGrid" 
  neighbors={{ left: 'sidebar' }}
  layout="grid" 
  gridColumns={4} // 4열 그리드
>
  {apps.map((app, idx) => (
    <Item id={app.id} index={idx}>
      <AppIcon icon={app.icon} />
    </Item>
  ))}
</Zone>
```

---

## 4. Implementation Strategy

이 구조를 구현하기 위해 `useZoneNavigation` 훅을 개발하여 `Zone` 컴포넌트에 주입합니다.

1.  **Registry**: 모든 활성 Zone과 그들의 `neighbors` 정보를 중앙(Context/Store)에서 관리하지 않고, **Event Bubbling** 또는 **Local Hook Logic**으로 처리하여 결합도를 낮춥니다.
2.  **Direction Resolution**:
    - `ArrowRight` 이벤트 발생.
    - 현재 Zone의 `layout` 확인.
        - `column`이면 내부 이동 무시(또는 상위로 위임).
        - `row`이면 다음 형제 Item으로 이동.
    - 내부 이동이 불가능하거나 끝에 도달했으면, `neighbors.right` 확인.
    - `neighbors.right`가 존재하면 해당 Zone ID로 `SET_FOCUS` 디스패치.

이 방식은 코드를 획기적으로 줄여주며, "무엇을 할지(Imperative)"가 아니라 **"구조가 어떻게 생겼는지(Declarative)"**에 집중하게 합니다.
