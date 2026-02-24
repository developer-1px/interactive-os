# BOARD — builder-v2

> 목표: 보편 Block Tree 모델을 확립하고, Builder Primitives로 감싸면 어떤 디자인이든 inline-edit 가능하게 한다.
> 이전 프로젝트: archive/2026/02/W08/builder-mvp

## 🔴 Now

- [ ] T20: When Router Extension — `when`을 `WhenPredicate`(함수형)로 확장
  - Discussion: 2026-0224 "OS 파이프라인 검증 표 → when 확장" session
  - 결정 테이블: `notes/2026-0224-decision-table-when-router.md`
  - 🔴 Red: `tests/integration/when-router-decision-table.test.ts` — 6 FAIL / 5 PASS
  - [ ] T20-1: `@/os/when` 모듈 생성 (`itemAttr`, `not`, `and` 팩토리)
  - [ ] T20-2: `Keybindings.resolve`에서 `WhenPredicate` 평가 지원
  - [ ] T20-3: `bind()` onAction이 `{ command, when }[]` 배열 수용
  - [ ] T20-4: Builder canvas `drillDown`/`drillUp` → 단일 커맨드 + when 분리
  - 🐛 발견: ESC는 drillUp 안 되는데 \는 됨 — 오고 있는 Keybinding 우선순위 버그

- [x] T21: forceDeselect → zone 비활성화 — tsc 0 | +4 tests | regression 0 ✅
  - Discussion: `discussions/2026-0224-2048-force-deselect-zone.md`
  - `escape.ts` L47-49: `force:true` → `activeZoneId=null` (3줄)

- ~~T18~~ → **독립 프로젝트로 분리**: [`content-edit-mode`](../content-edit-mode/BOARD.md)

- [x] T19: Builder Interaction Spec — 3상태(Deselected/Selected/Editing) + 1규칙(drill up, 부모 없으면 탈출) — 🔴→🟢 +16 tests ✅
  - Discussion: [builder-interaction-spec](discussions/2026-0224-1739-builder-interaction-spec.md)
  - [x] T19-1: `createDrillUp` — section(부모 없음)에서 `return []` → `OS_ESCAPE()` 반환 — 🔴→🟢 +9 tests ✅
  - [x] T19-2: ESC를 drillUp keybinding으로 통합 — `dismiss: "none"` + `{ key: "Escape", command: createDrillUp }` ✅
  - [x] T19-3: Deselected 상태 — focusedItemId=null 시 커서 숨김 + 키보드 무반응 = T19-1에서 자동 충족 ✅
  - [x] T19-4: 마우스 Edit 유지 — resolveClick에 wasEditing 조건 추가 — 🔴→🟢 +7 tests | 454 pass ✅

- [ ] T13: Tab Container → 범용 Container Block (PoC)
  - [ ] `Block.accept?: string[]` 필드 추가 — Container가 받을 수 있는 하위 블록 타입 제한
  - [ ] `BuilderTabs` 리팩토링 — 하드코딩 → Block Tree 데이터 주도 렌더링
  - [ ] 사이드바 Tree View — flat list(`role="listbox"`) → recursive tree(`role="tree"`)
  - [ ] Tab Container에 기존 블록 붙여넣기 동작 확인
  - [ ] Dual Projection 검증: 트리 접기/펼치기 ↔ 캔버스 탭 전환 동기화
  - Discussion: [tab-container-accept](discussions/2026-0220-1833-tab-container-accept.md)

- [ ] T12: Collection Zone v2 — Minimal Facade 리팩토링
  - [ ] Clipboard → OS state로 이동 (글로벌 단일)
  - [ ] `text` 기본값 체인 (`label → text → id`)
  - [ ] `accept` 기반 타입 매칭 (같은 collection 자동 수락)
  - [ ] `fromText` 선택적 ingress hook
  - [ ] deep clone 자동 감지 (`children`)
  - [ ] `extractId` Convention (`{zoneName}-`)
  - [ ] undo/redo 자동 포함
  - Discussion: [collection-zone-v2-facade](discussions/2026-0220-1306-collection-zone-v2-facade.md)

