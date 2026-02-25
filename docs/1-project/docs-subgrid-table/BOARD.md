# docs-subgrid-table

| 항목 | 내용 |
|------|------|
| **Claim** | CSS subgrid named grid lines로 DocsViewer의 table만 content-driven auto-wide 렌더링 |
| **Before → After** | table이 `max-w-3xl`에 갇혀 줄바꿈 → prose 이상 content 폭까지 자연 확장 |
| **Risks** | ReactMarkdown children이 모두 grid item화 → 예기치 않은 레이아웃 깨짐 |
| **규모** | Light |
| **Discussion** | `discussions/2026-0225-1256-subgrid-auto-wide-table.md` |

## Now

| # | Task | Status | Blocked |
|---|------|--------|---------|
| T1 | content wrapper를 named grid로, MarkdownRenderer를 subgrid로 전환. table은 full track + max-content | 🔲 | — |

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | code block, image도 같은 breakout 메커니즘 적용? | No (이번 스코프 외) |

## Ideas

| Idea | Trigger |
|------|---------|
| pre/img도 full track breakout | T1 완료 후 |
