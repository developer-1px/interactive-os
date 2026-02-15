# AI 삽질 루프 근본 원인 분석 — /issue 워크플로우 개선

## Journey

**🧑 사용자**: 테스트봇 러너 연동이 안되고 있어 확인 후 수정

**🤖 AI**: git log로 삭제된 playwright 파일 4개 발견 → 즉시 `git checkout`으로 복구. PlaywrightRunnerPage도 복구하고 라우트 생성.

**🧑 사용자**: src/inspector/testbot/widgets/TestBotPanel.tsx:57:7 테스트 봇은 여기인데?

> AI가 TestBot Runner의 위치를 잘못 이해. TestDashboard가 아니라 Inspector 패널.

**🤖 AI**: PlaywrightRunnerPage 삭제하고 TestBotPanel에 14개 spec import 추가.

**🧑 사용자**: TestBot Runner가 되게 하라고. /playground/playwright 이건 제거된 화면이야

> AI가 의도적으로 제거된 페이지를 복구한 것을 사용자가 교정.

---

**🧑 사용자**: 이 사태에 대해서 심각히 논의해보자 (/discussion)

**🤖 AI**: 팩트 정리 — AI가 "확인 없이 수정"을 3번 반복. 사용자가 3번 교정.

**🧑 사용자**: 내가 원했던 요구사항이 뭐였어

**🤖 AI**: "확인 후 수정" — 이 두 단어가 전부. 나는 "확인"을 건너뛰고 "수정"부터 했다.

---

**🧑 사용자**: 정상이라고 생각하는 최종 결과는 뭐야?

**🤖 AI**: 파이프라인 5단계 도출 (spec-wrapper → alias → shim → registry → loader → 호출). 마지막 연결 고리만 결정하면 됨.

**🧑 사용자**: Route가 중심이겠지? lazy하면 더 좋고 필요할때 필요한 만큼

> 핵심 설계 결정: 각 페이지가 자기 spec만 등록. TestBotPanel은 UI만.

---

**🧑 사용자**: 지금 이렇게 잘 하는데 왜 이슈를 수정할때 이 사태가 발생했던거야?

**🤖 AI**: Discussion 모드에서는 질문이 의무, Issue 모드에서는 코드가 의무. `/diagnose`에 Known/Open 분류가 없어서 모든 것을 Known으로 취급.

**🧑 사용자**: /retrospect를 하고 workflow를 수정하자

> KPT 회고 후 `/issue`에 Gate ① Known/Open 분류 + 이해 확인 게이트 추가.

---

**🧑 사용자**: 첫 감 제거. 브라우저 접근 안되면 어떻게 할래?

> "첫 감" = 확증 편향 유도. 재현 실패 시 Fallback 절차 추가.

**🧑 사용자**: /ready /fix /verify가 겹치는데 /ready가 상위 파이프라인 아닐까?

> `/ready`를 tsc + 서버 + 렌더 스모크로 격상. 계층 정리: ready ⊂ verify ⊂ fix.

---

**한 줄 요약**: `/issue`에서 AI가 삽질하는 원인은 "이해 전에 행동"이며, Known/Open 게이트와 `/ready` 격상으로 구조적으로 방지한다.

---

# Conclusion — AI 삽질 루프의 근본 원인과 구조적 해법

## Why
AI가 이슈를 수정할 때 "이해 없이 코드 수정 → 크래시 → 되돌리기 → 재수정"의 삽질 루프에 빠졌다.

## Intent
이 패턴이 반복되는 구조적 원인을 찾고, 워크플로우 수정으로 제도화한다.

## Warrants

- W1. 삭제된 코드의 의도를 파악하지 않고 복구하면 의도적 삭제를 되돌린다
- W2. 아키텍처 이해 없이 코드 수정은 연쇄 실패를 만든다
- W3. 브라우저 에러 확인 불가 → 맹목적 수정 루프
- W4. "일단 해보고 되돌리기" 전략은 시간 낭비
- W5. 프로젝트 문서(PRD, Proposal, Status)가 존재하는데 읽지 않았다
- W6. 사용자의 요구사항은 "확인 후 수정"이었는데 "확인"을 건너뛰고 "수정"부터
- W7. 사용자가 3번 교정 = AI가 3번 잘못된 가정으로 행동
- W8. 파이프라인 5단계 중 4단계는 존재. 문제는 마지막 연결 고리
- W9. TestBotPanel은 UI만. 등록 책임은 페이지에
- W10. Lazy = 필요할 때 필요한 만큼
- W11. `/diagnose`가 코드 탐색만으로 끝나면 "이해했다"는 착각
- W12. Discussion = 질문 의무, Issue = 코드 의무. 이 차이가 삽질의 구조적 원인
- W13. "첫 감"은 확증 편향을 만든다
- W14. 브라우저 접근 실패 시 에러 없이 코드 수정 → 삽질 루프
- W15. `/ready`가 서버 200만 확인하면 "떴지만 크래시" 못 잡는다
- W16. 워크플로우 책임은 계층적이어야: ready ⊂ verify ⊂ fix

## 적용된 변경

| 파일 | 변경 |
|------|------|
| `.agent/workflows/issue.md` | Step 3 베이스라인(/ready), Gate ① Known/Open, 첫 감 제거, 재현 실패 fallback |
| `.agent/workflows/ready.md` | tsc + 서버 + 렌더 스모크로 격상 |

## 한 줄 요약

**AI가 삽질하는 근본 원인은 "이해 전에 행동"이며, `/issue`에 Known/Open 게이트를, `/ready`에 최소 스모크를 추가하여 구조적으로 방지한다.**
