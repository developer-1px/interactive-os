# Plan: Condition → Trigger disabled 자동 inject

> Discussion에서 도출: command의 `when: Condition`이 false이면, 해당 command를 사용하는 Trigger에 OS가 `disabled` + `aria-disabled`를 자동 투영한다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `defineApp/index.ts` — condition lookup API | `flatHandlerRegistry`에 `{handler, when?}` 저장. createTrigger에서 접근 불가 | createTrigger가 command.type으로 when condition을 lookup할 수 있는 내부 API 노출 | Clear | — | tsc 0 | 없음 (내부 API) |
| 2 | `defineApp/trigger.ts:createSimpleTrigger` | `onActivate: command`만 전달. when 무시 | command.type → registry → when condition 조회. condition이 있으면 `useComputed`로 구독하여 `disabled` prop inject | Clear | →#1 | +2 tests | — |
| 3 | `defineApp/trigger.ts:createDynamicTrigger` | factory로 command 생성. when 무시 | #2와 동일 — factory의 command type으로 when condition lookup | Clear | →#1 | +2 tests | factory에서 type 추출 경로 |
| 4 | `os-react/Trigger.tsx` — disabled prop | disabled prop 없음 | `disabled?: boolean` 추가 → `aria-disabled="true"` + click/activate 차단 | Clear | — | +2 tests (aria-disabled 투영, click 차단) | OS primitive 수정 |
| 5 | headless `attrs()` | disabled 투영 없음 | condition false → `attrs().disabled === true` + `attrs()["aria-disabled"] === "true"` | Clear | →#4 | headless attrs 테스트 | — |
| 6 | Todo app 실증 | `cancelEdit`에 `when: isEditing` 있지만 trigger disabled 수동 연결 | 자동 inject 확인 — isEditing=false → cancelEdit trigger 자동 disabled | Clear | →#2 | 기존 tests 유지 | — |

## MECE 점검

- CE: 6행 실행 → condition→disabled 자동 inject 달성 ✅
- ME: 중복 없음 ✅
- No-op: 없음 ✅

## 라우팅

승인 후 → `/project` — 새 프로젝트 `condition-auto-disabled`. Light 규모 (6 tasks, OS primitive 1개 수정 + SDK 연결).
