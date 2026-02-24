---
description: 실패하는 테스트를 작성한다. 이 세션의 유일한 산출물은 🔴 FAIL하는 .test.ts 파일이다.
---

// turbo-all

## /red — 실패하는 테스트 작성

> **산출물 2개**: ① 결정 테이블 `.md` ② 테스트 코드 `.test.ts` (🔴 FAIL)
> **금지**: 구현 코드 작성. 이 세션에서 `src/` 프로덕션 코드를 수정하지 않는다.
> **원칙**: 테스트가 스펙이다. 구현 방법을 모르는 상태에서 **기대 동작만** 기술한다.
> **예외**: 아키텍처/리팩토링 태스크(인터랙션이 아닌 것)는 Step 1(결정 테이블)을 생략하고, Given-When-Then 단위 테스트로 직행한다.

---

### Step 0: 맥락 파악

1. 프로젝트 `BOARD.md`를 읽는다.
2. Now 태스크 중 Red 테스트가 없는 태스크를 찾는다.
3. 해당 태스크의 기대 동작을 이해한다.

### Step 1: 결정 테이블 작성 → 프로젝트 `.md`로 저장

테스트를 쓰기 **전에** 결정 테이블을 채운다. **이 표가 테스트 코드의 입력이다.**

> **원칙**: 조건은 아는 자가 관리한다.
> - 1차 분기(OS 조건): OS가 물리적 입력을 의도로 번역
> - 2차 분기(App 조건): App이 의도를 커맨드로 라우팅

#### Step 1-1: Zone + 물리적 입력 열거

> "이 앱의 각 Zone에서 사용자가 물리적으로 할 수 있는 모든 입력은?"

| Zone | 물리적 입력 |
|---|---|
| canvas | Enter, Escape, \, Arrow, Meta+C, Click |
| sidebar | Enter, Escape, Arrow, Meta+C, Delete |
| panel | Enter, Escape, Arrow |
| ... | ... |

#### Step 1-2: 1차 분기 — Zone × 물리적 입력 × OS 조건 → 의도

> "같은 Zone의 같은 입력인데, OS 조건에 따라 다른 의도가 되는 경우는?"
> OS 조건: `isEditing`, `isFieldActive`, `isComposing`, `focusedItemRole`

| # | Zone | 물리적 입력 | OS 조건 | → 의도(intent) |
|---|------|------------|---------|---------------|
| | canvas | Enter | `isEditing=false` | activate |
| | canvas | Enter | `isEditing=true` | field_commit |
| | canvas | Escape | `isEditing=false` | dismiss |
| | canvas | Escape | `isEditing=true` | field_cancel |
| | sidebar | Enter | `isEditing=false` | activate |
| | sidebar | Space | `role=checkbox` | check |
| | ... | ... | ... | ... |

**이 표는 OS가 관리한다. Zone의 `role`에 따라 OS 기본 동작이 달라진다.**

#### Step 1-3: 2차 분기 — 의도 × App 조건 → 커맨드

> "같은 의도인데, App 조건에 따라 다른 커맨드가 실행되는 경우는?"
> App 조건: `level`, `hasChildren`, `dynamicItem`, 앱 고유 상태 등

| # | 의도 | App 조건(when) | → 커맨드 |
|---|------|---------------|---------|
| | activate | `level=section` | `drillToFirstChild` |
| | activate | `level=item` | `startFieldEdit` |
| | dismiss | `level=item` | `drillToParent` |
| | dismiss | `level=section` | `forceDeselect` |

**MECE 확인**: 같은 의도의 `when` 조건들이 전체를 빈틈 없이 커버하는가?

#### Step 1-4: 테스트 시나리오 (Full Path)

> Step 1-2와 1-3을 합쳐서 **물리적 입력 → 최종 결과**의 Full Path를 기술한다.

| # | Zone | Given (초기 상태) | When (물리적 입력) | Then (관찰) |
|---|---|---|---|---|
| | canvas | `focusedId: "s1", isEditing: false` | `press("Enter")` | `focusedItemId() === "g1"` |
| | canvas | `focusedId: "i1", isEditing: true` | `press("Enter")` | `editingItemId === null` (commit) |
| | sidebar | `focusedId: "s1", isEditing: false` | `press("Enter")` | sidebar의 activate 동작 |
| | ... | ... | ... | ... |

**규칙**:
- Given은 `page.goto()` + `page.dispatch()`로 재현 가능해야 한다.
- When은 `page.keyboard.press()` 또는 `page.mouse.click()`만 사용한다.
- Then은 `page.focusedItemId()`, `page.osState`, `page.computeAttrs()`만 사용한다.
- 내부 함수를 직접 호출하지 않는다.

#### Step 1-5: 경계 케이스

- 경계값 (첫/마지막 아이템, children 없는 section)
- 1차→2차 경계 (isEditing 전환 직후의 입력)
- 부정 시나리오 ("A가 B를 가로막지 않는다")

#### Step 1-6: 저장

결정 테이블을 **프로젝트 문서**로 저장한다:

```
docs/1-project/{project-name}/notes/YYYY-MMDD-decision-table-{feature}.md
```

---

### Step 2: 테스트 코드 작성

> ⚠️ **강제 패턴**: 모든 테스트는 아래 구조를 따른다.

```ts
import { createOsPage, type OsPage } from "@os/createOsPage";

describe("Feature: [태스크명]", () => {
  let page: OsPage;

  beforeEach(() => {
    container = buildTestDOM();
    page = createOsPage();
    page.goto(ZONE_ID, { items, config, onAction, ... });
  });

  // 결정 테이블의 각 행 → it() 1개

  it("#N [물리적입력] at [OS조건+App조건] → [결과]", () => {
    // Given
    page.dispatch(page.OS_FOCUS({ zoneId, itemId: "s1" }));

    // When — 물리적 입력만
    page.keyboard.press("Enter");

    // Then — 관찰 가능한 결과만
    expect(page.focusedItemId()).toBe("g1");
  });
});
```

**금지 목록**:
- ❌ 내부 함수 직접 호출 (`Keybindings.resolve()`, `createDrillDown()`, `resolveMouse()`)
- ❌ `node:fs`, 동적 `import()`로 모듈 존재 테스트
- ❌ 커맨드 팩토리 직접 호출 후 반환값 검사
- ✅ `page.keyboard.press()` → `page.focusedItemId()` / `page.osState` / `page.computeAttrs()`

### Step 3: 🔴 FAIL 확인

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 완료.
- FAIL 사유가 "미구현"이지 "테스트 오류"가 아닌지 확인한다.
- 테스트 자체가 깨지면 (import 에러 등) 테스트 코드만 수정한다.

### 완료 기준

- [ ] 결정 테이블 `.md` 저장됨 (1차 분기 + 2차 분기 구분)
- [ ] `.test.ts` 파일 존재
- [ ] 테스트가 Full Path 패턴 사용 (물리적 입력 → 관찰)
- [ ] `vitest run` → 🔴 FAIL
- [ ] FAIL 사유 = 미구현 (테스트 오류 아님)
- [ ] 프로덕션 코드 수정 0줄
