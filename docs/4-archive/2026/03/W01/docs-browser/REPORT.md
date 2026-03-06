# /divide Report — docs-viewer를 업계 표준 문서 브라우저로 격상

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | docs-viewer에 히스토리 네비게이션, 브레드크럼, 내부 검색, 키보드 단축키, STATUS.md 홈 대시보드를 추가하여 업계 표준 문서 브라우저 수준으로 격상 |
| **Constraints** | 읽기 전용 (조작 없음) / 기존 defineApp·ZIFT 구조 준수 / 새 의존성 최소화 / 개별 문서 읽기 경험 유지 |
| **Variables** | 히스토리 스택 구현 방식, 검색 UI 위치·트리거, STATUS.md 파서 구조, 키바인딩 선택 |

## Backward Chain

| Depth | Subgoal | ? | Evidence | 미충족 시 전제조건 |
|-------|---------|---|----------|--------------------|
| 0 | docs-viewer가 업계 표준 문서 브라우저 | ❌ | — | → A(히스토리), B(브레드크럼), C(내부검색), D(키보드), E(홈 대시보드) |
| | | | | |
| 1 | **A. 히스토리 네비게이션** (뒤로/앞으로) | ❌ | — | → A1, A2, A3 |
| 2 | A1. DocsState에 히스토리 스택 존재 | ❌ | `app.ts:72-74` — `DocsState = { activePath: string \| null }` 단일 필드. 히스토리 없음 | 🔨 WP1 |
| 2 | A2. `replaceState` → `pushState` 전환 | ❌ | `DocsViewer.tsx:254` — `history.replaceState(null, "", hash)` 사용 중. 브라우저 히스토리 안 쌓임 | 🔨 WP2 |
| 2 | A3. 뒤로/앞으로 UI (버튼 or 키보드) | ❌ | 해당 UI 없음 | 🔨 WP3 (→ D와 합류) |
| | | | | |
| 1 | **B. 클릭 가능한 브레드크럼** | ❌ | — | → B1, B2 |
| 2 | B1. 경로 세그먼트 표시 존재 | ✅ | `DocsViewer.tsx:430-444` — `activePath.split("/").map(part => <span>)`. 표시는 되지만 **클릭 불가** (plain `<span>`) | — |
| 2 | B2. 각 세그먼트 클릭 시 해당 폴더 뷰로 이동 | ❌ | `DocsViewer.tsx:430` — `<span>` 태그, onClick 없음. `handleSelect("folder:...")` 호출 필요 | 🔨 WP4 |
| | | | | |
| 1 | **C. docs 전용 내부 검색** | ❌ | — | → C1, C2, C3 |
| 2 | C1. docs 파일 목록 데이터 존재 | ✅ | `docsUtils.ts:198-201` — `docsModules = import.meta.glob("../../docs/**/*.md")`. `useDocsList.ts` 도 있음 | — |
| 2 | C2. 퍼지 매칭 함수 존재 | ✅ | `useDocsList.ts` 사용 중, CommandPalette에 `fuzzyMatch` 존재 | — |
| 2 | C3. docs-viewer 내부 검색 UI | ❌ | 없음. 현재 Cmd+K CommandPalette에 혼합되어 노이즈 발생 | 🔨 WP5 |
| 3 | C3a. 검색 트리거 키바인딩 (`/` 키) | ❌ | docs-viewer에 `/` 키 바인딩 없음 | 🔨 WP5에 포함 |
| 3 | C3b. 검색 결과 → activePath 전환 | ✅ | `selectDoc` 커맨드 존재 (`app.ts:85-92`) | — |
| | | | | |
| 1 | **D. 키보드 단축키** | ❌ | — | → D1, D2, D3 |
| 2 | D1. 문서 간 이동 (`←`/`→`) | ✅ | `register.ts:120-154` — `DOCS_SCROLL_PAGE` 커맨드 + 미들웨어. ArrowLeft/Right로 섹션 이동 + 파일 경계 자동 전환 | — |
| 2 | D2. 히스토리 이동 (`Alt+←`/`Alt+→`) | ❌ | 히스토리 스택 자체 없음 (A1) | 🔨 WP3 |
| 2 | D3. 섹션 이동 (`Space`/`Shift+Space`) | ✅ | `app.ts:165-168` — keybindings 등록 완료 | — |
| | | | | |
| 1 | **E. STATUS.md 홈 대시보드** | ❌ | — | → E1, E2, E3 |
| 2 | E1. STATUS.md 마크다운 파서 | ❌ | STATUS.md 전용 파서 없음. 현재 범용 `MarkdownRenderer`로 텍스트 렌더링 | 🔨 WP6 |
| 2 | E2. 대시보드 UI 컴포넌트 | ❌ | `DocsDashboard.tsx` 존재하지만 **mock 데이터** (`Math.random()`, `docsUtils:43-49`). 실제 STATUS.md 파싱과 무관 | 🔨 WP7 |
| 2 | E3. STATUS.md 선택 시 대시보드로 라우팅 | ❌ | 없음. 현재 모든 `.md`가 `MarkdownRenderer`로 렌더링됨 | 🔨 WP8 |
| 3 | E3a. FolderIndexView 분기 패턴 존재 | ✅ | `DocsViewer.tsx:415` — `isFolderView && folderNode ? <FolderIndexView> : <article>`. 이 분기 패턴을 STATUS.md에도 적용 가능 | — |

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence | Size |
|----|---------|-------------------|----------|------|
| **WP1** | DocsState에 히스토리 스택 추가 | Goal ← A ← A1 | `app.ts:72-74` — 단일 `activePath` | S |
| **WP2** | `replaceState` → `pushState` 전환 + popstate 동기화 | Goal ← A ← A2 | `DocsViewer.tsx:254` | S |
| **WP3** | 뒤로/앞으로 키보드 (`Alt+←/→`) + UI 버튼 | Goal ← A ← A3, Goal ← D ← D2 | 없음 | S |
| **WP4** | 브레드크럼 세그먼트를 클릭 가능하게 | Goal ← B ← B2 | `DocsViewer.tsx:430-444` — `<span>` → `<button onClick>` | XS |
| **WP5** | docs-viewer 내부 검색 UI + `/` 키 트리거 | Goal ← C ← C3 | 없음. `fuzzyMatch` + `docsModules` 재사용 | M |
| **WP6** | STATUS.md 마크다운 파서 (섹션별 구조화 데이터 추출) | Goal ← E ← E1 | 없음 | M |
| **WP7** | StatusDashboard UI (mock 대체) | Goal ← E ← E2 | `DocsDashboard.tsx` — mock 데이터 | M |
| **WP8** | STATUS.md 선택 시 StatusDashboard 라우팅 | Goal ← E ← E3 | 없음. FolderIndexView 분기 패턴 참조 | XS |

## Execution Order (의존성 기반)

```
Phase 1 — 히스토리 (A)
  WP1 → WP2 → WP3   (순차: 스택 → pushState → 키보드/UI)

Phase 2 — 네비게이션 UX (B, D)
  WP4               (독립: 브레드크럼 클릭)

Phase 3 — 내부 검색 (C)
  WP5               (독립: 검색 UI)

Phase 4 — 홈 대시보드 (E)
  WP6 → WP7 → WP8   (순차: 파서 → UI → 라우팅)
```

Phase 1~3은 상호 독립. Phase 4도 독립.

## Residual Uncertainty

- **WP1 설계**: 히스토리를 DocsState에 넣을지 vs. 별도 모듈로 관리할지. 🟡 Complicated — `/plan`에서 결정
- **WP5 설계**: 검색 UI를 사이드바에 넣을지 vs. 오버레이 팝업으로 할지. 🟡 Complicated — `/plan`에서 결정
- **WP6 범위**: STATUS.md 형식이 변경되면 파서도 변경 필요. 현재 형식이 안정적이라고 가정
