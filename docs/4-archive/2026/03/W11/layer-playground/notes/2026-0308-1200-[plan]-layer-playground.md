# Plan: Layer Playground

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `src/routes/_minimal/playground.layers.tsx` | 파일 없음 | `createFileRoute("/_minimal/playground/layers")` + staticData(title, icon, location, order). APG route와 동일 패턴 | Clear | — | tsc 0, 브라우저에서 `/playground/layers` 접속 가능 | routeTree.gen.ts 자동 생성 확인 필요 |
| 2 | `src/routes/_minimal/playground.layers.$pattern.tsx` | 파일 없음 | `createFileRoute("/_minimal/playground/layers/$pattern")` + LayerShowcasePage 컴포넌트 연결 | Clear | →#1 | tsc 0 | — |
| 3 | `src/pages/layer-showcase/index.tsx` | 파일 없음 | APG showcase 구조 복제: 사이드바(Zone tablist) + 메인(ActiveComponent 렌더). PATTERNS 레지스트리에 dialog부터 등록 | Clear | →#1 | tsc 0, 사이드바 네비게이션 동작 | APG 코드와 중복은 의도적 (관심사 분리) |
| 4 | `src/pages/layer-showcase/patterns/DialogPattern.tsx` | 파일 없음 | `defineApp("layer-dialog")` + Radix Dialog compound 사용. 시나리오: (a) basic open/close (b) focus trap Tab cycling (c) Escape dismiss + focus restore (d) form 내용 포함 | Clear | →#3 | tsc 0, 브라우저에서 Dialog open/close/focus-restore 동작 | — |
| 5 | `src/pages/layer-showcase/patterns/AlertDialogPattern.tsx` | 파일 없음 | `defineApp("layer-alertdialog")` + `role: "alertdialog"`. 시나리오: (a) confirm/cancel (b) backdrop click 무시 확인 (c) Escape로 닫히지 않음(alertdialog 스펙) | Clear | →#3 | tsc 0 | alertdialog Escape 동작 확인 필요 (OS gap 가능) |
| 6 | `src/pages/layer-showcase/patterns/MenuPattern.tsx` | 파일 없음 | `defineApp("layer-menu")` + `createTrigger({ role: "menu" })`. MenuButtonPattern 참고. 시나리오: (a) click open (b) arrow nav + loop (c) Enter activate (d) Escape close + focus restore (e) outside click dismiss | Clear | →#3 | tsc 0 | — |
| 7 | `src/pages/layer-showcase/patterns/PopoverPattern.tsx` | 파일 없음 | `defineApp("layer-popover")` + `createTrigger({ role: "popover" })`. 시나리오: (a) click toggle (b) non-modal (Tab exits popover) (c) outside click dismiss (d) Escape close | Clear | →#3 | tsc 0 | popover non-modal Tab 동작 확인 (OS gap 가능) |
| 8 | `src/pages/layer-showcase/patterns/ListboxDropdownPattern.tsx` | 파일 없음 | `defineApp("layer-listbox-dropdown")` + `createTrigger({ role: "listbox" })`. 시나리오: (a) trigger opens listbox popup (b) arrow selection (c) Enter confirms + closes | Complicated | →#3 | tsc 0 | combobox와 차이점 명확화 필요. listbox dropdown은 input 없이 selection만 |
| 9 | `src/pages/layer-showcase/patterns/TooltipPattern.tsx` | 파일 없음 | `defineApp("layer-tooltip")` + `createTrigger({ role: "tooltip" })`. 시나리오: (a) hover show (b) focus show (c) Escape dismiss (d) non-interactive content | Complicated | →#3 | tsc 0 | hover trigger headless 미지원 - OS gap 발견 예상 |
| 10 | `src/pages/layer-showcase/patterns/NestedPattern.tsx` | 파일 없음 | `defineApp("layer-nested")`. 시나리오: (a) Dialog -> Dialog LIFO (b) Escape closes top only (c) focus restore chain | Complicated | →#4 | tsc 0 | 중첩 overlay stack 시각 검증이 목적 |

## MECE 점검

1. **CE**: #1-#3(인프라) + #4-#10(7개 overlay type) = 전체 overlay 커버리지. 목표 달성 O
2. **ME**: 각 파일이 독립. 중복 없음
3. **No-op**: Before=After 없음 (모두 신규 생성)

## Cynefin 해소

- **#8 (Listbox Dropdown)**: Complicated -> `createTrigger({ role: "listbox" })` 프리셋이 존재하고, menu와 동일한 popover 메커니즘. arrow nav + selection만 다름. **Clear로 승격.**
- **#9 (Tooltip)**: Complicated -> hover trigger는 TriggerRole 프리셋에 `onHover: true` 존재하지만 headless 미지원. **showcase 작성은 Clear. OS gap 발견은 개밥먹기의 목적이므로 진행.**  Clear로 승격.
- **#10 (Nested)**: Complicated -> dialog.apg.test.ts에 LIFO 테스트 존재. DOM 레벨 시각화만 추가. **Clear로 승격.**

**전행 Clear.**

## 라우팅

승인 후 -> `/project` (layer-playground) — APG 도메인 하위 신규 프로젝트. 7개 overlay showcase 생성
