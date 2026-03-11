# wip-skill

| Key | Value |
|-----|-------|
| Claim | `/wip` 스킬 = backlog probe loop. 백로그에서 랜덤 1개 선택 → 분석 도구 N턴(≤3) 자율 오케스트레이션 → Clear면 `/go` 위임, 아니면 enriched 백로그 환류 |
| Before | 백로그→프로젝트 전환이 인간 수동 (`/discussion` → `/project`). 에이전트의 자율 범위가 "실행"에 국한 |
| After | `/wip` 한 번 호출로 백로그 선택 + 분석 + (가능하면) 실행까지 자율 진행. 실패해도 백로그가 풍부해짐 |
| Size | Meta |
| Risk | AI가 자기 분석에 자기 확신을 갖는 루프. N턴 제한으로 방지 |

## Now

- [x] T1: SKILL.md 작성 — `.claude/skills/wip/SKILL.md` 생성 ✅
- [x] T2: workflow .md 동기화 — `.agent/workflows/wip.md` 생성, SKILL.md와 동일 내용 ✅
- [x] T3: BOARD.md 갱신 + 커밋 — 2개 파일 생성, BOARD+STATUS 갱신 ✅

## Unresolved

| # | Question | Impact |
|---|----------|--------|
