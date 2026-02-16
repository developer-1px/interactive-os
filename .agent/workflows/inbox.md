---
description: 사용자 요청을 분석하여 정형화된 보고서를 docs/0-inbox에 저장한다.
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
      - **4. Cynefin 도메인 판정** (`rules.md` 참조): 이 문제의 복잡도 도메인을 판단한다.
        - 🟢 **Clear**: 자명한 해법, 업계 Best Practice가 존재. → Sense-Categorize-Respond.
        - 🟡 **Complicated**: 선택지가 있지만 분석하면 답이 좁혀짐. → Sense-Analyze-Respond.
        - 🔴 **Complex**: 정답이 없고, 프로젝트 맥락에 따른 의사결정이 필요. → Probe-Sense-Respond.
        - 판정 근거를 1~2줄로 제시한다.
        - (Chaotic은 inbox 분석이 아닌 즉시 행동 영역이므로 여기서 분류하지 않는다)
      - **5. 인식 한계 (Epistemic Status)**: AI가 이 분석에서 확인하지 못한 것, 추측에 기반한 부분을 명시한다. (예: "이 분석은 코드 정적 분석에 기반하며, 런타임 성능 영향은 확인하지 못했다.")
     - **6. 열린 질문 (Complex Questions)**: 사용자의 의사결정이 필요한 항목을 번호 목록으로 제시한다. Clear/Complicated 문제는 여기에 넣지 않고 제안에서 바로 답을 제시한다.
     - **한줄요약**: 보고서 전체를 1문장으로 압축한다. 문서 목록에서 훑어볼 때 이것만 보고 내용을 떠올릴 수 있어야 한다.

3. **저장 위치 결정 (프로젝트 컨텍스트 라우팅)**
   - `docs/STATUS.md`를 읽어 현재 Active Focus 프로젝트를 확인한다.
   - **Focus가 1개**: 보고서 내용이 해당 프로젝트와 관련 있는지 판단한다.
     - 관련 있음 → `docs/1-project/[name]/notes/`에 저장
     - 관련 없음 → 아래 분류 기준으로 판단
   - **Focus가 2개 이상**: 보고서 내용과 프로젝트명을 매칭한다.
     - 매칭됨 → 해당 `docs/1-project/[name]/notes/`에 저장
     - 매칭 안 됨 → 아래 분류 기준으로 판단
   - **Focus가 0개**: 아래 분류 기준으로 판단
   - **분류 기준**:
     - 언젠가 할 아이디어, 지금은 아님 → `docs/5-backlog/`
     - 참고 자료, 공부, 읽을거리 → `docs/3-resource/`
     - 기타 → `docs/0-inbox/` (기본 동작)

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

5. **대시보드 갱신**
   - 보고서가 `docs/0-inbox/`에 저장된 경우:
     - `docs/STATUS.md`의 Inbox 섹션에 새 항목을 추가한다.
     - Related Project와 Suggested Action을 판정하여 기록한다.
   - 보고서가 `docs/1-project/[name]/notes/`에 저장된 경우:
     - 대시보드의 해당 프로젝트 Last Activity를 갱신한다.

6. **Notify User**
   - Inform the user that the report has been created and provide the path for review.
   - 프로젝트로 라우팅된 경우 어떤 프로젝트에 배치되었는지 명시한다.
