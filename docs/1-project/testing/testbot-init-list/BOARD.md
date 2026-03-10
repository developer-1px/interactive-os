# testbot-init-list

| Key | Value |
|-----|-------|
| Claim | TestBot 패널 마운트 시 manifest의 전체 테스트 목록을 즉시 표시한다 (실행 없이) |
| Before | zone-reactive 비동기 로딩 완료 후에만 목록 표시. 매칭 안 되면 빈 목록 |
| After | manifest eager metadata로 전체 목록 즉시 표시. zone 매칭은 실행 가능 여부에만 영향 |
| Size | Light |
| Risk | manifest metadata가 eager이므로 성능 영향 없음. scripts lazy load는 유지 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | manifest eager metadata에서 전체 script 이름/그룹 추출 → initSuites 즉시 dispatch | tsc 0 + 패널에 planned 목록 즉시 표시 | ✅ | tsc 0 \| zone 필터 제거, loadAllEntries() 즉시 호출 \| −70 +27 lines |

## Unresolved

(없음)
