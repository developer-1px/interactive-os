# BOARD — builder-v2

> 목표: builder-mvp 완료 후 남은 Ideas를 단계적으로 구현한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- [ ] T1: Sidebar 키보드 바인딩 연결 — Delete/Duplicate/Move/Copy/Paste 커맨드에 키보드 단축키 바인딩
  - [ ] 1-1: sidebar Zone에 keybinding 선언 (Delete, Cmd+D, Cmd+↑↓, Cmd+C, Cmd+V)
  - [ ] 1-2: 선택된 섹션 ID를 커맨드에 자동 주입 (selectedId → ids)
  - [ ] 1-3: Unit test — 키 이벤트 시뮬레이션으로 각 커맨드 동작 확인

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

## ⏳ Done

_(시작 전)_
