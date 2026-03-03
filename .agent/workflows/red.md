---
description: 실패하는 테스트를 작성한다. 이 세션의 유일한 산출물은 🔴 FAIL하는 .test.ts 파일이다.
---

// turbo-all

## /red — 실패하는 테스트 작성

> **산출물 1개**: 테스트 코드 `.test.ts` (🔴 FAIL)
> **금지**: 구현 코드 작성. 이 세션에서 `src/` 프로덕션 코드를 수정하지 않는다.
> **원칙**: 테스트가 스펙이다. 구현 방법을 모르는 상태에서 **기대 동작만** 기술한다.
> **예외**: 아키텍처/리팩토링 태스크(인터랙션이 아닌 것)는 Decision Table 없이 Given-When-Then 단위 테스트로 직행한다.

> [!IMPORTANT]
> **입력 우선 테스트 (Input-First Testing)**
> 키보드/마우스 입력으로 시작할 수 있는 테스트라면, **반드시 `page.keyboard.press()` 또는 `page.locator().click()`으로 시작**한다.
> `os.dispatch(OS_COMMAND(...))` 커맨드 직접 호출은 **파이프라인 전체를 검증하지 못하는 나쁜 테스트**다.
> 커맨드 기반 테스트는 커버리지만 올리고 실제 동작을 보장하지 못한다.
> Config 데이터 검증(rolePreset 값 확인 등 순수 단위 테스트)만 예외.

---

### Step 0: REDBOOK 숫지 + 맥락 파악

`.agent/knowledge/red.md`를 읽는다.
- §1 헤드리스 테스트 패턴
- §2 함정 (쫓았던 것)
- §3 선례

Then:

1. 프로젝트 `BOARD.md`를 읽는다.
2. Now 태스크 중 Red 테스트가 없는 태스크를 찾는다.
3. 해당 태스크의 기대 동작을 이해한다.

### Step 1: spec.md 확인 (Gate)

> **ASIS**: Decision Table을 `/red`에서 직접 작성.
> **TOBE**: Decision Table은 `/spec`에서 작성 완료. `/red`는 **확인만**.

- spec.md 존재 + Decision Table 있음 → **Step 2로 진행**
- spec.md 없음 → ⛔ **`/spec` 실행 지시. `/red` 중단.**

> **Self-enforcing**: 테스트 파일 상단에 `@spec` 링크를 작성한다.
> 링크가 가리키는 파일이 없으면 spec이 없다는 뜻 → `/spec` 실행.

---

### Step 2: 테스트 코드 작성

> ⚠️ **2-tier 강제 패턴**: 테스트 대상에 따라 도구가 다르다.

#### Tier 1: OS 커널 테스트 (APG, navigation, dismiss)

> OS 자체의 커맨드 파이프라인을 검증. 앱 코드 없이 커널만 테스트.

```ts
/**
 * @spec docs/1-project/[name]/spec.md
 */
import { createOsPage, type OsPage } from "@os/createOsPage";

describe("Feature: [태스크명]", () => {
  let page: OsPage;

  beforeEach(() => {
    page = createOsPage();
    page.goto(ZONE_ID, { items, role, config });
  });

  it("#N [입력] → [결과]", () => {
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("item-2");
  });
});
```

#### Tier 2: 앱 통합 테스트 (Builder, Todo 등)

> 실제 앱의 bind 경로를 검증. **dispatch 금지. click/press만 허용.**
> **2번째 인자(UI Component) 필수.** Component 없으면 React 렌더 없음 = UI 결합 미검증.

```ts
/**
 * @spec docs/1-project/[name]/spec.md
 */
import { createPage } from "@os/defineApp.page";
import { BuilderApp } from "@apps/builder/app";
import { BuilderUI } from "@apps/builder/BuilderUI"; // 실제 UI 컴포넌트

describe("Feature: [태스크명]", () => {
  let page: AppPage<BuilderState>;

  beforeEach(() => {
    page = createPage(BuilderApp, BuilderUI); // ← 2nd arg 필수
    page.goto("zone-name");
  });

  it("#N [사용자 행동] → [결과]", () => {
    page.click("trigger-id");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("item-2");
  });
});
```

#### 도구 선택 기준

| 질문 | 예 → | 아니오 → |
|------|------|----------|
| 앱의 Zone/bind/keybinding을 검증하는가? | **Tier 2** `createPage(App)` | **Tier 1** `createOsPage()` |

#### 공통 금지 목록

- ❌ `dispatch()` 직접 호출 (Tier 2에서 절대 금지. Tier 1에서도 가급적 회피)
- ❌ 내부 함수 직접 호출 (`Keybindings.resolve()`, `createDrillDown()`, `resolveMouse()`)
- ❌ `node:fs`, 동적 `import()`로 모듈 존재 테스트
- ❌ 커맨드 팩토리 직접 호출 후 반환값 검사
- ✅ `page.click()`, `page.keyboard.press()` → `page.focusedItemId()` / `page.state` / `page.attrs()`

> **⚠️ 거짓 GREEN 경고**: `createOsPage`로 앱 기능을 테스트하면 커널만 검증됨.
> 브라우저에서 동작하지 않아도 테스트가 통과할 수 있다. (선례: dropdown-dismiss)

### Step 3: 🔴 FAIL 확인

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 완료.
- FAIL 사유가 "미구현"이지 "테스트 오류"가 아닌지 확인한다.
- 테스트 자체가 깨지면 (import 에러 등) 테스트 코드만 수정한다.
- **FAIL 확인 후**: 결정 테이블의 해당 행 S 열을 `⬜` → `🔴`로 업데이트한다.
- **`/green` 완료 후**: S 열을 `🔴` → `🟢`로 업데이트한다.

### 완료 기준

- [ ] spec.md 존재 확인 (Gate 통과)
- [ ] spec.md의 Decision Table 행 수 = 테스트 `it()` 수 일치 (인터랙션 태스크)
- [ ] `.test.ts` 파일 존재
- [ ] 테스트가 Full Path 패턴 사용 (물리적 입력 → 관찰)
- [ ] `vitest run` → 🔴 FAIL
- [ ] FAIL 사유 = 미구현 (테스트 오류 아님)
- [ ] 프로덕션 코드 수정 0줄

---

### 마지막 Step: REDBOOK 갱신

새로 발견된 지식이 있으면 `.agent/knowledge/red.md`를 갱신한다.
- 잘 작동한 테스트 패턴 → §1
- 반복된 함정 → §2
- 선례 → §3

> 새 지식 없으면 스킵.
