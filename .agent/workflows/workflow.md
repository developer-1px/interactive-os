---
description: Create or update workflows interactively by gathering intent and rationale.
---

1. **Initialization**: Start the interaction by asking the user: "어떤 workflow를 만들까요?"
2. **Interactive Drafting Loop**:
    - Ask the user for the **intent** (what should the workflow do?) and **why** (what is the rationale/value?).
    - Based on the user's input, draft the technical steps for the workflow.
    - Present the current draft of the workflow to the user in a clear, cumulative format.
    - Continue this loop, refining the draft with each user response, until the user says "등록해".
3. **Registration**:
    - Once the user says "등록해", finalize the workflow file.
    - Save the workflow as a new `.md` file in the `.agent/workflows/` directory.
    - Use a concise, descriptive filename (e.g., `my-new-workflow.md`).
    - Follow the standard workflow format:
        ```markdown
        ---
        description: [Brief description]
        ---
        [Step-by-step instructions]
        ```
    - Confirm the registration to the user with the file path.
