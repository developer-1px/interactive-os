# page-contract-split

## Context

**Claim**: `AppPageInternal`은 God Object다. 3경계 원칙에 따라 해체한다.

**3경계 원칙** (Discussion 2026-03-10 합의):

| 인터페이스 | 소유자 | 책임 | 접근 방법 |
|-----------|-------|------|----------|
| `page` | `@os-devtool` | 사용자 행동 (Playwright sanctum) | `createPage(app, Component)` |
| `os` | `@os-core/engine/kernel` | OS 상태 관찰 | 싱글턴 직접 import |
| `app` | `defineApp` 반환값 | 앱 커맨드 + 상태 | 테스트에서 직접 사용 |

**삭제 대상** (새는 추상화):
- `setupZone` — defineApp zone 선언을 우회하는 백도어
- `createTestEnv` — 중간 팩토리 불필요 (3경계가 독립 존재)
- `OsTestHandle` / `TestEnv` — os 싱글턴 래핑 불필요
- 테스트 내 `dispatch(OS_STACK_PUSH)` 등 OS 내부 커맨드 직접 호출

**Before → After**:
```typescript
// Before: God Object
const page = createHeadlessPage(App);
page.goto("/");
page.keyboard.press("ArrowDown");
page.focusedItemId();           // ← os 역할
page.dispatch(command);         // ← app 역할
page.setupZone("z", { ... });  // ← 백도어

// After: 3경계
const page = createPage(App, Component);
import { os } from "@os-core/engine/kernel";
page.goto("/");
page.keyboard.press("ArrowDown");
os.focusedItemId();             // os 직접
App.dispatch(command);          // app 직접
// setupZone → 삭제 (defineApp의 bind + goto로 대체)
```

## Now
- [ ] T1: `createPage` 팩토리 — `createHeadlessPage` → `createPage` 리네임, `Page`만 반환 — 크기: S
- [ ] T2: 테스트 마이그레이션 — `page.{os method}` → `os.{os method}` 싱글턴 직접 호출 — 크기: M
- [ ] T3: `AppPage`/`AppPageInternal` 타입 정리 + `createHeadlessPage` 삭제 — 크기: S, 의존: →T2

## Done
- [x] Page 인터페이스 (`types.ts`)에 `goto`/`click` 추가 — tsc 0 ✅
- [x] `BrowserPage`에 `goto`/`click` 구현 — tsc 0 ✅

## Unresolved
- `page.state` → `app.state` 마이그레이션 시 `app` 인스턴스의 `state` accessor 존재 여부 확인 필요
- os 싱글턴의 convenience 메서드 (`focusedItemId`, `attrs` 등) 현재 커널에 부재 → 헬퍼 or 커널 확장 결정

## Ideas
