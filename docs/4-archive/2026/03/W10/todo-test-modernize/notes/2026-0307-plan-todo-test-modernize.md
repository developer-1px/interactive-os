# Plan: Todo Test Modernize

> keyboard-and-mouse.md 스펙 기준으로 Todo 테스트 전면 재편.
> 레거시(dispatch 직접) 삭제 + 공백 섹션 신규 작성 + 기존 유효 테스트 통합.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|-|-|-|-|-|-|-|-|
| 1 | `tests/integration/todo/todo-helpers.ts` | `gotoList`, `gotoSidebar`, `addTodos`, `setupTodoPage` 4개 helper. draft/edit/search zone goto 없음 | `gotoDraft()`, `gotoEdit(itemId)`, `gotoSearch()` 추가. `setupTodoPage`는 기존 유지 | Clear | — | import 정상, tsc 0 | 없음 |
| 2 | `tests/integration/todo/todo-bdd.test.ts` → `todo-list.test.ts` | §1.1~§1.5 + §ARIA 혼합. §1.3에 Cmd+Z/Shift+Z 누락, §1.4에 배치 클립보드 누락. `cancelDeleteTodo`/`confirmDeleteTodo`/`undoCommand` dispatch 3건 | 리네임 `todo-list.test.ts`. §ARIA 분리. Cmd+Z, Cmd+Shift+Z 추가. 배치 Cmd+C, 배치 Cmd+V 추가. dispatch 3건은 §6 Dialog로 이관 | Clear | #1 | §1 기존 테스트 유지 + 신규 4개 PASS | dispatch 제거 시 Delete Cancel/Undo 시나리오 이관 필요 |
| 3 | `tests/integration/todo/todo-edit.test.ts` | 존재하지 않음 | 신규. §2 Edit Zone 4 시나리오: Enter-save, Escape-cancel, ArrowDown-block, Backspace-safe. `gotoEdit(itemId)` 사용 | Clear | #1 | +4 tests | edit zone의 headless 동작 미검증이므로 구현 gap 발견 가능 |
| 4 | `tests/integration/todo/todo-draft.test.ts` | §3 2개 시나리오 (Enter 추가, resetOnSubmit). Escape 누락 | Escape 포커스 해제 1개 추가. `field-headless-input.test.ts` 4개 시나리오 흡수 (중복 제거 후 실질 +1~2) | Clear | — | 기존 2 + 신규 1~3 PASS | 없음 |
| 5 | `tests/integration/todo/todo-search.test.ts` | 존재하지 않음 | 신규. §4 Search Zone 3 시나리오: type-filter, Escape-clear, zero-results. `gotoSearch()` + `keyboard.type()` + `page.state.ui.searchQuery` 검증 | Clear | #1 | +3 tests | search zone의 field trigger="change" headless 동작 미검증 |
| 6 | `tests/integration/todo/todo-sidebar.test.ts` | §5 4개 시나리오 (ArrowDown, ArrowUp, followFocus, Cmd+Arrow). Enter 선택, 마우스 클릭 누락 | Enter → selectCategory, click → selectCategory 2개 추가 | Clear | — | 기존 4 + 신규 2 PASS | 없음 |
| 7 | `tests/integration/todo/todo-mode.test.ts` | 존재하지 않음 | 신규. §8 모드전환 3 시나리오: navigating→editing(Enter), editing중 Arrow/Backspace/Space 차단, editing→navigating(Enter/Escape) | Clear | #3 | +3 tests | editing 모드에서 OS inputmap 비활성 여부 headless 미검증 |
| 8 | `tests/integration/todo/todo-aria.test.ts` | todo-bdd.test.ts 내 §ARIA 3개 시나리오. Dialog/Sidebar ARIA 없음 | 분리 + Sidebar aria-selected 추가. Dialog/Toast ARIA는 TODO (OS gap) | Clear | #2 | 기존 3 + 신규 1 PASS | 없음 |
| 9 | `tests/integration/todo/todo-dialog.test.ts` | 존재하지 않음 | 신규. §6 일부: Backspace→dialog open (query), Escape→close, Enter→confirm+delete. Tab trap = TODO | Complicated | #2 | +3 tests (Tab trap TODO) | overlay open/close headless 동작 probe 필요 |
| 10 | `tests/integration/todo/todo-zone-transition.test.ts` | tab-repro.test.ts (assertion 없는 repro) | 신규. §7 probe: Tab→activeZoneId 변경. 실패 시 TODO 마커 | Complicated | — | probe 결과에 따라 +2~3 또는 TODO | headless Tab zone 전환 미검증 |
| 11 | `src/apps/todo/__tests__/unit/todo.test.ts` | dispatch 직접 52개 테스트 (CRUD, Editing, Selectors, Conditions, Ordering, Category, Clipboard, View) | 삭제. 커버리지는 #2~#10으로 대체 | Clear | #2~#10 | -52 tests, 기존 커버리지 #2~#10에서 확인 | Selector/Condition 테스트가 keyboard 경로에서 간접 검증되는지 확인 필요 |
| 12 | `tests/integration/todo/paste-integration.test.ts` | createIntegrationTest 패턴. 2개 테스트 | 삭제. paste 커버리지는 #2 §1.4에서 대체 | Clear | #2 | -2 tests | 없음 |
| 13 | `tests/integration/todo/field-undo-focus.test.ts` | os.dispatch/setState 직접. 3개 테스트 | 삭제. field commit/cancel focus는 #3 Edit + #7 Mode에서 간접 검증 | Clear | #3, #7 | -3 tests | 없음 |
| 14 | `tests/integration/todo/field-headless-input.test.ts` | keyboard.type + FieldRegistry.updateValue 직접. 4개 테스트 | 삭제. #4 todo-draft.test.ts에 흡수 | Clear | #4 | -4 tests (흡수) | 없음 |
| 15 | `tests/integration/todo/bulk-undo-repro.test.ts` | repro. console.log. dispatch 직접. 1개 테스트 | 삭제 | Clear | — | -1 test | 없음 |
| 16 | `tests/integration/todo/tab-repro.test.ts` | repro. console.log. assertion 없음. 2개 테스트 | 삭제. #10에서 대체 | Clear | #10 | -2 tests | 없음 |
| 17 | `docs/6-products/todo/spec/crud-and-interactions.md` | active로 보임 | 상단 F/O deprecated 마킹 | Clear | — | — | 없음 |
| 18 | `src/apps/todo/__tests__/unit/todo-interaction.test.ts` | runScenarios wrapper (testbot-todo 시나리오 실행) | 유지. testbot 시나리오 자동 실행 역할 | — (no-op) | — | — | — |

