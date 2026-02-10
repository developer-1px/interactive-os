# Pipeline-Embedded Logging Architecture

## 1. 개요

Inspector 로깅이 파이프라인 곳곳에 **수동으로 삽입**되어 있어 빠뜨리기 쉽고, 순서 보장이 구조적이 아닌 관습적이다.
이를 **파이프라인 인프라에 내장**하여 로깅을 zero-effort로 만들 수 있는지 분석한다.

## 2. 현재 구조 (As-Is)

### 로깅 위치 (흩어진 3곳)

| 단계 | 파일 | 로깅 방식 |
|------|------|----------|
| INPUT | `FocusSensor.tsx` | 수동 `InspectorLog.log()` (keydown, mousedown) |
| COMMAND | `CommandEngineStore.ts` | 수동 `InspectorLog.log()` (dispatch 내부) |
| STATE | `osCommand.ts` + `focusData.ts` | 수동 `InspectorLog.log()` (runOS, setActiveZone) |

### 문제점
1. **focusin INPUT 로깅 누락** — Sensor에 추가하지 않으면 EventStream에 안 보임
2. **순서 보장이 관습적** — `addEventListener` 순서에 의존 (깨지기 쉬움)
3. **새 Sensor 추가 시 로깅을 잊을 위험** — 구조가 강제하지 않음

## 3. 분석: 정답이 있는가?

### 결론: **있다. Middleware Pattern.**

이것은 소프트웨어 아키텍처에서 **잘 알려진 문제**이며, 확립된 해법이 존재한다.

> **Cross-Cutting Concern** (로깅, 인증, 텔레메트리 등)은 비즈니스 로직에 삽입하면 안 된다.
> 인프라 레이어에서 **자동으로** 처리해야 한다.

| 선례 | 구현 방식 |
|------|----------|
| Redux | `applyMiddleware(logger)` — dispatch를 감싸는 체인 |
| Express | `app.use(morgan)` — req/res 파이프라인에 tap |
| RxJS | `.pipe(tap(log))` — 스트림 중간에 관찰 |
| AOP (Java) | `@Around("execution(..)")` — 메서드 실행 전후 자동 삽입 |

### 우리 파이프라인에 적용

```
[DOM Event] ──SENSE──▶ [OS Command] ──INTENT──▶ [OS Result] ──COMMIT──▶ [State + Effect]
     │                      │                                               │
  ①INPUT              ②COMMAND                                         ③STATE
  (자동)                (자동)                                            (자동)
```

**핵심**: 파이프라인의 **진입점이 하나**이면, 그 진입점에서 모든 cross-cutting concern을 자동 처리할 수 있다.

## 4. 제안: 세 가지 선택지

### Option A: `dispatch` 미들웨어 (최소 변경)

`CommandEngineStore.dispatch`를 미들웨어 체인으로 확장한다.

```typescript
// dispatch 호출 시 자동으로:
// 1. INPUT 로깅 (meta.inputEvent가 있으면)
// 2. COMMAND 로깅
// 3. 핸들러 실행
// 4. STATE 로깅 (runOS 내부에서 유지)
CommandEngineStore.dispatch(cmd, { inputEvent: e });
```

- **장점**: 기존 구조를 거의 바꾸지 않음
- **단점**: INPUT 로깅이 dispatch와 결합 (Sensor가 아닌 곳에서 dispatch하면?)

---

### Option B: `runOS` 통합 (중간 변경)

`runOS`가 파이프라인의 유일한 진입점이 되어, INPUT → COMMAND → STATE를 모두 처리한다.

```typescript
function runOS(command, payload, meta?: { inputEvent?: Event }) {
  // ① INPUT (meta.inputEvent → 자동 로깅)
  if (meta?.inputEvent) logInput(meta.inputEvent);
  
  // ② COMMAND (항상 자동 로깅)
  logCommand(command.name, payload);
  
  // ③ Pure Execution
  const result = command.run(ctx, payload);
  
  // ④ STATE (변경 감지 → 자동 로깅)
  if (result.state) logStateChanges(ctx, result);
  
  // ⑤ Apply
  applyResult(result);
}
```

- **장점**: 로깅이 `runOS` 한 곳에 집중. Sensor는 순수 번역기로 단순화
- **단점**: `runOS`의 책임이 커짐. keyboard pipeline은 별도 경로

---

### Option C: Pipeline Object (대대적 리팩토링)

파이프라인 자체를 **선언적 객체**로 정의하고, 미들웨어를 플러그인처럼 끼운다.

```typescript
const osPipeline = createPipeline({
  middleware: [inspectorLogger, loopGuard, inspectorFilter],
  
  stages: {
    sense:  (event) => resolveCommand(event),
    intent: (cmd)   => routeToHandler(cmd),
    commit: (result) => applyResult(result),
  }
});

// 사용
osPipeline.process(domEvent);
```

- **장점**: 완전한 관심사 분리. 미들웨어 추가/제거가 설정 한 줄
- **단점**: 현재 구조와 크게 다름. React 컴포넌트 기반 파이프라인과의 조화 필요

## 5. 결론

| 기준 | Option A | Option B | Option C |
|------|----------|----------|----------|
| 변경 규모 | 작음 | 중간 | 큼 |
| 로깅 누락 방지 | △ | ○ | ◎ |
| 순서 보장 | △ | ○ | ◎ |
| 확장성 | △ | ○ | ◎ |
| 현실성 | ◎ | ○ | △ |

**추천: Option B** — `runOS`를 통합 진입점으로 강화. 현실적이면서도 구조적 보장을 제공한다.
Option C는 장기적으로 이상적이나, 현재 React 기반 파이프라인(`FocusSensor`, `FocusIntent`가 React 컴포넌트)과의 조화가 설계 과제로 남는다.
