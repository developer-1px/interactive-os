# toolbar role preset: click inputmap 추가

> 작성일: 2026-03-07
> 출처: docs/5-backlog/toolbar-click-inputmap.md

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `roleRegistry.ts:252` toolbar preset | `inputmap: { Space: [OS_ACTIVATE()], Enter: [OS_ACTIVATE()] }` | `inputmap: { Space: [OS_ACTIVATE()], Enter: [OS_ACTIVATE()], click: [OS_ACTIVATE()] }` | Clear | — | +1 test (toolbar click activate) | 없음. 기존 Space/Enter 불변 |
| 2 | `toolbar.apg.test.ts` | click activate 테스트 없음 | `click("bold-btn")` 후 onAction 호출 확인 테스트 추가 | Clear | #1 | +1 test GREEN | — |

## 판단 근거

- 12개 role이 이미 `click:` inputmap 패턴 사용 (menu, radiogroup, tree, accordion, disclosure, switch, checkbox 등)
- toolbar만 누락 — `Space/Enter: [OS_ACTIVATE()]`는 있으면서 `click`만 빠짐
- `PointerListener.tsx:357`에서 `activateOnClick = clickCommands.length > 0` — click 없으면 클릭 완전 무시
- **feed 제외**: child role = `article`(content container). APG feed spec에서 article 클릭은 focus만. activate는 article 내부 링크/버튼이 담당

## 라우팅

승인 후 -> `/issue` — toolbar click inputmap 1줄 추가 + 테스트 1개
