# BOARD — projection-checkpoint

## Now

(비어있음 — 모든 태스크 완료)

## Done

- [x] T1: `createAppPage`에 `Component?` 매개변수 추가 + `query()`/`html()` 메서드
- [x] T2: `todo-bdd.test.ts`에서 `createPage(ListView)` + dialog 투영 검증 테스트 1개
- [x] T3: 전체 테스트 통과 확인 (35 tests)
- [x] T4: `createPage`를 App에서 OS로 이동
  - `defineApp.page.ts` — standalone `createPage(app, Component?)` 함수 추가
  - `defineApp.types.ts` — `AppHandle`에 `__appId`, `__zoneBindings` 노출
  - `defineApp.ts` — `createPage` deprecated 유지 + internal data 노출
  - `todo-bdd.test.ts` — `createPage(TodoApp)`, `createPage(TodoApp, ListView)` 로 전환
  - `test-page.test.ts` — `createPage(TodoApp)` 로 전환
  - 44 tests 전부 통과, tsc 에러 0

## Ideas

- `AppHandle.createPage()` deprecated 제거 (완전 삭제)
- Cheerio 도입으로 CSS 셀렉터 기반 `page.query()` 지원
- `page.queryAll()` — 복수 엘리먼트 검색
- `renderToString` 캐싱 (dirty flag + lazy render)
- Zone 등록을 render-time으로 옮기기 (미래: `os.createPage(Component)` 1-arg API)
