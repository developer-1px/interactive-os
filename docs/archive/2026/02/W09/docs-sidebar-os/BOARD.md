# BOARD — docs-sidebar-os

> Phase: Light | Created: 2026-02-23

## Now

- [x] **T1**: app.ts — Recent/Favorites Zone 정의 + bind() ✅
  - selectDoc → 앱 레벨 커맨드로 승격 (3 Zone 공유)
  - resetDoc → activePath 초기화 커맨드 추가
  - DocsRecentUI (docs-recent, listbox) — bind() 완료
  - DocsFavoritesUI (docs-favorites, listbox) — bind() 완료
  - [x] Step 9: /tdd — 기존 3 tests GREEN
  - [x] Step 10: /solve — 구현 완료

- [x] **T2**: DocsViewer — activePath 이중 상태 제거 ✅
  - useState<string | undefined> → DocsApp.useComputed() 단일 소스
  - handleSelect → os.dispatch(selectDoc()) 커맨드 파이프라인
  - setActivePath(undefined) → os.dispatch(resetDoc()) 교체
  - [x] Step 10: /solve — 구현 완료

- [x] **T3**: DocsSidebar — OS Zone 통합 ✅
  - RecentSection → DocsRecentUI.Zone + Item (isFocused render prop)
  - FavoritesSection → DocsFavoritesUI.Zone + Item (isFocused render prop)
  - onSelect prop 제거 — 커맨드가 대체
  - [x] Step 10: /solve — 구현 완료

- [ ] **T4**: 브라우저 검증 — 세 Zone 키보드/마우스 동작 확인
  - [ ] Step 16: /verify

## Done

- [x] D0: Discussion — 3 Zone 독립 구현 결정, best practice 위반 분석

## Verification

- tsc --noEmit: ✅ 0 errors
- vitest run: ✅ 937/937 passed (87 files)

## Ideas

- 3 Zone → 1 Zone 통합 (실증 후 판단)
- ID 네임스페이스 (통합 시 필요)
- handleToggleFavorite → OS 커맨드로 전환 (context menu 추가 시)
- Edge loop 방지 + seamless passthrough (Zone 간 ArrowUp/Down 연속 탐색) → `docs/5-backlog/docs-sidebar-edge-navigation.md`
- Focus ring 제거 (:focus-visible 네이티브 outline 억제) → `docs/5-backlog/focus-ring-removal.md`
