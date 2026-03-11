# archive-cleanup

| Key | Value |
|-----|-------|
| Claim | 프로젝트 스캐폴딩 v2: BOARD.md + spec.md + discussions/ only. notes/ 삭제. /archive 판단 0 |
| Before | v1: BOARD + spec + discussions/ + notes/ (혼재). /archive 시 296개 중 77% 개별 판단 삭제 |
| After | v2: BOARD(테이블) + spec(진실) + discussions/(안 간 길). /archive = discussions/ 이동 + BOARD Context 잔존 + 나머지 삭제 |
| Size | Meta |
| Risk | 기존 v1 프로젝트 8개는 기존 구조 유지, 새 프로젝트부터 v2 적용 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | `/project` 스킬 수정 — scaffold에서 notes/ 제거, BOARD 테이블 템플릿 | skill.md 갱신 완료 | ✅ | notes/ 제거, 표준 구조 v2, BOARD 테이블 포맷 반영 |
| T2 | `/archive` 스킬 수정 — 판단 0 로직 (discussions/ + spec + BOARD Context 이동, 나머지 삭제) | skill.md 갱신 완료 | ✅ | v2 판단 0 로직 + v1 호환 분기 추가 |
| T3 | `/blueprint` 스킬 수정 — Challenge 있으면 discussions/, 없으면 파일 미생성 | skill.md 갱신 완료 | ✅ | 저장 위치 discussions/, Challenge 없으면 미생성 |
| T4 | `/diagnose` 스킬 수정 — 출력을 discussions/에 | skill.md 갱신 완료 | ✅ | 프로젝트 귀속 시 discussions/, 미귀속 시 0-inbox |
| T5 | `/retrospect` 스킬 수정 — 출력을 discussions/에 | skill.md 갱신 완료 | ✅ | retrospective.md → discussions/retrospective.md |
| T6 | blueprint 문서 저장 — Challenge 포함이므로 discussions/에 | 파일 이동 완료 | ✅ | discussions/blueprint-scaffold-v2.md 생성 |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
