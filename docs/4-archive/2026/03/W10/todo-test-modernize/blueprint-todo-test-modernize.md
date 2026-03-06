# Blueprint: Todo Test Modernize

> Todo headless 테스트를 keyboard-and-mouse.md 스펙 기준으로 전면 재편한다.
> 레거시(dispatch 직접) 삭제 + 공백 섹션 신규 작성 + 기존 유효 테스트 통합.

## 1. Goal

**UDE (Undesirable Effects)**:
- keyboard-and-mouse.md에 57개 시나리오가 정의되어 있으나, keyboard/mouse 경로로 검증되는 것은 ~25개 (44%)
- `page.dispatch()` 기반 레거시 테스트가 6개 파일 잔존 — F/O된 패턴으로 "있지만 무효"
- §2 Edit, §4 Search, §6 Dialog, §7 Zone전환, §8 모드전환은 headless 테스트 완전 공백
- repro 파일 2개(console.log)가 정리 안 된 채 남아있음

**Done Criteria**:
1. keyboard-and-mouse.md의 모든 시나리오가 headless 테스트로 1:1 대응 (OS gap 의존 제외)
2. `page.dispatch()` 직접 호출 테스트 파일 0개 (setup helper의 dispatch는 허용)
3. repro/레거시 파일 삭제 완료
4. 테스트 파일 구조 = 스펙 섹션 1:1 매핑
5. 전체 테스트 GREEN

## 2. Why

- **rules.md 원칙 위반**: "OS 테스트 = Zone(처음) -> Input -> ARIA(끝)". dispatch 직접 테스트는 이 계약을 우회
- **page = Playwright subset 원칙**: dispatch/state/registry/zone은 page 표면 노출 금지 (MEMORY 확인)
- **스펙-테스트 괴리**: 스펙 문서가 존재하지만 절반이 미검증 = 스펙의 신뢰성 0
- **개밥먹기 품질**: Todo는 OS의 첫 번째 dogfooding 앱. 여기 테스트가 부실하면 OS 보장도 의심

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| §6 Dialog는 OS gap(STACK/OVERLAY) 때문에 headless 불가 | 부분 유효 — `page.query("dialog")`는 이미 동작 (todo-bdd L201). overlay open/close는 dispatch 필요 | Dialog open은 keyboard(Backspace)로 트리거 가능. Dialog 내부 Tab trap은 OS gap |
| §7 Zone전환(Tab)은 headless 미지원 | 확인 필요 — tab-repro.test.ts가 존재하지만 assertion 없음 | `page.keyboard.press("Tab")` + `page.activeZoneId()` 조합으로 관찰 가능할 수 있음 |
| Setup용 dispatch(addTodos helper)도 제거해야 한다 | 무효 — setup은 "검증 대상"이 아니라 "전제 조건". user-journey.test.ts가 full pipeline을 증명 | `addTodos()` helper의 dispatch 사용은 유지 |
| crud-and-interactions.md 스펙도 최신화해야 한다 | 무효 — F/O된 스펙. keyboard-and-mouse.md가 canonical | crud-and-interactions.md는 F/O 마킹만 |
| 모든 57개 시나리오를 한 번에 작성해야 한다 | 무효 — OS gap 의존 항목은 물리적 불가 | gap 의존은 TODO 마커, 나머지 먼저 완성 |

## 4. Ideal

**완료 후 상태**:

