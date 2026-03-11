# BOARD — builder-v3

> 목표: 빌더를 "단일 페이지 에디터"에서 "콘텐츠 운영 플랫폼"으로 도약시킨다.
> 이전 프로젝트: builder-v2 (진행 중)
>
> **⚠️ 이 프로젝트는 기획만 한다. 개발하지 않는다.**
> 나중에 /auto로 자동 개발할 예정. 현재는 OS 개발이 우선.

## 🔴 Now — 기획 (spec + stories + decision table)

- [x] T1: Page Lifecycle 기획 — Draft → Published → Archived 상태 전이 ✅
  - spec: `docs/6-products/builder/spec/page-lifecycle.md`
  - stories: US-005, US-006, US-007
  - OS 검증: Toolbar, AlertDialog, Status Badge, State Machine
  - Decision Table: 11행 (toolbar 8 + page-list 3)
  - BDD: 6 scenarios

- [x] T2: Page Template & 복제 기획 — 기존 페이지 복제, 템플릿에서 생성 ✅
  - spec: `docs/6-products/builder/spec/page-template.md`
  - stories: US-008, US-009
  - OS 검증: Dialog + Grid (템플릿 갤러리), Collection 생성 흐름
  - Decision Table: 10행 (template-dialog 8 + page-list 2)
  - BDD: 6 scenarios

- [x] T3: Content Diff 기획 — 변경사항 시각화 (Draft vs Published) ✅
  - spec: `docs/6-products/builder/spec/content-diff.md`
  - stories: US-010, US-011
  - OS 검증: Side-by-side 레이아웃, Tree diff, 상태 비교
  - Decision Table: 8행
  - BDD: 7 scenarios

- [x] T4: VISION.md Next 섹션 갱신 — v3 방향 반영 ✅

- [x] T5: Version History 기획 — 배포 이력 타임라인, 롤백, 배포 메모 ✅
  - spec: `docs/6-products/builder/spec/version-history.md`
  - stories: US-012, US-013
  - OS 검증: List (Timeline), AlertDialog (롤백), Panel, Form
  - Decision Table: 13행 (version-panel 10 + publish-dialog 3)
  - BDD: 7 scenarios

- [x] T6: Block Library 기획 — 재사용 블록 저장/삽입, Built-in vs Custom ✅
  - spec: `docs/6-products/builder/spec/block-library.md`
  - stories: US-014
  - OS 검증: Grid, Context Menu, DnD (크로스 존), Dialog + Form, Tab
  - Decision Table: 14행 (library-panel 9 + save-to-library 5)
  - BDD: 6 scenarios

- [x] T7: Content Search & Replace 기획 — 페이지 내/전체 검색, 일괄 치환 ✅
  - spec: `docs/6-products/builder/spec/content-search.md`
  - stories: US-015
  - OS 검증: Search (Combobox), Toast, AlertDialog, Batch Undo, Selection
  - Decision Table: 15행 (search-bar 9 + global-search 6)
  - BDD: 7 scenarios

- [x] T8: Media Library 기획 — 이미지 자산 관리, 업로드, 태그, Alt 텍스트 ✅
  - spec: `docs/6-products/builder/spec/media-library.md`
  - stories: US-016
  - OS 검증: Grid (2D), Dialog, Search, Upload, Form, AlertDialog, Progress
  - Decision Table: 19행 (media-library 14 + asset-detail 5)
  - BDD: 8 scenarios

## 📋 Backlog

- 외부 HTML 임포트 (HTML → Block Tree 파서) — OS 무관, 별도 프로젝트
- 반응형 미리보기 — CSS 영역, OS 검증 가치 낮음
- 새 콘텐츠 타입 (Video, Map, Code) — 점진적 확장

## 💡 Ideas

- OS State Machine primitive — 페이지 상태 전이를 OS 레벨로 추상화?
- Named Snapshot — 커널 History 모듈 확장 (undo 스택 → 명명된 버전)
- Tree Diff — NormalizedCollection diff 연산

## ⏳ Done

(없음 — 기획 프로젝트)
