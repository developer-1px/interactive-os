# qc-gate

| Key | Value |
|-----|-------|
| Claim | /go 파이프라인을 PDCA 기반 자율 구조로 전환한다. QC gate(독립 agent, 블랙박스 IV&V)가 자율의 전제조건 |
| Before | /go = 고정 시퀀스(19단계). /qa = 주관적 코드 리뷰(3게이트). 에이전트가 QA skip |
| After | /go = PDCA 4 phase(내부 자율) + QC gate(skip 불가). QC = 빌드 게이트 + spec 기반 독자 테스트. 체크리스트 3칸(위치→근거→P/F) |
| Size | Meta |
| Risk | QC가 너무 빡세면 매번 FAIL loop. 너무 느슨하면 기존과 동일 |

## Context (from /discussion)

- **PDCA**: Plan(자율) → Do(자율) → Check(QC gate) → Act(자율)
- **QC 원칙**: 코드를 보지 않는다(블랙박스). fresh agent(worktree). 빌드 실패 = 즉시 FAIL
- **체크리스트**: 위치(file:loc) → 근거 → P/F. LLM completion bias 역이용
- **독자 테스트**: spec만 보고 자체 테스트 작성+실행. 결과는 자산으로 전달
- **self-check/verify/audit**: Do phase 자율 도구로 유지 (각각 스펙/빌드/계약)
- **QC vs QA**: QC = 출하 판정(있다/없다). QA = 품질 개선(Do phase에서 자율)

## Knowledge (from /discussion)

- K1. QA Gate = 순서 감사가 아니라 산출물 존재 감사. 역순 생성 허용
- K2. 체크리스트는 근거-먼저 구조: 증빙 후 P/F 판정. completion bias가 거짓 PASS 방지
- K3. 체크리스트 3칸: 위치(file:loc) → 근거 → P/F
- K4. /qa = 출하 판정(QC). 품질 개선(QA) 판단 없음
- K5. QC = verify(기계) + self-check(spec) + audit(계약)의 통합 관점
- K6. self-check vs QC 분리 = 컨텍스트 유무. self-check=본인, QC=타인
- K7. 3축 독립 검증: self-check=스펙, verify=빌드, audit=계약
- K8. QC = 블랙박스 IV&V. 빌드 게이트 → spec → 독자 테스트 → 실행
- K9. QC 테스트는 자산 — 개발자에게 전달, 중복 제거 후 내부 반영
- K10. QC = 자율의 전제조건

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | QC AGENT.md 재작성 | 블랙박스 IV&V 프로토콜 + 체크리스트 3칸 + 독자 테스트 + 테스트 전달 | ✅ | `.claude/agents/qa/AGENT.md` 재작성 (199줄→QC) ✅ |
| T2 | /go SKILL.md 재작성 | PDCA 4 phase + QC gate 강제 + phase별 스킬 목록 | ✅ | `.claude/skills/go/SKILL.md` 재작성 (180줄→PDCA) ✅ |
| T3 | /qa SKILL.md 교체 | 새 QC agent 호출 런처 | ✅ | `.claude/skills/qa/SKILL.md` 교체 (QC 런처) ✅ |
| T4 | spec-verifier 처리 | QC에 흡수 또는 역할 재정의 | ✅ | `.claude/agents/spec-verifier/AGENT.md` DEPRECATED 마킹 ✅ |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | Plan/Do/Act phase의 산출물 포맷 | 다음 사이클 |
