# spec-verifier

Spec Verifier agent 신설 + QA agent에서 Gate 1 분리.

QA의 spec-drift 검증이 LLM 판단에 의존하여 recsection-enhance T4를 놓친 사건에서 출발.
해결: spec에서 독립 테스트를 작성하고 vitest로 실행. 기계적 판정.
