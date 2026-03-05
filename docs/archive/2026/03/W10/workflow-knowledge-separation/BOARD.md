# workflow-knowledge-separation

## Context

Claim: 📝 Knowledge 누적을 /discussion 전유물이 아닌 **모든 워크플로우의 공통 미들웨어**로 만들고, XBOOK(워크플로우별 1:1)을 **토픽 기반 지식 파일**로 전환하면, 워크플로우가 프로젝트 간 이식 가능하면서 Pit of Success를 유지한다.

Before → After:
- Before: 워크플로우 본문에 도메인 지식 하드코딩 (OS API 예시, grep 패턴, 금지 목록). 지식 축적은 /discussion에 병목.
- After: 워크플로우 = 범용 절차 (Slot 패턴). Knowledge = 토픽 기반 독립 파일. 모든 워크플로우에서 지식 축적 가능.

Risks: 범용화로 Pit of Success 약화 가능. Slot이 너무 추상적이면 에이전트가 "뭘 해야 하지?" 상태에 빠짐.

## Now

## Done

- [x] T1: 공통 미들웨어 규약 작성 — `workflows/_middleware.md` 생성 ✅
- [x] T2: Knowledge 토픽 재분류 — 토픽 파일 3개 생성 (`testing-hazards.md`, `testing-tools.md`, `contract-checklist.md`) ✅
- [x] T3: 실행 워크플로우 Slot 패턴 적용 — `/red`, `/green`, `/bind`, `/audit` 4개 워크플로우 수정 ✅
- [x] T4: `/knowledge` 워크플로우 범용 확장 — 입력을 /discussion 전용 → 모든 워크플로우로 확장 ✅

## Unresolved

- `apg`, `ready`, `perf`는 도메인 전용으로 유지

## Ideas

- 워크플로우 YAML frontmatter에 `topics: [testing-hazards, contract-checklist]` 선언
- `_index.md` (MOC) 인덱스 파일로 토픽 진입점 제공
- 약한 하드코딩 워크플로우 5개(go, refactor, rework, coverage, stories) 추가 Slot화