- [ ] T4: 블록 타입별 패널 폼 E2E
  - [x] PropertyType 확장: badge, divider, tabs 추가
  - [x] PropertiesPanel 전면 재작성: useResolvedField → Block.fields 직접 접근
  - [x] IconProperties: resolveFieldAddress → block.fields["icon"] 라이브 바인딩
  - [x] ImageProperties: resolveFieldAddress → block.fields + alt 필드 연동
  - [x] BadgeProperties / DividerProperties / TabsProperties 신규 추가
  - [x] LinkProperties / ButtonProperties: 미연결 static 폼 제거 → 라이브 바인딩
  - [x] SectionProperties: 모든 fields 일괄 편집 UI 추가
  - [x] tsc clean, 57 tests pass

- [ ] T5: 블록 드래그 정렬 UI

## 📋 Backlog

- defineApp API v6 설계 (개밥먹기 보고서 기반)
- Accordion / Carousel 컨테이너 프리미티브 (Tabs와 동일 추상 변형)
- [ ] T7: Builder 프리미티브 headless 리팩토링

## 💡 Ideas

- Container 추상 일반화: "N개 자식, 조건부 가시성, 전환 UI" = Tabs | Accordion | Carousel
- Block Tree undo/redo: children 변경 시 history snapshot 전략

## ⏳ Done

- [x] T17: OS tree role auto expand/collapse — 수동 배선 제거 (02-24) — tsc 0 | 980 tests | build OK ✅
  - **발견**: OS tree role preset에 이미 `arrowExpand: true` 존재. `OS_ACTIVATE`도 expandable items에 자동 toggle.
  - **실제 원인**: `getExpandableItems` 미제공 → OS가 어떤 item이 expandable인지 몰랐음
  - T17-1/2: OS에 이미 구현됨 (arrowExpand + OS_ACTIVATE). `getExpandableItems` Zone prop 추가로 활성화.
  - T17-3: sidebar/panel 수동 keybinding (`ArrowLeft/Right → OS_EXPAND`) 제거. OS가 자동 제공.
  - T17-4: sidebar/panel 수동 `onClick → toggleExpanded` 제거. OS `OS_ACTIVATE` 가 처리.
  - Discussion: [os-tree-auto-expand](discussions/2026-0224-1034-os-tree-auto-expand.md)

- [x] T16: Panel 고도화 — OS Accordion + 양방향 Highlight + 스크롤 안정화 (02-24) — tsc 0 | 980 tests | build OK ✅
  - T16-1: Accordion 헤더 → OS Zone/Item (`BuilderPanelUI` zone, `useExpanded`, Arrow/Enter 키보드)
  - T16-2: Panel field focus → Canvas highlight 양방향 동기화 (`HighlightContext`, dashed indigo cursor)
  - T16-3: Auto-scroll = section 헤더 단위 (`headerRefs` + `scrollIntoView({ block: "nearest" })`)
  - Discussion: [panel-enhancements](discussions/2026-0224-1017-panel-enhancements.md)

- [x] T15: PropertiesPanel → Accordion Form 전환 (02-24) — tsc 0 | 980 tests | build OK ✅
  - AccordionSection 공용 컴포넌트 (열림/닫힘, chevron)
  - blocks.map() → Accordion 구조 전환
  - Block.fields 기반 generic FieldInput (multiline 자동 감지)
  - Nested Accordion for children blocks (Services cards, Tab children)
  - Page Meta 하드코딩 (slug, description, keywords)
  - Canvas sync: focusedItem → auto-expand + scrollIntoView
  - Discussion: [panel-accordion-form](discussions/2026-0224-1003-panel-accordion-form.md)

- [x] T14: 블록 추가 UI + 프리셋 시스템 (02-21)
  - Block/Page Preset 데이터 + 사이드바 팝오버 + PagePresetPicker
- [x] T11-b: Deep clone fix — Copy/paste children ID 재생성
  - `deepCloneBlock()` 재귀 헬퍼, `onClone` + `onPaste` 양쪽 적용
  - 테스트 기대값 수정 (5+3=8), container children uniqueness 테스트 추가
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
