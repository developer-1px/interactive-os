# Architecture Debate: Where should `allowInInput` live?

## The Core Question
**Is "allowing execution in input" a property of the *Command* (Logic) or the *Keybinding* (Trigger)?**

### 1. User's Argument (The Extrinsic View)
> "It's too strange. Originally, ... it's a key-related property similar to 'when'."

**Analysis**: This is **Architecturally Correct**.
- **Command (`Undo`)**: "I revert the last state change." (Pure Logic)
- **Binding (`Cmd+Z`)**: "I trigger `Undo` when pressed, *even if* typing." (Context/Trigger)
- **Binding (`Z`)**: "I trigger `Undo`, but *NOT* while typing."

If `allowInInput` is on the Command, `Z` would trigger Undo while typing "Zone", which is wrong.
Therefore, the permission **must** belong to the *Binding*.

### 2. The Current Hybrid Flaw
Our current implementation (`definition.ts`) mixes these concerns by adding `allowInInput` to the Command Definition. This acts as a "Default", but as you pointed out, it muddies the water.

### 3. Proposed Architecture: "Pure Binding Control"

We should treat `allowInInput` exactly like `when`. It is a condition of the **Trigger**.

#### New Definition Structure
**Remove** `allowInInput` from `CommandDefinition`.
**Enforce** `allowInInput` in `KeybindingItem`.

**Example:**
```typescript
// Command: Pure Logic
const Undo = defineCommand({ id: 'UNDO', run: ... });

// Keymap: Contextual Trigger
const keymap = [
  { key: 'Mod+Z', command: 'UNDO', allowInInput: true },
  { key: 'U', command: 'UNDO', allowInInput: false } // Hypothetical shortcut
];
```

### 4. Implementation Steps (Refactoring)
To align with this "Best Practice":

1.  **Phase 1 (Deprecation)**: Stop using `allowInInput` in `defineCommand`.
2.  **Phase 2 (Migration)**: Move these flags to the `kb` (default keybindings) or external `keymap` config.
3.  **Phase 3 (Cleanup)**: Remove the property from `CommandDefinition` type.

### 5. Counter-Argument (Pragmatism)
Why did we put it on Command?
- **Convenience**: 99% of the time, `Undo` is `Undo`. We rarely bind `U` to `Undo`.
- **Defaulting**: It saves repeating `allowInInput: true` if we have multiple bindings for the same command.

**Verdict**: The User's intuition aligns with **Strict Separation of Concerns**. If we want a clean architecture, the Binding is the correct home.

## Final Recommendation
**Adopt the User's View.** Move responsibility to the **Keybinding Layer**.
This standardizes all "Context" checks (`when`, `allowInInput`) into the Binding, leaving Commands as pure State Reducers.
