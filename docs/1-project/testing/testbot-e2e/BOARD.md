# testbot-e2e

| Key | Value |
|-----|-------|
| Claim | TestBot 패널의 eager-load + route/zone 필터링 변경을 Playwright E2E로 검증한다 |
| Before | TestBotRegistry 변경(eager load + filter)에 대한 검증 0. headless test 불가 (L1.5) |
| After | E2E spec이 route 이동 → TestBot 패널 → 매칭 테스트 목록 즉시 노출을 검증 |
| Size | Light |
| Risk | vite dev server 기동 필요. CI 환경에서 flaky 가능성 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | E2E spec: /todo 이동 → Inspector TESTBOT 탭 → planned suites 즉시 노출 확인 | playwright test PASS | ⬜ | |
| T2 | E2E spec: route 변경 시 매칭 스크립트가 바뀌는지 확인 (/todo → /docs) | playwright test PASS | ⬜ | |

## Unresolved

(없음)
