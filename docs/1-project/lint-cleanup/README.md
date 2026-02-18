# Lint Cleanup

## WHY
`/fix` 검증에서 633 warnings + 32 errors가 발견됨. 기능 코드 변경 없이 누적된 기술 부채.
빌드/런타임에 영향은 없지만, 코드 품질과 유지보수성을 저해한다.

## Goals
1. `biome check --write`로 자동 수정 가능한 항목 일괄 정리
2. `knip`으로 미사용 코드/의존성 식별 및 제거
3. 수동 수정이 필요한 항목 분류 및 처리

## Scope
- **In**: format, noUnusedImports, noUnusedVariables, useLiteralKeys, useButtonType, noReExportAll, noNonNullAssertion (FIXABLE 한정)
- **Out**: noExplicitAny (298건 — 별도 타입 강화 프로젝트 필요), noExcessiveCognitiveComplexity (44건 — 리팩토링 필요)