```
tests/integration/todo/
  todo-helpers.ts          — setup helpers (addTodos, gotoList, gotoSidebar, gotoDraft, gotoSearch)
  todo-list.test.ts        — §1.1~§1.5 (nav, selection, actions, clipboard, mouse)
  todo-edit.test.ts        — §2 Edit Zone (enter-save, escape-cancel, arrow-block, backspace-safe)
  todo-draft.test.ts       — §3 Draft Zone (enter-add, empty-reject, escape-blur)
  todo-search.test.ts      — §4 Search Zone (type-filter, escape-clear, zero-results)
  todo-sidebar.test.ts     — §5 Sidebar Zone (nav, enter-select, reorder, mouse-click)
  todo-dialog.test.ts      — §6 Dialog (backspace-open, escape-close, enter-confirm) [partial: gap 의존 TODO]
  todo-zone-transition.test.ts — §7 Zone전환 [partial: gap 의존 TODO]
  todo-mode.test.ts        — §8 모드전환 (navigating<->editing)
  todo-aria.test.ts        — ARIA 속성 검증
  todo-user-journey.test.ts — §J1~§J5 Full pipeline (기존 유지)

src/apps/todo/
  testbot-todo.ts          — 기존 유지
  __tests__/unit/
    todo-interaction.test.ts — runScenarios wrapper (기존 유지)
```

**삭제 대상** (6개):
- `src/apps/todo/__tests__/unit/todo.test.ts` — dispatch 직접
- `tests/integration/todo/paste-integration.test.ts` — createIntegrationTest
- `tests/integration/todo/field-undo-focus.test.ts` — os 직접 조작
- `tests/integration/todo/field-headless-input.test.ts` — todo-draft.test.ts에 흡수
- `tests/integration/todo/bulk-undo-repro.test.ts` — repro
- `tests/integration/todo/tab-repro.test.ts` — repro

**F/O 마킹**:
- `docs/6-products/todo/spec/crud-and-interactions.md` 상단에 F/O deprecated 표시

## 5. Inputs

### 파일
- `docs/6-products/todo/spec/keyboard-and-mouse.md` — canonical 스펙 (57개 시나리오)
- `src/apps/todo/app.ts` — 앱 정의 (6 zones: list, sidebar, draft, edit, search, toolbar)
- `src/apps/todo/selectors.ts` — selectVisibleTodos (search 필터 포함)
- `tests/integration/todo/todo-helpers.ts` — 공유 helpers
- `tests/integration/todo/todo-bdd.test.ts` — §1 기존 유효 테스트 (리네임 대상)

### Page API (사용 가능한 것)
- `page.keyboard.press(key)` — 키보드 입력
- `page.keyboard.type(text)` — 필드 텍스트 입력 (FieldRegistry에 값 설정)
- `page.click(itemId, opts?)` — 마우스 클릭 ({shift, meta} 옵션)
- `page.goto(zoneId, opts?)` — zone 활성화
- `page.focusedItemId()` — 현재 포커스
- `page.activeZoneId()` — 현재 활성 zone
- `page.selection()` — 선택된 아이템 목록
- `page.attrs(itemId)` — ARIA 속성 조회
- `page.state` — 앱 상태 읽기 (검증용)
- `page.query(search)` — HTML 프로젝션 내 문자열 검색
- `page.dispatch(cmd)` — setup helper용만 허용

