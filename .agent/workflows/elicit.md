---
description: 잘못된 의사결정에서 출발하여, 전문가(사용자)의 암묵지를 체계적으로 추출하고 명시화한다.
---

## /elicit — Tacit Knowledge Elicitation

> Knowledge Elicitation (Nonaka & Takeuchi, SECI Externalization).
> 전문가는 직감적 답을 갖고 있다. LLM은 모른다.
> LLM이 체계적 질문으로 암묵지를 추출하고,
> 다음 LLM이 와도 동일한 판단을 내릴 수 있는 수준으로 명세화한다.

### 트리거

- LLM이 잘못된 의사결정을 했고, 사용자가 교정할 때
- 사용자가 "그게 아니야", "왜 그렇게 해?" 등으로 암묵지의 존재를 드러낼 때
- 사용자가 `/elicit`을 명시적으로 호출할 때

### 절차

**Phase 1: Acknowledge**
- 잘못된 판단을 1문장으로 인정한다.
- 변명하지 않는다. 원인을 추측하지 않는다.

**Phase 2: Laddering (Why 추출)**
- 잘못된 판단과 올바른 판단 사이의 갭을 질문으로 좁혀간다.
- 기법:
  - **Laddering**: "왜 이게 틀린 건가요?" → 답변 → "그 원칙은 어디서 오는 건가요?"
  - **Teach-back**: "제가 이해한 바: [X]. 맞습니까?" → 교정 → 재구성
  - **Critical Decision Method**: "이 상황에서 올바른 판단은 뭔가요? 왜 그게 자명한가요?"
- **최소 2회 Teach-back** — 한 번에 이해했다고 속단하지 않는다.
- 수렴 기준: 사용자가 Teach-back에 "맞아"라고 할 때.

**Phase 3: Crystallize (명세화)**
- 수렴한 암묵지를 독립된 문장으로 적는다.
- 자문: "다음 LLM이 이 문장만 읽고 같은 판단을 할 수 있는가?"
- 불충분하면 → Phase 2로 돌아간다.

**Phase 4: Codify (기록)**
- 확인된 명세를 적절한 위치에 기록한다:

  | 지식 유형 | 기록 위치 |
  |----------|----------|
  | 원칙/신념 | `.agent/rules.md` |
  | 절차/프로세스 | `.agent/workflows/*.md` |
  | 구체적 판단 사례 (판례) | `.agent/precedents/*.md` |
  | 도메인 지식 | `docs/` 또는 `official/` |

- 기록 위치와 내용을 사용자에게 보고한다.

### 금지

- "알겠습니다" 후 코드 수정 → 금지. Codify가 먼저.
- 사용자의 말을 그대로 복사 → 금지. 자기 언어로 Teach-back해야 이해 검증 가능.
- Teach-back 1회로 확신 → 금지. 최소 2회.
- Phase 2에서 답을 추측하여 제시 → 금지. 질문으로 끌어내야 한다.
