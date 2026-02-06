# Zone-Item-Field-Trigger (ZIFT) 명세서

> Interaction OS v8.160 — 이상적인 구조 설계

## 1. 개요

**ZIFT**는 Antigravity Interaction OS의 고수준 **Facade Pattern**으로, 복잡한 포커스 시스템을 4개의 직관적인 시맨틱 컴포넌트로 추상화합니다.

```
Zone → 영역(Jurisdiction)
Item → 공간적 단위(Spatial Anchor)  
Field → 텍스트 입력(Editable Content)
Trigger → 명령 실행(Command Dispatcher)
```

### 1.1 철학적 배경

| 원칙 | 설명 |
|:---|:---|
| **역할 기반 설계** | ARIA 역할 프리셋이 동작을 결정 (코드 < 선언) |
| **Passive Primitive** | 컴포넌트는 상태를 "투영"만 하며, 직접 제어하지 않음 |
| **DOM-Direct Sourcing** | React 등록 순서가 아닌 물리적 DOM 순서가 진실의 원천 |
| **Pure Command Protocol** | 모든 상호작용은 Read → Compute → Write 순환을 따름 |

---

## 2. 계층 구조

```
┌─────────────────────────────────────────────────────────┐
│                     Facade Layer                        │
│   Zone ─── Item ─── Field ─── Trigger                   │
├─────────────────────────────────────────────────────────┤
│                    Primitive Layer                      │
│   FocusGroup ──────── FocusItem                         │
├─────────────────────────────────────────────────────────┤
│                     Core Layer                          │
│   FocusGroupStore ─── FocusData ─── Pipeline (runOS)    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Zone (영역)

### 3.1 목적
**포커스 관할권(Jurisdiction)** 정의. 내부 아이템들의 탐색, 선택, 활성화 규칙을 설정합니다.

### 3.2 이상적인 API

```tsx
interface ZoneProps {
  // Identity
  id?: string;

  // Behavior (Role Preset)
  role?: 'listbox' | 'menu' | 'tree' | 'tablist' | 'toolbar' | 'grid' | string;

  // Advanced Overrides (use sparingly)
  options?: {
    navigate?: { orientation?: 'vertical' | 'horizontal' | 'both'; loop?: boolean; seamless?: boolean };
    tab?: { behavior?: 'trap' | 'escape' | 'flow' };
    select?: { followFocus?: boolean; mode?: 'single' | 'multiple' };
  };

  // Command Binding (Bridge)
  onAction?: BaseCommand;   // Enter 키
  onSelect?: BaseCommand;    // Space 키
}
```

### 3.3 사용 예시

```tsx
// Standard: Role이 모든 동작을 결정
<Zone id="sidebar" role="listbox">
  <Item id="home">Home</Item>
  <Item id="settings">Settings</Item>
</Zone>

// Advanced: 특수 동작 오버라이드
<Zone 
  id="toolbar" 
  role="toolbar"
  options={{ navigate: { orientation: 'horizontal' } }}
>
  <Trigger onPress={Bold()}>B</Trigger>
  <Trigger onPress={Italic()}>I</Trigger>
</Zone>
```

### 3.4 Role Preset 참조

| Role | Navigate | Tab | Select |
|:---|:---|:---|:---|
| `listbox` | vertical, loop | trap | followFocus: true |
| `menu` | vertical | trap | followFocus: true |
| `tree` | vertical | flow | single |
| `tablist` | horizontal | trap | followFocus: true |
| `toolbar` | horizontal | flow | - |
| `grid` | both | flow | - |

---

## 4. Item (공간적 단위)

### 4.1 목적
Zone 내에서 **포커스 가능한 지점**을 표시. 선택(selection)과 활성화(activation)의 대상입니다.

### 4.2 이상적인 API

```tsx
interface ItemProps {
  // Identity (Required)
  id: string | number;

  // Composition
  asChild?: boolean;              // Slot 패턴으로 자식에게 속성 전달
  children: ReactNode | ((state: ItemState) => ReactNode);

  // Data Binding
  payload?: any;                  // 도메인 데이터 연결
  selected?: boolean;             // 외부 선택 상태

