# PRD: Normalized Collection

## 목표

OS의 데이터 모델을 `{ entities, order }` 정규화 포맷으로 통일.
하나의 CRUD로 List/Tree/Kanban/Grid 모든 View 지원.

## Feature 목록

### F1: NormalizedCollection 타입 정의
- `entities: Record<string, T>`
- `order: Record<string, string[]>` (adjacency list)
- `""` = root level
- Helper: `allIds()`, `getChildren()`, `getParent()`, `getRoots()`

### F2: fromEntities 확장
- `orderAccessor` 반환 타입: `string[]` → `Record<string, string[]>`
- Flat 호환: `string[]`도 자동 감지하여 `{ "": order }` 로 래핑
- **기존 Todo 코드 변경 없이 동작**

### F3: Tree-aware ItemOps
- `removeItem`: 재귀 children 삭제
- `swapItems`: 같은 parent 내 swap
- `insertAfter`: parent context 지정
- `moveItem`: cross-parent move (DnD)

### F4: View Transform 순수 함수 모듈
- `toVisibleTree(collection, expandedIds)` → `FlatNode[]`
  - 기존 `flattenVisibleTree`를 도메인-무관 버전으로 대체
- `toGrouped(collection, groupByFn)` → `Map<string, string[]>`
- `toFlatList(collection)` → `string[]`

### F5: DocsSidebar 마이그레이션
- `DocItem[]` → `normalize()` → `NormalizedCollection<DocEntity>`
- `flattenVisibleTree` → `toVisibleTree` 교체
- 기존 UI 동작 유지 (시각적 변경 없음)

### F6: Todo 호환성 확인
- 기존 `fromEntities(s => s.entities, s => s.order)` 그대로 동작
- `order: string[]` → auto-wrap `{ "": order }` 또는 명시 마이그레이션

## 우선순위

| Feature | 의존성 | 난이도 |
|---------|--------|--------|
| F1 | 없음 | Low |
| F2 | F1 | Medium |
| F3 | F2 | Medium |
| F4 | F1 | Low |
| F5 | F2 + F4 | Medium |
| F6 | F2 | Low |

순서: F1 → F2 → F3 → F4 → F5 → F6
