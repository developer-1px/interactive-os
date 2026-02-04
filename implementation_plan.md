# OS Architecture Refactoring Plan (Incremental with Automation)

## Goal
Restructure the `src/os` directory into a Domain-Driven Design (DDD) & Feature-Sliced Design (FSD) inspired architecture. 
This refactoring will be performed **incrementally** using `ts-morph` automation scripts to ensure safety and consistency.

**Target Structure:**
- `src/os/entities`: 1 File = 1 Interface (Domain Models).
- `src/os/features`: Key capabilities (Command, Focus, Input, Jurisdiction) with `model`, `lib`, `ui` segments.
- `src/os/widgets`: Common OS UI components (Zone, Item, etc.).
- `src/os/shared`: Shared utilities.

## User Review Required
> [!IMPORTANT]
> This is a **destructive** operation to the folder structure. 
> We will use automation scripts to minimize human error, but backups or git commits are essential before each phase.

## Phase 1: Entities Extraction (The Foundation)
**Goal**: Move all shared interfaces and types to `src/os/entities` to break circular dependencies and establish the ubiquitous language.

1.  **Create Script**: `scripts/refactor/01_extract_entities.ts`
    -   Target files: `focusTypes.ts`, `definition.ts`, `behaviorTypes.ts`, etc.
    -   Action: Extract types/interfaces to individual files in `src/os/entities`.
    -   Refactor: Update all imports in the project to point to `@os/entities/*`.
    -   Naming: Ensure file name matches interface name exactly (e.g. `ZoneMetadata.ts`).
2.  **Execution**: Run script, verify build, commit.

## Phase 2: Features Restructuring (The Core)
**Goal**: Move internal logic to `src/os/features/*` following FSD segments.

1.  **Create Script**: `scripts/refactor/02_move_features.ts`
    -   **Command Feature**: Move `os/core/command` -> `os/features/command`.
        -   Split `store.tsx` -> `model/commandStore.ts`, `model/CommandRegistry.ts`.
        -   Rename `commands/osCommands.ts` -> `definitions/commandsShell.ts`.
    -   **Focus Feature**: Move `os/core/focus` -> `os/features/focus`.
        -   Rename `axes/*` -> `axes/handler*.ts`.
        -   Move `store/*` -> `model/slice*.ts`.
    -   **Input Feature**: Move `os/core/input` -> `os/features/input`.
    -   **Jurisdiction Feature**: Create `os/features/jurisdiction`.
        -   Move `ZoneRegistry` and `CommandContext`.
2.  **Execution**: Run script, verify build, fix any lingering import issues manually if needed.

## Phase 3: Widgets & UI (The Visuals)
**Goal**: Move reusable UI components to `src/os/widgets`.

1.  **Create Script**: `scripts/refactor/03_move_widgets.ts`
    -   Move `os/ui/Zone.tsx`, `Item.tsx`, `Field.tsx` -> `src/os/widgets/`.
    -   Move `os/core/AntigravityOS.tsx` -> `src/os/features/AntigravityOS.tsx`.
2.  **Execution**: Run script, verify build.

## Phase 4: Shared & Debug (Cleanup)
**Goal**: Final cleanup of `lib`, `debug` and root files.

1.  **Create Script**: `scripts/refactor/04_cleanup.ts`
    -   Move `os/ui/field/*` -> `src/os/shared/lib` or `src/os/features/field/lib`.
    -   Move `os/debug` -> `src/os/debug` (keep or refine).
    -   Delete empty directories in `os/core`, `os/ui`.
    -   **Barrel Cleanup**: Ensure no `index.ts` files remain or are created (except where strictly necessary for external packages, but widely avoided inside OS).
2.  **Execution**: Run script, verify build.
3.  **Manual Verification**: Check `tsconfig.json` paths and aliases.

## Verification Plan
### Automated Verification
After each script run:
1.  **Type Check**: `npm run build` (runs tsc).
2.  **Lint Check**: `npm run lint`.

### Manual Verification
1.  **Browser Test**: Ensure application loads and interactive features (Focus, Command Palette) work.
