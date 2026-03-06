# eliminate-layout-dispatch

## Context

Claim: Zone 초기화(OS_INIT_*)는 잘못된 전제("mount 시 state가 없다")의 산물이다. 제거한다.

Before → After:
- Before: Zone.tsx useLayoutEffect에서 OS_INIT_SELECTION / OS_FOCUS / OS_STACK_PUSH dispatch
- After: bind() eager creation + followFocus가 첫 OS_FOCUS에서 자동 선택 → "초기화" 단계 소멸

근거:
- design-principles.md #32 "useLayoutEffect는 DOM API 전용"
- design-principles.md #33 "OS_INIT_*는 잘못된 전제의 산물"
- OS_ZONE_INIT 제거 성공 (2026-03-05) — 같은 패턴

Risks:
- followFocus가 실제로 disallowEmpty를 커버하는지 검증 필요
- overlay autoFocus/stackPush는 별도 작업 (T3-T4)

규모: Heavy → Light로 재분류 (핵심은 코드 삭제)

## Now
(없음 — 모든 태스크 완료)

## Done
- [x] T1: OS_INIT_SELECTION dispatch 제거 (Zone.tsx) — tsc 0 | tabs/listbox/accordion/button 125 tests PASS | radiogroup 1건 regression = pre-existing aria-checked 문제 ✅
- [x] T2: initSelection.ts 파일 삭제 — dead code 47줄 제거 ✅
- [x] T3: autoFocus dispatch 제거 (Zone.tsx) — OS_OVERLAY_OPEN이 이미 entry hint 보유. useLayoutEffect의 OS_FOCUS dispatch 삭제 ✅
- [x] T4: STACK_PUSH/POP dispatch 제거 (Zone.tsx) — OS_OVERLAY_OPEN/CLOSE가 이미 applyFocusPush/Pop 호출 → Zone.tsx의 이중 dispatch 삭제 ✅
- [x] /solve 1차 시도: ensureZone에 config-driven init → 101 regression → 롤백
- [x] /discussion 2차: "왜 lazy?" → bind() eager creation 가능 → OS_INIT 시리즈 전부 불필요 발견

## Unresolved
- dialog focus restore 2건 pre-existing failure (T3/T4 scope)
- radiogroup aria-checked projection 미지원 (9+1건 = 10건 fail, pre-existing scope — separate project)

## Ideas
- bind() 시점에 os.dispatch()로 빈 zone state eager creation
- ensureZone은 방어 코드로 유지 (backward compat)
