# OS Native Persistence Architecture Proposal

## 1. The Problem
Currently, applications like Todo must manually invoke storage adapters in their middleware:
```typescript
// Current Todo App Code
import { LocalStorageAdapter } from "@os/core/persistence";

const middleware = (state, action) => {
  // ... logic ...
  LocalStorageAdapter.save("todo-v1", state); // Manual!
  return state;
}
```
This violates the "Smart Core, Dumb App" principle. Apps should generic declare *intent* to persist, not implement *how*.

## 2. Proposed Solution: Declarative Command Store
We will enhance the `createCommandStore` factory in `@os/core/command/store.tsx` to support a `persistence` configuration object.

### New Signature
```typescript
interface StoreConfig<S, A> {
  persistence?: {
    key: string;              // Unique Storage Key
    version?: number;         // For future migrations
    debounceMs?: number;      // Throttle saves (default: 1000ms)
    adapter?: PersistenceAdapter; // Default: LocalStorage
  };
  onStateChange?: ...
}
```

### How it works
1.  **Auto-Hydration**: When the store is created, it automatically attempts to load state from the `key`. If found, it merges/replaces `initialState`.
2.  **Auto-Save**: The store subscribes to its own state changes (via Zustand `subscribe` or internal middleware) and writes to storage.
3.  **Debouncing**: Saves are automatically debounced to prevent performance degradation during rapid typing/interaction.

## 3. Usage Example (Target)
The Todo App code simplifies to:

```typescript
// Apps don't import adapters anymore!
export const useTodoStore = createCommandStore(
  REGISTRY,
  INITIAL_STATE, // Just the default object
  {
    // ONE line to enable full persistence
    persistence: { key: "interactive-os-todo-v3" }, 
    
    // Middleware is now ONLY for logic, not plumbing
    onStateChange: navigationMiddleware, 
  }
);
```

## 4. Implementation Steps
1.  Modify `createCommandStore` in `@os/core/command/store.tsx`.
2.  Integrate `PersistenceAdapter` created previously.
3.  Add `debounce` utility (if not exists).
4.  Refactor `TodoEngine` to use this new config.
5.  Remove manual save from `Todo` middleware.

## 5. Benefits
- **Zero Boilerplate**: generic standard for all apps.
- **Performance**: Centralized debouncing.
- **Consistency**: All apps behave the same regarding data safety.
- **Portability**: Changing the adapter (e.g., to IndexedDB or Cloud) in one place upgrades all apps.
