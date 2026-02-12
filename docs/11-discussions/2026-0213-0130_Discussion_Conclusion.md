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
