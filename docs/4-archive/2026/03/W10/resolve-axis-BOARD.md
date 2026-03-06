# resolve-axis

## Context

Claim: Resolve 레이어의 role 하드코딩을 config axis 기반으로 전환하면, toggle button의 2단 점프(onAction 수동 배선)가 사라지고, ZIFT 직교 축 철학과 일치한다.

Before → After:
- Before: `resolveItemKey`가 `switch(role) { checkbox → OS_CHECK, button → OS_ACTIVATE }` 하드코딩
- After: `CheckConfig.keys` + `CheckConfig.onClick`으로 config 기반 claim. role은 preset으로만 사용.

Risks:
- resolveItemKey 핵심 변경 — APG 18패턴 regression 가능
- check.keys 배열 API 형태가 추후 확장에 적합한지 미검증

## Now

(empty)

## Done

- [x] T1: CheckConfig 확장 — `keys`, `onClick` 타입 + default 추가 — tsc 0 ✅
- [x] T2: roleRegistry preset 반영 — checkbox, switch, radio에 새 config — tsc 0 ✅
- [x] T3: senseKeyboard/simulate check 감지 config 기반 전환 — tsc 0 ✅
- [x] T4: resolveKeyboard check keymap config 기반 동적 생성 — tsc 0 | +9 tests | regression 0 ✅
- [x] T5: ButtonPattern `onAction` 수동 배선 제거 — tsc 0 | 18/18 APG button tests PASS | regression 0 ✅

## Unresolved

(empty — Discussion 결론으로 action-axis-unification 프로젝트로 이관)

## Ideas

- resolveItemKey role switch 완전 제거 → action-axis-unification scope
- ROLE_FIELD_TYPE_MAP 제거 → action-axis-unification scope
- SelectConfig.spaceAction → action 축 통합으로 흡수
- createField/createTrigger → per-item action override로 대체 (usage-spec 참조)
