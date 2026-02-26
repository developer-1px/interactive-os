# /divide Report — Trigger overlay open 설계 이전

## Iteration Log

| # | Node | Before | After | Cynefin Cycle | Action |
|---|------|--------|-------|---------------|--------|
| 1 | Root: Trigger overlay open 이전 | Complex | → 3 children | PSR | MECE split by 소비자/메커니즘/영향 |
| 2 | A: Trigger 사용처 | Complicated | Clear | SAR | grep: 2곳 overlay role 사용 (LocaleSwitcher, Dialog.tsx) |
| 3 | B: onClick → onActivate 경로 | Complicated | Clear | SAR | Trigger.Dismiss가 이미 onActivate 패턴 사용 (L394). TriggerBase만 누락 |
| 4 | C: handleClick 제거 영향 | Complicated | Clear | Verify | non-overlay Trigger(ListView)는 onActivate prop으로 동작 — 영향 없음 |

## Issue Tree (Final)

| Leaf Node (Work Package) | Hypothesis Statement | Evidence |
|--------------------------|---------------------|----------|
| A. TriggerBase에 onActivate 등록 | `overlayRole && overlayId`일 때, FocusItem에 `onActivate: OS_OVERLAY_OPEN({id, type})`를 넘기면 OS_ACTIVATE가 overlay를 열 수 있다 | `Trigger.tsx:L180` — FocusItem(id)은 있으나 onActivate 미등록. `Trigger.tsx:L394` — Trigger.Dismiss는 이미 onActivate 패턴 사용 |
| B. handleClick에서 overlay 코드 제거 | onClick의 overlay open 로직(L125-127)을 제거하면 React 의존 경로가 사라진다 | `Trigger.tsx:L119-135` — handleClick에서 overlayRole 분기 |
| C. headless simulateClick 검증 | simulateClick → OS_ACTIVATE → onActivate → OS_OVERLAY_OPEN 경로가 동작하는지 확인 | `headless.ts:L259-276` — resolveClick → OS_ACTIVATE 경로 존재 |
| D. Dialog.tsx 호환성 | Dialog.tsx는 `<Trigger role={role} overlayId={id}>`를 사용 — 동일 변경으로 커버됨 | `Dialog.tsx:L86` |

## Residual Uncertainty

- `Trigger`에 `id`가 없는 경우의 overlay: 현재 `id` 없이 `role="menu"`만 쓸 수 있으나, FocusItem은 id가 필수. → id 없는 overlay Trigger는 여전히 React onClick 필요?
  - **확인**: LocaleSwitcher는 `id="locale-switcher-trigger"` 없음. Trigger에 id prop 안 내림. → id가 없으면 FocusItem 안 됨 (L177 분기). **이 경우 별도 처리 필요.**
