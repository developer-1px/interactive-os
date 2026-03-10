# Naming Analysis — app / os / page 핵심 개념

> 범위: `packages/os-devtool/src/testing/` — 테스트 인프라 공개 API
> 날짜: 2026-03-10

---

## 1. 식별자 수집

### 공개 API (index.ts re-export)

| 식별자 | 종류 | 역할 |
|--------|------|------|
| `createPage(app, Component?)` | function | headless Page + cleanup 반환 |
| `Page` | interface | Playwright subset (goto, click, keyboard, locator, content) |
| `Locator` | interface | 요소 관찰 + assertion (getAttribute, toBeFocused, toHaveAttribute) |
| `LocatorAssertions` | interface | Locator의 assertion 부분 |
| `expect(value)` | function | Playwright-compatible assertion (locator + value) |
| `createBrowserPage(opts)` | function | Browser inspector용 Page |
| `BrowserPage` | interface | Browser 환경 Page 확장 |
| `TestBotRegistry` | class | TestScript 등록소 |
| `getZoneItems(zoneId)` | function | zone에서 아이템 목록 가져오기 |

### 내부 API (export되지만 직접 사용은 드물다)

| 식별자 | 종류 | 역할 |
|--------|------|------|
| `createAppPage(appId, bindings, Component, keybindings)` | function | 내부 — God Object 반환 (AppPageInternal) |
| `ItemAttrs` | type | re-export |

## 2. 형태소 분해 + Key Pool

| Category | Key | Meaning | Appears In |
|----------|-----|---------|------------|
| Verb | `create` | 새 인스턴스 반환 | `createPage`, `createAppPage`, `createBrowserPage` |
| Noun | `Page` | Playwright의 Page 인터페이스 | `Page`, `createPage`, `createBrowserPage`, `BrowserPage` |
| Noun | `Locator` | Playwright의 Locator 인터페이스 | `Locator`, `LocatorAssertions` |
| Noun | `App` | defineApp 반환값 (AppHandle) | `createAppPage`, `AppHandle` |
| Noun | `Browser` | 브라우저 환경 | `createBrowserPage`, `BrowserPage`, `BrowserStep` |
| Suffix | `Assertions` | assertion 메서드 집합 | `LocatorAssertions` |
| Suffix | `Handle` | 팩토리 반환 API 핸들 | `AppHandle` |
| Suffix | `Internal` | ❌ 삭제됨 | ~~`AppPageInternal`~~ |
| Noun | `expect` | Playwright의 expect 함수 | `expect()` |

## 3. 이상 패턴 리포트

### 3.1 의미 과적: `Page`

`Page`가 3가지 다른 맥락에서 사용됨:

| 맥락 | 의미 | 예 |
|------|------|---|
| Playwright API | Playwright의 Page class | `interface Page` ✅ |
| 파일명 | page.ts = Page를 만드는 코드 | `page.ts` ✅ |
| 함수 파라미터 이름 | `page` 변수 | `const { page } = createPage(app)` ✅ |

→ **과적 아님**. 모든 용례가 같은 의미 (Playwright Page). 🟢

### 3.2 고아 Key: `App` in `createAppPage`

`createAppPage`는 내부 함수. 외부에서 쓰지 않음.
`App`이 함수명에 있지만 실제 반환하는 것은 `AppPageInternal` (God Object).
이 함수 자체가 Phase 1에서 deprecated된 구조의 잔재.

→ **내부용이므로 현재 자연스러움**. 외부 API에는 노출 안 됨. 🟢 (리팩토링 시 재검토)

### 3.3 ⚠️ 핵심 문제: `app`, `os` — 이름이 아니라 **존재 자체**

domain-glossary의 "2경계" 원칙을 적용하면:

| 개념 | 테스트 코드에서의 존재 | Playwright에서의 대응 |
|------|---------------------|---------------------|
| `page` | `page.keyboard.press()`, `page.locator()` | ✅ `page` — 동일 |
| `os` | ❌ **사용 금지** (os import 0줄) | ❌ 존재하지 않음 |
| `app` | `createPage(app, Component)` — 팩토리 입력 | `page.goto("/app-url")` — URL로 대체 |

**`os`**: 테스트에서 이름조차 등장하면 안 된다. 인프라 내부.

**`app`**: `createPage(app)` — 이 `app`은 "테스트 대상 앱의 정의"를 전달하는 것.
Playwright에서는 이 역할이 `goto(url)` 하나로 끝난다.
headless에서는 defineApp 반환값을 넘겨야 하지만, 이건 **환경 차이**이지 **경계가 아니다**.

### 3.4 2경계의 재해석

| 이전 이해 | 문제 | 수정 |
|----------|------|------|
| "page + app = 2경계" | `app`은 "경계"가 아니라 "fixture 입력" | **page가 유일한 경계** |

테스트 작성자가 테스트 실행 중에 사용하는 API = **`page`뿐**.
`app`은 fixture 설정 시에만 사용되고, 테스트 시나리오(action + assert) 안에서는 등장하지 않아야 한다.

```typescript
// fixture 설정 (Arrange) — app은 여기서만
function createListbox() {
  const app = defineApp("test-listbox", {});
  // ...
  return { page, cleanup };
}

// 테스트 시나리오 (Act + Assert) — page만
it("test", () => {
  const { page, cleanup } = createListbox();
  page.keyboard.press("ArrowDown");          // Act: page
  await expect(page.locator(":focus"))...     // Assert: page
  cleanup();
});
```

`app`이 테스트 시나리오 안에서 `app.dispatch(cmd)` 같은 걸 해야 한다면?
→ Playwright에서는 해당 커맨드를 유발하는 **사용자 행동**이 있을 것이다. 그 행동을 page로 시뮬레이트하는 게 맞다.

## 4. 결론

| 이름 | 판정 | 근거 |
|------|------|------|
| `Page` | 🟢 유지 | Playwright 원본 이름. 동형. |
| `Locator` | 🟢 유지 | Playwright 원본 이름. 동형. |
| `expect` | 🟢 유지 | Playwright 원본 이름. 동형. |
| `createPage` | 🟢 유지 | `create` (naming.md) + `Page` (Playwright). |
| `os` | 🔴 **테스트 코드에서 등장 금지** | Playwright에 없다. 인프라 세부사항. |
| `app` | 🟡 **fixture에서만** | 테스트 시나리오(act+assert)에서 등장하면 동형 위반. |
| "2경계" | 🟡→ **1경계** | 실행 시나리오에서 경계는 `page`뿐. `app`은 fixture 입력. |

### Page = 유일한 테스트 API

```
Playwright:  page.goto() → page.keyboard.press() → expect(page.locator()).toBeFocused()
Headless:    page.goto() → page.keyboard.press() → expect(page.locator()).toBeFocused()
             ↑ 동일한 코드. 이것이 동형.
```
