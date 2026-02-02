# Red Team Audit: Manifest-Driven Architecture & Logic Builder

> [!WARNING]
> This document assumes the role of an adversarial reviewer (Red Team) to identify potential flaws, scalability issues, and architectural dead ends *before* implementation.

## 1. The Monolith Trap (Critical for Web)

**The Proposal**: A single `ToyManifest` importing ALL commands.

```typescript
// todo_manifest.ts
import { AddTodo, DeleteTodo ... } from './commands'; // Imports EVERYTHING
```

**The Vulnerability**: **Bundle Size Explosion**.
- Web applications rely on **Code Splitting** (Lazy Loading).
- If `TodoManifest` imports every command, and your Engine imports `TodoManifest`, then **The Main Bundle includes Every Command in the App**.
- For a small Todo app? Fine.
- For an "OS"? **Catastrophic**. Loading the "Settings" app commands shouldn't slow down the "Desktop" boot.

**Mitigation Strategy**: 
- Manifests must allow **Lazy Imports** (`() => import('./settings_commands')`).
- Or split Manifests by Page/Feature, not one global file.

## 2. "Stringly Typed" Fragility

**The Proposal**:
```tsx
<Zone area="sidebar"> // Just a string
```

**The Vulnerability**: **Loss of Static Analysis**.
- `import { SIDEBAR_REGISTRY }` guarantees existence at compile time.
- `area="sidebar"` is just a string. 
    - Typo `"side-bar"` -> Runtime Error (or silent failure).
    - Rename "sidebar" to "nav" -> Need global search/replace, no IDE refactoring support.

**Mitigation Strategy**:
- `const MANIFEST_KEYS = { SIDEBAR: 'sidebar' } as const`.
- Or Typed Props: `Zone<typeof Manifest> area="sidebar"`.

## 3. Testing Isolation (The Global Singleton Problem)

**The Proposal**:
`Zone` automatically looks up registries from the `Engine` (which is likely a Singleton or Context).

**The Vulnerability**: **Coupled Unit Tests**.
- Testing `<Sidebar />`:
    - **Current**: Just pass a mock registry prop.
    - **Proposed**: Must wrap the component in a full `EngineProvider` with a valid Manifest loaded.
- Makes "dumb components" smart (and dependent).

**Mitigation Strategy**:
- Keep `registry` prop as an override: `<Zone area="sidebar" registry={mockRegistry}>`.

## 4. Logic Builder API (`Expect` vs `Rule`)

**The Observation**:
```typescript
const Expect = createLogicExpect<TodoContext>();
when: Rule.and(Expect('focusIndex').gt(0))
```

**Critique**: **Syntactic Sugar vs Cognitive Load**.
- It looks cleaner (`Expect` reads like Jest/English).
- **Risk**: Is `Expect` a singleton? No, created via factory.
- If multiple Contexts exist (e.g. `OSContext` vs `TodoContext`), developers might import the wrong `Expect`.
    - `import { Expect } from './os_commands'` (Wrong one!)
    - Result: TS might catch it if types mismatch, but autocomplete pollution is real.

## 5. Security & Permissions

**The Vulnerability**: **Implicit Authority**.
- If the Manifest registers *everything* automatically, how do we handle restricted commands?
- E.g., "Format Disk" command should standard users see it?
- Current "Config Object" doesn't strictly define *Permissions*, just *Existence*.

## Verdict

| Aspect | Score | Assessment |
| :--- | :--- | :--- |
| **DX (Developer Experience)** | ⭐⭐⭐⭐⭐ | Boilerplate reduction is massive. Very distinct win. |
| **Performance** | ⭐⭐ | High risk of bundle bloating if not designed for splitting. |
| **Robustness** | ⭐⭐⭐ | String typing introduces fragility. |
| **Testability** | ⭐⭐⭐ | Slightly harder, requires Context mocking. |

### Recommendation
**Proceed, BUT with guardrails:**
1.  **Do NOT** make a single global manifest. Make `FeatureManifests`.
2.  **Keep Types**: Generate/Export valid keys for `area` prop.
3.  **Preserve Override**: Allow explicit `registry` injection in `Zone` for testing.
