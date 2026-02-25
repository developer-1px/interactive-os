# PRD: OS-wide Debug Logging & Test Auto-Diagnostics

## 1. 목표

OS 전체에 구조화된 debug 로깅을 의무 삽입하고, 테스트에서는 Go `t.Log()` 패턴("Always Record, Print on Failure")으로 noise 없이 자동 진단한다.

**검증 방법**: docs-section-nav T4~T8을 이 시스템 위에서 진행하여 효과를 실증한다.

## 2. 설계

### 2.1 Log Level 체계

| Level | 용도 | 출력 환경 |
|-------|------|----------|
| `ERROR` | 깨진 것 | 항상 |
| `WARN` | 이상한 것 (unhandled command, unknown effect) | 항상 |
| `INFO` | 의미 있는 이벤트 (Zone mount, focus 이동) | dev |
| `DEBUG` | 모든 것 (dispatch, handler lookup, effect call) | opt-in |

### 2.2 로깅 대상 (OS 파이프라인 전체)

| # | 영역 | 로그 내용 | Level |
|---|------|---------|-------|
| 1 | **kernel dispatch** | command.type + scope | DEBUG |
| 2 | **kernel handler lookup** | "found in scope X" | DEBUG |
| 3 | **kernel unhandled** | "No handler for X in [scope chain]" | **WARN** |
| 4 | **kernel effect** | effect key + value | DEBUG |
| 5 | **kernel unknown effect** | "Unknown effect X" (기존) | WARN |
| 6 | **keybindings resolve** | key → command (when 조건) | DEBUG |
| 7 | **middleware** | command 변환/흡수 | DEBUG |
| 8 | **focus** | zone/item 이동 | INFO |
| 9 | **Zone** | mount/unmount + role | INFO |

### 2.3 테스트 자동 진단 (Go t.Log 패턴)

```
┌─ beforeEach ─────────────────────────────┐
│ page = createOsPage()                    │
│ logger → 버퍼에 기록 (출력 안 함)          │
│                                          │
│ onTestFailed(() => {                     │
│   console.log(bufferedLogs)  // 실패 시만 │
│ })                                       │
└──────────────────────────────────────────┘

✅ PASS → 출력 없음 (noise 0)
❌ FAIL → 전체 pipeline trace 자동 출력:

  [zone]     mount docs-reader (feed)
  [keybind]  Space → DOCS_NEXT_SECTION (when: navigating)
  [dispatch] DOCS_NEXT_SECTION scope=[docs-viewer:docs-reader]
  [handler]  found in docs-viewer:docs-reader
  [effect]   scrollSection("next")
```

### 2.4 구현 방식

**kernel**: 이미 `logger` 파라미터 존재. dispatch/handler/effect 경로에 로그 추가.

**OS (keybindings, focus, Zone 등)**: kernel의 logger를 공유하거나, 동일한 인터페이스의 logger 주입.

**createOsPage**: logger를 버퍼링 모드로 생성. `dumpDiagnostics()`로 버퍼 출력. vitest `onTestFailed`에서 자동 호출.

### 2.5 Level 제어

```typescript
// kernel 생성 시
createKernel({
  initialState,
  logLevel: "warn",  // production: warn+만
  // logLevel: "debug", // debugging: 전부
});

// 테스트: logLevel은 "debug" (전부 기록)
// 하지만 출력은 onTestFailed에서만
```

## 3. 태스크

| # | 태스크 | 의존 | 산출물 |
|---|--------|------|--------|
| T1 | kernel에 dispatch/handler/effect DEBUG 로그 + unhandled WARN | 없음 | kernel 코드 + 테스트 |
| T2 | createOsPage `dumpDiagnostics()` + 버퍼링 logger | T1 | createOsPage 코드 + 테스트 |
| T3 | OS 파이프라인 logger (keybindings, focus, middleware, Zone) | T1 | OS 각 모듈에 logger 삽입 |
| T4 | RUNBOOK 업데이트 (headless 테스트 패턴 + 로깅 가이드) | T1~T3 | 문서 |
| T5 | **검증** — docs-section-nav T4~T8을 새 시스템 위에서 진행 | T1~T3 | 실증 |

## 4. 비기능 요구사항

- DEBUG 로그가 꺼져 있을 때 성능 영향 0 (lazy evaluation)
- 기존 테스트 regression 0
- 기존 `logger.warn`(unknown effect) 동작 유지
