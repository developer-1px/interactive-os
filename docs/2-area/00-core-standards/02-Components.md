# 컴포넌트: 코어 프리미티브 (ZIFT)

Interaction OS는 DOM과 커맨드 엔진 사이의 인터페이스 역할을 하는 4개의 "소버린 프리미티브(Sovereign Primitives)" — ZIFT — 위에 구축됩니다.

> **구현 위치**: `src/os/features/focus/primitives/` (FocusGroup, FocusItem)

## 1. `<Zone />` (관할권)
포커스와 키바인딩을 위한 공간적 컨텍스트를 정의합니다. 한 번에 하나의 Zone만 "활성(Active)" 상태입니다.

```tsx
<Zone id="sidebar" role="listbox">
  {/* 아이템들 */}
</Zone>
```

- **Props**: `id` (필수), `role` (ARIA 역할 프리셋).
- **커맨드 바인딩**: `onAction` (Enter), `onSelect` (Space/선택 변경).

## 2. `<Item />` (객체)
Zone 내에서 개별적이고 상호작용 가능한 객체를 나타냅니다. 선택과 포커스 가시성을 처리합니다.

```tsx
<Item id="task-1" className="flex row p-2">
  <span>우유 사기</span>
</Item>
```

- **Props**: `id` (필수), `asChild` (Radix 패턴).

## 3. `<Field />` (속성)
키 입력을 엔진에 연결하는 커맨드 인식 입력 프리미티브입니다.

```tsx
<Field
    value={todo.text}
    onChange={UpdateDraft({ id: todo.id })}
    onSubmit={SaveTodo({ id: todo.id })}
/>
```

- **Props**: `value`, `onChange` (실시간 동기화), `onSubmit` (Enter/Blur), `onCancel` (Escape).

## 4. `<Trigger />` (동사)
버튼, 체크박스 또는 액션을 트리거하는 모든 요소를 래핑합니다.

```tsx
<Trigger onPress={DeleteTodo({ id: 1 })}>
  <button>삭제</button>
</Trigger>
```

- **Props**: `onPress` (필수), `allowPropagation`.

## 구현 원칙
- **관심사 분리**: 이 프리미티브들이 "어떻게(How)"(DOM 이벤트, ref)를 처리하여, 개발자가 "무엇을(What)"(커맨드)에만 집중할 수 있게 합니다.
- **Prop 드릴링 없음**: 컴포넌트가 엔진이나 컨텍스트에 직접 연결하여, 깊은 prop 트리를 방지합니다.
