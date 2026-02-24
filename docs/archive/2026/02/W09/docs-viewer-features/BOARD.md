# BOARD — docs-viewer-features

## Now

- [x] **T11**: 폴더 클릭 시 인덱스 페이지 표시 — tsc 0 | 983 tests (0 fail) | 3 tests updated ✅
  - Discussion: `discussions/2026-0224-1150-folder-index-page.md`
  - 폴더 클릭 → 메인 영역에 직계 자식(1-depth) 목록 표시
  - 직계 자식 ≤3개 → 파일 마크다운 본문 인라인 표시
  - 직계 자식 >3개 → 목록만 (클릭하여 이동)
  - [x] T11.1: `selectDoc` expandable 가드 제거 (activePath에 folder ID 허용) ✅
  - [x] T11.2: `findFolder` 유틸 추가 (docsUtils.ts) ✅
  - [x] T11.3: `DocsViewer.tsx` 폴더 감지 + FolderIndexView 렌더링 ✅
  - [x] T11.4: ≤3개 파일 인라인 마크다운 표시 ✅

- [x] **T8**: ZoneCursor meta 보강 + DocsSidebar Todo 패턴 전환 🔥 FIRED
  - 해고 보고서: `docs/0-inbox/fired-2026-02-23-2155.md`
  - Discussion: `discussions/2026-0223-2100-navtree-interaction-design.md`
  - 근본 원인: ZoneCursor에 isExpandable 등 meta 미전달 → 앱이 문자열 guard 우회
  - [x] T8.1: `ZoneCursor`에 meta 추가 (isExpandable, isDisabled, treeLevel) ✅
  - [x] T8.2: `buildZoneCursor` meta 주입 + `ZoneState.zoneId` 추가 ✅
  - [x] T8.3: DocsApp state 추가 (activePath) ✅
  - [x] T8.4: `selectDoc` 커맨드 정의 (app.ts) ✅
  - [x] T8.5: bind()에 onAction/onSelect 연결 (Todo 패턴) ✅
  - [x] T8.6: Zone handler props 제거 + DocsSidebar 핸들러 제거 ✅

- [x] **T7**: Tree Click-to-Activate + ExpandTrigger primitive ✅ (ExpandTrigger → item-expand-primitives로 분리 완료)

- [x] **T9**: 새로고침 시 URL 기반 초기 선택 버그 ✅
  - 원인: `activePath: null` 초기값 → `allFiles` effect가 첫 번째 항목 선택
  - 해결: `parseHashToPath()` 순수 함수 추출 → `getInitialPath()`로 초기 state 동기 파생
  - `DocsViewer.tsx` hash init effect 제거 (중복)
  - 5 cases RED→GREEN (953/953 전체 GREEN)

- [ ] **T10**: Tree 폴더 클릭 expand 토글 🔥 FIRED
  - 해고 보고서: `docs/0-inbox/fired-2026-02-24-0137.md`

- [x] **T5**: OS sidebar tree navigation ✅
  - APG tree.apg.test: 23 cases GREEN (nav, expansion, selection, click, attrs)

- [x] **T6**: Reader zone + section navigation ✅
  - docs-scroll.test: 8 cases GREEN (heading snapping, boundaries, stale zone)
  - `os.use({ fallback })` 제거 → `readerZone.bind({ keybindings })` OS 패턴 전환
  - Space/Shift+Space는 reader zone active 시에만 동작 (Zone 스코프)

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
