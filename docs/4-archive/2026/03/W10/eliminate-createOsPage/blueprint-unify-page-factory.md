# Blueprint: createHeadlessPage + createPage → 단일 팩토리 통합

## 1. Goal

테스트 팩토리를 **`createPage()` 하나**로 통합한다.

**UDE (현재 바람직하지 않은 효과):**
- 같은 역할(headless OS 테스트)을 수행하는 팩토리가 3개 존재: `createOsPage` → `createHeadlessPage` → `createPage`
- `createHeadlessPage`는 `createOsPage`의 Playwright 래퍼이고, `createOsPage`는 내부에서 `defineApp(dummyApp)` + `createPage(dummyApp)`를 호출
- 경로가 2개이므로 LLM이 세션마다 다른 팩토리를 선택할 수 있음 (Pit of Success 위반)

**Done Criteria:**
- `createPage()` (app 없이) = OS-level 테스트, `createPage(app, component?)` = 앱 테스트
- `createOsPage.ts` 삭제
- `createHeadlessPage.ts` 삭제
- 167 files / 1,754 tests GREEN 유지

## 2. Why

**rules.md 원칙 위반:**
> "같은 문제를 푸는 선택지가 여럿이면, 이 프로젝트에서는 하나만 열려 있다."

`createHeadlessPage`와 `createPage`는 동일한 문제(headless 테스트 실행)를 풀지만, 진입점이 2개다. `createOsPage`까지 포함하면 3개.

**근본 원인:** `createOsPage`가 먼저 존재했고, `createPage(app)`가 나중에 추가되었으나, `createOsPage`를 제거하는 대신 `createHeadlessPage`라는 래퍼를 만들어 호환성을 유지. 역사적 이유일 뿐, 설계적 필연이 아님.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|---|---|---|
| A1. OS-level 테스트는 앱 없이 돌아가야 한다 | **유효** — APG, os-core 단위 테스트는 앱 정의가 없음 | — |
| A2. 앱 없는 테스트를 위해 별도 팩토리가 필요하다 | **무효** — `createOsPage`가 이미 `defineApp(dummyApp)` + `createPage(dummyApp)` 호출. dummyApp 생성을 `createPage()` 오버로드 내부로 옮기면 됨 | `createPage()` no-arg 오버로드 |
| A3. `createHeadlessPage`의 Playwright 래핑 로직이 `createPage`와 다르다 | **무효** — `createPage.locator()`도 동일한 `resolveElement` + `readFocusedItemId` 사용. 차이는 assert 래핑 방식(sync vs async)뿐이고, 이미 `expect.ts`가 이를 브릿지 | `expect.ts` 래퍼로 충분 |
| A4. `OsPage` 인터페이스의 `set*` 메서드들이 필요하다 | **부분 유효** — `goto()` 옵션으로 대부분 대체 가능. `setItems`, `setConfig` 등은 `goto()` 재호출로 해결. 단, `setValueNow`, `setActiveZone` 등은 multi-zone/value 테스트에서 필요 | `goto()` 확장 + 필요한 것만 page에 잔류 |
| A5. `OsLocator` (sync)와 `Locator` (async)는 호환 불가 | **무효** — `expect.ts`가 이미 sync→async 변환을 수행. `createPage.locator()`가 이미 sync 내부를 반환하므로, `expect()` 래퍼만 있으면 Playwright 호환 |

**핵심 발견:** A2 무효화 → 별도 팩토리 불필요. `createPage()` no-arg = dummyApp 내장.

## 4. Ideal

통합 후 테스트 작성 패턴:

```ts
// OS-level (APG, os-core 단위 테스트) — app 없음
import { createPage, expect } from "@os-devtool/testing";
const page = createPage();
page.goto("zone", { items: [...], role: "listbox" });
await page.keyboard.press("ArrowDown");
await expect(page.locator("#item")).toBeFocused();

// App-level (todo, docs 통합 테스트) — app 있음
import { createPage } from "@os-devtool/testing";
const page = createPage(TodoApp, TodoView);
page.goto("list");
await page.keyboard.press("ArrowDown");

// Auto-runner (변경 없음)
runScenarios(scenarios);                    // OS-level
runScenarios(scenarios, { app, component }); // App-level
```

**부정적 분기:**
- `createPage()` no-arg가 `GotoOptions`의 `items`, `role`을 받아야 함 → `createPage(app)` 경로의 goto와 시그니처 분기 필요. 이미 `runScenarios`에서 동일한 분기를 수행 중이므로 복잡도 증가 없음

## 5. Inputs

**필수 파일:**
- `packages/os-devtool/src/testing/createOsPage.ts` (673 lines) — 제거 대상
- `packages/os-devtool/src/testing/createHeadlessPage.ts` (183 lines) — 제거 대상
- `packages/os-devtool/src/testing/page.ts` (546 lines) — 통합 대상
- `packages/os-devtool/src/testing/runScenarios.ts` (101 lines) — import 변경
- `packages/os-devtool/src/testing/types.ts` — Locator/Page 인터페이스 (변경 없음)
- `packages/os-devtool/src/testing/expect.ts` — assert 래퍼 (변경 없음)
- `packages/os-devtool/src/testing/index.ts` — re-export 정리

