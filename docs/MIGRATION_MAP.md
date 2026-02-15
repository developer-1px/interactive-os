# Migration Map

> 이 문서는 AI가 참조하는 "superseded 패턴 사전"입니다.
> 아래 패턴이 docs에서 발견되면, 해당 문서는 현행이 아닌 과거 방식을 설명하는 것입니다.

## Superseded Patterns

| 과거 패턴 | 현행 대체 | 퇴출일 | 비고 |
|-----------|----------|--------|------|
| `Zustand` / `useStore` / `create()` | `kernel.subscribe` / `kernel.getState` | 2026-02-13 | 상태관리 전면 교체 |
| `createCommandStore` | `createKernel` + `defineCommand` | 2026-02-13 | 커널 패키지로 이관 |
| `CommandRegistry` (class 기반) | `defineCommand` (함수 기반, kernel) | 2026-02-13 | 등록 방식 변경 |
| `AntigravityLogger` | 커널 내장 로깅 / Inspector | 2026-02-13 | 전용 로거 제거됨 |
| `useEngine` / `useCommandCenter` | `kernel.dispatch` / `useKernel` | 2026-02-13 | 훅 API 변경 |
| `FocusSync` (컴포넌트) | `FocusListener` (리스너 패턴) | 2026-02-13 | 컴포넌트→리스너 전환 |
| `Immer` / `produce` | 커널 순수 reducer | 2026-02-13 | 불변성 라이브러리 제거 |
| `Zone` / `Item` / `Field` / `Trigger` (직접 import) | `createWidget` / `createTrigger` (headless) | 2026-02-13 | Headless UI 패턴 도입 |
| `ZIFT` (프레임워크 명칭) | Interactive OS / Kernel | 2026-02-13 | 프로젝트명 변경, 일부 코드에 잔존 |

## 퇴출된 문서 (archive/legacy-docs 브랜치에 보존)

| 원래 경로 | 퇴출 사유 | 한줄평 |
|-----------|-----------|--------|
| `docs/3-resource/00-guides/00-developer-usage.md` | Zustand, CommandRegistry, 구 defineCommand API 기반 | Zustand 시절의 개발 온보딩 가이드 — kernel 도입으로 전면 무효 |
| `docs/3-resource/00-guides/01-app-architecture-usage.md` | createCommandStore, useEngine, Immer 기반 | "Smart Core, Dumb App" 초기 구현 가이드 — 엔진 레이어 자체가 사라짐 |
| `docs/3-resource/00-guides/02-debugging.md` | AntigravityLogger, 구 Inspector 구조 기반 | 커스텀 로거 시절의 디버깅 가이드 — Inspector 전면 재설계됨 |
| `docs/1-project/os-elegance/*` (5 files) | 프로젝트 완료 — Shell UI, dead code 제거, Devtools 분리 등 모두 완료 | OS 시각적 완성도 프로젝트 — 2026-02-14 완료, retrospective 포함 |
| `docs/1-project/focus-recovery/*` (6 files) | 프로젝트 완료 — FocusSync → FocusListener 전환 완료 | DOM 기반 포커스 복구 전략 — FocusListener 패턴으로 전면 교체됨 |
| `docs/1-project/todo-v3-migration/*` (3 files) | 프로젝트 완료 — v3 승격, v1/v2 코드 완전 제거 | Todo 앱 통합 마이그레이션 — defineApp v5 기반으로 완료 |
| `docs/1-project/todo-app/*` (7 files) | 프로젝트 완료 — todo-v3-migration에 흡수 | Todo 앱 초기 PRD/계획 문서들 — defineApp v5에 통합됨 |