  // Accessibility
  role?: 'option' | 'menuitem' | 'treeitem' | 'tab' | string;
}

interface ItemState {
  isFocused: boolean;    // 포커스 + 활성 Zone
  isSelected: boolean;   // 선택됨
  isAnchor: boolean;     // 포커스 + 비활성 Zone (재진입 앵커)
}
```

### 4.3 사용 예시

```tsx
// Render Props: 상태 기반 스타일링
<Item id={todo.id}>
  {({ isFocused, isSelected }) => (
    <div className={cn(
      isFocused && 'ring-2 ring-blue-500',
      isSelected && 'bg-blue-100'
    )}>
      {todo.title}
    </div>
  )}
</Item>

// asChild: DOM 요소 재사용
<Item id="card-1" asChild>
  <article className="card">
    <h3>Title</h3>
    <p>Description</p>
  </article>
</Item>
```

### 4.4 자동 투영 (Auto-Projection)

Item은 다음 ARIA 속성을 자동으로 투영합니다:

| 속성 | 조건 |
|:---|:---|
| `tabIndex` | focused: 0, others: -1 (Roving TabIndex) |
| `aria-current` | isFocused && isActive |
| `aria-selected` | isSelected (boolean) |
| `aria-expanded` | role="treeitem" 또는 "button"일 때 |

---

## 5. Field (텍스트 입력)

### 5.1 목적
**편집 가능한 텍스트 영역**. 키보드 파이프라인과 통합되어 IME, 커밋, 취소를 관리합니다.

### 5.2 이상적인 API

```tsx
interface FieldProps {
  // Content
  value: string;
  name: string;
  placeholder?: string;
  multiline?: boolean;

  // Mode (Critical)
  mode?: 'immediate' | 'deferred';

  // Commands
  onSubmit?: BaseCommand;   // Enter 시 디스패치
  onChange?: BaseCommand;   // 입력 중 실시간 동기화
  onCancel?: BaseCommand;   // Escape 시 디스패치

  // Focus Control
  target?: 'real' | 'virtual';   // 가상 포커스 (combobox)
  controls?: string;             // aria-controls 대상
}
```

### 5.3 Mode 비교

| 모드 | 동작 | 사용 사례 |
|:---|:---|:---|
| **immediate** | 포커스 즉시 편집 가능 | 검색창, 채팅 입력 |
| **deferred** | 포커스 후 Enter 눌러야 편집 | 리스트 내 인라인 편집, 스프레드시트 셀 |

### 5.4 사용 예시

```tsx
// Immediate Mode: 항상 편집 가능
<Field
  name="search"
  value={query}
  placeholder="Search..."
  mode="immediate"
  onChange={UpdateSearch({ query })}
/>

// Deferred Mode: 선택 후 Enter로 편집 진입
<Item id={todo.id}>
  <Field
    name="EDIT"
    value={todo.title}
    mode="deferred"
    onSubmit={UpdateTodo({ id: todo.id })}
    onCancel={CancelEdit({ id: todo.id })}
  />
</Item>
```

### 5.5 시각적 상태 구분

```
┌────────────────────────────────────────────┐
│ Default     │ 기본 스타일                  │
├────────────────────────────────────────────┤
│ Focused     │ Focus ring (선택됨)          │
├────────────────────────────────────────────┤
│ Editing     │ Blue ring + Tint (편집 중)   │
└────────────────────────────────────────────┘
```

---

## 6. Trigger (명령 실행)

### 6.1 목적
**클릭/Enter 시 명령 디스패치**. 버튼, 아이콘, 체크박스 등의 인터랙션을 캡슐화합니다.

### 6.2 이상적인 API

```tsx
interface TriggerProps {
  // Command (Required)
  onPress: BaseCommand;

  // Identity (Optional: 포커스 참여)
  id?: string;

  // Composition
  asChild?: boolean;
  children: ReactNode;

  // Behavior
  allowPropagation?: boolean;  // 이벤트 버블링 허용
}
```

### 6.3 사용 예시

```tsx
// Basic: 버튼 자동 생성
<Trigger onPress={DeleteItem({ id: item.id })}>
  Delete
</Trigger>

