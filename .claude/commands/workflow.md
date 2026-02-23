---
description: 대화형으로 workflow를 생성하거나 수정한다.
---

1. **Existence Check**: 대상 workflow 파일(`.claude/commands/`)이 이미 존재하는지 확인한다. 존재하면 기존 내용을 보여주고, 새로 만들지/수정할지 사용자에게 확인한다.
2. **Initialization**: 사용자가 대상을 아직 지정하지 않은 경우에만 "어떤 workflow를 만들까요?" 라고 묻는다. 이미 지정한 경우 바로 3단계로 넘어간다.
3. **Interactive Drafting Loop**:
    - Ask the user for the **intent** (what should the workflow do?) and **why** (what is the rationale/value?).
    - Based on the user's input, draft the technical steps for the workflow.
    - Present the current draft of the workflow to the user in a clear, cumulative format.
    - Continue this loop, refining the draft with each user response, until the user says "등록해".
4. **Registration**:
    - Once the user says "등록해", finalize the workflow file.
    - Save the workflow as a new `.md` file in the `.claude/commands/` directory.
    - Use a concise, descriptive filename (e.g., `my-new-workflow.md`).
    - Follow the standard workflow format:
        ```markdown
        ---
        description: [Brief description]
        ---
        [Step-by-step instructions]
        ```
    - Confirm the registration to the user with the file path.
