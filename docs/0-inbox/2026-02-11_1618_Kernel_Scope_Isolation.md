# Kernel Scope Isolation 분석 — State Visibility 갭

> `group({ scope })` 가 실제로 격리하는 것과 격리하지 않는 것.
> 앱 커맨드의 OS state 접근 문제와 해결 방안.

## 1. 개요

현재 커널의 `group({ scope })` 메커니즘이 command routing, effect routing, middleware routing은 격리하지만
**state visibility**와 **state mutation scope**는 격리하지 않는다.

이로 인해 앱 스코프(`todo`)에서 정의된 커맨드가 OS 스코프(`GLOBAL`)의 state (`ctx.state.os.*`)를
자유롭게 읽고 쓸 수 있다. 이는 scope 격리의 근본 원칙에 위배된다.

---

## 2. 현재 Scope가 격리하는 것

| 기능 | 격리됨? | 메커니즘 |
|---|---|---|
| Command routing | ✅ | `scopedCommands.get(scope)?.get(type)` |
| Effect routing | ✅ | `scopedEffects.get(scope)?.get(key)` |
| Middleware routing | ✅ | `scopedMiddleware.get(scope)` |
| Bubble path | ✅ | `parentMap` → scope chain upward |
| **State read** | ❌ | `ctx.state` = 전체 커널 state |
| **State write** | ❌ | `{ state: ... }` → 전체를 덮어씀 |

---

## 3. 문제의 코드

### 3.1 Handler에 전달되는 ctx.state

```typescript
// createKernel.ts L261-266
const ctx = {
  state: mwCtx.state,  // ← 전체 AppState { os, apps }
  ...injectedMap,
  inject: (token) => injectedMap[token.__id],
};
const handlerResult = handler(ctx)(mwCtx.command.payload);
```

`mwCtx.state`는 `processCommand()` L226에서 `state as unknown`으로 설정되며,
이 `state`는 커널의 **전체 클로저 state** (`{ os: OSState, apps: Record<string, unknown> }`)다.

### 3.2 State effect가 전체를 덮어씀

```typescript
// createKernel.ts L324-326
if (key === "state") {
  setState(() => value as S);  // ← 전체 state 교체
  continue;
}
```

커맨드가 `{ state: newState }` 를 반환하면 **커널의 전체 state가 교체**된다.
앱 커맨드가 실수로 `os` 필드를 누락하면 OS state가 사라진다.

### 3.3 실제 사용 패턴 (OS 커맨드)

```typescript
// 3-commands/navigate/index.ts
const NAVIGATE = kernel.defineCommand("NAVIGATE",
  (ctx) => (payload) => {
    const { activeZoneId } = ctx.state.os.focus;  // ← 전체 state 접근
    // ...
    return {
      state: produce(ctx.state, (draft) => {      // ← 전체 state 반환
        draft.os.focus.zones[activeZoneId] = ...
      })
    };
  }
);
```

OS 커맨드는 `ctx.state.os.*`에 접근하는 것이 **당연히 정당**하다.
문제는 앱 커맨드도 정확히 같은 방식으로 동작한다는 것이다.

---

## 4. 위반 시나리오

### 4.1 앱이 OS state를 읽을 수 있음

```typescript
// Todo 앱 커맨드에서 (scope: "todo")
todoGroup.defineCommand("ADD_TODO", (ctx) => (payload) => {
  // ⚠️ OS focus state에 직접 접근 가능
  const focusedId = ctx.state.os.focus.zones["listView"]?.focusedItemId;
  // ...
});
```

→ 앱이 OS 내부 구현에 의존하게 됨 (coupling ↑)

### 4.2 앱이 OS state를 실수로 덮어쓸 수 있음

```typescript
todoGroup.defineCommand("TOGGLE_VIEW", (ctx) => () => ({
  state: {
    ...ctx.state,
    apps: {
      ...ctx.state.apps,
      todo: { ...ctx.state.apps.todo, ui: { viewMode: "board" } }
    }
    // ⚠️ os 필드를 깜빡하면 OS state 전체가 사라짐!
  }
}));
```

### 4.3 앱 간 state 침범

```typescript
// Todo 앱에서 다른 앱의 state를 읽거나 수정 가능
todoGroup.defineCommand("STEAL_DATA", (ctx) => () => ({
  state: produce(ctx.state, (draft) => {
    // ⚠️ 다른 앱 state를 마음대로 수정
    (draft.apps["other-app"] as any).data = {};
  })
}));
```

---

## 5. 비교 분석 — 다른 시스템의 격리 방식

