# BOARD — Lint Cleanup

## 🔴 Now
(empty)

## ⏳ Done
- [x] T1: biome auto-fix — format(21→3), noUnusedImports(14→0), useLiteralKeys(40→0), noUnusedVariables(6→0), useButtonType(11→0). 총 errors 32→7, warnings 633→559
- [x] T2: knip audit — 1 unused file 삭제 (CommandFactory.ts), duplicate exports 3건은 의도적
- [x] T3: /verify — tsc ✅, unit 521/521 ✅, smoke 9/9 ✅, build ✅, dev recovery ✅

## 💡 Ideas
- noExplicitAny 298건 → 별도 타입 강화 프로젝트
- noExcessiveCognitiveComplexity 43건 → 별도 리팩토링 프로젝트
- noNonNullAssertion 132건 → 점진적 nullable 안전성 강화
- noArrayIndexKey 17건 → stable key 도입 필요
- noBannedTypes 14건 → 타입 강화 시 함께 처리
- noReExportAll 11건 → barrel export 전략 재검토
- format 3건 → 잔여 수동 포매팅 이슈
- toolbar.spec.ts E2E 2건 실패 → aria-pressed 토글 버그 (기존)
