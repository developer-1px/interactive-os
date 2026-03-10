# Spec — page-contract-split

> 한 줄 요약: AppPage를 삭제하고 Page(Playwright) + os(OS 전용)로 분리한다.
> Zone: **없음** (아키텍처/리팩토링). DT 스킵.

---

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 OsTestHandle 인터페이스 분리

**Story**: 테스트 작성자로서, OS 상태를 검증하는 API(`attrs`, `focusedItemId` 등)가 Playwright Page와 분리된 별도 객체로 제공되길 원한다. 그래야 TestScript가 Page만 import하면 Vitest/Browser/Playwright 어디서든 동일하게 실행되기 때문이다.

**Use Case — 주 흐름:**
1. `createTestEnv(AppHandle, Component?)` 호출
2. `{ page, os }` 객체 반환
3. `page.keyboard.press("ArrowDown")` — Playwright 동형 조작
4. `os.focusedItemId()` — OS 상태 검증
5. `os.attrs("item-1")` — DOM 투영 검증

**Scenarios:**

```
Scenario S1: 기본 destructuring 패턴
  Given createTestEnv(TodoApp, TodoPage) 호출
  When const { page, os } = createTestEnv(TodoApp, TodoPage)
  Then page는 Page 인터페이스를 만족한다 (keyboard, click, locator, goto)
  And os는 OsTestHandle 인터페이스를 만족한다 (attrs, focusedItemId, selection, activeZoneId, kernel, reset, cleanup, dumpDiagnostics, html, query)

Scenario S2: page에 OS 메서드가 없음
  Given const { page } = createTestEnv(TodoApp)
  When page.attrs를 접근하면
  Then TypeScript 컴파일 에러 (Property 'attrs' does not exist on type 'Page')

Scenario S3: 기존 동작 보존 — 키보드
  Given const { page, os } = createTestEnv(TodoApp, TodoPage)
  When page.keyboard.press("ArrowDown")
  Then os.focusedItemId()가 다음 아이템 ID를 반환한다

Scenario S4: 기존 동작 보존 — 클릭
  Given const { page, os } = createTestEnv(TodoApp, TodoPage)
  When page.click("item-2")
  Then os.focusedItemId()가 "item-2"를 반환한다

Scenario S5: 기존 동작 보존 — attrs
  Given const { page, os } = createTestEnv(TodoApp, TodoPage)
  When os.attrs("item-1")
  Then role, tabIndex, data-focused 등 속성이 반환된다

Scenario S6: 기존 동작 보존 — locator
  Given const { page } = createTestEnv(TodoApp, TodoPage)
  When page.locator("item-1").getAttribute("role")
  Then 해당 아이템의 role 문자열이 반환된다

Scenario S7: reset 격리
  Given createTestEnv(TodoApp, TodoPage) 호출
  When os.reset()
  Then 모든 상태가 초기값으로 복원된다

Scenario S8: cleanup
  Given createTestEnv(TodoApp, TodoPage) 호출
  When os.cleanup()
  Then zone 등록이 해제된다
```

### 1.2 AppPage / AppPageInternal 삭제

**Story**: OS 개발자로서, AppPage 타입이 코드베이스에서 완전히 제거되길 원한다. 그래야 Page에 OS 메서드를 붙이는 안티패턴이 구조적으로 불가능해지기 때문이다.

**Scenarios:**

```
Scenario S9: AppPage 타입 삭제
  Given defineApp/types.ts에서 AppPage 인터페이스 제거
  When tsc 실행
  Then 에러 0

Scenario S10: AppPageInternal 타입 삭제
  Given defineApp/types.ts에서 AppPageInternal 인터페이스 제거
  When tsc 실행
  Then 에러 0

Scenario S11: AppLocatorAssertions 타입 삭제
  Given defineApp/types.ts에서 AppLocatorAssertions 인터페이스 제거
  When Locator 타입의 not 필드가 LocatorAssertions를 참조
  Then tsc 에러 0

Scenario S12: as AppPageInternal 캐스트 제거
  Given window-splitter.apg.test.ts에서 `as AppPageInternal<unknown>` 제거
  When os 객체로 교체
  Then 테스트 PASS
```

### 1.3 기존 테스트 회귀 0

**Story**: 모든 테스트 작성자로서, API 분리 후에도 기존 774개 테스트가 전부 통과하길 원한다.

**Scenarios:**

```
Scenario S13: 전체 회귀 테스트
  Given T1~T6 모든 태스크 완료
  When npx vitest run 실행
  Then 774 tests PASS, 실패 0

Scenario S14: 타입 체크
  Given T1~T6 모든 태스크 완료
  When npm run typecheck 실행
  Then 에러 0
```

---

## 2. 상태 인벤토리 (State Inventory)

이 프로젝트는 **새 상태를 추가하지 않습니다**. 기존 상태를 다른 객체로 접근할 뿐입니다.

| 상태 | 설명 | 변경 |
|------|------|------|
| OS 커널 상태 | `AppState = { os, apps }` | 변경 없음 |
| Page 인터페이스 | `testing/types.ts` — Page, Locator | 그대로 사용 (고아→주인공 승격) |
| OsTestHandle | 신규 — OS 테스트 표면 | 기존 AppPage에서 추출 |

---

## 3. API Contract — Before / After

### Page (잔류)

| 메서드 | Before | After |
|--------|--------|-------|
| `goto(url)` | AppPage.goto | Page.goto (이미 존재) |
| `keyboard.press(key)` | AppPage.keyboard | Page.keyboard (이미 존재) |
| `keyboard.type(text)` | AppPage.keyboard | Page.keyboard (이미 존재) |
| `click(id, opts)` | AppPage.click | Page.click (이미 존재) |
| `locator(id)` | AppPage.locator | Page.locator (이미 존재) |

### OsTestHandle (신규 — AppPage에서 추출)

| 메서드 | Before | After |
|--------|--------|-------|
| `attrs(id, zoneId?)` | `page.attrs()` | `os.attrs()` |
| `focusedItemId(zoneId?)` | `page.focusedItemId()` | `os.focusedItemId()` |
| `selection(zoneId?)` | `page.selection()` | `os.selection()` |
| `activeZoneId()` | `page.activeZoneId()` | `os.activeZoneId()` |
| `kernel` | `page.kernel` | `os.kernel` |
| `reset()` | `page.reset()` | `os.reset()` |
| `cleanup()` | `page.cleanup()` | `os.cleanup()` |
| `dumpDiagnostics()` | `page.dumpDiagnostics()` | `os.dumpDiagnostics()` |
| `query(search)` | `page.query()` | `os.query()` |
| `html()` | `page.html()` | `os.html()` |

### 삭제

| 타입 | Before | After |
|------|--------|-------|
| `AppPage<S>` | 존재 (L280-351) | **삭제** |
| `AppPageInternal<S>` | 존재 (L362-385) | **삭제** |
| `AppLocatorAssertions` | 존재 (L272-278) | **삭제** — `LocatorAssertions` 통합 |
| `createHeadlessPage()` | `AppPage` 반환 | **`createTestEnv()` 교체** → `{ page, os }` 반환 |

---

## 4. 범위 밖 (Out of Scope)

- **Adapter 패턴 도입** (VitestAdapter, BrowserAdapter 등) — 별도 프로젝트 (headless-test-layer-separation 백로그)
- **TestScript E2E 전환** — Script에서 `locator.getAttribute()`로의 전환은 2단계
- **createBrowserPage 리팩토링** — AppPage 참조만 제거하고, 구조는 유지
- **TestInstance와 os의 통합** — app.dispatch는 현재 구조 유지

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-03-10 | 초판 작성 |
