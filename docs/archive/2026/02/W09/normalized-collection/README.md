# Normalized Collection

- Feature Name: `normalized-collection`
- Start Date: 2026-02-24

## Summary

OS의 데이터 모델을 `{ entities, order }` 정규화 포맷으로 통일한다.
기존 `fromEntities`의 flat-only order를 tree-aware adjacency list로 확장하여,
하나의 CRUD 인터페이스로 List/Tree/Kanban/Grid 모든 View를 지원한다.

## Motivation

현재 `fromEntities`는 flat list(`string[]`)만 처리. Tree는 별도 `DocItem[]` nested 구조 + `flattenVisibleTree`로 우회.
앱마다 도메인 자료구조를 직접 관리 → CRUD 중복 → DnD/Clipboard/Undo가 View마다 다르게 동작.

**rules.md Project #3 (2026-02-24 확정)**:
> 도메인은 도메인답게, UI는 UI답게, 경계에 순수 함수.

이 원칙의 구현체.

## Guide-level explanation

```typescript
interface NormalizedCollection<T extends { id: string }> {
  entities: Record<string, T>;
  order: Record<string, string[]>;  // "" = root, parentId = children
}
```

**Flat list** (Todo):
```typescript
{ entities: { a: {...}, b: {...} }, order: { "": ["a", "b"] } }
```

**Tree** (DocsSidebar):
```typescript
{
  entities: { f1: {...}, d1: {...}, d2: {...} },
  order: { "": ["f1"], "f1": ["d1", "d2"] }
}
```

**View = Pure Projection**:
- List: `order[""]`
- Tree: `toVisibleTree(collection, expandedIds)`
- Kanban: `groupBy(order[""], id => entities[id].status)`
- Grid: `order[""]` × columnDefs

**CRUD = View-agnostic**:
- `add(collection, entity, parentId?, index?)`
- `remove(collection, id)` — 재귀 children 삭제
- `move(collection, id, newParentId, newIndex)` — DnD의 본질
- `update(collection, id, patch)`

## Reference-level explanation

### fromEntities 확장

```typescript
// Before
fromEntities(
  s => s.entities,
  s => s.order,          // string[]
)

// After
fromEntities(
  s => s.entities,
  s => s.order,          // Record<string, string[]>
)
```

### ItemOps 변경점

| Op | Before (flat) | After (tree-aware) |
|----|---------------|-------------------|
| getItems | `order.map(id => entities[id])` | `allIds(order).map(...)` |
| removeItem | `order.splice(idx, 1)` | 재귀 children 삭제 + parent order에서 제거 |
| swapItems | `[order[a], order[b]] = swap` | 같은 parent 내 swap |
| insertAfter | `order.splice(idx, 0, id)` | `order[parentId].splice(idx, 0, id)` |

### View Transform 함수들

| Transform | Input | Output | 용도 |
|-----------|-------|--------|------|
| `toFlatList` | `order[""]` | `string[]` | ListView |
| `toVisibleTree` | `order` + `expandedIds` | `FlatNode[]` | TreeView |
| `toGrouped` | `order[""]` + `groupBy` fn | `Map<string, string[]>` | KanbanView |

### 마이그레이션

| App | Before | After |
|-----|--------|-------|
| Todo | `{ entities, order: string[] }` | `{ entities, order: { "": [...] } }` |
| DocsSidebar | `DocItem[]` → `flattenVisibleTree` | `normalize(DocItem[])` → `toVisibleTree` |
| Builder | blocks + order | 동일 패턴 자연 적용 |

## Drawbacks

- `order` 타입 변경 → Todo 등 기존 flat 컬렉션 마이그레이션 필요 (minimal)
- `remove` 시 parent 탐색 O(parents) — 대규모 컬렉션에서 성능 고려 필요

## Unresolved questions

- [ ] `parentId` lookup을 위한 역인덱스(`childToParent: Record<string, string>`) 필요 여부
- [ ] 기존 `accessor` 방식과 `fromEntities` 방식의 통일 여부
