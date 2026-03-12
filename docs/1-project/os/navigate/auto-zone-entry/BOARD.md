# auto-zone-entry

| Key | Value |
|-----|-------|
| Claim | activeZoneId가 null일 때 OS_TAB/OS_NAVIGATE가 silent reject하는 regression을 수정. 3-inject의 DOM_ZONE_ORDER[0]로 자동 진입 |
| Before | eb2f8b2a에서 Zone mount OS_FOCUS 제거 후, 클릭 전까지 모든 키보드 네비게이션 무반응 |
| After | Tab/Arrow 첫 키에서 DOM_ZONE_ORDER[0]의 첫 Zone·첫 Item으로 자동 포커스 |
| Size | Light |
| Risk | 낮음 — 기존 inject 메커니즘 활용, 원칙 #32 준수 |

## Now

- [ ] T1: OS_TAB null guard → DOM_ZONE_ORDER[0] 자동 진입 — S, 의존: —
- [ ] T2: OS_NAVIGATE null guard → 동일 패턴 — S, 의존: →T1
- [ ] T3: headless 테스트 — Tab/ArrowDown activeZoneId null 동작 확인 — S, 의존: →T1,T2

## Tasks

| # | Task | Before | After | AC | Status | Evidence |
|---|------|--------|-------|----|--------|----------|
| T1 | OS_TAB null guard → 자동 진입 | tab.ts:28-31 `if (!activeZoneId) return` | DOM_ZONE_ORDER[0] 첫 Zone+Item으로 OS_FOCUS 후 return | tsc 0, 기존 tests 유지 | | |
| T2 | OS_NAVIGATE null guard → 자동 진입 | navigate/index.ts:38-39 `if (!activeZoneId) return` | 동일 패턴 | tsc 0, 기존 tests 유지 | | |
| T3 | headless 테스트 작성 | 테스트 없음 | activeZoneId null 상태에서 Tab→첫Zone, Arrow→첫Zone 동작 확인 | +N tests PASS | | |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
