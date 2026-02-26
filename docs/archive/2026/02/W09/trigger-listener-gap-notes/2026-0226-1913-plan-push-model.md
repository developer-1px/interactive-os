# Plan: trigger-listener-gap — onActivate push 모델 전환

> Claim: item 콜백(onActivate)을 zone.bind에 선언 → push 모델. FocusItem useLayoutEffect 제거.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `defineApp.ts:zone.bind()` 타입 | `triggers` 필드 없음 | `triggers?: TriggerBinding[]` 추가. `{id, onActivate, when?}` | Clear | — | tsc 0 | 기존 bind 호출에 영향 없음 (optional) |
| 2 | `defineApp.ts:zone.bind()` 구현 | `zoneBindingEntries`에 trigger 정보 미저장 | trigger 정보를 `zoneBindingEntries`에 저장 | Clear | →#1 | tsc 0 | — |
| 3 | `defineApp.page.ts:ZoneBindingEntry` | trigger 필드 없음 | `triggers?: TriggerBinding[]` 추가 | Clear | →#1 | tsc 0 | — |
| 4 | `defineApp.page.ts:goto()` | trigger callback 미등록 | goto 시 `setItemCallback` 자동 호출 | Clear | →#2,#3 | +1 test: goto 후 `findItemCallback` 확인 | 기존 goto 동작 변경 없음 |
| 5 | `LocaleSwitcher.tsx:Trigger` | React JSX에만 `id/role/overlayId` 존재 | `sidebar.bind({ triggers: [...] })`에 Trigger 선언 추가 | Clear | →#1 | 기존 locale-dropdown.test.ts에서 수동 `setItemCallback` 제거 | — |
| 6 | `locale-dropdown.test.ts` | `beforeEach`에 수동 `setItemCallback` | 수동 setup 제거. `goto("sidebar")` 만으로 자동 동작 | Clear | →#4,#5 | 🟢 3/3 PASS 유지 | — |
| 7 | `FocusItem.tsx:useLayoutEffect(onActivate)` | L187-194: useLayoutEffect로 setItemCallback | 제거 (push 모델로 대체됨) | Clear | →#4 (goto가 대체) | 기존 113 tests 유지, dialog-focus-trap 10/10 | ⚠️ 다른 앱에서 FocusItem onActivate 직접 사용하는 곳 영향 |

## MECE 점검

1. CE: 1~7 실행하면 목표(수동 setup 0) 달성? → ✅
2. ME: 중복? → #1 #3 유사하지만 파일 다름 → 유지
3. No-op: Before=After? → 없음

## 라우팅
승인 후 → `/go` (trigger-listener-gap) — OS 프로젝트, BOARD 태스크 갱신 후 실행
