# page-contract-split

| Key | Value |
|-----|-------|
| Claim | `AppPage`/`AppPageInternal`은 God Object다. Playwright Isomorphism 원칙으로 해체한다. |
| Before | `AppPage`(God Object 타입) + `createAppPage`(God Object 팩토리) — 테스트가 OS 내부에 직접 의존 |
| After | `Page`(Playwright subset)만 외부 노출. 내부 구현체는 "Page" 이름을 갖지 않음 |
| Size | Light |
| Risk | 내부 리네이밍이 packages/ 간 import chain에 영향. tsc -b로 검증 필수 |

## 원칙

> **Playwright Isomorphism**: Page 인터페이스는 Playwright API의 subset이다.
> Playwright에 없는 메서드는 설계 누수이며, 삭제한다.

| 판정 | 예시 |
|------|------|
| ✅ Playwright에 있다 → 유지 (동형 이름) | `goto`, `click`, `keyboard.press`, `locator`, `content` |
| ❌ Playwright에 없다 → 삭제 | `dispatch`, `state`, `setupZone`, `focusedItemId`, `html` |
| 🔄 이름이 다르다 → 동형 변환 | `html()` → `content()` |

> 📐 **1경계** — 테스트 시나리오에서 API는 `page`뿐.
> - `os` = 인프라 세부사항. locator 구현체 내부에 숨는다. 테스트 코드에서 import 금지.
> - `app` = fixture 설정(Arrange)에서만. 시나리오(Act+Assert)에서 등장하면 동형 위반.

## 금지 규칙

> ⛔ 삭제 대상 파일에서 코드를 복사하여 "마이그레이션"하지 않는다.
> 시나리오(WHAT)만 추출하고, 구현(HOW)은 새로 작성한다.
>
> 이유: 옛 테스트를 "번역"하면, God Object의 관점이 보존되어 설계 개선이 무효화된다.

## 종료 조건

이 프로젝트는 아래가 **모두** 0일 때 완료다:

| 지표 | grep 범위 | 목표 |
|------|----------|------|
| `AppPage` 타입 | `packages/` | **0** (타입 자체 제거/리네이밍) |
| `AppPageInternal` 타입 | `packages/` + `tests/` | **0** |
| `createAppPage` 함수 | `packages/` | **0** (리네이밍) |
| `createHeadlessPage` 참조 | 전체 (`.agent/`, `tests/`) | **0** |
| `setupZone` 사용 | `tests/` | **0** |

## Now

### Phase 3: 레거시 식별자 청산 (packages/) ✅

> **완료**: God Object 해체. page.ts 927줄→96줄. lib/ 5모듈 분리.

| # | Task | 크기 | 검증 | 상태 |
|---|------|------|------|------|
| T1 | `types.ts`에서 `AppPage`/`AppPageInternal`/`AppLocatorAssertions` 삭제 | S | tsc -b 0 | ✅ |
| T2 | `page.ts` 반환부에서 14개 non-Playwright 멤버 + `setupZone` 함수 삭제 | S | tsc -b 0 | ✅ |
| T3 | projection 추출 → `lib/projection.ts` (`createProjection`) | M | tsc -b 0 | ✅ |
| T4 | locator 추출 → `lib/locator.ts` (`createLocator`) | M | tsc -b 0 | ✅ |
| T5 | env setup 추출 → `lib/setupHeadlessEnv.ts` | M | tsc -b 0 | ✅ |
| T6 | zone setup 추출 → `lib/zoneSetup.ts` (`registerZones` + `seedInitialState`) | M | tsc -b 0 | ✅ |
| T7 | typeIntoField 추출 → `lib/typeIntoField.ts` | S | tsc -b 0 | ✅ |
| T8 | `createPage` 재조합 + `createAppPage` 삭제 (page.ts 927→96줄) | S | tsc -b 0 + 506 tests PASS | ✅ |
| T9 | 유령 참조 정리 (rules.md, knowledge/ 7파일, workflows/, 주석) | M | grep 0 | ✅ |

### Phase 4: 테스트 삭제→재작성

| # | Task | 크기 | 검증 | 상태 |
|---|------|------|------|------|
| T8a | APG 6파일 1경계 재작성 (combobox, dialog, menu, toolbar, tree + listbox) | M | 64 PASS, 2 skip | ✅ |
| T8b | APG 3파일 1경계 재작성 (treegrid, carousel, feed) | M | 42 PASS (treegrid 26 + feed 16) + carousel 26 PASS | ✅ |
| T9 | APG setupZone 의존 4파일 (disallow-empty-initial, dropdown-menu, menu-button, navtree) | M | 40 PASS | ✅ |
| T10 | Todo 3파일 (todo.test, todo-bug-hunt, todo-trigger-click) | M | 96 PASS, 1 skip | ✅ |
| T11 | docs-viewer 2파일 (docs-viewer-headless, docs-search-overlay) | S | 9 PASS | ✅ |

## Unresolved

(Phase 3에서 전부 해소 — 타입 자체를 삭제. 리네이밍 불필요.)

## Done

### Phase 1: 인프라 정리 (설계 완성) ✅
- [x] T1: Page 인터페이스에 `content()` 추가 — tsc 0 ✅
- [x] T2: `setupZone` goto 에러 메시지 참조 제거 — tsc 0 ✅
- [x] T3: God Object 반환은 `createPage`에서 이미 격리됨 — 변경 불필요 ✅
- [x] T4: `createHeadlessPage` 삭제 + `AppPageInternal` re-export 삭제 — tsc 0 ✅
- [x] T5: `index.ts` `createHeadlessPage` export 제거 — tsc 0 ✅
- [x] T6: `runScenarios.ts` `createHeadlessPage` → `createPage` + cleanup — tsc 0 ✅

### Phase 2: contracts + 인프라 ✅
- [x] T7: `contracts.ts` locator 기반 재작성 (os import 0줄) — tsc 0 ✅
- [x] T7a: `locator(":focus")` 지원 추가 (headless + browser) — tsc 0 ✅
- [x] T7b: `expect()` Playwright 동형 확장 (locator + value 통합) — tsc 0 ✅
- [x] T7c: JSDoc + domain-glossary 1경계 원칙 반영 — 43 tests ✅
- [x] T1(old): `createPage` 팩토리 — `{ page, cleanup }` 반환 ✅
- [x] T2a(old): Clean 테스트 3경계 전환 (16/16파일) — 734 PASS ✅
- [x] Batch 1: APG locator 전환 (checkbox, switch, radiogroup, disclosure, tooltip, meter, button, carousel, feed, window-splitter) ✅
- [x] `readSelection()` standalone 함수 추출 ✅
- [x] Page 인터페이스에 `goto`/`click` 추가 ✅
- [x] `BrowserPage`에 `goto`/`click` 구현 ✅
