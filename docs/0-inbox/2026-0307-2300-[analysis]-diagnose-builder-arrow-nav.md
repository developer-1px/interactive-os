# 🔍 삽질 일지: 빌더 캔버스 화살표 네비게이션 group/item 레벨 이동 불가

> 날짜: 2026-03-07
> 실행 명령: `npx playwright test tests/e2e/builder/builder-spatial.spec.ts`
> 결과: 10개 실패 / 0개 통과 (e2e 테스트 자체가 stale — ncp-* vs ge-* ID 불일치)

## 증상

- 빌더 캔버스에서 화살표 키를 누르면 **section 레벨에서는 이동이 된다** (ge-hero → ge-tab-nav 등)
- **drill-down 후 group/item 레벨에서 화살표 키가 전혀 작동하지 않는다** (포커스가 현재 아이템에 머무름)
- e2e 테스트 10개 전부 실패 — 테스트가 옛 데이터 모델(ncp-*)을 참조하여 요소를 찾지 못함 (별개 이슈)

## 삽질 과정

처음엔 `cornerNav.ts`의 알고리즘 문제(containment 필터 등)나 `DOM_RECTS`의 rect 수집 문제일 거라 생각했다. cornerNav가 DOMRect를 입력으로 받는 순수 함수이고, jsdom에서 `getBoundingClientRect()`가 항상 0을 반환하므로 vitest에서 재현 불가능하다는 게 초기 가설이었다.

코드를 따라가보니 파이프라인은 이렇다:

```
OS_NAVIGATE → ctx.inject(DOM_ITEMS) → itemFilter → ctx.inject(DOM_RECTS) → resolveCorner
```

`OS_NAVIGATE`가 `items.length === 0`이면 early return한다 (navigate/index.ts:53). 그래서 DOM_RECTS까지 갈 필요도 없이, **DOM_ITEMS가 빈 배열을 반환하면 네비게이션 자체가 작동하지 않는다.**

DOM_ITEMS의 데이터 흐름을 추적했다:

1. `DOM_ITEMS` context provider → `ZoneRegistry.resolveItems(zoneId)` → `entry.getItems()`
2. canvas zone의 `getItems()`는 어디서 오는가?

여기서 결정적 발견: `canvasCollection.collectionBindings()`가 `getItems`를 제공한다 (createCollectionZone.ts:609-617).

```js
getItems: () => {
  const allItems = ops.getItems(appState);  // ← accessor(state) = s.data.blocks
  return visible.map(item => toItemId(item.id));
}
```

`ops.getItems`는 `opsFromAccessor(config.accessor)` → `(state) => state.data.blocks`를 호출한다. 이건 **top-level 블록만** 반환한다: `[ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer]`.

그리고 `app.ts`에서:

```js
const canvasBindings = canvasCollection.collectionBindings({...});
export const BuilderCanvasUI = canvasCollection.bind({
  ...canvasBindings,           // ← getItems 포함!
  itemFilter: createCanvasItemFilter(CANVAS_ZONE_ID),
  ...
});
```

`canvasBindings`에 `getItems`가 포함되어 있으므로, `buildZoneEntry`에 이미 `getItems`가 세팅된다. 그 다음 `bindElement`가 DOM 스캐너를 설치하려 하지만:

```js
// zoneRegistry.ts:255
if (!entry.getItems) {   // ← FALSE! collectionBindings의 getItems가 이미 있다
  patch.getItems = () => { /* DOM querySelectorAll("[data-item]") */ }
}
```

DOM 스캐너가 설치되지 않는다.

결과:
- `getItems()` = top-level 블록 ID만 반환 (5개)
- drill-down 후 `itemFilter`가 `data-level="group"` 아이템만 남기려 하지만, 5개 블록 중 group인 것은 없음
- **빈 배열** → `OS_NAVIGATE`가 `items.length === 0`에서 early return → 이동 불가

section 레벨에서 동작하는 이유: top-level 블록이 모두 `Builder.Section`으로 감싸져 있어 `data-level="section"`이 매칭된다.

## 원인 추정 — 5 Whys

1. 왜 group/item 레벨에서 화살표가 안 움직이나? → `OS_NAVIGATE`가 `items.length === 0`에서 early return
2. 왜 items가 빈 배열인가? → `itemFilter`가 group/item 레벨 아이템을 찾지 못함
3. 왜 찾지 못하나? → `getItems()`가 top-level 블록(section)만 반환하므로, group/item은 후보에 없음
4. 왜 top-level만 반환하나? → `collectionBindings().getItems`가 `accessor(state)`(= `s.data.blocks`)를 호출하고, 이는 top-level 배열만 반환
5. 왜 DOM 스캐너가 대신 사용되지 않나? → `bindElement`는 `entry.getItems`가 이미 존재하면 DOM 스캐너를 설치하지 않음

→ **근본 원인**: `collectionBindings().getItems`가 데이터 모델의 top-level 아이템만 반환하는데, 빌더 캔버스는 데이터 모델 항목과 DOM 아이템이 1:1이 아니다 (하나의 블록이 여러 Builder.Group/Item으로 렌더링됨). `getItems`가 존재하면 DOM 스캐너가 설치되지 않아, 실제 DOM에 존재하는 group/item 레벨 아이템이 네비게이션 후보에서 누락된다.

→ **확신도**: 높음

## 다음 액션 제안

**수정 방향 (택1):**

### A. 최소 수정 — canvas bind에서 getItems 제거

```js
// app.ts
const { getItems: _unused, ...canvasBindingsWithoutGetItems } = canvasBindings;

export const BuilderCanvasUI = canvasCollection.bind({
  ...canvasBindingsWithoutGetItems,  // getItems 제외
  itemFilter: createCanvasItemFilter(CANVAS_ZONE_ID),
  ...
});
```

→ `bindElement`의 DOM 스캐너가 활성화되어 모든 `[data-item]` 요소를 반환
→ `itemFilter`가 현재 레벨에 맞는 아이템만 남김
→ `cornerNav`가 올바른 후보로 네비게이션 수행

**부작용 검토**: `collectionBindings().getItems`는 CRUD(delete/moveUp 등)의 focus recovery에도 사용된다. canvas의 CRUD는 `guard: isDynamicItem`으로 보호되므로, 데이터 모델 기반 getItems가 없어도 CRUD 자체는 동작한다. 단, delete 후 focus recovery가 DOM 스캔 기반으로 바뀌므로 edge case 검증 필요.

### B. 부가 — e2e 테스트 ID 갱신

`builder-spatial.spec.ts`의 `ncp-*` ID를 현재 데이터 모델의 `ge-*` ID로 업데이트.

### C. DOM_RECT 없이 테스트하는 방법

cornerNav/focusFinder는 순수 함수이므로, 합성 DOMRect로 단위 테스트 가능. 통합 수준은 push model(`getItemRects`) 추가 후 headless에서 검증 가능. 그러나 이번 버그의 근본 원인은 DOM_RECT가 아니라 getItems였으므로, 수정 A 적용 후 vitest에서도 (headless + getItems DOM 스캔으로) 재현/검증 가능할 수 있다.
