# RFC: DnD PoC — Kernel-Driven Drag Reorder

## Summary

Zone 합성점 아키텍처에 두 번째 headless capability(DnD)를 추가하여,
TodoList에서 포인터 드래그로 아이템 순서를 변경할 수 있게 한다.

## Motivation

Zone/FocusGroup 분리가 완료되었고, Zone은 합성점으로서 headless capability를
끼워넣을 수 있는 구조를 가진다. 이 구조가 실제로 동작하는지 **DnD reorder PoC**로 증명한다.

- FocusGroup headless 패턴이 이미 증명됨 — DnD도 같은 패턴
- TodoList에 이미 `onMoveUp`/`onMoveDown` 키보드 reorder 존재 — DnD는 같은 연산의 다른 입력 채널
- 커널 커맨드로 구현 → headless 테스트 가능 + Inspector 관찰 가능

## Guide-Level Explanation

```
사용자가 TodoList 아이템을 마우스로 드래그하면:
1. DragListener가 pointerdown/move/up 감지
2. OS_DRAG_START → 커널 상태에 드래그 시작 기록
3. OS_DRAG_OVER  → 현재 호버 위치 업데이트
4. OS_DRAG_END   → 드래그 종료 + onReorder 콜백 호출
5. onReorder     → Todo 앱이 todoOrder 배열 재정렬
6. Visual: 드래그 중인 아이템 반투명, 드롭 위치에 인디케이터 표시
```

## Reference-Level Explanation

### 커널 커맨드

| Command | Payload | Effect |
|---------|---------|--------|
| `OS_DRAG_START` | `{ zoneId, itemId }` | dragState 생성 |
| `OS_DRAG_OVER` | `{ zoneId, overItemId, position }` | hover target 업데이트 |
| `OS_DRAG_END` | `{ zoneId }` | dragState 클리어 + onReorder dispatch |

### 상태

```typescript
interface DragState {
  isDragging: boolean;
  zoneId: string;
  dragItemId: string;
  overItemId: string | null;
  overPosition: "before" | "after" | null;
}
```

### Zone 통합

Zone의 `onReorder` 콜백으로 앱에 reorder 의도 전달:
```typescript
<Zone onReorder={({ itemId, overItemId, position }) => {
  // 앱이 자체 순서 배열 업데이트
  dispatch(reorderTodo({ itemId, overItemId, position }));
}} />
```

## Unresolved Questions

- DragState를 ZoneState 안에 넣을 것인가, 별도 OS 슬라이스로 만들 것인가
- 드래그 시작 threshold (5px 이상 이동 시 시작)
- 터치 지원은 PoC 범위 밖
