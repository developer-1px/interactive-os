# Type System

> How Kernel achieves 100% type safety through branded tokens.

---

## Design Principle

> **No implicit anything.** Every ID is a typed Token created through `define*()`. Raw strings cause compile errors.

This is critical for **LLM-assisted development** — when AI generates code, compile errors catch every typo and type mismatch. No runtime failures from string mismatches.

---

## Token Types

Kernel defines four token types. Each uses a different TypeScript technique to achieve compile-time safety.

### EffectToken — Branded String

```typescript
declare const __effectBrand: unique symbol;

type EffectToken<Type extends string = string, Value = unknown> = Type & {
  readonly [__effectBrand]: Value;
};
```

**Runtime value:** plain string (e.g., `"FOCUS_ID"`)
**Compile-time:** branded with Value type; prevents structural subtyping

```typescript
const FOCUS = kernel.defineEffect("FOCUS", (id: string) => { ... });
// typeof FOCUS = EffectToken<"FOCUS", string>

// Used as computed key in EffectMap:
return { [FOCUS]: "item-1" };  // ✅ string
return { [FOCUS]: 42 };        // ❌ number ≠ string
```

### ScopeToken — Branded String

```typescript
declare const __scopeBrand: unique symbol;

type ScopeToken<Id extends string = string> = Id & {
  readonly [__scopeBrand]: true;
};
```

**Runtime value:** plain string (e.g., `"TODO_LIST"`)
**Compile-time:** distinct from plain strings

```typescript
const TODO = defineScope("TODO");
// typeof TODO = ScopeToken<"TODO">

kernel.group({ scope: TODO });       // ✅
kernel.group({ scope: "TODO" });     // ❌ string ≠ ScopeToken
```

### ContextToken — Wrapper Object

```typescript
type ContextToken<Id extends string = string, Value = unknown> = {
  readonly __id: Id;
  readonly __phantom?: Value; // compile-time only
};
```

**Runtime value:** object `{ __id: "NOW" }`
**Compile-time:** carries Value type via phantom property

> [!NOTE]
> ContextToken uses a wrapper object instead of a branded string because TypeScript's mapped types fail to infer `Value` from branded strings. The object form enables `InjectResult<Tokens>` to correctly derive `{ NOW: number, USER: User }` from `[ContextToken<"NOW", number>, ContextToken<"USER", User>]`.

### Command — Branded Object

```typescript
declare const __commandBrand: unique symbol;

type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly scope?: ScopeToken[];
  readonly [__commandBrand]: true;
};
```

Cannot be constructed manually. Only `CommandFactory` (returned by `defineCommand`) can create valid Commands:

```typescript
dispatch(INCREMENT());                  // ✅ CommandFactory creates branded Command
dispatch({ type: "INCREMENT" });        // ❌ missing brand symbol
dispatch({ type: "INCREMENT" } as any); // ⚠️ compiles but circumvents safety
```

### CommandFactory — Factory Function

```typescript
type CommandFactory<Type extends string = string, Payload = void> = {
  (...args: /* conditional */): Command<Type, Payload>;
  readonly commandType: Type;
  readonly id: string;
};
```

Payload handling is conditional:

```typescript
// void payload — no arguments needed
const INC = kernel.defineCommand("INC", handler);
INC();     // ✅
INC(42);   // ❌ compile error

// typed payload — argument required
const SET = kernel.defineCommand("SET", (ctx) => (v: number) => ...);
SET(42);       // ✅
SET();         // ❌ compile error — number expected
SET("wrong");  // ❌ compile error — string ≠ number
```

---

## Type Inference Chain

The entire chain from `createKernel` to handler `ctx` is inferred without manual annotations.

### State Type

```typescript
const kernel = createKernel<{ count: number; name: string }>({
  count: 0, name: "",
});

kernel.defineCommand("INC", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  //                      ^^^^^ number — from createKernel<S>
}));
```

### Payload Type

```typescript
kernel.defineCommand("SET", (ctx) => (value: number) => ({
  state: { ...ctx.state, count: value },
  //                             ^^^^^ number — from handler annotation
}));
```

### Injected Context Type

```typescript
const NOW = kernel.defineContext("NOW", (): number => Date.now());
const USER = kernel.defineContext("USER", () => ({ name: "Alice" }));

const g = kernel.group({ inject: [NOW, USER] });

g.defineCommand("CMD", (ctx) => () => {
  ctx.NOW;          // number    (from ContextToken<"NOW", number>)
  ctx.USER.name;    // string    (from ContextToken<"USER", { name: string }>)
  ctx.state.count;  // number    (from createKernel<S>)
});
```

How it works:

```
group({ inject: [NOW, USER] })
  → createGroup<S, E, [ContextToken<"NOW", number>, ContextToken<"USER", {name: string}>]>
  → TypedContext<S, InjectResult<Tokens>>
  → TypedContext<S, { NOW: number; USER: { name: string } }>
  → ctx = { state: S; NOW: number; USER: { name: string } }
```

### EffectToken Type

```typescript
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {});

return {
  [NOTIFY]: "hello",  // ✅ string
  [NOTIFY]: 42,       // ❌ compile error — number ≠ string
};
```

---

## Helper Types

### InjectResult

Derives injected context fields from a tuple of ContextTokens:

```typescript
type InjectResult<T extends ContextToken[]> = {
  [K in T[number] as K["__id"]]: K extends ContextToken<string, infer V> ? V : never;
};

// InjectResult<[ContextToken<"NOW", number>, ContextToken<"USER", User>]>
// = { NOW: number; USER: User }
```

### TypedContext

Handler context type combining state and injected values:

```typescript
type TypedContext<S, Injected = Record<string, never>> = {
  readonly state: S;
} & Readonly<Injected>;
```

### BaseCommand

Generic command interface for storage and dispatch where the concrete type is unknown:

```typescript
interface BaseCommand {
  readonly type: string;
  readonly payload?: unknown;
  readonly scope?: ScopeToken[];
}
```

### MiddlewareContext

Context passed through middleware hooks:

```typescript
type MiddlewareContext = {
  command: Command;
  state: unknown;
  handlerScope: string;
  effects: Record<string, unknown> | null;
  injected: Record<string, unknown>;
};
```

---

## Anti-Patterns

```typescript
// ❌ Raw string dispatch — breaks at compile time
dispatch({ type: "INCREMENT", payload: undefined });

// ❌ dispatch overloading — does not exist
dispatch("INCREMENT");
dispatch("SET_COUNT", 42);

// ✅ CommandFactory pattern — the only way
dispatch(INCREMENT());
dispatch(SET_COUNT(42));
```

---

## Next

→ [Middleware](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/06-middleware.md) — Complete middleware guide.
