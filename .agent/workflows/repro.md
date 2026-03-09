---
description: 관찰된 버그를 headless 재현 테스트로 전환한다. 산출물은 🔴 FAIL하는 .test.ts 파일이다.
---

## /repro — 버그 재현 테스트 작성

> **산출물 1개**: 재현 테스트 `.test.ts` (🔴 FAIL)
> **입력**: Inspector 캡처 로그, 브라우저에서 관찰된 증상, 또는 자연어 버그 설명
> **vs /red**: `/red`는 스펙(spec.md)에서 출발. `/repro`는 **관찰된 증상**에서 출발.
> **금지**: 구현 코드 수정. 이 세션에서 `src/` 프로덕션 코드를 수정하지 않는다.

---

### Step 0: 지식 로딩

> `.agent/knowledge/headless-test-guide.md`를 읽는다 — 전체.
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
2. `getItems()` 순수 함수가 있으면 import
3. `testbot-*.ts`에 이미 items 계산 함수가 있으면 재사용
4. 없으면 앱의 docsUtils/model 등에서 직접 계산 함수를 가져온다

### Step 3: 재현 테스트 작성

```ts
/**
 * [앱 이름]: [버그 한 줄 설명]
 *
 * 증상: [Inspector에서 관찰된 것]
 * 기대: [정상 동작]
 */
import { createHeadlessPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { MyApp } from "@/my-app/app";

function createPage() {
  const page = createHeadlessPage(MyApp);
  page.goto("/");
  return page;
}

describe("[앱]: [버그 설명]", () => {
  it("[입력] → [기대 결과] (현재 실패)", () => {
    const page = createPage();

    // Bootstrap (headless-test-guide §4)
    page.click(firstItem);

    // 버그 재현 입력
    page.keyboard.press("[키]");

    // 기대 결과 assertion
    expect(page.activeZoneId()).toBe("[expected-zone]");
  });
});
```

**위치**: `tests/headless/apps/[app-name]/[버그-slug].test.ts`

### Step 4: 🔴 FAIL 확인

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 완료.
- FAIL 사유가 **"버그 재현"**이지 "테스트 오류(import 실패, 타입 에러)"가 아닌지 확인.
- 테스트 자체가 깨지면 테스트 코드만 수정한다.
- OS Diagnostic 로그에서 `⚠️ Δ none` 등 증상 재현을 확인한다.

### 완료 기준

- [ ] `.test.ts` 파일 존재
- [ ] Inspector 증상이 headless에서 재현됨
- [ ] `vitest run` → 🔴 FAIL
- [ ] FAIL 사유 = 버그 재현 (테스트 오류 아님)
- [ ] 프로덕션 코드 수정 0줄

### 다음 단계

재현 테스트가 Red이면:
- `/green` (또는 `/go`)으로 버그 수정 → 이 테스트가 Green이 되면 수정 완료
