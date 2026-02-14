---
description: 워크플로우 자체를 KPT 회고하고, 결과를 workflow 파일에 즉시 반영하는 자가 개선 루프.
---

## /retrospect — 워크플로우 자가 개선 회고

### 원칙

> 회고의 대상은 **코드가 아니라 워크플로우**다.
> 이번 작업에서 어떤 workflow를 썼고, 그것이 훌륭했는지 아쉬웠는지를 KPT로 평가한다.
> Problem과 Try는 반드시 **workflow 파일 수정**으로 귀결된다.

### 절차

1. **세션 요약**
   - 이번 세션에서 사용한 workflow들을 나열한다.
   - 각 workflow가 어떤 맥락에서 호출됐는지 기록한다.

2. **KPT 평가** (workflow별)

   #### Keep 🟢
   - 이 workflow에서 잘 작동한 단계. 계속 유지할 것.

   #### Problem 🔴
   - 절차가 빠졌거나, 불필요하거나, 순서가 잘못된 것.
   - workflow를 따랐는데도 삽질한 경우 → 절차의 결함.
   - workflow를 안 따라서 삽질한 경우 → 절차의 가시성 부족.

   #### Try 🔵
   - Problem을 해결하기 위한 **구체적 workflow 수정안**.
   - 단계 추가/삭제/순서 변경/설명 보강을 명시한다.

3. **자가 개선 실행**
   - Try 항목을 즉시 `.agent/workflows/*.md` 파일에 반영한다.
   - 수정 전후를 diff로 보여준다.

4. **산출물**
   - 인라인으로 KPT 결과를 보여주고, 수정된 workflow 목록을 제시한다.
   - 프로젝트 회고 시: `docs/1-project/{name}/retrospective.md`에도 저장.
