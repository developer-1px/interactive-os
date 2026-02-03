# Investigation: Aligning Command Logic with E2E `expect` Syntax

**Origin:** User suggestion (/inbox)
**Goal:** Reduce cognitive dissonance by making Command Rules look like Test Assertions.

---

## 1. The Concept
Currently, we use a classic "Builder" pattern:
```typescript
Rule().key('focusIndex').gt(0)
```
The user suggests an **E2E/Jest-like** syntax:
```typescript
Expect('focusIndex').toBeGreaterThan(0)
```

## 2. Analysis
### ✅ The Pros (Cognitive Alignment)
1.  **Universal Language**: Every JS developer knows Jest/Playwright/Vitest.
2.  **Readability**: `toBeGreaterThan(0)` is more sentence-like than `.gt(0)`.
3.  **Mental Model**: Treating a command condition as an "Assertion of State" is philosophically correct.

### ⚠️ The Constraint (Serializability)
We CANNOT use the full power of functional expectation:
`expect(ctx => ctx.index).toBe(0)` ❌
-   Functions cannot be serialized to JSON for the Inspector.
-   We effectively lose the "Why" (which variable was accessed?).

**The Compromise:**
We MUST keep the **String Key Reference**:
`Expect('focusIndex').toBe(0)` ✅

## 3. Proposed API Design (The Wrapper)
We don't need to rewrite the execution engine. we just wrap the Builder.

```typescript
// Proposed 'Expect' Helper
export function Expect<T>(key: keyof T) {
    const builder = new ComparisonBuilder<T>(key);
    return {
        toBe: (val) => builder.eq(val),
        not: { toBe: (val) => builder.neq(val) },
        toBeGreaterThan: (val) => builder.gt(val),
        toBeLessThan: (val) => builder.lt(val),
        // ...
    };
}
```

## 4. Comparison

| Feature | Current `Rule().key().gt()` | Proposed `Expect().toBeGreaterThan()` |
| :--- | :--- | :--- |
| **Typing** | Strict | Strict |
| **Runtime** | Generates `LogicNode` | Generates `LogicNode` |
| **Vibe** | SQL / Query Builder | Test / Assertion |
| **Verbosity** | Low (`.gt`) | High (`.toBeGreaterThan`) |

## 5. Recommendation
**Adopt the Expect Syntax.**
The verbosity cost is negligible compared to the readability win. "Expect" makes it clear that we are asserting a prerequisite for the command.

**Next Steps:**
1.  Add `Expect` wrapper to `builder.ts`.
2.  Update a few commands to demonstrate the new style.
