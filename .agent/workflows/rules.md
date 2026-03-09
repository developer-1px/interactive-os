---
description: .agent/rules.md에 프로젝트 규칙과 표준을 추가/수정한다.
---

1. **Analyze Request**: Identify the specific rule, standard, or guideline the user wants to add or modify from their message.
2. **Locate Rule File**:
   - The target file is ALWAYS `.agent/rules.md`.
   - Check if `.agent/rules.md` exists. If not, it will need to be created.
3. **Read Context**: Use `view_file` to read the current `.agent/rules.md` (if it exists) to understand the structure and existing standards.
4. **ambiguity Check (CRITICAL)**:
   - If the user's request is vague or if you are unsure *exactly* how to phrase the rule:
   - **STOP** and ask the user for clarification.
   - Ask specific questions: "Should this apply to all files or just components?", "What specific naming convention do you prefer?", etc.
   - *User Instruction*: "If it's ambiguous, keep asking me. If I say 'reflect it', then reflect it."
5. **Abstraction Gate (CRITICAL)**:
   - Rule은 **프로젝트 구체 사항이 아니라 판단 기준/원칙**이어야 한다.
   - 구체적 구현(`recoveryTargetId`, `OS_RECOVER` 등)을 직접 언급하지 않는다.
   - LLM이 이미 아는 전문 용어(Lazy Evaluation, Write-Ahead Log, Event Sourcing 등)로 대체한다.
   - **테스트**: "이 rule을 다른 프로젝트에 가져가도 의미가 통하는가?" → No면 추상화 부족.
   - 예시:
     - ❌ "`focusedItemId`를 삭제 시 즉시 교체하면 undo 복귀 불가"
     - ✅ "참조는 쓸 때 보존하고 읽을 때 해석한다 (Lazy Resolution)"
6. **Draft & Apply**:
   - Once the rule is clear or the user explicitly says "reflect it" / "do it":
   - Formulate the rule in clear, professional Markdown.
   - Use `write_to_file` (if creating) or `replace_file_content` / `multi_replace_file_content` to add the rule to `.agent/rules.md`.
6. **Verify**: Confirm to the user that the rule has been added to `.agent/rules.md`.
