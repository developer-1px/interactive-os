---
description: 최근 작업 정리(Changelog) + 마일스톤 제안(Now/Next/Later) TODO 리포트 생성
---

1. **정보 수집**
   - `git log --oneline -30` 으로 최근 커밋 확인
   - `docs/0-inbox/` 최근 보고서 스캔
   - `docs/1-project/` 진행 중인 프로젝트 파악
   - `docs/2-area/` 비전·원칙·영역 참고
   - 최근 대화 히스토리(conversation summaries) 참고

2. **분석 및 분류**
   - 수집된 정보를 기반으로 완료/진행중/미착수 분류
   - 블로커 및 미해결 이슈 식별

3. **리포트 생성**
   - `docs/0-inbox/YYYY-MM-DD_TODO.md` 로 저장
   - 포맷:

     ```markdown
     # TODO — YYYY-MM-DD

     ## 📋 Recent (완료된 작업)
     Changelog 스타일로 분류:
     - **Added**: 새로 추가된 기능
     - **Changed**: 변경/리팩토링
     - **Fixed**: 버그 수정
     - **Removed**: 제거된 항목

     ## 🔴 Now (이번 주)
     - [ ] 즉시 착수 가능한 작업들

     ## 🟡 Next (이번 달)
     - [ ] 곧 해야 할 작업들

     ## 🟢 Later (미래)
     - [ ] 나중에 할 작업들

     ## ❗ Blockers
     - 결정이 필요하거나 막혀있는 항목들
     ```

4. **사용자 확인**
   - 생성된 리포트를 사용자에게 리뷰 요청
