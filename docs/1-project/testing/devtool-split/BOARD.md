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

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | `packages/os-testing/` 패키지 생성 | tsc -b 0 | ✅ | tsc 0, 62 files |
| T2 | headless 코드 이동 | tsc -b 0 | ✅ | tsc 0 |
| T3 | import 경로 갱신: `@os-devtool/testing/` → `@os-testing/` | tsc -b 0 + 테스트 PASS | ✅ | tsc 0 \| 720 PASS \| 20 pre-existing fail |
| T4 | TestBotRegistry + createBrowserPage 잔류 확인 | tsc -b 0 | ✅ | 3 files in os-devtool/testing/ |
| T5 | `src/inspector/` → `packages/os-devtool/src/inspector/` 이동 | tsc -b 0 | ✅ | tsc 0 \| alias 6 config files 갱신 |
| T6 | `src/apps/testbot/` → `packages/os-devtool/src/testbot/` 이동 | tsc -b 0 | ✅ | tsc 0 \| `@apps/testbot` → `@os-devtool/testbot` |
| T7 | `@inspector/` path alias → 패키지 경로 갱신 | tsc -b 0 + 브라우저 빌드 OK | ✅ | 6 config files: tsconfig, tsconfig.app, vite, vitest, vite.docs, vitest.browser |
| T8 | 옛 `packages/os-devtool/src/testing/` headless 파일 삭제 | grep 0 + tsc -b 0 | ✅ | 10 files + lib/ + scripts/ 삭제, 3 browser files만 잔류 |

## Decisions

- `testbot-manifest.ts`는 `src/testing/`에 잔류 — `import.meta.glob`이 src-relative 패턴 사용
- `@inspector` alias 유지 — 기존 소비자 import 경로 변경 최소화
- `@apps/testbot` → `@os-devtool/testbot` — testbot이 os-devtool 패키지에 귀속

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | `Kbd` 컴포넌트를 CommandPalette, Sidebar에서 `@inspector/`로 import — os-devtool 의존이 앱에 생김. 괜찮은가? | 앱→devtool 역방향 의존 |
