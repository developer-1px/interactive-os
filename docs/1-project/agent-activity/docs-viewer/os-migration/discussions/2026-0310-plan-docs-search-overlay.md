# Plan: DocsSearch OS Overlay Migration

> 작성일: 2026-03-10

## Task Map

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| T1 | app.ts overlay 선언 + 커맨드 교체 | `searchOpen` state + `openSearch`/`closeSearch` 커맨드 | `navbarZone.overlay("docs-search", { role: "dialog" })` + `OS_OVERLAY_OPEN/CLOSE`. searchOpen 필드·두 커맨드 삭제 | S | — | tsc 0 |
| T2 | DocsSearch.tsx → ModalPortal 기반 | 수동 backdrop + useComputed(searchOpen) + onClick/onKeyDown 닫기 | ModalPortal 사용. Escape/backdrop 자동. 내부 ArrowUp/Down/Enter는 React 유지 | M | →T1 | tsc 0 + 동작 확인 |
| T3 | "/" 키바인딩 → OS_OVERLAY_OPEN | openSearch 커맨드의 key: "/" | navigating 상태에서 "/" → OS_OVERLAY_OPEN dispatch | S | →T1 | tsc 0 |
| T4 | headless 테스트 | 없음 | overlay lifecycle (열기/닫기/재열기) | S | →T2,T3 | +N tests PASS |

## Gap 후보

- ModalPortal의 dialog Zone이 ArrowUp/Down을 가로채면 React 키보드 핸들러와 충돌
- OS keyboard pipeline은 capture phase → dialog role inputmap에 ArrowUp/Down 없으면 통과
- 발견 시 즉시 중지하고 사용자에게 보고

## 향후 (Ideas)

- 결과 목록을 OS listbox zone으로 전환 (input↔listbox 포커스 전환 검증 필요)
- MermaidBlock 확대 보기 추가 (같은 overlay 패턴)
