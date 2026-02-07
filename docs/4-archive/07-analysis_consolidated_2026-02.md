# Analysis Documents Consolidated Archive (2026-02)

> **Note**: This is a consolidated archive of analysis documents from `docs/3-resource/analysis/`.
> These documents represent historical research and decisions made during the development of the Antigravity OS focus and navigation systems.

---

## Table of Contents
1. [Command Architecture Critique](#1-command-architecture-critique)
2. [Navigation Policy: Macro vs Micro](#2-navigation-policy-macro-vs-micro)
3. [Focus Navigation Failure Report](#3-focus-navigation-failure-report)
4. [Todo App Focus Responsibility Analysis](#4-todo-app-focus-responsibility-analysis)
5. [TodoAppShell Structure Analysis](#5-todoappshell-structure-analysis)
6. [Todo App Manual Logic Audit](#6-todo-app-manual-logic-audit)
7. [OS Code Structure Review](#7-os-code-structure-review)
8. [App Lifecycle Architecture](#8-app-lifecycle-architecture)
9. [Navigation Refactoring Proposal](#9-navigation-refactoring-proposal)

---

## 1. Command Architecture Critique
**Date**: 2026-02-03

### Summary
중앙 집중형 커맨드 등록 구조(`commands/index.ts`)의 문제점 분석:
- Dead Code 추적 불가
- Zone 계층 vs Flat Merge 모순
- **결론**: "Mount-Based Discovery" 패턴으로 전환 제안

---

## 2. Navigation Policy: Macro vs Micro
**Date**: 2026-02-03

### Summary
두 가지 내비게이션 레벨 구분:
- **Macro Navigation**: 아이템/Zone 간 이동 (포커스 변경)
- **Micro Navigation**: 위젯 내부 이동 (Autocomplete 등, 포커스 유지)
- **Trap Pattern**: `stopPropagation()`으로 위젯 레벨에서 이벤트 가로채기

---

## 3. Focus Navigation Failure Report
**Date**: 2026-02-03

### Summary
Field에서 ArrowUp/Down 버블링 시 InputEngine이 차단하는 문제:
- `isInput && !allowInInput` 가드가 원인
- **해결책**: InputEngine의 isInput 가드 제거, Natural Focus 모델 채택

---

## 4. Todo App Focus Responsibility Analysis
**Date**: 2026-02-03

### Summary
앱이 OS 책임을 침범하는 파일들 분석:
- `focus_utils.ts`: 범용 내비게이션 연산 중복
- `focus_rules.ts`: 수동 포커스 무결성 관리
- `focusStrategies.ts`: 병렬 전략 레지스트리
- **원칙 위반**: "Smart Core, Dumb App"

---

## 5. TodoAppShell Structure Analysis
**Date**: 2026-02-03

### Summary
TodoAppShell의 구조적 문제점:
- God Component 증상 (Infrastructure + Layout + Feature 혼합)
- Inspector 위치의 부자연스러움
- Zone 계층 구조의 강제성
- **제안**: Provider와 Layout 분리

---

## 6. Todo App Manual Logic Audit
**Date**: 2026-02-03

### Summary
앱 내 OS 책임 중복 발견:
- Manual Persistence (`localStorage` 직접 사용)
- Manual Undo/Redo (History 배열 직접 조작)
- Global 단축키 중복 정의 (Meta+z, Meta+i)
- 표준 Navigation 키 불필요한 바인딩

---

## 7. OS Code Structure Review
**Date**: 2026-02-04

### Summary
`src/os/` 코드 전체 검수:

**강점**:
- 단일 입력 엔진 (InputEngine)
- Active Registration 시스템
- 선언적 Zone 컴포넌트

**개선 필요**:
- Field.tsx 복잡도 (319줄)
- Navigation 함수 하드코딩
- osRegistry Navigate 복잡도
- 타입 any 남용

---

## 8. App Lifecycle Architecture
**Date**: 2026-02-03

### Summary
Antigravity Standard 아키텍처:
- **Definition Layer**: Model, Commands, Keymap
- **Engine Layer**: createCommandStore, Middleware
- **View Layer**: useTodoEngine, Context Mapping

**진화 방향**:
| Feature | Old (v1-v3) | New (v4) |
|---------|-------------|----------|
| Persistence | Manual saveState() | Store Config |
| Undo/Redo | Manual History | OS Command Store |
| Focus | App patches | OS Zone system |

---

## 9. Navigation Refactoring Proposal
**Date**: 2026-02

### Summary
"Natural Focus" 아키텍처 제안:
- Meta+Arrow 바인딩 제거
- allowInInput 개념 제거
- Event Propagation Chain에 의존
- **핵심**: 이벤트가 InputEngine에 도달 = 하위가 처리 안 함 = OS가 처리해도 됨

---

*Archived: 2026-02-04*
*Original Location: docs/3-resource/analysis/*
