# Playwright Polyfill 커버리지 감사 — Divide 분석

## 대상

`shim.ts` (Playwright polyfill) vs 프로젝트 내 모든 spec 파일 (14개)의 실제 API 사용량.

## 증거: 실사용 API Surface

### Page 메서드 (9개)

| API | 사용횟수 | shim 상태 | 정답? |
|-----|----------|-----------|-------|
| `page.goto()` | 전체 | ✅ shimmed | — |
| `page.locator(css)` | ~200+ | ✅ shimmed | — |
| `page.getByText(text)` | ~30 | ✅ shimmed | — |
| `page.on(event)` | 일부 | ✅ no-op | — |
| `page.waitForSelector()` | 전체 | ✅ shimmed | — |
| `page.waitForFunction()` | 일부 | ✅ no-op | — |
| `page.waitForTimeout()` | 일부 | ✅ shimmed | — |
| `page.keyboard.press()` | ~200+ | ✅ shimmed (오늘 수정) | — |
| `page.keyboard.type()` | ~20 | ✅ shimmed | — |

### Locator 메서드 (7개)

| API | 사용횟수 | shim 상태 | 정답? |
|-----|----------|-----------|-------|
| `locator.click()` | 145회 | ✅ shimmed | — |
| `locator.click({force: true})` | 2회 | ❌ **미구현** | ✅ 정답 있음 |
| `locator.locator(sub)` | ~15 | ✅ shimmed | — |
| `locator.allTextContents()` | 2회 | ✅ shimmed (오늘 수정) | — |
| `locator.fill()` | 0회 | ✅ shimmed | — |
| `locator.getByText(text)` | 2회 | ❌ **미구현** | ✅ 정답 있음 |
| `locator.getByRole(role, opts)` | 1회 | ❌ **미구현** | ✅ 정답 있음 |

### Expect 매처 (10개)

| API | 사용횟수 | shim 상태 | 정답? |
|-----|----------|-----------|-------|
| `toBeFocused()` | 224회 | ✅ shimmed | — |
| `toHaveAttribute(k, v)` | 214회 | ✅ shimmed | — |
| `toHaveCount(n)` | 25회 | ✅ shimmed (오늘 수정) | — |
| `toBeVisible()` | 11회 | ✅ shimmed | — |
| `toContainText(text)` | 9회 | ✅ shimmed (오늘 수정) | — |
| `toBeDisabled()` | 사용 | ✅ shimmed | — |
| `toBeLessThan(n)` | 2회 | ✅ shimmed | — |
| `toBeGreaterThan(n)` | 0회 | ✅ shimmed | — |
| `toBe(v)` | 0회 | ✅ shimmed | — |
| `not.toHaveAttribute(k, v)` | 18회 | ✅ shimmed | — |

### 미사용 (구현 불필요)

`first()`, `nth()`, `last()`, `count()`, `filter()`, `isVisible()`, `isEnabled()`,
`toBeEnabled()`, `toBeHidden()`, `getByLabel()`, `getByPlaceholder()`,
`textContent()`, `innerText()`, `getAttribute()`, `inputValue()`, `toEqual()`

— 현재 0회 사용. 필요 시 추가.

## 분해 결과

### ✅ 정답 있음 (3건 — 바로 실행 가능)

| # | 누락 API | 사용처 | 해법 |
|---|----------|--------|------|
| 1 | `locator.getByText(text)` | dialog.spec.ts (2회) | `ShimLocator`에 `getByText()` 추가: 부모 범위 내에서 text 검색 후 `ShimLocator` 반환 |
| 2 | `locator.getByRole(role, opts)` | dialog.spec.ts (1회) | `ShimLocator`에 `getByRole()` 추가: 부모 범위 내에서 role 검색. `exact` 옵션 처리 |
| 3 | `locator.click({force: true})` | toolbar.spec.ts, menu.spec.ts (2회) | `ShimLocator.click()`에서 `force` 옵션 무시하고 그냥 클릭 (disabled 체크 스킵) |

### ✅ 이미 해결 (오늘 수정, 5건)

| # | 수정 내용 |
|---|-----------|
| 1 | `keyboard.press` — compound key 파싱 (`Meta+a` → modifiers + key) |
| 2 | `expect(locator)` — `{text}` 셀렉터 → CSS 변환 (`resolveWithRetry`) |
| 3 | `toContainText` — polling retry 추가 |
| 4 | `allTextContents` — non-string 셀렉터 지원 |
| 5 | 전체 expect — auto-retry 폴링 |

### ❓ 정답 없음 (0건)

— 모든 누락 API가 정답이 명확함. 설계 판단 필요 없음.

## 실행 계획

3건 모두 정답 있음 → 단위 테스트 없이도 구현 명확 → 바로 실행.

1. `ShimLocator.getByText(text)` — 부모 locator 컨텍스트 내에서 검색
2. `ShimLocator.getByRole(role, {name, exact})` — 부모 내에서 role+name 검색
3. `ShimLocator.click({force})` — force 옵션 수용 (현재 shim은 어차피 disabled 체크 안 함)

## 결론

| 항목 | 값 |
|------|-----|
| 전체 사용 API | 19개 |
| 이미 shimmed | 16개 (84%) |
| 오늘 수정 | 5개 |
| 남은 gap | **3개** |
| 미사용 (구현 불필요) | 16개 |
| 정답 없음 | **0건** |

**Polyfill 완성까지 3건 남음. 전부 정답 있음. 바로 실행 가능.**
