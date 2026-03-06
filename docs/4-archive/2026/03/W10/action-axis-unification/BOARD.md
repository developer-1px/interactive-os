# action-axis-unification

## Context

Claim: ActionConfig + ActivateConfig → inputmap 통합.
config = 커맨드 파라미터 축 + inputmap (입력→커맨드 라우팅). role = preset.

Before → After:
- Before: `action: { commands, keys, keymap, onClick }` + `activate: { mode, onClick, reClickOnly, effect }` — 이중 관리, 자동 파생 로직(getDefaultKeysForCommand 등)
- After: `inputmap: Partial<Record<string, BaseCommand[]>>` — APG 테이블과 1:1. 키/클릭 라우팅 명시적. 자동 파생 삭제.

Plan: `notes/2026-0305-1400-plan-inputmap-migration.md`

## Now

(All tasks complete)

## Done

- [x] T1: `FocusGroupConfig.ts` — `ActionConfig` 재설계 (`keymap`, `ActionKey`) — tsc 0 ✅
- [x] T1b: `OS_PRESS` command 추가 — command 이름 = ARIA 상태 원칙 확립 — tsc 0 ✅
- [x] T2: `roleRegistry.ts` — menu/accordion/disclosure/switch/checkbox에 `action` command 배열 추가 — tsc 0 ✅
- [x] T3: `resolveKeyboard.ts` — `ActionConfig` 기반 keymap 자동 생성, `getDefaultKeysForCommand()`, `senseKeyboard.activeZoneAction` — tsc 0 ✅
- [x] T4: `simulate.ts` — `action.onClick` 우선, `getDefaultOnClickForCommand()` 자동 파생 — tsc 0 ✅
- [x] T5: `compute.ts` — `getAriaForActionCommand()` — OS_CHECK→"checked", OS_PRESS→"pressed" 자동 파생 — tsc 0 ✅
- [x] T6: `activate.ts` — `effect` switch 삭제, `ZONE_CONFIG` inject 제거. OS_ACTIVATE = 순수 앱 콜백 전용 — tsc 0 ✅
- [x] T8: `OSState.ts` — phantom fields (selection[], expandedItems[]) 수정. ZoneRegistry.isExpandable() 중앙화 ✅
- [x] T9: `FocusGroupConfig.ts` — InputMap 타입 추가, ActionConfig/ActivateConfig/ActionKey 삭제 — tsc 0 ✅
- [x] T10: `roleRegistry.ts` — 25개 role preset inputmap 전환, resolveRole() 단순화, getDefault* 삭제 — tsc 0 | +20 tests ✅
- [x] T11: `resolveKeyboard.ts` + `senseKeyboard.ts` + `simulate.ts`(keyPress) — activeZoneInputmap, LayerResult→commands[] — tsc 0 ✅
- [x] T12: `simulate.ts`(click) + `PointerListener.tsx` + `resolveClick.ts` — inputmap["click"] 직접 조회 — tsc 0 ✅
- [x] T13: `compute.ts` — inputmap values scan → ARIA projection — tsc 0 ✅
- [x] T14: `zoneContext.ts` + `page.ts` + `schema/types/index.ts` + FocusActivateConfig.ts 삭제 — tsc 0 ✅
- [x] T15: 6개 테스트 파일 inputmap 기반 갱신 — tsc 0 | 59/60 pass (1 pre-existing) ✅

## Unresolved

(T7 → 백로그 이동: `5-backlog/os-gaps.md` — Trigger inputmap 흡수는 별도 프로젝트 스코프)
