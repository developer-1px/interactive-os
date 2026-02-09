# [kernel] Unified Group API (v2.1) — Context-First Curried Pattern

## 1. 개요 (Overview)

Kernel v2의 `defineCommand` API를 **Context-First Currying** 패턴으로 업그레이드했다.
기존 v2 방식의 한계였던 "Payload 핸들러의 `ctx` 타입 추론 실패(L1)" 문제를 완벽하게 해결했다.

**변경 규모**: 39 files changed, +4546 insertions, -920 deletions (Test files rewrite 포함)

---

## 2. 문제와 해결 (Problem & Solution)

### 문제: 제네릭 추론 경합 (Generic Inference Contention)

```typescript
// (ctx, payload) 방식
defineCommand("SET", (ctx, payload: number) => ...);
```

TypeScript는 `payload`의 제네릭 `P`를 추론하는 동안 `ctx`의 Contextual Typing을 지연/포기한다. 결과적으로 `ctx`가 `any`가 되며, 사용자가 수동으로 타입을 지정해야 했다.

### 해결: Context-First Currying

```typescript
// (ctx) => (payload) => 방식
defineCommand("SET", (ctx) => (payload: number) => ...);
```

핸들러를 두 단계로 분리하여 추론을 격리했다:
1. **Outer Function** `(ctx) => ...`: 제네릭 관여 없음. `ctx`가 `Ctx` 타입으로 즉시 추론됨. ✅
2. **Inner Function** `(payload) => ...`: 리턴 타입 매칭을 통해 `payload`의 제네릭 `P` 추론. ✅

---

## 3. 사용법 (Usage)

### 3.1 Payload 없는 커맨드

```typescript
// Before
defineCommand("INC", (ctx) => ({ ... }));

// After: 내부에 () => 추가
defineCommand("INC", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));
```

### 3.2 Payload 있는 커맨드

```typescript
// Before: ctx에 타입 명시 필요
defineCommand("SET", (ctx: { state: S }, payload: number) => ({ ... }));

// After: ctx 타입 명시 불필요!
defineCommand("SET", (ctx) => (payload: number) => ({
  state: { ...ctx.state, count: payload },
}));
```

---

## 4. 결과 (Results)

- **Type Safety**: 모든 핸들러에서 `ctx`가 자동으로 강력하게 타이핑됨.
- **Zero Annotation**: 사용자는 `payload` 타입만 적으면 됨. `ctx`는 알아서 따라옴.
- **Migration**: 기존 코드를 `(ctx) => () =>` 또는 `(ctx) => (p) =>` 형태로 변환 완료.

## 5. 한계 (Limitations)

- **Syntax**: `() =>` 화살표가 하나 더 늘어남. (하지만 "Context 주입 후 Action 실행"이라는 멘탈 모델과 일치)
- **Runtime**: 각 디스패치마다 클로저 1개 생성 (성능 영향 미미함).

---

## 6. 결론 (Conclusion)

이 패턴은 TypeScript의 타입 추론 시스템을 최대한 활용하여 **DX(Developer Experience)**를 극대화한 최종 형태이다.
이제 `createKernel` -> `defineCommand` 워크플로우에서 타입 스트레스가 완전히 사라졌다.
