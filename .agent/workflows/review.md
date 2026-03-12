---
description: 코드 전수 품질 점검이 필요할 때 사용. /audit(OS 계약 grep) → /doubt(감산 필터)를 순차 실행하는 복합 워크플로우.
---

## /review = /audit + /doubt

> `/review`는 독립 워크플로우가 아니다.
> `/audit`(OS 계약 위반 기계적 검사) + `/doubt`(불필요한 것 제거)를 순차 실행한다.

### 절차

1. `/audit` 실행 — OS 계약 위반 전수 검사 (grep 기반)
2. `/doubt` 실행 — 대상 범위에서 불필요한 것 제거 (필터 체인 + Chesterton's Fence)

### 역사

2026-03-02: `/review`의 체크리스트가 다른 워크플로우와 중복됨을 확인.
- 철학 준수 → `/audit`
- 코드 품질 → `/doubt`
- 성능 → `/perf`
- 네이밍 → `/naming`

독립 정체성이 없으므로 `/audit` + `/doubt` 조합으로 대체.
