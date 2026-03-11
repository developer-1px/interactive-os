# pipeline-leak-audit

| Key | Value |
|-----|-------|
| Claim | 파이프라인 4게이트 누수 해소. Phase 1(/spec DT 보장), Phase 2(/red spec↔test 1:1)는 이미 수정됨. Phase 3(/audit spec coverage), Phase 4(/go Unresolved 우회 차단)만 남음 |
| Before | /audit에 spec coverage 카테고리 없음. /go에서 Unresolved를 "백로그 위임"으로 0으로 만드는 우회 가능 |
| After | /audit에 spec coverage 양방향 검증 추가. /go Unresolved→백로그 위임 시 사용자 승인 필수 |
| Size | Meta |
| Risk | 과잉 절차화 — 게이트가 너무 무거워지면 파이프라인 throughput 감소 |

## Now

- [x] T1: /audit contract-checklist.md에 Spec Coverage 카테고리 추가 — §2 Spec Coverage 섹션 추가 완료 ✅
- [x] T2: /go SKILL.md에 Unresolved→백로그 위임 시 사용자 승인 규칙 추가 — ⛔ Unresolved 우회 금지 규칙 추가 완료 ✅
- [x] T3: Dual-file 동기화 (workflows/) + 백로그 항목 업데이트 — go.md 전면 동기화 완료 (Meta 경로, QA Agent, Unresolved 규칙 포함) ✅

✅ QA PASS

## Unresolved

| # | Question | Impact |
|---|----------|--------|
