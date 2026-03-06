# Blueprint: SDK 테스트 = createPage(app) 단일 경로

## 1. Goal

SDK 테스트 팩토리를 `createPage(app)` **하나**로 통합한다. `goto(zoneId)`는 Playwright subset (K2).

**UDE:**
- 팩토리 3개 공존: `createOsPage` → `createHeadlessPage` → `createPage(app)`
- `goto()`가 K3 (items, role, config 등 OS 개념을 직접 수용) — Playwright subset 위반
- "OS-level 테스트"라는 허상의 카테고리가 존재. 실체는 Zone 하나짜리 더미 앱 테스트

**Done Criteria:**
- `createPage(app)` = 유일한 SDK 테스트 팩토리
- `goto(zoneId)` = K2 네비게이션만 (Zone 선언은 `defineApp` + `zone.bind()`가 담당)
- `createOsPage.ts` 삭제, `createHeadlessPage.ts` 삭제
- `packages/os-core/` 내부 테스트 5개는 별도 체계로 분리 (이번 스코프 밖)
- 167 files GREEN 유지

## 2. Why

**rules.md 위반 2건:**

1. **Pit of Success** — "같은 문제를 푸는 선택지가 여럿이면, 하나만 열려 있다."
   - 현재 3개 팩토리가 같은 문제를 품 → LLM이 세션마다 다른 걸 선택

2. **100% Observable** — "TestPage = Playwright와 동형 API"
   - `goto(zone, { items, role, config })` = Playwright `goto(url)`과 동형이 아님
   - Zone 선언(K3)과 네비게이션(K2)이 뒤섞여 있음

**근본 원인:** `createOsPage`가 먼저 있었고, `defineApp` + `createPage(app)` 패턴이 나중에 추가됨. 그러나 레거시를 제거하는 대신 `createHeadlessPage` 래퍼로 호환성만 유지. 역사적 이유일 뿐 설계적 필연 아님.

**계층 분리 원칙 (이번 Discussion에서 합의):**
- SDK 테스트 = `createPage(app)` + K2 Playwright subset. 앱 개발자/에이전트가 사용
- OS-core 테스트 = 별도 체계. OS 내부 구현 검증. 혼용 금지

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|---|---|---|
| A1. APG 패턴 테스트는 앱 없이 돌아가야 한다 | **무효** — 이미 accordion, listbox 등 18개 APG 테스트가 `defineApp("test-X", {})` + `zone.bind()` + `createPage(app)` 패턴 사용 중 | 나머지 6개도 동일 패턴으로 전환 |
| A2. `goto()`에 items/role/config를 전달해야 한다 | **무효** — `zone.bind({ role, getItems, options })` 시점에 이미 선언됨. `goto()`는 활성화만 하면 됨 | `goto(zoneId)` 순수화 |
| A3. `focusedItemId`는 goto에서 받아야 한다 | **부분 유효** — Playwright `goto(url)` 후 `page.locator("#item").click()`으로 포커스 설정. 그러나 현재 테스트 대부분이 `goto(zone, { focusedItemId })`에 의존 | 단기: 유지. 장기: click으로 대체 가능 |
| A4. `runScenarios`가 더미 앱을 내부 생성해야 한다 | **유효** — TestScenario에 zone/role/items 정보 있음. runScenarios가 defineApp 수행하면 테스트 작성자는 K2만 신경 씀 | runScenarios 내부에서 defineApp |
| A5. OS-core 테스트(5개)도 이 체계에 포함해야 한다 | **무효** — OS 내부 테스트는 SDK 계약과 별개. 별도 체계로 분리 | 이번 스코프 밖 |

## 4. Ideal

### 4.1 수동 테스트 (APG, 앱 통합)

```ts
// 모든 SDK 테스트의 유일한 패턴
const app = defineApp("test-listbox", {});
const zone = app.createZone("my-zone");
zone.bind({ role: "listbox", getItems: () => ITEMS, options: CONFIG });

const page = createPage(app);
page.goto("my-zone");                              // K2: 네비게이션만
await page.locator("#apple").click();               // K2
await expect(page.locator("#banana")).toBeFocused(); // K2
```