| 시스템 | 격리 메커니즘 |
|---|---|
| **Redux Toolkit** | `createSlice`가 slice의 state만 reducer에 전달. 전체 state는 `getState()`로만 접근 (readonly, 비동기) |
| **Zustand** | 슬라이스 패턴에서 `get()`/`set()`이 자기 스코프만 노출. 명시적 `getState()` 필요 |
| **OS Process Model** | 프로세스는 자기 address space만 접근. IPC로 다른 프로세스와 통신 |
| **Linux cgroups** | 리소스 격리. 자기 cgroup의 리소스만 사용 가능 |
| **현재 커널** | ❌ scope에 관계없이 전체 state 노출 |

---

## 6. 설계 제안

### 접근법 A: Scoped State View (권장)

커맨드 핸들러에 전달되는 `ctx.state`를 scope에 따라 **필터링**:

```typescript
// 커널 내부 (processCommand)
const ctx = {
  state: scopeFilter(mwCtx.state, currentScope),
  // ...
};

function scopeFilter(fullState: AppState, scope: string): unknown {
  if (scope === GLOBAL) return fullState;            // OS 커맨드: 전체
  return fullState.apps[scope];                       // 앱 커맨드: 자기 slice만
}
```

반환값도 scope에 맞게 **자동 병합**:

```typescript
// executeEffects에서
if (key === "state") {
  if (handlerScope === GLOBAL) {
    setState(() => value as S);                       // 전체 교체
  } else {
    setState(prev => ({
      ...prev,
      apps: { ...prev.apps, [handlerScope]: value }  // slice만 교체
    }));
  }
}
```

**장점**:
- 앱 커맨드는 `ctx.state`가 곧 자기 state → ergonomics 극대화
- `{ state: newAppState }`만 반환하면 됨 → 실수 불가능
- OS state 접근 원천 차단
- **기존 OS 커맨드 변경 불필요** (GLOBAL scope는 현재와 동일)

**단점**:
- 앱이 OS state를 읽어야 하는 정당한 케이스가 있다면? → `defineContext`로 해결

### 접근법 B: Lens/Selector 기반

`registerAppSlice`에서 state lens를 정의하고, 커맨드에 lens를 주입:

```typescript
const todoSlice = registerAppSlice("todo", { ... });

// 커맨드에서:
todoSlice.defineCommand("ADD_TODO", (appState) => (payload) => {
  // appState는 이미 TodoState 타입
  return produce(appState, draft => { ... });
});
```

**장점**: 타입 안전, 앱 개발자가 커널 구조를 몰라도 됨
**단점**: 커널 코어 변경이 아닌 wrapper → 우회일 뿐 근본 해결 아님

### 접근법 C: OS 읽기 전용 Context 제공

앱에서 OS state를 읽어야 할 때는 `defineContext`로 명시적 주입:

```typescript
const FocusInfo = kernel.defineContext("focus-info", () => ({
  activeZoneId: kernel.getState().os.focus.activeZoneId,
  focusedItemId: /* 계산 */,
}));

// 앱 커맨드에서:
todoGroup.defineCommand("ADD_TODO", [FocusInfo], (ctx) => () => {
  const focus = ctx.inject(FocusInfo);  // 읽기 전용, 타입 안전
  // ctx.state.os → 존재하지 않음 (접근법 A와 결합)
});
```

---

## 7. 결론

### 핵심 발견

| 항목 | 현재 | 원칙 |
|---|---|---|
| State visibility | 전체 노출 | **scope에 따라 격리** |
| State mutation | 전체 교체 | **자기 scope만 수정** |
| Cross-scope read | 자유 | **Context injection 통해서만** |

### 권장 방향

1. **접근법 A + C 결합**: 커널 코어에서 scope별 state view + 자동 병합 구현
2. OS state 접근이 필요하면 `defineContext`로 명시적 주입
3. 앱 커맨드의 return type이 자기 slice state → ergonomics + 안전성 동시 확보

### 영향 범위

- **커널 코어 변경**: `processCommand`의 ctx 생성부 + `executeEffects`의 state 반환부
- **기존 OS 커맨드**: 변경 없음 (GLOBAL scope → 기존과 동일하게 전체 state)
- **신규 앱 커맨드**: 자기 slice state만 받고 반환 (대폭 간결해짐)

---

## 관련 코드

| 파일 | 핵심 라인 | 역할 |
|---|---|---|
| [createKernel.ts](file:///Users/user/Desktop/interactive-os/packages/kernel/src/createKernel.ts#L259-L266) | L259-266 | ctx 생성 (state 노출) |
| [createKernel.ts](file:///Users/user/Desktop/interactive-os/packages/kernel/src/createKernel.ts#L324-L327) | L324-327 | state effect 실행 (전체 교체) |
| [appSlice.ts](file:///Users/user/Desktop/interactive-os/src/os-new/core/application/appSlice.ts) | 전체 | 앱 slice 등록 (Phase 1) |
| [3-commands/*](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands) | 전체 | OS 커맨드 (ctx.state.os.* 접근) |
