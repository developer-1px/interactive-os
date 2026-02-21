# BOARD — define-query

## 🔴 Now
- [ ] T2: `useQuery` React 훅 — defineQuery의 컴포넌트용 구독 인터페이스
  - [ ] Step 8: /tdd     ← 다음 재개 지점
  - [ ] Step 9: /solve

## ⏳ Done
- [x] T1: `defineQuery` 커널 API 설계 (2026-02-21) — `2e0899a`
  - defineQuery, resolveQuery, QueryToken, invalidateOn
  - 10 unit tests, PRD 12 BDD scenarios

## 💡 Ideas
- T3: BuilderCursor OS 승격 — 280줄 앱 코드 → OS `<FocusCursor />` 컴포넌트
- T4: 비동기 Query 지원 — HTTP/WebSocket 데이터 소스
- T5: `defineContext`(cofx)와 `defineQuery` 관계 정리 — 같은 provider 재사용 가능?
- Idea: effect 레이어(4-effects) 재평가 — query 도입 후 effect가 정말 예외 경로뿐인지 /doubt
