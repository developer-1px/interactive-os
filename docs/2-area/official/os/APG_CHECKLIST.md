# APG Keyboard Interaction Checklist

> W3C ARIA Authoring Practices Guide에서 추출한 키보드 상호작용 명세.
> **이 문서는 변하지 않는다.** APG는 W3C 표준이며, 우리 OS SPEC의 교차 검증 원천이다.
>
> Source: https://www.w3.org/WAI/ARIA/apg/patterns/
> Last extracted: 2026-02-18

---

## 범례

| 기호 | 의미 |
|------|------|
| ✅ | 구현 + 테스트 완료 |
| ⚠️ | 구현됨, 테스트 부족 또는 부분 구현 |
| ❌ | 미구현 |
| 🔲 | 해당 없음 (앱에서 아직 사용 안함) |
| (O) | APG에서 Optional |

---

## 1. Focus Management (공통)

> APG 전 패턴에 공통 적용. Source: [Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)

| # | 요구사항 | APG 근거 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| F1 | Zone 진입 시 첫 번째 focusable element에 focus | Listbox, Tree, Toolbar 공통 | §3.2 entry: first | ✅ |
| F2 | Zone 재진입 시 마지막 focus 위치 복원 (선택적) | Toolbar: "optionally set on the control that last had focus" | §3.2 entry: restore | ✅ |
| F3 | 선택 있을 때 zone 진입 시 선택된 아이템에 focus | Listbox, Tree: "focus is set on the selected option" | §3.2 entry: selected | ⚠️ |
| F4 | Focus는 disabled element를 건너뛴다 | Toolbar: "first control that is not disabled" | — | ❌ |
| F5 | DOM focus ≠ selection (구분 유지) | Listbox Note 1 | §3.4 followFocus 구분 | ✅ |
| F6 | aria-activedescendant 지원 (virtual focus) | Listbox Note 2 | §4 project.virtualFocus | ✅ |
| F7 | Focus recovery: 삭제 시 인접 아이템으로 이동 | Tabs: "sets focus on the tab following the tab that was closed" | §2 recoveryTargetId | ⚠️ |
| F8 | Zone 빈 영역 클릭 시 zone 활성화 | 브라우저 기본 동작 | FOCUS(zoneId, null) | ✅ |

---

## 2. Arrow Navigation (Navigate Command)

> Source: Listbox, Tree View, Toolbar, Tabs, Grid

### 2.1 기본 방향 이동

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| N1 | Down Arrow → 다음 아이템 (vertical) | Listbox, Tree | §3.2 orientation:vertical | ✅ |
| N2 | Up Arrow → 이전 아이템 (vertical) | Listbox, Tree | §3.2 orientation:vertical | ✅ |
| N3 | Right Arrow → 다음 아이템 (horizontal) | Toolbar, Tabs | §3.2 orientation:horizontal | ✅ |
| N4 | Left Arrow → 이전 아이템 (horizontal) | Toolbar, Tabs | §3.2 orientation:horizontal | ✅ |
| N5 | Grid: 2D 방향 이동 (상하좌우) | Grid | §3.2 orientation:both | ⚠️ |

### 2.2 경계 동작

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| N6 | 경계에서 wrap (선택적) | Toolbar, Tabs: "may wrap" | §3.2 loop:true | ✅ |
| N7 | 경계에서 정지 | Listbox 기본 | §3.2 loop:false | ✅ |
| N8 | disabled item 건너뛰기 | 모든 패턴 암시 | — | ❌ |

### 2.3 Home / End

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| N9 | Home → 첫 번째 아이템 | Listbox(O), Tree, Toolbar(O), Tabs(O) | NAVIGATE first? | ⚠️ |
| N10 | End → 마지막 아이템 | Listbox(O), Tree, Toolbar(O), Tabs(O) | NAVIGATE last? | ⚠️ |

### 2.4 Tree-specific

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| N11 | Right Arrow: 닫힌 노드 → 열기 | Tree View | §3.7 + Navigate | ✅ |
| N12 | Right Arrow: 열린 노드 → 첫 자식으로 이동 | Tree View | Navigate | ⚠️ |
| N13 | Left Arrow: 열린 노드 → 닫기 | Tree View | §3.7 + Navigate | ✅ |
| N14 | Left Arrow: 자식 노드 → 부모로 이동 | Tree View | Navigate | ⚠️ |
| N15 | * (asterisk): 같은 레벨 모든 노드 확장 | Tree View (O) | — | 🔲 |

---

## 3. Tab Navigation (Tab Command)

