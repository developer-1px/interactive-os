# defineCommand — 오버로딩 제거 API 대안 비교

## 1. 개요

현재 `defineCommand`는 scope × payload × inject × middleware 조합으로 **12개 오버로드**가 존재한다.
이로 인해 TS 추론 실패, LLM 환각, 유지보수 복잡성이 발생했다.

**원칙**: 오버로딩 없이 단일 시그니처로 모든 케이스를 처리하는 API를 찾는다.

**현재 사용 축**:
- `type`: 커맨드 이름 (필수)
- `handler`: 커맨드 핸들러 (필수)
- `scope`: 스코프 토큰 (선택)
- `inject`: 컨텍스트 토큰 (선택)
- `payload`: 페이로드 타입 (선택, handler 시그니처에서 추론)

---

## 2. 대안

### A. Config Object — 올인원

```typescript
kernel.defineCommand({
  type: "NAVIGATE",
  scope: DIALOG,
  inject: [NOW, USER],
  handler: (ctx, payload: string) => ({
    state: { ...ctx.state, result: ctx.NOW }
  })
})
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ❌ inject와 handler가 같은 객체 — ctx 타입 추론 불가 |
| LLM 친화 | ⚠️ 어떤 필드를 넣어야 하는지 기억해야 함 |
| re-frame 정합 | ⚠️ handler가 config 안에 감춰짐 |
| 테스트 | ⚠️ handler를 분리 추출하기 어려움 |

---

### B. Config + Handler 분리

```typescript
kernel.defineCommand({
  type: "NAVIGATE",
  scope: DIALOG,
  inject: [NOW, USER],
}, (ctx, payload: string) => ({
  state: { ...ctx.state, result: ctx.NOW }
}))
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ❌ 동일 호출 내 인자 간 제네릭 전파 불가 (A와 동일 문제) |
| LLM 친화 | ✅ handler 분리되어 가독성 좋음 |
| re-frame 정합 | ✅ coeffect 선언 + 핸들러 분리 |
| 테스트 | ✅ handler 독립 전달 가능 |

---

### C. ctx.get(TOKEN) — 서비스 로케이터

```typescript
kernel.defineCommand("NAVIGATE", (ctx, payload: string) => {
  const now = ctx.get(NOW);    // number
  const user = ctx.get(USER);  // { name, role }
  return { state: { ...ctx.state, result: now } };
})
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ✅ `get<V>(token: ContextToken<any, V>): V` — 완벽 |
| LLM 친화 | ✅ `Map.get` 패턴, 환각 최소 |
| re-frame 정합 | ❌ coeffect 선언이 사라짐, 핸들러가 직접 호출 (impure) |
| 테스트 | ⚠️ ctx.get을 모킹해야 함 (순수 데이터 주입 불가) |

---

### D. inject가 handler를 감싸기 (커링)

```typescript
kernel.defineCommand("NAVIGATE",
  inject(NOW, USER)((ctx, payload: string) => ({
    state: { ...ctx.state, result: ctx.NOW }
  }))
)
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ✅ inject 내부에서 단일 제네릭 컨텍스트 |
| LLM 친화 | ❌ 이중 괄호 `inject(...)((ctx) => ...)` 환각 위험 |
| re-frame 정합 | ✅ coeffect 선언 유지 |
| 테스트 | ✅ inject 없이 handler만 추출 가능 |

---

### E. Builder / Fluent

```typescript
kernel.command("NAVIGATE")
  .scope(DIALOG)
  .inject(NOW, USER)
  .handle((ctx, payload: string) => ({
    state: { ...ctx.state, result: ctx.NOW }
  }))
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ✅ 각 체이닝 단계가 별도 추론 사이트 |
| LLM 친화 | ⚠️ 체이닝 선택지 분기 — 어떤 메서드를 호출해야 할지 고민 |
| re-frame 정합 | ✅ 인터셉터 체인과 유사 |
| 테스트 | ⚠️ builder 결과물을 추출하기 어려움 |

---

### F. 별도 함수 분리

```typescript
// 기본 (inject 없음)
kernel.defineCommand("INCREMENT", (ctx) => ...)

