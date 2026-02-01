# Project Rules & Architectural Mandates (Red Team Audit)

These rules are the **ABSOLUTE LAW** of the project. Violations are considered critical technical debt.

## 1. Logic & Architecture (The "Red Team" Standard)

### A. Declarative Jurisdiction (CRITICAL)
- **NO "Magic Bubbling"**: Primitives (Input, Field) must **NEVER** contain complex conditional logic for navigating out of themselves (e.g., `if (cursorAtStart) jump()`).
- **Sensor Pattern**: Primitives must function ONLY as **Sensors** that report granular context (e.g., `cursorAtStart`, `isFocused`) to the global Command Engine.
- **Declarative Activation**: Navigation and specialized behaviors must be defined in the **Command Registry** using `when` clauses (e.g., `when: '!isFieldFocused || cursorAtStart'`).
- **Rationale**: Keeps primitives pure and allows the OS to orchestrate behavior globally.

### B. State Integrity & Purity
- **Single Source of Truth**: UI components must **NEVER** perform optimistic state modifications (e.g., clearing an input locally) without formal Store confirmation.
- **Reactive UI**: Components must be "dumb" projections of the global state. if `state.value` hasn't changed, the UI must not change.
- **Command-Based Interaction**: All state mutations must go through the **Command Engine** (`dispatch`). Never call internal state setters directly from UI components.

### C. Layer Hygiene
- **Strict Direction**: Imports must flow ONLY from lower layers to higher layers.
  - **Environment (L4)** ➔ **Engine (L3)** ➔ **Logic (L2)** ➔ **State (L1)**.
  - *Never* import a Component (L4) into a Primitve (L2).

## 2. Knowledge Graph
- **Mandatory Reference**: Before implementing any major feature, you **MUST** consult the "Antigravity Core System" Knowledge Item.
