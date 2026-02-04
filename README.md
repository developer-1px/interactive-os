# 🌌 Interactive OS (Project Antigravity)

**Project Antigravity** is a high-fidelity, spatial interaction-driven OS environment built on React. It bridges the gap between logical element registries and physical DOM layout, enabling intuitive, keyboard-first spatial interactions for complex web applications.

---

## 🚀 Core Philosophy: "Structure as Specification"

Interactive OS formalizes web interaction through a systematic approach to focus, command orchestration, and spatial awareness. Every component is designed to be "aware" of its physical position and logical jurisdiction within the OS.

### 🎯 The 7-Axis Focus Model
Our focus behavior system is formalized around 7 atomic axes to ensure predictable navigation in complex 2D layouts:
1.  **Direction**: Spatial movement (Up/Down/Left/Right).
2.  **Edge**: Handling boundaries and wrapping policies.
3.  **Tab**: Recursive linear navigation following DOM/Visual order.
4.  **Target**: Direct focus targeting via ID or logic.
5.  **Entry**: Smart entry point selection when moving between zones (Seamless Entry).
6.  **Restore**: OS-managed focus memory.
7.  **Recovery (Self-Healing)**: *Standard 1.27* – Automatically restores focus to the most appropriate sibling when a focused item is deleted or mutated.

### 🕹️ Command Event Bus & Jurisdictional Binding
Interactive OS eliminates "Handler Hell" through a decoupled, signal-based architecture:
-   **Command Center**: A central hub for orchestrating OS-level signals (e.g., `focus.move`, `field.edit`).
-   **Jurisdictions**: Scoping commands to specific containers (Zones). Components only react to commands valid within their current context.
-   **Select-then-Edit**: A unified pattern where high-level interaction (selection) is cleanly separated from active input modes.

---

## 🛠️ Applications

### 📝 Reference Todo Implementation
A benchmark SaaS-style application demonstrating:
-   **Kanban 2D Navigation**: Complex horizontal/vertical movement between columns.
-   **Normalized Data**: O(1) performance using Record + Order patterns.
-   **Undo/Redo**: Snapshot-based state management powered by Immer.

### 🏗️ Web Builder (Visual CMS)
A high-fidelity layout builder featuring:
-   **Bento Grid Layouts**: Testing spatial sensing in non-linear grids.
-   **Seamless Section Navigation**: Fluid vertical movement across complex web sections.
-   **Integrated Text Editing**: Zero-base scaffolding for inline content manipulation.

---

## 💎 Teo Design System
The visual foundation of Antigravity, optimized for high-density professional tools:
-   **Compact Premium Light**: A sleek, minimal aesthetic designed for focus and productivity.
-   **Command-Driven Purity**: Interactive primitives (like `Field`) are controlled via global OS signals, maintaining local state purity.
-   **Responsive Layouts**: Native support for complex grids and fluid transitions.

---

## 🔍 Observability & Diagnostics

We believe "If you can't see it, you can't debug it."
-   **Zero-Base Command Inspector**: A built-in developer tool for real-time event tracing, state inspection, and interaction telemetry.
-   **Spatial Laboratory**: The `/focus-showcase` page serves as an active laboratory for benchmarking 7-axis navigation policies.

---

## 💻 Tech Stack

-   **Runtime**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) + [Immer](https://immerjs.github.io/immer/)
-   **Styling**: Vanilla CSS + Tailwind CSS (Utility-first flexibility)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Linter/Formatter**: [Biome](https://biomejs.dev/)

---

## 🏁 Getting Started

```bash
# Clone the repository
git clone https://github.com/developer-1px/interactive-os.git

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📂 Documentation (PARA Method)
The project documentation follows the PARA method (Projects, Areas, Resources, Archives) for high-fidelity organization:
-   `docs/0-inbox`: New proposals and working drafts.
-   `docs/1-project`: Active implementation details.
-   `docs/2-area`: Core architectural standards (7-Axis, Teo Design).
-   `docs/3-resource`: Research and benchmarks.

---

**Built with ❤️ by Project Antigravity Team.**