### 4.2 Auto-runner (runScenarios)

```ts
// testbot-todo.ts — 변경 없음
export const scenarios: TestScenario[] = [
  { zone: "list", items: LIST_ITEMS, role: "listbox", scripts: [...] }
];

// test file
runScenarios(scenarios);
// 내부: defineApp + zone.bind(scenario) + createPage(app) + goto(zone)
```

### 4.3 goto 시그니처

```ts
// Before (K3 오염)
page.goto("zone", { items, role, config, focusedItemId, onAction, treeLevels, ... });

// After (K2 순수)
page.goto("zone-id");
// 또는 단기 호환
page.goto("zone-id", { focusedItemId?: string });
```

### 4.4 부정적 분기

- `focusedItemId` 제거 시 기존 테스트 60+곳 변경 필요 → 단기 유지, 장기 deprecation
- `runScenarios` 내부의 `defineApp` 생성은 `TestScenario.zone` + `.role` + `.items` 필수 → 기존 시나리오 호환

## 5. Inputs

**변경 대상 파일:**

| 파일 | 변경 | Lines |
|------|------|-------|
| `packages/os-devtool/src/testing/page.ts` | goto 시그니처 축소, export 정리 | 546 |
| `packages/os-devtool/src/testing/runScenarios.ts` | OS-level 분기에서 defineApp 자동 생성 | 101 |
| `packages/os-devtool/src/testing/index.ts` | re-export 정리 | ~20 |
| `packages/os-sdk/src/app/defineApp/types.ts` | `AppPage.goto()` 시그니처 축소 | ~10 |

**마이그레이션 대상 (tests/):**

| 카테고리 | 파일 수 | 현재 패턴 | 목표 패턴 |
|----------|---------|-----------|-----------|
| `createOsPage` 사용 (APG) | 6 | `createOsPage` + `setRole` + `setItems` | `defineApp` + `zone.bind` + `createPage(app)` |
| `createOsPage` 사용 (builder) | 3 | `createOsPage` + 수동 ZoneRegistry | `defineApp` + `zone.bind` + `createPage(app)` |
| `createOsPage` 사용 (e2e) | 1 | `createOsPage` | `defineApp` + `createPage(app)` |
| `createHeadlessPage` 사용 (tests/) | 5 | `createHeadlessPage` + `goto(zone, {items, role})` | `defineApp` + `zone.bind` + `createPage(app)` |
| `createPage(app)` + goto K3 opts | 34 | `createPage(app)` + `goto(zone, {focusedItemId})` | 유지 (focusedItemId는 단기 허용) |

**스코프 밖:**

| 파일 | 이유 |
|------|------|
| `packages/os-core/` 내부 5개 `createHeadlessPage` 사용 | OS-core 별도 체계. 이번 스코프 밖 |
| `tests/script/devtool/` 4개 `createOsPage` 사용 | devtool 인프라 테스트 — SDK가 아님. os-core 체계로 분류 |

**삭제 대상:**

| 파일 | Lines |
|------|-------|
| `packages/os-devtool/src/testing/createOsPage.ts` | 673 |
| `packages/os-devtool/src/testing/createHeadlessPage.ts` | 183 |

