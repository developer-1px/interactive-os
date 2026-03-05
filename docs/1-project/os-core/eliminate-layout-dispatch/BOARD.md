# eliminate-layout-dispatch

## Context

Claim: useLayoutEffect에서 kernel dispatch를 제거하고, config.initial 선언형으로 대체한다.

Before → After:
- Before: Zone mount 시 useLayoutEffect에서 `OS_FOCUS`, `OS_INIT_SELECTION`, `OS_STACK_PUSH` dispatch → React bottom-up mount 순서에 의존 → 타이밍 함정
- After: config.initial 선언형 + command 내부 처리 → mount 타이밍 무관 → headless 완전 동치

근거: design-principles.md #32 "useLayoutEffect는 DOM API 호출 전용. kernel dispatch 금지."
선례: OS_ZONE_INIT 제거 (2026-03-05) — 같은 패턴의 타이밍 버그 해소 성공.

Risks:
- overlay autoFocus + entry hint 조합이 복잡 (dialog/menu 패턴)
- Field auto-commit의 EDIT→SELECT path 판단이 미묘
- 기존 테스트 regression 범위 넓음 (dialog/tabs/radiogroup/field 전체)

규모: Heavy (아키텍처 변경, 4개 dispatch 제거, overlay+field 파급)

## Now
- [ ] T1-T3: Zone initial state (disallowEmpty + autoFocus + stackPush) — Complex. ensureZone 접근 실패 (101 regression). 초기화 경로 재설계 필요
- [ ] T4: Field auto-commit — useLayoutEffect OS_FIELD_COMMIT 제거 → focus 이동 command에서 auto-commit (Complicated)

## Done

## Unresolved
- ensureZone에 config-driven initial state 넣기 → 101 regression (모든 command handler에서 호출되므로 side effect 전파)
- 별도 `initializeZone` 함수? → 호출 시점 문제 (누가 언제 부르나?)
- ZoneRegistry.register 시점? → os state draft에 접근 불가 (Immer produce 외부)
- overlay entry hint("last")를 config.initial로 어떻게 전달할지 구체 설계 미정
- Field deferred mode의 EDIT→SELECT 전이 감지를 command 레벨에서 어떻게 할지
- dialog focus restore 2건 pre-existing failure (T3 STACK_PUSH/POP scope)

## Ideas
- ZoneRegistry.register 시점에 initial config를 한 번에 적용하는 "initial state resolver" 패턴
- `OS_ZONE_READY` command: Zone mount 완료 후 한 번만 dispatch → 이 안에서 initial state 적용
- ensureZone 대신 별도 `initializeZoneState(draft, zoneId, config)` → Zone.tsx useLayoutEffect에서만 호출
- 참조: archive/2026/03/W10/top-down-enforcement-BOARD.md (선행 프로젝트)