// inject 있는 경우 (별도 함수, 토큰이 첫 인자)
kernel.defineCommandWith([NOW, USER], "NAVIGATE", (ctx) => {
  ctx.NOW  // typed
})

// scope 있는 경우
kernel.defineCommandScoped(DIALOG, "NAVIGATE", (ctx) => ...)
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ✅ 단일 시그니처, 토큰 첫 인자에서 추론 |
| LLM 친화 | ⚠️ 함수 이름을 기억해야 함 (defineCommand vs defineCommandWith) |
| re-frame 정합 | ⚠️ re-frame은 단일 reg-event-fx |
| 테스트 | ✅ handler 독립 |

---

### G. ctx에 inject 함수 전달

```typescript
kernel.defineCommand("NAVIGATE", (ctx, payload: string) => {
  const now = ctx.inject(NOW);    // number — lazy resolve
  const user = ctx.inject(USER);  // { name, role }
  return { state: { ...ctx.state, result: now } };
})
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ✅ C와 동일 (`inject<V>(token): V`) |
| LLM 친화 | ✅ `inject`라는 이름으로 의도가 명확 |
| re-frame 정합 | ⚠️ C와 동일 — imperative |
| 테스트 | ⚠️ ctx.inject 모킹 필요 |

> C와 동일하나, `get`보다 `inject`라는 이름이 re-frame 어휘에 더 가까움.

---

### H. 제네릭 명시

```typescript
kernel.defineCommand<[typeof NOW, typeof USER]>("NAVIGATE", (ctx) => {
  ctx.NOW  // number
  ctx.USER // { name, role }
})
```

| 항목 | 평가 |
|---|---|
| 오버로드 | 0개 ✅ |
| TS 추론 | ⚠️ 작동하나 수동 제네릭 — 자동 추론이 아님 |
| LLM 친화 | ❌ typeof 토큰 배열을 제네릭에 넣는 패턴은 학습 데이터에 드묾 |
| re-frame 정합 | ⚠️ 런타임에 inject가 없으므로 provider 호출 시점 불명확 |
| 테스트 | ⚠️ 런타임 바인딩 필요 |

---

## 3. 비교 매트릭스

| 대안 | 오버로드 | TS 추론 | LLM 안전 | re-frame | 테스트 |
|---|---|---|---|---|---|
| **A. Config 올인원** | ✅ 0 | ❌ | ⚠️ | ⚠️ | ⚠️ |
| **B. Config + Handler** | ✅ 0 | ❌ | ✅ | ✅ | ✅ |
| **C. ctx.get(TOKEN)** | ✅ 0 | ✅ | ✅ | ❌ | ⚠️ |
| **D. inject()(handler)** | ✅ 0 | ✅ | ❌ | ✅ | ✅ |
| **E. Builder** | ✅ 0 | ✅ | ⚠️ | ✅ | ⚠️ |
| **F. 별도 함수** | ✅ 0 | ✅ | ⚠️ | ⚠️ | ✅ |
| **G. ctx.inject(TOKEN)** | ✅ 0 | ✅ | ✅ | ⚠️ | ⚠️ |
| **H. 제네릭 명시** | ✅ 0 | ⚠️ | ❌ | ⚠️ | ⚠️ |

## 4. 결론

- **TS 추론 + LLM 안전**: C(ctx.get) 또는 G(ctx.inject)
- **re-frame 순수성 유지**: D(커링) 또는 B(config+handler) — 단 B는 TS 추론 불가
- **모든 축에서 균형**: G(ctx.inject) — re-frame 어휘 유지 + TS 추론 + LLM 안전

> [!IMPORTANT]
> **핵심 트레이드오프**: declarative coeffect 선언(re-frame 순수성)과 TypeScript 추론 가능성은 현재 TS 타입 시스템에서 양립 불가.
> 
> 순수성을 선택하면 TS 추론을 포기(수동 타입 또는 커링)하고,
> TS 추론을 선택하면 imperative 호출을 받아들여야 한다.
