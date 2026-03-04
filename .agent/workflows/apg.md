---
description: W3C APG 스펙 기반으로 APG 패턴을 구현·검증한다. 스펙이 유일한 근거다. 즉흥 금지.
---

// turbo-all

## /apg — W3C APG 패턴 구현 워크플로우

> **원칙**: W3C APG 스펙이 **유일한 근거**다. 스펙에 없는 동작을 테스트하지 않고, 스펙에 있는 동작을 빠트리지 않는다.
> **산출물**: Compliance Matrix + `.apg.test.ts` + TestBot script + 브라우저 검증
> **금지**: 스펙을 읽지 않고 기억이나 추측으로 테스트를 작성하는 것

---

### Step 0: 대상 패턴 확인

1. 어떤 APG 패턴을 다룰지 확인한다.
2. 기존 구현이 있는지 확인:
   - Showcase 패턴 컴포넌트 존재?
   - APG 테스트 파일 존재?
   - TestBot 스크립트 존재?

> 프로젝트별 파일 경로는 `.agent/knowledge/testing-tools.md §Config`를 참조한다.

---

### Step 1: W3C APG 스펙 읽기 (필수)

> ⛔ **이 단계를 건너뛰면 안 된다.** 기억으로 스펙을 재구성하지 않는다.

```
read_url_content("https://www.w3.org/WAI/ARIA/apg/patterns/{pattern-name}/")
```

아래 섹션을 반드시 읽는다:
1. **Keyboard Interaction** — 모든 키 바인딩 + 조건부 동작
2. **WAI-ARIA Roles, States, and Properties** — 필수 ARIA 속성

각 항목을 추출하여 **ID를 부여**한다:
- `N1~Nn`: Navigation (Arrow, Home, End)
- `E1~En`: Expansion (ArrowRight/Left on tree, Enter on accordion)
- `S1~Sn`: Selection (Space, Shift+Arrow, Ctrl+A)
- `A1~An`: Activation (Enter, click)
- `R1~Rn`: ARIA Roles/States/Properties
- `F1~Fn`: Focus initialization
- `T1~Tn`: Type-ahead
- `O1~On`: Optional features

---

### Step 2: APG Example HTML 추출 (필수)

> ⛔ **W3C Example의 HTML이 기준 마크업이다.** 스펙 텍스트만 읽고 즉흥으로 구조를 만드는 것은 금지.
> Example의 DOM 구조(그룹핑, 리스트, aria-labelledby 등)가 Showcase 컴포넌트의 구조를 결정한다.

```
read_url_content("https://www.w3.org/WAI/ARIA/apg/patterns/{pattern-name}/examples/{example-name}/")
```

**반드시 수행할 것**:
1. Example 페이지의 **HTML Source Code** 섹션을 읽는다
2. HTML 구조 요소를 **Compliance Matrix에 `H1~Hn` ID로 등록**한다:
   - `H1`: `role="group"` + `aria-labelledby` 그룹 래핑
   - `H2`: `<ul>/<li>` 리스트 구조
   - `H3`: `aria-checked` 초기값
   - ... 등 Example마다 달라짐
3. 키보드 동작의 실제 결과 (스펙 텍스트의 "optionally" 구현 여부)
4. Selection model: recommended vs alternative 중 어느 것을 쓰는지
5. 스펙에 명시되지 않은 edge case 처리

**Example이 여러 개일 경우**: 모든 Example을 읽고, 각 Example의 HTML 구조를 별도로 추출한다.

---

### Step 3: Compliance Matrix 작성

기존 테스트 파일(`{pattern}.apg.test.ts`)과 Step 1-2의 스펙 항목을 **1:1 매핑**:

```markdown
| # | W3C Spec Requirement | Status | Test Name |
|---|---------------------|--------|-----------|
| N1 | Down Arrow: next focusable | ✅ | `assertVerticalNav` |
| N2 | ArrowRight: closed → expand | ❌ | **MISSING** |
| R1 | role=treeitem | ✅ | `treeitem role assigned` |
| H1 | role="group" + aria-labelledby 그룹 래핑 | ❌ | **MISSING** |
| H2 | ul/li 리스트 구조 | ❌ | **MISSING** |
```

ID 분류:
- `N1~Nn`: Navigation
- `E1~En`: Expansion
- `S1~Sn`: Selection
- `A1~An`: Activation
- `R1~Rn`: ARIA Roles/States/Properties
- **`H1~Hn`: HTML Structure (Example 기준)**
- `F1~Fn`: Focus initialization
- `T1~Tn`: Type-ahead
- `O1~On`: Optional features

상태 분류:
- **✅ Covered**: 기존 테스트가 스펙 항목을 검증
- **❌ MISSING**: 스펙에 있지만 테스트 없음 → **Red 대상**
- **⚠️ Mismatch**: 테스트가 있지만 스펙과 불일치 → **수정 대상**
- **🔘 Optional**: 스펙이 "(Optional)"로 표기 → 구현 여부 결정
- **🔄 OS Auto**: OS가 자동 처리 (Example과 구조 다를 수 있음 — 사유 기재 필수)

---

### Step 4: Red 테스트 작성

❌ MISSING 항목에 대해 테스트를 작성한다.

