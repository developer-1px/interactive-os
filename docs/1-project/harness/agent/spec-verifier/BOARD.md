# spec-verifier

| Key | Value |
|-----|-------|
| Claim | QA Gate 1(spec-drift)을 독립 agent로 분리하고, LLM 판단 대신 vitest 실행으로 판정한다 |
| Before | QA agent가 4 Gate를 혼자 수행. Gate 1 = spec 시나리오↔test 토픽 매칭 (LLM 판단). recsection-enhance T4에서 순수함수 테스트만 있었는데 PASS 판정 |
| After | Spec Verifier agent가 spec에서 독립 테스트를 작성→vitest run→pass/fail. QA agent는 Gate 2~4만 담당. /go 파이프라인: Verifier → QA 순서 |
| Size | Meta |
| Risk | Spec Verifier가 짠 테스트가 오탐할 수 있음 (허용 — 놓치는 것보다 낫다) |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | Spec Verifier AGENT.md 작성 | `.claude/agents/spec-verifier/AGENT.md` 존재 + 절차 명확 | ✅ | `.claude/agents/spec-verifier/AGENT.md` 생성 |
| T2 | QA AGENT.md에서 Gate 1 제거 | Gate 1 섹션 없음, Gate 1~3(review, contract, simplicity)만 남음 | ✅ | Gate 1(Spec Drift) 제거, 4→3 Gate 리넘버링 |
| T3 | /go SKILL.md 파이프라인에 Spec Verifier 단계 삽입 | #13에 Spec Verifier, #15에 QA. FAIL 시 QA 스킵 | ✅ | #13-17 재구성 + §Spec Verifier 섹션 + workflows/go.md 동기화 |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
