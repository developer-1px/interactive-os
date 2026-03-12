---
description: 브라우저에서 버그가 관찰되었고 재현 테스트가 필요할 때 사용. 산출물은 올바른 이유로 FAIL하는 TestScript다.
---

## /repro — 버그 재현 테스트 작성

> **산출물**: `testbot-*.ts`에 TestScript 추가 (본체) + `runScenarios` runner `.test.ts` (🔴 FAIL)
> **입력**: Inspector 캡처 로그, 브라우저에서 관찰된 증상, 또는 자연어 버그 설명
> **vs /red**: `/red`는 스펙(spec.md)에서 출발. `/repro`는 **관찰된 증상**에서 출발.
> **금지**: 구현 코드 수정. 이 세션에서 `src/` 프로덕션 코드를 수정하지 않는다.

> [!IMPORTANT]
> **TestScript ONE — Write Once, Run Anywhere**
> 이 프로젝트의 테스트는 3개 엔진에서 동일하게 실행된다:
>   1. vitest headless (via `runScenarios`)
>   2. browser TestBot (via TestBotRegistry)
>   3. Playwright E2E (native page)
>
> **plain `describe/it` 테스트 금지.** 반드시 TestScript 형식으로 작성하고 testbot에 등록한다.

---

### Step 0: 지식 로딩

> `.agent/knowledge/headless-test-guide.md`를 읽는다 — 전체 (특히 §7 TestBot 등록).
> `.agent/knowledge/testing-hazards.md`를 읽는다 — §Hazards.

### Step 1: 증상 분석

Inspector 로그 또는 버그 설명에서 다음을 추출한다:

1. **어떤 zone에서** 어떤 **입력**(키보드/마우스)을 했는가
2. **기대 결과**는 무엇이었는가
3. **실제 결과**는 무엇이었는가 (`Diff: None` = no-op)
4. **영향받는 앱**: `src/[app-name]/app.ts`의 `defineApp` 식별

> Inspector 로그가 없으면 자연어 설명에서 위 4항목을 추론한다.

### Step 2: 아이템 목록 확보

> ⚠️ **`page.getItems()`는 존재하지 않는다!** headless-test-guide.md §3 참조.

1. 해당 앱의 `app.ts`에서 zone 정의를 읽는다
2. `testbot-*.ts`에 이미 items 계산 함수가 있으면 **재사용**
3. `getItems()` 순수 함수가 있으면 import
4. 없으면 앱의 docsUtils/model 등에서 직접 계산 함수를 가져온다

### Step 3: testbot-*.ts에 재현 TestScript 작성

> ⛔ **plain describe/it 금지.** TestScript 형식만 허용.

1. **기존 testbot 확인**: 해당 앱의 `src/[app-path]/testbot-*.ts`가 있는가?
   - 있으면 → 기존 파일에 **재현 스크립트 추가**
   - 없으면 → `src/[app-path]/testbot-[app].ts` 생성

2. **재현 TestScript 작성**:

```ts
// testbot-myapp.ts에 추가
export const reproScripts: TestScript[] = [
  {
    name: "§N [버그 설명]: [입력] → [기대] (현재 실패)",
    zone: "affected-zone",
    async run(page, expect, items = []) {
      // Bootstrap
      await page.locator(`#${items[0]}`).click();

      // 버그 재현 입력
      await page.keyboard.press("Tab");

      // 기대 결과 assertion (현재 FAIL = 버그 재현 성공)
      await expect(page.locator(`#${items[0]}`)).not.toBeFocused();
    },
  },
];

// scenarios에 등록
export const scenarios: TestScenario[] = [
  {
    zone: "affected-zone",
    getItems: getMyItems,
    role: "listbox",
    scripts: [...existingScripts, ...reproScripts],
  },
];
```

3. **auto-discovery 메타데이터** (새 파일일 때만):

```ts
export const zones = ["my-zone"];
export const group = "My App";
```

### Step 4: runScenarios runner 확인/작성

> runner가 이미 있으면 이 단계를 건너뛴다 — testbot에 scenario를 추가하면 자동 반영.

```ts
import { runScenarios } from "@os-testing/runScenarios";
import { MyApp } from "@/my-app/app";
import { scenarios } from "@/my-app/testbot-myapp";

runScenarios(scenarios, MyApp);
```

### Step 5: 🔴 FAIL 확인

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 완료.
- FAIL 사유가 **"버그 재현"**이지 "테스트 오류(import 실패, 타입 에러)"가 아닌지 확인.
- 테스트 자체가 깨지면 테스트 코드만 수정한다.
- OS Diagnostic 로그에서 `⚠️ Δ none` 등 증상 재현을 확인한다.

### 완료 기준

- [ ] `testbot-*.ts`에 재현 TestScript 등록됨 (본체)
- [ ] `scenarios` export에 포함됨
- [ ] `.test.ts` runner가 `runScenarios(scenarios, App)` 사용 (또는 기존 runner 재사용)
- [ ] Inspector 증상이 headless에서 재현됨
- [ ] `vitest run` → 🔴 FAIL
- [ ] FAIL 사유 = 버그 재현 (테스트 오류 아님)
- [ ] 프로덕션 코드 수정 0줄

### 다음 단계

재현 테스트가 Red이면:
- `/green` (또는 `/go`)으로 버그 수정 → 이 테스트가 Green이 되면 수정 완료
