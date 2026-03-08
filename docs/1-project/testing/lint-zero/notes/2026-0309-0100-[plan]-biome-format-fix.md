# Plan: T1 — biome format + organizeImports 자동 수정

> Claim: `biome check --write` safe fix로 format(52) + organizeImports(~20) + FIXABLE lint(~2) 에러를 일괄 해소.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 검증 |
|---|------|--------|-------|---------|------|
| 1 | format 에러 52건 | biome format 위반 | `biome format --write` 자동 수정 | Clear | biome check format 0 |
| 2 | organizeImports ~20건 | import 순서 불일치 | `biome check --write` 자동 수정 | Clear | biome check assist 0 |
| 3 | FIXABLE lint ~2건 | noInteractiveElementToNoninteractiveRole 등 | `biome check --write` 자동 수정 | Clear | biome check error count 감소 |

## 위험

- biome format이 ESLint와 충돌할 수 있음 → Prettier 없음 확인. ESLint는 formatting rule 없음
- tsc 깨질 수 있음 → format/import 정렬만이므로 타입 영향 없음
- vitest 깨질 수 있음 → 코드 로직 변경 없으므로 영향 없음

## 실행

`npx biome check --write` → git diff 확인 → commit
