---
description: Process docs/0-inbox items and organize them into PARA structure (1-project, 2-area, 3-resource, 4-archive). Includes automatic grouping and archiving rules.
---

1. **Scan Inbox**:
   - Run `list_dir` on `docs/0-inbox` to identify files needing organization.
   - If the inbox is empty, notify the user and exit.

2. **Analyze Content**:
   - For each file, use `view_file` to understand its context and identify its primary topic/category.
   - **Classification Guide (PARA Method)**:
     - **1-project (`docs/1-project`)**: Active goals with a deadline.
     - **2-area (`docs/2-area`)**: Ongoing responsibilities.
     - **3-resource (`docs/3-resource`)**: Reference materials or topics of interest.
     - **4-archive (`docs/4-archive`)**: Completed or inactive items.

3. **Organizational Rules**:
   - **Subfolder Requirement**: If a category (Project, Area, Resource) contains more than **3 files** at its root level, you MUST create subfolders based on topics and move the files into them.
   - **Consolidation & Archiving**: If any folder within the PARA categories (1, 2, 3) contains more than **7 files**, you MUST:
     1. Merge the contents of all files in that folder into a single "Consolidated" document (e.g., `[Folder_Name]_Consolidated.md`).
     2. Move this consolidated document to a relevant sub-path in `docs/4-archive/`.
     3. Delete the original folder and its contents.

4. **Propose Plan**:
   - Create a mapped list of proposed moves and maintenance actions (merges/deletions).
   - Example:
     - `file_A.md` -> `docs/1-project/todo-engine-refactor/` (New folder since files > 3)
     - Merge `docs/3-resource/analysis/*` (8 files) -> `docs/4-archive/analysis_consolidated_2024.md`
   - **User Confirmation**: Present this plan and ask for confirmation before execution.

5. **Execute**:
   - Use `run_command` or file tools to move, merge, and delete files.
   - **Create Directories**: Use `mkdir -p` for new subfolders.
   - Report the final status to the user.
