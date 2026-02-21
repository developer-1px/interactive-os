# BOARD — define-query

## 🔴 Now
- [ ] T1: `defineQuery` 커널 API 설계
  - [x] Step 1: /ready — tsc 0 errors, 797 tests pass
  - [x] Step 2: /discussion — 21개 Warrant 도출, W17-W21 핵심
  - [x] Step 3: /prd — 4기능, 12 BDD 시나리오, 5상태
  - [x] Step 4: /naming — defineQuery, QueryToken, useQuery, QueryResult, invalidateOn
  - [x] Step 5: /tdd — 10 BDD tests (Red confirmed)
  - [x] Step 6: /solve — defineQuery + resolveQuery + QueryToken 구현 (807 tests green)
  - [ ] Step 7: /verify    ← 다음 재개 지점

## ⏳ Done
(없음)

## 💡 Ideas
- T2: DOM Query 구현 — `useFocusedRect()`, `useItemRect()` 등 OS 편의 훅
- T3: BuilderCursor OS 승격 — 280줄 앱 코드 → OS `<FocusCursor />` 컴포넌트
- T4: 비동기 Query 지원 — HTTP/WebSocket 데이터 소스
- T5: `defineContext`(cofx)와 `defineQuery` 관계 정리 — 같은 provider 재사용 가능?
- Idea: effect 레이어(4-effects) 재평가 — query 도입 후 effect가 정말 예외 경로뿐인지 /doubt
