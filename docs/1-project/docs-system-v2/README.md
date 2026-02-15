# docs-system-v2

> Discussion을 유일한 진입점으로, Project를 전략적 컨테이너로 격상하고,
> BOARD.md + Backlog + 5갈래 라우팅으로 문서의 과잉 프로젝트화 문제를 구조적으로 해소한다.

## Why

현재 docs & workflow 시스템은 PARA+ 방법론과 33개 워크플로우로 구성된 정교한 세컨드 브레인이지만, **프로젝트의 단위 불일치** 문제가 있다.

- `/project`가 모든 작업에 Heavy 프로세스(PRD, KPI, Proposal)를 요구
- Discussion → 새 프로젝트라는 **단일 경로**만 존재
- 작은 작업도 독립 프로젝트로 분기, Discussion은 `11-discussions/`에 25개 체류

## Goals

1. **Project = 전략적 컨테이너** (Epic 수준). BOARD.md로 경량 태스크 관리.
2. **Discussion = 유일한 진입점**, 5갈래 출구 (기존PJ Task / 기존PJ Discussion / 새PJ / Resource / Backlog)
3. **`5-backlog/` 신설** — "뭐하지?" 대기열, Discussion으로 복귀하는 순환점
4. **`11-discussions/` 폐지** — Discussion은 태어나자마자 귀속지 결정
5. **7개 워크플로우 업데이트** — `/discussion`, `/project`, `/para`, `/status`, `/issue`, `/inbox`, `/archive`

## Scope

### In
- docs 폴더 구조 재설계
- 워크플로우 파일 업데이트 (7개)
- 기존 `11-discussions/` 25개 → 마이그레이션

### Out
- 코드 변경 없음 (순수 문서/워크플로우 작업)
- Docs Viewer UI 변경 없음
- 기존 `2-area/`, `3-resource/` 내부 재구조화 (별도 프로젝트)

## 확정 구조

```
docs/
├── 0-inbox/         빠르게 비우는 임시 착지
├── 0-issue/         버그/단순수정 스테이징
│   └── closed/
├── 1-project/       전략적 컨테이너 (Epic 수준)
│   └── [name]/
│       ├── README.md       WHY + 목표
│       ├── BOARD.md        Now / Done / Ideas
│       ├── discussions/    사고 기록 누적
│       └── notes/          참고 자료
├── 2-area/          지속적 관심 영역
├── 3-resource/      참고 자료, 읽을거리, 공부
├── 4-archive/       완료된 프로젝트 통째로
├── 5-backlog/       "뭐하지?" 대기열
├── 10-devnote/      daily, til (성찰 레이어)
├── STATUS.md        Single Source of Truth
└── MIGRATION_MAP.md 과거 패턴 사전
```
