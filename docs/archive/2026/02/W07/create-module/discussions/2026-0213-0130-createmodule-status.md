# Discussion Journey: createModule 프로젝트 현황 점검

## 주제 발견

**🧑 사용자**: createModule 하던거 어떻게 되었나 봐바

**🤖 AI**: 프로젝트 문서(5-status.md) 확인 결과, Discussion/PRD/KPI/Proposal까지 완료되었으나 "PROPOSAL 리뷰" 이후 체크리스트가 전부 미완. 코드 착수 전에 멈춘 것으로 보임.

---

## 반전: 코드는 이미 존재

**🤖 AI**: 그런데 `createModule.ts` (225줄), `TodoModule` (300줄, 12개 커맨드 + 5개 셀렉터), `todo.module.test.ts` (329줄, 17개 테스트)가 이미 존재. 상태 문서와 현실이 괴리.

**🧑 사용자**: 하다가 말았나보네

**🤖 AI**: 테스트 21개 전부 pass (21ms). "하다가 말았다"보다 "거의 다 했는데 문서 업데이트를 안 했다"에 가까움. 남은 문제: todoSlice와 TodoModule 이중 등록, 핸들러 중복.

---

## As-Is / To-Be 비교

**🧑 사용자**: 1번 그리고 실제로 todo 앱을 바꿔보면서 as-is / to-be를 비교하는거지

**🤖 AI**: 비교 결과:
- Import: 16개 → 1개 (-95%)
- Setup 보일러플레이트: 13줄 → 0줄 (-100%)
- 전체 줄 수: 383 → 329 (-14%)
- `any` 사용 제거

단, module.ts에 `effects.push`와 `FIELD_START_EDIT` dispatch가 빠져 있다고 지적.

---

## 핵심 교정

**🧑 사용자**: draft.effects.push 이거 없어진 스펙인데 아직 모르나보다

**🤖 AI**: 내 지적이 틀렸음을 인정. `effects.push`가 폐기 스펙이라면:
- module.ts가 불완전한 게 아니라 **레거시를 정리한 클린 버전**
- list.ts가 오히려 **폐기된 패턴을 품고 있는 레거시**

**🧑 사용자**: FIELD쪽은 아예 시작안했어

---

## 결론 및 다음 액션

**🧑 사용자**: 디스커션 닫고 createModule이 잘되나 진짜로 확인해보자. /todo 라우터에 새버전을 만들어서 테스트봇 연동해줘.

→ TodoModule 기반 새 Todo 페이지를 /todo에 생성, TestBot + E2E 병렬 검증 후 구 코드 삭제.

---

**한 줄 요약**: createModule은 "미착수"가 아니라 "거의 완성 + 문서 미갱신" — module.ts가 레거시 정리된 클린 정본이며, 실제 라우트에 올려 검증하는 것이 다음 단계로 확정됨.


---

# Discussion Conclusion: createModule 프로젝트 현황 점검

## Why

createModule 프로젝트가 "하다가 말았는지" 현황을 파악하고, 다음 행동을 결정해야 한다.

## Intent

createModule 기반 TodoModule이 프로덕션 정본이 될 수 있는지 확인하고, 구 코드(todoSlice + 분산 커맨드) 삭제 방향을 확정한다.

## Warrant 전체 구조

| # | Warrant |
|---|---------|
| W1 | Discussion 27개 Warrant → "Application Framework 필요" 결론 완료 |
| W2 | PRD/KPI/Proposal 설계 문서 완성 |
| W3 | 상태 문서는 "미착수"이나 실제 코드는 거의 완성 (문서-현실 괴리) |
| W4 | createModule.ts (225줄) + TodoModule (300줄) + 테스트 21개 전부 pass |
| W5 | todoSlice 사용처 50개+ — 프로덕션 마이그레이션 미시작 |
| W6 | module.ts에 없는 커맨드: clipboard(3), history(2), category move(3) |
| W7 | 방향 확정: TodoModule = 정본, 구 코드(todoSlice + list.ts 등) 삭제 |
| W8 | `effects.push`는 폐기 스펙 — list.ts가 레거시를 품고 있는 쪽, module.ts가 클린 버전 |
| W9 | FIELD 시스템은 아예 미착수 — createModule과 별개 프로젝트 |

## 결정 사항

1. **TodoModule이 정본** — createModule 기반으로 전면 마이그레이션
2. **검증 방법**: /todo 라우트에 TodoModule 기반 새 버전 생성, TestBot + E2E로 병렬 검증
3. **구 코드 삭제**: 검증 통과 후 todoSlice + 분산 커맨드 파일 제거

## 다음 액션

- /todo 라우트에 TodoModule 기반 새 페이지 생성
- TestBot 연동하여 브라우저 테스트 가능하게
- E2E 테스트로 동작 검증
- 검증 완료 후 구 코드 삭제 + 위젯 마이그레이션

---

**한 줄 요약**: createModule은 이미 동작하고 테스트도 pass한다 — 새 버전을 실제 라우트에 올려 TestBot+E2E로 검증한 뒤 구 코드를 삭제하는 것이 다음 단계다.
