# 통합 PointerListener: Gesture Recognizer 패턴

> 출처: 2026-02-26 DnD 버그 디버깅 중 발견
> 관련: `docs/0-inbox/2026-0226-0800-diagnose-dnd-onreorder.md`

## 문제

MouseListener(`mousedown`/`click`)와 DragListener(`pointer*`)가 **같은 물리 제스처**를 다른 이벤트 API로 처리 → `e.preventDefault()` 충돌 발생.

## 제안

Mouse + Drag → **단일 PointerListener** 통합 (Gesture Recognizer 패턴)

```
PointerListener (단일)
  ├── pointerdown → 제스처 시작 기록
  ├── pointermove → threshold 초과? → DRAG 모드 전환
  └── pointerup
       ├── DRAG 모드 → OS_DRAG_END
       └── CLICK 모드 → OS_FOCUS + OS_SELECT
```

## 분리 유지할 것

- FocusListener (`focusin`) — DOM 포커스 동기화, 포인터와 별개
- KeyboardListener — 다른 물리 입력
- ClipboardListener — 다른 물리 입력

## 원칙

> "같은 손가락, 같은 Listener."

## Cynefin

Complicated — 방향은 명확하지만 기존 MouseListener의 모든 edge case를 PointerListener로 이식해야 함.
