# Design Decisions — 아키텍처

> Source: builder-mvp report.md, builder-os-panel-binding, builder-v2 PRD
> Verified: Production code

## 1. defineApp 패턴은 CMS 도메인에서 자연스럽다

| 검증 질문 | 결과 |
|-----------|------|
| createZone + bind가 grid 도메인에서 통하는가? | ✅ role만 바꾸면 끝 |
| flat handler가 key-value 업데이트에 적합? | ✅ Todo와 동일한 자연스러움 |
| 패널↔캔버스 같은 커맨드 공유가 자연스러운가? | ✅ 매우 자연스러움 |
| OS.Field의 onCommit이 CMS에 충분한가? | ⚠️ 작동하지만 command 기반이면 더 깔끔 |

## 2. 구조적 차이: Todo vs Visual CMS

| 축 | Todo | Visual CMS |
|----|------|-----------|
| 상태 구조 | 엔티티 맵 `todos: Record<id, Todo>` | Block Tree `blocks: Block[]` |
| Zone 수 | 5 | 2 (sidebar, canvas) |
| Navigation | 1D (↑↓) | 2D spatial + hierarchical |
| 편집 패턴 | editingId 토글 | onCommit 콜백 (Field 항상 존재) |
| 패널 | 없음 | PropertiesPanel (양방향 동기화) |

## 3. Collection Zone Facade

- `createCollectionZone` 285줄 facade로 Builder + Todo 양쪽 마이그레이션
- CRUD + ordering = facade 책임
- 필터, clipboard 타입 매칭, 포커스 복원 = 앱 책임

## 4. Hierarchical Navigation (계층 탐색)

- `\` (backslash) → drill-up (Item → Group → Section)
- Enter (onAction) → drill-down (Section → Group → Item)
- 각 레벨의 item은 `data-level` 속성으로 필터링
- `createCanvasItemFilter`로 현재 레벨에 맞는 아이템만 네비게이션 대상
