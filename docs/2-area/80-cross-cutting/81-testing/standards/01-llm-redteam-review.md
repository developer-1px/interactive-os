# TestBot 인터페이스 LLM 친화성 — Red Team 검토

## 1. 개요 (Overview)

TestBot의 FSD 재구조화 후 인터페이스가 **LLM(코드 생성 에이전트)**에 얼마나 친화적인지를 **Red Team(공격적 검증)** 관점에서 분석한다. 대상은 `entities/`, `features/`, `globalApi.ts`, 그리고 실제 소비자 코드(`TodoBot.tsx`, `FocusShowcaseBot.tsx`)이다.

---

## 2. 분석 (Analysis)

### ✅ 강점 (LLM에게 유리한 점)

| # | 항목 | 근거 |
|---|------|------|
| 1 | **Jest/Playwright 유사 패턴** | `describe` / `async (t) => {}` — LLM 학습 데이터에서 가장 빈번한 패턴이라 할루시네이션 확률이 낮음 |
| 2 | **Filename = Interface** | `entities/TestBot.ts` → `TestBot` 인터페이스. LLM이 토큰을 절약하며 정확한 타입 추론 가능 |
| 3 | **Compact Entity Files** | 5개 Entity 파일 합계 ~66줄. Context Window 소비 최소 |
| 4 | **`window.__TESTBOT__` API** | Agent가 브라우저 콘솔에서 `runAll()` → `getResults()` 루프를 단 2줄로 실행 가능 |
| 5 | **Structured JSON Output** | `getResults()`가 `{ summary, suites[].steps[] }` 형태로 반환 — 파싱 불필요 |
| 6 | **Failure Context Dump** | 실패 시 Active Element + HTML Snippet 제공 — Agent 자가 디버깅 지원 |

### 🔴 공격 벡터 (LLM이 실수하기 쉬운 지점)

#### A-1. `getByText`가 Leaf Node만 검색

```typescript
// 현재 구현
const match = elements.find(el =>
    el.children.length === 0 && el.textContent?.trim() === text
);
```

**문제**: `<button><span>Save</span></button>`에서 `getByText("Save")`는 `<span>`을 반환. LLM은 `<button>`을 기대하고 클릭 후 예상과 다른 동작 발생 가능.

**제안**: `el.children.length === 0` 조건 제거, innerText 기반 매칭으로 변경. 또는 가장 **바깥쪽** 매칭 요소 반환.

---

#### A-2. `getByRole`이 Implicit Role 미지원

```typescript
// 현재: [role="button"] 속성만 검색
const selector = `[role="${role}"]`;
```

**문제**: `<button>`, `<input type="checkbox">` 등은 `role` 속성 없이도 암시적 ARIA Role을 가짐. LLM은 `getByRole("button")`으로 `<button>`을 찾으려 하지만 실패.

**제안**: HTML 태그 → Implicit Role 매핑 테이블 추가:
```
button → role=button
a[href] → role=link
input[type=checkbox] → role=checkbox
select → role=listbox
```

---

#### A-3. `getByText` 중복 시 무조건 첫 번째 반환

`TodoBot.tsx:114` 주석에서도 이미 인지:
> "If we have two 'Item A', getting one might be tricky."

**문제**: Copy → Paste 후 동일 텍스트 요소가 2개 생기면 `getByText`가 첫 번째를 반환. Agent가 2번째(새로 생긴) 요소를 기대하면 실패.

**제안**: 
- `getAllByText(text): Promise<string[]>` 추가
- 또는 `getByText(text, { index: N })` 옵션 추가

---

#### A-4. `toHaveValue` / `toHaveText` / `toBeVisible` 미제공

`TodoBot.tsx:49`:
> "Skipping value check as toHaveValue is not available."

**현재 Expectations**:
```typescript
focused() / toHaveAttr() / toNotHaveAttr() / toExist() / toNotExist()
```

**누락된 필수 Assertion**:
| Assertion | 용도 |
|-----------|------|
| `toHaveValue(value)` | Input/Textarea 값 검증 |
| `toHaveText(text)` | 요소 텍스트 내용 검증 |
| `toBeVisible()` | CSS display/visibility/opacity 검증 |
| `toBeDisabled()` | disabled 상태 검증 |
| `toHaveCount(n)` | 선택자 매칭 요소 수 검증 |

LLM은 Playwright/Cypress 학습 데이터에서 이 API들을 "있다고" 가정하고 코드를 생성할 확률이 높다.

---

#### A-5. `type()` 메서드 미존재 — 사용자가 직접 구현 필요

