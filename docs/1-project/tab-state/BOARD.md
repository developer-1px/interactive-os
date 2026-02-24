# tab-state

## Context

Claim: OS가 Tab 활성 상태를 관리해야 한다. 앱이 `useState+onClick`으로 우회하는 것은 OS 계약 위반.

Before → After:
- Before: `BuilderTabs.tsx`가 `useState(defaultTab)` + `onClick(() => setActiveIndex(idx))` — 앱이 자체 상태 관리
- After: tablist Zone의 `OS_ACTIVATE` → `aria-selected` 기반 활성 탭 전환. 앱 코드에 `useState+onClick` 0줄.

Backing: WAI-ARIA Tabs 패턴 — `aria-selected`로 활성 탭 표시. OS는 이미 selection에서 `aria-selected`를 관리하지만, tab 활성 상태와 multi-selection은 다른 의미.

Risks:
- Tab 활성(`aria-selected` 단일)과 Selection(`aria-selected` 복수)이 같은 속성을 다른 의미로 사용 → 충돌 가능
- tablist의 activate가 "탭 전환"인지 "탭 내용 편집"인지 구분 필요

## Now
- [ ] T1: tablist activate → aria-selected 전환
  - 🔴 Red: `src/os/3-commands/tests/integration/tab-state.test.ts` — 5 FAIL / 1 PASS
  - tablist role에서 activate(Enter/Click) → 해당 탭 `aria-selected=true` + 이전 탭 해제

## Done

## Unresolved
- Tab `aria-selected`와 Selection `aria-selected`의 관계 정리 (같은 속성, 다른 의미?)
- Tab 활성 상태를 OS state에 어디에 저장? `focusedItemId`와 별도? `selection[0]`으로 재사용?

## Ideas
- tablist role 등록 시 activate 동작을 자동으로 "single selection" 모드로 설정
- `role: "tablist"` → `select: { mode: "single" }` + activate가 selection을 변경
