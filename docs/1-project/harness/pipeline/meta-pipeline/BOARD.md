# meta-pipeline

| Key | Value |
|-----|-------|
| Claim | Meta 프로젝트는 코드 계약이 아닌 문서 계약(완전성·일관성·참조정합·컨벤션)으로 검증해야 한다. 현행 파이프라인의 audit/verify/qa는 코드 전제이므로 Meta에서 trivial PASS = 미검증 |
| Before | Meta 프로젝트가 Code 파이프라인을 그대로 타면서 #7 audit, #10 verify, #12 qa가 의례적 통과 |
| After | #1에서 Meta/Code 분기. Meta 경로: /doubt → /verify --meta → /qa --meta(4 Gate) |
| Size | Meta |
| Risk | 파이프라인 분기가 복잡도를 높일 수 있음. 단순하게 유지해야 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | /go SKILL.md에 Meta 분기 경로 추가 | #1 이후 Meta/Code 경로 분리, Meta는 audit 스킵 | | |
| T2 | /qa AGENT.md에 Meta 4 Gate 추가 | Completeness, Consistency, Reference Integrity, Convention 게이트 정의 | | |
| T3 | /verify SKILL.md에 --meta 모드 추가 | Meta일 때 regression만 확인 (신규 코드 검증 스킵) | | |

## Unresolved

없음
