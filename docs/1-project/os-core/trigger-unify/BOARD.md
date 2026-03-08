# trigger-unify

## Context

Claim: `AppHandle.createTrigger()` 3개 오버로드를 `zone.trigger(id, cmd)` + `zone.overlay(id, config)` 2-API로 통합한다. Trigger 선언이 headless + React 양쪽에서 단일 원천이 된다.

Before → After:
- Before: 선언 3곳 (bind triggers[] + createTrigger + namespaced export). 29개 createTrigger 호출 across 11 files
- After: bind triggers 객체 1곳. zone.trigger()가 TriggerBinding + React.FC를 동시 반환

Risks:
- 소비자 29개 일괄 마이그레이션 — 한 파일 누락 시 tsc 에러로 즉시 발견
- Item sub-trigger(ExpandTrigger/CheckTrigger)와의 관계 — 이번 스코프 밖, DOM 전용으로 유지
- role default triggers — 별도 후속 프로젝트

## Now

(all done)

## Done

- [x] T1: zone.trigger() + zone.overlay() API 신설 — tsc 0 | +7 tests | 7/7 pass ✅
- [x] T2: Todo app 마이그레이션 — tsc 0 | 79 tests pass | 5 pre-existing fail unchanged ✅
- [x] T3: Inspector + Builder 마이그레이션 — tsc 0 ✅
- [x] T4: Showcase + APG + DocsViewer 마이그레이션 (8 files) — tsc 0 ✅
- [x] T5: 구 API 삭제 (AppHandle.createTrigger 3 overloads) — tsc 0 ✅
- [x] T6: 테스트 검증 — 665 pass | 27 pre-existing fail | 0 new regression ✅

## Unresolved

- role default triggers (tree→expand, checkbox→check 자동 포함) — 별도 프로젝트
- Item sub-trigger(ExpandTrigger/CheckTrigger)의 장기 방향 — DOM 전용 유지 vs 통합

## Ideas

- ZIFT → ZIF + Overlay 개념 재편 (Trigger를 프리미티브에서 제거, Overlay를 프리미티브로 승격)
- 원칙 #21 ZIFT 분류표 갱신 ("동작을 실행한다 → Trigger" 삭제)