`TodoBot.tsx:17-22`:
```typescript
async function type(t: TestActions, text: string) {
    for (const char of text) {
        await t.press(char === " " ? "Space" : char);
        await t.wait(20);
    }
}
```

**문제**: 텍스트 입력이 매우 흔한 동작인데 Built-in이 아니라 소비자가 매번 구현해야 함. LLM이 `t.type("hello")`를 시도하면 에러.

**제안**: `TestActions`에 `type(text: string): Promise<void>` 추가.

---

#### A-6. 스냅샷/복원 패턴이 Boilerplate 과다

모든 테스트가 동일한 패턴 반복:
```typescript
bot.describe("...", async (t) => {
    const snapshot = CommandEngineStore.getAppState("todo");
    try {
        // ... test
    } finally {
        if (snapshot) CommandEngineStore.setAppState("todo", snapshot);
    }
});
```

**문제**: LLM이 `try/finally` 스냅샷을 빼먹으면 테스트가 상태를 오염시킴. 모든 테스트에서 반복되는 boilerplate.

**제안**: `bot.describe`에 `{ restore: "todo" }` 옵션 추가하여 자동 스냅샷/복원:
```typescript
bot.describe("Copy → Paste", async (t) => {
    // 자동 복원됨, try/finally 불필요
}, { restore: "todo" });
```

---

#### A-7. `await` 누락 시 Silent Failure

모든 액션이 `async`. LLM이 실수로:
```typescript
t.click("#btn");  // await 빠짐!
await t.expect("#btn").focused();  // 클릭 전에 실행됨
```

**문제**: 타이밍 레이스 → Flaky Test → Agent가 "가끔 실패"하는 이유를 추론 불가.

**제안**: 실행 가능한 옵션:
- `describe` 콜백 종료 시 unresolved Promise 감지 경고 로깅
- 또는 액션 체이닝 패턴 (`t.click().then().press()`) 검토

---

#### A-8. `click(selector)` → `click(getByText(...))` 전환 마찰

현재 `click`은 CSS Selector를 받고, `getByText/Role`은 Selector를 반환하므로 조합 필요:
```typescript
await t.click(await t.getByText("Save"));  // 중첩 await
```

**문제**: 이 패턴 자체가 LLM에게 혼란 (Playwright는 `page.getByText("Save").click()` 체이닝).

**제안**: `click`이 내부적으로 Semantic Query도 수용하도록 오버로드:
```typescript
await t.click({ text: "Save" });        // Semantic
await t.click({ role: "button" });       // By Role
await t.click("#save-btn");              // CSS (기존)
```

---

## 3. 우선순위 제안

| 우선순위 | 항목 | 난이도 | 영향도 |
|---------|------|--------|--------|
| 🔴 P0 | A-4: `toHaveValue/Text/Visible` 추가 | 낮음 | 높음 — LLM 코드 생성 실패의 주 원인 |
| 🔴 P0 | A-5: `type(text)` Built-in | 낮음 | 높음 — 모든 입력 테스트에 필수 |
| 🟡 P1 | A-2: Implicit Role 지원 | 중간 | 높음 — `<button>` 못 찾는 건 치명적 |
| 🟡 P1 | A-8: `click({ text })` 오버로드 | 중간 | 중간 — 코드 가독성 대폭 향상 |
| 🟡 P1 | A-1: Leaf Node 제한 해제 | 낮음 | 중간 — Nested 텍스트 매칭 |
| 🟢 P2 | A-6: Auto Snapshot/Restore | 중간 | 중간 — Boilerplate 감소 |
| 🟢 P2 | A-3: `getAllByText` 추가 | 낮음 | 낮음 — Edge Case |
| 🟢 P2 | A-7: Unresolved Promise 경고 | 높음 | 낮음 — 방어적 |

---

## 4. 결론 (Conclusion)

현재 TestBot 인터페이스는 **기본 구조(describe/click/press/expect)가 매우 LLM 친화적**이고, `window.__TESTBOT__` 글로벌 API와 Failure Context Dump도 Agent 운용에 적합하다.

그러나 **Assertion 빈약(A-4)**, **`type()` 미제공(A-5)**, **Implicit Role 미지원(A-2)**은 LLM이 Playwright/Cypress 경험을 기반으로 코드를 생성할 때 즉각 실패하는 원인이 된다. 특히 A-4, A-5는 **실제 소비자 코드(TodoBot)에서 이미 워크어라운드를 작성**하고 있어 설계 갭이 검증된 상태이다.

**P0 항목(A-4, A-5)만 해결해도 LLM 테스트 코드 생성 성공률이 체감적으로 크게 향상될 것으로 예상한다.**
