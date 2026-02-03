# Analysis: Menu `when` vs Keybinding `when`

## The Double-When Paradox?

The user asks a crucial question:
> "Isn't `when` redundant? When do they differ?"

### 1. The Conflict (Redundancy)
In many cases, they are 1:1.
- **Delete Command**: Available when an item is selected.
- **Delete Key**: Active when an item is selected.

If `Menu.when` says `activeZone == 'sidebar'`, and `Key.when` implies `activeZone == 'sidebar'` (via hierarchy), they feel identical.

### 2. The Divergence (Why they must split)

They differ because they solve two different problems: **Visual Availability** vs **Input Resolution**.

#### Case A: Key Overloading (The "Enter" Key)
The `Enter` key is a contended resource.
- In `Sidebar`, `Enter` = `SELECT_CATEGORY`.
- In `TodoList` (Nav), `Enter` = `START_EDIT`.
- In `TodoList` (Edit), `Enter` = `UPDATE_TODO_TEXT`.

**Keybinding `when`** is strict:
- `SELECT_CATEGORY`: `activeZone == 'sidebar'`
- `START_EDIT`: `activeZone == 'todoList' && !isEditing`
- `UPDATE_TODO_TEXT`: `activeZone == 'todoList' && isEditing`

**Menu `when`** is often broader or different:
- The "Edit" button (Menu Item) might simply be visible whenever `activeZone == 'todoList'`.
- Even if I am *already* editing, the "Edit" command might conceptually be "available" (maybe disabled state?), but the `Enter` key *must* be routed to `UPDATE_TODO_TEXT`.

#### Case B: Hidden but Shortcuts Active (Power User)
- A "Nuke All" command might be hidden from the UI (Menu `when` = false) to prevent accidents.
- But a Keybinding `Ctrl+Alt+Backspace` might still work (Key `when` = true).

#### Case C: UI Context vs Input Context
- **Menu**: "Show this button if I have permission."
- **Key**: "Trigger this if the focus is in the right DOM element." (e.g. `isFieldFocused`).

### 3. Conclusion
They are **Not Redundant**, they are **Co-incident**.
- **Menu `when`**: "Can I execute this?" (Logical Availability)
- **Key `when`**: "Should THIS key execute this?" (Input Routing / Disambiguation)

They often overlap, but coupling them causes "The Double When Paradox" where input logic pollutes UI logic (e.g. checking `cursorAtStart` in a Menu logic—absurd!).

### 4. Recommendation
Keep them separate.
- `todo_menus.ts`: Defines the **Visible Surface**.
- `todo_keys.ts`: Defines the **Input Physics**.
