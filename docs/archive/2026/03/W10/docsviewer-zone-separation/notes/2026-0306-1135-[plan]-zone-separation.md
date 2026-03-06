## /plan — DocsViewer Zone 분리

### 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `app.ts`: navbar zone onAction | pin/home 없음 | `docs-toggle-pin` → `toggleFav()`, home path → `selectDoc()` 추가 | Clear | — | tsc 0 | — |
| 2 | `app.ts`: 새 `docs-page-nav` zone | 없음 | createZone, role=toolbar, horizontal, onClick:true, onAction → selectDoc | Clear | — | tsc 0 | — |
| 3 | `app.ts`: reader zone onAction | pin 분기 + selectDoc fallback | pin 분기 제거. selectDoc만 잔류 | Clear | →#1 | tsc 0 | — |
| 4 | `DocsViewer.tsx:465-487`: pin 버튼 | `DocsReaderUI.Item` | `DocsNavbarUI.Item` (navbar Zone 안으로 이동) | Clear | →#1 | tsc 0 | 위치 이동 필요 |
| 5 | `DocsViewer.tsx:419-426`: return home | `DocsReaderUI.Item` | `DocsNavbarUI.Item` (navbar Zone 안으로 이동) | Clear | →#1 | tsc 0 | 위치 이동 필요 |
| 6 | `DocsViewer.tsx:508-540`: prev/next | `DocsReaderUI.Item` | `DocsPageNavUI.Item` + Zone 래핑 | Clear | →#2 | tsc 0 | — |
| 7 | `testbot-docs.ts`: READER_ITEMS | pin/prev/next | 제거. NAVBAR_ITEMS에 pin 추가. PAGE_NAV_ITEMS 신설 | Clear | →#2 | tsc 0 | — |
| 8 | `docs-tab.test.ts`: zone 목록 | 5 zones | 6 zones (+page-nav). ZONE_ITEMS 갱신 | Clear | →#2,#7 | 9 tests pass | — |
| 9 | 디자인 이슈 (breadcrumb 중복) | → backlog 등록 | Clear | — | — | — |

## 라우팅
승인 후 → /project (docsviewer-zone-separation) — Light, os-core 도메인
