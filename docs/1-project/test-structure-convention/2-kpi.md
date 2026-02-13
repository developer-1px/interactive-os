# KPI: Test Structure Convention

## 성공 기준

| 목표 지표 | 현재 값 | 목표 값 | 측정 방법 |
|-----------|--------|---------|----------|
| `tests/` 외부에 있는 테스트 파일 수 | 11+ | 0 | `find src -name '*.test.ts' -not -path '*/tests/*'` |
| `e2e/` 루트에 있는 spec 파일 수 | 15 | 0 | `find e2e -name '*.spec.ts'` |
| 대시보드 프로젝트 그룹 수 | 0 | 7+ | `/playground/tests` 페이지 확인 |
| Vitest 전체 통과 | ✅ | ✅ | `npx vitest run` |
| Playwright 전체 통과 | ✅ | ✅ | `npx playwright test` |
| Type check 통과 | ✅ | ✅ | `npx tsc --noEmit` |

## 핵심 제약
- 마이그레이션 후 **모든 기존 테스트가 동일하게 통과**해야 한다 (zero regression)
