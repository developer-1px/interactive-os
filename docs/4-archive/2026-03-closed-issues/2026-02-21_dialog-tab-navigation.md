# Dialog Buttons Not Focusable via Tab [Closed]

**Resolution**: Trigger.Dismiss를 FocusItem으로 감싸서 dialog 버튼이 OS 관리 대상이 됨. Tab trap 순회 + autoFocus 정상 작동.

**Date**: 2026-02-21
**Priority**: P1
**Status**: Open

## 재현 단계
1. Todo 목록에서 Backspace → Delete dialog 표시
2. Tab 키 누르기

## 기대 결과
- Tab으로 Cancel ↔ Delete 버튼 순회
- 첫 번째 버튼에 autoFocus

## 실제 결과
- Tab이 OS에 의해 캡처됨 (tab.behavior="trap")
- 하지만 dialog 내부 버튼이 FocusItem이 아니므로 Tab trap이 순회할 대상 없음
- 결과: 버튼에 focus 불가

## 근본 원인 (분석)
- Trigger.Dismiss / Trigger.Confirm은 `<button>` 렌더
- FocusItem으로 감싸지 않음 → `[data-focus-item]` 없음
- Zone(alertdialog)의 Tab trap이 item 없이 no-op
