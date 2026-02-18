# Kernel App Migration — 구조적 Gap 분석

> Phase 2(Todo 앱 마이그레이션) 진행 중 발견한 커널과 앱 커맨드 시스템 간의 구조적 불일치.
> 억지로 구현하지 않고, 개밥먹기를 통해 요구사항을 정제한 후 해결한다.

## 현재 상태

| 레이어 | 현재 경로 (Zustand) | 목표 경로 (Kernel) | 상태 |
|---|---|---|---|
| OS 커맨드 (Navigate, Tab 등) | `KeyboardListener → Keybindings → kernel.dispatch` | 동일 | ✅ 완료 |
| 앱 커맨드 (AddTodo 등) | `createCommandFactory → createEngine → CommandEngineStore` | `registerAppSlice → kernel.defineCommand` | 🔴 Gap 있음 |
| 앱 state | Zustand (`createCommandStore`) | `kernel.state.apps[appId]` | 🟡 인프라 완료, 연결 미완 |

---

## Gap 1: Command Definition Pattern 불일치

### 현재 (앱 커맨드)
```typescript
// Pure state reducer — 단순하고 테스트하기 쉬움
defineListCommand({
  id: "ADD_TODO",
  run: (state, payload?) => produce(state, draft => { ... })
})
```

### 커널
```typescript
// Context-injected handler returning effect map
group.defineCommand("ADD_TODO", [AppState],
  (ctx) => (payload) => ({
    state: produce(ctx.state, draft => {
      draft.apps.todo = ...  // 전체 AppState를 알아야 함
    })
  })
)
```

### 문제
- 앱 커맨드는 **자기 앱 state만** 알면 됨 (`AppState` → `TodoAppState`)
- 커널 커맨드는 **전체 커널 state**(`{ os, apps }`)를 반환해야 함
- 17개 커맨드를 전부 `ctx.state.apps.todo`로 감싸야 하면 **가독성과 ergonomics이 심각하게 저하**

### 필요한 것
- `group.defineCommand`에서 **앱 스코프 state만 읽고 쓰는** 축약 API
- 예: `group.defineAppCommand(type, (appState) => (payload) => newAppState)`

---

## Gap 2: `OS.FOCUS` Placeholder 해소

### 현재
```typescript
// 앱 커맨드가 OS.FOCUS를 payload 타입으로 사용
run: (state, payload: { id: number | typeof OS.FOCUS }) => ...

// resolveFocusMiddleware가 실행 시점에 OS.FOCUS를 실제 focusedItemId로 치환
```

### 커널
- 커널에는 `resolveFocusMiddleware` 같은 placeholder 해소 메커니즘이 없음
- 커널의 `defineContext`로 focus 정보를 inject할 수 있지만, payload 치환과는 다른 패턴

### 필요한 것
- 커널 미들웨어에서 `payload.id === OS.FOCUS`를 감지하고 실제 focusedItemId로 치환하는 로직
- 또는: 앱 커맨드가 payload 대신 context injection으로 focus를 받는 패턴 규약

---

## Gap 3: App Effects 처리 (`state.effects[]`)

### 현재
```typescript
// 앱 커맨드가 state.effects 배열에 side effect를 push
draft.effects.push({ type: "FOCUS_ID", id: newId });
draft.effects.push({ type: "SCROLL_INTO_VIEW", id: newId });

// navigationMiddleware가 이 배열을 읽어서 실행
```

### 커널
- 커널은 `defineEffect`로 named effect를 등록하고, 커맨드의 return value에서 effect를 실행
- 앱 state 안에 effects 배열을 넣는 패턴은 커널과 맞지 않음

### 필요한 것
- 앱 effects(`FOCUS_ID`, `SCROLL_INTO_VIEW`, `NAVIGATE`)를 커널 `defineEffect`로 마이그레이션
- 커맨드가 `{ state, focusId: newId }` 형태로 반환하면 커널이 effect 실행

---

## Gap 4: Keybinding `when` 조건 + `contextMap`

### 현재
```typescript
// 앱이 contextMap으로 조건 평가용 상태를 제공
contextMap: (state, env) => ({
  activeZone: env.activeGroupId,
  isEditing: !!state.ui.editingId,
  isDraftFocused: env.focusedItemId === "DRAFT",
})

// 키맵에서 when 표현식으로 조건부 바인딩
{ key: "Enter", command: "ADD_TODO", when: "isDraftFocused" }
{ key: "Enter", command: "START_EDIT", when: "!isDraftFocused" }
```

### 커널
- 커널 keybinding은 `when: "navigating" | "editing"`만 지원
- 앱별 커스텀 조건(`isDraftFocused`, `activeZone === "sidebar"` 등)을 평가할 수 없음

### 필요한 것
- 커널 Keybinding에 **앱 레벨 when 조건** 평가 기능 추가
- 또는: 앱이 자체 keybinding resolver를 커널에 등록하는 메커니즘

---

## Gap 5: Middleware Pipeline 호환성

### 현재 (Zustand)
```typescript
// Redux-style middleware: (next) => (state, action) => nextState
const historyMiddleware = (next) => (state, action) => {
  const nextState = next(state, action);
  // record snapshot...
  return produce(nextState, draft => { draft.history.past.push(...) });
}
```

### 커널
```typescript
// Before/After pattern
{ before(ctx) { ... }, after(ctx) { ... } }
```

### 상태
- `historyKernelMiddleware.ts`와 persistence middleware는 이미 커널 패턴으로 포팅 완료 ✅
- **하지만** history middleware가 `ctx.state`를 직접 변경하는 것이 맞는지 검증 필요
  - 커널의 `after`에서 state를 변경하면 또 다른 middleware cycle이 돌지 않는지?

---

## 권장 접근 전략

```
❌ 17개 커맨드를 한번에 커널로 포팅하는 Big Bang
✅ 커널 API를 개밥먹기로 보강 → 점진 마이그레이션
```

### 우선순위

1. **Gap 1 해소**: `defineAppCommand` 축약 API 설계 (ergonomics)
2. **Gap 3 해소**: App effects → kernel effects 매핑
3. **Gap 2 해소**: OS.FOCUS 해소 미들웨어
4. **Gap 4 해소**: 앱 레벨 keybinding 조건
5. **Gap 5 검증**: history middleware state 변경 안전성

각 Gap은 독립적으로 해결 가능하며, 해결 순서대로 Todo 커맨드를 하나씩 마이그레이션한다.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `src/os-new/core/application/appSlice.ts` | 앱 state 등록 팩토리 (Phase 1 완료) |
| `src/os-new/middleware/historyKernelMiddleware.ts` | History 커널 MW (Phase 1 완료) |
| `src/os-new/core/application/defineApplication.ts` | 현재 앱 정의 (마이그레이션 대상) |
| `src/os-new/core/command/model/createEngine.ts` | 현재 엔진 팩토리 (삭제 대상) |
| `src/os-new/core/command/store/CommandEngineStore.ts` | 현재 브릿지 (삭제 대상) |
