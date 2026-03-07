# TestBot 재정의: Playwright e2e 도입 + TestBot 시연 어댑터 전환

## 1. 개요 (Overview)

### 배경

TestBot은 원래 **LLM 자가검증 도구**로 탄생했다. 브라우저 에이전트가 코드 변경 후 브라우저를 열고 직접 눈으로 확인하는 대신, 테스트 코드를 실행해서 더 빠르게 검증하도록 만든 것이다. `window.__TEST__` 등으로 접근하면 e2e보다 쉽게 결과를 가져올 수 있었기 때문이다.

### 문제

1. **브라우저 에이전트**는 TestBot을 돌릴 수 있지만, 매번 브라우저를 열어 시각적으로 확인하고 있다 (비효율적)
2. **Claude Code**(터미널 전용 에이전트)는 브라우저가 없어서 TestBot 테스트를 아예 돌리지 못한다
3. 테스트 코드가 TestBot 전용 API로 작성되어 있어서 **다른 러너에서 재사용 불가능**하다

### 목표

테스트 코드를 **한 벌만 작성**하고, 세 가지 맥락에서 돌릴 수 있게 한다:

| 맥락 | 러너 | 용도 |
|------|------|------|
| 에이전트 자가검증 | `npx playwright test` (터미널) | 코드 변경 후 빠른 pass/fail 확인 |
| Claude Code 자가검증 | `npx playwright test` (터미널) | 코드 변경 후 빠른 pass/fail 확인 |
| 사용자 시연 | TestBot (브라우저 내) | 커서 애니메이션 + 시각 피드백으로 라이브 데모 |


## 2. 분석 (Analysis)

### 2.1 현재 아키텍처의 문제

```
테스트 코드 (TestBot 전용 API)
└── TestBot 러너만 실행 가능
    └── 브라우저에서만 동작
        └── 브라우저 에이전트만 접근 가능
            └── Claude Code는 자가검증 불가 ❌
```

### 2.2 목표 아키텍처

```
공유 테스트 코드 (Playwright API 표면)
├── Playwright 러너  →  에이전트 / Claude Code (터미널, 자동화)
└── TestBot 러너     →  사용자 데모 (브라우저, 시각 커서)
```

### 2.3 Playwright API 정렬 — Pareto 20% 100% 일치

현재 60+ suite를 분석한 결과, 테스트 코드의 ~95%가 아래 7개 API로 작성됨. 이것만 Playwright 시그니처와 100% 일치시키면 된다.

#### Locator 팩토리

| Playwright 시그니처 | 설명 |
|---|---|
| `page.getByRole(role, { name? })` → `Locator` | 역할+이름으로 Locator 반환 |
| `page.getByText(text, { exact? })` → `Locator` | 텍스트로 Locator 반환 |
| `page.getByTestId(testId)` → `Locator` | data-testid로 Locator 반환 |
| `page.locator(selector)` → `Locator` | CSS 셀렉터로 Locator 반환 |

#### Locator 액션

| Playwright 시그니처 | 설명 |
|---|---|
| `locator.click({ modifiers? })` | 요소 클릭 |
| `locator.press(key)` | 포커스된 요소에 키 입력 |
| `locator.pressSequentially(text)` | 한 글자씩 타이핑 |
| `locator.fill(value)` | 값 설정 (input) |
| `locator.focus()` | 포커스 이동 |

#### 페이지 레벨 키보드

| Playwright 시그니처 | 설명 |
|---|---|
| `page.keyboard.press(key)` | 포커스 대상 불문, 키 입력 |

#### Assertions (expect)

| Playwright 시그니처 | 설명 |
|---|---|
| `expect(locator).toBeFocused()` | 포커스 확인 |
| `expect(locator).toHaveAttribute(name, value)` | 속성 확인 |
| `expect(locator).toBeVisible()` | 가시성 확인 |
| `expect(locator).toBeDisabled()` | 비활성 확인 |
| `expect(locator).toHaveText(text)` | 텍스트 확인 |
| `expect(locator).toHaveValue(value)` | 값 확인 |
| `expect(locator).toHaveCount(n)` | 개수 확인 |
| `expect(locator).not.*` | 반전 |

#### 의도적 미지원 (필요 없음)

`screenshot`, `evaluate`, `waitFor`, `dragTo`, `goto` — 인앱 맥락에서 불필요.

