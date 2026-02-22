# defineApp Unification

## Why

defineApp의 소비 패턴이 앱마다 분산되어 에이전트가 매번 동일한 의사결정을 반복한다.
API의 Pit of Success가 부재하여 올바른 사용법보다 잘못된 사용법이 더 쉽다.

## Goals

1. **Headless-first canonical usage 확립** — 상태→조건→커맨드→뷰 바인딩 하향 정의 관례 확정
2. **createTrigger를 Pit of Success로** — 타입 안전한 factory overload, disabled/focus/aria 자동 처리
3. **앱 간 소비 패턴 수렴** — Todo/Builder가 동일한 패턴을 따르도록 통일

## Scope

- `src/os/defineApp.ts` 및 관련 모듈 (`defineApp.trigger.ts`, `defineApp.bind.ts`, `defineApp.types.ts`)
- `src/apps/todo/app.ts`, `src/apps/builder/app.ts` 마이그레이션
- 뷰 레이어의 OS 원시 Trigger import 제거

## Non-Goals

- kernel 내부 변경
- 새 앱 추가
