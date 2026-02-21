# BOARD — define-query

## 🔴 Now
(없음)

## ⏳ Done
- [x] T5: query→cofx 브릿지 (2026-02-21) — `07e8bb5`
  - defineQuery가 자동으로 contextProvider 등록, 캐시 공유
  - 2 bridge tests
- [x] T2: `useQuery` React 훅 (2026-02-21) — `6b7143b`
  - useSyncExternalStore 기반, shallow 안정화, invalidateOn 연동
  - 4 unit tests
- [x] T1: `defineQuery` 커널 API 설계 (2026-02-21) — `2e0899a`
  - defineQuery, resolveQuery, QueryToken, invalidateOn
  - 10 unit tests, PRD 12 BDD scenarios

## 💡 Ideas
- ~~T3: BuilderCursor OS 승격~~ — 기각 (BuilderCursor는 앱 레벨)
- T4: 비동기 Query 지원 — 백로그 (당장 사용처 없음)
- Idea: effect 레이어(4-effects) 재평가 — query 도입 후 effect가 정말 예외 경로뿐인지 /doubt
