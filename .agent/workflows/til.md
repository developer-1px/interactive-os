---
description: Generate a TIL (Today I Learned) document summarizing technical learnings
---

1.  **Context Gathering**:
    - Get the current date (YYYY-MM-DD).
    - Run `git log --since="midnight" --stat --no-merges` to see today's work.
    - Recall technical learnings, debugging insights, and architectural discoveries from the conversation history.
    - Check if a DevLog exists for the day (`docs/10-devnote/[YYYY-MMDD]-devlog.md`) and reference its "Discoveries & Insights" section.

2.  **Drafting the TIL**:
    - Create a new markdown file with the following structure.
    - **Tone**: Technical, concise, code-heavy. Each item should be a self-contained micro-lesson that future-you can reference.
    - **Path**: `docs/10-devnote/[YYYY-MMDD]-til.md`
    - **Items**: Extract 3~6 concrete technical learnings. Each should have:
      - A one-line title describing the insight
      - Before/after code example (❌/✅) when applicable
      - 1~2 sentence explanation of **why**
      - A bold **교훈/takeaway** line
    - **Content Template**:
        ```markdown
        # 📝 TIL: [YYYY-MM-DD]

        > [One-line summary of the day's theme]

        ---

        ## 1. [Title of learning]

        [Code example or explanation]

        **교훈**: [One-line takeaway]

        ---

        ## 2. [Title of learning]
        ...

        ---

        ## 🔥 더 잘하고 싶은 것들

        [1~3 self-improvement items based on today's struggles]

        ---

        > *"[Closing quote or reflection]"*
        ```

3.  **Finalize**:
    - Write the content to the file.
    - Show the file path to the user.
