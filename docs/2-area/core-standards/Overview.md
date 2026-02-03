# Overview: The Interaction OS Philosophy

## 1. The Core Problem: Handler Hell
Modern web development suffers from **"Handler Hell"**. Business logic is scattered across thousands of `onClick`, `onChange`, and `useEffect` hooks, tightly coupled with the View layer. This makes applications hard to test, debug, and refactor.

## 2. The Solution: Interaction OS
We treat the web application not as a collection of pages, but as a sovereign **Operating System** for user interaction.

### Core Principles

#### A. Command-Centricity ("Verb First")
All user intent is a **Command Object** (e.g., `{ type: 'ADD_TODO', payload: { text: 'Buy Milk' } }`).
- **Serializable**: Commands can be logged, replayed, or sent over the network.
- **Decoupled**: Views do not know *how* to execute logic, only how to *dispatch* an intent.

#### B. Pure View ("Passive UI")
React components are strictly passive projections of state.
- **No Local Logic**: Components do not contain complex `useEffect` or `useCallback` for business logic.
- **Primitive Binding**: Components use primitives (`Action`, `Field`, `Option`) to interact with the engine.

#### C. Jurisdictional Focus (Context-Driven)
The screen is divided into **Zones**. Keybindings and interactions are context-aware.
- **Zone**: Defines a spatial area (e.g., Sidebar, Main Content) and enforces keybinding rules.
- **Context**: Named conditions (e.g., `isEditing`, `hasTodos`) determine if a command can be triggered.

## 3. The 5-Layer Model
1.  **Transport/Signal**: Physical key presses and clicks.
2.  **Resolution**: Mapping signals to commands via Keybindings and Context.
3.  **Command Registry**: Library of all available system "Verbs".
4.  **State Engine**: Central logic processing commands to produce immutable state.
5.  **Projection (View)**: React layer rendering state and providing interaction primitives.

## 4. AI-Native Engineering
This architecture is optimized for AI co-creation.
- **Locality**: Related logic (`run`, `when`) is colocated to respect AI context windows.
- **Type Strictness**: Strict types prevent AI hallucination and enable self-healing code.
- **Component Decoupling**: Components like `Sidebar` and `TodoPanel` are physically decoupled but logically unified by the central engine, minimizing hallucination risks during refactoring.
