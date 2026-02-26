# Plan: Push-Based Item Discovery (DOM 0%)

> 생성일: 2026-02-27 02:02
> Discussion: discussions/2026-0227-0153-push-based-item-discovery.md
> Claim: 아이템 발견을 Push 100%로 전환. 2-contexts의 querySelectorAll 전부 제거.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `2-contexts/index.ts:DOM_ITEMS` (L84-112) | element 있으면 `querySelectorAll("[data-item-id]")` 우선 → 없으면 `getItems()` fallback | `getItems()` 우선 → element 있으면 DOM fallback (우선순위 역전). 최종 목표: DOM fallback 제거 | Clear | — | 기존 테스트 유지 + headless-zone-registry 7 tests 유지 | getItems() 없는 Zone이 headless에서 빈 목록 반환 |
| 2 | `2-contexts/index.ts:DOM_EXPANDABLE_ITEMS` (L23-46) | `getExpandableItems()` 있으면 사용 → 없으면 `querySelectorAll("[aria-expanded]")` | DOM fallback 제거. `getExpandableItems()` 필수 (없으면 empty Set) | Clear | — | 기존 tree/expandable 테스트 유지 | getExpandableItems 미제공 Zone에서 expand 불가 |
| 3 | `2-contexts/index.ts:DOM_TREE_LEVELS` (L52-78) | `getTreeLevels()` 있으면 사용 → 없으면 `querySelectorAll + aria-level` | DOM fallback 제거. `getTreeLevels()` 필수 (없으면 empty Map) | Clear | — | tree 테스트 유지 | getTreeLevels 미제공 Zone에서 트리 네비게이션 불가 |
| 4 | `2-contexts/index.ts:DOM_RECTS` (L118-145) | `entry.element.querySelectorAll → getBoundingClientRect` | `getRects()` accessor in ZoneEntry. 없으면 empty Map (headless). 브라우저에서는 FocusGroup이 inject | Clear | →#1 | 2D grid 네비게이션 테스트에서 mock rect 필요 | 2D 네비게이션 headless 정밀도 |
| 5 | `2-contexts/index.ts:DOM_ZONE_ORDER` (L178-268) | registry 순서 + DOM fallback (L214-232) + document.querySelectorAll safety net (L236-263) | registry 순서 + getItems() only. DOM fallback 및 safety net 삭제 | Clear | →#1 | Tab 네비게이션 테스트 유지 | 미등록 Zone이 Tab 순서에서 누락 (정당 — 미등록 = 미존재) |
| 6 | `2-contexts/itemQueries.ts:getZoneItems` (L13-26) | `entry.element.querySelectorAll("[data-item-id]")` | `getItems()` accessor 사용. DOM fallback 경로 없음 | Clear | →#1 | Lazy Resolution 테스트 유지 | getItems 없는 Zone에서 항상 [] |
| 7 | `2-contexts/itemQueries.ts:findItemElement` (L43-63) | `zoneEl.querySelector + document.querySelector + document.getElementById` | 유지 (4-effects 전용). headless에서는 null 반환. 이것은 DOM effect이므로 정당한 DOM 사용 | Clear | — | 기존 동작 유지 | — |
| 8 | `2-contexts/itemQueries.ts:getItemAttribute` (L77-87) | `entry.element.querySelector → getAttribute` | DOM 전용 (effect/sense 성격). 유지. headless에서는 null. 또는 ZoneRegistry에 attribute map push | Clear | — | — | — |
| 9 | `2-contexts/itemQueries.ts:getFirstDescendantWithAttribute` (L100-119) | `querySelector` 순수 DOM | DOM 전용 (구조 쿼리). 유지 또는 tree 구조를 push (getTreeLevels와 연계) | Clear | →#3 | — | — |
| 10 | `2-contexts/itemQueries.ts:getAncestorWithAttribute` (L128-149) | `parentElement` 순수 DOM | DOM 전용 (구조 쿼리). 유지 또는 tree parent를 push | Clear | →#3 | — | — |
| 11 | `keymaps/typeaheadFallbackMiddleware.ts:getItemsAndLabels` (L25-42) | `zoneEl.querySelectorAll("[data-item-id]") + el.textContent` | ZoneRegistry에 `getLabels()` accessor 추가. 또는 DOM fallback 유지 (1-listeners 성격) | Clear | — | typeahead 테스트 유지 | label 미제공 시 typeahead 불가 |
| 12 | `6-components/base/FocusGroup.tsx:autoFocus DOM fallback` (L467-489) | `getItems` 없으면 `querySelector("[data-focus-item]")` | DOM fallback 제거. getItems 필수화 시 자연 해소 | Clear | →#1 | T2 headless-autofocus 3 tests 유지 | getItems 없는 autoFocus Zone |

## MECE 점검

1. **CE**: #1~#12를 실행하면 2-contexts의 querySelectorAll이 0건 (findItemElement 등 정당한 DOM 사용 제외). ✅
2. **ME**: 중복 없음. ✅
3. **No-op**: #7, #8은 "유지"이므로 실행 불요 → 표에서 유지 표기하되 태스크에서 제외.

## 우선순위

P1 (핵심): #1(DOM_ITEMS), #5(DOM_ZONE_ORDER), #6(getZoneItems) — 이것이 바뀌면 3-commands가 headless 동작
P2 (트리): #2(EXPANDABLE_ITEMS), #3(TREE_LEVELS) — 트리 네비게이션 headless화
P3 (공간): #4(DOM_RECTS) — 2D 네비게이션 headless화
P4 (부가): #11(typeahead labels), #12(autoFocus fallback 제거)

## 라우팅
승인 후 → `/project` (headless-item-discovery) — Heavy OS 프로젝트. 2-contexts 아키텍처 전면 재구성.
