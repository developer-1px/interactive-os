# Refactor: Introduce `state.effects` Queue

## Goal
Replace the ambiguous `ui.focusRequest` (Transient Field) with a dedicated `state.effects` (Effect Queue).
This clarifies that these values are **Side Effects** meant to be consumed and discarded, solving the user's confusion about "why UI state resets".

## Proposed Changes

### 1. `src/lib/types.ts`
- Define `AppEffect` type.
- Add `effects: AppEffect[]` to `AppState`.
- Remove `focusRequest` from `UIState`.

```typescript
export type AppEffect = 
  | { type: 'FOCUS_ID'; id: string | number }
  | { type: 'NAVIGATE'; direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; targetZone?: string }
  | { type: 'SCROLL_INTO_VIEW'; id: string | number };

export interface AppState {
  data: DataState;
  ui: UIState;
  effects: AppEffect[]; // [NEW] FIFO Queue
  history: HistoryState;
}
```

### 2. `src/lib/todoCommands.ts`
- Update all commands that were setting `focusRequest` to instead push to `state.effects`.
- Example:
  ```typescript
  // AS-IS
  draft.ui.focusRequest = 'NAVIGATE_DOWN';
  
  // TO-BE
  draft.effects.push({ type: 'NAVIGATE', direction: 'DOWN' });
  ```

### 3. `src/lib/todo/navigationMiddleware.ts` (Renamed from `navigationPhysics.ts`)
- **Formal Pipeline Stage**: This middleware will act as the "Effect Processor".
- **Logic**:
  1. Check `state.effects` queue.
  2. If empty, do generic integrity checks (optional).
  3. If present, consume effects one by one (FIFO).
  4. For each effect (`FOCUS`, `NAVIGATE`), calculate target ID using `focusStrategies`.
  5. Update `useFocusStore` (OS Layer).
  6. **Clear the Effect**: Remove processed effect from queue.

### 4. `src/lib/todoEngine.tsx`
- Rename import `todoPhysicsMiddleware` -> `navigationMiddleware`.
- Initialize `effects: []` in initial state.

## Verification Plan

### Automated
1. **Type Check**: `npx tsc --noEmit` must pass. This is critical as `focusRequest` removal should break all legacy usages.

### Manual
1. **Focus Navigation**: Arrow keys must still move focus.
2. **Deletion**: Deleting an item must move focus to neighbor.
3. **Inspector**: Verify that `effects` array appears in state (if visible) or at least focus mechanics still work.
