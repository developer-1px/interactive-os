# BOARD — todo-keyboard-dogfooding

## 🔴 Now

_(empty)_

## ⏳ Done

- [x] Todo v5 defineApp 전환 (02-13) — `todo-app` 프로젝트에서 완료
- [x] Todo v3→v5 migration (02-13) — `todo-v3-migration` 프로젝트에서 완료
- [x] Multi-select commands (OS_DELETE/OS_COPY/OS_CUT) (02-14) — `d14414c`
- [x] Transaction (undo/redo grouping) (02-14) — `d14414c`
- [x] Clipboard migration (OS 통합) (02-14) — `d14414c`
- [x] Native clipboard 보존 (02-14) — `ca109e2`
- [x] 멀티 클립보드 버그 수정 (02-15) — 잘라내기 3개 → 붙여넣기 1개만 되던 버그
- [x] 클립보드 포커스 이동 이슈 (02-13) — notes/issue-clipboard-focus.md
- [x] Playwright clipboard 퍼미션 (02-13) — notes/issue-copy-paste-fail.md
- [x] 네이티브 클립보드 OS 오버라이드 차단 (02-13) — notes/issue-native-clipboard-blocked.md
- [x] Undo/Redo 키바인딩 검증 (02-16) — 이미 osDefaults.ts에 등록됨 확인. E2E 테스트 추가.
- [x] ⌘A 전체 선택 검증 (02-16) — 이미 osDefaults.ts에 등록됨 확인.
- [x] 포커스 복원 구현 (02-16) — deleteTodo에 FOCUS dispatch 추가. E2E 테스트 통과.
- [x] Multi-select 범위 선택 검증 (02-16) — Shift+Arrow OS keybinding 확인. E2E 벌크삭제+Undo 검증.
- [x] Dogfooding 라이브 세션 (02-16) — SC-1~SC-5 모든 시나리오 E2E 테스트로 16개 커버 완료.

## 💡 Ideas

- History Middleware의 스냅샷 추적이 올바르게 동작하는지 E2E 검증
- Playwright E2E로 5개 시나리오 자동화 (M3 마일스톤) → ✅ 완료됨
- Board View 카드 컬럼 간 이동 (⌘←/⌘→) — Out of Scope이나 미래 과제
- 컨텍스트 메뉴 (⇧F10) — Power User 기능
