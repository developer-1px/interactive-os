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

## 아카이브된 문서

### 냉장 보관 (`docs/4-archive/` — 원본 열람 가능)

| 현재 경로 | 원래 경로 | 아카이브 사유 |
|-----------|-----------|--------------|
| `4-archive/2026-02-command-palette-e2e/` | `1-project/command-palette-e2e/` | 프로젝트 완료 — E2E 테스트 8/8, asChild 버그 수정, useComputed 성능 최적화 |
| `4-archive/2026-02-fix-tab-navigation/` | `1-project/fix-tab-navigation/` | 프로젝트 완료 — Tab escape/flow 모드 수정, E2E 검증 |
| `4-archive/2026-02-docs-system-v2/` | `1-project/docs-system-v2/` | 프로젝트 완료 — PARA 구조 정착, 워크플로우 12개 리팩토링 |
| `4-archive/2026-02-os-elegance/` | `1-project/os-elegance/` | 프로젝트 완료 — Shell UI, dead code 제거, Devtools 분리 등 |
| `4-archive/2026-02-focus-recovery/` | `1-project/focus-recovery/` | 프로젝트 완료 — FocusSync → FocusListener 전환 완료 |
| `4-archive/2026-02-todo-v3-migration/` | `1-project/todo-v3-migration/` | 프로젝트 완료 — v3 승격, v1/v2 코드 완전 제거 |
| `4-archive/2026-02-todo-app/` | `1-project/todo-app/` | 프로젝트 완료 — todo-v3-migration에 흡수 |

### 심층 보관 (`archive/legacy-docs` 브랜치 — git으로만 접근)

```bash
# 복원 방법
git show archive/legacy-docs:docs/path/to/file.md
```

| 원래 경로 | 퇴출 사유 | 퇴출일 |
|-----------|-----------|--------|
| `docs/3-resource/00-guides/00-developer-usage.md` | Zustand, CommandRegistry, 구 defineCommand API 기반 — kernel 도입으로 전면 무효 | 02-13 |
| `docs/3-resource/00-guides/01-app-architecture-usage.md` | createCommandStore, useEngine, Immer 기반 — 엔진 레이어 자체 소멸 | 02-13 |
| `docs/3-resource/00-guides/02-debugging.md` | AntigravityLogger, 구 Inspector 구조 기반 — Inspector 전면 재설계됨 | 02-13 |
| `docs/3-resource/02-analysis-reports/2026-02-12-mo-s-co-w-folder-structure-report.md` | `os-new/`, `packages/surface/`, `TestBot shim` 기반 스냅샷 — 모두 소멸 | 02-20 |
| `docs/3-resource/02-analysis-reports/2026-0212-2204-[report]-onboarding-essential-knowledge.md` | `window.__TESTBOT__`, `os-new/`, `AntigravityOS.tsx` 기반 — 현행 구조와 전면 불일치 | 02-20 |
| `docs/3-resource/02-analysis-reports/2026-0212-2138-[report]-divide-workflow-retro.md` | `TestBot` API 기반 회고 — TestBot 소멸로 무효 | 02-20 |
| `docs/3-resource/04-architecture/2026-02-12-1200-os-structure.md` | `os-new/` 폴더 구조 확정 기록 — 결론 적용 완료, 여행 기록 가치 소멸 | 02-20 |
| `docs/3-resource/04-architecture/2026-0213-2215-headless-zone.md` | `Widget`, `packages/surface/`, `OS.Zone` 기반 — defineApp/ZIFT로 진화 완료 | 02-20 |
| `docs/10-devnote/` (7파일) | 2026-02-10~13 일일 개발 일지 — 일회성 스냅샷, 지식 없음 | 02-20 |
| `docs/3-resource/09-project-meta/2026-0212-1324-[report]-os-codebase-status.md` | 2월 12일 전체 코드베이스 스냅샷 — `os-new/`, `surface/`, `testbot/` 등 소멸된 구조 기술 | 02-20 |
| `docs/3-resource/09-project-meta/2026-0212-1350-[report]-workflow-quality-assessment.md` | 17개 워크플로우 평가 — 현행 30+개와 불일치, `/daily`/`/til`/`/next` 등 소멸됨 | 02-20 |
| `docs/3-resource/09-project-meta/workflow-manual.md` | 워크플로우 연대기 (23개 기준) — 현행 워크플로우 생태계와 불일치, TestBot 포함 | 02-20 |
| `docs/3-resource/05-reviews/2026-0216-2104-[report]-os-code-review.md` | `src/os/` 코드 리뷰 — `src/os/` 자체가 삭제되어 대상 파일 없음 | 02-20 |

