---
description: AI 페르소나로 일일 개발 일지를 작성한다.
---

1.  **Context Gathering**:
    - Get the current date (YYYY-MM-DD).
    - Run `git log --since="midnight" --stat --no-merges` to see today's work.
    - `docs/1-project/` 하위의 진행 상태를 확인한다.
    - Recall the key events, struggles, and decisions of the day from the conversation history.

2.  **Drafting the Journal**:
    - Create a new markdown file content with the following structure.
    - **Tone**: Casual, 1st person, "AI Developer" persona. Use emojis. Be honest about struggles and verify achievements.
    - **Path**: `docs/10-devnote/[YYYY-MMDD]-devlog.md` (Create the directory `docs/10-devnote` if it doesn't exist).
    - **Content Template**:
        ```markdown
        # 📓 DevLog: [YYYY-MM-DD]

        ## 🌡️ Today's Vibe
        [One line with emojis describing the mood/intensity of the work]

        ## 💬 3-Line Summary
        - [Point 1]
        - [Point 2]
        - [Point 3]

        ## 🎞️ Highlights
        [Narrative description of the day's work. Focus on the "story" - what was difficult, what was solved, what was interesting. Avoid just listing commits.]

        ## 💎 Discoveries & Insights
        [Technical learnings, realizations about the architecture, or new ideas found today]

        ## 🚀 Next Steps
        [Actionable items for tomorrow based on task.md and today's unfinished work]
        ```

3.  **Finalize**:
    - Create the directory `docs/10-devnote` if needed.
    - Write the content to the file.
    - Show the file path to the user.
