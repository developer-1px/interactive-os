# BOARD — docs-viewer-features

## Now

- [ ] **T8**: ZoneCursor meta 보강 + DocsSidebar Todo 패턴 전환
  - Discussion: `discussions/2026-0223-2100-navtree-interaction-design.md`
  - 근본 원인: ZoneCursor에 isExpandable 등 meta 미전달 → 앱이 문자열 guard 우회
  - [x] T8.1: `ZoneCursor`에 meta 추가 (isExpandable, isDisabled, treeLevel) ✅
  - [x] T8.2: `buildZoneCursor`에서 ZoneRegistry 읽어 meta 주입 + `ZoneState.zoneId` 추가 ✅
  - [x] T8.6: DocsSidebar guard `id.startsWith("folder:")` → `cursor.isExpandable` 교체 ✅
  - [ ] T8.3: DocsApp state 추가 (activePath) — 후속: full Todo 패턴 전환 시
  - [ ] T8.4: `selectDoc` 커맨드 정의 (app.ts) — 후속
  - [ ] T8.5: bind()에 onAction/onSelect 연결 (Todo 패턴) — 후속

- [ ] **T7**: Tree Click-to-Activate + ExpandTrigger primitive
  - [x] T7.1~T7.6: Click-to-Activate 구현 완료
  - [x] T7.7: treeitem expandable 판정 수정 (role → getExpandableItems 기반)
  - [x] T7.8: Navigation Tree 통합 테스트 (12 cases, 934 GREEN)
  - [ ] T7.3: `ExpandTrigger` 프리미티브 (후속)

- [ ] **T5**: OS sidebar tree navigation (브라우저 검증 잔여)
  - [ ] Step 16: /verify — 브라우저 검증

- [ ] **T6**: Reader zone + section navigation — Space/Shift+Space로 섹션 순차 탐색
  - [x] Step 2: /discussion
  - [ ] Ste/p 10: /solve

## Next

(empty)

## Done

- [x] **T4**: Command Palette — OS 설치 + Cmd+K 전문 검색 (완료 2026-02-23)
- [x] **T3**: Favorites / Pinned — 자주 쓰는 문서 고정 (완료 2026-02-23)
- [x] **T2**: TOC (목차) — heading 기반 문서 내 네비게이션 (완료 2026-02-23)
- [x] **T1**: 날짜 메타데이터 UI — 문서 헤더에 수정일 표시 (완료 2026-02-23)
- [x] **T0**: Recent 섹션 — mtime 기반 최근 수정 문서 7개, sidebar 상단 (완료 2026-02-23)

## Ideas

- Wikilink + 백링크 (`[[문서]]` → 양방향 참조)
