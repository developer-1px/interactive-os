---
description: Process docs/0-inbox items and organize them into PARA structure (1-project, 2-area, 3-resource, 4-archive).
---

1. **Scan Inbox**:
   - Run `list_dir` on `docs/0-inbox` to identify files needing organization.
   - If the inbox is empty, double check with `ls -R docs/0-inbox`. If still empty, notify the user and exit.

2. **Analyze Content**:
   - For each file, use `view_file` to understand its context.
   - **Classification Guide (PARA Method)**:
     - **1-project (`docs/1-project`)**: Active active goals with a deadline or specific outcome (e.g., "Refactoring Todo Engine", "Launch v2").
     - **2-area (`docs/2-area`)**: Ongoing responsibilities with no deadline (e.g., "Architecture", "Debugging", "UX Standards", "DevOps").
     - **3-resource (`docs/3-resource`)**: Reference materials or topics of interest (e.g., "Meeting Notes", "External Articles", "Design Patterns", "React Tips").
     - **4-archive (`docs/4-archive`)**: Completed projects or inactive items.

3. **Propose Plan**:
   - Create a mapped list of proposed moves.
   - Example:
     - `file_A.md` -> `docs/2-area/architecture/`
     - `file_B.md` -> `docs/1-project/`
     - `file_C.md` -> `docs/4-archive/`
   - **User Confirmation**: Present this plan and ask the user for confirmation before moving.

4. **Execute**:
   - Use `run_command` to move the files to their target directories.
   - **Create Directories**: Ensure the target directories exist (use `mkdir -p` if creating subdirectories in Areas/Resources).
   - Report the final status to the user.
