---
description: Analyzes the user request and saves a formal report to docs/0-inbox
---

1. **Analyze User Request**
   - Identify the core topic, issue, or question provided after the `/inbox` command.
   - If the request implies a bug or technical issue, perform necessary investigation (read code, check logs, verify behavior).
   - If the request is for design or research, gather relevant context.

2. **Draft Report Content**
   - Structure the report with the following sections (adapt as needed):
     - **Title**: 제목을 가장 먼저 작성한다.
     - **메타 테이블**: 제목 바로 아래에 다음 항목을 표로 정리한다.
       - `원문`: 사용자가 입력한 프롬프트 원문. 오타만 수정하고 문체는 그대로 유지.
       - `내(AI)가 추정한 의도`: AI가 추론한 사용자의 숨겨진 의도 1문장.
       - 추가 메타 정보 (날짜, 상태 등) 필요 시 같은 표에 추가.
     - **1. 개요 (Overview)**: Summary of the request.
     - **2. 분석 (Analysis) / 상세 내용 (Details)**: Technical findings, code snippets, or research data.
     - **3. 결론 (Conclusion) / 제안 (Proposal)**: Recommended actions or summary.
     - **자기 평가**: 보고서 맨 마지막에 AI가 스스로 이 보고서의 품질을 평가한다.
       - 점수: A/B/C/D (A=탁월, B=충분, C=미흡, D=재작성 필요)
       - Evidence: 점수의 근거를 2~3줄로 구체적으로 제시 (예: "요청은 수준 평가였으나 분석 깊이가 표면적", "구체적 개선안을 코드 수준까지 제시")
     - **한줄요약**: 보고서 전체를 1문장으로 압축한다. 문서 목록에서 훑어볼 때 이것만 보고 내용을 떠올릴 수 있어야 한다.

3. **Prepare Destination**
   - Target Directory: `docs/0-inbox` (relative to workspace root).
   - Ensure this directory exists. If not, create it.

4. **Save Report**
    - Generate a filename using the following format: `YYYY-MMDD-HHmm-[type]-kebab-title.md`
      - `YYYY-MMDD-HHmm`: 연-월일-시분 (예: `2026-0212-1402`)
      - `[type]`: 문서 유형 태그. 다음 중 하나:
        - `[analysis]` — 기술 분석, 감사, 진단
        - `[proposal]` — 설계 제안, 리팩토링 제안
        - `[decision]` — ADR, 의사결정 기록
        - `[report]` — 현황 보고, 평가
        - `[research]` — 리서치, 레퍼런스 조사
        - `[bug]` — 버그 분석/해결
      - `kebab-title`: 영문 소문자 kebab-case 제목
      - 예: `2026-0212-1402-[analysis]-mermaid-rendering-failure.md`
   - Write the drafted content to this file using `write_to_file`.
   - **Important**: Do NOT overwrite existing files unless explicitly instructed.

5. **Notify User**
   - Inform the user that the report has been created and provide the path for review.
