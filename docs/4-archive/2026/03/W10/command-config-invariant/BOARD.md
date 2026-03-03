# command-config-invariant

## Context

Claim: Command = { intent + chain(string[]) }. 6 commands × rolePresets(chain 소스) = APG 전수 커버. resolveItemKey 레이어 제거. OS_CHECK/OS_EXPAND 흡수.

Before → After:
- 9 commands → 6 commands (NAVIGATE, SELECT, ACTIVATE, DISMISS, TAB, VALUE_CHANGE)
- role 분기 2회 (L2 + L5) → 0회 (chain fallback ×  rolePresets)
- resolveItemKey 레이어 → 삭제
- config 갭 9건 → 채움

Risks:
- R4: Big Bang 위험 → 6-Phase 점진적 마이그레이션
- R5: onCheck app callback 분기 전가 → callback 분리 유지, 내부만 통합
- R1: Fallback vs Sequential → seq 2건만 복합 atomic으로 흡수

## Now
(empty)

## Done
- [x] T1: Phase 1 — Config 타입 확장 — tsc 0 | +12 tests | regression 0 ✅
- [x] T2: Phase 2 — NAVIGATE chain 실행기 — tsc 0 | +5 input tests | regression 0 ✅
- [x] T3: Phase 3 — resolveItemKey treeitem 제거 + treegrid chain — tsc 0 | regression 0 ✅
- [x] T4: Phase 4 — CHECK → SELECT 흡수 — tsc 0 | +4 input tests | Red→Green ✅
- [x] T5: Phase 5 — EXPAND → NAVIGATE 흡수 — tsc 0 | +4 input tests | Red→Green ✅
- [x] T6: OS_ACTIVATE config.activate.effect — DOM_EXPANDABLE_ITEMS 제거 | 333 tests PASS ✅

## Unresolved

## Audit ✅ (2026-03-03)
- 🔴 LLM 실수 0건
- 🟡 OS 갭 신규 0건
- ⚪ 정당한 예외 3종 (zoneRegistry DOM scan, navigate DOM_EXPANDABLE_ITEMS, roleRegistry onClick config)
- tsc 0 | 333 tests PASS

## Ideas (✅ 완료)
- [x] Modifier keybindings 등록 (Ctrl+Arrow, Ctrl+Space, Shift+Space) → osDefaults.ts
- [x] Transaction log chain 실행 기록 → navigate chainTrace → Transaction.effects
- [x] Inspector chain fallback 시각화 → RegistryMonitor chain trace strip
- [x] APG_MATRIX.md Command 열 6-command 갱신 (CHECK→SELECT, EXPAND→NAVIGATE chain, ACTIVATE effect)

## Audit Findings (2026-03-03)
- [x] 🔴 arrowExpand dead code 제거 (navigate, FocusGroupConfig, roleRegistry) ✅
- [x] 🔴 resolve-item-key.test.ts treeitem dead test 삭제 ✅
- [x] 🟡 OS_ACTIVATE → config.activate.effect 소비 구현 (DOM_EXPANDABLE_ITEMS → config-driven) ✅
