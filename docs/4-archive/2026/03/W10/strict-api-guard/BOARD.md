# strict-api-guard

> OS 앱 레이어 API의 침묵 실패를 구조적 에러/경고로 전환한다.
> Pit of Success가 실제로 작동하게 만드는 프로젝트.

## Why

OS 철학은 "잘못 만들기가 더 어려운 구조"(Pit of Success)를 표방한다.
그러나 현재 앱 레이어 API 5개 지점에서 잘못된 사용을 **조용히 무시**한다.
`??`, `|| {}` 방어 패턴이 "의도적 미지정"과 "실수"를 구분하지 못한다.

침묵 실패는 Pit의 주적이다. 잘못 쓸 수 있는 것보다, **잘못 쓴 줄 모르는 것**이 더 위험하다.

## Principles

- **Hard error (throw)**: 논리적으로 의도일 수 없는 조합 -> 즉시 throw
- **Dev warning (console.warn)**: 대부분 실수지만 의도일 수도 있는 것 -> 개발 시 경고
- 프로덕션 견고성은 유지한다. throw는 명백한 논리 오류에만.

---

## Now

(All tasks complete — pending /audit)

---

## Done

- [x] T1. createTrigger() id 없는 onActivate throw — tsc 0 | +4 tests | 1975 pass
- [x] T2. Item onActivate dead prop 정리 — tsc 0 | ItemProps에서 onActivate 제거, TriggerBase/TriggerDismiss cleanup
- [x] T3. Zone role 잘못된 role 문자열 warn — tsc 0 | +3 tests | 1975 pass (throw -> warn 전환: "button","list" 등 비-ZoneRole이 실제 사용 중)
- [x] T4. Field getValue 미등록 필드 경고 — tsc 0 | +2 tests | 1975 pass
- [x] T5. TriggerBinding 미매칭 item 경고 — tsc 0 | +1 test | 1995 pass ✅
