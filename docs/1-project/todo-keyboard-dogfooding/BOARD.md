# BOARD — todo-keyboard-dogfooding

## 🔴 Now

- [ ] Dogfooding 라이브 세션 — 실제로 키보드만으로 5개 시나리오 수행 + 마찰 포인트 리스트업
  - ref: README.md#acceptance-criteria

- [ ] Undo/Redo 키바인딩 검증 — ⌘Z/⌘⇧Z가 실제로 동작하는지 확인, 미동작 시 등록
  - ref: notes/ref-keyboard-first-checklist.md (Phase 1)

- [ ] 전체 선택 ⌘A — listView zone에서 ⌘A → 전체 선택이 동작하는지 확인
  - ref: notes/ref-keyboard-first-checklist.md (Phase 1)

- [ ] 포커스 복원 검증 — 삭제/붙여넣기/Undo/Redo 후 포커스가 올바른 위치로 이동하는지
  - ref: README.md SC-2, SC-3

- [ ] Multi-select 범위 선택 (⇧↑/⇧↓) — FocusGroup range select 동작 검증
  - ref: README.md SC-4

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

## 💡 Ideas

- History Middleware의 스냅샷 추적이 올바르게 동작하는지 E2E 검증
- Playwright E2E로 5개 시나리오 자동화 (M3 마일스톤)
- Board View 카드 컬럼 간 이동 (⌘←/⌘→) — Out of Scope이나 미래 과제
- 컨텍스트 메뉴 (⇧F10) — Power User 기능
