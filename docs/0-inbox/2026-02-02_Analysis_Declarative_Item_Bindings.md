# Analysis: Declarative Item Bindings (`<OS.Binding>`)

**Date**: 2026-02-02
**Topic**: Decoupling Keybindings via Component Primitives vs. Centralized Env
**Pattern Proposed**:
```tsx
<OS.Item id="secret-file">
  <OS.Binding key="Enter" command="DECRYPT_AND_OPEN" />
  <OS.Trigger bind="DECRYPT_AND_OPEN">Decrypt</OS.Trigger>
</OS.Item>
```

---

## 🔵 Blue Team (The Proponents)
*"Maximize Locality of Behavior and Developer Velocity"*

1.  **Locality of Behavior (LoB)**: 
    -   The developer reading `SecretFileItem.tsx` immediately sees that `Enter` triggers `DECRYPT`. They don't need to hunt for a generic `listKeys.ts` or `globalKeymap.ts`.
    -   Reduces cognitive load when maintaining specific components.
2.  **Contextual Precision**:
    -   This binding *only* exists when this specific Item is rendered and focused.
    -   Solved the "Context Key" problem implicitly. No need for complicated `when: "focus == secret-file"` clauses in a global registry.
3.  **Declarative Power**:
    -   Fits perfectly with the `<Field>`, `<Trigger>`, `<Zone>` philosophy.
    -   React's lifecycle automatically handles registration/unregistration. No stale bindings.
4.  **Composability**:
    -   Easy to create a `<VipBinding>` wrapper that only injects the binding if the user has permissions.

## 🔴 Red Team (The Critics)
*"Guard against Fragmentation and Performance Bloat"*

1.  **Performance Overhead**:
    -   **Mounting Cost**: If a list has 1,000 items, and each has an `<OS.Binding>`, that's 1,000 `useEffect` hooks firing to register bindings. This could cause significant frame drops on large lists.
    -   *Mitigation*: Virtualization is mandatory. Only visible items register bindings.
2.  **Fragmentation & Discovery**:
    -   "Where are all the shortcuts defined in this app?" becomes an impossible question to answer.
    -   Global auditability is lost. You can't easily generate a "Keyboard Shortcuts Sheet" for the user if bindings are buried in component render cycles.
3.  **Conflict Management**:
    -   What if the parent `Zone` keys `Enter` to "Open Details"? Does the Item override it? 
    -   Determining precedence becomes implicit (React Tree order) rather than explicit (Priority Config).
4.  **Consistency Drift**:
    -   Developer A binds `Enter` to Open. Developer B binds `Space` to Open in another Item.
    -   Without a central "Law", the UI becomes inconsistent.

## ⚖️ The Verdict (Architecture Decision)

**Adopt a Hybrid "Shadow Registry" Approach.**

The usage of `<OS.Binding>` is **approved for Specific/Exception Logic**, but **discouraged for Generic/Navigation Logic**.

### Implementation Strategy
1.  **The Primitive**: create `<OS.Binding>` that registers effectively with the `useCommandEngine` or `FocusContext`.
2.  **Optimization**: 
    -   The `Zone` should maintain a `Map<ItemID, Binding[]>`.
    -   When `focusedItemId` changes, the `Zone` looks up *only* the bindings for that ID.
    -   Do *not* add global window listeners per Item.
3.  **Auditability**: 
    -   In Development mode, the `Zone` should log effective bindings to the Inspector.

### Recommendation
Use standard Zone-level keymaps for 90% of cases (Navigation, selection, generic open).
Use `<OS.Binding>` for highly specific, item-local interactions (e.g., "Decrypt", "Play Preview", "Quick Buy") where defining a global type would be overkill.
