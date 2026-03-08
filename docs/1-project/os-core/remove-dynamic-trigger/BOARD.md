# remove-dynamic-trigger

## Context

Claim: DynamicTrigger를 제거하고 TriggerBase가 `(focusId) => BaseCommand` 함수를 직접 받도록 통일하면 Zero Drift가 복원된다.

Before → After:
- Before: `zone.trigger()` → `createDynamicTrigger` → `factory(payload)` → BaseCommand 사전계산 → `<Trigger onActivate={cmd}>` → TriggerBase `() => cmd` thunk → focusId 무시
- After: `zone.trigger()` → 단순 FC → `<Trigger onActivate={fn}>` → TriggerBase가 함수 직접 등록 → focusId 전달

Risks: DocsViewer에 headless 테스트 없음 — payload 제거 후 수동 확인 필요

## Now
- [ ] T1: TriggerBase가 함수 onActivate를 직접 ZoneRegistry에 등록
- [ ] T2: createDynamicTrigger 삭제 + zone.trigger() 재구현
- [ ] T3: 소비자 payload prop 제거 (TaskItem, Sidebar, DocsViewer)

## Done

## Unresolved

## Ideas