> Source: Dialog, Toolbar, Tabs, Listbox

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| T1 | Tab → zone 탈출 (escape) | Toolbar, Listbox | §3.3 behavior:escape | ✅ |
| T2 | Tab → zone 내 순환 (trap) | Dialog: "Tab stays inside dialog" | §3.3 behavior:trap | ✅ |
| T3 | Tab → zone 내 이동 + 경계 탈출 (flow) | Tabs: tab→tabpanel | §3.3 behavior:flow | ✅ |
| T4 | Cross-zone wrap: 마지막 → 첫 zone | 브라우저 네이티브 | resolveTabEscapeZone wrap | ✅ |
| T5 | Shift+Tab → 역방향 | 모든 패턴 | §3.3 direction:backward | ✅ |

---

## 4. Selection (Select Command)

> Source: Listbox, Tree View

### 4.1 Single Selection

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| S1 | Click → 선택 (replace) | Listbox | §3.4 mode:single | ✅ |
| S2 | Selection follows focus (선택적) | Listbox Note 3, Tabs | §3.4 followFocus:true | ✅ |
| S3 | Enter/Space → 선택 (followFocus=false일 때) | Tabs, Tree | §3.5 ACTIVATE | ✅ |

### 4.2 Multi Selection — Recommended Model

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| S4 | Space → 현재 아이템 토글 | Listbox, Tree | OS_CHECK? SELECT toggle? | ⚠️ |
| S5 | Shift+Arrow → 이동 + 토글 | Listbox(O), Tree(O) | — | ❌ |
| S6 | Shift+Space → contiguous 범위 선택 | Listbox(O), Tree(O) | — | ❌ |
| S7 | Ctrl+Shift+Home → 처음까지 전체 선택 | Listbox(O), Tree(O) | — | 🔲 |
| S8 | Ctrl+Shift+End → 끝까지 전체 선택 | Listbox(O), Tree(O) | — | 🔲 |
| S9 | Ctrl+A → 전체 선택 | Listbox(O), Tree(O) | OS_SELECT_ALL | ✅ |

### 4.3 Multi Selection — Alternative Model

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| S10 | Ctrl+Arrow → 선택 변경 없이 포커스 이동 | Listbox, Tree | — | ❌ |
| S11 | Ctrl+Space → 포커스된 아이템 토글 | Listbox, Tree | — | ❌ |
| S12 | Shift+Arrow → 이동 + 토글 | Listbox, Tree | — | ❌ |

### 4.4 Mouse Selection

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| S13 | Click → replace selection | 일반 | resolveMouse | ✅ |
| S14 | Cmd/Ctrl+Click → toggle | 표준 OS | resolveMouse | ✅ |
| S15 | Shift+Click → range selection | 표준 OS | resolveMouse | ✅ |

---

## 5. Activation (Activate Command)

> Source: Listbox, Tree, Tabs, Button

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| A1 | Enter → 활성화 (기본 동작) | Tree, Listbox | §3.5 ACTIVATE | ✅ |
| A2 | Space → 활성화 (버튼 역할) | Button, Tree | §3.5 ACTIVATE / OS_CHECK | ✅ |
| A3 | 더블클릭 → 활성화 | 표준 OS 관례 | — | ❌ |

---

## 6. Expand / Collapse (Expand Command)

> Source: Tree View, Accordion, Disclosure

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| E1 | Enter/Space → 토글 (parent node) | Tree: "Enter activates a node" | §3.5 ACTIVATE → expand | ✅ |
| E2 | Right Arrow → 열기 (닫힌 노드) | Tree | Navigate + Expand | ✅ |
| E3 | Left Arrow → 닫기 (열린 노드) | Tree | Navigate + Expand | ✅ |
| E4 | Click → 토글 (disclosure, accordion) | Disclosure | Mouse → ACTIVATE | ✅ |
| E5 | Treeitem: Click은 expand 안 함 (keyboard-only) | APG convention | isClickExpandable | ✅ |

---

## 7. Dismiss (Escape Command)

> Source: Dialog, Menu, Combobox

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| D1 | Escape → 닫기 (dialog, menu, overlay) | Dialog, Menu | §3.5 ESCAPE dismiss:close | ✅ |
| D2 | Escape → 선택 해제 | — | §3.5 ESCAPE dismiss:deselect | ✅ |
| D3 | 닫을 때 invoker에 focus 복원 | Dialog Note 6 | §3.1 STACK_POP | ✅ |
| D4 | Invoker 삭제 시 logical 위치로 focus | Dialog Note 6 | — | ⚠️ |
| D5 | Outside click → 닫기 | Dialog 관례 | §3.5 dismiss.outsideClick | ✅ |

---

## 8. Dialog (Modal) — trap 패턴

> Source: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

