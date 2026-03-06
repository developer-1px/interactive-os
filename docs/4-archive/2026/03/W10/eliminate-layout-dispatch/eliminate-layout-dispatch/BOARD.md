# eliminate-layout-dispatch

## Context

Claim: useLayoutEffect에서 OS→OS init dispatch를 제거하고, config.initial 선언형으로 대체한다.
DOM→OS sync (Field의 contentEditable → OS_FIELD_COMMIT)는 정당한 패턴으로 판정, 제거 대상 아님.

## Done (verified 2026-03-05)
- [x] T1: OS_INIT_SELECTION — Zone.tsx에서 제거 완료 (OS_ZONE_INIT 제거 세션에서 함께 처리)
- [x] T2: OS_FOCUS (autoFocus) — Zone.tsx에서 제거 완료
- [x] T3: OS_STACK_PUSH/POP — Zone.tsx에서 제거 완료
- [x] T4: OS_FIELD_COMMIT — **정당한 DOM→OS sync로 재판정.** contentEditable value는 DOM에만 존재 → useLayoutEffect dispatch 허용.

## Key Decision
- design-principles.md #32 정밀화: "kernel dispatch 금지" → "OS→OS init dispatch 금지 + DOM→OS sync 허용"
- Zone.tsx: useLayoutEffect 내 os.dispatch 0건 (grep 실사 확인)
- Field.tsx L318: OS_FIELD_COMMIT — DOM→OS sync (input.onChange 유사) → 정당

## Archived
프로젝트 완료. archive/2026/03/W10/로 이동.
