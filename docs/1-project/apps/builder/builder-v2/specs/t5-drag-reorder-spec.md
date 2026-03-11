# Spec — builder-v2 T5: 블록 드래그 정렬 UI

> 한 줄 요약: 사이드바에서 블록을 드래그 앤 드롭하여 페이지 내 섹션 순서를 변경한다.

## 1. 기능 요구사항

### 1.1 사이드바 드래그 정렬 (US-004)

**Story**: 콘텐츠 편집자로서, 왼쪽 사이드바에서 섹션을 드래그하여 페이지 내 순서를 변경하고 싶다.

**Use Case — 주 흐름:**
1. 사용자가 사이드바의 섹션 아이템을 드래그 시작한다
2. 다른 섹션 위로 드래그하면 드롭 위치 표시
3. 드롭하면 섹션 순서가 변경되고 캔버스에 반영

**Scenarios (DT 참조 → BDD 번역):**

> DT 원본: `docs/6-products/builder/stories.md` US-004

Scenario 1: 드래그 시작 (DT #1)
  Given 사이드바에 [Hero, Features, Footer] 순서의 블록이 있다
  When Features 아이템을 드래그 시작한다
  Then isDragging=true, dragItemId="features"

Scenario 2: 드롭 — before 위치 (DT #4)
  Given Features를 드래그 중이다
    And Hero 위쪽(before)에 위치해 있다
  When 드롭한다 (onReorder 콜백)
  Then blocks 순서가 [Features, Hero, Footer]로 변경된다

Scenario 3: 드롭 — after 위치 (DT #5)
  Given Hero를 드래그 중이다
    And Footer 아래쪽(after)에 위치해 있다
  When 드롭한다 (onReorder 콜백)
  Then blocks 순서가 [Features, Footer, Hero]로 변경된다

Scenario 4: 드래그 취소 (DT #6)
  Given Features를 드래그 중이다 (isDragging=true)
  When Escape를 누른다
  Then isDragging=false, blocks 순서 변경 없음

## 2. Decision Table 참조

> DT는 Product Workspace에 있다 → `docs/6-products/builder/stories.md` US-004 참조.
> 이 spec은 그 DT의 행 #1, #4, #5, #6을 BDD Scenario로 번역한 것이다.
> DT #2, #3 (시각적 드롭 인디케이터)은 상태 변화가 아닌 시각적 효과 → 헤드리스 테스트 대상이 아님.

## 3. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `blocks[]` | 섹션 배열 (순서 = 페이지 순서) | 페이지 로드 시 INITIAL_STATE | REORDER_BLOCK 커맨드 |
| `isDragging` | 드래그 진행 여부 | OS_DRAG_START | OS_DRAG_END / OS_DRAG_CANCEL |
| `dragItemId` | 드래그 중인 아이템 ID | OS_DRAG_START | OS_DRAG_END / OS_DRAG_CANCEL |

## 4. 범위 밖 (Out of Scope)

- 캔버스에서 직접 드래그 (사이드바만)
- 다른 Zone 간 드래그 (사이드바 내부만)
- 중첩 블록(children) 드래그 (최상위 블록만)
- Undo/Redo (별도 T3에서 완료)
