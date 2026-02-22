# PRD — OS Collection: JSON Patch Primitive

> 이 문서는 os-collection 프로젝트의 요구사항과 설계를 정의한다.
> README.md가 Why, 이 문서가 What.

## 핵심 결정

> **RFC 6902 (JSON Patch) + RFC 6901 (JSON Pointer) + Immer inverse patches.**
> 표준이 있으면 발명하지 않는다. (rules.md #8)

## 1. 표준 레퍼런스

| 표준 | 역할 | 우리 매핑 |
|------|------|-----------|
| **RFC 6902 (JSON Patch)** | 6개 조작: `add, remove, replace, move, copy, test` | OS Collection 커맨드 |
| **RFC 6901 (JSON Pointer)** | 경로 표현: `/data/todos/abc/completed` | State path |
| **Immer `produceWithPatches`** | Patch + inverse patch 자동 생성 | Undo/Redo |
| **DOM MutationObserver** | Tree 변경 관찰 | History middleware / Inspector |
| **RTK `createEntityAdapter`** | `{ ids, entities }` 정규화 CRUD | 기존 `fromEntities` 패턴 |
| **MST UndoManager** | Action 단위 자동 그룹핑 | 1 command = 1 undo entry |

## 2. 용어 정의

| 용어 | 정의 | RFC 대응 |
|------|------|----------|
| **Patch** | JSON 문서에 대한 단일 변경 | RFC 6902 operation |
| **Path** | JSON 문서 내 위치를 가리키는 문자열 | RFC 6901 JSON Pointer |
| **Operation** | `add, remove, replace, move, copy, test` 중 하나 | RFC 6902 §4 |
| **Inverse Patch** | 변경을 되돌리는 역방향 patch | Immer `produceWithPatches` |

## 3. 조작 (RFC 6902 기반)

### 6개 표준 Operation

```typescript
// RFC 6902 그대로
{ op: "add",     path: "/data/todoOrder/-", value: "new-id" }
{ op: "remove",  path: "/data/todos/abc" }
{ op: "replace", path: "/data/todos/abc/completed", value: true }
{ op: "move",    from: "/data/todoOrder/3", path: "/data/todoOrder/0" }
{ op: "copy",    from: "/data/todos/abc", path: "/data/todos/xyz" }
{ op: "test",    path: "/data/todos/abc/completed", value: false }
```

### 축(Axis) 매핑

| 축 | RFC 6902 Operations | Focus 대응 |
|----|---------------------|-----------|
| **crud** | `add`, `remove`, `replace` | — |
| **reorder** | `move` | navigate |
| **clipboard** | `copy` + `add` (paste), `remove` + `copy` (cut) | — |
| **history** | Immer inverse patches | — |

## 4. Undo/Redo — Immer Inverse Patches

### 현재: Snapshot 기반

```
command 실행 전 → 전체 state snapshot 저장
undo → snapshot 복원
```

- 메모리: O(N × state_size) — N개 history entry × 전체 상태
- Bulk: 1 command = 1 snapshot (이미 해결)

### 미래: Patch 기반

```typescript
const [nextState, patches, inversePatches] = produceWithPatches(state, draft => {
  delete draft.data.todos["abc"];
  delete draft.data.todos["def"];
  draft.data.todoOrder = draft.data.todoOrder.filter(id => id !== "abc" && id !== "def");
});

// undo = applyPatches(currentState, inversePatches)
// redo = applyPatches(currentState, patches)
```

- 메모리: O(N × patch_size) — patch는 변경 부분만
- Bulk: 1 produce() = 1 patch set = 1 undo entry (자연스럽게 atomic)
- **Snapshot 저장 불필요** — inverse patch가 되돌리기 역할

### 마이그레이션

Phase 1: Snapshot 기반 유지 (현재 — 동작함)
Phase 2: `produceWithPatches`로 전환 — history entry에 patches/inversePatches 저장
Phase 3: Snapshot 필드 제거

## 5. 앱 선언 API

### Before (현재 — ~500줄)

```typescript
const listCollection = createCollectionZone(TodoApp, "list", {
  ...fromEntities(s => s.data.todos, s => s.data.todoOrder),
  filter: ..., text: ...,
});
export const deleteTodo = listCollection.remove;
export const moveItemUp = listCollection.moveUp;
export const copyTodo = listCollection.copy;
// ... 20개 export
```

### After (미래 — OS가 제공)

```typescript
const listZone = TodoApp.createZone("list");

listZone.bind({
  role: "listbox",

  collection: {
    entities: "data.todos",       // JSON Pointer로 entities 위치
    order: "data.todoOrder",      // JSON Pointer로 order 위치

    // 축: opt-in
    crud: true,
    reorder: true,
    clipboard: true,
    history: true,

    // Domain hooks (앱 고유 로직만)
    onCreate: (text, state) => ({
      id: uid(), text, completed: false,
      categoryId: state.ui.selectedCategoryId,
    }),
    onDelete: { confirm: "alertdialog" },
    onPaste: (item, state) => ({ ...item, categoryId: state.ui.selectedCategoryId }),
  },

  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
});
```

## 6. Nested Collection (Builder, Kanban)

JSON Pointer가 경로이므로 nesting은 자연스럽다.

```typescript
// Builder: sections (flat)
collection: {
  entities: "blocks",
  order: "blockOrder",
}

// Kanban: cards within a column (nested)
// parentId는 Zone의 context에서 결정
collection: {
  entities: (ctx) => `columns/${ctx.parentId}/cards`,
  order: (ctx) => `columns/${ctx.parentId}/cardOrder`,
}
```

Field editing (property update)은 **collection이 아니라 `replace` operation**:
```typescript
{ op: "replace", path: "/blocks/hero/fields/title", value: "New Title" }
```

## 7. 원칙

1. **표준이 있으면 발명하지 않는다.** RFC 6902/6901 그대로.
2. **Data mutation은 1 command 안에서 atomic.** `produceWithPatches` 1회 = 1 undo entry.
3. **dispatch는 cross-scope side effect만.** (overlay, toast)
4. **축은 opt-in.** 필요한 것만 선언.
5. **커널은 flat queue.** Hierarchy 불필요.
6. **Inverse patch = undo.** Snapshot 불필요.

## 8. App Coverage Matrix

| 앱 | entities path | order path | CRUD | Reorder | Clipboard | History | Nested |
|----|--------------|------------|------|---------|-----------|---------|--------|
| **Todo** | `data/todos` | `data/todoOrder` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Todo Sidebar** | `data/categories` | `data/categoryOrder` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Builder** | `blocks` | `blockOrder` | ✅ | ✅ | ✅ | ✅ | fields = replace op |
| **Kanban** | `columns/*/cards` | `columns/*/cardOrder` | ✅ | ✅ | ✅ | ✅ | 2-depth |

## 9. 점진적 마이그레이션

| Phase | 내용 | 위험도 | 기존 호환 |
|-------|------|--------|-----------|
| 1 | `produceWithPatches` 도입 — history에 patches 저장 시작 | 낮음 | 100% |
| 2 | Collection bind API — `collection: { entities, order, ... }` | 중간 | 기존 유지 + 새 API 병행 |
| 3 | Todo 마이그레이션 — 검증 | 중간 | 기존 `createCollectionZone` 제거 |
| 4 | Builder/Kanban 마이그레이션 — nested 검증 | 중간 | — |
| 5 | Snapshot 필드 제거 — patch-only undo | 낮음 | — |