**테스트 파일**: `tests/apg/{pattern}.apg.test.ts`

**규칙**:
- 테스트 이름에 **W3C 스펙 원문을 인용**한다
- 각 `it()` 블록 주석에 **스펙 항목 ID**를 적는다
- 테스트 도구는 `.agent/knowledge/testing-tools.md` §Config를 따른다
- `dispatch()` 최소화 — `keyboard.press()`, `click()` 우선

```typescript
// N6: "Left arrow on root that is end/closed node: does nothing"
it("ArrowLeft on root closed node: does nothing (W3C N6)", () => {
  const t = treeFactory("section-1"); // root, closed
  t.keyboard.press("ArrowLeft");
  expect(t.focusedItemId()).toBe("section-1"); // stays
});
```

**Negative 테스트 필수** (enforceMode 수호):
- Single-select: Shift+Click → range 안 됨
- Single-select: Cmd+Click → toggle 정책에 따름
- Single-select: Shift+Arrow → range 안 됨
- Single-select: Ctrl+A → select-all 안 됨

**실행 확인**:
```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일] 2>&1 | tail -30
```

---

### Step 5: Green 구현

🔴 FAIL 테스트를 🟢 GREEN으로 만든다.

- OS 버그 발견 시 → OS 코드 수정 (enforceMode, command guard 등)
- 테스트 기대값이 잘못된 경우 → 스펙을 다시 읽고 테스트 수정
- **수정 후 반드시 전체 regression 확인**:

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/apg/ 2>&1 | tail -6
```

---

### Step 6: TestBot 스크립트 작성/갱신 (필수)

> ⛔ **TestBot 스크립트 없이 완료 아님.** 인간이 브라우저에서 검증할 수 있어야 한다.

**파일**: `packages/os-devtool/src/testing/scripts.ts`

**규칙**:
1. 사이드바 navigation 클릭을 첫 단계로 넣는다 (`page.locator("#tab-{pattern}").click()`)
2. 핵심 상호작용을 커버한다:
   - Navigation (ArrowUp/Down)
   - Expansion (ArrowRight/Left or Enter)
   - Selection (Space, click)
   - ARIA 속성 검증 (`toHaveAttribute`)
3. Negative 케이스도 포함한다 (Shift+Click, Cmd+Click 차단 확인)
4. `apgShowcaseScripts` 배열에 등록한다
5. `src/pages/apg-showcase/index.tsx`에서 import 확인

**TestBot 스크립트 네이밍**: `apg{Pattern}Script`

---

### Step 7: 브라우저 검증 (필수)

> ⛔ **headless만 통과하고 브라우저에서 실패하면 거짓 GREEN이다.**

1. 브라우저에서 APG Showcase 페이지를 연다
2. `window.__TESTBOT__.quickRun()` 실행
3. **전체 스크립트 PASS** 확인

```javascript
const results = await window.__TESTBOT__.quickRun();
JSON.stringify(results.map(r => ({
  name: r.name, passed: r.passed,
  errors: r.steps.filter(s => !s.passed).map(s => ({ detail: s.detail, error: s.error }))
})), null, 2);
```

---

### Step 8: 최종 게이트

```bash
# tsc
npx tsc --noEmit 2>&1 | tail -3

# headless regression
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/apg/ 2>&1 | tail -6
```

---

### 완료 기준

- [ ] W3C APG 스펙 URL 직접 읽음 (Step 1)
- [ ] W3C APG Example 확인 (Step 2)
- [ ] Compliance Matrix 작성 — 모든 스펙 항목에 ID 부여 (Step 3)
- [ ] ❌ 갭에 대한 Red 테스트 작성 (Step 4)
- [ ] 🟢 전체 GREEN (Step 5)
- [ ] TestBot 스크립트 작성 + `apgShowcaseScripts` 등록 (Step 6)
- [ ] 브라우저 `quickRun()` 전체 PASS (Step 7)
- [ ] tsc 0 + regression 0 (Step 8)

---

### 병렬 실행 시 Merge-back 프로토콜

> 여러 패턴을 `isolation: "worktree"`로 병렬 실행한 경우, 결과를 main에 합치는 절차.

**Precondition (런칭 전 필수)**:
```bash
# main이 remote와 sync인지 확인. 아니면 push 먼저.
git log --oneline -1 HEAD
git log --oneline -1 origin/main
```

**Merge-back 절차**:
1. **새 파일** (테스트, 패턴 컴포넌트): stash에서 추출 `git show stash@{N}^3:path > path`
2. **OS core 변경**: stash diff 병합보다 **main에서 에이전트 재실행이 확실**. diff가 단순하면 수동 적용도 가능.
3. **공유 파일** (`index.tsx` 등): 모든 에이전트가 수정하므로 수동 통합.

**⛔ 금지**: `git stash`를 병렬 worktree에서 사용하지 않는다. stash는 worktree 간 공유되어 cross-contaminate된다. 대신 worktree 브랜치에 commit → rebase를 사용한다.

---

### 마지막 Step: 📝 Knowledge 반영

> `_middleware.md` §3 "종료 시" 규약을 따른다.
> 새로 발견된 OS 버그나 패턴이 있으면 적절한 토픽 파일에 반영한다.
>
> 📝이 비어있으면 스킵.
