# Project: os-test-suite
> Goal: OS pipeline 인터랙션 체인을 exercise하는 showcase app + headless test. headless === browser 동형성 검증.
> Type: Meta (Red/Green 스킵, 직접 실행)

## Now
(없음)

## Next
(없음)

## Done
- [x] T1: Scaffold — route 2파일 + index.tsx + GlobalNav — tsc 0
- [x] T2: ClickFocus — 6 tests all pass. headless click→focus 완벽 동작
- [x] T3: CrossZone — 7 tests all pass. Tab + click zone transfer 동작 (bootstrap click 필요)
- [x] T4: FieldLifecycle — 5 pass + 2 gap markers. Enter→OS_ACTIVATE (not FIELD_COMMIT), OG-013 confirmed

## Gap Findings
- Click→Focus: headless works perfectly (Zero Drift OK)
- Cross-Zone: works, but goto() doesn't auto-activate first zone (bootstrap click needed)
- Field enter: Enter dispatches OS_ACTIVATE instead of OS_FIELD_COMMIT in textbox role
- Field change: confirms OG-013 — trigger:"change" no auto-commit in headless
