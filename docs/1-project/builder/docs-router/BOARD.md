# docs-router

## Context

Claim: router() AppModule을 만들어 TanStack Router에 브라우저 히스토리를 위임하고, DocsApp의 history[]/historyIndex/pushState/popstate를 제거한다. 앱은 OS API만 사용.

Before -> After:
- `DocsState = { activePath, history[], historyIndex, searchOpen }` -> `{ activePath, searchOpen }`
- DocsViewer 내 `pushState`/`popstate` 직접 관리 -> router() 미들웨어가 양방향 sync
- goBack/goForward가 OS state 조작 -> router 미들웨어가 TanStack Router에 위임
- DocsPage.tsx (구버전) + DocsViewer.tsx (신버전) 이중 존재 -> DocsViewer.tsx 단일

Risks:
- TanStack Router API 변경 시 router 모듈 깨짐
- canGoBack/Forward 파생 상태의 정확한 소스 (브라우저 history API 제약)

## Now

- [ ] T1: router 인스턴스 분리 — src/router.ts export, main.tsx import (Plan #2)
- [ ] T2: router() AppModule 생성 — modules/router.ts, after() 정방향 + subscribe 역방향 (Plan #1)
- [ ] T3: DocsState history/historyIndex 제거 + selectDoc/resetDoc/goBack/goForward 수정 (Plan #3,4,5,6)
- [ ] T4: defineApp에 router() 모듈 설치 (Plan #7)
- [ ] T5: DocsViewer.tsx에서 pushState/popstate/setHash/hash-sync 제거 + canGoBack/Forward 전환 (Plan #8,9,10,11)
- [ ] T6: docs-history.test.ts 갱신 — history[] assert 제거, activePath + keyboard 동작 검증 (Plan #12)
- [ ] T7: DocsPage.tsx 삭제 + route 파일 정리 (Plan #13)

## Done

## Unresolved

## Ideas
