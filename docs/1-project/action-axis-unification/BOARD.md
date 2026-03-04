# action-axis-unification

## Context

Claim: activate/check/expand/open 4개의 별도 축을 단일 `action: BaseCommand[]` 로 통합.
command는 순수 데이터 팩토리이므로 config에서 직접 참조 가능. mode enum / effect enum 이중 관리 불필요.

Before → After:
- Before: `activate: { mode, effect, onClick }`, `check: { mode, keys, onClick }`, `expand: { mode }` + `TriggerConfig { open, focus, aria }` 4개 분리 축. OS_ACTIVATE가 effect switch로 프록시 dispatch (#18 위반).
- After: `action: BaseCommand[]` 1개 축. role preset이 command 배열 직접 지정. resolver가 첫 command에서 keys/onClick/aria 자동 파생.

Risks:
- FocusGroupConfig 구조 변경 → OS core 전체 파급. APG 18패턴 regression 위험.
- TriggerConfig 삭제 시 overlay lifecycle 세부 동작 검증 필요.

## Now

- [ ] T8: `OSState.ts` — `ZoneState.items: Record<string, AriaItemState>` 도입. `selection[]`, `expandedItems[]` 제거. 커맨드(OS_PRESS/OS_CHECK/OS_SELECT/OS_EXPAND)가 해당 aria 슬롯 직접 쓰기. `compute.ts` 파생 로직 전부 삭제 → 직접 읽기.

## Done

- [x] T1: `FocusGroupConfig.ts` — `ActionConfig` 재설계 (`keymap`, `ActionKey`) — tsc 0 ✅
- [x] T1b: `OS_PRESS` command 추가 — command 이름 = ARIA 상태 원칙 확립 — tsc 0 ✅
- [x] T2: `roleRegistry.ts` — menu/accordion/disclosure/switch/checkbox에 `action` command 배열 추가 — tsc 0 ✅
- [x] T3: `resolveKeyboard.ts` — `ActionConfig` 기반 keymap 자동 생성, `getDefaultKeysForCommand()`, `senseKeyboard.activeZoneAction` — tsc 0 ✅
- [x] T4: `simulate.ts` — `action.onClick` 우선, `getDefaultOnClickForCommand()` 자동 파생 — tsc 0 ✅
- [x] T5: `compute.ts` — `getAriaForActionCommand()` — OS_CHECK→"checked", OS_PRESS→"pressed" 자동 파생 — tsc 0 ✅
- [x] T6: `activate.ts` — `effect` switch 삭제, `ZONE_CONFIG` inject 제거. OS_ACTIVATE = 순수 앱 콜백 전용 — tsc 0 ✅

## Unresolved

- [ ] T7: `TriggerConfig` + `triggerRegistry` — Trigger 별도 파이프라인을 action 축으로 흡수. 범위가 크고 Trigger 컴포넌트 전면 수정 필요 → **다음 세션에서 처리**

## Ideas

- per-item action override: `items: { "bold": { action: [OS_CHECK()] } }` — zone.bind() items map
- zone.item() 빌더 패턴 (usage-spec 참조)
- app.createAction() standalone button API
