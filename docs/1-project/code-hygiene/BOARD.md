# code-hygiene

> **Type**: Light
> **Origin**: trigger-listener-gap에서 os import 누락 사고 → 검증 인프라 부재 발견

## Context

Claim: 모든 lint error/warning + test failure를 0으로 만들고, husky로 자동 검증 강제.

Before: 540 eslint errors, 20 test failures, git hook 없음 — AI가 /verify 안 돌려도 commit 가능
After: 0 eslint errors, 0 test failures, pre-commit(tsc+eslint) + pre-push(vitest) 강제

Risks: 기존 any 타입 340건 → 한번에 다 잡으면 regression 위험

## Now
- [ ] T1: eslint `no-explicit-any` 340건 해소 (점진적, 모듈별)
- [ ] T2: eslint `react-refresh/only-export-components` 40건 해소
- [ ] T3: eslint `ban-ts-comment` 10건 해소 (설명 추가)
- [ ] T4: eslint `Function` type 24건 → 구체적 타입으로
- [ ] T5: react strict mode warnings 33건 해소
- [ ] T6: test failures 20건 수정
- [ ] T7: husky pre-commit (tsc --noEmit + eslint --max-warnings 0) 설정
- [ ] T8: husky pre-push (vitest run) 설정
- [ ] T9: /go workflow에 commit 단계 추가 (/green 완료 → git commit)

## Done

## Unresolved
