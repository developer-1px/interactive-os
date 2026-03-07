# Plan: APG Suite Sidebar 완료 표기 + 다음 패턴 추가

> 작성일: 2026-03-07 20:40

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `src/pages/apg-showcase/index.tsx` PATTERNS 타입 | `Record<string, { name, component }>` | `Record<string, { name, component, status }>` status = `"dt"` \| `"test"` \| `"none"` | Clear | — | tsc 0 | 없음 |
| 2 | `src/pages/apg-showcase/index.tsx` sidebar Item | 패턴 이름만 표시 | 이름 왼쪽에 상태 아이콘 (🟢/🟡/⬜) 표시 | Clear | →#1 | 빌드 OK, 브라우저 확인 불필요 | 없음 |
| 3 | `src/pages/apg-showcase/index.tsx` PATTERNS 데이터 | status 필드 없음 | accordion: `"dt"`, tabs: `"dt"`, 나머지 22개 apg.test.ts 있는 것: `"test"`, 테스트 없는 것: `"none"` | Clear | →#1 | tsc 0 | 없음 |
| 4 | `docs/1-project/apg/apg-dt-standard/BOARD.md` | Now 비어있음 | T7: listbox.apg.md + listbox.apg.test.ts DT 표준 전환 | Clear | →#1,#2,#3 | — | 없음 |

## 상태 분류 기준

| 상태 | 아이콘 | 의미 |
|------|--------|------|
| `dt` | 🟢 | DT standard `.apg.md` 존재 + headless tests 전부 pass |
| `test` | 🟡 | `.apg.test.ts` 존재 + pass, DT 미전환 |
| `none` | ⬜ | 테스트 없음 |

## 현재 패턴별 상태

- **dt** (3): accordion, tabs-auto (tabs 내), tabs-manual (tabs 내)
- **test** (19): button, checkbox, disclosure, listbox, radiogroup, switch, toolbar, tree, treegrid, menu, menu-button, dialog, dropdown-menu, carousel, combobox, feed, tooltip, meter, navtree
- **none** (6): alert, breadcrumb, composite, grid, landmarks, link, slider, slider-multithumb, spinbutton, table, window-splitter

> 참고: 일부 `none` 패턴은 scripts/apg/에 TestScript가 있지만 .apg.test.ts가 없음

## 라우팅

승인 후 → `/go` (apg-dt-standard) — #1-#3 sidebar UI, #4 DT 표준 listbox 추가
