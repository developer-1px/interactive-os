# Builder 개밥먹기 이력

> 이전 프로젝트들의 성과와 미완 부분을 정리한다.

## 1차: builder-os-panel-binding (2026-02-13, 아카이브)

- **목표**: defineApp/createWidget을 빌더에 적용하여 패널 바인딩 검증
- **성과**: PRD/KPI/Proposal 작성, app.ts + unit test 27개 완료
- **미완**: NCP 블록 마이그레이션, PropertiesPanel 실제 바인딩
- **위치**: `docs/4-archive/2026-02-builder-os-panel-binding/`

## 2차: builder-focus-navigation (2026-02-13, 아카이브)

- **목표**: Arrow 키 포커스 네비게이션 복원
- **성과**: spatial navigation E2E 11개 통과
- **위치**: `docs/4-archive/2026-02-builder-focus-navigation/`

## 3차: builder-mvp (이번, 2026-02-16)

- **목표**: 1차+2차 위에서 createZone+bind 패턴 본격 적용 + 인라인 편집 + 패널 동기화
- **차별점**: Todo v5와 동일한 패턴(createZone+bind)으로 통일. 개밥먹기 보고서 산출.

## Todo 패턴과의 대비

| 축 | Todo | Builder |
|----|------|---------|
| 상태 구조 | 엔티티 맵 `todos: Record<id, Todo>` | flat 맵 `fields: Record<name, string>` |
| Zone 수 | 5 (list, sidebar, draft, edit, toolbar) | 1 (canvas) + 패널(OS 밖) |
| Zone role | listbox, textbox, toolbar | grid |
| Navigation | 1D (↑↓) | 2D spatial (↑↓←→) |
| 편집 | editingId 토글 → Field mount | onCommit 콜백 기반 |
| 패널 | 없음 | PropertiesPanel (선택 요소 데이터 소비) |