// asChild: 기존 버튼 사용
<Trigger onPress={ToggleTodo({ id: todo.id })} asChild>
  <Checkbox checked={todo.completed} />
</Trigger>

// Focusable: Zone 내 탐색 참여
<Zone role="toolbar">
  <Trigger id="bold" onPress={Bold()}>B</Trigger>
  <Trigger id="italic" onPress={Italic()}>I</Trigger>
</Zone>
```

### 6.4 Trigger의 이중성

- **ID 없음**: 순수 명령 디스패처 (클릭만)
- **ID 있음**: FocusItem + 명령 디스패처 (키보드 탐색 + Enter 활성화)

---

## 7. ZIFT 조합 패턴

### 7.1 Todo Item 패턴 (표준)

```tsx
<Zone id="todos" role="listbox">
  {todos.map(todo => (
    <Item id={todo.id} key={todo.id}>
      {({ isFocused }) => (
        <div className={cn('flex items-center gap-2', isFocused && 'ring')}>
          
          {/* Toggle Trigger */}
          <Trigger onPress={ToggleTodo({ id: todo.id })}>
            <Checkbox checked={todo.completed} />
          </Trigger>
          
          {/* Text Field */}
          <Field
            name="EDIT"
            value={todo.title}
            mode="deferred"
            onSubmit={UpdateTodo({ id: todo.id })}
          />
          
          {/* Delete Trigger */}
          <Trigger onPress={DeleteTodo({ id: todo.id })}>
            <TrashIcon />
          </Trigger>
          
        </div>
      )}
    </Item>
  ))}
</Zone>
```

### 7.2 Draft Field 통합 패턴

```tsx
<Zone id="main" role="listbox">
  {/* Draft: 첫 번째 Item으로 통합 */}
  <Field
    name="DRAFT"
    value={draft}
    mode="immediate"
    placeholder="Add a task..."
    onSubmit={CreateTodo()}
  />
  
  {/* List Items */}
  {todos.map(todo => (
    <Item id={todo.id}>...</Item>
  ))}
</Zone>
```

> **이점**: Draft와 List가 동일 Zone에 있어 ArrowUp/Down으로 원활하게 전환

### 7.3 Nested Zone 패턴 (Tree)

```tsx
<Zone id="file-tree" role="tree">
  <Item id="folder-1" role="treeitem">
    <span>Folder 1</span>
    <Zone id="folder-1-children" role="group">
      <Item id="file-1" role="treeitem">File 1</Item>
      <Item id="file-2" role="treeitem">File 2</Item>
    </Zone>
  </Item>
</Zone>
```

---

## 8. 설계 원칙 요약

### 8.1 하지 말아야 할 것 (Anti-Patterns)

| ❌ Anti-Pattern | ✅ Correct Pattern |
|:---|:---|
| FocusGroup/FocusItem 직접 사용 | Zone/Item Facade 사용 |
| 수동 `tabIndex` 관리 | Roving TabIndex 자동 관리 |
| `onClick`에서 focus 호출 | Pipeline의 OS_FOCUS 사용 |
| 개별 config props 나열 | `options` 객체로 그룹화 |
| 별도 Zone으로 Input 분리 | 같은 Zone에 Field 통합 |

### 8.2 핵심 보장

1. **Transactional Atomicity**: 상태 변경은 `runOS`의 단일 트랜잭션
2. **DOM-Direct Sourcing**: 시각적 순서 = 탐색 순서
3. **Self-Healing Recovery**: 아이템 제거 시 포커스 자동 복구
4. **Zero Manual Focus**: `.focus()` 호출 금지, 상태 투영만

---

## 9. 마이그레이션 체크리스트

- [ ] `FocusGroup` → `Zone`으로 교체
- [ ] `FocusItem` → `Item`으로 교체
- [ ] Input/List 별도 Zone → 통합 Zone으로 병합
- [ ] 레거시 `bindActivateCommand` → `onAction`로 교체
- [ ] 레거시 `commitCommand` → `onSubmit`로 교체
- [ ] 수동 selection 관리 → `role` preset 활용
- [ ] `tabIndex` 하드코딩 제거

---

*Interaction OS v8.160 ZIFT Specification (2026-02-06)*
