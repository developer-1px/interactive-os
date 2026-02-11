# Gap 5: History Middleware `after` State 변경 안전성

> History MW가 `after`에서 `ctx.state`를 변경하는 것이 안전한가?

## 1. 개요

`createHistoryMiddleware`는 커널 `after` 훅에서 `ctx.state`를 직접 변경한다:

```typescript
// historyKernelMiddleware.ts:148-158
return {
    ...ctx,
    state: {
        ...(ctx.state as AppState),
        apps: {
            ...(ctx.state as AppState).apps,
            [appId]: updatedAppState,  // ← history.past에 스냅샷 push
        },
    },
};
```

### 질문
`after`에서 `ctx.state`를 바꾸면:
1. 또 다른 middleware cycle이 도나? (무한 루프 위험)
2. `executeEffects`의 `state` 이펙트와 충돌하나?
3. state lens와의 상호작용은?

## 2. 분석

### 커널의 `after` 처리 흐름 (createKernel.ts:282-313)

```
handler 실행 → result(effects) 획득
  → mwCtx.effects = result
  → after-middlewares 순회 (역순)
    → 각 MW가 mwCtx를 변환 (state, effects 모두 변경 가능)
  → executeEffects(result)  ← result에 state가 있으면 setState 호출
```

### 이슈 1: 무한 루프 위험 — ❌ 없음

`after`는 단순 transform이다. `dispatch`를 호출하지 않는다.
`after`가 반환한 `mwCtx`는 다시 middleware chain에 들어가지 않는다.
따라서 **cycle이 돌지 않는다**.

### 이슈 2: `executeEffects`와의 충돌 — ⚠️ 문제 있음

현재 흐름:
```
1. handler returns { state: newTodoState }     // 앱 state 변경
2. after MW: ctx.state에 history 추가           // ctx.state 변경
3. executeEffects: result.state로 setState()    // handler의 원래 반환값 사용
```

**`after`에서 바꾼 `ctx.state`는 `executeEffects`에 반영되지 않는다.**

왜? `result = mwCtx.effects` (line 301)이고, `effects.state`가 handler의 반환값이니까.
`after`가 `mwCtx.state`를 바꿔도, `effects.state`는 handler가 반환한 원래 값 그대로다.

즉 history MW가 `ctx.state`에 히스토리를 추가해도, `executeEffects`가 `effects.state`로 덮어쓰면 **히스토리가 유실**된다.

### 이슈 3: State Lens와의 상호작용 — ⚠️ 관련 있음

State lens가 적용된 scope에서는:
- handler가 반환한 `state`는 **scoped slice** (예: `TodoState`)
- `executeEffects`가 lens의 `set()`으로 merge

History MW는 `ctx.state` (전체 AppState)를 직접 조작 → lens bypass.
이는 의도적이지만, lens와 동시에 동작할 때 **누가 이기는지** 순서에 의존한다.

## 3. 결론

| 항목 | 상태 | 설명 |
|---|---|---|
| 무한 루프 | ✅ 안전 | after는 cycle을 돌지 않음 |
| effects.state 충돌 | ⚠️ 잠재적 문제 | after에서 바꾼 state가 effects.state에 덮일 수 있음 |
| State lens 충돌 | ⚠️ 확인 필요 | lens merge와 after state 변경의 순서 의존성 |

### 제안

History MW가 `ctx.state` 대신 **`ctx.effects`를 변환**하는 방식으로 변경하면 두 이슈 모두 해결:

```typescript
// 현재: ctx.state를 직접 변경
return { ...ctx, state: { ...ctx.state, apps: { [appId]: withHistory } } };

// 제안: ctx.effects.state를 변환 (effects pipeline을 통해 적용)
return { ...ctx, effects: { ...ctx.effects, state: withHistory } };
```

이렇게 하면 `executeEffects`가 history가 포함된 state를 자연스럽게 적용한다.
단, state lens와의 상호작용은 추가 검증 필요.

## 관련 파일

| 파일 | 역할 |
|---|---|
| [historyKernelMiddleware.ts](file:///Users/user/Desktop/interactive-os/src/os-new/middleware/historyKernelMiddleware.ts) | History MW 구현 |
| [createKernel.ts](file:///Users/user/Desktop/interactive-os/packages/kernel/src/createKernel.ts#L270-L313) | after 처리 흐름 |
