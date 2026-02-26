# trigger-listener-gap

> **Type**: OS
> **Origin**: dropdown-dismiss 세션에서 발견
> **Plan**: `notes/2026-0226-1913-plan-push-model.md`, `notes/2026-0226-1938-plan-phase2.md`

## Context

Claim: OS 컴포넌트에서 React 이벤트 핸들러 제거. browser ≡ headless 단일 경로.
Before: onActivate는 FocusItem useLayoutEffect(React pull) / Trigger는 React onClick으로 우회
After: 모든 상호작용이 OS 파이프라인을 거침. push 모델 통일.

## Now

## Done
- [x] T1: zone.bind에 triggers 타입+구현 추가 — tsc 0 | defineApp.types.ts + defineApp.ts ✅
- [x] T2: goto()에서 triggers 자동 setItemCallback — tsc 0 | +2 tests ✅
- [x] T3: LocaleSwitcher sidebar.bind trigger 선언 + 수동 setup 제거 — 3/3 PASS ✅
- [x] T4: FocusItem useLayoutEffect(onActivate) 제거 — 114 passed, regression 0 ✅
- [x] T5: FocusItem useLayoutEffect(disabled) 제거 — dead code, 0 consumers ✅
- [x] T6: Trigger.tsx handleClick 직접 dispatch 제거 — PointerListener 경유 ✅
- [x] T7: Item.ExpandTrigger/CheckTrigger onClick 제거 — PointerListener 확장 ✅

## Unresolved
- FocusItem.id 전역 유일성 경고 (Claim 무관 — 별도 프로젝트)
