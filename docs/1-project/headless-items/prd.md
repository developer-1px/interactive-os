# PRD: Headless Items — DOM_ITEMS DI 정합성

## Problem Statement

commands가 DOM_ITEMS context DI를 우회하여 getItems?.()를 직접 호출.
이중 경로로 인해 tree 구조에서 navigation 깨짐 + DI 설계 모순.

## Success Criteria

1. 모든 commands가 `ctx.inject(DOM_ITEMS)` 단일 경로 사용
2. Browser에서 Builder canvas ArrowDown 작동
3. Headless 테스트 849/849 GREEN 유지
4. `goto({ items })` 수동 전달 폐기

## Functional Requirements

### FR1: Command Single Path
- navigate, select, selectAll, tab → `ctx.inject(DOM_ITEMS)` only
- `getItems?.()` 직접 호출 제거

### FR2: Browser DOM_ITEMS
- entry.element 있으면 → querySelectorAll 우선
- 없으면 → getItems fallback

### FR3: Headless DOM_ITEMS (page mock)
- Component 있으면 → renderToString → parse data-item-id
- getItems 있으면 → state에서 추출
- 없으면 → mockItems

### FR4: goto() Simplification
- items 옵션 제거 (deprecated)
- focusedItemId만 유지

## Edge Cases

- 빈 zone (items 0개) → early return (기존 동작 유지)
- zone에 element 없고 getItems도 없으면 → [] 반환
- renderToString 실패 시 → getItems fallback
- tree 구조에서 pure headless → getItems가 root만 반환해도 unit test는 OK
  (integration은 renderToString에서 커버)

## Out of Scope

- DOM_RECT 변경 (view concern, mock 유지)
- Builder getItems tree-aware 보강 (Ideas)
- itemFilter DOM 의존 제거 (Ideas)
