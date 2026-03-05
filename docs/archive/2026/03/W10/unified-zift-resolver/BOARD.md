# unified-zift-resolver

## Context

Claim: ZIFT 4개 개별 resolver를 1개 generic chain executor로 통합. ordered keymap chain + binary return (Command/NOOP=stop, null=pass).

Before → After:
- `resolveFieldKey.ts` + `resolveItemKey.ts` + `resolveTriggerKey.ts` + `resolveTriggerClick.ts` → `chainResolver.ts` 1개 executor + 3개 `buildXxxKeymap()` 함수
- `resolveKeyboard.ts` 240줄 if chain → 10줄 chain executor 호출
- toggle `isOpen ? close : open` 조건문 → `[CLOSE, OPEN]` chain 순서로 표현
- `when: "editing"` dead code 제거 (사용 0곳)

Risks:
- resolveKeyboard.ts는 모든 키보드 입력의 관문. regression 위험 높음
- 기존 테스트 8 suite 전수 통과 필수

## Now

(empty — Phase 1 complete)

## Done

- [x] T1: `chainResolver.ts` [NEW] — tsc 0 | +13 tests | 122/122 regression PASS ✅
- [x] T2: `buildTriggerKeymap(config)` — tsc 0 | 122/122 regression PASS ✅
- [x] T3: `buildFieldKeymap` — Field stays as resolver (absorb-all unbounded → not a static Keymap)
- [x] T4: `buildItemKeymap(role, ctx)` — tsc 0 | 122/122 regression PASS ✅
- [x] T5: `resolveKeyboard.ts` 리팩토링 — L2+L3 use resolveChain. tsc 0 | 122/122 PASS ✅
- [x] T6: `resolveTriggerKey.ts` 삭제 + test 마이그레이션 — tsc 0 | 122/122 PASS ✅
- [x] T7: 최종 검증 — tsc 0 | 10 test files | 122/122 PASS ✅
- [x] T8: resolveKeyboard Layer[] loop refactor — 본문 80→15줄. tsc 0 | 122/122 PASS ✅
- [x] T9: resolveClick 간결화 — 78→49줄, 4 if→1 guard. tsc 0 | 14/14 PASS ✅

## Unresolved

- Click chain 통합 (Phase 2): `resolveTriggerClick` → chain executor + `buildTriggerClickKeymap` (already built)
- `when: "navigating"` 제거 (Phase 2): chain 위치로 대체
- `osDefaults.ts` Zone keymap 전환 (Phase 2)
- Field absorb-all → Keymap 모델로 전환 불가 (ZONE_PASSTHROUGH_KEYS가 unbounded set. resolver 패턴 유지)
- `resolveItemKey` legacy wrapper 삭제 (backward compat 없음 확인 후)

## Ideas

- 전체 ZIFT를 선언적 config 테이블로 구동 (trigger + field + item + zone 모두 동일 포맷)
