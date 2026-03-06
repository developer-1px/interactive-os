# /divide Report — router() AppModule for docs-viewer

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | `router()` AppModule을 만들어 TanStack Router에 브라우저 히스토리를 위임. DocsApp의 `history[]`/`historyIndex`/`pushState`/`popstate` 제거. 앱은 OS API만 사용. |
| **Constraints** | C1. AppModule 인터페이스(`{ id, install -> Middleware }`) 변경 금지 / C2. 앱에서 TanStack 직접 import 금지 / C3. 기존 command 시그니처(`selectDoc`, `goBack`, `goForward`) 가능하면 유지 / C4. 기존 테스트 32개 불가 |
| **Variables** | V1. router() 모듈 내부 구조 / V2. DocsApp state 변경 범위 / V3. DocsViewer.tsx 제거 코드 / V4. TanStack Router 인스턴스 주입 방법 |

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | **router() 모듈로 브라우저 히스토리 위임** | ❌ | 모듈 미존재 | → A, B, C, D |
| 1 | **A. AppModule 인터페이스 존재** | ✅ | `appModule.ts:24-29` `{ id, install → Middleware }` | — |
| 1 | **B. Middleware가 after 훅으로 side effect 가능** | ✅ | `tokens.ts:141-145` `{ before?, after?, fallback? }` / `persistence.ts:64` after에서 localStorage 사용 선례 | — |
| 1 | **C. TanStack Router 인스턴스가 접근 가능** | ❌ | `main.tsx:8` — 로컬 변수. 미들웨어에서 접근 불가 | → C1, C2 |
| 2 | C1. router 인스턴스를 모듈에 주입 | ❌ | router() 옵션으로 받거나, 전역 레지스트리 필요 | → C1a |
| 3 | C1a. `router({ instance })` 옵션 패턴 | ❌ | persistence가 `persistence({ key })` 패턴 사용 (`persistence.ts:24`). 동일하게 `router({ instance })` 가능 | 🔨 **WP1** |
| 2 | C2. TanStack Router의 programmatic navigate API | ✅ | `router.navigate({ to })` — TanStack 표준 API. DocsPage.tsx:61에서 이미 사용 중 | — |
| 1 | **D. DocsApp에서 history 관련 코드 제거** | ❌ | `app.ts:75-76,82-83,91-100,114-135` — history[], historyIndex, goBack, goForward | → D1, D2, D3 |
| 2 | D1. DocsApp state에서 history/historyIndex 필드 제거 | ❌ | `app.ts:75-76` 현존 | 🔨 **WP2** |
| 2 | D2. goBack/goForward command → router 위임으로 대체 | ❌ | `app.ts:115-135` 현존 — 자체 history 스택 조작 | → D2a, D2b |
| 3 | D2a. router() 미들웨어가 GO_BACK/GO_FORWARD를 가로채 router.history.back()/forward() 호출 | ❌ | 미구현 | 🔨 **WP3** |
| 3 | D2b. canGoBack/canGoForward 파생 상태를 Router에서 읽기 | ❌ | `DocsViewer.tsx:169-172` — 현재 OS state에서 계산 | 🔨 **WP4** |
| 2 | D3. selectDoc의 history push 로직 제거, activePath만 설정 | ❌ | `app.ts:97-100` — history 조작 코드 | 🔨 **WP5** |
| 1 | **E. DocsViewer.tsx에서 pushState/popstate 제거** | ❌ | `DocsViewer.tsx:270-271,325-327` | → E1, E2 |
| 2 | E1. setHash/pushState 제거 — router() 미들웨어가 대체 | ❌ | `DocsViewer.tsx:270-271` | 🔨 **WP6** |
| 2 | E2. popstate listener 제거 — router() 미들웨어가 역방향 sync | ❌ | `DocsViewer.tsx:313-328` | 🔨 **WP7** |
| 1 | **F. 기존 DocsPage.tsx와의 통합/정리** | ❌ | DocsPage.tsx가 TanStack Router 직접 사용하는 구버전. DocsViewer.tsx는 해시 기반 신버전. 이중 존재. | → F1 |
| 2 | F1. 두 페이지의 역할 정리 (통합 or 삭제) | ❌ | `DocsPage.tsx:1-169` vs `DocsViewer.tsx` — 기능 중복 | 🔨 **WP8** |
| 1 | **G. 테스트 갱신** | ❌ | `docs-history.test.ts` — history[]/historyIndex 직접 검증 | → G1 |
| 2 | G1. 테스트를 router 기반으로 전환 | ❌ | 현재 테스트가 `page.state.history` 직접 assert | 🔨 **WP9** |

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence |
|----|---------|-------------------|----------|
| **WP1** | `router({ instance })` 모듈 생성 — install()이 Middleware 반환 | Goal ← C ← C1 ← C1a | `persistence.ts:24` 옵션 패턴 선례, `appModule.ts:28` install 시그니처 |
| **WP2** | DocsState에서 `history[]`, `historyIndex` 필드 제거 | Goal ← D ← D1 | `app.ts:75-76,82-83` |
| **WP3** | router 미들웨어 `after()`: SELECT_DOC → navigate, GO_BACK → history.back(), GO_FORWARD → history.forward() | Goal ← D ← D2 ← D2a | `historyKernelMiddleware.ts:156` after 훅 선례 |
| **WP4** | canGoBack/canGoForward를 Router state에서 파생 (useComputed 또는 hook) | Goal ← D ← D2 ← D2b | `DocsViewer.tsx:169-172` 현재 OS state 의존 |
| **WP5** | selectDoc command에서 history push 로직 제거, activePath만 설정 | Goal ← D ← D3 | `app.ts:97-100` |
| **WP6** | DocsViewer.tsx: setHash/pushState 전부 제거 | Goal ← E ← E1 | `DocsViewer.tsx:270-271,293-295` |
| **WP7** | DocsViewer.tsx: popstate listener 제거, router 미들웨어가 역방향 sync | Goal ← E ← E2 | `DocsViewer.tsx:313-328` |
| **WP8** | DocsPage.tsx vs DocsViewer.tsx 정리 — 하나로 통합하거나 역할 분리 | Goal ← F ← F1 | `DocsPage.tsx:1-169` 구버전, `DocsViewer.tsx` 신버전 |
| **WP9** | docs-history.test.ts를 router 기반으로 전환 (history[] assert 제거) | Goal ← G ← G1 | `docs-history.test.ts:33,40-42,84` |

## Residual Uncertainty

1. **DocsPage.tsx의 운명** (WP8): 이 파일은 TanStack Router를 직접 사용하는 "구버전" docs viewer다. router() 모듈을 만들면 DocsViewer.tsx가 DocsPage.tsx의 기능을 흡수하게 된다. **삭제할지, 리다이렉트로 남길지** 결정 필요.

2. **TanStack Router 인스턴스 주입** (WP1): `router({ instance })` 방식은 main.tsx에서 router 생성 후 모듈에 전달해야 한다. 하지만 `defineApp`은 모듈 스코프에서 호출된다 (app.ts). **시점 문제**: app.ts import 시점에 main.tsx의 router가 아직 없을 수 있다. 대안: lazy 주입 (getter 함수), 또는 전역 레지스트리.

3. **역방향 sync** (WP7): 브라우저 뒤로가기 → TanStack Router가 URL 변경 감지 → OS state 갱신. router() 미들웨어의 `after`는 command 발생 후 실행이므로, **외부 이벤트(popstate) → OS command** 방향은 미들웨어가 아닌 별도 구독(subscribe)이 필요. AppModule.install()에서 이벤트 리스너를 등록할 수 있는지 확인 필요.
