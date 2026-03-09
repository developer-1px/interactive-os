# Headless Test 작성 가이드

> **이 프로젝트 고유 개념.** headless test = DOM 없이 OS 상태만으로 상호작용을 검증하는 테스트.
> API 레퍼런스: `docs/2-area/official/os/headless-page.md`
> 도구 선택 기준: `.agent/knowledge/testing-tools.md`
> 이 파일은 **실전 작성 패턴과 함정**에 집중한다. API 목록은 위 문서 참조.

---

## 1. 두 가지 생성 패턴

### Tier 1: OS 커널 테스트 (zone을 수동 설정)

```ts
import { createHeadlessPage } from "@os-devtool/testing/page";

const page = createHeadlessPage();
page.setupZone("my-list", { items: ["a", "b", "c"], role: "listbox" });
```

- zone/items/role을 직접 지정. 앱 코드 불필요.
- 용도: OS 커맨드 파이프라인 자체를 검증.

### Tier 2: 앱 통합 테스트 (defineApp 기반)

```ts
import { createHeadlessPage } from "@os-devtool/testing/page";
import { MyApp } from "@/my-app/app";

const page = createHeadlessPage(MyApp);
page.goto("/");
```

- `defineApp`의 zone bindings가 자동 등록됨.
- **Component 인자 생략 가능** — zone/command만 테스트할 때.
- Component 넣으면 React SSR 렌더 → DOM id 검증까지 가능.

### 어느 걸 쓸까?

| 상황 | 선택 |
|------|------|
| 버그가 특정 앱에서 발생 | **Tier 2** `createHeadlessPage(App)` |
| OS 커맨드 자체의 문제 | **Tier 1** `createHeadlessPage()` + `setupZone()` |
| 여러 zone 간 Tab 순환 | **Tier 2** (앱의 zone 등록 순서가 중요) |

---

## 2. 핵심 API — 허용/금지

### ✅ 허용 (Playwright subset)

```ts
page.keyboard.press("ArrowDown")    // 키보드 입력
page.keyboard.press("Tab")          // zone 탈출
page.keyboard.press("Shift+Tab")    // 역방향
page.keyboard.type("hello")         // 텍스트 입력 (field)
page.click("item-id")               // 아이템 클릭
page.locator("#id").click()          // locator 경유 클릭
page.locator("#id").getAttribute("aria-selected")
```

### ✅ 상태 조회 (AppPageInternal — type assertion 필요)

```ts
page.focusedItemId()                // 현재 포커스된 아이템
page.activeZoneId()                 // 현재 활성 zone
page.selection()                    // 선택된 아이템 목록
page.attrs("item-id")              // ARIA 속성 전체
page.state                          // 앱 상태 (Tier 2)
```

### ❌ 금지

```ts
page.getItems("zone")              // 존재하지 않는 API!
os.dispatch(OS_TAB(...))            // dispatch 직접 호출 금지
ZoneRegistry.get("zone")           // 내부 레지스트리 직접 접근 금지
```

---

## 3. Items 계산 — 가장 흔한 함정

**headless page에 `getItems()` 메서드는 없다.** 테스트에서 아이템 목록이 필요하면 앱의 순수 함수를 직접 호출한다.

```ts
// ❌ 이렇게 하면 안 됨
const items = page.getItems("docs-sidebar"); // TypeError!

// ✅ 앱의 순수 함수를 직접 import
import { buildDocTree, docsModules, flattenVisibleTree } from "@/docs-viewer/docsUtils";
const docTree = buildDocTree(Object.keys(docsModules));
const items = flattenVisibleTree(docTree, [], 0, { sectionLevel: 0 })
  .filter(n => !(n.type === "folder" && n.level === 0))
  .map(n => n.id);
```

**testbot 파일이 이미 이 함수를 export하는 경우가 많다:**

```ts
// testbot-docs.ts가 이미 getSidebarItems() 등을 가지고 있다면 재사용
import { getSidebarItems } from "@/docs-viewer/testbot-docs";
```

---

## 4. Bootstrap — 첫 클릭이 필수

`page.goto("/")`후 `activeZoneId()`는 `null`이다. Tab을 누르기 전에 **아무 아이템이나 클릭해서 zone을 활성화**해야 한다.

```ts
const page = createHeadlessPage(MyApp);
page.goto("/");

// ❌ 바로 Tab → activeZoneId가 null이라 아무 일도 안 일어남
page.keyboard.press("Tab");

// ✅ 먼저 클릭으로 bootstrap
page.click(items[0]);
expect(page.activeZoneId()).toBe("my-zone");
page.keyboard.press("Tab");
```

---

## 5. Cross-Zone Tab 테스트 패턴

Zone 간 Tab 순환을 검증하는 표준 패턴:

