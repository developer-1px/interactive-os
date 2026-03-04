# top-down-enforcement

## Context

Claim: defineApp = Application Context. 모든 OS primitive(Zone/Item/Trigger)는 defineApp()으로부터 top-down 생성만 허용. bottom-up 직접 조립 금지. raw primitive는 internal export로 이동.

Before → After:
- Before: Zone/Item/Trigger는 public export. 어디서든 직접 import하여 조립 가능. orphan zone 발생, 수동 배선(onAction) 유발.
- After: bind() 결과만 public. raw primitive는 `@os-react/internal` 에서만 접근. 개발자 API = defineApp → createZone → bind 3단계만.

Risks:
- 28개 기존 파일의 import 경로 변경 필요 (Phase 2) 
- createAction API 설계가 미확정

## Now

(empty)

## Done

- [x] T1: `@os-react/internal` barrel 생성 + Zone/Item/Trigger re-export — tsc 0 ✅
- [x] T2: 앱 코드 35개 import를 `@os-react/internal`로 변경 — tsc 0 ✅
- [x] T3: 중복 import 10개 파일 자동 병합 — tsc 0 | 20개 파일 완료 ✅

## Unresolved

(empty — T4 + action축 관련 3건 모두 action-axis-unification 프로젝트로 의도적 이관)

## Ideas

- Phase 2: 기존 앱을 defineApp → bind 패턴으로 전환 (앱별 순차)
- ESLint rule: `@os-react/internal` import를 앱 코드에서 경고
