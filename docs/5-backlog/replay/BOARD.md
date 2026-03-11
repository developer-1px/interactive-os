# BOARD — Replay

## Now

- [ ] T1: todo-bdd.test.ts headless e2e 완성
  - 전체 테스트를 `createPage(TodoApp, ListView)`로 전환
  - 매 테스트 마지막에 `page.query()` assertion 추가
  - state 검증 → projection 검증 순서

## Done

(비어있음)

## Ideas

- Replay 앱 scaffold (`/replay` 라우트)
- createPage instrumentation (press/click/query 호출을 step 배열로 기록)
- 가상 키보드 시각화 컴포넌트
- 가상 마우스 커서 시각화 컴포넌트
- PASS/FAIL 배지 오버레이
- step-by-step 재생 컨트롤 (play/pause/step/speed)
- 테스트 파일 목록 브라우저
