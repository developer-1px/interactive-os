# BOARD — builder-v2

> 목표: 보편 Block Tree 모델을 확립하고, Builder Primitives로 감싸면 어떤 디자인이든 inline-edit 가능하게 한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- (다음 태스크 선정 대기)

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

- [x] T11: 사이드바 트리 뷰 — Block Tree의 시각적 투영
  - indent(16px/depth) + collapse/expand chevron + leaf dot
  - flattenBlocks() 재귀 순회, 캔버스 포커스 동기화 유지
- [x] T10: Builder.Tabs 구조 프리미티브 + NCPPricingBlock
  - ARIA tablist 패턴, Zone+Item 키보드 내비게이션
  - Monthly/Annual 탭 × 3 프라이싱 카드 데모
  - 활성 탭 = 로컬 React 상태, 블록 데이터에 미저장
- [x] T9: Block Tree 데이터 모델 — SectionEntry → Block
  - Block 인터페이스 (id, type:string, label, fields, children?)
  - sections → blocks 9개 파일 마이그레이션, tsc clean
  - BLOCK_COMPONENTS 레지스트리 (string key, open set)
- [x] T8: Collection Zone Facade — `createCollectionZone` (probe-first → /doubt → 재설계)
  - 285줄 facade로 Builder(-78줄) + Todo(-94줄) 양쪽 마이그레이션 완료
- [x] T3: Undo/Redo 기초 구현
- [x] T2: PropertiesPanel 라이브 바인딩 강화
- [x] T1: Sidebar 키보드 바인딩 연결
- [x] T6: 계층 키보드 내비게이션 (Section/Group/Item)
