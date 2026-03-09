# repro-skill

## Context

Claim: Inspector 관찰을 headless 재현 테스트로 전환하는 `/repro` 스킬이 필요하다. knowledge runbook(SSOT) 하나를 만들고, 각 진입점(rules.md, CLAUDE.md, skill)은 포인터로 연결한다.

Before → After:
- Before: headless test 작성에 4단계 학습 필요 (page API 제약, items 계산, zone setup, cross-zone 패턴). 매 세션 반복. Inspector에서 보이지만 headless에서 재현 못하는 갭 존재.
- After: `/repro` 스킬이 knowledge를 로드하여 "Inspector 로그 → Red headless test"를 1턴에 수행. 어떤 진입점에서든 headless test 작성법에 도달 가능.

핵심 논거:
- W1. headless test는 이 프로젝트 고유 개념 — 외부 지식으로 유추 불가
- W2. `/repro`(관찰 기반) ≠ `/red`(스펙 기반) — 입력이 다르므로 별도 스킬
- W3. SSOT 1개 + 포인터 N개 — 복사하면 동기화 지옥

Risks:
- runbook이 비대해지면 에이전트가 읽지 않는다 → 핵심 패턴만 수록, 200줄 이내

## Now
- [ ] T1: `headless-test-guide.md` SSOT runbook 작성 — 크기: M, 의존: —
- [ ] T2: `/repro` 스킬 작성 (dual-file) — 크기: S, 의존: →T1
- [ ] T3: `rules.md` 참조 표에 포인터 추가 — 크기: S, 의존: →T1
- [ ] T4: `CLAUDE.md`에 headless test 참조 추가 — 크기: S, 의존: →T1

## Done

## Unresolved
- docs-reader처럼 getItems() 없는 zone은 headless에서 진입 불가 — 이 OS gap은 /repro 범위 밖 (별도 이슈)
- /repro의 입력이 Inspector JSON인지 자연어인지 — 우선 자연어, Inspector 로그는 참고 자료

## Ideas
- Inspector 로그를 파싱하여 테스트 skeleton 자동 생성
- /repro → /green 자동 연결 (재현 → 수정 파이프라인)
