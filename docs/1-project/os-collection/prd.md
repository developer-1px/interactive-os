# PRD — OS Collection: 프론트엔드 JSON DB

> OS는 프론트엔드의 JSON DB다.
> 앱은 read/write 함수로 데이터를 맡기고, OS가 모든 CRUD/clipboard/undo를 보장한다.

## 1. 표준

| 표준 | 역할 |
|------|------|
| **RFC 6902 (JSON Patch)** | 6개 조작: `add, remove, replace, move, copy, test` |
| **RFC 6901 (JSON Pointer)** | 경로 표현: `/data/todos/abc` |
| **Immer `produceWithPatches`** | Patch + inverse patch → undo/redo |

## 2. 앱의 유일한 선언: read/write 함수

```typescript
const collection = os.collection({
  read: (state) => ({ entities: state.data.todos, order: state.data.todoOrder }),
  write: (state, { entities, order }) => ({
    ...state, data: { ...state.data, todos: entities, todoOrder: order }
  }),
  create: (text) => ({ id: uid(), text, completed: false }),
});
```

- `read`: 앱 state에서 entities + order를 꺼내는 함수
- `write`: OS가 수정한 entities + order를 앱 state에 써넣는 함수
- `create`: 새 entity 팩토리 (도메인 고유)
- **이것만 있으면 OS가 모든 CRUD 커맨드를 생성한다**

## 3. OS가 생성하는 커맨드

앱이 만드는 것이 아니라, OS가 만들어준다:

| 커맨드 | RFC 6902 | 설명 |
|--------|----------|------|
| `collection.add(item)` | `add` | entity 추가 |
| `collection.remove({ id })` | `remove` | entity 삭제 |
| `collection.update({ id, changes })` | `replace` | entity 수정 |
| `collection.move({ from, to })` | `move` | 순서 변경 |
| `collection.copy({ id })` | `copy` | entity 복제 |
| `collection.undo()` | — | inverse patches 적용 |
| `collection.redo()` | — | patches 재적용 |

## 4. UI가 계약이다

- 삭제 Trigger가 UI에 있으면 → `collection.remove` 작동
- 없으면 → 작동 안 함
- 설정이 아니라 UI의 존재가 기능의 존재

## 5. Undo/Redo: Immer Inverse Patches

```typescript
// OS 내부: 모든 collection command를 produceWithPatches로 실행
const [nextState, patches, inversePatches] = produceWithPatches(state, draft => {
  // RFC 6902 operation 수행
});

// history에 patches/inversePatches 저장
// undo = applyPatches(state, inversePatches)
// redo = applyPatches(state, patches)
```

- snapshot 불필요 — inverse patches가 undo
- 1 command = 1 produce = 1 undo entry (atomic 자동 보장)

## 6. Nested (Builder, Kanban)

```typescript
// Builder: flat, fields는 entity 속성
os.collection({
  read: (s) => ({ entities: s.blocks, order: s.blockOrder }),
  write: (s, { entities, order }) => ({ ...s, blocks: entities, blockOrder: order }),
});

// Kanban: nested — context로 parent 지정
os.collection({
  read: (s, ctx) => ({
    entities: s.columns[ctx.parentId].cards,
    order: s.columns[ctx.parentId].cardOrder,
  }),
  write: (s, { entities, order }, ctx) => {
    s.columns[ctx.parentId].cards = entities;
    s.columns[ctx.parentId].cardOrder = order;
    return s;
  },
});
```

## 7. 마이그레이션

| Phase | 내용 |
|-------|------|
| 1 | `produceWithPatches` 도입 — history에 patches 저장 |
| 2 | `createCollectionZone`에 read/write lens 내부 전환 |
| 3 | OS 레벨 collection API 노출 |
| 4 | Todo 마이그레이션 → 앱 CRUD 커맨드 제거 |
| 5 | Builder/Kanban 검증 |
