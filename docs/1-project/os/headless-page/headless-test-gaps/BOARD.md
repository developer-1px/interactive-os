# headless-test-gaps

| Key | Value |
|-----|-------|
| Claim | headless 테스트 인프라의 OS core gap을 수정하여 .todo 15개 테스트를 GREEN으로 복구한다 |
| Before | 27 todo, 720 pass, 0 fail |
| After | 12 todo (G4 5건 + 기존 7건), 735 pass, 0 fail |
| Size | Light |
| Risk | os-core 핸들러 수정 없이 packages/os-testing/ 수정만으로 해결 가능한 범위 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | seedInitialState를 page.goto에서 호출 | 크기 S | ⬜ | — |
| T2 | 진단: multi-select 실패 원인 추적 + 수정 | 크기 M | ⬜ | — |
| T3 | 진단: field trigger headless 경로 수정 | 크기 M | ⬜ | — |
| T4 | 진단: Space→OS_CHECK 실패 원인 추적 + 수정 | 크기 S, 의존 T2 | ⬜ | — |
| T5 | check-triggers 테스트 재작성 | 크기 S | ⬜ | — |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | G4 (docs-scenarios 5건): tree nav + tab focus leak + projection | 별도 프로젝트 필요 (os-core 수정) |
