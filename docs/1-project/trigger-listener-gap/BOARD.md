# trigger-listener-gap

> **Type**: OS
> **Origin**: dropdown-dismiss 세션에서 발견
> **Plan**: `notes/2026-0226-1913-plan-push-model.md`

## Context

Claim: item 콜백(onActivate)을 zone.bind에 선언 → push 모델. FocusItem useLayoutEffect 제거.
Before: onActivate는 FocusItem useLayoutEffect(React pull) → headless 미동작
After: onActivate를 zone.bind triggers로 선언 → goto에서 push → headless 자동 동작

## Now
- [ ] T1: zone.bind에 triggers 타입+구현 추가 (plan #1-#2)
- [ ] T2: goto()에서 triggers 자동 setItemCallback (plan #3-#4)
- [ ] T3: LocaleSwitcher sidebar.bind에 trigger 선언 + 테스트 수동 setup 제거 (plan #5-#6)
- [ ] T4: FocusItem useLayoutEffect(onActivate) 제거 (plan #7)

## Done

## Unresolved
- FocusItem.id 전역 유일성 경고 (별도 태스크)
- FocusItem useLayoutEffect(disabled) → push 모델 전환 (별도 태스크)
