# /plan — docs-viewer를 업계 표준 문서 브라우저로 격상

> Created: 2026-03-05

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `app.ts:DocsState` | `{ activePath }` | `{ activePath, history: string[], historyIndex: number }` | Clear | -- | tsc 0, 기존 tests 유지 | selectDoc이 history push 필요 |
| 2 | `app.ts:selectDoc` | `draft.activePath = id` | history splice+push, historyIndex++, activePath = id | Clear | #1 | tsc 0, +2 tests | resetDoc도 history clear |
| 3 | `app.ts:goBack/goForward` | 없음 | GO_BACK, GO_FORWARD 커맨드 | Clear | #1 | +2 tests | 경계 조건 |
| 4 | `DocsViewer.tsx:setHash` | `replaceState` | `pushState` | Clear | -- | 수동 | popstate 핸들러 기존 |
| 5 | `DocsViewer.tsx:네비바` | 없음 | 뒤로/앞으로 버튼 + 브레드크럼 바 | Clear | #3 | tsc 0 | 레이아웃 |
| 6 | `DocsViewer.tsx:브레드크럼` | `<span>` (클릭 불가) | `<button onClick={handleSelect("folder:...")}>` | Clear | -- | tsc 0 | 경로 조립 |
| 7 | `app.ts:keybindings` | Space/Shift+Space만 | +Alt+ArrowLeft/Right → GO_BACK/FORWARD | Clear | #3 | +2 tests | 브라우저 기본 동작 |
| 8 | `DocsViewer.tsx:내부검색` | 없음 | `/` 키 오버레이 팝업, fuzzyMatch, 선택시 selectDoc | Clear | -- | +3 tests | fuzzyMatch 재사용 |
| 9 | `docsUtils.ts:parseStatusMd` | 없음 | STATUS.md → 구조화 데이터 파서 | Clear | -- | +4 tests | 형식 의존 |
| 10 | `StatusDashboard.tsx` | DocsDashboard.tsx (mock) | STATUS.md 파싱 기반 실제 대시보드 | Clear | #9 | tsc 0, build OK | 교체 |
| 11 | `DocsViewer.tsx:라우팅` | 모든 .md → MarkdownRenderer | STATUS.md → StatusDashboard 분기 | Clear | #10 | tsc 0 | 경로 매칭 |

## 라우팅

승인 후 → `/project` (docs-browser) — 새 프로젝트. BOARD.md scaffold 후 WP 기반 태스크 등록.
