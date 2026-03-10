# Testing Tools — 테스트 도구 선택 기준과 코드 템플릿

> 테스트를 작성할 때 어떤 도구를 쓸지, 어떤 구조로 쓸지의 기준. 프로젝트별 도구 설정은 §Config에.
> 공식 문서: `docs/2-area/official/os/headless-page.md`

---

## Config

> **이 섹션이 워크플로우의 Slot이다.**
> `/red` Step 2가 "§Config를 따른다"고 참조하면 여기서 프로젝트별 도구와 템플릿을 읽는다.

### 도구 선택 기준

| 질문 | 예 → | 아니오 → |
|------|------|----------|
| 앱의 Zone/bind/keybinding을 검증하는가? | **Tier 2** `createPage(app)` | **Tier 1** `createPage(app)` + `bind()` + `goto()` |

### TestScript ONE — Write Once, Run Anywhere

> ⛔ **plain `describe/it` 테스트 금지.** page를 사용하는 테스트는 반드시 TestScript 형식.
> 유일한 예외: page를 사용하지 않는 순수 단위 테스트 (config 검증, 순수 함수 등).

**산출물 구조**:
- **본체**: `src/[app-path]/testbot-[app].ts` — TestScript + scenarios export
- **runner**: `tests/headless/apps/[app-name]/[name].test.ts` — `runScenarios(scenarios, App)` 한 줄

### Tier 2: 앱 통합 테스트 (표준)

> 실제 앱의 bind 경로를 검증. **dispatch 금지. click/press만 허용.**

**testbot-myapp.ts** (본체):

```ts
import type { TestScenario, TestScript } from "@os-testing/scripts";

export const zones = ["my-zone-a", "my-zone-b"];
export const group = "My App";

export const myScripts: TestScript[] = [
  {
    name: "§1 [기능]: [입력] → [기대 결과]",
    zone: "my-zone-a",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[1]}`)).toBeFocused();
    },
  },
];

export const scenarios: TestScenario[] = [
  {
    zone: "my-zone-a",
    role: "listbox",
    scripts: myScripts,
  },
];
```

**runner .test.ts** (3줄):

```ts
import { runScenarios } from "@os-devtool/testing/runScenarios";
import { MyApp } from "@/my-app/app";
import { scenarios } from "@/my-app/testbot-myapp";

runScenarios(scenarios, MyApp);
```

### Tier 1: OS 커널 테스트

> OS 자체의 커맨드 파이프라인을 검증. 앱 코드 없이 커널만 테스트.
> Tier 1도 TestScript 형식을 사용한다. `createTestBench()` 기반.

### 공통 금지 목록

- ❌ `dispatch()` 직접 호출 (Tier 2에서 절대 금지. Tier 1에서도 가급적 회피)
- ❌ 내부 함수 직접 호출 (`Keybindings.resolve()`, `createDrillDown()`, `resolveMouse()`)
- ❌ `node:fs`, 동적 `import()`로 모듈 존재 테스트
- ❌ 커맨드 팩토리 직접 호출 후 반환값 검사
- ❌ **plain `describe/it` with page** — TestScript ONE 위반
- ✅ `page.click()`, `page.keyboard.press()` → `page.focusedItemId()` / `page.state` / `page.attrs()`

---

## Patterns

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **입력 우선 테스트** | `page.keyboard.press()` 또는 `page.locator().click()`으로 시작. dispatch 금지 | 2026-02-25 |
| **TestScript ONE** | testbot-*.ts(본체) + runScenarios runner(3줄). 3-engine 동기화 보장 | 2026-03-09 |
| **Playwright E2E 증명** | `apgAccordionScript.run(page, expect)` → Playwright PASS. Engine 3 동작 확인. 단, testbot에서 OS runtime import(OS_CHECK 등)가 있으면 Playwright 로드 불가 — 스크립트와 시나리오 설정 분리 필요 | 2026-03-09 |
| **TestBot 패널 필터링** | discovery = route 기반 (`export const route`), execution = zone 기반. `useRouterState()` + `import.meta.glob("**/testbot-*.ts")` 매칭. 발견과 실행의 키가 다르다 | 2026-03-10 |
| **describe/it SDK 기각** | TestScript.run과 it() 콜백은 동형 — wrapper는 순수 overhead. LLM 친화성은 format이 아니라 context 공급(knowledge 문서) 문제 | 2026-03-10 |

## Hazards

| 함정 | 결과 | 대응 | 발견일 |
|------|------|------|--------|
| **Tier 혼동** | Tier 1(OS-only)로 앱 기능 테스트 → 커널만 검증됨 → browser에서 실패 | 도구 선택 기준 표 참조 | 2026-02-25 |
| **plain describe/it** | vitest에서만 돌고 browser TestBot/E2E에서 안 돎 → 3-engine 계약 위반 | TestScript ONE 형식 강제 | 2026-03-09 |
| **sync script.run** | async TestScript를 await 없이 호출 → unhandled rejection으로 FAIL 누락 | runScenarios에서 await 필수 | 2026-03-09 |

## Precedents

| 선례 | 파일 | 핵심 |
|------|------|------|
| DocsViewer 19 scenarios | `src/docs-viewer/testbot-docs.ts` | §1-§4, cross-zone Tab 포함, runScenarios로 자동 실행 |
