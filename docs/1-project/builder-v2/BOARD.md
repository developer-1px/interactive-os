# BOARD — builder-v2

> 목표: builder-mvp 완료 후 남은 Ideas를 단계적으로 구현한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- [ ] T8: Collection Zone Facade — `createCollectionZone`
  - Zod schema + normalize/denormalize 어댑터 기반 CRUD 자동 생성
  - Builder sidebar + Todo list를 리팩터링하며 probe-first 발견
  - Discussion: [2026-0219-2330-collection-zone-facade](discussions/2026-0219-2330-collection-zone-facade.md)
  - [x] Step 1: /ready — 환경 보장 (App ✅, tsc 앱코드 0 errors)
  - [x] Step 2: /discussion — 아키텍처 논의 완료
  - [x] Step 5: /tdd — 18 tests (Array 8 + Entity 8 + roundtrip 2), 🟢 all pass
  - [x] Step 6: /solve — createCollectionZone + fromArray + fromEntities 구현
  - [ ] Step 7: /review ← 현재 지점

## 🟡 Next

- [ ] T4: 블록 타입별 패널 폼 E2E
  - image, link, button 패널의 실제 동작 E2E 검증

- [ ] T5: 블록 드래그 정렬 UI
  - 사이드바 썸네일 드래그로 섹션 순서 변경

## 📋 Backlog

- defineApp API v6 설계 (개밥먹기 보고서 기반)
- 블록 타입별 Zone 분리 (tab으로 블록 간 이동)
- [ ] T7: Builder 프리미티브 headless 리팩토링 — Builder.Section/Group/Item을 Zone 기반 OS 패턴으로 전환. 별도 BuilderRegistry 제거, OS의 기존 레지스트리 체계를 확장

## ⏳ Done

- [x] T3: Undo/Redo 기초 구현
  - [x] BuilderState.history (past/future stacks)
  - [x] undoCommand / redoCommand + canUndo/canRedo conditions
  - [x] Cmd+Z / Cmd+Shift+Z — sidebar + canvas zones
  - [x] Unit test — 7건 headless 검증
- [x] T2: PropertiesPanel 라이브 바인딩 강화
  - [x] 2-1: ImageProperties — URL/alt 입력 → state → canvas preview
  - [x] 2-2: IconProperties — 아이콘 선택/검색 → state
  - [x] 2-3: SectionProperties — 섹션 이름 편집 → renameSectionLabel command
- [x] T1: Sidebar 키보드 바인딩 연결
  - [x] 1-0: sidebarZone 생성 + SectionSidebar PPT 썸네일 UI + BuilderPage 통합
  - [x] 1-1: sidebar Zone에 keybinding 선언 (Delete, Cmd+D, Cmd+↑↓)
  - [x] 1-2: 섹션 관리 커맨드 (deleteSection, duplicateSection, moveSectionUp/Down)
  - [x] 1-3: Unit test — 10건 headless 커맨드 검증
- [x] T6: 계층 키보드 내비게이션 (Section/Group/Item)

