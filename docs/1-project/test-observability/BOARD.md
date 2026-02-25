# test-observability

| 항목 | 내용 |
|------|------|
| **Claim** | OS 전체에 구조화된 debug 로깅을 의무 삽입하고, 테스트에서는 "Always Record, Print on Failure" 패턴으로 noise 없이 자동 진단한다 |
| **Before → After** | OS 대부분이 침묵, AI가 console.log 수동 삽입 → OS 파이프라인 9개 지점에서 DEBUG/INFO/WARN, 실패 시만 자동 dump |
| **Risks** | 과도한 로깅 = 성능 저하 + noise. Log level로 제어 |
| **Backing** | Go t.Log(), Playwright trace:retain-on-failure, pytest captured output |
| **규모** | Heavy |
| **Discussion** | `discussions/2026-0225-0804-test-diagnostics-gap.md` |
| **PRD** | `prd.md` |

## Now

| # | Task | Status | Blocked |
|---|------|--------|---------|
| T5 | 검증 — docs-section-nav T4~T8을 새 로깅 시스템 위에서 실증 | 🔲 | — |

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|
| T4 | RUNBOOK — 앱 커맨드 headless 테스트 + dumpDiagnostics + 버그=/red 문서화 | ✅ | 02-25 |
| T3 | OS pipeline DEBUG/INFO logs (keybind, dispatch, focus) | +3 tests | 02-25 |
| T2 | createOsPage `dumpDiagnostics()` | +2 tests | 02-25 |
| T1 | kernel unhandled command WARN | +3 tests | 02-25 |

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | logger DI vs 글로벌 싱글톤 | No |
| U2 | log level 설정: env 변수? kernel config? | No |

## Ideas

| Idea | Trigger |
|------|---------|
| Inspector에 실시간 로그 탭 | inspector 프로젝트 |
| scope chain 시각화 | — |