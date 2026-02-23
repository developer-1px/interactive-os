# RFC: Headless Items — DOM_ITEMS DI 정합성

## Summary

commands가 DOM_ITEMS context를 DI로 inject하면서도 `getItems?.()` 직접 호출하는
이중 경로를 제거한다. DOM_ITEMS provider가 환경에 따라 해석하는 단일 경로로 통합.

## Motivation

Discussion에서 도출된 문제:

1. **accessor-first 이중 경로**: navigate/select/selectAll/tab이 `getItems?.() ?? ctx.inject(DOM_ITEMS)`로
   DI를 우회. DI를 쓰면서 DI를 안 쓰는 설계 모순.

2. **Builder tree 깨짐**: getItems()가 root blocks만 반환. tree의 nested items 누락.
   itemFilter가 DOM data-level 읽음 → headless 불가.

3. **뷰 로직 재구현**: getItems는 "React가 뭘 렌더했는가"를 state에서 재현하려는 시도.
   flat OK, tree에서 깨짐, virtual scroll이면 더 불가.

### Design Principle (from Discussion)

- **commands는 inject만**: `ctx.inject(DOM_ITEMS)`. 분기 없음.
- **provider가 환경 판단**: browser=DOM, headless+React=renderToString, pure headless=getItems
- **데이터가 진실, DOM은 투영**: React의 독자적 가시성 결정 최소화
- **두 레벨의 정석**: Unit(getItems), Integration(renderToString)

## Detailed Design

### 1. Commands — inject only

```ts
// navigate, select, selectAll, tab — 전부 동일
const items: string[] = ctx.inject(DOM_ITEMS);
// getItems?.() 직접 호출 제거
```

### 2. DOM_ITEMS Provider (browser, 2-contexts/index.ts)

```
element 있으면 → querySelectorAll("[data-item-id]") → 렌더된 진실
없으면          → getItems() → headless fallback
```

### 3. DOM_ITEMS Provider (page mock, defineApp.page.ts)

```
Component 있으면 → renderToString → parse data-item-id → 렌더된 진실
getItems 있으면  → state에서 추출 (pure headless)
없으면           → mockItems (수동 fallback)
```

### 4. goto() — items 옵션 폐기

Component가 있으면 items 자동 추출. 없으면 getItems.
`goto({ items })` 수동 전달은 deprecated → 제거.

## Drawbacks

- renderToString은 querySelectorAll보다 느림 (테스트만 해당)
- pure headless(getItems)는 복잡한 뷰에서 불완전할 수 있음
  → Integration 레벨(renderToString)에서 커버

## Unresolved questions

- Builder의 getItems를 tree-aware로 보강할지, renderToString에 위임할지
- itemFilter의 DOM 의존(getItemAttribute) 제거 범위
