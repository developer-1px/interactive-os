# Inspector Logging 순서 문제와 Runner 아키텍처 제안

## 1. 개요

Pipeline-embedded logging을 구현하면서 `setCurrentInput` + ambient context 패턴으로 INPUT 로깅을
`runOS`에 통합했으나, **EventStream에서 INPUT → COMMAND → STATE 순서가 보장되지 않는 문제**가 발생.
근본 원인을 분석하고 Runner 아키텍처를 제안한다.

## 2. 현재 상태

### 2.1 실제 EventStream 로그 (버그)

```
[2] INPUT: Click "mousedown"
  → STATE: Focus → nav-underline     ← STATE가 COMMAND보다 먼저!
  → COMMAND: OS_SELECT
  → STATE: Selection (1)

[6] INPUT: Key "ArrowLeft"
  → STATE: Focus → nav-italic
  → COMMAND: OS_SYNC_FOCUS           ← focusin 별도 그룹 누출

[7] INPUT: Key "focusin"             ← 왜 별도 그룹?
```

### 2.2 기대하는 순서

```
[2] INPUT: Click "mousedown"
  → COMMAND: OS_FOCUS
  → STATE: Focus → nav-underline
  → COMMAND: OS_SELECT
  → STATE: Selection (1)
```

### 2.3 버그 원인: 로깅 소유권 분산

현재 로깅이 **3곳**에 분산되어 있다:

```
호출 순서                               로깅 위치
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
setCurrentInput(e)                      (저장만, 로깅 안함)
  ↓
CommandEngineStore.dispatch(cmd)        ← ② COMMAND 로깅
  ↓
  app dispatch → event bus → handler
    ↓
    runOS()                             ← ① INPUT 로깅 (여기서 소비)
      command.run()
                                        ← ③ STATE 로깅
```

결과: **② COMMAND가 ① INPUT보다 먼저 찍힌다.**

## 3. 분석: 왜 이 구조가 실패하는가

### 핵심 모순

> "runOS가 모든 로깅의 오케스트라"라고 했지만, **COMMAND 로깅은 dispatch에 있다.**

`runOS`가 INPUT과 STATE만 소유하고, COMMAND는 `dispatch`가 소유하므로 실행 순서가:

```
dispatch → COMMAND 로깅 → handler → runOS → INPUT 로깅 → STATE 로깅
```

INPUT이 COMMAND **뒤에** 찍힌다.

### `setCurrentInput`에서 즉시 로깅하면?

```typescript
export function setCurrentInput(event: Event) {
  logInput(event);  // 즉시 로깅
}
```

이러면 순서는 맞지만, **단순한 함수 분리에 불과**하다.
호출부가 `setCurrentInput(e)`를 빠뜨리면 INPUT이 기록되지 않으므로 구조적 강제가 아니다.

## 4. 제안: Runner 아키텍처

### 원칙
> **dispatch = 순수 라우터 (로깅 없음)**
> **Runner = 시퀀스 소유자 (INPUT → COMMAND → STATE)**

### 구조

```
CommandEngineStore.dispatch(cmd, meta?)     ← 순수 라우터
  ├─ OS Command  → runOS(cmd, meta)        ← Runner: INPUT → COMMAND → STATE
  └─ App Command → runApp(cmd, meta)       ← Runner: INPUT → COMMAND → STATE
```

### runOS (현재 존재, 확장 필요)

```typescript
function runOS(command, payload, meta?) {
  // ① INPUT  (ambient context 소비)
  if (_currentInput) { logInput(_currentInput); _currentInput = null; }

  // ② COMMAND (runOS가 직접 로깅)
  logCommand(command, payload);

  // ③ Pure Execution
  const result = command.run(ctx, payload);

  // ④ STATE  (변경 감지 로깅)
  if (result.state) logStateChanges(ctx, result);

  // ⑤ Commit
  applyResult(result);
}
```

### runApp (신규, CommandEngineStore에서 추출)

```typescript
function runApp(cmd, dispatch, meta?) {
  // ① INPUT  (있으면)
  if (_currentInput) { logInput(_currentInput); _currentInput = null; }

  // ② COMMAND
  logCommand(cmd);

  // ③ App Dispatch (reducer 실행)
  dispatch(cmd);

  // ④ STATE — app은 자체 state 관리이므로 별도 구현 필요
}
```

### CommandEngineStore.dispatch 변경

```typescript
// Before: 로깅 + 라우팅 혼합
dispatch: (cmd) => {
  InspectorLog.log({ type: "COMMAND", ... });  // ← 여기서 로깅
  dispatch(cmd);
},

// After: 순수 라우팅
dispatch: (cmd) => {
  const appDispatch = getActiveDispatch();
  if (appDispatch) {
    runApp(cmd, appDispatch);    // Runner가 로깅 담당
  }
},
```

### 변경 범위

| 파일 | 변경 |
|------|------|
| `CommandEngineStore.ts` | COMMAND 로깅 제거, `runApp` 호출로 교체 |
| `osCommand.ts` (runOS) | COMMAND 로깅 추가 |
| `runApp.ts` [NEW] | App command runner (COMMAND 로깅 포함) |

## 5. 결론

- **현재 ambient context 접근**은 COMMAND 로깅이 dispatch에 있어서 순서가 깨진다
- **진짜 해결**: COMMAND 로깅을 dispatch에서 제거하고 각 Runner(runOS, runApp)로 이동
- **Runner 패턴**: dispatch = 라우터, Runner = 시퀀스 소유자 → 순서가 **구조적으로 보장**됨
- 부수적으로, focusin 누출 문제도 별도 조사 필요 (`_isRunning` guard가 작동하지 않는 경로 존재)