**호출자 (import 변경 필요):**
- `createHeadlessPage` 직접 사용: 10파일 (5 tests/script + 5 packages/os-core)
- `createOsPage` 직접 사용: 19파일 (이미 BOARD #7-#10에서 마이그레이션 진행 중)
- `runScenarios` 사용: 2파일 (import 경로 불변, 내부 변경만)

**참조:**
- `.agent/knowledge/verification-standards.md` — Zone→Input→ARIA 원칙
- `docs/1-project/testing/eliminate-createOsPage/BOARD.md` — 기존 마이그레이션 계획

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|---|---|---|---|---|---|
| G1 | `createPage()` no-arg 오버로드 | 없음 — 현재 `createPage(app)` 필수 | `page.ts`에 no-arg 분기 + dummyApp 내장 | High | — |
| G2 | no-arg 모드의 `goto(zone, { items, role })` | `createAppPage.goto()`는 `zoneBindingEntries`에서 바인딩 해석 | no-arg일 때 `items`/`role`을 수동으로 ZoneRegistry에 등록하는 로직 | High | G1 |
| G3 | `OsPage`의 `set*` 메서드 중 필요한 것 잔류 | `createOsPage`에 15개 `set*` + command export | `goto()` 확장으로 대체 가능한 것 제거, 불가능한 것만 `page` 반환 타입에 추가 | Med | G1 |
| G4 | `OsLocator` (sync) → `Locator` (async) 통합 | `createHeadlessPage`가 sync→async 래핑 수행 | `createAppPage.locator()`를 `Locator & LocatorAssertions` 반환으로 확장 | High | G1 |
| G5 | `createHeadlessPage` 호출자 10파일 import 전환 | `createHeadlessPage` import 존재 | `createPage()`로 일괄 변환 | Low | G1 |
| G6 | `createOsPage` 호출자 19파일 import 전환 | `createOsPage` import 존재 (BOARD #7-#10) | 기존 마이그레이션 계획과 합류 | Low | G1, G2 |
| G7 | `runScenarios` 내부 변경 | `createHeadlessPage()` 호출 | `createPage()` 호출로 변경 | Low | G1 |
| G8 | mock 상태 관리 (`mockItems`, `mockConfig` 등) | `createOsPage`에 mutable refs로 존재 | `createPage()` no-arg 모드 내부에 동일 패턴 이동 | Med | G2 |
| G9 | `index.ts` re-export 정리 | `createOsPage`, `createHeadlessPage`, `OsPage`, `OsLocator` export | 삭제 후 `createPage`, `Page`, `Locator`만 export | Low | G5, G6 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|---|---|---|---|---|
| E1 | `createPage()` 오버로드 구현 | Clear | — | `page.ts`에 no-arg 분기 추가. `defineApp("__test__", {})`로 dummyApp 내장. `GotoOptions` 확장 (`items`, `role` 수용) |
| E2 | locator Playwright 호환 | Clear | E1 | `createAppPage.locator()`가 `Locator & LocatorAssertions` 반환하도록 확장. `createHeadlessPage`의 래핑 로직을 `page.ts`로 이동 |
| E3 | mock 상태 이동 | Clear | E1 | `createOsPage`의 `mockItems`/`mockConfig`/`mockRects` 등을 `createPage()` no-arg 분기 내부로 이동 |
| E4 | `goto()` 통합 | Complicated | E1, E3 | no-arg 모드: `goto(zone, { items, role, config, ... })` → ZoneRegistry 수동 등록. app 모드: 기존대로 바인딩 해석. 두 경로의 `goto` 시그니처 통합 |
| E5 | `runScenarios` 변경 | Clear | E1 | `createHeadlessPage()` → `createPage()` |
| E6 | `createHeadlessPage` 호출자 10파일 전환 | Clear | E1, E2 | import 변경 + `createHeadlessPage()` → `createPage()` |
| E7 | `createOsPage` 호출자 19파일 전환 | Clear | E4 | 기존 BOARD #7-#10 합류. `set*` 호출을 `goto()` 옵션으로 전환 |
| E8 | `createHeadlessPage.ts` 삭제 | Clear | E5, E6 | 파일 삭제 |
| E9 | `createOsPage.ts` 삭제 | Clear | E7 | 파일 삭제 (BOARD #11) |
| E10 | `index.ts` + `page.ts` export 정리 | Clear | E8, E9 | 죽은 export 제거. `OsPage`, `OsLocator` 타입 삭제 (BOARD #12) |
| E11 | 전체 테스트 GREEN 확인 | Clear | E10 | `npx vitest --run` — 167 files, 1,754 tests |

**의존 그래프:**
```
E1 ─┬─ E2 ─┐
    ├─ E3 ─┼─ E4 ─── E7 ─── E9 ─┐
    ├─ E5 ─┤                      ├─ E10 ─── E11
    └─ E6 ─┴─ E8 ────────────────┘
```

**핵심 리스크:** E4 (goto 통합)가 가장 복잡. `createOsPage.goto()`의 mock fallback 로직과 `createAppPage.goto()`의 바인딩 해석 로직을 하나의 함수에 공존시켜야 함. 분기 기준: `zoneBindingEntries.has(zoneName)` 여부.

---

## 기존 BOARD와의 관계

이 Blueprint는 `eliminate-createOsPage` BOARD의 **#7~#12를 재편**한다:

| 기존 BOARD | 이 Blueprint |
|---|---|
| #7 tests/apg/ 마이그레이션 | E7 (합류) |
| #8 tests/integration/builder/ | E7 (합류) |
| #9 tests/integration/docs+todo | E7 (합류) |
| #10 tests/script+e2e | E6 + E7 (합류) |
| #11 createOsPage.ts 삭제 | E9 |
| #12 page.ts export 정리 | E10 |
| (신규) createPage() 오버로드 | E1~E4 (선행 작업) |
| (신규) createHeadlessPage.ts 삭제 | E8 |
