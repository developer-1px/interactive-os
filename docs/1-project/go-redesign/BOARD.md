# go-redesign

## Context

Claim: `/go`를 4-Phase로 재설계하고, OS 통합 런북을 작성해야 한다. 생각 단계를 제거하고, **숙지 → 설계 → 실행 → 검증** 순서를 강제. 모든 앱 개발의 목적은 OS 증명이다.

Before → After:
- Before: `/go`가 22스텝 나열 + 생각 단계 중복 + 만들기 3줄 뭉개기 + OS 숙지 없음 → LLM이 React로 회귀
- After: `/go`가 4-Phase(부팅→숙지→설계→실행+검증) + 각 Phase에 산출물/게이트 명시 + OS 런북으로 매 세션 온보딩

Risks:
- 런북이 너무 길면 매 세션 컨텍스트 소비. 적정 크기 설계 필요
- 기존 `/go` 사용자(워크플로우 참조)에 영향. `/project`와의 인터페이스 재확인 필요

## Now

## Done
- [x] T1: OS 런북 작성 — `docs/official/os/RUNBOOK.md` 186줄. 5단계(defineApp→State→Command→Zone→Widget) + Todo 벤치마크 해부 + Anti-pattern 표 + createOsPage headless 검증 패턴 ✅
- [x] T2: /go 재설계 — `.agent/workflows/go.md` 4-Phase(부팅→숙지→설계→실행+검증). Phase 1에 RUNBOOK.md 읽기 + OS 관점 설계 메모 게이트. Phase 2에 .feature 게이트. Phase 3에 app.ts→widgets 순서 강제 ✅
- [x] T3: /project 인터페이스 조정 — `project.md` 갱신. 프리셋 라우터→Phase 1(숙지) 진입. Heavy/Light가 Phase 2 깊이에 영향 ✅

## Unresolved
- 런북의 적정 크기 (LLM 컨텍스트 예산)
- /go Phase별로 읽어야 할 문서 목록 (고정 vs 태스크에 따라 동적)

## Ideas
- 기존 앱(Todo, Builder, DocsViewer)에서 "OS 증명 패턴" 추출하여 런북에 사례 추가
- /go Phase 1(숙지)에서 KI 자동 검색 연동
