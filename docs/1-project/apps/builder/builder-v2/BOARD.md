# builder-v2

| Key | Value |
|-----|-------|
| Claim | 보편 Block Tree 모델을 확립하고, Builder Primitives로 감싸면 어떤 디자인이든 inline-edit 가능하게 한다 |
| Before | 섹션 기반 하드코딩 에디터. 커스터마이징 불가 |
| After | Block Tree 데이터 모델 + Collection Zone + 드래그 정렬 + Undo/Redo + 계층 내비게이션 |
| Size | Heavy |
| Risk | QuickPick.tsx 대규모 변경, When Router 확장의 Keybinding 우선순위 버그 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | Sidebar 키보드 바인딩 연결 | — | ✅ | — |
| T2 | PropertiesPanel 라이브 바인딩 강화 | — | ✅ | — |
| T3 | Undo/Redo 기초 구현 | — | ✅ | — |
| T4 | 블록 타입별 패널 폼 E2E | tsc clean, 57 tests pass | ✅ | PropertyType 확장 + PropertiesPanel 재작성 |
| T5 | 블록 드래그 정렬 UI | tsc 0, +4 tests, audit 0건 | ✅ | OG-002~004 발견 후 수정 |
| T6 | 계층 키보드 내비게이션 | — | ✅ | — |
| T8 | Collection Zone Facade | createCollectionZone 285줄 facade | ✅ | Builder -78줄, Todo -94줄 |
| T9 | Block Tree 데이터 모델 | Block 인터페이스, sections→blocks 마이그레이션 | ✅ | 9개 파일, tsc clean |
| T10 | Builder.Tabs 구조 프리미티브 | ARIA tablist, Zone+Item 키보드 | ✅ | NCPPricingBlock |
| T11-b | Deep clone fix | Copy/paste children ID 재생성 | ✅ | deepCloneBlock 재귀 |
| T12 | Collection Zone v2 — Minimal Facade | Clipboard OS state, text 기본값, accept, undo/redo | ⬜ | — |
| T13 | Tab Container → 범용 Container Block | Block.accept, 사이드바 Tree View, Dual Projection | ⬜ | — |
| T14 | 블록 추가 UI + 프리셋 시스템 | Block/Page Preset + 사이드바 팝오버 | ✅ | — |
| T15 | PropertiesPanel → Accordion Form 전환 | AccordionSection + Block.fields generic | ✅ | tsc 0, 980 tests |
| T16 | Panel 고도화 — OS Accordion + 양방향 Highlight | Accordion OS Zone/Item, 양방향 동기화 | ✅ | tsc 0, 980 tests |
| T17 | OS tree role auto expand/collapse | getExpandableItems Zone prop 추가 | ✅ | tsc 0, 980 tests |
| T19 | Builder Interaction Spec | 3상태 + 1규칙, +16 tests | ✅ | drillUp + ESC 통합 |
| T20 | When Router Extension | WhenPredicate 함수형 확장 | ⬜ | 6 FAIL / 5 PASS |
| T21 | forceDeselect → zone 비활성화 | tsc 0, +4 tests | ✅ | escape.ts L47-49 |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | ESC는 drillUp 안 되는데 \\는 됨 — Keybinding 우선순위 버그 | T20 관련 |
| U2 | defineApp API v6 설계 (개밥먹기 보고서 기반) | 장기 백로그 |
| U3 | Container 추상 일반화: Tabs \| Accordion \| Carousel | 장기 아키텍처 |