### Knowledge
- `page.dispatch()` = F/O. keyboard/mouse 경로만 유효
- Setup dispatch (addTodos) 는 허용 — 전제 조건 조성, 검증 대상 아님
- `page.keyboard.type()` → active zone의 fieldId로 FieldRegistry.updateValue 자동 호출

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | §1 테스트 파일명이 스펙 매핑 | todo-bdd.test.ts (내용은 유효) | 리네임 todo-list.test.ts + §1.3 Cmd+Z/Shift+Z/F2 추가 + §1.4 배치 클립보드 추가 | High | — |
| G2 | §2 Edit Zone 테스트 | 0개 | 신규 4 시나리오 작성 | High | — |
| G3 | §3 Draft 완전 커버 | 2/3 (Escape 누락) | Escape 시나리오 1개 추가 + field-headless-input 흡수 | Med | — |
| G4 | §4 Search Zone 테스트 | 0개 | 신규 3 시나리오 작성 | High | — |
| G5 | §5 Sidebar 완전 커버 | 4/6 (Enter 선택, 마우스 클릭 누락) | 2 시나리오 추가 | Med | — |
| G6 | §6 Dialog 테스트 | 0개 (Backspace→open은 §1.3에 있음) | 신규. Escape-close, Enter-confirm 가능. Tab trap은 OS gap | High | OS gap(Tab trap) |
| G7 | §7 Zone전환 테스트 | 0개 (repro만) | Tab→activeZoneId 변경 관찰. 가능 여부 probe 필요 | Med | OS headless Tab 지원 |
| G8 | §8 모드전환 테스트 | 0개 | 신규 3 시나리오. Enter→editing, editing중 Arrow 차단, Escape→navigating | High | G2 (Edit Zone) |
| G9 | ARIA 속성 테스트 분리 | todo-bdd 내 §ARIA 섹션 | 별도 파일로 분리 + Dialog/Sidebar ARIA 추가 | Med | G6 |
| G10 | 레거시 6개 파일 삭제 | 파일 존재 | 삭제 + 커버리지 중복 확인 | High | G1~G9 완료 후 |
| G11 | helpers 확장 | gotoList, gotoSidebar만 | gotoDraft, gotoEdit, gotoSearch 추가 | Low | — |
| G12 | crud-and-interactions.md F/O 마킹 | 현재 active로 보임 | 상단 deprecated 표시 | Low | — |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | helpers 확장 | Clear | — | `gotoDraft()`, `gotoEdit()`, `gotoSearch()` 추가 |
| T2 | §1 todo-list.test.ts | Clear | — | todo-bdd.test.ts 리네임 + Cmd+Z, Cmd+Shift+Z, 배치 Cmd+C, 배치 Cmd+V 시나리오 추가 |
| T3 | §2 todo-edit.test.ts | Clear | T1 | 신규. Enter-save, Escape-cancel, Arrow-block, Backspace-safe 4개 |
| T4 | §3 todo-draft.test.ts | Clear | T1 | Escape 시나리오 추가 + field-headless-input 내용 흡수 |
| T5 | §4 todo-search.test.ts | Clear | T1 | 신규. type-filter, Escape-clear, zero-results 3개 |
| T6 | §5 todo-sidebar.test.ts | Clear | — | Enter 선택 + 마우스 클릭 2개 추가 |
| T7 | §8 todo-mode.test.ts | Clear | T3 | 신규. navigating→editing→navigating 모드전환 3개 |
| T8 | §ARIA todo-aria.test.ts | Clear | T2 | todo-bdd에서 ARIA 섹션 분리 + Sidebar ARIA 추가 |
| T9 | §6 todo-dialog.test.ts | Complicated | T2 | 신규. keyboard(Backspace)→open, Escape→close, Enter→confirm. Tab trap은 TODO |
| T10 | §7 todo-zone-transition.test.ts | Complex | — | Probe: `press("Tab")` + `activeZoneId()` 조합 가능 여부 확인. 불가 시 TODO |
| T11 | 레거시 삭제 | Clear | T2~T9 | 6개 파일 삭제. 삭제 전 시나리오 중복 확인 |
| T12 | crud-and-interactions.md F/O | Clear | — | 상단 deprecated 마킹 |
| T13 | GREEN 검증 | Clear | T1~T12 | 전체 테스트 실행, 0 fail 확인 |

### 실행 순서 다이어그램

```
T1 (helpers) ──┬── T3 (edit) ──┬── T7 (mode)
               ├── T4 (draft)  ├── T8 (aria)
               ├── T5 (search) ├── T9 (dialog)
               │               │
T2 (list) ─────┘               │
T6 (sidebar) ──────────────────┘
T10 (zone-transition, probe) ──────┐
T12 (F/O marking) ─────────────────┤
                                    ├── T11 (delete) ── T13 (GREEN)
```

### 예상 산출물 수량
- 신규 테스트 파일: 5개 (edit, search, dialog, zone-transition, mode)
- 수정 테스트 파일: 4개 (list, draft, sidebar, aria)
- 삭제 테스트 파일: 6개
- 신규 시나리오: ~20개
- 보완 시나리오: ~7개
- 최종 유효 시나리오: ~52개 (OS gap TODO ~5개 제외)
