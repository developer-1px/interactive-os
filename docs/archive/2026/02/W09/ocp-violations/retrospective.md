# ocp-violations — Retrospective

> Date: 2026-02-25
> Duration: ~15min (Red → Green → Builder test sync)

## Session Summary

OCP 위반 22건 중 5건을 Toulmin 분석으로 선별, 4개 태스크(T1~T4)로 수정 완료.
빌더 테스트 13개 파일 failure도 함께 수정 (INITIAL_STATE ID 동기화).

## KPT

### 🔧 Development

| | |
|---|---|
| Keep 🟢 | Toulmin 기반 22→5 정밀 타겟팅. switch→Record 전환으로 측정 가능한 개선 (import -10, 코드 -142줄, 중복 맵 2→1) |
| Problem 🔴 | Red 테스트에서 dynamic import 사용 → Vite 빌드 에러. 구조 테스트에 부적합 |
| Try 🔵 | 구조 테스트(파일 존재/패턴 검증)는 `fs.readFileSync` 사용. dynamic import는 런타임 테스트에만 |

### 🤝 Collaboration

| | |
|---|---|
| Keep 🟢 | 사용자 한 줄 지시("빌더 테스트도 같이 수정하자")로 즉시 스코프 확장 |
| Keep 🟢 | Toulmin 토론으로 합의 도출이 효율적 |

### ⚙️ Workflow

| | |
|---|---|
| Keep 🟢 | Red→Green 사이클이 리팩토링에도 적합. Red 테스트가 정확한 guard |
| Problem 🔴 | "기존 실패" 테스트를 INITIAL_STATE 변경과 연관짓지 못함 |
| Try 🔵 | 깨진 테스트 분류 시 data model 변경 연관성 확인 (습관, 절차 추가 불필요) |

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Block registries | 2 (BLOCK_COMPONENTS + TAB_PANEL_RENDERERS) | 1 (BLOCK_REGISTRY) |
| switch statements (OCP targets) | 3 (UnifiedInspector, CommandInspector, QuickPick) | 0 |
| Test files passing | 84 | 97 |
| Individual tests passing | 1041 | 1071 |
