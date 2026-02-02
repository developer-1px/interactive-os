---
description: Analyzes the user request and saves a formal report to docs/0-inbox
---

1. **Analyze User Request**
   - Identify the core topic, issue, or question provided after the `/inbox` command.
   - If the request implies a bug or technical issue, perform necessary investigation (read code, check logs, verify behavior).
   - If the request is for design or research, gather relevant context.

2. **Draft Report Content**
   - Structure the report with the following sections (adapt as needed):
     - **Title**: Clear and descriptive.
     - **1. 개요 (Overview)**: Summary of the request.
     - **2. 분석 (Analysis) / 상세 내용 (Details)**: Technical findings, code snippets, or research data.
     - **3. 결론 (Conclusion) / 제안 (Proposal)**: Recommended actions or summary.

3. **Prepare Destination**
   - Target Directory: `docs/0-inbox` (relative to workspace root).
   - Ensure this directory exists. If not, create it.

4. **Save Report**
   - Generate a filename using the current date and topic: `YYYY-MM-DD_[Short_Topic].md`.
   - Write the drafted content to this file using `write_to_file`.
   - **Important**: Do NOT overwrite existing files unless explicitly instructed. If a file exists, append a version number or timestamp.

5. **Notify User**
   - Inform the user that the report has been created and provide the path for review.
