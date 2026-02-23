# BOARD — dnd-poc

> Phase: Light | Created: 2026-02-23

## Done

- [x] D0: Discussion — 커널 커맨드 방식 확정, Zone 합성점 검증 목적
- [x] T1: 커널 — DragState + OS_DRAG_START/OVER/END 커맨드 ✅
- [x] T2: 리스너 — DragListener (Pointer Events → 커맨드 dispatch) ✅
- [x] T3: Zone 통합 — onReorder 콜백 (Zone → FocusGroup → ZoneRegistry) ✅
- [x] T4: Todo 앱 — reorderTodo 커맨드 + 비주얼 피드백 ✅

## Ideas

- Builder 블록 DnD reorder
- 크로스 Zone 드래그 (Sidebar → List)
- 터치 지원
- 드래그 프리뷰 (ghost element)
- Headless DnD 테스트 (os.dispatch로 reorder 검증)
