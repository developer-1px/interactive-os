# content-edit-mode

## Context

Claim: 빌더 캔버스에 2-state FSM(SELECT/EDIT)을 도입. 모드는 `editingItemId` 유무로 파생. Commit은 blur 단일 경로. EDIT 모드에서 Field 있는 아이템 클릭 = 즉시 편집 + I-beam 배치, Field 없는 아이템 클릭 = SELECT로 강등.

Before → After:
- **Before**: 편집 진입은 Enter/더블클릭만. 편집 중 다른 텍스트 클릭 → 편집 종료.
- **After**: 재클릭/타이핑/Enter → 편집 진입. EDIT 모드에서 다른 텍스트 클릭 → 즉시 편집 전환 (I-beam 위치 정확). Field 없는 아이템 클릭 → SELECT 모드 자동 복귀. Escape = commit + SELECT.

Commit Policy: blur = 유일한 commit 경로. Cancel 없음 (Cmd+Z가 대체). Escape = commit + mode exit.

Architecture (FSM v3):
- **mousedown**: 모든 모드 전이 결정. EDIT→EDIT은 OS_FIELD_START_EDIT이 원자 전환 (A→B, null 경유 없음).
- **click**: SELECT→EDIT 재클릭 전용. EDIT 모드에서는 미사용.
- **Field auto-commit**: EDIT→SELECT 경유에서만 작동 (editingItemId === fieldId 가드).
- **caret**: state 기반 파이프라인 (caretRangeFromPoint → offset → FieldRegistry → useFieldFocus).

Risks:
- blur-commit은 예기치 않은 focus 이동 시 의도치 않은 commit 가능 → Cmd+Z로 보완
- Enter=줄바꿈 vs commit UX → 그룹 인터뷰로 결정 예정

## Now

(empty — all tasks done)

## Done

- [x] T1: `activateOnClick` 활성화 — tsc 0 ✅
- [x] T2: Escape(selected → none) — `dismiss: { escape: "deselect" }` — tsc 0 ✅
- [x] T3: 타이핑 진입 — `createTypingEntryKeybindings()` — tsc 0 ✅
- [x] T4: 툴바 모드 indicator — `ModeIndicator` 컴포넌트 — tsc 0 ✅
- [x] T0.5: reClickOnly 버그 — `ActivateConfig.reClickOnly` + MouseListener/headless — tsc 0 ✅
- [x] T7: Escape = commit — `resolveFieldKey` 전 fieldType에서 Escape → OS_FIELD_COMMIT — tsc 0 ✅
- [x] T5: Mode-aware click (v3) — mousedown 원자 전환 + Field auto-commit 가드 — tsc 0 ✅
- [x] T6: I-beam caret (v2) — seedCaretFromPoint state 기반 파이프라인 — tsc 0 ✅
- [x] T8: plaintext-only — `contentEditable="plaintext-only"` — tsc 0 ✅
- [x] T9: Enter = 줄바꿈 — block/editor fieldType default, inline만 commit — tsc 0 ✅
- [x] T10: drill-down fallback — section→item (group 없을 때) — tsc 0 ✅

## Unresolved

- 타이핑 진입 시 키 forwarding (typed char를 field에 전달) 미구현
- cursor style (SELECT=default, EDIT=text) CSS 미동작 확인 필요
- Enter=줄바꿈 vs commit UX 리서치 (그룹 인터뷰)

## Ideas

- `V` 키 = Select 모드 강제 전환 (Figma 스타일 단축키)
- commit-on-blur 시 빈 텍스트면 블록 삭제 자동 제안
