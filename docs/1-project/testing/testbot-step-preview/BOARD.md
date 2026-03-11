# testbot-step-preview

| Key | Value |
|-----|-------|
| Claim | TestBot 패널에서 테스트 실행 전에 각 테스트의 step 목록(press/click/expect)을 dry-run으로 추출하여 미리 표시한다 |
| Before | 테스트 실행 전에는 "Ready to run"만 표시. 어떤 동작을 하는 테스트인지 알 수 없음 |
| After | dry-run mock page로 step 추출 → 패널에 step preview 즉시 표시. 실행 전에도 테스트 내용 파악 가능 |
| Size | Light |
| Risk | dry-run 시 items 파라미터가 없으면 일부 스크립트가 에러 발생 가능 — dummy items로 우회 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | createDryRunPage() 구현 — action 기록용 mock Page | BrowserStep[] 반환 | ✅ | tsc 0 \| packages/os-devtool/src/testbot/createDryRunPage.ts |
| T2 | initSuites 시 dry-run 실행하여 steps 사전 추출 | planned 상태의 suites에 steps 존재 | ✅ | populateDryRun command + TestBotPanel useEffect |
| T3 | TestBotPanel에서 planned + steps 있으면 step preview 표시 | "Ready to run" 대신 step 목록 | ✅ | "N steps preview" 텍스트 + 확장 시 step 상세 |
| T4 | E2E 검증 — /todo에서 planned suites에 step preview 노출 | Playwright test PASS | ✅ | 3 PASS \| 9.3s \| Chromium headless |

## Unresolved

(없음)
