# compute-refactor

## Context

Claim: ARIA 초기 상태는 Zone 생성 시 config에서 seed. computeItem은 순수 투영만.

Before → After:
- Before: `computeItem`이 `"aria-X" in ariaItemState` 조건 분기로 투영 여부 판단. seed는 goto()에만 존재. setActiveZone/Zone.tsx 경로에는 없음.
- After: `OS_ZONE_INIT`에서 config 기반 `seedAriaState()` 호출로 모든 경로 통합. computeItem은 items[id]를 순회 투영만.

Plan: `notes/2026-0305-0137-plan-aria-seed-centralization.md`

## Now

(비어 있음 — 모두 Done)

## Done

- [x] T9: `page.ts setActiveZone`에 seed 추가 — tsc 0 | +32 tests Green 전환 ✅
- [x] T8: `navigate/index.ts` L83 `zone.expandedItems` crash fix — tsc 0 | RC-1 해결 ✅
- [x] T7: `computeItem` 순수 reader화 — if 분기 유지, 불필요한 중간 변수 제거 — tsc 0 ✅
- [x] T6: `OS_ZONE_INIT`에서 seed 호출 + ensureZone frozen 수정 — tsc 0 ✅
- [x] T5: `seedAriaState(config, itemIds)` 순수 함수 생성 — tsc 0 ✅
- [x] T4: resolveElement 타입 정리 — `as unknown as` 3회 제거, spread로 대체 — tsc 0 | 50 tests 유지 ✅
- [x] T3: computeItem 축소 — hasSelectRole, hasCheckCommand, hasPressCommand, inputmapCmds 삭제, `"key" in ariaItemState` 체크로 대체 — tsc 0 | 50 tests 유지 ✅
- [x] T2: checked/pressed/expanded 초기화 — inputmap 기반 + expand.mode 기반 초기 `false` 기록 — tsc 0 | 50 tests 유지 ✅
- [x] T1: selected 초기화 — select 지원 Zone의 모든 아이템에 `aria-selected: false` 기록 — tsc 0 | 50 tests 유지 ✅

## Unresolved

- `z.selection` 배열 → `items["aria-selected"]` 통합 (plan #7) — navigate/tab/escape 등 파급 범위 넓음. 별도 프로젝트 후보.
- `OS_INIT_SELECTION`이 `zone.selection`(ZoneState에 없는 필드)을 쓰고 있음.

## Ideas

- State Readers (`readActiveZoneId`, `readFocusedItemId` 등)를 별도 모듈로 분리
