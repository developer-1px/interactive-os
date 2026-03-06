# /plan — computeItem ARIA 투영 조건 분기 제거

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `compute.ts:computeItem` L96-121 | `hasSelectRole`, `hasCheckCommand`, `hasPressCommand` 3개 조건 변수 + inputmap 순회 + 개별 if 분기 6개 | `ariaItemState`에 키가 있으면 그대로 투영. `"aria-selected" in ariaItemState → attrs["aria-selected"] = ...`. inputmap 순회 삭제 | Clear | →2,3 | 기존 30+ tests 유지 | Item.tsx, page.ts 소비자 |
| 2 | `page.ts:goto()` L992-1003 | `initial.selection`이 있을 때만 `aria-selected: true` 기록. 나머지 아이템에 `false` 안 씀 | select 지원 Zone의 **모든 아이템**에 `aria-selected: false` 초기화 후 선택된 것만 `true` | Clear | — | listbox/tablist/grid 테스트 통과 | headless goto만 해당 |
| 3 | `page.ts:goto()` + `Zone.tsx:useLayoutEffect` | `aria-checked`, `aria-pressed` 초기값 미기록 | preset의 inputmap에 `OS_CHECK`가 있으면 모든 아이템에 `aria-checked: false`, `OS_PRESS`가 있으면 `aria-pressed: false` 초기화 | Clear | — | checkbox/switch/toggle 테스트 통과 | 두 경로(headless/React) 동일 로직 필요 |
| 4 | `compute.ts:computeItem` L81-82,130-134 | `ZoneRegistry.isExpandable()` 체크 → expand attrs 설정 | `"aria-expanded" in ariaItemState` 체크. expand 커맨드가 이미 expandable에만 쓰므로 동일. `aria-controls`는 `aria-expanded` 존재 시 추가 | Clear | →2 | accordion/tree/disclosure 테스트 통과 | `aria-controls` 누락 없어야 함 |
| 5 | `compute.ts:resolveElement` L252-257,263-267,281-285 | `as unknown as ElementAttrs` 3회 | `resolveElement` 반환 타입을 `Record<string, string \| number \| boolean \| undefined>`로 유지, `computeContainerProps`, `computeAttrs` 반환값을 spread로 변환하여 캐스팅 제거 | Clear | — | tsc 0 | — |
| 6 | `compute.ts:readSelected` L45-51 | `items[itemId]["aria-selected"]` 직접 조회 | 변경 없음 (이미 state 직접 읽기) — No-op 확인 | Clear | — | — | — |

### MECE 점검

1. **CE**: #1~#5 실행 시 목표(computeItem 조건 분기 제거 + 타입 안전성 개선) 달성 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: #6 제거 (Before=After) → **5행 확정**

## 실행 순서

```
#2 (selected 초기화) + #3 (checked/pressed 초기화) — 병렬 가능
        ↓
#1 (computeItem 축소) + #4 (expand 축소) — 병렬 가능
        ↓
#5 (타입 캐스팅 제거) — 독립
```

## 라우팅

승인 후 → `/go` (기존 프로젝트: compute-refactor) — OS 리팩토링, Meta 프로젝트 성격
