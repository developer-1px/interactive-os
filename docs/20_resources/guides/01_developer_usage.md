# 개발자 가이드: 인터랙션 OS 기반 개발

이 가이드에서는 커맨드 패턴(Command Pattern)을 사용하여 새로운 기능을 추가하는 방법을 설명합니다.

## 1. 개념: 기능 조각 (The Feature Slice)
일반적으로 하나의 기능은 다음 요소들로 구성됩니다:
1.  **상태 (State)**: Zustand 또는 React State로 관리됩니다.
2.  **커맨드 (Commands)**: 사용자가 수행할 수 있는 동작의 정의입니다 (`ADD_TODO`, `DELETE_TODO`).
3.  **키바인딩 (Keybindings)**: 커맨드에 매핑된 단축키입니다.
4.  **뷰 (View)**: 프리미티브를 사용하는 React 컴포넌트입니다.

## 2. 커맨드 정의 (Defining Commands)
`CommandRegistry`를 사용하여 커맨드를 정의하십시오.

```typescript
import { defineCommand } from '@/lib/command';

export const AddTodo = defineCommand({
  id: 'ADD_TODO',
  label: '새 할 일 추가',
  label: '새 할 일 추가',
  // keybinding은 이제 todo_keys.ts에서 별도로 관리합니다.
  when: 'ctx.zone == "main"', // 문맥 조건 (Context Condition)
  run: (state, payload) => {
    return {
      ...state,
      todos: [...state.todos, { id: Date.now(), text: payload.text }]
    };
  }
});
```

### 2.1. 설계 원칙: 왜 `when`은 문자열인가요? (Why String?)

`when` 속성은 함수가 아닌 문자열로 정의됩니다. 이는 다음과 같은 중요한 이유 때문입니다:

1.  **관측 가능성 (Observability)**: 커맨드 인스펙터(`Cmd+D`)는 문자열로 된 조건을 화면에 표시하고, 현재 컨텍스트에 대해 시각적으로 '참/거짓'을 평가할 수 있습니다. 함수는 내부를 들여다볼 수 없습니다.
2.  **직렬화 (Serializability)**: 커맨드 정의를 JSON 형태로 저장하거나 전송할 수 있게 하여, 원격 설정이나 플러그인 시스템 확장을 가능하게 합니다.
3.  **역할 분리**:
    - `when` (String): **컨텍스트(Context)** 확인 (Focus, Mode, Zone 등 환경 요인)
    - `enabled` (Function): **데이터(State)** 확인 (권한, 데이터 개수 등 비즈니스 로직)

```typescript
// 권장 패턴
{
  id: 'DELETE_ITEM',
  when: '!isEditing', // 환경 확인 (Inspector에서 보임)
  enabled: (state) => state.selectedCount > 0 // 데이터 로직 (Inspector에서 안 보임)
}
```

## 3. 커맨드 등록 (Registering Commands)
애플리케이션 루트 또는 기능 로더(Feature Loader) 내에서 커맨드를 등록하십시오.

```typescript
// definition.ts
import { CommandRegistry } from '@/lib/command';
import { AddTodo, DeleteTodo } from './commands';

export const registry = new CommandRegistry();
registry.register(AddTodo);
registry.register(DeleteTodo);
```

### 커맨드 그룹 (Command Groups)
`when` 조건(관할권)을 공유하도록 커맨드들을 그룹화할 수 있습니다.

```typescript
registry.registerGroup({
  id: 'todo-actions',
  when: 'ctx.activeZone == "todo-list"',
  commands: [ToggleDone, DeleteTodo]
});
```

## 4. 뷰에서 프리미티브 사용 (Using Primitives in the View)
소브린 프리미티브(Sovereign Primitives)를 사용하여 UI를 이러한 커맨드에 바인딩하십시오.

```tsx
import { Zone, Item, Trigger, Field } from '@/lib/primitives';
import { AddTodo, DeleteTodo } from './commands';

export const TodoList = ({ todos }) => {
  return (
    <Zone id="todo-list" defaultFocusId={todos[0]?.id}>
      {todos.map(todo => (
        <Item id={todo.id} key={todo.id}>
           <Field 
              value={todo.text} 
              commitCommand={AddTodo} // Enter 키 입력 시 저장
           />
           <Trigger command={DeleteTodo}>
              <button>삭제</button>
           </Trigger>
        </Item>
      ))}
    </Zone>
  );
};
```

## 5. 디버깅 (Debugging)
`Cmd+D` 또는 `Cmd+E` (개발 모드 전용)를 눌러 **커맨드 인스펙터(Command Inspector)**를 그십시오.
- **레지스트리 탭 (Registry Tab)**: 활성/비활성 커맨드와 비활성 이유(`when` 컬럼 확인)를 볼 수 있습니다.
- **추적 탭 (Trace Tab)**: 디스패치된 커맨드의 이력과 상태 변경 사항(Diff)을 확인할 수 있습니다.
