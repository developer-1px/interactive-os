# /plan — goto → setupZone 리네임

> Discussion Clear: `page.goto(zoneId, config)`를 `page.setupZone(zoneId, config)`으로 전수 치환. `goto`는 URL only로 남긴다.
> 목적: Playwright 동형 API 보장. 에이전트 관성에 의한 레거시 부활 구조적 차단.

## 변환 명세표

### WP-A: API 정의 변경 (4건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 1 | `os-devtool/testing/page.ts:175` core impl | `function goto(target, opts?)` dual-mode | `goto(url)` URL-only + `setupZone(zoneId, opts)` zone-only. URL = `startsWith("/")` | Clear | -- | tsc 0 |
| 2 | `os-devtool/testing/createOsPage.ts:90` | `goto(zoneId, opts?)` on OsPage | `setupZone(zoneId, opts?)` | Clear | ->1 | tsc 0 |
| 3 | `os-devtool/testing/createHeadlessPage.ts:153` | `goto(zoneId, opts?)` on HeadlessPage | `setupZone(zoneId, opts?)` | Clear | ->1 | tsc 0 |
| 4 | `os-sdk/app/defineApp/types.ts:254` AppPage | `goto(url: string): void` | 변경 없음 (URL only, 이미 올바름) | Clear | -- | -- |

### WP-B: runScenarios + infra (3건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 5 | `os-devtool/testing/runScenarios.ts:61,99` | `page.goto(scenario.zone, ...)` x2 | `page.setupZone(scenario.zone, ...)` | Clear | ->1 | tsc 0 |
| 6 | `os-devtool/testing/scripts.ts:50` JSDoc | `page.goto()` 참조 | `page.setupZone()` 참조 | Clear | -- | -- |
| 7 | `os-devtool/testing/index.ts:13` example | `page.goto("zone", ...)` 예시 | `page.setupZone("zone", ...)` 예시 | Clear | -- | -- |

### WP-C: APG 테스트 전수 치환 (22 파일, ~44 호출)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 8 | `tests/apg/accordion.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 9 | `tests/apg/button.apg.test.ts` | `page.goto(` x2 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 10 | `tests/apg/carousel.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 11 | `tests/apg/checkbox.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 12 | `tests/apg/combobox.apg.test.ts` | `page.goto(` x2 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 13 | `tests/apg/dialog.apg.test.ts` | `page.goto(` x6 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 14 | `tests/apg/disallow-empty-initial.test.ts` | `page.goto(` x6 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 15 | `tests/apg/disclosure.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 16 | `tests/apg/dropdown-menu.apg.test.ts` | `page.goto(` x2 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 17 | `tests/apg/feed.apg.test.ts` | `page.goto(` x8 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 18 | `tests/apg/listbox.apg.test.ts` | `page.goto(` x6 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 19 | `tests/apg/menu-button.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 20 | `tests/apg/menu.apg.test.ts` | `page.goto(` x3 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 21 | `tests/apg/meter.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 22 | `tests/apg/navtree.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 23 | `tests/apg/radiogroup.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 24 | `tests/apg/switch.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 25 | `tests/apg/tabs.apg.test.ts` | `page.goto(` x2 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 26 | `tests/apg/toolbar.apg.test.ts` | `page.goto(` x4 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 27 | `tests/apg/tooltip.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 28 | `tests/apg/tree.apg.test.ts` | `page.goto(` x2 | `page.setupZone(` | Clear | ->1 | tsc 0 |
| 29 | `tests/apg/treegrid.apg.test.ts` | `page.goto(` x1 | `page.setupZone(` | Clear | ->1 | tsc 0 |

### WP-D: headless/integration 테스트 치환 (잔여 zone-mode 호출)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 30 | `tests/headless/` 내 zone-mode goto 전수 | `page.goto("zone", ...)` | `page.setupZone("zone", ...)` | Clear | ->1 | tsc 0 |

### WP-E: URL-mode goto 확인 (변경 없음)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 31 | `tests/e2e/*.spec.ts` (14 calls) | `page.goto("/...")` | 변경 없음 | Clear | -- | -- |
| 32 | `tests/headless/apps/todo/*.test.ts` (3 calls) | `page.goto("/")` | 변경 없음 | Clear | -- | -- |

## Summary

- 전행 Clear. 32행.
- WP-A: API 정의 4건 (핵심)
- WP-B: Infra 3건
- WP-C: APG 테스트 22파일
- WP-D: headless 잔여
- WP-E: URL mode 확인 (변경 없음)
- 검증: `tsc --noEmit` 0 errors + 기존 테스트 pass/fail 수 변동 없음

## 라우팅

승인 후 → `/go` (apg-suite) — Meta 프로젝트, 기계적 치환. Red/Green 불필요.