### 2.4 변환 Before / After

**현재 (TestBot 전용 API):**
```typescript
bot.describe("Tabs: Click Selection", async (t) => {
  await t.click("#tab-account");
  await t.expect("#tab-account").toHaveAttribute("aria-selected", "true");
  await t.press("ArrowRight");
  await t.expect("#tab-security").toBeFocused();
});
```

**목표 (Playwright 호환 API — 공유 가능):**
```typescript
// tests/shared/tabs.spec.ts — 한 번만 작성
export async function tabsTests(page: PageLike, expect: ExpectFn) {
  const account = page.getByRole("tab", { name: "Account" });
  const security = page.getByRole("tab", { name: "Security" });

  await account.click();
  await expect(account).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(security).toBeFocused();
}

// TestBot 어댑터 — 사용자 시연용
bot.describe("Tabs: Click Selection", async (page) => {
  await tabsTests(page, expect);
});

// Playwright 어댑터 — LLM 자가검증용
test("Tabs: Click Selection", async ({ page }) => {
  await page.goto("/aria-showcase");
  await tabsTests(page, expect);
});
```

### 2.5 구현 구성 요소

| 구성 요소 | 설명 | 예상 규모 |
|---|---|---|
| **`PageLike` 인터페이스** | Playwright Page의 서브셋 인터페이스 | ~30줄 |
| **`Locator` 클래스** | 쿼리 지연 해석 + 커서 이동 + 이벤트 디스패치 | ~200줄 |
| **`expect()` 함수** | LocatorAssertions 패턴, `not` 체이닝 | ~100줄 |
| **쿼리 엔진 개선** | `selectors.ts`를 Playwright 매칭 의미론에 맞게 수정 (substring 기본 등) | ~50줄 |
| **Playwright 환경 세팅** | `playwright.config.ts`, 헬퍼 | ~50줄 |
| **테스트 코드 마이그레이션** | 60+ suite → 공유 형식 변환 | ~800줄 변경 |
| **제거 가능 코드** | `implicitRoles.ts`, `selectors.ts` 쿼리 일부, 현재 `TestActions` API | ~130줄 제거 |

### 2.6 TestBot의 재정의

| 속성 | 변경 전 | 변경 후 |
|---|---|---|
| **정체성** | 유일한 테스트 수단 | 시각 시연 어댑터 |
| **주 사용자** | LLM (자가검증) | 사람 (라이브 데모) |
| **API 표면** | 독자 API (`TestActions`) | Playwright 호환 (`PageLike`) |
| **테스트 코드** | TestBot 전용 | 공유 (Playwright와 동일) |
| **커서/버블/스탬프** | 핵심 기능 | 핵심 기능 (유지) |

### 2.7 @testing-library/dom 사용 여부

**사용하지 않는 것을 추천한다.** 이유:

1. Playwright의 `getByText`는 **substring 매칭이 기본**, testing-library는 **exact 매칭이 기본** — 의미론 불일치
2. 우리 `selectors.ts`를 Playwright 의미론에 맞게 개선하는 것이 의존성 없이 더 간결함
3. LLM은 API 표면만 보므로, 내부 쿼리 엔진이 무엇이든 상관없음


## 3. 결론 및 제안 (Proposal)

### 핵심 가치

> **"한 번 작성, 세 곳에서 실행"** — LLM 자가검증(Playwright) + 사용자 시연(TestBot)을 동일한 테스트 코드로.

### 실행 순서 제안

1. **Playwright e2e 환경 세팅** — `@playwright/test` 설치, config 작성
2. **`PageLike` / `LocatorLike` 인터페이스 정의** — 공유 계약
3. **TestBot에 Playwright 호환 어댑터 구현** — `Locator` 클래스 + `expect()` + `Page` 프록시
4. **기존 테스트 1~2개를 공유 형식으로 마이그레이션** — 파일럿
5. **Playwright에서 파일럿 테스트 실행 검증**
6. **나머지 60+ suite 일괄 마이그레이션**

### 선결 조건

- Playwright가 테스트할 대상 앱이 localhost에서 실행되고 있어야 함 (`npm run dev`)
- 각 테스트 페이지(`/aria-showcase`, `/focus-showcase` 등)의 URL 라우트가 안정적이어야 함
