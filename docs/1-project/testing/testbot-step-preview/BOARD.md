# testbot-step-preview

| Key | Value |
|-----|-------|
| Claim | TestBot 패널에서 테스트 실행 전에 step 목록을 dry-run으로 표시하고, items 파라미터를 제거하여 1경계 원칙을 준수한다 |
| Before | 테스트 실행 전에는 "Ready to run"만 표시. items 파라미터가 1경계 원칙 위반 |
| After | dry-run step preview + items 제거. 스크립트가 page.locator('[data-item]').nth(n)으로 아이템 발견 |
| Size | Light |
| Risk | Locator.nth() 추가가 headless/browser/dry-run 3곳에 필요. 기존 테스트 regression |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | createDryRunPage() 구현 — action 기록용 mock Page | BrowserStep[] 반환 | ✅ | tsc 0 \| packages/os-devtool/src/testbot/createDryRunPage.ts |
| T2 | initSuites 시 dry-run 실행하여 steps 사전 추출 | planned 상태의 suites에 steps 존재 | ✅ | populateDryRun command + TestBotPanel useEffect |
| T3 | TestBotPanel에서 planned + steps 있으면 step preview 표시 | "Ready to run" 대신 step 목록 | ✅ | "N steps preview" 텍스트 + 확장 시 step 상세 |
| T4 | E2E 검증 — /todo에서 planned suites에 step preview 노출 | Playwright test PASS | ✅ | 3 PASS \| 9.3s \| Chromium headless |
| T5 | Locator.nth(n)/first()/last()/count() 추가 — types + headless + browser + dry-run | tsc 0 | ✅ | types.ts + locator.ts + createBrowserPage.ts + createDryRunPage.ts |
| T6 | TestScript.run()에서 items 파라미터 제거 | tsc 0 | ✅ | scripts.ts `run(page, expect)` 2-arg |
| T7 | testbot-todo.ts 마이그레이션 — items → page.locator('[data-item]').nth(n) | vitest PASS | ✅ | 15 scripts 마이그레이션 완료 |
| T8 | testbot-docs.ts 마이그레이션 — items → page.locator('[data-item]').nth(n) | vitest PASS | ✅ | 19 scripts 마이그레이션 완료 |
| T9 | callers 업데이트 — runScenarios, app.ts, E2E specs에서 items 전달 제거 + activeZoneFilter 추가 | tsc 0 + vitest PASS | ✅ | runScenarios.ts + app.ts + todo.spec.ts + docs-viewer.spec.ts |
| T10 | createDryRunPage에서 dummy items 제거 + dry-run step이 [data-item] 셀렉터 표시 | tsc 0 | ✅ | dryRunScript calls `script.run(page, dryRunExpect)` without items |

## Unresolved

(없음)
