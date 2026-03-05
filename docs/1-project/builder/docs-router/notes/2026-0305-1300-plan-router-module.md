# Plan: router() AppModule for docs-viewer

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `modules/router.ts` (new) | 미존재 | `router(opts): AppModule` — install()이 Middleware 반환. after()에서 SELECT_DOC/GO_BACK/GO_FORWARD 감지 후 TanStack navigate/back/forward 호출. install 팩토리에서 router.subscribe로 역방향 sync. | Clear | — | +N tests | TanStack Router API 변경 시 깨짐 |
| 2 | `src/main.tsx:router` | 로컬 변수 `const router = createRouter(...)` | `src/router.ts`로 분리하여 export. main.tsx에서 import. | Clear | — | build OK | 기존 import 경로 변경 없음 (main.tsx만 변경) |
| 3 | `app.ts:DocsState` | `{ activePath, history[], historyIndex, searchOpen }` | `{ activePath, searchOpen }` — history/historyIndex 제거 | Clear | →#1 | tsc 0 | selectDoc/resetDoc command 수정 필요 |
| 4 | `app.ts:selectDoc` | activePath 설정 + history push + truncate | activePath만 설정. history 로직 삭제. | Clear | →#3 | tsc 0 | — |
| 5 | `app.ts:goBack/goForward` | OS state의 history[]/historyIndex 조작 | command는 유지하되, handler를 no-op으로 변경 (미들웨어가 after에서 처리). 또는 삭제하고 미들웨어 fallback으로 처리. | Clear | →#1 | tsc 0 | Keybindings 등록이 이 command를 참조 |
| 6 | `app.ts:resetDoc` | history/historyIndex 클리어 | activePath=null만. history 관련 제거. | Clear | →#3 | tsc 0 | — |
| 7 | `app.ts:defineApp` | `modules` 없음 | `modules: [router({ instance })]` 추가 | Clear | →#1, →#2 | tsc 0 | — |
| 8 | `DocsViewer.tsx:setHash/pushState` | `useCallback` + `history.pushState(null,"",hash)` | 삭제. router 미들웨어가 대체. | Clear | →#1 | build OK | — |
| 9 | `DocsViewer.tsx:popstate listener` | `useEffect` + `addEventListener("popstate", ...)` | 삭제. router 미들웨어의 router.subscribe가 대체. | Clear | →#1 | build OK | — |
| 10 | `DocsViewer.tsx:canGoBack/Forward` | `DocsApp.useComputed(s => s.historyIndex)` + `s.history.length` | TanStack Router의 `router.history` 또는 `window.history.length`에서 파생. 또는 router 모듈이 OS state에 주입. | Clear | →#1 | build OK | back/forward 버튼 disabled 상태 |
| 11 | `DocsViewer.tsx:hash sync in useEffect` | activePath 변경 시 `setHash(#/path)` 호출 | 삭제. router 미들웨어가 SELECT_DOC after에서 navigate 호출. | Clear | →#1, →#8 | build OK | — |
| 12 | `docs-history.test.ts` | `page.state.history`, `page.state.historyIndex` assert | activePath만 assert. history 필드 참조 제거. back/forward는 keyboard.press로 동작 확인만. | Clear | →#3, →#5 | 기존 8 tests 유지 | — |
| 13 | `DocsPage.tsx` | TanStack Router 직접 사용하는 구버전 docs viewer | 삭제. DocsViewer.tsx가 완전 대체. route 파일 정리. | Clear | →#8, →#9 | build OK | DocsPage를 참조하는 route 파일 수정 필요 |

## MECE 점검

1. CE: 13행 모두 실행하면 router() 모듈 완성 + 기존 history 코드 전수 제거 + 테스트 갱신 + 구버전 삭제. 목표 달성.
2. ME: 중복 없음.
3. No-op: 없음.

## 라우팅

승인 후 → `/project` (docs-router) — router() AppModule 신규 프로젝트. BOARD.md 생성 후 실행.
