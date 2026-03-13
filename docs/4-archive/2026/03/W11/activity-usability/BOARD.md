# Activity Usability — Write-first Agent Activity UI

> Domain: agent-activity | Epic: docs-viewer | Created: 2026-03-13

## Claim (Product Goal)

Agent Activity UI를 **Write-first + 세션 그룹 + 활동 감지** 구조로 재구성한다.

### Before → After

| Before | After |
|--------|-------|
| Read/Write flat 목록 (노이즈 압도) | Read 인디케이터(1) + Write 세션별 역순 그룹 |
| 파일명만 표시 | 파일명 + 디렉토리 2단 표시 |
| flat/grouped 토글 | 세션별 자동 그룹 + 활동 감지(2분) 자동 펼침/접힘 |

### Size: Light

사용자 상호작용 있음 (세션 펼침/접힘, 파일 클릭) → Red/Green 필수

### Risk

- 기존 Agent Activity 섹션 전면 교체 → 기존 테스트 깨질 수 있음
- HMR 활동 감지 타이밍 — 2분 heuristic 적절한지 실사용 검증 필요

### Discussion Reference

- `docs/0-inbox/40-[discussion]agent-activity-usability.md`

---

## Now

- [x] T1: `collectAgentActivity()` dedup 제거 + limit 100 — tsc 0 ✅
- [x] T2: `AgentRecentFile.dir` 추가 + `getLatestRead()` + `getWrittenFilesBySession()` 신규 — tsc 0 ✅
- [x] T3: `isGrouped` 상태 + `TOGGLE_GROUPING` + trigger 제거 — tsc 0 ✅
- [x] T4: `RecentSection` → `AgentActivitySection` 전면 교체 — tsc 0 | 3 headless tests pass ✅

All Done (8e12db94)

✅ Spec Verify PASS (14/14) — 12 verified, 2 justified SKIP (React integration)
✅ QA PASS (3/3) — Code Review ✅ | Contract Compliance ✅ | Simplicity ✅

---

## Unresolved

| # | Issue |
|---|-------|
| U1 | 세션 내 subagent 분리는 로그 포맷 변경 필요 → scope out |
