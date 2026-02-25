# decision-table-contract

## Context

Claim: 8열 결정 테이블(Zone/Given/When/Intent/Condition/Command/Effect/Then)을 SSoT로 두고, 행 수 = 테스트 수 = 바인딩 수로 동형 강제하면, LLM의 습관적 일탈을 구조적으로 차단하면서 구현의 자유는 보장하는 계약 구조가 된다.

Before → After: `/red` Step 1이 비정형 결정 테이블 → 8열 표준 포맷 + 템플릿 + Intent 컷 전략

Risks: when-router 미구현으로 bind() 행 수 ≠ 표 행 수. 연쇄 시나리오는 단일 행으로 표현 불가.

## Now

(없음 — 모든 태스크 완료)

## Done

| Task | Description | Evidence |
|------|-------------|----------|
| T2 | Todo 결정 테이블 23행 vs 기존 테스트 31 it() 갭 분석 | 23/23 매핑 완료. 누락 입력 3건(Home/End/F2), 연쇄 2건, 속성 3건 식별. `notes/2026-0225-T2-gap-analysis.md` ✅ |
| T1 | `/red` Step 1의 기존 sub-step들을 8열 구조로 재정렬 | `red.md` Step 1-1~1-6 → Step 1-A~F. 분리 3표 → 단일 8열 점진 채움 ✅ |
| T3 | 검증 체크리스트를 /red 완료 조건에 반영 | `red.md` 완료 기준에 MECE 체크 5항목 추가 ✅ |
| T0 | 8열 결정 테이블 템플릿 생성 + /red 참조 연결 | `.agent/workflows/documantaion/decision-table.md` 생성, `red.md` Step 1 갱신 ✅ |

## Unresolved

- U1: 연쇄 시나리오(Dialog→Toast→Undo) 표현 — 별도 시퀀스 테이블? 연쇄 행?
- U2: 마우스 인터랙션(click, re-click, DnD) 통합 기준

## Ideas

- 결정 테이블에서 테스트 skeleton 자동 생성 스크립트
- /red Step 2에서 "표 행 번호 = it() 이름 접두어" 강제
