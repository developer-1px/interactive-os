# BOARD — define-query

## 🔴 Now
(없음 — T2 승격 대기)

## ⏳ Done
- [x] T1: `defineQuery` 커널 API 설계 (2026-02-21) — `2e0899a`
  - defineQuery, resolveQuery, QueryToken, invalidateOn
  - 10 unit tests, PRD 12 BDD scenarios

## 💡 Ideas
- T2: DOM Query 구현 — `useFocusedRect()`, `useItemRect()` 등 OS 편의 훅
- T3: BuilderCursor OS 승격 — 280줄 앱 코드 → OS `<FocusCursor />` 컴포넌트
- T4: 비동기 Query 지원 — HTTP/WebSocket 데이터 소스
- T5: `defineContext`(cofx)와 `defineQuery` 관계 정리 — 같은 provider 재사용 가능?
- Idea: effect 레이어(4-effects) 재평가 — query 도입 후 effect가 정말 예외 경로뿐인지 /doubt
