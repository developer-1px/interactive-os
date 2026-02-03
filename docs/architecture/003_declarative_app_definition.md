# Architecture Proposal: Declarative App Definition (`defineApplication`)

## 1. Critique of Current Approach (v3)

The current approach exposes too much "plumbing":
1.  **Low-Level Terminology**: `createCommandStore` implies we are just making a Redux store, but we are building an Application.
2.  **Boilerplate**: Users have to manually instantiate `Registry`, register commands, apply keymaps, and then wire it to a View.
3.  **Manual Wiring**: The connection between the "App Logic" and the "UI Zones" is loose and manual.

## 2. Proposed Solution: `defineApplication`

We should move to a **Configuration-over-Wiring** approach. An internal "App" is just a definition.

### The New Usage API

```typescript
// src/apps/todo/app.ts
import { defineApplication } from "@os/core/app";

export const TodoApp = defineApplication({
  name: "Todo",
  
  // 1. Data Model & Persistence
  model: {
    initial: INITIAL_STATE,
    persistence: { key: "todo-v5" } // Declarative
  },

  // 2. Logic (Capabilities)
  commands: [AddTodo, ToggleTodo, ...], // Auto-registered
  
  // 3. Inputs
  keymap: TODO_KEYMAP, // Auto-loaded

  // 4. Lifecycle (Optional)
  middleware: [navigationMiddleware] 
});
```

### The View Layer

We introduce a standard `<OS.App>` shell that handles the Root Zone, Context, and Engine lifecycle automatically.

```tsx
// src/apps/todo/TodoRoot.tsx
import { OS } from "@os/ui";
import { TodoApp } from "./app";

export function TodoRoot() {
  // "just works" - Hydration, Engine, Context all handled here
  return (
    <OS.App definition={TodoApp}>
       <GlobalNav />
       <Board />
    </OS.App>
  );
}
```

## 3. How it solves the "Zone" Issue

The `<OS.App>` component automatically acts as the **Root Zone** (`id="app-root"`).
It also injects the `OS.Context` provider linked to the app's state.

Developers no longer manually wrap `createCommandStore` or create a generic `ContextMapper`.
The `defineApplication` can accept a `contextMap` strategy, but defaults to a standard one.

## 4. Comparison

| Feature | Current (`createCommandStore`) | Proposed (`defineApplication`) |
| :--- | :--- | :--- |
| **Mental Model** | Wiring a machine | Defining a blueprint |
| **Persistence** | Manual Config in Store | definition property |
| **UI Entry** | Custom Hook + Manual Provider | `<OS.App>` Component |
| **Zone Integration** | Manual `activeZone` subscription | Auto-managed by Shell |

## 5. FAQ: Why separate Definition from Component?

**Q: Why shouldn't `TodoApp` just be a React Component?**

**A: The difference between "Indexing" and "Running".**

You are right that a Headless Component doesn't render pixels. However, **Mounting a Component = Running its Logic**.

If we treat Apps purely as Components, to enable their global shortcuts (e.g., `Cmd+N` for Note), the OS must mount **ALL** installed apps at startup hidden in the background.
*   **Scalability Issue**: If you have 50 apps, you have 50 active Zustand stores, 50 event listeners, and 50 memory footprints running instantly at boot.
*   **The Definition Advantage**:
    *   **Lazy Evaluation**: The OS reads the static `Definition` (cheap JSON) to register commands/keys.
    *   **Zero Runtime Cost**: The App's "Engine" (Store/Logic) is NOT created until the user actually executes a command or opens the UI.
    
It distinguishes between **"What the app is" (Definition - Metadata)** and **"The app running" (Instance - Process)**. We want the OS to know *what* exists without *running* everything.

### The Hybrid Solution (Best of Both)
`defineApplication` can return a hybrid object that works as both:

```typescript
const TodoApp = defineApplication({ ... });

// 1. Use as Component (Auto-bootstraps internally)
<TodoApp />

// 2. Use as Metadata (for OS Registry)
os.install(TodoApp);
```
This provides the convenient developer experience of a Component with the architectural power of a Static Definition.