## Cynefin 해소

### #9 (Complicated → Clear): todo-dialog.test.ts

**After가 확정되지 않는 이유**: Overlay open/close가 headless에서 keyboard 경로로 동작하는지 미검증.

**제 판단: Backspace→query("dialog") 이미 동작** (todo-bdd.test.ts L201에서 확인). Escape→close는 OS_OVERLAY_CLOSE dispatch를 우회하여 keyboard.press("Escape")로 시도. 실패 시 TODO.

→ **Clear로 승격**. 실패 시나리오는 TODO 마커로 처리.

### #10 (Complicated → Clear): todo-zone-transition.test.ts

**After가 확정되지 않는 이유**: headless Tab→zone 전환이 동작하는지 미검증.

**제 판단: probe-first**. 간단 테스트 1개 작성하여 `press("Tab")` + `activeZoneId()` 확인. 동작하면 시나리오 작성, 실패하면 전체 파일 TODO.

→ **Clear로 승격**. probe 실패 = TODO 파일 (빈 describe + TODO comment).

## MECE 점검

1. **CE**: #1~#17 실행 시 keyboard-and-mouse.md 57개 시나리오 중 OS gap 의존 ~5개 제외 전부 커버? → Yes. Tab trap(§6), Zone 전환 실패 시(§7)만 TODO.
2. **ME**: #14 삭제와 #4 흡수가 동일 파일 — 중복 아님 (삭제+흡수는 한 동작).
3. **No-op**: #18은 유지(변경 없음) → 제거.

→ #18 제거. 최종 17행.

## 라우팅

승인 후 → `/project` (testing/todo-test-modernize) — BOARD.md 생성 + 태스크 등록
