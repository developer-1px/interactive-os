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
     - **4. 해법 유형 (Solution Landscape)**: 이 문제가 "정답이 있는 문제"인지 판단한다.
       - 🟢 **Known**: 자명한 해법, 업계 Best Practice, 널리 알려진 정답이 존재.
       - 🟡 **Constrained**: 선택지가 있지만 트레이드오프가 명확하여 범위가 좁음.
       - 🔴 **Open**: 정답이 없고, 프로젝트 맥락에 따른 의사결정이 필요.
       - 판정 근거를 1~2줄로 제시한다.
     - **5. 인식 한계 (Epistemic Status)**: AI가 이 분석에서 확인하지 못한 것, 추측에 기반한 부분을 명시한다. (예: "이 분석은 코드 정적 분석에 기반하며, 런타임 성능 영향은 확인하지 못했다.")
     - **6. 열린 질문 (Open Questions)**: 사용자의 의사결정이 필요한 항목을 번호 목록으로 제시한다. 정답이 있는 문제(Known)는 여기에 넣지 않고 제안에서 바로 답을 제시한다.
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
