# docsviewer-zone-separation

## Context

Claim: docs-reader zone에 혼재된 비-article Item(pin/prev/next/home)을 의미적으로 올바른 zone으로 분리한다.

Before → After:
- Before: docs-reader(feed) zone에 pin 버튼, prev/next 네비게이션, return home, StatusDashboard 항목이 모두 혼재. 방향키로 pin → prev → next를 탐색하는 비정상 동선.
- After: pin/home → navbar(toolbar), prev/next → docs-page-nav(toolbar, 신설). reader에는 콘텐츠 Item만 잔류.

Risks:
- pin 버튼의 DOM 위치가 navbar Zone 바깥에 있으면 Item 등록 실패

## Now
(empty — all tasks complete)

## Done
- [x] T1: app.ts — navbar onAction에 pin/home 추가, docs-page-nav zone 신설, reader onAction에서 pin 제거 — tsc 0 ✅
- [x] T2: DocsViewer.tsx — pin → navbar, return home → os.dispatch, prev/next → DocsPageNavUI.Zone — tsc 0 ✅
- [x] T3: testbot-docs.ts + docs-tab.test.ts — 6 zones, NAVBAR_ITEMS에 pin 추가, PAGE_NAV_ITEMS 신설 — 9/9 tests pass | 1927 total ✅
- [x] T4: backlog — docs/5-backlog/docsviewer-breadcrumb-dedup.md 등록 ✅

## Unresolved

## Ideas
