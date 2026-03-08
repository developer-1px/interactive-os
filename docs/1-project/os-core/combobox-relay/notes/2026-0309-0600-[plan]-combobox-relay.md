# /plan — Combobox Keyboard Relay

> 작성일: 2026-03-09
> 출발점: /discussion → /blueprint → /divide → /plan
> Goal: QuickPick.tsx에서 os.dispatch/os.getState/document.querySelector = 0

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `resolveKeyboard.ts:88` | `if (input.isCombobox) return EMPTY` — 전체 차단 | combobox nav key filter: ArrowUp/Down/Enter/Escape/Home/End만 layer chain 통과, 나머지 EMPTY | Clear | — | 기존 키보드 테스트 유지 | 문자 키 오탈 시 타이핑 불가 |
| 2 | `roleRegistry.ts:332` combobox preset | inputmap 없음 | `inputmap: { Enter: [OS_ACTIVATE()], click: [OS_ACTIVATE()] }` 추가 | Clear | — | tsc 0 | 없음 (미사용 preset 보강) |
| 3 | `QuickPick.tsx` Zone options | `QUICKPICK_ZONE_OPTIONS` — inputmap/onAction 없음 | `inputmap: { Enter: [OS_ACTIVATE()], click: [OS_ACTIVATE()] }` 추가 + Zone에 `onAction` prop | Clear | #1 | — | — |
| 4 | `QuickPick.tsx:194-200` overlay sync | `useEffect` + `os.dispatch(OS_OVERLAY_OPEN/CLOSE)` isOpen sync | 삭제. `useOverlay(id)`가 visibility SSOT | Clear | — | — | isOpen prop 제거 시 소비자 영향 |
| 5 | `QuickPick.tsx:214-233` auto-focus | `useEffect` + `setTimeout` + `querySelector` + `os.dispatch(OS_FOCUS)` | 삭제. `OS_OVERLAY_OPEN`의 autoFocus가 virtualFocus에서 정상 동작 | Clear | #4 | — | 타이밍 이슈 가능 |
| 6 | `QuickPick.tsx:271-274` handleClose | `os.dispatch(OS_OVERLAY_CLOSE({id}))` + `onClose?.()` | `closeOverlay(id)` helper 사용 | Clear | — | — | — |
| 7 | `QuickPick.tsx:277-289` handleAction | `os.getState()` → focusedItemId → find(item) → onSelect(item) | Zone `onAction(cursor)` → cursor.focusId → onSelect(item) | Clear | #3 | — | — |
| 8 | `QuickPick.tsx:295-333` keyActions/handleKeyDown | Arrow/Enter/Escape 수동 dispatch + Tab typeahead | Tab/ArrowRight만 남김 (typeahead). 나머지 OS가 relay | Clear | #1 | — | Tab이 OS_TAB과 충돌 가능 |
| 9 | `QuickPick.tsx:421,486,501` onClick | DefaultQuickPickRow onClick prop → handleClose + onSelect | 삭제. Zone inputmap click + onAction이 대체 | Clear | #3 | — | virtualFocus + preventDefault에서 click 경로 검증 필요 |
| 10 | `QuickPick.tsx` props | isOpen, onClose props | isOpen 제거, onClose 선택 유지 | Clear | #4 | tsc 0 | 소비자(CommandPalette) 수정 필요 |
| 11 | `CommandPalette.tsx` | isOpen 전달 + handleClose | isOpen 전달 제거 | Clear | #10 | tsc 0 | — |
| 12 | headless test (신규) | 없음 | `tests/headless/command-palette.test.ts` | Clear | #1-11 | +N tests GREEN | — |

## 범위 밖

- `register.ts` Shift+Shift addEventListener → backlog (OS keybinding multi-tap 미지원)
- `QuickPick.tsx` useState(query) + onChange → 정당한 앱 책임
- `handleContainerMouseDown` e.preventDefault() → DOM focus 관리, OS 위반 아님

## MECE

1. CE: #1~#12 실행 → os.dispatch/getState/querySelector 0건 ✅
2. ME: 중복 없음 ✅
3. No-op: 없음 ✅

## 라우팅

승인 후 → `/project` (새 프로젝트 "combobox-relay") — OS-core(#1-2) + 앱 마이그레이션(#3-11) + 테스트(#12)
