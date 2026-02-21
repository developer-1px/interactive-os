# Dialog Focus Trap Not Active After Delete [Closed]

**Resolution**: headless `simulateKeyPress`에 overlay focus trap guard 추가. overlay stack이 비어있지 않으면 ESC 외 모든 키 차단 — 브라우저의 `<dialog>.showModal()` 네이티브 focus trap과 동등.

**Date**: 2026-02-21
**Priority**: P1
**Status**: Open

## 환경
- Todo App, ListView
- Backspace/Delete on focused item → DeleteDialog appears

## 재현 단계
1. Todo 목록에서 항목 하나를 포커스
2. Backspace 누르기 → Delete 확인 dialog 표시
3. ArrowDown/ArrowUp 누르기

## 기대 결과
- Dialog가 열리면 focus trap 활성화
- ArrowDown/Up는 dialog 내부 버튼(Cancel/Delete) 사이에서만 이동

## 실제 결과
- Dialog 뒤의 목록에서 ArrowDown/Up 네비게이션이 계속 동작
- Focus가 dialog에 갇히지 않음

## 관련 코드
- `src/apps/todo/widgets/ListView.tsx` — DeleteDialog
- `src/os/6-components/primitives/Trigger.tsx` — Trigger.Portal
- `src/os/6-components/base/FocusGroup.tsx` — autoFocus, STACK_PUSH
