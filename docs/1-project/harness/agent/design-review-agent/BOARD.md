# design-review-agent

| Key | Value |
|-----|-------|
| Claim | 개발 세션의 자기 편향을 제거하려면, fresh context의 독립 에이전트가 폴더 구조·LOC·네이밍·의존성·설계 긴장을 전수 진단해야 한다 |
| Before | 설계 검증 없음. 개발 세션이 자기 코드를 자기가 리뷰 (자기 편향) |
| After | `/design-review [범위]` → worktree 격리 에이전트가 5 Gate 전수 분석 → Design Tension Report 파일 저장 |
| Size | Meta |
| Risk | 에이전트 컨텍스트 소모가 커서 큰 범위 분석 시 truncation 위험 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | AGENT.md 작성 — 5 Gate 정의 (Folder, LOC, Naming, Dependency, Tension) | 5 Gate 절차 + 판정 기준 존재 | ✅ Done | `.claude/agents/design-review/AGENT.md` 441줄 |
| T2 | Agent↔Skill 구조 분리 — `.claude/agents/` + 런처 SKILL.md | agents/ 폴더 분리 + 런처 패턴 동작 | ✅ Done | `.claude/agents/README.md` + `.claude/skills/design-review/SKILL.md` |
| T3 | 리포트 템플릿 개선 — 과정 전문을 담는 상세 템플릿 | 원시 데이터→분석→근거→결론 빠짐없이 | ✅ Done | `26ce0f36` commit |
| T4 | 실행 검증 — `os-core/1-listen` 범위로 전수 분석 | PASS/FAIL 판정 + 파일 저장 | ✅ Done | `docs/0-inbox/32-[analysis]design-review-1-listen.md` 558줄, PASS |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | 큰 범위(전체 os-core) 분석 시 컨텍스트 한계 — 분할 전략 필요 | 범위가 클수록 리포트 품질 저하 가능 |
| U2 | /go 파이프라인 통합 시점 — QA처럼 자동 호출할지, 독립 호출만 유지할지 | 파이프라인 복잡도 vs 자동화 가치 |
