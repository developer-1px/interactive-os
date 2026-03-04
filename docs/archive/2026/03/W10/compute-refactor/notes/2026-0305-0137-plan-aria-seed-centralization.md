# /plan — ARIA Seed 중앙화 + computeItem 순수 reader화

> Discussion Claim: ARIA 초기 상태는 Zone 생성 시 config에서 seed. computeItem은 순수 투영만.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-core/schema/state/utils.ts:ensureZone` | 빈 `items: {}` 반환. config 참조 없음 | ZoneRegistry에서 config를 읽고, config 기반으로 `items[id]`에 aria-* 초기값 seed. 인자에 `itemIds: string[]` 추가 | Clear | — | tsc 0, 기존 테스트 유지 | ensureZone 호출처 18곳에 itemIds 전달 필요 → **#1b에서 해결** |
| 1b | `os-core/4-command/focus/zoneInit.ts:OS_ZONE_INIT` | `initialZoneState`만 복사. config/items 불참 | ZoneRegistry에서 config + items를 읽어 `seedAriaState()` 호출. ensureZone은 변경 없이 유지 (seed는 여기서만) | Clear | — | tsc 0 | Zone.tsx가 OS_ZONE_INIT dispatch하는 시점에 ZoneRegistry에 이미 등록되어 있어야 함 → 현재 useMemo에서 register 후 useLayoutEffect에서 dispatch하므로 문제없음 |
| 2 | **신규** `os-core/3-inject/seedAriaState.ts` | 없음 | `seedAriaState(config, itemIds): Record<string, Record<string, boolean>>`. config에서 select.mode, expand.mode, inputmap OS_CHECK/OS_PRESS를 분석하여 초기 aria-* map 반환 | Clear | — | +5 unit tests | 순수 함수, 부작용 없음 |
| 3 | `os-core/3-inject/compute.ts:computeItem` L109-115 | `"aria-X" in ariaItemState` 조건 분기 4줄 + fallback `?? false` 3줄 | `items[id]`의 aria-* 키를 순회 투영: `for (const [k,v] of Object.entries(ariaItemState)) { if (k.startsWith("aria-")) attrs[k] = v; }`. `aria-controls`는 `aria-expanded` 존재 시 파생 | Clear | →#1b | tsc 0, 기존 APG 테스트 PASS 전환 | `data-selected`, `data-expanded` 등 data-* 파생은 유지 필요 |
| 4 | `os-core/4-command/navigate/index.ts` L83 | `zone.expandedItems.includes(focusedId)` — ZoneState에 없는 필드 → TypeError crash | `zone.items?.[focusedId]?.["aria-expanded"] ?? false` | Clear | →#1b | RC-1(3 tests) PASS | 동일 패턴이 다른 커맨드에도 있는지 확인 필요 |
| 5 | `os-devtool/testing/page.ts` L992-1045 (goto seed) | 50줄 seed 코드: inputmap 스캔 → aria-* false 기록 | **삭제**. OS_ZONE_INIT이 seed하므로 불필요. goto()에서 `OS_ZONE_INIT` dispatch 경로 확인만 | Clear | →#1b | 기존 44 goto 테스트 유지 | goto가 OS_ZONE_INIT을 이미 dispatch하는지 확인 필요 |
| 6 | `os-devtool/testing/page.ts:setActiveZone` L801-830 | ensureZone만 호출, seed 없음 | seed 없어도 동작하도록 — setActiveZone에서 OS_ZONE_INIT dispatch 추가, 또는 ensureZone → OS_ZONE_INIT 경로 통합 | Clear | →#1b | 기존 33 setActiveZone 테스트 PASS 전환 | setActiveZone → OS_ZONE_INIT → seed 경로가 작동하려면 ZoneRegistry에 이미 등록 필요 |
| 7 | `os-core/4-command/navigate/index.ts` L193, L219 | `z.selection = items.slice(...)` / `zone.selection` — ZoneState에 없는 필드 | `items[id]["aria-selected"]`로 전환. Unresolved 항목 해결 | Clear | →#1b | Shift+Arrow 범위 선택 테스트 PASS | selection 배열 패턴 제거 범위 확인 필요 |

## MECE 점검

1. **CE**: #1b(seed 인프라) + #2(순수 함수) + #3(computeItem 축소) + #4(RC-1 fix) + #5(goto 정리) + #6(setActiveZone 정리) + #7(selection 통합) → 목표 달성 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: 없음 ✅

## 실행 순서 (의존성)

```
#2 (seedAriaState 순수 함수)
  ↓
#1b (OS_ZONE_INIT에서 seed 호출)
  ↓
#3 (computeItem 순수 reader화) + #4 (expandedItems crash fix)
  ↓
#5 (goto seed 삭제) + #6 (setActiveZone 정리)
  ↓
#7 (selection 배열 → items map 통합)
```

## 라우팅

승인 후 → `/go` (기존 프로젝트 compute-refactor) — Unresolved 2건을 Now 태스크로 승격 + 신규 태스크 추가
