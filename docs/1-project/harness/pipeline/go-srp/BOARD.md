# go-srp

| Key | Value |
|-----|-------|
| Claim | `/go`는 판단+라우팅만 한다. 절차·프로토콜·검증 기준은 각 스킬/에이전트가 소유한다 |
| Before | `/go`가 §Spec Self-Check 절차(24줄), §Spec Verifier/QA/Meta QA 프로토콜(80줄), 검증 기준 테이블(12행)을 중앙 관리. 파이프라인: green→simplify→reflect→bind |
| After | `/go`는 순수 라우터. 파이프라인: `red→green→self-check→refactor→bind`. self-check FAIL→/red 루프백. 에이전트는 자기 AGENT.md가 프로토콜 소유. 각 스킬이 Exit Criteria 소유 |
| Size | Meta |
| Risk | 스킬 간 Exit Criteria 형식이 통일되지 않으면 /go가 "통과 여부"를 판단하기 어려울 수 있음 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | `/self-check` 스킬 생성 | SKILL.md 존재 + spec→import chain 추적 절차 완전 | ⬜ | |
| T2 | `/go` 슬림화 — 파이프라인 재작성 + 프로토콜/검증표 제거 | /go에 절차/프로토콜 0줄 + 참조 정합 | ⬜ | |
| T3 | `/plan`에 `/divide` 전제 추가 | /plan에 /divide Step 0 존재 | ⬜ | |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| — | — | — |
