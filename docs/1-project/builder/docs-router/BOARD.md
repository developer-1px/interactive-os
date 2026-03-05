# docs-router

## Context

Claim: router() AppModule을 만들어 TanStack Router에 브라우저 히스토리를 위임하고, DocsApp의 history[]/historyIndex/pushState/popstate를 제거한다. 앱은 OS API만 사용.

Before -> After:
- `DocsState = { activePath, history[], historyIndex, searchOpen }` -> `{ activePath, searchOpen }`
- DocsViewer 내 `pushState`/`popstate` 직접 관리 -> router() 미들웨어가 양방향 sync
- goBack/goForward가 OS state 조작 -> router 미들웨어가 TanStack Router에 위임
- DocsPage.tsx (구버전) + DocsViewer.tsx (신버전) 이중 존재 -> DocsViewer.tsx 단일

## Now

(empty — all tasks complete)

## Done

- [x] T2: router() AppModule 생성 — 74a5df93. 5/5 tests pass
- [x] T1: router 인스턴스 분리 — fdc31a6c. src/router.ts export
- [x] T3+T6: DocsState cleanup + test update — 15f4933f. history/historyIndex 제거, 5/5 tests
- [x] T4: router() 모듈 설치 — a8b0a176. main.tsx에서 os.use()
- [x] T5: DocsViewer cleanup — 03caa626. pushState/popstate/setHash/parseHash 제거 (-57 lines)
- [x] T7: DocsPage.tsx 삭제 — 4d430649. (-169 lines)

## Unresolved

- canGoBack/canGoForward: 브라우저 history API 제약으로 disabled 상태 제거. 항상 enabled.

## Ideas
