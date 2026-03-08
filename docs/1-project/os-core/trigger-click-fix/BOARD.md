# trigger-click-fix

## Context

Claim: `zone.trigger(id, fn: (focusId: string) => BaseCommand)` 단일 시그니처로 통일. BaseCommand/CommandFactory 직접 전달 제거.

Before → After:
- Before: `zone.trigger(id, BaseCommand | CommandFactory)` — typeof 분기, factory에 focusId string 직접 전달 → payload 불일치 → headless click no-op
- After: `zone.trigger(id, (focusId) => BaseCommand)` — 단일 함수 시그니처, 호출부가 payload 래핑 책임

Risks: `() => cmd()` 래핑이 bare `cmd()`보다 verbose (화살표 함수 6자 추가). 감수 가능.

## Now
- [ ] T1: types.ts + index.ts — trigger 시그니처 & 구현을 함수 단일로 변경 (Plan #1,#2,#3)
- [ ] T2: simulate.ts — typeof 분기 제거, 항상 onActivate(focusId) 호출 (Plan #4)
- [ ] T3: 소비자 마이그레이션 — todo/inspector/builder/docs-viewer/carousel 18개 호출부 (Plan #5-#11)
- [ ] T4: 테스트 갱신 — zone-trigger-api.test.ts 업데이트 + todo-trigger-click.test.ts 5개 PASS 증명 (Plan #12,#13)

## Done

## Unresolved
- overlay API(`zone.overlay()`)도 같은 원칙 적용? → 백로그

## Ideas
- createSimpleTrigger 제거 가능성 (함수 단일화 후 미사용 시)
