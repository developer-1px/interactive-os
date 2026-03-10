---
description: 실패하는 테스트를 작성한다. 이 세션의 유일한 산출물은 🔴 FAIL하는 TestScript다.
---

## /red — 실패하는 테스트 작성

> **산출물**: `testbot-*.ts`에 TestScript 추가 (본체) + `runScenarios` runner `.test.ts` (🔴 FAIL)
> **금지**: 구현 코드 작성. 이 세션에서 `src/` 프로덕션 코드를 수정하지 않는다.
> **원칙**: 테스트가 스펙이다. 구현 방법을 모르는 상태에서 **기대 동작만** 기술한다.
> **예외**: 아키텍처/리팩토링 태스크(인터랙션이 아닌 것)는 Decision Table 없이 Given-When-Then 단위 테스트로 직행한다.

> [!IMPORTANT]
> **TestScript ONE — Write Once, Run Anywhere**
> 이 프로젝트의 테스트는 3개 엔진에서 동일하게 실행된다:
>   1. vitest headless (via `runScenarios`)
>   2. browser TestBot (via TestBotRegistry)
>   3. Playwright E2E (native page)
>
> **plain `describe/it` 테스트 금지.** 반드시 TestScript 형식으로 작성하고 testbot에 등록한다.
> 유일한 예외: page를 사용하지 않는 순수 단위 테스트 (config 검증, 순수 함수 등).

> [!IMPORTANT]
> **입력 우선 테스트 (Input-First Testing)**
> 키보드/마우스 입력으로 시작할 수 있는 테스트라면, **반드시 `page.keyboard.press()` 또는 `page.locator().click()`으로 시작**한다.
> `os.dispatch(OS_COMMAND(...))` 커맨드 직접 호출은 **파이프라인 전체를 검증하지 못하는 나쁜 테스트**다.

---

### Step 0: 지식 로딩 + 맥락 파악

> `.agent/knowledge/headless-test-guide.md`를 읽는다 — 전체 (특히 §7 TestBot 등록).
> `.agent/knowledge/testing-hazards.md`를 읽는다 — §Hazards, §Precedents.
> `.agent/knowledge/testing-tools.md`를 읽는다 — §Config (도구 선택 기준, 코드 템플릿).

Then:

1. 프로젝트 `BOARD.md`를 읽는다.
2. Now 태스크 중 Red 테스트가 없는 태스크를 찾는다.
3. 해당 태스크의 기대 동작을 이해한다.

### Step 1: spec.md 확인 (Gate)

- spec.md 존재 + Decision Table 있음 → **Step 2로 진행**
- spec.md 없음 → ⛔ **`/spec` 실행 지시. `/red` 중단.**

### Step 2: testbot-*.ts에 TestScript 작성

> ⛔ **plain describe/it 금지.** TestScript 형식만 허용.

1. **기존 testbot 확인**: 해당 앱의 `src/[app-path]/testbot-*.ts`가 있는가?
   - 있으면 → 기존 파일에 **스크립트 추가**
   - 없으면 → `src/[app-path]/testbot-[app].ts` 생성

2. **TestScript 작성**: Playwright subset API만 사용 (`page.locator().click()`, `page.keyboard.press()`, `expect(locator)`)

```ts
// testbot-myapp.ts에 추가
export const newFeatureScripts: TestScript[] = [
  {
    name: "§N [기능]: [입력] → [기대 결과]",
    zone: "my-zone",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[1]}`)).toBeFocused();
    },
  },
];

// scenarios에 등록 (기존 scenario에 scripts 추가 또는 새 scenario)
export const scenarios: TestScenario[] = [
  {
    zone: "my-zone",
    getItems: getMyItems,
    role: "listbox",
    scripts: [...existingScripts, ...newFeatureScripts],
  },
];
```

3. **auto-discovery 메타데이터** (새 파일일 때만):

```ts
export const zones = ["my-zone-a", "my-zone-b"];
export const group = "My App";
```

### Step 3: runScenarios runner 작성

> runner는 `tests/headless/apps/[app-name]/` 에 위치.
> **이 파일은 3줄이다.** 로직을 넣지 않는다.

```ts
import { runScenarios } from "@os-testing/runScenarios";
import { MyApp } from "@/my-app/app";
import { scenarios } from "@/my-app/testbot-myapp";

runScenarios(scenarios, MyApp);
```

> 이미 runner가 존재하면 이 단계를 건너뛴다 — testbot에 scenario를 추가하면 자동 반영.

### Step 4: 🔴 FAIL 확인

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 완료.
- FAIL 사유가 "미구현"이지 "테스트 오류"가 아닌지 확인한다.
- 테스트 자체가 깨지면 (import 에러 등) 테스트 코드만 수정한다.
- **FAIL 확인 후**: 결정 테이블의 해당 행 S 열을 `⬜` → `🔴`로 업데이트한다.

### 완료 기준

- [ ] spec.md 존재 확인 (Gate 통과)
- [ ] spec.md의 Decision Table 행 수 = TestScript 수 일치 (인터랙션 태스크)
- [ ] `testbot-*.ts`에 TestScript 등록됨 (본체)
- [ ] `scenarios` export에 포함됨
- [ ] `.test.ts` runner가 `runScenarios(scenarios, App)` 사용
- [ ] 테스트가 Full Path 패턴 사용 (물리적 입력 → 관찰)
- [ ] `vitest run` → 🔴 FAIL
- [ ] FAIL 사유 = 미구현 (테스트 오류 아님)
- [ ] 프로덕션 코드 수정 0줄

---

### 마지막 Step: 📝 Knowledge 반영

> `_middleware.md` §3 "종료 시" 규약을 따른다.
> 새 테스트 패턴 → `testing-hazards.md` §Patterns
> 새 함정 → `testing-hazards.md` §Hazards
>
> 📝이 비어있으면 스킵.
