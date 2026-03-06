# docs-browser

## Context

Claim: docs-viewer를 업계 표준 문서 브라우저(Notion/Obsidian/GitBook 수준)로 격상한다. 히스토리 네비게이션, 브레드크럼, 내부 검색, 키보드 단축키, STATUS.md 홈 대시보드 5가지 기능 추가. 읽기 전용.

Before → After:
- `DocsState = { activePath }` → `{ activePath, history[], historyIndex }`
- `replaceState` → `pushState` (브라우저 뒤로가기 작동)
- 브레드크럼 `<span>` (표시만) → `<button>` (클릭으로 폴더 이동)
- Cmd+K 노이즈 → docs 전용 `/` 키 검색 오버레이
- STATUS.md 텍스트 렌더링 → 구조화 대시보드 UI

Risks:
- STATUS.md 형식 변경 시 파서 깨짐 (현재 형식 안정적이라 수용)
- Alt+ArrowLeft 브라우저 기본 동작 가로채기 (docs-viewer 활성 시만)

## Now

(empty — all tasks complete)

## Done

- [x] T1: DocsState 히스토리 스택 + selectDoc 히스토리 push — tsc 0 | +3 tests | build OK
- [x] T2: GO_BACK / GO_FORWARD 커맨드 — tsc 0 | +5 tests | build OK
- [x] T3: replaceState → pushState 전환 — tsc 0 | build OK
- [x] T4: 네비바 + 브레드크럼 + Alt+Arrow keybinding + `/` 검색 keybinding — tsc 0 | +8 tests | build OK
- [x] T5: docs 전용 내부 검색 오버레이 + `/` 키 트리거 — DocsSearch.tsx | tsc 0 | 32 tests | build OK
- [x] T6: STATUS.md 파서 (parseStatusMd) — tsc 0 | +4 tests | build OK
- [x] T7: StatusDashboard UI — StatusDashboard.tsx | tsc 0 | 32 tests | build OK
- [x] T8: STATUS.md 선택 시 StatusDashboard 라우팅 — DocsViewer.tsx | tsc 0 | 32 tests | build OK

## Unresolved

## Ideas
- Wikilink 백링크 (docs/5-backlog/docs-viewer-wikilink.md)
- 페이지네이션 모드 (docs-dashboard PRD Feature 2)
