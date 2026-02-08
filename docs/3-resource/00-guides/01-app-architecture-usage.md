# Antigravity App Architecture 사용 가이드 (Usage)

이 가이드는 새로운 "Smart Core, Dumb App" 아키텍처를 사용하여 앱을 만드는 표준 패턴을 제시합니다.

## 1단계: 모델 정의 (Model Definition)
가장 먼저 데이터 구조(`Draft`)와 명령(`Types`)을 정의합니다. 순수 데이터만 다룹니다.

```typescript
// model/types.ts
export interface AppState {
  data: {
    todos: Record<number, Todo>;
    // ... 정규화된 데이터
  };
  ui: {
    filter: 'all' | 'active';
  };
}

export const INITIAL_STATE: AppState = { ... };
```

## 2단계: 커맨드 작성 (Define Commands)
데이터를 변경하는 유일한 방법은 `Command`입니다. `Immer`를 사용하여 불변성을 관리합니다.

```typescript
// features/list.ts
export const AddTodo = defineCommand({
  id: "ADD_TODO",
  run: (state, payload) => produce(state, draft => {
    // 순수 로직: UI 상태 읽기 -> 데이터 쓰기 -> UI 리셋
    const text = draft.ui.entryText;
    draft.data.todos[Date.now()] = { text };
    draft.ui.entryText = ""; 
  })
});
```

## 3단계: 엔진 조립 (Assemble Engine)
여기가 핵심입니다. `createCommandStore`를 사용하여 앱의 두뇌(Engine)를 만듭니다.
**더 이상 수동으로 저장(Persistence)하거나 실행 취소(Undo)를 구현하지 않습니다.**

```typescript
// lib/engine.tsx
import { createCommandStore } from "@os/features/command/store";

// 1. 레지스트리 생성
const REGISTRY = new CommandRegistry();
REGISTRY.register(AddTodo);
REGISTRY.setKeymap(MY_KEYMAP);

// 2. 스토어 생성 (선언적 설정)
export const useMyStore = createCommandStore(
  REGISTRY,
  INITIAL_STATE,
  {
    // OS에게 "이 키로 데이터 영속성을 관리해줘"라고 위임
    persistence: { 
      key: "my-app-v1",
      debounceMs: 1000 
    },
    
    // 비즈니스 로직 미들웨어 (선택)
    onStateChange: myMiddleware
  }
);
```

## 4단계: UI 연결 (Connect View)
UI는 엔진 내부를 알 필요 없이, `useCommandCenter`를 통해 필요한 데이터와 액션만 받습니다.

```typescript
// widgets/MyView.tsx
export function MyView() {
  // 엔진에서 상태와 커맨드 실행기(dispatch)를 가져옴
  const { state, dispatch } = useEngine(); // useMyStore 기반 커스텀 훅
  
  return (
    <OS.Zone id="main">
       {state.data.todos.map(todo => (
         <OS.Item 
           key={todo.id} 
           onClick={() => dispatch({ type: 'TOGGLE', payload: todo.id })}
         >
           {todo.text}
         </OS.Item>
       ))}
    </OS.Zone>
  );
}
```

## 핵심 변화 요약
1.  **영속성(Persistence) 코드 삭제**: `localStorage`를 직접 호출하던 코드가 설정(`config`) 한 줄로 대체됨.
2.  **순수 함수 커맨드**: 커맨드는 오직 `state`만 변경하며, 사이드 이펙트(저장, 네트워크 등)는 OS나 미들웨어가 처리.
3.  **OS 인프라 활용**: 포커스, 단축키 처리, 실행 취소 등은 OS가 자동으로 제공.
