# BOARD — builder-v2

> 목표: 보편 Block Tree 모델을 확립하고, Builder Primitives로 감싸면 어떤 디자인이든 inline-edit 가능하게 한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- [ ] T9: Block Tree 데이터 모델 — `SectionEntry` → `Block { id, type, fields, children? }`
  - [ ] 9-1: `Block` 인터페이스 정의 (model/appState.ts)
  - [ ] 9-2: 기존 `SectionEntry` → `Block`으로 마이그레이션 (하위호환 유지)
  - [ ] 9-3: block type registry (string → 렌더러 컴포넌트 resolve)
  - [ ] 9-4: children 지원 — 재귀적 `SectionRenderer`
  - [ ] 9-5: 기존 테스트 통과 확인

- [ ] T10: `Builder.Tabs` 구조 프리미티브
  - [ ] 10-1: `Builder.Tabs` / `Builder.TabPanel` 컴포넌트 (ARIA tablist 매핑)
  - [ ] 10-2: 탭 전환 인터랙션 (키보드: ←→ 전환, Enter 진입, Escape 복귀)
  - [ ] 10-3: 탭 라벨 인라인 편집 (Field 활용)
  - [ ] 10-4: 탭 컨테이너 디자인 블록 예제 (Pricing or Services)
  - [ ] 10-5: URL 바인딩 (퍼블리싱 모드)

## 🟡 Next

- [ ] T11: 사이드바 트리 뷰 — Block Tree의 시각적 투영
  - [ ] indent + collapse/expand
  - [ ] ARIA treeitem + aria-expanded
  - [ ] 키보드: ← 접기, → 펼치기

- [ ] T4: 블록 타입별 패널 폼 E2E
- [ ] T5: 블록 드래그 정렬 UI

## 📋 Backlog

- defineApp API v6 설계 (개밥먹기 보고서 기반)
- Accordion / Carousel 컨테이너 프리미티브 (Tabs와 동일 추상 변형)
- [ ] T7: Builder 프리미티브 headless 리팩토링

## 💡 Ideas

- Container 추상 일반화: "N개 자식, 조건부 가시성, 전환 UI" = Tabs | Accordion | Carousel
- Block Tree undo/redo: children 변경 시 history snapshot 전략

## ⏳ Done

- [x] T8: Collection Zone Facade — `createCollectionZone` (probe-first → /doubt → 재설계)
  - 285줄 facade로 Builder(-78줄) + Todo(-94줄) 양쪽 마이그레이션 완료
- [x] T3: Undo/Redo 기초 구현
- [x] T2: PropertiesPanel 라이브 바인딩 강화
- [x] T1: Sidebar 키보드 바인딩 연결
- [x] T6: 계층 키보드 내비게이션 (Section/Group/Item)
