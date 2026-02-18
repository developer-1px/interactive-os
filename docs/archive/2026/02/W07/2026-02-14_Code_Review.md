# Code Review: defineApp v5 — 코드 우아함 (Elegance) 리뷰

> **대상**: `src/os/poc/defineApp-v5.ts`, `src/os/poc/usage-v5.ts`
> **일자**: 2026-02-14
> **기준**: `.agent/rules.md` + 코드 우아함 (가독성, 일관성, 불필요한 것의 부재)

---

## 🔴 철학 위반

### R1. `UNDO`/`REDO` handler에 when과 동일한 guard — 아직 남아있음

- **파일**: `usage-v5.ts` L90-91, L104-105
- **코드**:
  ```ts
  const undo = TodoApp.command("UNDO", (ctx) => {
      const prev = ctx.state.history.past[ctx.state.history.past.length - 1];
      if (!prev) return;   // ← when: canUndo가 이미 보장
  }, { when: canUndo });
  ```
- **문제**: Red/Blue 합의에서 "when이 보장하는 조건은 handler에서 생략"으로 확정했는데, `pasteTodo`와 `commitEdit`만 정리하고 **UNDO/REDO는 빠졌다.**
- **수정**: `if (!prev) return;` 제거, `const prev = ctx.state.history.past.at(-1)!;`

### R2. `as unknown as` 캐스팅 3곳 — 유지 (PoC 한정)

- **파일**: `defineApp-v5.ts` L228, L244, L262
- **상태**: v4부터 존재. PoC 인프라 한정이므로 production에서 해결.

---

## 🟡 네이밍/구조

### Y1. `void name` — 빈 줄보다 주석이 우아하지 않다

- **파일**: `defineApp-v5.ts` L271
- **코드**: `void name; // scope registration in real impl`
- **문제**: `void expr`는 "이 값을 쓸 것이다"라는 의도. 하지만 여기서는 "안 씀"의 표시.
  TypeScript의 `_name` 언더스코어 컨벤션이 더 명확하다.
- **제안**: 매개변수를 `_name`으로 변경

### Y2. `void config` — 동일 패턴

- **파일**: `defineApp-v5.ts` L286
- **제안**: `_config`으로 변경

---

## 🔵 개선 제안 — 우아함

### E1. `undo`/`redo` handler의 spread 대폭발 — Immer로 통일

```ts
// 현재 (L89-101): 5줄의 spread
return {
    state: {
        ...prev,
        history: {
            past: ctx.state.history.past.slice(0, -1),
            future: [ctx.state, ...ctx.state.history.future],
        },
    },
};

// Immer로: 더 읽기 좋음
return {
    state: produce(ctx.state, (d) => {
        const prev = d.history.past.pop()!;
        Object.assign(d, prev);
        d.history.future.unshift(ctx.state);
    }),
};
```

다른 모든 handler가 Immer를 쓰는데, undo/redo만 spread → **일관성 깨짐**.

### E2. Test section의 `console.assert` 반복 — describe/it 구조화

```ts
// 현재: 플랫한 assert 나열 (L326-407)
app.dispatch(syncDraft({ text: "Buy milk" }));
app.dispatch(addTodo());
console.assert(app.state.data.todoOrder.length === 1, "should have 1 todo");
```

이것은 **형식은 테스트, 구조는 스크립트**. 21개 assert가 의존 관계를 가지고 순차 실행됨.
PoC이니까 OK이지만, production에서는 `describe`/`it` + `beforeEach(app.reset())` 구조 필요.

### E3. `defineCondition`과 `defineSelector` — 구조 동일, DRY 가능

```ts
// defineCondition (L219-231) — 14줄
function defineCondition(name, predicate) {
    if (conditionNames.has(name)) throw ...;
    conditionNames.add(name);
    const cond = { name, evaluate: predicate, [brand]: true } as unknown as Condition<S>;
    conditionRegistry.push(cond);
    return cond;
}

// defineSelector (L235-247) — 14줄, 거의 동일
function defineSelector(name, select) {
    if (selectorNames.has(name)) throw ...;
    selectorNames.add(name);
    const sel = { name, select, [brand]: true } as unknown as Selector<S, T>;
    selectorRegistry.push(sel);
    return sel;
}
```

**패턴이 동일**. 제네릭 factory로 추출 가능:
```ts
function createRegistry<T>(brand: symbol, label: string) {
    const items: T[] = [];
    const names = new Set<string>();
    return {
        register(name: string, impl: any): T {
            if (names.has(name)) throw new Error(`${label} "${name}" already defined`);
            names.add(name);
            const entry = { name, ...impl, [brand]: true } as unknown as T;
            items.push(entry);
            return entry;
        },
        list: () => items as readonly T[],
    };
}
```

하지만 — 이건 **과잉 추상화**일 수 있다. 14줄 × 2 = 28줄을 줄이려고 제네릭 factory를 도입하면
오히려 읽기 어려워진다. **현행 "약간의 반복" 유지가 더 우아**할 수 있다.

### E4. `HandlerResult.dispatch`의 타입이 단수 — 확장 비호환

```ts
// 현재 (L72-75)
type HandlerResult<S> = {
    state: S;
    dispatch?: Command;  // ← 단수
} | void;

// 하지만 TestInstance (L322-329)에서는 배열도 처리:
const cmds = Array.isArray(result.dispatch) ? result.dispatch : [result.dispatch];
```

타입은 `Command` (단수), 구현은 `Command | Command[]`를 처리.
**타입과 구현의 불일치.** 타입을 `Command | Command[]`로 변경하거나, 구현에서 배열 처리를 제거.

### E5. `ZoneHandle`에 `createZone` 누락 — 합의 사항 (W31) 미반영

디스커션에서 "nested zone은 `zone.createZone()`"으로 확정 (W31).
하지만 `ZoneHandle` 인터페이스에 `createZone`이 없다.

```ts
// 현재
interface ZoneHandle<S> {
    command(...): CommandFactory;
    bind(...): BoundComponents;
    // createZone 없음!
}
```

### E6. usage-v5.ts의 `void` 무덤 — 13줄

```ts
// L438-446
void TodoListUI;
void TodoDraftUI;
void TodoEditUI;
void cancelEdit;
void editingTodo;
void _type;
void _bad;
void _void;
```

PoC 편의지만, 실제로 사용하지 않는 변수가 8개라는 건 "export해야 할 것들"이거나
"테스트에서 실제로 검증해야 할 것들"이 빠져있다는 신호.

---

## 종합 — 우아한가?

| 차원 | 점수 | 근거 |
|------|------|------|
| **API 표면** | ⭐⭐⭐⭐⭐ | `condition()`, `selector()`, `command()`, `createZone()`, `bind()` — 5개 메서드로 앱 전체를 표현. 깔끔 |
| **사용 코드 가독성** | ⭐⭐⭐⭐ | 선언적 흐름 (Condition → Selector → Command → Zone → Bind). 위에서 아래로 읽힘 |
| **일관성** | ⭐⭐⭐ | undo/redo만 spread, 나머지 Immer. when 합의 미정리 2곳 |
| **불필요한 것의 부재** | ⭐⭐⭐ | void 무덤, dead guard 잔존, 타입/구현 불일치 |
| **인프라 코드** | ⭐⭐⭐ | `as unknown as` 3곳, `void name` 패턴 |

**전체: ⭐⭐⭐⭐ (4/5)** — API는 우아하다. 내부 구현에 잔여물이 있다.
