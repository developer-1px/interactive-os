# BOARD — builder-v2

> 목표: builder-mvp 완료 후 남은 Ideas를 단계적으로 구현한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- [ ] T1: Sidebar 키보드 바인딩 연결 — Delete/Duplicate/Move/Copy/Paste 커맨드에 키보드 단축키 바인딩
  - [x] 1-0: sidebarZone 생성 + SectionSidebar PPT 썸네일 UI + BuilderPage 통합
  - [ ] 1-1: sidebar Zone에 keybinding 선언 (Delete, Cmd+D, Cmd+↑↓, Cmd+C, Cmd+V)
  - [ ] 1-2: 선택된 섹션 ID를 커맨드에 자동 주입 (selectedId → ids)
  - [ ] 1-3: Unit test — 키 이벤트 시뮬레이션으로 각 커맨드 동작 확인

- [x] T6: 계층 키보드 내비게이션 (Section/Group/Item)
  - Discussion: [builder-focus-policy](discussions/2026-0219-1954-builder-focus-policy.md)
  - [x] 6-1: OS — Zone config에 `itemFilter?: (items: string[]) => string[]` 추가
  - [x] 6-2: OS — `DOM_ITEMS` / `DOM_RECTS` context provider에 filter 적용
  - [x] 6-3: Builder — `Builder.Section`/`Builder.Group`에서 `data-nav-skip` 제거
  - [x] 6-4: Builder — `DRILL_DOWN` / `DRILL_UP` command 구현
  - [x] 6-5: Builder — `setupHierarchicalNavigation()` 조합 함수 + keybinding (Enter/\)
  - [x] 6-6: Unit test — 레벨별 순회, drill-down/up, 레벨 파생 검증

- [ ] T2: PropertiesPanel 라이브 바인딩 강화
  - [ ] 2-1: ImageProperties에 실제 URL 입력 → 이미지 교체 연동
  - [ ] 2-2: IconProperties에 아이콘 검색/선택 연동
  - [ ] 2-3: SectionProperties에 섹션 이름 편집 → state 반영

## 🟡 Next

- [ ] T3: Undo/Redo 기초 구현
  - state history stack 도입
  - Cmd+Z / Cmd+Shift+Z 바인딩

- [ ] T4: 블록 타입별 패널 폼 E2E
  - image, link, button 패널의 실제 동작 E2E 검증

- [ ] T5: 블록 드래그 정렬 UI
  - 사이드바 썸네일 드래그로 섹션 순서 변경

## 📋 Backlog

- defineApp API v6 설계 (개밥먹기 보고서 기반)
- 블록 타입별 Zone 분리 (tab으로 블록 간 이동)
- [ ] T7: Builder 프리미티브 headless 리팩토링 — Builder.Section/Group/Item을 Zone 기반 OS 패턴으로 전환. 별도 BuilderRegistry 제거, OS의 기존 레지스트리 체계를 확장

## ⏳ Done

- [x] T6: 계층 키보드 내비게이션 (Section/Group/Item)
