# BOARD — item-expand-primitives

> Phase: Heavy | Created: 2026-02-24

## Now

- [x] **T7**: Item.CheckTrigger 구현 + Todo 전환 ✅
  - `isCheckTrigger` → OS_FOCUS + OS_CHECK, suppress onAction
  - `simulateClick({ checkTrigger })` + `OsPage.click` 타입 확장
  - `Item.CheckTrigger` 컴포넌트 추가 (Object.assign namespace merge)
  - `TaskItem.tsx`: `triggers.ToggleTodo payload={{ id }}` → `Item.CheckTrigger`
  - 5 cases RED→GREEN (948/948 전체 GREEN)
- [x] **T1**: ItemContext 추가 ✅
  - `ItemContext.Provider`로 children 감쌈 → zoneId + itemId 전달
  - `useItemContext()` hook — Item 밖에서 사용 시 에러

- [x] **T2**: Item.ExpandTrigger 구현 ✅
  - ItemContext 읽기 → OS_FOCUS + OS_EXPAND dispatch
  - asChild 지원 (cloneElement로 merge)
  - `data-expand-trigger` DOM 투사
  - `Object.assign(Item, { ExpandTrigger })` namespace merge

- [x] **T3**: Item.ExpandContent 구현 ✅
  - ItemContext 읽기 → isExpanded 구독
  - expanded일 때만 children 렌더 (null return on collapsed)
  - `Object.assign(Item, { ExpandContent })` namespace merge

- [x] **T4**: resolveMouse 확장 + headless click 확장 ✅
  - `MouseInput.isExpandTrigger` → focus + expand, onAction 억제
  - `simulateClick`, `OsPage.click`에 `expandTrigger` 옵션
  - 6 cases RED → GREEN (943/943 전체 GREEN)

- [x] **T5**: DocsSidebar 전환 ✅
  - render prop `{({ isFocused, isExpanded }) => ...}` 제거
  - `Item.ExpandTrigger asChild` + `Item.ExpandContent` 선언적 패턴
  - CSS `[data-focused_&]` / `[data-expanded_&]` 기반 스타일링
  - tsc 0 errors, 943/943 GREEN

- [x] **T6**: BDD 시나리오 통합 ✅
  - item-expand.test.ts 6 cases: expand toggle, collapse, onAction 억제, focus, keyboard regression
  - DocsSidebar tsc/regression으로 T5 커버

## Done

- [x] D0: Discussion — 선언적 Tree 설계, 네이밍 확정
- [x] T1: ItemContext ✅
- [x] T2: Item.ExpandTrigger ✅
- [x] T3: Item.ExpandContent ✅
- [x] T4: resolveMouse + headless 확장 ✅ (6 RED→GREEN)
- [x] T5: DocsSidebar 전환 ✅
- [x] T6: BDD 통합 ✅

## Ideas

- `Item.SelectTrigger` — 클릭 → 선택 토글
- `Item.CheckTrigger` — 클릭 → 체크 토글
- `[Primitive].[Intent][Role]` 패턴 체계화
