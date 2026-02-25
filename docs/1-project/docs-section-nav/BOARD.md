# docs-section-nav

| 항목 | 내용 |
|------|------|
| **Claim** | DocsViewer를 OS 최신 패턴으로 전면 최신화. Space/Arrow 섹션 네비게이션 통합 + OS 계약 위반 14건(🔴) 수정 |
| **Before → After** | `register.ts` DOM 직접 접근 엔진, onClick 직접 핸들링 7건 → `DocsReaderUI` Zone 마운트, 단일 커맨드 엔진, OS Zone+Item 패턴 |
| **Risks** | 대규모 리팩토링. 기능 회귀 가능. 단계별 진행 + 테스트 필수 |
| **규모** | Light |
| **Audit** | `notes/2026-0225-audit-docs-viewer.md` — 총 33건 (🔴 14 / 🟡 8 / ⚪ 11) |

## Now

| # | Task | Status | Blocked |
|---|------|--------|---------|
| — | (all tasks complete) | — | — |

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|
| T8 | scrollToHeading os.subscribe 제거 | T1에서 완료 (Zone effect 전환) | 02-25 |
| T7 | DocsViewer auto-select → selectDoc 커맨드 검증 | +2 tests | 02-25 |
| T6 | DocsViewer onClick → OS Zone+Item onAction 검증 | +3 tests | 02-25 |
| T5 | DocsDashboard onClick → OS Zone+Item onAction 검증 | +3 tests | 02-25 |
| T4 | DocsSidebar useState(isOpen) → DOCS_TOGGLE_SECTION 커맨드 | +2 tests | 02-25 |
| T3 | `DOCS_SCROLL_PAGE` 제거, `register.ts` 정리 | -97 lines · -1 test file | 02-25 |
| T2 | 미들웨어 수정 — OS_NAVIGATE → DOCS_NEXT/PREV_SECTION dispatch | +4 tests | 02-25 |
| T1 | `DocsReaderUI` Zone 마운트 + Space/Shift+Space OS 파이프라인 경유 | +5 tests · browser ✅ | 02-25 |

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | 🟡 비동기 콘텐츠 로딩 (useState+useEffect 4건) — `defineQuery` 완료 후 적용 | No |
| U2 | 🟡 TableOfContents IntersectionObserver/anchor scroll — OS 메커니즘 필요 | No |

## Ideas

| Idea | Trigger |
|------|---------|
| 문서 끝에서 Space → 다음 파일 자동 전환 (PPT 느낌) | — |
| ArrowLeft/Right를 파일 단위 이동으로 분리 | — |
