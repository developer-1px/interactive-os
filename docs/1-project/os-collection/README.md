# RFC: OS Collection — JSON CRUD Primitive

- Feature Name: `os-collection`
- Start Date: 2026-02-22

## Summary

OS가 어떤 JSON 구조든 CRUD + clipboard + undo/redo를 제공하는 primitive.
앱은 데이터 형태만 선언하고, 조작은 OS가 보장한다.

## Motivation

### 현재 문제

1. **모든 앱이 동일한 CRUD 보일러플레이트를 반복 작성한다.**
   - `deleteTodo`, `moveItemUp`, `copyTodo`, `pasteTodo`... 모든 앱에 같은 패턴.
   - `createCollectionZone`이 70%를 추상화하지만, 여전히 앱 레벨이다.

2. **Bulk mutation + undo 불일치.**
   - data mutation을 sub-dispatch로 분산하면 N개 history entry가 생긴다.
   - 원칙 발견: "data mutation은 1 command 안에서 atomic하게."
   - 이 원칙을 앱 개발자(=LLM)가 매번 기억해야 한다 → Pit of Failure.

3. **Flat collection만 지원한다.**
   - Todo: `{ todos, todoOrder }` → flat ✓
   - Builder: `{ blocks, blockOrder }` + nested fields → ?
   - Kanban: columns → cards (2-depth) → ?

### 지금까지의 Discussion 결론

1. Focus 시스템처럼 **축(axis) 기반 opt-in**.
2. 앱 데이터를 OS가 이해할 수 있는 형태로 변환하는 **lens/adapter**.
3. `dispatch`는 cross-scope side effect만, data mutation은 atomic.
4. 커널은 flat queue 유지, hierarchy 불필요.
5. **핵심 통찰: JSON 자체가 CRUD 대상.** `{ entities, order }` 정규화가 아님.

## Guide-level Explanation

### JSON = OS의 데이터 모델

앱의 상태는 JSON이다. OS는 JSON path를 기반으로 조작한다:

```typescript
// Array operation
OS_COLLECTION_REMOVE({ path: "data.todoOrder", ids: ["abc", "def"] })

// Object operation  
OS_COLLECTION_SET({ path: "data.todos.abc.completed", value: true })

// Reorder
OS_COLLECTION_MOVE({ path: "data.todoOrder", from: 2, to: 0 })
```

### 앱이 선언하는 것

```typescript
const listZone = TodoApp.createZone("list");

listZone.bind({
  role: "listbox",

  collection: {
    // JSON path만 선언
    entities: "data.todos",
    order: "data.todoOrder",
    
    // 축: opt-in
    crud: true,
    reorder: true,
    clipboard: true,
    history: true,
    
    // Domain hooks
    onCreate: (text, state) => ({
      id: uid(), text, completed: false,
      categoryId: state.ui.selectedCategoryId,
    }),
    onDelete: { confirm: "alertdialog" },
  },

  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
});
```

### Nested 지원 (Builder, Kanban)

JSON path가 기반이므로 nesting은 자연스럽다:

```typescript
// Builder: sections[] → fields는 entity의 속성
sectionZone.bind({
  collection: {
    entities: "blocks",
    order: "blockOrder",
    crud: true,
    reorder: true,
    // fields는 block 내부 속성 → 별도 collection 아님
  },
});

// Kanban: column → cards (nested collection)
cardZone.bind({
  collection: {
    // Dynamic path — context에서 columnId 결정
    entities: (ctx) => `columns.${ctx.parentId}.cards`,
    order: (ctx) => `columns.${ctx.parentId}.cardOrder`,
    crud: true,
    reorder: true,
    clipboard: true,
  },
});
```

### History는 자동

- Collection이 `history: true`이면, 모든 mutation이 자동으로 1 undo entry.
- Bulk delete = 1 command = 1 undo entry (atomic 원칙 내장).
- 앱이 `createUndoRedoCommands`를 호출할 필요 없음.

## Detailed Design

→ `prd.md`에 위임

## Drawbacks

- `createCollectionZone`에서 마이그레이션 비용.
- JSON path 기반이면 타입 안전성 확보가 difficult.
- Nested collection의 context 전달 메커니즘 설계 필요.

## Alternatives

1. **현재 유지 (createCollectionZone)**: 동작하지만 앱마다 보일러플레이트.
2. **Lens 기반 (into/from)**: 타입 안전하지만 flat only.
3. **Immer patch 기반 undo**: 자동이지만 granularity 제어 어려움.

## Unresolved Questions

1. JSON path의 타입 안전성을 어떻게 보장할 것인가?
2. Nested collection의 parentId context는 어디서 오는가?
3. Builder의 field editing (property update)도 collection인가, 별도 축인가?
4. `into/from` lens vs JSON path — 어느 것이 최종 API인가?
5. 기존 `createCollectionZone` 앱들의 점진적 마이그레이션 전략.
