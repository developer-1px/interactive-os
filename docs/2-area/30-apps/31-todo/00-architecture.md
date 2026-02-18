# Todo App — defineApp 첫 번째 dogfooding

> Area: 30-apps/31-todo
> Source: src/apps/todo/
> Last synced: 2026-02-18

## 개요

Todo App은 OS의 defineApp API를 사용한 **첫 번째 실제 앱**이다.
Entity CRUD(할 일 생성/수정/삭제), 카테고리 분류, 클립보드(복사/붙여넣기/잘라내기), Undo/Redo를 지원한다.

## Zone 구조

```
TodoApp (defineApp "todo-v5")
  ├── Conditions: canUndo, canRedo, isEditing, hasClipboard
  ├── Selectors: visibleTodos, categories, stats, editingTodo, todosByCategory
  └── Zones:
      ├── list     — listbox (CRUD, clipboard, ordering, undo/redo)
      ├── sidebar  — category selection + ordering
      ├── draft    — draft input field (inline fieldType)
      ├── edit     — edit input field (inline fieldType)
      └── toolbar  — view toggle, clear completed
```

## 커맨드 인벤토리

### list Zone (role: listbox)
| 커맨드 | Payload | When Guard |
|--------|---------|------------|
| toggleTodo | `{ id }` | — |
| deleteTodo | `{ id }` | — |
| startEdit | `{ id }` | — |
| moveItemUp | `{ id }` | — |
| moveItemDown | `{ id }` | — |
| duplicateTodo | `{ id }` | — |
| copyTodo | `{ id, _multi? }` | — |
| cutTodo | `{ id, _multi? }` | — |
| pasteTodo | `{ id? }` | — |
| undo | — | canUndo |
| redo | — | canRedo |

### sidebar Zone (role: listbox)
| 커맨드 | Payload | When Guard |
|--------|---------|------------|
| selectCategory | `{ id }` | — |
| moveCategoryUp | — | — |
| moveCategoryDown | — | — |

### draft Zone (role: textbox)
| 커맨드 | Payload | When Guard |
|--------|---------|------------|
| syncDraft | `{ text }` | — |
| addTodo | `{ text? }` | — |

### edit Zone (role: textbox)
| 커맨드 | Payload | When Guard |
|--------|---------|------------|
| syncEditDraft | `{ text }` | — |
| updateTodoText | `{ text }` | — |
| cancelEdit | — | isEditing |

### toolbar Zone (role: toolbar)
| 커맨드 | Payload | When Guard |
|--------|---------|------------|
| toggleView | — | — |
| clearCompleted | — | — |

## 상태 구조

```ts
interface AppState {
  data: {
    todos: Record<string, Todo>;      // id → Todo
    todoOrder: string[];               // 정렬된 ID 배열
    categories: Record<string, Category>;
    categoryOrder: string[];
  };
  ui: {
    selectedCategoryId: string;
    viewMode: "list" | "board";
    editingId: string | null;
    editDraft: string;
    draft: string;
    clipboard: { todos: Todo[]; isCut: boolean } | null;
  };
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
  };
}
```

## 파일 구조

```
src/apps/todo/
├── app.ts              — defineApp, zones, commands, conditions, selectors (642줄)
├── selectors.ts        — 파생 데이터 셀렉터
├── triggers.ts         — createTrigger 컴포넌트들
├── model/              — AppState, Todo 타입
├── features/           — 추가 기능 (persistence 등)
├── widgets/            — UI 컴포넌트 (ListView, SidebarView, etc.)
└── tests/              — Unit / E2E 테스트
```

## 설계 특징

1. **History 기반 Undo/Redo** — `{ history: true }` 옵션으로 자동 snapshot
2. **Clipboard 내부 구현** — OS clipboard와 동시에 앱 내부 상태에도 저장
3. **Focus 연동** — deleteTodo, pasteTodo 시 `FOCUS()` 커맨드를 dispatch하여 자동 포커스 이동
4. **When Guard** — undo/cancelEdit는 조건부 실행 (canUndo, isEditing)
