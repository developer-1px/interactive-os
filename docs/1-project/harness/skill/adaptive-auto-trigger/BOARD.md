# adaptive-auto-trigger

| Key | Value |
|-----|-------|
| Claim | 적응형 19개 스킬의 description을 "언제 호출" 중심으로 재작성하면, Claude가 상황에 맞는 스킬을 자동 제안할 수 있다 |
| Before | 52개 스킬 전부 수동 호출(`/skillname`). description은 UI 표시용. auto-trigger 미사용. /go 모호함 프로토콜은 conflict→blueprint→divide 3개 하드코딩 |
| After | 적응형 19개 스킬이 auto-trigger 가능. Claude가 "여기서 /diagnose 쓸까요?" 자동 제안. eval 케이스로 트리거 정확도 측정·최적화 가능 |
| Size | Meta |
| Risk | 한국어 description의 eval 정확도 미검증. 적응형 도구 간 경계 모호(why vs diagnose vs ban) — description만으로 LLM이 구분 가능한지 eval로 확인 필요 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
<!-- /plan이 Task Map으로 채운다 -->

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | 한국어 description vs 영어 description — 어느 쪽이 트리거 정확도가 높은가? | eval 결과로 판단. 영어가 높으면 적응형 19개만 영어 description 사용 |
| U2 | eval 인프라(run_eval.py, run_loop.py) 실행 환경 — skill-creator repo clone 필요? 자체 eval 스크립트 작성? | Phase 1 실행 방식 결정 |
| U3 | Phase 2(/go 모호함 프로토콜 개방)로 진행할지는 Phase 1 eval 결과 후 판단 | Phase 1 성공 시 후속 프로젝트 생성 여부 |
