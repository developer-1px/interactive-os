# Architecture Summit: The Principles of Input Jurisdiction

**Date**: 2026-02-02
**Topic**: Keybinding Architecture & The "WET" Configuration Problem
**Participants**: User, Red Team (Critique), Blue Team (Stability)

---

## 1. The Core Question
> "Zone간의 상호 배타적일텐데 굳이 이렇게 구성하는 이유는 뭐야?" (Since Zones are mutually exclusive, why strictly configure it this repetitive way?)

The User has correctly identified a violation of the **DRY (Don't Repeat Yourself)** principle in `todo_keys.ts`. We are currently repeating `when: Zones.Sidebar` for every single sidebar command.

## 2. Red Team Critique (The Attack)
**"This is Boilerplate Hell."**
By forcing explicit `when` clauses on every key:
1.  **Readability suffers**: The signal-to-noise ratio is low. You can't see the keys because of the repetitive guards.
2.  **Maintainability risks**: If we rename the zone 'sidebar' to 'left_panel', we have to update 20 lines.
3.  **Cognitive Load**: The developer has to mentally group these lines. Why not let the code structure reflect the logical structure?

**The Red Team demands**: A **"Jurisdiction-First"** configuration.
```typescript
// Proposed Ideal
const SidebarKeys = DefineZone('sidebar', [
  { key: 'Enter', command: 'SELECT' },
  { key: 'Up', command: 'MOVE_UP' }
]);
```

## 3. Blue Team Defense (The Constraint)
**"Flatness is the Engine of Flexibility."**
The Logic Engine (Registry) consumes a flat list because:
1.  **Composition**: Sometimes a key is valid in *multiple* zones but not others. (e.g. `Ctrl+P` works everywhere *except* in a rigid modal).
2.  **Micro-Conditions**: A key might be in the 'TodoList' zone but ONLY when `isDraftFocused`. A hierarchical list implies a simple "If Zone A then Key B" logic, but reality is "If Zone A AND State B AND NOT State C".
3.  **Standardization**: VS Code and other OS-level keymaps use flat JSON/Objects with `when` clauses. It is the industry standard for "Keybinding Resolvers".

## 4. The Synthesis: "Define by Jurisdiction, Compile to Flatness"
We can adhere to our **"AI-First / Self-Healing"** principle by separating the **Definition** from the **Compilation**.

We should introduce a **Jurisdiction Builder** pattern.
The *Engine* stays flat (Blue Team happy).
The *Config* becomes nested/grouped (Red Team/User happy).

### Proposed Solution: `createTodoKeymap` Factory

```typescript
export const TODO_KEYMAP = [
    // Global items...
    ...GlobalKeys,
    
    // Scoped Zones (Helper applies the guard automatically)
    ...inZone('sidebar', [
        { key: 'Enter', command: 'SELECT_CATEGORY' },
        { key: 'Up', command: 'MOVE_CATEGORY_UP' }
    ]),

    ...inZone('todoList', [
         { key: 'Enter', command: 'ADD_TODO', when: Expect('isDraftFocused') }, // Merges with Zone guard
         { key: 'Up', command: 'MOVE_FOCUS_UP' }
    ])
];
```

## 5. First Principles Reset
We must codify our principles to prevent future "drift".

**Principle 1: Locality of Definition**
Code that changes together should live together. Zone-specific keys should be grouped visually.

**Principle 2: Zero Ambiguity (The "No-Overlap" Rule)**
The system must guarantee that at any given nanosecond, exactly **one** command satisfies the conditions for a given key press.

**Principle 3: Type Safety as Physics**
If it compiles, it handles the dispatch safely. Type definitions must prevent "Ghost Commands".

---
**Next Steps**:
1. Confirm this "Grouping Helper" approach aligns with User's vision.
2. Refactor `todo_keys.ts` to implement `inZone` helper.
