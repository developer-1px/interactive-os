# CommandEngineStore.ts 레드팀 검수

## 1. 개요 (Overview)

`CommandEngineStore.ts`에 대한 레드팀 코드 검수.
목적: 불필요한 코드, 아키텍처 불일치, 잠재적 버그를 식별.

---

## 2. 분석 (Analysis)

### 🔴 CRITICAL: `dispatch()` 가 silent fail 한다

```typescript
// L195-214
dispatch: (cmd: BaseCommand) => {
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (dispatch) {  // ⚠️ dispatch가 null이면 아무 일도 안 일어남
      InspectorLog.log({ type: "COMMAND", ... });
      dispatch(cmd);
    }
    // else → 완전 무시. 에러도 없고, 로그도 없고, 경고도 없다
},
```

**문제:** `activeAppId`가 null이거나 앱이 미등록이면 커맨드가 **조용히 사라진다**.
이제 `FocusSensor`, `dispatchCommand.ts` 등 모든 곳이 이 함수를 통하기 때문에, silent fail의 영향이 이전보다 훨씬 크다.

**제안:** null일 때 최소한 `console.warn` 또는 InspectorLog로 DROP 이벤트 기록.

---

### 🔴 CRITICAL: `getActiveDispatch()` 우회 경로가 여전히 다수 존재

`CommandEngineStore.dispatch()`를 단일 관문으로 정리했지만, **아직도 raw `getActiveDispatch()`를 직접 호출하는 곳이 많다:**

| 파일 | 라인 | 비고 |
|------|------|------|
| `pipeline.ts` | L76 | `appCommand` dispatch (COMMAND 로그 없음) |
| `FocusSync.tsx` | L135 | FOCUS recovery (COMMAND 로그 없음) |
| `useCommandListener.ts` | L46 | (COMMAND 로그 없음) |
| `osCommand.ts` | L272 | (COMMAND 로그 없음) |
| `useInputEvents.ts` | L57, L75 | (COMMAND 로그 없음) |
| `keyboardCommand.ts` | L115 | (COMMAND 로그 없음) |
| `routeField.ts` | L20 | (COMMAND 로그 없음) |
| `dispatchToZone.ts` | L29 | (COMMAND 로그 없음) |

**문제:** 이 경로들은 `CommandEngineStore.dispatch()`를 우회하므로 COMMAND 로그가 기록되지 않고, `commandCount`도 증가하지 않는다. 통합 로깅의 누수.

**제안:** 이 파일들도 `CommandEngineStore.dispatch()`로 전환하거나, `getActiveDispatch()`를 `@deprecated`로 표시하고 점진적으로 제거.

---

### 🟡 WARNING: `getActiveRegistry()` — 사용처 없음 (Dead Code)

```typescript
// L111-116
getActiveRegistry: () => {
    const { activeAppId, appRegistries } = get();
    return activeAppId ? appRegistries.get(activeAppId)?.registry || null : null;
},
```

**검색 결과:** 정의(L50, L111)를 제외하면 **외부 호출이 0건.** 완전한 Dead Code.

---

### 🟡 WARNING: `getOSRegistry()` — 사용처 없음 (Dead Code)

```typescript
// L118
getOSRegistry: () => get().osRegistry,
```

**검색 결과:** 정의(L51, L118)를 제외하면 **외부 호출이 0건.**
이전에는 `routeCommand.ts`에서 `store.getOSRegistry()`를 사용했지만, `dispatchCommand`가 `CommandEngineStore.dispatch()`로 전환되면서 더 이상 사용하지 않는다.

---

### 🟡 WARNING: `setActiveApp()` — 사용처 없음 (Dead Code)

```typescript
// L89-91
setActiveApp: (appId) => {
    set({ activeAppId: appId });
},
```

**검색 결과:** 정의(L46, L89)를 제외하면 **외부 호출이 0건.**
`registerApp()`이 자동으로 `activeAppId`를 설정하므로, 별도의 `setActiveApp`은 사용되지 않는다.

---

### 🟡 WARNING: Convenience Hooks 중복 구조