**참조:**
- `.agent/knowledge/verification-standards.md`
- `docs/1-project/testing/eliminate-createOsPage/BOARD.md`
- 기존 정규 패턴: `tests/apg/accordion.apg.test.ts` (defineApp + createPage 모범 사례)

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|---|---|---|---|---|---|
| G1 | `goto(zoneId)` K2 순수화 | `goto(zone, { items, role, config, focusedItemId, ... })` K3 혼합 | `page.ts`의 goto에서 items/role/config 파라미터 제거. focusedItemId는 단기 유지 | High | — |
| G2 | `runScenarios` OS-level 분기에서 defineApp 자동 생성 | `createHeadlessPage()` + 수동 zone setup | `runOsScenarios` 내부: `defineApp("scenario-test")` + `zone.bind(scenario)` + `createPage(app)` | High | G1 |
| G3 | APG 6파일 createOsPage → defineApp 패턴 전환 | `createOsPage` + `setRole/setItems/setConfig` | `defineApp` + `zone.bind()` + `createPage(app)` + `goto(zoneId)` | Med | G1 |
| G4 | builder 3파일 createOsPage → defineApp 패턴 전환 | `createOsPage` + 수동 ZoneRegistry/Keybindings | `defineApp` + `zone.bind()` + `createPage(app)` | Med | G1 |
| G5 | tests/ createHeadlessPage 5파일 전환 | `createHeadlessPage` + `goto(zone, {items, role})` | `defineApp` + `zone.bind()` + `createPage(app)` | Low | G1 |
| G6 | `createHeadlessPage.ts` 삭제 | 파일 존재 (183 lines) | SDK 경로에서 import 0 후 삭제 | Low | G2, G5 |
| G7 | `createOsPage.ts` 삭제 | 파일 존재 (673 lines) | SDK 경로에서 import 0 후 삭제. os-core/devtool 테스트는 별도 체계 | Low | G3, G4 |
| G8 | page.ts + index.ts export 정리 | `OsPage`, `OsLocator`, `GotoOptions` export | 불필요 타입/함수 삭제 | Low | G6, G7 |
| G9 | `AppPage.goto()` 타입 시그니처 축소 | `goto(zone, { items, focusedItemId, config })` | `goto(zone, { focusedItemId? })` — items, config 제거 | Med | G1 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|---|---|---|---|---|
| E1 | `goto()` K2 순수화 | Clear | — | `page.ts`: goto에서 items/role/config 파라미터 제거. focusedItemId만 잔류. `types.ts` AppPage 시그니처 동기화 |
| E2 | `runScenarios` defineApp 내장 | Clear | E1 | `runOsScenarios`: `createHeadlessPage()` → `defineApp` + `zone.bind(scenario)` + `createPage(app)` + `goto(zone)` |
| E3 | APG 6파일 전환 | Clear | E1 | slider, grid, meter, spinbutton, slider-multithumb, window-splitter: `createOsPage` → `defineApp` + `zone.bind` 패턴 (accordion.apg.test.ts가 모범 사례) |
| E4 | builder 3파일 전환 | Complicated | E1 | builder-esc-deselect, force-deselect-zone, when-router-decision-table: 수동 ZoneRegistry/Keybindings 사용 → `defineApp` + keybindings 옵션으로 전환 |
| E5 | tests/ createHeadlessPage 5파일 전환 | Clear | E1 | aria-listbox, aria-grid, aria-toolbar, aria-radiogroup, playwright-compat → `defineApp` + `createPage(app)` |
| E6 | e2e 1파일 전환 | Clear | E1 | stale-focus-recovery.test.ts |
| E7 | `createHeadlessPage.ts` 삭제 | Clear | E2, E5 | import 0 확인 후 파일 삭제 |
| E8 | `createOsPage.ts` SDK 경로 분리 | Complicated | E3, E4, E6 | SDK 테스트에서 import 0 확인. os-core/devtool 잔여 사용은 별도 체계로 이관 판단 |
| E9 | export 정리 | Clear | E7, E8 | page.ts: `createOsPage` re-export 제거. index.ts: `OsPage`, `OsLocator`, `GotoOptions` 제거 |
| E10 | 전체 GREEN 확인 | Clear | E9 | `npx vitest --run` |

**의존 그래프:**
```
E1 ─┬─ E2 ─── E7 ─┐
    ├─ E3 ─┐       ├─ E9 ─── E10
    ├─ E4 ─┼─ E8 ──┘
    ├─ E5 ─┘
    └─ E6 ─┘
```

**핵심 수치:**
- 전환 대상: 15파일 (APG 6 + builder 3 + headless 5 + e2e 1)
- 삭제: 856 lines (createOsPage 673 + createHeadlessPage 183)
- 모범 사례: `tests/apg/accordion.apg.test.ts` — 이미 정규 패턴

**E4 (builder) 리스크:** builder 테스트 3파일이 수동 `ZoneRegistry.register()` + `Keybindings.registerAll()` 사용. `defineApp`의 zone keybindings 선언으로 전환 가능한지 확인 필요.
