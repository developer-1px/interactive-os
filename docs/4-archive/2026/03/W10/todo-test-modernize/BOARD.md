# todo-test-modernize

## Context

Claim: keyboard-and-mouse.md 스펙 57개 시나리오 중 keyboard/mouse 경로로 검증되는 것은 25개(44%). page.dispatch() 기반 레거시 6파일이 "있지만 무효". 전면 재편하여 스펙 = 테스트 1:1 대응을 만든다.

Before -> After:
- 11 테스트 파일 (6 레거시 + 5 유효) -> 10 파일 (전부 keyboard/mouse 경로)
- 스펙 커버리지 44% -> ~91% (OS gap TODO 제외)
- dispatch 직접 테스트 52+12개 -> 0개

Risks:
- Dialog Tab trap, Enter confirm은 OS gap — TODO 마커로 처리
- 레거시 삭제 시 Selector/Condition 간접 검증 누락 가능 — keyboard 경로에서 확인

## Now

## Done
- [x] T1: helpers 확장 — gotoDraft, gotoEdit, gotoSearch 추가
- [x] T2: todo-list.test.ts — todo-bdd 리네임 + Cmd+Z, Cmd+Shift+Z, 배치 클립보드 추가, ARIA 분리, dispatch 제거
- [x] T3: todo-edit.test.ts — 신규 §2 (Enter-save, Escape-cancel[dispatch/OS gap], Arrow-block, Backspace-safe)
- [x] T4: todo-draft.test.ts — rewrite, field-headless-input 흡수
- [x] T5: todo-search.test.ts — 신규 §4 (type-filter, search-filter, Escape-clear[dispatch/OS gap], zero-results)
- [x] T6: todo-sidebar.test.ts — Enter 선택 + 마우스 클릭 추가
- [x] T7: todo-mode.test.ts — 신규 §8 (navigating<->editing 전환, Escape[dispatch/OS gap])
- [x] T8: todo-aria.test.ts — todo-bdd에서 분리 + Sidebar ARIA
- [x] T9: todo-dialog.test.ts — 신규 §6 (Backspace-open, Escape-close[dispatch/OS gap], Enter-confirm TODO, Tab trap TODO)
- [x] T10: todo-zone-transition.test.ts — probe SUCCESS: Tab zone 전환 headless 동작 확인
- [x] T11: 레거시 삭제 6파일 (todo.test.ts, paste-integration, field-undo-focus, field-headless-input, bulk-undo-repro, tab-repro)
- [x] T12: crud-and-interactions.md F/O DEPRECATED 마킹
- [x] T13: GREEN 검증 — 10 files, 68 tests, 0 fail

## Unresolved (OS Gaps)
- Dialog Tab trap: headless overlay focus trap 미지원
- Dialog Enter confirm: overlay zone navigation 미지원
- trigger:"change" field auto-commit: headless keyboard.type()에서 onChange auto-commit 안 됨 (search)
- Cross-zone editingItemId: list zone에서 설정한 editingItemId가 edit zone으로 전달 안 됨 (edit Escape, mode Escape)
- Overlay Escape dismiss: headless에서 dialog overlay의 Escape dismiss 미지원

## Ideas
- testbot-todo.ts에 신규 시나리오 동기화 (§2~§8 testbot scripts)
- keyboard-and-mouse.md 스펙에 테스트 파일 매핑 cross-reference 추가
