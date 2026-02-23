# caret-restore BOARD

> Created: 2026-02-23
> Last Updated: 2026-02-23

## Now

(all done)

## Done

- [x] T1 — Red 테스트: headless에서 caretPosition 저장/복원 계약 검증 — 5/5 Green ✅
- [x] T2 — FieldRegistry에 `caretPosition: number | null` + `updateCaretPosition()` ✅
- [x] T3 — OS 파이프라인 통합 ✅
  - selectionchange → FieldRegistry (연속, silent)
  - OS_FIELD_COMMIT/CANCEL → ZoneState.caretPositions (Inspector visible)
  - OS_FIELD_START_EDIT → ZoneState → FieldRegistry seed
- [x] T4 — useFieldFocus: wasEditingRef로 editing 전환 감지 + caret restore ✅
  - Root cause: deferred 모드에서 isActive가 클릭 시 이미 true → editing 전환을 감지 못 함
  - Fix: wasActiveRef (focus 전환)과 wasEditingRef (editing 전환) 분리
- [x] T5 — Field.Editable default fieldType: "inline" → "block" ✅
- [x] T6 — tsc 0 errors, 919 tests passed, 브라우저 확인 완료 ✅

## Ideas

- defineQuery OS 프리미티브 (사용처가 2개 이상 나타나면 추상화)