```ts
it("Tab cycles through all zones", () => {
  const page = createHeadlessPage(MyApp);
  page.goto("/");
  page.click(firstItemOfZoneA);  // bootstrap

  // Tab으로 zone 전환 확인
  page.keyboard.press("Tab");
  expect(page.activeZoneId()).toBe("zone-b");

  page.keyboard.press("Tab");
  expect(page.activeZoneId()).toBe("zone-c");

  // 마지막 zone에서 Tab → 첫 zone으로 순환
  page.keyboard.press("Tab");
  expect(page.activeZoneId()).toBe("zone-a");
});
```

**Tab이 no-op인 경우 의심할 것:**

1. **`getItems()` 미제공** — zone.bind()에 getItems가 없으면 `DOM_ZONE_ORDER`에서 `firstItemId: null` → Tab target 없음
2. **빈 아이템 목록** — `getItems()`가 `[]` 반환 → 같은 결과
3. **Bootstrap 안 함** — activeZoneId가 null
4. **role이 "trap"** — dialog 등은 Tab이 zone 내부에서 순환

---

## 6. 버그 재현 테스트 작성법 (/repro용)

Inspector 로그에서 관찰된 버그를 headless test로 전환하는 단계:

### Step 1: Inspector 로그에서 추출

- **어떤 zone에서** 어떤 **입력**(키보드/마우스)을 했는가
- **기대 결과**는 무엇이었고, **실제 결과**는 무엇이었는가
- `Diff: None`이면 → 커맨드가 no-op

### Step 2: 최소 재현 코드

```ts
// 1. 앱 import
import { MyApp } from "@/my-app/app";

// 2. 아이템 목록 (앱의 순수 함수에서)
import { getItems } from "@/my-app/utils";
const items = getItems();

// 3. page 생성 + bootstrap
const page = createHeadlessPage(MyApp);
page.goto("/");
page.click(items[0]);

// 4. Inspector에서 본 입력 재현
page.keyboard.press("Tab");

// 5. 기대 결과 assertion
expect(page.activeZoneId()).not.toBe("stuck-zone"); // 실패 = 버그 재현!
```

### Step 3: 실패 사유 확인

- `vitest run` → 🔴 FAIL
- FAIL 사유가 "버그 재현"이지 "테스트 오류"가 아닌지 확인
- OS Diagnostic 로그에서 `⚠️ Δ none` 확인

---

## 7. TestBot 등록 — 필수

> **headless test를 작성하면 반드시 TestBot에 등록한다.**
> vitest에서만 도는 고아 테스트는 금지. 브라우저 Inspector에서도 실행 가능해야 한다.

### 등록 방법

테스트 스크립트를 `testbot-*.ts` 파일에 TestScript 형식으로 export한다:

```ts
// testbot-myapp.ts
import type { TestScenario, TestScript } from "@os-devtool/testing";

export const zones = ["my-zone-a", "my-zone-b"];  // 필수: 트리거 zone
export const group = "My App";                      // 필수: UI 표시 이름

export const myScripts: TestScript[] = [
  {
    name: "§1 Tab cycle: zone-a → zone-b → zone-a",
    zone: "my-zone-a",
    async run(page, expect, items = []) {
      // Playwright subset API 사용
      await page.locator(`#${items[0]}`).click();
      await page.keyboard.press("Tab");
      // assertion...
    },
  },
];

// auto-runner용 (vitest)
export const scenarios: TestScenario[] = [
  { zone: "my-zone-a", getItems: () => [...], role: "listbox", scripts: myScripts },
];
```

### auto-discovery 경로

`src/testing/testbot-manifest.ts`가 아래 경로에서 자동 발견:

```
src/apps/**/testbot-*.ts
src/docs-viewer/testbot-*.ts
src/pages/**/testbot-*.ts
```

**새 파일 생성만 하면 자동 등록된다.** 수동 등록 불필요.

### 기존 testbot 파일이 있는 경우

기존 `testbot-*.ts`에 스크립트를 **추가**한다. 새 파일을 만들지 않는다.
예: `testbot-docs.ts`에 §5로 Tab cycle 스크립트 추가.

---

## 8. 참조 패턴 (실제 테스트 파일)

| 패턴 | 파일 | 핵심 |
|------|------|------|
| Cross-zone Tab | `tests/headless/apps/os-test-suite/cross-zone.test.ts` | bootstrap → Tab → activeZoneId 확인 |
| 앱 통합 (todo) | `tests/headless/apps/todo/` | createHeadlessPage(TodoApp, TodoView) |
| TestScript ONE | `src/docs-viewer/testbot-docs.ts` | scenarios export + items 계산 함수 |
| 버그 재현 | `tests/headless/apps/docs-viewer/docs-tab-cycle.test.ts` | Tab no-op 재현 |