| # | 요구사항 | APG 근거 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| M1 | 열릴 때 dialog 내부 element에 focus | "focus moves to an element inside the dialog" | §3.9 OVERLAY_OPEN | ⚠️ |
| M2 | Tab은 dialog 내부에서만 순환 | "Tab does not move focus outside the dialog" | §3.3 behavior:trap | ✅ |
| M3 | Shift+Tab도 dialog 내부 순환 | 위와 동일 | §3.3 direction:backward + trap | ✅ |
| M4 | Escape → dialog 닫기 | "Escape: Closes the dialog" | §3.5 ESCAPE | ✅ |
| M5 | 닫힐 때 invoker로 focus 복원 | "focus returns to the element that invoked the dialog" | §3.1 STACK_POP | ✅ |
| M6 | Background inert (비활성) | "users cannot interact with content outside" | — | ⚠️ |
| M7 | Initial focus: 첫 focusable 또는 제목 | "Generally, focus is initially set on the first focusable element" | — | ⚠️ |

---

## 9. Typeahead

> Source: Listbox, Tree View

| # | 요구사항 | APG 패턴 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| Y1 | 한 글자 입력 → 매칭 아이템으로 이동 | Listbox, Tree | navigate.typeahead | ✅ |
| Y2 | 빠른 연속 입력 → 문자열 매칭 | Listbox, Tree | typeahead accumulator | ⚠️ |

---

## 10. Toolbar 패턴

> Source: [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

| # | 요구사항 | APG 근거 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| B1 | Tab → toolbar 진입/탈출 | "Tab moves focus into and out of the toolbar" | §3.3 behavior:escape | ✅ |
| B2 | Arrow → toolbar 내 이동 | "Left/Right Arrow moves focus" | §3.2 orientation:horizontal | ✅ |
| B3 | Home → 첫 번째 control | "Home: Moves focus to first element" | — | ⚠️ |
| B4 | End → 마지막 control | "End: Moves focus to last element" | — | ⚠️ |

---

## 11. Tabs 패턴 (Tablist)

> Source: [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

| # | 요구사항 | APG 근거 | OS SPEC | 상태 |
|---|---------|---------|---------|------|
| L1 | Tab → 활성 tab에 focus, 다시 Tab → tabpanel로 | "places focus on the active tab element" | §3.3 behavior:escape | ⚠️ |
| L2 | Arrow → tab 간 이동 (wrap) | "Left/Right Arrow moves focus" | §3.2 loop:true | ✅ |
| L3 | Space/Enter → tab 활성화 | "activates the tab if not activated automatically" | §3.5 ACTIVATE | ✅ |
| L4 | Home → 첫 tab | Tabs(O) | — | ⚠️ |
| L5 | End → 마지막 tab | Tabs(O) | — | ⚠️ |
| L6 | 자동 활성화 (selection follows focus) | Tabs Note | §3.4 followFocus:true | ✅ |
| L7 | Delete → tab 삭제 + 다음 tab focus | Tabs(O): "deletes the current tab" | — | 🔲 |

---

## 12. Scroll

> 명시적 APG 패턴은 없지만, focus 이동 시 스크롤은 OS 기본.

| # | 요구사항 | 근거 | OS SPEC | 상태 |
|---|---------|------|---------|------|
| R1 | Focus 이동 시 scroll into view | 브라우저 기본 | §4 Effect:scroll | ✅ |
| R2 | Page Up/Down → 한 페이지 이동 | Grid, Listbox 관례 | — | 🔲 |

---

## Gap Summary

### 🔴 Critical (구현 필요)

| ID | 설명 | 위험도 |
|----|------|--------|
| F4 | disabled item 건너뛰기 (navigate + tab) | 높음: a11y 위반 |
| F7 | Focus recovery 로직 검증 | 높음: 상태 필드만 있고 동작 미검증 |
| S5 | Shift+Arrow 이동+토글 | 중간: multi-select 앱에서 필수 |
| S10 | Ctrl+Arrow 선택 변경 없이 이동 | 중간: multi-select 대안 모델 |

### 🟡 Warning (테스트 부족)

| ID | 설명 |
|----|------|
| F3 | entry:selected 동작 검증 |
| N5 | Grid 2D 이동 E2E |
| N9-10 | Home/End 키 바인딩 확인 |
| M1,M6,M7 | Dialog initial focus, inert background |
| Y2 | Typeahead 연속 입력 |

### ⬜ Not Yet Needed (앱 미사용)

| ID | 설명 |
|----|------|
| N15 | * 으로 같은 레벨 전체 확장 |
| S7-8 | Ctrl+Shift+Home/End 범위 선택 |
| L7 | Tab 삭제 |
| R2 | Page Up/Down |
