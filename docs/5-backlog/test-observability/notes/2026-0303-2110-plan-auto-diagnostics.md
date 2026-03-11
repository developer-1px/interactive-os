# Auto-Diagnostics on Test Failure

> /plan 변환 명세표
> Date: 2026-03-03
> Discussion: `discussions/2026-0303-2100-auto-diagnostics-on-failure.md`

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `page.ts`: 신규 함수 `formatDiagnostics(kernel): string` | 존재하지 않음 | 순수 포맷터 (반환: string): schema path 필터 + Δ none 감지 + zone snapshot | Clear | — | auto-diagnostics.test.ts | — |
| 2 | `page.ts:createAppPage()` 반환 객체 | `dumpDiagnostics` 없음, `onTestFailed` 미등록 | `dumpDiagnostics()` = `console.log(formatDiagnostics(os))` + vitest 감지 후 `onTestFailed` 자동 등록 | Clear | →#1 | tsc 0, regression 0 | `onTestFailed` 글로벌 접근 (try-catch 방어) |
| 3 | `page.ts:createOsPage():dumpDiagnostics` (L853-873) | 전체 트랜잭션 raw dump | `console.log(formatDiagnostics(os))` 호출로 교체 | Clear | →#1 | tsc 0 | — |
| 4 | `docs-viewer-action.test.ts` (L23, 44) | `import { onTestFailed }` + 수동 등록 | 두 줄 제거 (자동 등록으로 대체) | Clear | →#2 | 테스트 PASS 유지 | — |
| 5 | `docs-dashboard-action.test.ts` (L20, 39) | 동일 | 두 줄 제거 | Clear | →#2 | 테스트 PASS 유지 | — |
| 6 | `docs-sidebar-state.test.ts` (L19, 67) | 동일 | 두 줄 제거 | Clear | →#2 | 테스트 PASS 유지 | — |
| 7 | `docs-auto-select.test.ts` (L17, 34) | 동일 | 두 줄 제거 | Clear | →#2 | 테스트 PASS 유지 | — |
| 8 | `testbot/app.ts:SuiteState` | `diagnostics` 필드 없음 | `diagnostics?: string` 추가 | Clear | — | tsc 0 | — |
| 9 | `testbot/app.ts:suiteDone` command | payload에 diagnostics 없음 | payload에 `diagnostics?: string` 추가, draft에 저장 | Clear | →#8 | tsc 0 | — |
| 10 | `testbot/app.ts:executeAll()` (L222-234) | suite 실패 시 진단 미수집 | `passed=false` 시 `formatDiagnostics(os)`를 suiteDone payload에 포함. suite 시작 시 `os.inspector.clearTransactions()` | Clear | →#1,#9 | tsc 0 | inspector 공유 상태 — clearTransactions 타이밍 |
| 11 | `testbot/app.ts:executeSuite()` (L274-286) | 동일 | 동일 처리 | Clear | →#1,#9 | tsc 0 | — |
| 12 | `TestBotPanel.tsx:formatLog()` (L248-272) | steps만 출력 | 실패 suite에 `suite.diagnostics` 있으면 하단에 추가 | Clear | →#8 | tsc 0 | — |

## formatDiagnostics 스펙

**시그니처**: `formatDiagnostics(kernel): string` — 순수 함수, 부작용 없음

**출력 형태**:
```
═══ OS Diagnostic ═══
Last: OS_NAVIGATE ⚠️ Δ none

  #1 OS_FOCUS
    Δ os.focus.activeZoneId: null → "list"
    Δ os.focus.zones.list.focusedItemId: null → "a"
  #2 OS_NAVIGATE ⚠️ Δ none

Zone "list": items=1, focused="a", selection=[]
═══════════════════════
```

**규칙**:
1. 마지막 트랜잭션의 changes path로 관련 트랜잭션 필터 (Δ none이면 마지막 5개)
2. `⚠️ Δ none` = 커맨드 실행됐지만 상태 불변 (가장 강한 signal)
3. Zone snapshot = items 수 + focusedItemId + selection (1줄)
4. 전체 15줄 이내 목표

**소비자 2곳**:
- vitest: `onTestFailed(() => console.log(formatDiagnostics(os)))`
- TestBot: `suiteDone({ diagnostics: formatDiagnostics(os) })` → clipboard formatLog에 포함

## MECE 점검

1. CE: #1~#12 실행 시 vitest 자동 출력 + TestBot 클립보드 진단 모두 달성 ✅
2. ME: 중복 없음 ✅
3. No-op: 모두 Before≠After ✅

## 라우팅

승인 후 → `/go` (test-observability) — T16: Auto-diagnostics on failure
