# Keyboard Event Handling & Canonical Keys

## 1. Context & Problem
In the initial implementation of the Interaction OS, we relied on the native `KeyboardEvent.key` property for keybinding matching. 

### The "Naive" Approach
```typescript
// Initial implementation
const matches = bindings.filter(b => b.key === e.key);
```

### The Limitation
While `KeyboardEvent.key` is modern and generally preferred over `keyCode`, it has a specific behavior regarding modifier keys that makes it insufficient for complex "Pro Tool" shortcuts:
- **Modifier Blindness**: When `Meta` (Command) is held down and `ArrowUp` is pressed, `e.key` reports `'ArrowUp'`. It does *not* inherently encode the modifier state in the string.
- **Ambiguity**: This leads to a situation where `ArrowUp` (Move Focus) and `Meta+ArrowUp` (Move Item) are indistinguishable if we only look at `e.key`.

## 2. The Solution: Canonical Key System
To build a robust, persistent SaaS-grade application, we must normalize inputs before they reach the command engine. We have adopted the **Canonical Key Pattern**.

### Canonicalization Logic
All keyboard events are intercepted and converted to a normalized string format **before** matching.

**Format**: `[Meta+][Ctrl+][Alt+][Shift+]Key` (Strict Order)

**Implementation Reference**: `src/lib/keybinding.ts`

```typescript
// Robust matching
const canonicalEventKey = getCanonicalKey(e); // e.g. "Meta+ArrowUp"
const normalizedDef = normalizeKeyDefinition(b.key); // e.g. "Meta+ArrowUp"

return canonicalEventKey === normalizedDef;
```

## 3. Why This wasn't Default? (Lessons Learned)
1.  **Dependency-Free Ambition**: We aimed for a zero-dependency architecture (avoiding heavy libs like `mousetrap`). Writing a robust key engine from scratch is non-trivial and edge cases like Mac vs Windows modifier behavior often appear only during "Power User" testing (e.g. rapid item moving).
2.  **Web Standard Complexity**: The Web's `KeyboardEvent` API is deceptively simple but practically inconsistent. A "Professional" system requires this explicit normalization layer which we have now codified as a core primitive.

## 4. Usage Guidelines
- **Always** use `getCanonicalKey` when logging or matching raw keyboard events.
- **Never** rely on `e.key` alone for commands that might have modifier variants.
- **Display**: Use the canonical string in UI components (like the Inspector) to ensure the user sees exactly what the system sees.
