# /plan — Testing Page Layer Separation

## Goal
`createPage` → `createHeadlessPage` (Playwright subset only), `createOsPage` → `createTestBench` (별도 모듈), 현 `createHeadlessPage` 삭제.

## Constraints
- C1. tsc 통과 (테스트 실패 OK — APG 테스트 전면 재작성 예정)
- C2. createHeadlessPage = Playwright subset만 노출
- C3. createTestBench는 createHeadlessPage 무의존

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `testing/createOsPage.ts` | `createOsPage()` 684줄, `createPage(dummyApp)` 내부 호출 | `test-bench/createTestBench.ts`로 이동+리네이밍. os 직접 사용, createPage 무의존 | Clear | — | tsc 0 | 없음 (소비자=0 직접) |
| 2 | `testing/createHeadlessPage.ts` | `createOsPage()` 래핑 async API 187줄 | 삭제 | Clear | →#1 | tsc 0 | runScenarios.ts, index.ts 리와이어링 필요 |
| 3 | `testing/page.ts:createPage` | `export function createPage<S>(app, Component?)` | `export function createHeadlessPage<S>(app, Component?)` 리네이밍 | Clear | — | tsc 0 | 소비자 26파일 import 변경 |
| 4 | `testing/page.ts` OS escape hatch | `dispatch()`, `kernel`, `state` getter, `setupZone` 반환에 포함 | setupZone 유지, dispatch/kernel/state는 AppPageInternal 경유만 | Clear | →#3 | tsc 0 | contracts.ts OsPage 타입 변경 |
| 5 | `sdk/defineApp/types.ts:AppPage` | `kernel`, `focusedItemId()`, `selection()`, `activeZoneId()`, `locator(): OsLocator` | `locator()` 리턴타입을 자체 Locator로. 나머지 OS API는 AppPageInternal로 이동 | Clear | — | tsc 0 | 하위 호환 깨짐 (APG 테스트 — 허용됨) |
| 6 | `testing/index.ts` barrel | `export { createHeadlessPage } from "./createHeadlessPage"` | `export { createHeadlessPage } from "./page"` | Clear | →#2,#3 | tsc 0 | — |
| 7 | `testing/runScenarios.ts` | `import { createHeadlessPage } from "./createHeadlessPage"` + `import { createPage } from "./page"` | `import { createHeadlessPage } from "./page"` (하나로 통일) | Clear | →#2,#3 | tsc 0 | — |
| 8 | `tests/apg/helpers/contracts.ts` | `import type { OsPage } from "@os-devtool/testing/page"` | `import type { AppPageInternal } from "@os-sdk/app/defineApp/types"` 또는 새 타입 | Clear | →#5 | tsc 0 | — |
| 9 | 20 APG test files | `import { createPage } from "@os-devtool/testing/page"` | `import { createHeadlessPage } from "@os-devtool/testing/page"` | Clear | →#3 | tsc 0 | — |
| 10 | 3 app/OS test files | `import { createPage } from "@os-devtool/testing/page"` | `import { createHeadlessPage } from "@os-devtool/testing/page"` | Clear | →#3 | tsc 0 | — |
| 11 | `page.ts:ZoneOrderEntry` import | `import type { ZoneOrderEntry } from "./createOsPage"` | `ZoneOrderEntry`를 page.ts 내부에 인라인 정의 | Clear | →#1 | tsc 0 | — |
| 12 | `page.ts:OsPage` re-export | `export type { OsPage } from "./createOsPage"` | 삭제. OsPage → TestBench 타입으로 이전 | Clear | →#1 | tsc 0 | contracts.ts 참조 변경 |

## MECE 점검
1. CE: #1~#12 실행하면 목표 달성 (두 도구 분리 + 리네이밍 + 소비자 리와이어링) ✓
2. ME: 중복 없음 ✓
3. No-op: 없음 ✓

## 라우팅
승인 후 → `/go` (기존 프로젝트: testing/page-layer-separation) — Meta 프로젝트, 직접 실행
