# Debate: History Granularity (Atomic vs. Transactional)

**Topic**: Should the Undo/Redo system strictly follow 1 Command = 1 History Entry, or should it group related actions?

**Context**: User reported "Undo is painful" when commands are executed sequentially (e.g. moving items up multiple times requires multiple undos).

---

## 🔵 Blue Team (Stability & Determinism)
### Argument
The current **Atomic Model** (1:1) is the only source of absolute truth.
1. **Determinism**: Every state change corresponds exactly to a command in the log. Debugging is trivial.
2. **Simplicity**: No "magic" logic to guess user intent. If the user pressed "Up" 5 times, they performed 5 distinct actions. Undo should strictly reverse the last action.
3. **Risk Aversion**: Grouping logic (e.g., "group if within 500ms") is flaky. What if the user wanted to undo just the last step of the movement? Grouping destroys that precision.

### Proposed Solution
- Keep 1:1.
- If usability is an issue, the user should use "Jump" commands (e.g. `Meta+Shift+Up` to move to top) instead of spamming `Up`.

---

## 🔴 Red Team (UX & Human Factors)
### Argument
The Atomic Model is a **Technical Truth**, not a **Human Truth**.
1. **Cognitive Chunking**: When a user moves an item 5 slots up, their intent is "Move this there" (1 Unit of Intent), not "Move, Move, Move, Move, Move".
2. **Universal Standard**: 
   - **Text Editors**: Typing "Hello" is 5 keystrokes but 1 Undo.
   - **Design Tools (Figma)**: Dragging an object is 100s of coordinates updates, but 1 Undo.
   - **VS Code**: Sequential line moves are often grouped.
3. **Pain Point**: "Undo spamming" destroys confidence in the system. The user wants to "Undo the usage session", not the CPU cycle.

### Proposed Solution
- Implement **Heuristic Grouping**.
- **Rule 1 (Time)**: If the *same command* (e.g., `MOVE_ITEM_UP`) is executed repeatedly within `T=1000ms`, merge it into the previous history entry (update the `resultingState`, discard the intermediate).
- **Rule 2 (Type)**: "Typing" commands should always capture the buffer state, not every distinct keystroke (though our `Field` handles this via commit-on-blur, `Move` commands need this).

---

## ⚖️ Synthesis & Verdict

**Winner**: 🔴 **Red Team**

The "Pro Tool" experience mandates that the software matches the user's mental model, not the machine's execution model.

### Action Plan: **Timeline Grouping Strategy**

1. **Enhance Middleware**:
    Update `onStateChange` in `todo_engine.tsx` to inspect the `past` stack.
    
    ```typescript
    const lastEntry = past[past.length - 1];
    
    // Grouping Condition
    const isSameCommand = lastEntry.command.type === action.type;
    const isRecent = (Date.now() - lastEntry.timestamp) < 1000;
    
    if (isSameCommand && isRecent) {
        // REPLACE the last entry with the new result
        // Effectively "extending" the transaction
        return {
           ...
           history: {
               past: [...past.slice(0, -1), newSnapshot], 
               future: []
           }
        }
    }
    ```

2. **Metadata Update**:
    `HistoryEntry` needs a `timestamp`.

3. **Exceptions**:
    Certain commands (Destructive ones like `DELETE`) should perhaps never group, or have stricter rules. For generally safe navigation/modification commands (`MOVE`, `PATCH`), grouping is preferred.
