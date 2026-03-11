# headless-test-gaps

## Context

Claim: headless 테스트 인프라의 OS core gap을 수정하여 .todo 15개 테스트를 GREEN으로 복구한다.

Why: 20개 테스트가 실패하여 .todo로 전환됨. G4(docs-scenarios 5건)는 os-core 핸들러 수정이 필요하여 별도 scope. 나머지 15건은 `packages/os-testing/` 수정으로 해결 가능.

Before → After:
- Before: 27 todo, 720 pass, 0 fail
- After: 12 todo (G4 5건 + 기존 7건), 735 pass, 0 fail

Architecture:
- 수정 대상: `packages/os-testing/src/` (zoneSetup.ts, simulate.ts, typeIntoField.ts, page.ts)
- 영향 범위: headless 테스트 인프라만. os-core 핸들러 수정 없음

## Now

- [ ] T1: seedInitialState를 page.goto에서 호출 — 크기: S, 의존: —
- [ ] T2: 진단: multi-select 실패 원인 추적 + 수정 — 크기: M, 의존: —
- [ ] T3: 진단: field trigger headless 경로 수정 — 크기: M, 의존: —
- [ ] T4: 진단: Space→OS_CHECK 실패 원인 추적 + 수정 — 크기: S, 의존: →T2
- [ ] T5: check-triggers 테스트 재작성 — 크기: S, 의존: —

## Done

(없음)

## Unresolved

- G4 (docs-scenarios 5건): tree nav + tab focus leak + projection — 별도 프로젝트 필요 (os-core 수정)
