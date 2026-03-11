# headless-test-gaps

| Key | Value |
|-----|-------|
| Claim | headless 테스트 인프라의 OS core gap을 수정하여 .todo 15개 테스트를 GREEN으로 복구한다 |
| Before | 27 todo, 720 pass, 0 fail |
| After | 20 todo, 727 pass, 0 fail |
| Result | T1 해결 (7 GREEN), T2-T5 진단 완료 → OS core gap으로 .todo 유지 |
| Size | Light |
| Risk | os-core 핸들러 수정 없이 packages/os-testing/ 수정만으로 해결 가능한 범위 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | expand tests rewrite (page API) | 크기 S | ✅ | 7 tests GREEN — test expectations fixed, not infra |
| T2 | multi-select 진단 | 크기 M | ✅ | OS core bug (OS_ACTIVATE→OS_SELECT double-toggle). 4 tests .todo 유지 |
| T3 | field trigger headless 경로 수정 | 크기 M | ✅ | 2 tests .todo 유지 (OS gap: field commit pipeline) |
| T4 | Space→OS_CHECK | 크기 S | ✅ | 1 test .todo 유지 (pre-existing OS gap) |
| T5 | check-triggers 재작성 | 크기 S | ✅ | 1 test .todo (1경계 원칙 위반 — rewrite needed) |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | G4 (docs-scenarios 5건): tree nav + tab focus leak + projection | 별도 프로젝트 필요 (os-core 수정) |
