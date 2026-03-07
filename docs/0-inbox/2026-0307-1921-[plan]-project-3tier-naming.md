# Plan: Project 3-Tier Structure + Naming Convention

> 작성일: 2026-03-07
> 트리거: /discussion Clear — K1(epic 이름 통일) + K2(3계층 구조)

## Context

- **K1**: epic 이름 = 코드 canonical name (kebab-case). 문서/프로젝트/FEATURES 모두 통일.
- **K2**: `docs/1-project/` = domain > epic > project 3계층. depth 1~2 고정, depth 3 아카이브 대상.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `working-standards.md` Rule 17 | "프로젝트는 도메인에 귀속" (2계층만 기술) | Rule 17 갱신: domain > epic > project 3계층 + epic naming rule | Clear | — | 읽어서 확인 | 기존 워크플로우 경로 가정 |
| 2 | `testing/headless-simulator/` 폴더 | `testing/headless-simulator/BOARD.md` | `testing/headless-page/headless-simulator/BOARD.md` | Clear | #1 | ls + 상대경로 확인 | notes/, discussions/ 함께 이동 |
| 3 | `concept-map.md` line 142 | `TestPage` | `HeadlessPage` | Clear | — | grep | — |
| 4 | `MEMORY.md` Project Organization | 2계층 설명 | 3계층 설명으로 갱신 | Clear | #1 | 읽어서 확인 | — |
| 5 | `/status` 실행 | STATUS.md 옛 경로 | 재생성 | Clear | #2 | diff 확인 | — |

## 라우팅

승인 후 → /go (기존 프로젝트: testing/headless-simulator, Meta 태스크) — 문서/구조 변경만, 코드 수정 없음