```typescript
// L160-187: useDispatch, useAppState, useRegistry, useContextMap
```

이 4개의 Hook은 `CommandEngineStore.ts`에서 정의되고, `CommandContext.tsx`에서 re-export된다.
실제 앱 코드는 `CommandContext.tsx`에서 import하므로, 정의 위치가 모호하다.

- `useContextMap` → `CommandContext.tsx`에서 re-export만 되고, **실제 앱 코드에서 직접 사용하는 곳이 없다.** (`routeCommand.ts`는 `store.getActiveContextMap()`을 사용)

---

### 🟡 WARNING: 오래된 주석 (Stale Comments)

```typescript
// L198-200
// Telemetry is handled by commandEffects.ts to avoid duplicate logging
// BUT for the unified stream, we log here or rely on the effect.
// Let's log the "Dispatch" event here for immediate feedback.
```

이 주석은 **이전 구조를 설명**하고 있다. 지금은 `commandEffects.ts`에서 COMMAND 로그를 제거하고 여기가 유일한 관문이므로, 주석이 사실과 다르다. 혼란을 유발할 수 있다.

```typescript
// L211-213
// Log State after dispatch (rudimentary, ideally we'd diff)
// We can't easily get the *new* state here synchronously if dispatch is async or batched
// But for now, let's just log that a command happened.
```

구현 없이 "TODO" 성격의 주석만 남아 있다. 구현할 거면 하고, 아니면 삭제.

---

### 🟢 INFO: `updateAppState`의 STATE 로그가 과도할 수 있음

```typescript
// L97-103
InspectorLog.log({
    type: "STATE",
    title: `State Update: ${appId}`,
    details: state,  // ⚠️ Warning: This might be large
    icon: "cpu",
    source: "app",
});
```

주석 자체에 "Warning: This might be large"라고 적혀 있다. 대규모 앱 상태가 매 COMMAND마다 통째로 로그에 기록되면 메모리 이슈 가능성.

---

### 🟢 INFO: `CommandEngineStore.get()` — 사용처 없음

```typescript
// L194
get: () => useCommandEngineStore.getState(),
```

외부에서 `CommandEngineStore.get()`을 호출하는 곳이 없다. 대부분 `useCommandEngineStore.getState()`를 직접 호출한다.

---

### 🟢 INFO: 제네릭 `<S = any>` 남용

`CommandEngineState<S = any>`, `AppEntry<S = any>` 등 거의 모든 곳에서 `any`로 폴백되며, 실질적 타입 안전성이 없다. 앱마다 다른 State 타입을 가지므로 현실적 한계이나, `any` 대신 `unknown`이 더 안전하다.

---

## 3. 요약 (Summary)

| 등급 | 항목 | 상태 |
|------|------|------|
| 🔴 Critical | `dispatch()` silent fail | 경고 없이 커맨드 드롭 |
| 🔴 Critical | Raw `getActiveDispatch()` 우회 경로 8곳 | 통합 로깅 누수 |
| 🟡 Dead Code | `getActiveRegistry()` | 사용처 0 |
| 🟡 Dead Code | `getOSRegistry()` | 사용처 0 |
| 🟡 Dead Code | `setActiveApp()` | 사용처 0 |
| 🟡 Dead Code | `useContextMap` Hook | 앱 코드에서 미사용 |
| 🟡 Stale | 주석 3개 | 이전 아키텍처 설명 |
| 🟢 Info | `CommandEngineStore.get()` | 사용처 0 |
| 🟢 Info | `updateAppState` 과도한 STATE 로그 | 메모리 이슈 가능 |
| 🟢 Info | 제네릭 `any` 남용 | 타입 안전성 부재 |

### 제안 우선순위

1. **`dispatch()` silent fail 처리** — 최소한 console.warn 추가
2. **Stale 주석 정리** — 현재 아키텍처에 맞게 갱신
3. **Dead Code 정리** — `getActiveRegistry`, `getOSRegistry`, `setActiveApp` 제거
4. **Raw dispatch 경로 점진적 통합** — 장기적으로 단일 관문으로 수렴
