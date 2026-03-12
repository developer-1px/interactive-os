# skill-description-eval — 적응형 스킬 18개 description 재작성 + 트리거 정확도 평가

| Key | Value |
|-----|-------|
| Claim | 적응형 18개 스킬의 description을 "언제 호출" 중심으로 재작성하면, Claude가 상황에 맞는 스킬을 자동 제안할 수 있다 |
| Before | 52개 스킬 전부 수동 호출(`/skillname`). description은 UI 표시용. auto-trigger 미사용. /go 모호함 프로토콜은 conflict→blueprint→divide 3개 하드코딩 |
| After | 적응형 18개 스킬이 auto-trigger 가능. Claude가 "여기서 /diagnose 쓸까요?" 자동 제안. eval 케이스로 트리거 정확도 측정·최적화 가능 |
| Size | Meta |
| Risk | 한국어 description의 eval 정확도 미검증. 적응형 도구 간 경계 모호(why vs diagnose vs ban) — description만으로 LLM이 구분 가능한지 eval로 확인 필요 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | 적응형 스킬 분류 확정 — simplify 제외, 최종 18개 목록 확정 | BOARD 분류표 정합 | ✅ | simplify 미존재 확인, 19→18 갱신 (BOARD+README+memory) |
| T2 | 18개 SKILL.md description 재작성 — "언제 호출" 트리거 조건 중심 | 18개 SKILL.md 갱신 | ✅ | 18개 파일 갱신, commit 8eb36e39 |
| T3 | 18개 .agent/workflows/ 동기화 | 18개 workflow 파일 갱신 | ✅ | 18개 파일 갱신, commit 08bd2ee4 |
| T4 | eval-set.json 작성 (20+ 테스트 케이스) | JSON 파싱 가능 + ≥20 케이스 | ✅ | 25개 케이스 작성, eval-set.json |
| T5 | U2 해소 — eval 실행 환경 조사 + 결론 기록 | U2에 결론 기록 | ✅ | anthropics/skills repo의 run_eval.py + run_loop.py 사용. 아래 U2 참조 |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | ~~한영 비교~~ **Kill**: 당분간 한국어 유지. 사용자가 읽고 수정 방향을 지시할 수 있어야 함 | Kill |
| U2 | ~~eval 인프라~~ **해소**: `anthropics/skills` repo clone → `scripts/run_eval.py --eval-set eval-set.json --skill-path .claude/skills/{name} --runs-per-query 3`. 자동 최적화는 `run_loop.py --holdout 0.4 --max-iterations 5`. 자체 스크립트 불필요 | 해소됨 |
| U3 | ~~Phase 2~~ **보류**: eval 실행 후 판단 | 보류 |

## QA

✅ QA PASS (4/4) — `qa-report-2026-0312-2330.md`
