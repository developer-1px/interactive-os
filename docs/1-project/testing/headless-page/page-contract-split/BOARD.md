# page-contract-split

## 원칙

> **Playwright Isomorphism**: Page 인터페이스는 Playwright API의 subset이다.
> Playwright에 없는 메서드는 설계 누수이며, 삭제한다.

| 판정 | 예시 |
|------|------|
| ✅ Playwright에 있다 → 유지 (동형 이름) | `goto`, `click`, `keyboard.press`, `locator`, `content` |
| ❌ Playwright에 없다 → 삭제 | `dispatch`, `state`, `setupZone`, `focusedItemId`, `html` |
| 🔄 이름이 다르다 → 동형 변환 | `html()` → `content()` |

**3경계** — Page 밖의 것은 Page 밖에서 접근한다:

| 경계 | 소유자 | 접근 |
|------|-------|------|
| `page` | `@os-devtool` | Playwright subset (사용자 행동만) |
| `os` | `@os-core/engine/kernel` | 싱글턴 직접 import (OS 상태 관찰) |
| `app` | `defineApp` 반환값 | 테스트에서 직접 사용 (앱 커맨드 + 상태) |

## 금지 규칙

> ⛔ 삭제 대상 파일에서 코드를 복사하여 "마이그레이션"하지 않는다.
> 시나리오(WHAT)만 추출하고, 구현(HOW)은 새로 작성한다.
>
> 이유: 옛 테스트를 "번역"하면, God Object의 관점이 보존되어 설계 개선이 무효화된다.

## 종료 조건

이 프로젝트는 아래 3개가 **모두** 0일 때 완료다:

| 지표 | grep 명령 | 목표 |
|------|----------|------|
| `AppPageInternal` 사용 | `grep -rl "AppPageInternal" tests/` | **0** |
| `createHeadlessPage` 사용 | `grep -rl "createHeadlessPage" tests/` | **0** |
| `setupZone` 사용 | `grep -rl "setupZone" tests/` | **0** |

## Context

**Claim**: `AppPageInternal`은 God Object다. Playwright Isomorphism 원칙으로 해체한다.

```typescript
// Before: God Object
const page = createHeadlessPage(App);
page.goto("/");
page.keyboard.press("ArrowDown");
page.focusedItemId();           // ← os 역할 (Playwright에 없음)
page.dispatch(command);         // ← app 역할 (Playwright에 없음)
page.setupZone("z", { ... });  // ← 백도어 (Playwright에 없음)

// After: 3경계
const page = createPage(App, Component);
import { os } from "@os-core/engine/kernel";
page.goto("/");
page.keyboard.press("ArrowDown");
readFocusedItemId(os);          // os 직접
App.dispatch(command);          // app 직접
// setupZone → 삭제 (defineApp의 bind + goto로 대체)
```

## Now

> ⚠️ **Phase 1 완료 시 tsc가 대량 에러를 낸다. 이는 의도된 것이다.**
> 옛 API를 사용하는 테스트 파일들이 컴파일 에러를 내며, Phase 3 재작성으로 해소된다.
> Phase 1 검증 기준은 `packages/` 내부 tsc 0이다 (tests/ 에러 무시).

### Phase 1: 인프라 정리 (설계 완성)
- [ ] T1: Page 인터페이스에 `content()` 추가 (`html()` 동형 변환) — 크기: S, 의존: —
- [ ] T2: `setupZone` 함수 삭제 + goto 에러 메시지 정리 — 크기: S, 의존: —
- [ ] T3: God Object 반환에서 non-Playwright 메서드 제거 — 크기: M, 의존: →T1,T2
- [ ] T4: `createHeadlessPage` 삭제 + `AppPageInternal` re-export 삭제 — 크기: S, 의존: →T3
- [ ] T5: `index.ts` `createHeadlessPage` export 제거 — 크기: S, 의존: →T4
- [ ] T6: `runScenarios.ts` `createHeadlessPage` → `createPage` 전환 — 크기: S, 의존: →T5

### Phase 2: contracts 재작성
- [ ] T7: `contracts.ts` 삭제 후 3경계로 재작성 — 크기: M, 의존: →T5

### Phase 3: 테스트 삭제→재작성
- [ ] T8: APG contracts 의존 9파일 (combobox, dialog, listbox, menu, toolbar, tree, treegrid, carousel, feed) — 크기: M, 의존: →T7
- [ ] T9: APG setupZone 의존 4파일 (disallow-empty-initial, dropdown-menu, menu-button, navtree) — 크기: M, 의존: →T5
- [ ] T10: Todo 3파일 (todo.test, todo-bug-hunt, todo-trigger-click) — 크기: M, 의존: →T1,T5
- [ ] T11: docs-viewer 2파일 (docs-viewer-headless, docs-search-overlay) — 크기: S, 의존: →T1,T5


## Done
- [x] T1: `createPage` 팩토리 — `{ page, cleanup }` 반환 ✅
- [x] T2a: Clean 테스트 3경계 전환 (16/16파일) — 734 PASS ✅
- [x] Batch 1: APG locator 전환 (checkbox, switch, radiogroup, disclosure, tooltip, meter, button, carousel, feed, window-splitter) ✅
- [x] `readSelection()` standalone 함수 추출 ✅
- [x] Page 인터페이스에 `goto`/`click` 추가 ✅
- [x] `BrowserPage`에 `goto`/`click` 구현 ✅
