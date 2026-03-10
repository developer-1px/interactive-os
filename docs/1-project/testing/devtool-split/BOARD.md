# devtool-split

| Key | Value |
|-----|-------|
| Claim | `os-devtool`을 `os-testing`(headless/CI) + `os-devtool`(Inspector/TestBot/브라우저)로 분리한다 |
| Before | `packages/os-devtool/src/testing/`에 headless + browser 코드 혼재. Inspector/TestBot은 `src/`에 흩어짐 |
| After | `packages/os-testing/`(headless only) + `packages/os-devtool/`(Inspector+TestBot+BrowserPage). 경계 기준 = 소비자(vitest vs browser) |
| Size | Light |
| Risk | Inspector 이관 시 `@inspector/` path alias → 패키지 경로로 10+파일 변경. tsc -b로 검증 필수 |

## 원칙

> **경계 기준 = 소비자**: os-testing은 vitest/CI만 소비. os-devtool은 브라우저 런타임만 소비.
> vitest에서 import되는 코드가 os-devtool에 있거나, 브라우저 전용 코드가 os-testing에 있으면 설계 위반.

## Now

### Phase 1: os-testing 추출

| # | Task | 크기 | 검증 | 상태 |
|---|------|------|------|------|
| T1 | `packages/os-testing/` 패키지 생성 (tsconfig, package.json) | S | tsc -b 0 | ⬜ |
| T2 | headless 코드 이동: page.ts, expect.ts, simulate.ts, types.ts, scripts.ts, runScenarios.ts, diagnostics.ts, zoneItems.ts, lib/ | M | tsc -b 0 | ⬜ |
| T3 | import 경로 갱신: `@os-devtool/testing/` → `@os-testing/` (tests/ + src/ 전체) | M | tsc -b 0 + 전체 테스트 PASS | ⬜ |

### Phase 2: Inspector + TestBot → os-devtool 이관

| # | Task | 크기 | 검증 | 상태 |
|---|------|------|------|------|
| T4 | TestBotRegistry + createBrowserPage를 `packages/os-devtool/`에 잔류 확인 (이미 os-devtool에 있음) | S | tsc -b 0 | ⬜ |
| T5 | `src/inspector/` → `packages/os-devtool/src/inspector/` 이동 | M | tsc -b 0 | ⬜ |
| T6 | `src/apps/testbot/` + `src/testing/testbot-manifest.ts` → `packages/os-devtool/src/testbot/` 이동 | S | tsc -b 0 | ⬜ |
| T7 | `@inspector/` path alias → 패키지 경로로 갱신 (10+파일) | M | tsc -b 0 + 브라우저 빌드 OK | ⬜ |
| T8 | 옛 `packages/os-devtool/src/testing/` 폴더 삭제 + 유령 참조 정리 | S | grep 0 + tsc -b 0 | ⬜ |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | `Kbd` 컴포넌트를 CommandPalette, Sidebar에서 import — os-devtool 의존이 앱에 생김. 괜찮은가? | T7 설계 |
