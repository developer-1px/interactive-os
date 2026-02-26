# code-hygiene

> **Type**: Light
> **Origin**: trigger-listener-gap에서 os import 누락 사고 → 검증 인프라 부재 발견

## Context

Claim: tsc + eslint error 0, test failure 0, husky 자동 검증 강제.

Before: 226 tsc errors, 540 eslint errors, 20 test failures, git hook 무력
After: 0 errors 전부, pre-commit(tsc -b) + pre-push(vitest) 강제

## Now
- [ ] T1: tsc -b 에러 226건 해소 (pre-commit gate 활성화 전제조건)
- [ ] T2: eslint `no-explicit-any` ~340건 해소
- [ ] T3: eslint 기타 에러 ~200건 해소 (react-refresh, ban-ts-comment, Function type 등)
- [ ] T4: test failures 20건 수정
- [ ] T5: husky pre-commit (tsc -b --noEmit) 활성화 — T1 완료 후
- [ ] T6: husky pre-push (vitest run) 추가 — T4 완료 후
- [ ] T7: lint-staged (eslint --max-warnings 0) 활성화 — T2+T3 완료 후
- [ ] T8: /go workflow에 commit 단계 추가 (/green → git commit, /red → git commit --no-verify)

## Done

## Unresolved
