# archive-cleanup

## Context

Claim: 아카이브 정리를 실행하면서 프로젝트 스캐폴딩 v2 설계의 입력이 될 인사이트를 축적한다. 정리 자체가 목적이 아니라, 정리 경험에서 구조적 패턴을 추출하는 것이 목적.

Before → After:
- Before: 296 markdown files across W08/W10/W11. 구조적 의문 없이 기계적 매장
- After: ~50 files 보존 + `scaffold-insights.md`에 애매한 판단·패턴·구조적 의문 누적

3-Gate Test (정리 기준):
1. 코드에서 읽을 수 있는가? → 삭제
2. 살아있는 문서에 반영되어 있는가? → 삭제
3. 둘 다 아닌가? (기각된 대안, 교훈, 안 간 길) → 보존

Risks:
- 보존 판정 실수 시 git restore로 복구 가능 (low risk)

## Now

- [x] T1. scaffold-insights.md 생성 ✅
- [x] T2. W08 정리 — 42→15 files ✅
- [x] T3. W01 정리 — 8→1 files ✅
- [x] T4. W10 정리 — 178→32 files ✅
- [x] T5. W11 정리 — 74→20 files ✅
- [x] T6. 최종 검증 — 296→68 files (77% 삭제), 11 insights 기록 ✅

## Done

## Unresolved
- 스캐폴딩 v2 구체 설계 (인사이트 축적 후 결정)

## Ideas
- `/archive` 워크플로우에 3-Gate Test 자동 적용 로직 통합
- `/project` 스킬 + `/archive` 스킬 동시 업데이트
