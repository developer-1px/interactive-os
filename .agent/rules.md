# Project Rules & Standards

## Naming Conventions
- **Match Filenames to Exports**: File names must exactly match the name of the main component, function, or interface they export.
  - **Components**: Use PascalCase (e.g., `TodoItem.tsx`, not `todo-item.tsx`).
  - **Hooks/Functions**: Use camelCase (e.g., `useCommand.ts`, not `use-command.ts`).
  - **Avoid Kebab-case**: Do not use kebab-case for filenames unless the file exports strictly just constants or configuration that doesn't map to a single symbol (and even then, prefer camelCase if possible).
- **No Abbreviations**: Avoid using abbreviations. Use full, descriptive names.
  - **Example**: Use `category` instead of `cat`.
  - **General Rule**: Do not shorten words; write them out fully to maximize clarity.
  - **Exceptions**: Widely accepted domain standards are permitted:
    - `ctx` (Context)
    - `cmd` (Command)
    - `id` (Identifier)
    - `ref` (Reference)
    - `props` (Properties)
    - `e` (Event)

## Directory Structure
- **No Barrel Files (`index.ts`/`index.tsx`)**: Avoid using `index.tsx` or `index.ts` files to re-export modules.
  - **Preferred**: `components/TodoItem/TodoItem.tsx`
  - **Avoid**: `components/TodoItem/index.tsx`
- **Exception**: Barrel files are permitted ONLY for large, encapsulated modules where the API is strictly internal/private and a single entry point is necessary for encapsulation.

## Code Style & Formatting
- **Formatter**: Use `biome` for formatting and linting.
- **Indentation**: 2 spaces (Enforced by `biome.json`).
- **Imports**: Organized automatically by Biome.
