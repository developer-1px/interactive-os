---
description: Implement Standard PARA Method (Projects, Areas, Resources, Archives). Move completed projects to archive without merging, and clear the inbox based on actionability.
---

1. **Inbox Review & Clear**
   - **Scan**: List files in `docs/0-inbox`.
   - **Analyze**: Read each file/folder to understand its context.
   - **Propose Moves**:
     - **Project (`docs/1-project`)**: Has a specific goal AND a deadline. (e.g., "App Launch", "Refactor Auth")
     - **Area (`docs/2-area`)**: Has a standard to maintain indefinitely. (e.g., "DevOps", "Health", "Finances")
     - **Resource (`docs/3-resource`)**: Topic of ongoing interest or utility. (e.g., "React Patterns", "Design Assets")
     - **Archive (`docs/4-archive`)**: Completed projects or inactive items.
   - **Action**: Move items to their respective folders. Do NOT merge files; keep them intact.

2. **Project Review (Active -> Archive)**
   - **Scan**: List items in `docs/1-project`.
   - **Check Status**: Ask the user or identify projects that are "Completed" or "Inactive".
   - **Archive**: Move completed project folders (as is) to `docs/4-archive/[YYYY]/[ProjectName]`.
     - Create the year folder (e.g., `docs/4-archive/2026`) if it doesn't exist.
     - This preserves the project context entirely ("Cold Storage").

3. **Area & Resource Maintenance**
   - **Scan**: List items in `docs/2-area` and `docs/3-resource`.
   - **Promote/Demote**:
     - If an Area/Resource has become a specific Project (has a deadline), move to `docs/1-project`.
     - If no longer relevant, move to `docs/4-archive/[YYYY]/[ItemName]`.

4. **Execution**
   - Present a summary of all moves.
   - Upon confirmation, execute filesystem commands (`mv`).
   - Ensure the structure remains clean:
     - `docs/1-project` contains only *active* projects.
     - `docs/4-archive` contains the history, organized by year.
