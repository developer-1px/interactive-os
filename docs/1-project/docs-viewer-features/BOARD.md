# BOARD — docs-viewer-features

## Now

- [ ] **T7**: Tree Click-to-Activate + ExpandTrigger primitive
  - Discussion: `discussions/2026-0223-2004-tree-click-activate.md`
  - [ ] T7.1: `activate.onClick` 옵션 — OS ClickListener에서 Click → `OS_ACTIVATE` dispatch
  - [ ] T7.2: `OS_ACTIVATE` auto-expand — expandable item에서 자동 `OS_EXPAND(toggle)`
  - [ ] T7.3: `ExpandTrigger` 프리미티브 — OS가 셰브론 렌더 + 클릭 핸들 + 회전 처리
  - [ ] T7.4: DocsViewer 적용 — `activate.onClick: true` + `followFocus: true` + `onAction` 통합
  - [ ] T7.5: 기존 잔해 제거 — 수동 `OS_EXPAND` dispatch, `onSelect` 폴더 분기 삭제
  - [ ] T7.6: /verify — tsc + vitest + 브라우저 검증

- [ ] **T5**: OS sidebar tree navigation (브라우저 검증 잔여)
  - [ ] Step 16: /verify — 브라우저 검증

- [ ] **T6**: Reader zone + section navigation — Space/Shift+Space로 섹션 순차 탐색
  - [x] Step 2: /discussion
  - [ ] Step 10: /solve

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
