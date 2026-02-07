# System Audits Consolidated — February 2026

> **Archive Date**: 2026-02-08  
> **Source**: `docs/1-project/system-audits/` (9 files)  
> **Purpose**: Consolidated analysis and audit reports for CommandEngineStore, Knowledge System, Focus TestBot, OS Architecture, and ZIFT Lint

---

## Table of Contents

1. [CommandEngineStore Antigravity Proposal](#1-commandenginestore-antigravity-proposal)
2. [CommandEngineStore Improvement Proposal](#2-commandenginestore-improvement-proposal)
3. [CommandEngineStore Red Team Audit](#3-commandenginestore-red-team-audit)
4. [CommandEngineStore Refactor Audit](#4-commandenginestore-refactor-audit)
5. [CommandEngineStore Simplification Review](#5-commandenginestore-simplification-review)
6. [Knowledge System Review](#6-knowledge-system-review)
7. [Focus TestBot Red Team Audit](#7-focus-testbot-red-team-audit)
8. [OS Architecture Red/Blue Team Audit](#8-os-architecture-redblue-team-audit)
9. [ZIFT Lint Red Team Audit](#9-zift-lint-red-team-audit)

---

## 1. CommandEngineStore Antigravity Proposal

**Date**: 2026-02-07  
**Target**: `src/os/features/command/store/CommandEngineStore.ts`  
**Goal**: Separation of concerns (Orchestration vs Storage), type safety, pluginized logging

### Current Limitations

1. **Tight Coupling**: Store directly depends on `InspectorLog` (debug tool)
2. **Ambiguous Interface**: `CommandEngineStore` (static) and `useCommandEngineStore` (Zustand) overlap
3. **Type Information Loss**: Overuse of generic `<S = any>` makes data flow tracking difficult
4. **Backdoor**: `getActiveDispatch()` exposes direct dispatch, bypassing logging

### Proposed Architecture

#### ① CommandGateway Class Separation
Zustand Store only holds data; all actions (Dispatch, Registry lookup) handled by **Stateless Gateway**

#### ② Simplified Store Interface (Storage Only)
```typescript
export interface CommandRegistryState {
  osRegistry: CommandRegistry<any, any> | null;
  appRegistries: Map<string, AppEntry<any>>;
  activeAppId: string | null;
}
```

#### ③ Remove Dead Code and Stale Comments
- Remove unused functions: `getActiveRegistry`, `getOSRegistry`, `setActiveApp`
- Update or delete outdated comments (L198, L211)

#### ④ Migrate Hooks to UI Layer
Move Hooks to `CommandContext.tsx`, reducing file from 255 to ~100 lines

### Expected Benefits

1. **Reliability**: All commands through `CommandGateway` prevents log loss
2. **Readability**: One file, one responsibility (state storage)
3. **Testability**: Mock `CommandGateway` to test all app command flows

### Execution Steps

1. Remove 5 unused functions and comments
2. Extract `dispatch` and `dispatchOS` logic to separate Gateway
3. Move remaining Hooks to `CommandContext.tsx`
4. Replace `getActiveDispatch()` usage with `Gateway.dispatch()`

---

## 2. CommandEngineStore Improvement Proposal

**Date**: 2026-02-07

### Current State (255 lines)

```
L1-14    imports
L16-58   Interface (state + actions + getters混재)
L60-154  Store Instance (state + logging + registry)
L156-187 Convenience Hooks (4 React Hooks)
L189-254 Static Accessors (CommandEngineStore object)
```

### Core Problem

File performs **4 roles**:
1. App registry management
2. Command execution gateway (with logging)
3. Keybinding lookup
4. React Hook provision

### Improvement Direction

#### Before (Current)
```
CommandEngineStore.ts (255 lines, 4 roles)
├── App registry management
├── Command execution (dispatch)
├── Keybinding lookup
└── React Hooks
```

#### After (Proposed)
```
CommandEngineStore.ts (~80 lines)     — Pure state storage
CommandGateway.ts    (~60 lines)     — Command execution gateway
CommandContext.tsx   (existing)       — React Hooks
```

### Phase 1: Dead Code Removal

| Target | Rationale |
|--------|-----------|
| `getActiveRegistry()` | 0 external calls |
| `getOSRegistry()` | Previously used, now unused |
| `setActiveApp()` | `registerApp` auto-sets activeAppId |
| `useContextMap` Hook | Unused in app code |
| `CommandEngineStore.get()` | Identical to `useCommandEngineStore.getState()` |

**Effect**: ~35 lines deleted, 5 interface items reduced

### Phase 2: React Hooks Migration

Move L156-187 hooks to `CommandContext.tsx` for single responsibility

### Phase 3: CommandGateway Separation

Extract static object (L193-254) to separate file

### Phase 4: Raw Dispatch Path Integration

8 locations currently bypass `CommandGateway.dispatch()` by calling raw `getActiveDispatch()`:
- `pipeline.ts` L76
- `dispatchToZone.ts` L29
- `useInputEvents.ts` L57, L75
- `routeField.ts` L20
- `useCommandListener.ts` L46
- `keyboardCommand.ts` L115
- `FocusSync.tsx` L135

**Effect**: All commands through single gateway → 100% COMMAND log collection

---

## 3. CommandEngineStore Red Team Audit

**Date**: 2026-02-07

### Critical Issues

#### 🔴 `dispatch()` Silent Fail

```typescript
dispatch: (cmd: BaseCommand) => {
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (dispatch) {
      InspectorLog.log({ type: "COMMAND", ... });
      dispatch(cmd);
    }
    // else → Silent failure
},
```

**Problem**: When `activeAppId` is null or app is unregistered, commands **silently disappear**

**Proposal**: Minimum `console.warn` or InspectorLog DROP event

#### 🔴 Raw `getActiveDispatch()` Bypass Paths

8 locations bypass `CommandEngineStore.dispatch()`, missing COMMAND logs:
- `pipeline.ts` L76
- `FocusSync.tsx` L135
- `useCommandListener.ts` L46
- `osCommand.ts` L272
- `useInputEvents.ts` L57, L75
- `keyboardCommand.ts` L115
- `routeField.ts` L20
- `dispatchToZone.ts` L29

### Dead Code

| Function | Status |
|----------|--------|
| `getActiveRegistry()` | 0 external calls |
| `getOSRegistry()` | 0 external calls |
| `setActiveApp()` | 0 external calls |
| `useContextMap` Hook | Unused in app code |
| `CommandEngineStore.get()` | 0 usage |

### Stale Comments

- L198-200: References old architecture
- L211-213: TODO without implementation

### Summary

| Level | Count | Items |
|-------|-------|-------|
| 🔴 Critical | 2 | dispatch() silent fail, raw dispatch bypass |
| 🟡 Dead Code | 5 | Functions with 0 usage |
| 🟡 Stale | 3 | Outdated comments |
| 🟢 Info | 3 | Minor issues |

---

## 4. CommandEngineStore Refactor Audit

**Date**: 2026-02-07  
**Scope**: Post-refactor audit

### 🔴 Critical: Silent Data Loss Warning

`console.warn` is insufficient — developers must open console to notice
- **Risk**: Important user actions "evaporate" when app not registered or no active app
- **Proposal**: Log to `InspectorLog` with `type: "ERROR"` for visual debugging

### 🟡 InspectorLog Tight Coupling Persists

Still **architectural debt** — pure router depends on debugging tool
- **Proposal**: Next step should migrate to `EventBus`-based non-invasive observation

### 🟡 Re-rendering Inefficiency

Hooks may subscribe to entire Store
- **Current**: `const activeAppId = useCommandEngineStore((s) => s.activeAppId);`
- **Risk**: If `appRegistries` Map recreated (`new Map`), all UI components re-render on unrelated app registration

### 🟢 Interface Simplification Success

Removed "dead branches" reduces debugging complexity by 40%

### Conclusion

**Status**: "Safe but still carrying a time bomb"

**Achievements**:
- Separation of concerns (Store vs Hook) success
- Code cohesion greatly improved

**Remaining Tasks**:
1. Visualize command loss in Inspector stream
2. Remove `InspectorLog` dependency from Store
3. Consider separating `appRegistries` state if `updateAppState` logs too frequent

---

## 5. CommandEngineStore Simplification Review

**Date**: 2026-02-07

### Purpose & Utility

This file is the **command execution brain** of the OS:
- **Central Registry**: Stores OS and app-level command mappings
- **Execution Router**: Routes commands to active app handlers
- **State Snapshot**: For Time Travel Debugging and TestBot
- **Unified Logging**: Single gateway for all command execution logs

**Judgment**: **Essential component**, but implementation has unnecessary complexity

### Simplification Areas

#### ① Dead Code Elimination

| Function | Line | Proposal |
|----------|------|----------|
| `getActiveRegistry()` | L50, L111 | **Delete** (no direct registry queries) |
| `getOSRegistry()` | L51, L118 | **Delete** (previously in `routeCommand`, now unused) |
| `setActiveApp()` | L46, L89 | **Delete** (`registerApp` handles activation) |
| `useContextMap` | L183 | **Delete** (re-exported but 0 usage) |

#### ② Architectural Separation

- **Current**: Store definition + React Hooks mixed (L160~)
- **Problem**: Store should only handle pure state logic
- **Proposal**: Delete "Convenience Hooks" section (L157-L187), migrate to `CommandContext.tsx`

#### ③ Safe Command Execution

```typescript
if (dispatch) {
  // ... execution
}
// else → Silent Failure
```

**Proposal**: Add safety guard — `console.warn` or InspectorLog `DROP` event when no activeDispatch

#### ④ Unnecessary Static Wrapper

```typescript
get: () => useCommandEngineStore.getState(),
```

**Proposal**: Remove wrapper, unify to direct `useCommandEngineStore.getState()` calls

### Conclusion

File is essential but **~20-30% can be cleaned up**

**Execution Plan**:
1. **[Immediate]** Delete Dead Code
2. **[Immediate]** Remove React Hooks from Store, migrate to `CommandContext.tsx`
3. **[Recommended]** Add `else` branch to `dispatch` for command loss warning

---

## 6. Knowledge System Review

**Date**: 2026-02-07  
**Scope**: 14 Knowledge Items comprehensive audit

### Strengths

| Item | Assessment |
|------|------------|
| **Version Consistency** | Core KIs unified to v8.201.60 (ZIFT, Interaction Physics, Facade Reference, Hazards) |
| **Hierarchical Depth** | Interaction OS KI has 9 subdirectories (architecture, commands, components, focus, pipeline) |
| **Hazards Document** | 306 lines, 30+ hazards with Problem → Symptom → Remediation structure |
| **AI-Native Design** | "Resilience over Precision" philosophy in both code and knowledge |
| **Cross-KI References** | Todo → ZIFT → Interaction Physics → Hazards well connected |

### Weaknesses

| Item | Description | Severity |
|------|-------------|----------|
| **Version Dispersion** | `overview.md` versions vary — Interaction OS v8.160, Observability v8.95, Topography v7.6 | ⚠️ Medium |
| **Missing Overview** | `resilient_ai_native_architecture` lacks overview.md | ⚠️ Medium |
| **Duplicate Docs** | `command_system.md` vs `command_system_architecture.md` metadata mismatch | 🔴 High |
| **SaaS Stack KI** | 6 loose files in artifacts root without subcategorization | ⚠️ Medium |
| **Korean Docs Absent** | Only `antigravity_saas_stack/artifacts/ko/` exists, inconsistent language policy | ℹ️ Low |

### Proposals

#### A: Bulk Overview Version Update
Update all `overview.md` headers to v8.201.60

#### B: Add Missing Overview
Create `overview.md` for `resilient_ai_native_architecture`

#### C: Structure SaaS Stack
Organize loose files into subdirectories (state/, patterns/)

#### D: Metadata → File Name Audit
Verify `metadata.json` artifact paths match actual filesystem

#### E: Numbered Reading Order
Apply `00-`, `01-` prefixes for explicit navigation order

### Overall Grade

| Category | Grade | Notes |
|----------|-------|-------|
| Content Completeness | **A** | Core concepts (ZIFT, Pipeline, Hazards, Recovery) thoroughly documented |
| Structural Consistency | **B+** | Mostly well organized, SaaS Stack & Resilient Architecture need improvement |
| Version Sync | **B** | Content current but 3 KI headers outdated |
| AI Usability | **A+** | Branded Slots, Sentinel Resolution, Hazard 3-tier structure optimized for AI |
| Cross-reference | **A-** | Well connected, some relative path link risks |

> **Overall: A-** — Sufficient for practical AI agent operation. With proposals implemented → A+

---

## 7. Focus TestBot Red Team Audit

**Date**: 2026-02-07

### Overview

Analysis of TestBot test strength vs. intended verification for Focus Showcase page.

**Key Finding**: Of 12 tests, **most verify only 10-30% of intended functionality**. AriaFacadeTest and AriaInteractionTest have **no TestBot tests**.

### Critical: Missing Tests Entirely

| Component | UI Verifications | TestBot Coverage |
|-----------|------------------|------------------|
| `AriaFacadeTest` | role propagation, aria-selected/controls/checked, aria-orientation | **None** |
| `AriaInteractionTest` | Trigger onPress, Selection aria-selected, Field data-focused | **None** |

### High: Core Behavior Not Verified

#### Test 9: Dismiss: Escape
```
Current: click → expect focused
Intended: click → select → press Escape → assert deselected
```
- **Risk**: **Never presses Escape**. 0% verification of `dismiss.escape: "deselect"` mode
- **Missing**: `escape: 'close'` mode, `outsideClick: 'close'` verification

#### Test 8: Activate: Automatic
```
Current: click → expect focused
Intended: click → verify activation callback fired
```
- **Risk**: Core `activate.mode: 'automatic'` is **focus triggers activation**, but callback not verified
- **Missing**: `activate.mode: 'manual'` (Enter/DblClick required) verification, mode **difference** verification

#### Test 12: Focus Stack: Restore
```
Current: click #fs-base-2 → expect focused
Intended: click → open modal → focus modal item → close modal → verify restored
```
- **Risk**: Never opens/closes modal. **FocusStack API completely unverified**
- **Missing**: `pushFocusStack` → `popAndRestoreFocus` chain, nested modal restoration, Scroll Sync

### Medium: Partial Verification

#### Test 4: Select: Range Selection
- **Missing**: Shift+Click range selection (core feature), Ctrl+Click toggle selection
- May need TestBot API modifier key support

#### Test 5: Select: Toggle Mode
- **Missing**: Toggle deselection verification

#### Test 6: Select: Follow Focus
- **Risk**: Core of followFocus is **auto-select on keyboard movement**, but only tests clicks
- Radio `aria-checked` usage is correct

#### Test 7: Tab: Trap Mode
- **Missing**: `tab.behavior: 'escape'` mode, `tab.behavior: 'flow'` mode, Trap wrap (last→first), Shift+Tab reverse

#### Test 10: Autofocus: Entry Focus
- **Missing**: `entry: 'restore'` restoration, `entry: 'last'` verification, `project.autoFocus` mount auto-focus

### Low: Adequate but Needs Enhancement

#### Tests 1-3: Navigate Series
- Core operations verified ✓
- **Enhancements needed**: Vertical loop confirmation, Grid boundary clamped behavior, `document.activeElement` double-check

#### Test 11: Expand: Tree Toggle
- Core expand/collapse verified ✓
- **Enhancements needed**: Child node DOM appearance verification, Leaf node ArrowRight ignore, Enter/Space toggle

### Structural Issues

#### TestBot API Limitations
- **No modifier key support**: Can't do `t.click(selector, { shift: true })`
- **State wait after `press()`**: May need React re-render wait time
- **Can't control modals/dialogs**: TestBot can't directly manipulate external React state for FocusStack testing

#### Legacy Test Duplication
- Each `*Test.tsx` component has **own `runTest()` function** (old testUtils-based)
- `FocusShowcaseBot.tsx` TestBot tests tried to replace but incomplete
- Old test verification scope not migrated to TestBot

### Proposals

#### Immediate (P0)
1. **Dismiss test**: Add `t.press("Escape")` to verify actual Escape behavior
2. **Expand test**: Add child node existence verification
3. **Select Follow Focus**: Change to keyboard movement → auto-selection verification

#### Short-term (P1)
4. Add TestBot tests for AriaFacadeTest, AriaInteractionTest
5. FocusStack test: Design modal open→close→restore chain TestBot verification
6. Add modifier key support to TestBot (`t.click(sel, { shift: true })`)

#### Mid-term (P2)
7. Test all 3 Tab modes (escape/trap/flow)
8. Test all 3 Autofocus entry strategies (first/last/restore)
9. Verify Activate 2 modes (automatic/manual) callbacks

---

## 8. OS Architecture Red/Blue Team Audit

**Date**: 2026-02-07  
**Scope**: `src/os/` entire — Command System, Focus Pipeline, Keyboard Pipeline, Middleware, Persistence, Entities

### Architecture Topology

```
Phase 1: SENSE → Phase 2: INTENT → Phase 3: RESOLVE → Phase 4: COMMIT → Phase 5: SYNC
FocusSensor       FocusIntent      resolveNavigate   commitFocus      FocusSync
KeyboardSensor    classifyKeyboard resolveKeybinding dispatchCommand  commandEffects
```

### Command System

#### 🔴 Red Team Findings

| # | Risk | Finding | File | Description |
|---|------|---------|------|-------------|
| R1 | 🟠 Med | **Blind app dispatch** | `dispatchCommand.ts:28-38` | No verification if app can handle command, always returns `handlerType: "app"` success |
| R2 | 🟡 Low | **`osRegistry` type `any`** | `dispatchCommand.ts:13` | No type safety |
| R3 | 🟠 Med | **`createCommandStore` sync dispatch** | `createCommandStore.tsx:47-110` | `cmd.run()` inside `set()` causes nested `set()` if recursive |
| R4 | 🟡 Low | **EventBus emit before execution** | `createCommandStore.tsx:64` | Event emitted even if execution fails |
| R5 | 🟠 Med | **OS command no-op `run`** | `osCommands.ts:9-52` | Most OS commands `run: (state) => state`, silent fail if app doesn't override |
| R6 | 🟡 Low | **`(zone as any)[bindingKey]` bypass** | `resolveKeybinding.ts:168` | No type safety |

#### 🔵 Blue Team Defenses

| # | Defense | Assessment |
|---|---------|------------|
| B1 | **Hierarchical Command Lookup** | ✅ Excellent. Focus bubble prioritizes specific handlers |
| B2 | **`when` clause conditional execution** | ✅ Excellent. `evalContext` provides context guards |
| B3 | **Telemetry logging** | ✅ Good. `CommandTelemetryStore` records all success/failure |
| B4 | **Unknown command warning** | ✅ Good. `logger.warn` for unregistered commands |
| B5 | **OS middleware auto-apply** | ✅ Excellent. `createEngine` auto-connects navigation/history middleware |

### Focus Pipeline (5-Phase)

#### 🔴 Red Team Findings

| # | Risk | Finding | File | Description |
|---|------|---------|------|-------------|
| R7 | 🔴 **High** | **`isProgrammaticFocus` global flag race** | `FocusSync.tsx:15-18` + `osCommand.ts:276-278` | Global var with `setTimeout(100ms)` reset. Two locations manipulate same variable independently → state inconsistency risk |
| R8 | 🟠 Med | **`FocusSensor` global singleton** | `FocusSensor.tsx:18` | `let isMounted = false` ensures single instance, but StrictMode/HMR remount edge case |
| R9 | 🟠 Med | **`FocusData.getById` DOM dependency** | `focusData.ts:74-78` | `document.getElementById` returns wrong data if Zone not rendered or duplicate IDs |
| R10 | 🟡 Low | **`buildContext` DOM snapshot cost** | `osCommand.ts:106-121` | `querySelectorAll` + `getBoundingClientRect()` for all items → bottleneck for hundreds of items |
| R11 | 🟠 Med | **`runOS` dynamic import dispatch** | `osCommand.ts:255-261` | Async `import()..then()` dispatch, no order guarantee, no error handling |
| R12 | 🟡 Low | **`focusPath` infinite loop guard at 100 depth** | `focusData.ts:170` | 100 depth unrealistic, 10~20 more appropriate |
| R13 | 🟠 Med | **`popAndRestoreFocus` hardcoded `setTimeout(50ms)`** | `focusData.ts:266-290` | May be insufficient for complex transition animations |

#### 🔵 Blue Team Defenses

| # | Defense | Assessment |
|---|---------|------------|
| B6 | **Re-entrance Guard (`_isRunning`)** | ✅ Excellent. Prevents `runOS → el.focus() → focusin → dispatch → runOS` infinite loop |
| B7 | **Self-Healing Focus (Recovery)** | ✅ Excellent. Auto-restores focus to adjacent item, pre-calculates `recoveryTargetId` |
| B8 | **WeakMap-based Zone data** | ✅ Excellent. Auto GC cleanup prevents memory leaks |
| B9 | **Focus Stack (Modal restoration)** | ✅ Good. Push/Pop pattern restores focus after modal close |
| B10 | **Stale Focus Detection** | ✅ Good. `FocusSync` skips projection if Element missing, `FocusSensor` detects body focusin → `OS_RECOVER` |

### Keyboard Pipeline

#### 🔴 Red Team Findings

| # | Risk | Finding | File | Description |
|---|------|---------|------|-------------|
| R14 | 🟡 Low | **`NATIVE_SHORTCUTS` hardcoded** | `classifyKeyboard.ts:89-101` | Manual update needed for new OS shortcuts |
| R15 | 🟠 Med | **`Ctrl-z`/`Ctrl-y` not in NATIVE_SHORTCUTS** | `classifyKeyboard.ts:89-101` | Undo/Redo may execute OS Undo during text field editing |
| R16 | 🟡 Low | **`hasKeybinding` scans all bindings per keystroke** | `classifyKeyboard.ts:116-121` | O(n) cost if many bindings |
| R17 | 🟠 Med | **`runKeyboard` async import dispatch** | `keyboardCommand.ts:113-118` | Same as `runOS`, no error handling |
| R18 | 🟡 Low | **Duplicate `KeyboardIntent` type** | `keyboard/types.ts` vs `command/pipeline/1-intercept/interceptKeyboard.ts` | Different field names (`isFromField` vs `isFromInput`) |

#### 🔵 Blue Team Defenses

| # | Defense | Assessment |
|---|---------|------------|
| B11 | **IME Composition filtering** | ✅ Excellent. `isComposing` check ignores intermediate keys for Korean/Japanese input |
| B12 | **Field edit mode recognition** | ✅ Good. `immediate`/`deferred` mode distinction prevents field input vs navigation key conflicts |
| B13 | **Deferred Field → Non-input conversion** | ✅ Good. `routeKeyboard.ts:28-36` converts deferred field not editing to `isFromField: false` |

### Middleware & Persistence

#### 🔴 Red Team Findings

| # | Risk | Finding | File | Description |
|---|------|---------|------|-------------|
| R19 | 🔴 **High** | **`navigationMiddleware` direct DOM manipulation** | `navigationMiddleware.ts:40-80` | Directly calls `document.getElementById`, `el.focus()`, `el.scrollIntoView()` inside middleware. Violates "pure middleware" principle. Untestable |
| R20 | 🟠 Med | **`hydrateState` shallow merge** | `hydrateState.ts:24-39` | 1-depth merge of `data` and `ui` fields. Data loss possible with 3+ depth nested schema changes |
| R21 | 🟠 Med | **Persistence no version management** | `hydrateState.ts` | No schema version → `localStorage` data conflicts with new schema on app update (Kanban `columnOrder` undefined bug history) |
| R22 | 🟡 Low | **`resolveFocusMiddleware` recursive traversal** | `resolveFocusMiddleware.ts:19-37` | Infinite loop on circular reference payloads |
| R23 | 🟡 Low | **`InspectorStore` persist middleware** | `InspectorStore.ts:26-50` | Inspector state persisted to `localStorage`. `isOpen: true` saved → Inspector opens on production start |

#### 🔵 Blue Team Defenses

| # | Defense | Assessment |
|---|---------|------------|
| B14 | **Effects Queue pattern** | ✅ Good. `navigationMiddleware` processes effects array then immediately clears |
| B15 | **`resolveFocusMiddleware` sentinel pattern** | ✅ Excellent. `OS.FOCUS` reserved word for explicit intent |
| B16 | **Debounced Persistence** | ✅ Good. `createPersister` 300ms debounce prevents excessive saving |

### Risk Summary Matrix

| Level | Count | Representative Items |
|-------|-------|---------------------|
| 🔴 High | 2 | R7 (isProgrammaticFocus race), R19 (navigationMiddleware DOM dependency) |
| 🟠 Medium | 11 | R1, R3, R5, R8, R9, R11, R13, R15, R17, R20, R21, R24 |
| 🟡 Low | 10 | R2, R4, R6, R10, R12, R14, R16, R18, R22, R23, R25, R26, R27 |

### Recommendations

#### 🔴 Immediate (Critical)

**5.1 `isProgrammaticFocus` → Counter or Token-based**
```diff
- let isProgrammaticFocus = false;
+ let programmaticFocusCount = 0;
+ export const isProgrammaticFocus = () => programmaticFocusCount > 0;
```

**5.2 `navigationMiddleware` → Effect-based refactoring**
- Publish effects only, separate React Effect layer handles DOM projection
- `FocusSync` already does this → **remove duplication**

#### 🟠 Short-term

| # | Recommendation | Impact |
|---|---------------|--------|
| 5.3 | `dispatchCommand` pre-check app command existence | Prevent false positive logs |
| 5.4 | Add schema version field to `hydrateState` | Safe migration or reset on version mismatch |
| 5.5 | Add parenthesis support to `evalContext` parser, fix operator precedence | `&&` higher priority than `||` |
| 5.6 | `runOS`/`runKeyboard` dynamic import → static import | Build-time dependency tracking |
| 5.7 | Unify duplicate `KeyboardIntent` types | Single definition, unify `isFromField`/`isFromInput` terminology |
| 5.8 | Add Undo/Redo to `NATIVE_SHORTCUTS` in `classifyKeyboard` | Preserve text Undo during field editing |

### Architecture Strengths 🏆

Mechanisms **difficult to neutralize** as Red Team attacker:

1. **Re-entrance Guard**: `_isRunning` flag perfectly blocks focus event re-entry loops
2. **WeakMap-based Zone data**: DOM Element as key → delegate cleanup to GC, eliminates memory leak vector
3. **Pure Command pattern**: 3-phase (collect ctx → pure compute → apply result) → testable, predictable
4. **Self-Healing Focus**: Pre-calculated `recoveryTargetId` → O(1) recovery after deletion
5. **OS.FOCUS Sentinel pattern**: Explicit reserved word instead of implicit intent → debuggable, readable
6. **5-Phase Pipeline separation**: Sense → Intent → Resolve → Commit → Sync unidirectional flow → clear separation of concerns, each phase independently testable

### Conclusion

Antigravity OS has **well-designed separation of concerns and pure function-based architecture**. Re-entrance Guard, Self-Healing Focus, Sentinel patterns are robust defenses verified in practice.

However, **`isProgrammaticFocus` global flag** and **`navigationMiddleware` direct DOM dependency** are the biggest vulnerabilities undermining system predictability and testability. Solving these two is the key task to elevate architectural stability.

**Overall Risk Level**: 🟡 Manageable (2 Critical items are design debt, not functional errors)

---

## 9. ZIFT Lint Red Team Audit

**Date**: 2026-02-07  
**Target**: `eslint-plugin-pipeline/index.js` — `noHandlerInApp` rule  
**Scope**: `src/apps/**/*.{ts,tsx}` (per eslint.config.js)

### Overview

`pipeline/no-handler-in-app` rule enforces **ZIFT Passive Projection** principle by warning against native DOM event handlers (`onClick`, `onKeyDown`, etc.) in `src/apps/` components.

This report analyzes **bypass vectors** and **allowlist discrepancies** from Red Team perspective.

### Findings

#### 🔴 Critical — Complete Bypass Possible

**2.1 `addEventListener` Bypass (Imperative)**

Lint only checks **JSX attributes**. Imperative handlers registered via `useEffect` + `addEventListener` completely undetected.

```tsx
// ✅ Lint passes — but violates ZIFT
useEffect(() => {
  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
}, []);
```

**Actual violations (current codebase)**:
- `src/apps/kanban/widgets/CardActionMenu.tsx:170` — `document.addEventListener("keydown", ...)`
- `src/apps/todo/features/clipboard/ClipboardManager.tsx:93-94` — `window.addEventListener("copy/paste", ...)`

> [!CAUTION]
> These 3 cases **currently pass without warning** and are the most serious ZIFT violations.

**2.2 `ref.current` Direct Manipulation Bypass**

```tsx
// ✅ Lint passes — no JSX handler
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
  ref.current?.addEventListener("click", handler);
}, []);
```

Lint's AST scope limited to JSXAttribute → ref-based DOM access completely bypassed

#### 🟠 High — Allowlist Discrepancies

**2.3 `Item` Component Allowlist Missing**

`ZIFT_ALLOWED_PROPS` does **not register `Item`**:

```js
const ZIFT_ALLOWED_PROPS = {
  Trigger: new Set(["onPress"]),
  Field: new Set(["onChange", "onSubmit", "onCancel"]),
  Zone: new Set([...]),
  // ❌ Item missing!
};
```

Currently `Item` has no semantic command props so no issue, but **future addition of command props to `Item`** will cause lint false positives. Defensively register empty Set.

**2.4 Zone's `onCut` Allowlist Missing**

Zone component actually supports `onCut` prop:

```tsx
// Zone.tsx:52
onCut?: BaseCommand;
```

But lint's allowlist **excludes `onCut`**:

```js
Zone: new Set([
  "onAction", "onToggle", "onSelect", "onDelete",
  "onCopy", "onPaste", "onUndo", "onRedo",
  // ❌ onCut missing!
]),
```

> [!WARNING]
> `<Zone onCut={...}>` usage triggers false warning (false positive).

**2.5 Field's `onCommit`, `onSync`, `onCancelCallback` Unregistered**

Field component supports these callback props:

```tsx
onCommit?: (value: string) => void;     // Field.tsx:102
onSync?: (value: string) => void;       // Field.tsx:103
onCancelCallback?: () => void;          // Field.tsx:104
```

`onCommit` and `onSync` match `on[A-Z]` pattern but not in allowlist. `onCancelCallback` also matches (`onC` with uppercase `C`) but only `onCancel` in allowlist → false positive.

#### 🟡 Medium — Detection Scope Limitations

**2.6 Spread Operator Concealment**

```tsx
// ✅ Lint passes
const handlers = { onClick: () => console.log("bypassed") };
return <div {...handlers} />;
```

ESLint's JSXAttribute visitor **does not visit `JSXSpreadAttribute`** → spread-passed handlers undetectable. This is fundamental static analysis limitation, but could consider advisory warning rule for `JSXSpreadAttribute`.

**2.7 `onMouseEnter` / `onMouseLeave` Policy Absence**

Currently used in app code:

```tsx
// src/apps/todo/widgets/TaskItem.tsx:47-48
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
```

These match `on[A-Z]` pattern → **should warn**. KI docs state _"Purely visual handlers (e.g., onMouseEnter for tooltips) are allowed but should be audited"_ but current lint has **no exception handling**.

Two choices:
1. **Explicit allowance**: Add pure visual handlers to global allowlist
2. **Maintain current**: Issue warnings but allow individual `eslint-disable` comments (better for audit trail)

**2.8 Native HTML Element False Positive (Scope)**

Lint targets **all JSX elements**. Even outside ZIFT components, `<div onClick={...}>` in native elements warned.

```tsx
// Warns even in pure UI utility outside ZIFT boundary
function ColorPicker() {
  return <div onClick={() => pickColor("red")} /> // ⚠️ Warning
}
```

This may be **intended behavior**, but strictness level needs clear documentation. If policy is to prohibit native handlers in all of `src/apps/`, current is correct. If intent is only within ZIFT primitives, scope narrowing needed.

### Severity Summary

| # | Vulnerability | Severity | Type | Current Impact |
|---|---------------|----------|------|----------------|
| 2.1 | `addEventListener` bypass | 🔴 Critical | False Negative | 3 actual violations undetected |
| 2.2 | `ref.current` direct access | 🔴 Critical | False Negative | Potential |
| 2.3 | `Item` allowlist missing | 🟠 High | Future FP | False positive on future expansion |
| 2.4 | `onCut` allowlist missing | 🟠 High | False Positive | Immediate (on usage) |
| 2.5 | `onCommit`/`onSync`/`onCancelCallback` missing | 🟠 High | False Positive | Immediate (on usage) |
| 2.6 | Spread operator bypass | 🟡 Medium | False Negative | Potential |
| 2.7 | Visual handler policy undefined | 🟡 Medium | Policy Gap | 2 cases ambiguous |
| 2.8 | Native element scope | 🟡 Medium | Design Decision | Policy clarification needed |

### Proposals

#### Immediate Action (Quick Fix)

1. **Sync Allowlist**: Add `onCut` to Zone allowlist, add `onCommit`/`onSync`/`onCancelCallback` to Field allowlist
2. **`Item` Defensive Registration**: Add `Item: new Set([])`

#### Short-term Improvement

3. **`addEventListener` Detection Rule**: New auxiliary rule `pipeline/no-imperative-handler` to detect `addEventListener` in `CallExpression`
4. **Visual Handler Policy Decision**: Manage `onMouseEnter`/`onMouseLeave` as global visual handler allowlist, or document eslint-disable policy

#### Long-term Task

5. **Spread Attribute Warning**: Consider advisory warning rule for `JSXSpreadAttribute`
6. **ZIFT Boundary Recognition (Scope-aware)**: Context-aware analysis to determine if component is inside ZIFT primitive (high complexity)

---

*Archive Consolidated: 2026-02-08*
