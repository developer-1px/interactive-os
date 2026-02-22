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
| `OS_SELECTION_SET/ADD/REMOVE/TOGGLE` | `OS_SELECT(mode: "toggle"\|"range"\|"single"\|"replace")` | 2026-02-22 | 앱 사용 0건. OS_SELECT 하나로 통합 |
| `null as unknown as HTMLElement` (ZoneEntry.element) | `element?: HTMLElement \| null` (optional) | 2026-02-22 | headless 환경 지원 |
| DOM querySelectorAll → 구조 정보 역추적 | Zone accessor (`getItems`, `getExpandableItems`, `getTreeLevels`) 우선 | 2026-02-22 | Accessor-first pattern. DOM은 geometry만 |
| 수동 focus recovery (remove/cut에서 OS_FOCUS) | OS 자동 resolve (`resolveItemFallback`) | 2026-02-22 | 68행 → 0행 |
| `field/field.ts` (3 commands 합본) | `startEdit.ts`, `commit.ts`, `cancel.ts` (1 command = 1 file) | 2026-02-22 | 파일:컨셉 1:1 매핑 |
| `clipboard/clipboard.ts` (3 commands 합본) | `copy.ts`, `cut.ts`, `paste.ts` (1 command = 1 file) | 2026-02-22 | 파일:컨셉 1:1 매핑 |
| F2 → OS_FIELD_START_EDIT (keybinding) | F2 → OS_ACTIVATE → onAction (앱 결정) | 2026-02-22 | 표준 OS 패턴: F2는 활성화, 앱이 편집 결정 |
| Config 7파일 분산 정의 | `FocusGroupConfig.ts` 단일 진실 원천 (나머지 re-export) | 2026-02-22 | 정의 위치 통합 |

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
| `archive/2026/02/W09/kernel-items/` | `1-project/kernel-items/` | 프로젝트 완료 — DOM context → accessor-first, focus recovery 자동화, 1:1 파일 분리 |
| `archive/2026/02/W09/os-api-rename/` | `1-project/os-api-rename/` | 프로젝트 완료 — kernel→os rename, OS_ 접두어 통일, SELECTION_* 통합 |
| `archive/2026/02/W09/apg-contract-testing/` | `1-project/apg-contract-testing/` | 프로젝트 완료 — APG contract test 체계 구축 |
| `archive/2026/02/W09/apg-testing-rebalance/` | `1-project/apg-testing-rebalance/` | 프로젝트 완료 — APG 테스트 pressKey/attrs 패턴 전환 |
| `archive/2026/02/W09/builder-clipboard/` | `1-project/builder-clipboard/` | 프로젝트 완료 — Builder clipboard 통합 |
| `archive/2026/02/W09/builder-usage-cleanup/` | `1-project/builder-usage-cleanup/` | 프로젝트 완료 — Builder dead code/usage 정리 |
| `archive/2026/02/W09/define-query/` | `1-project/define-query/` | 프로젝트 완료 — defineQuery API 구현 |
| `archive/2026/02/W09/defineapp-unification/` | `1-project/defineapp-unification/` | 프로젝트 완료 — defineApp 통합 |
| `archive/2026/02/W09/field-compound/` | `1-project/field-compound/` | 프로젝트 완료 — Field compound 패턴 구현 |
| `archive/2026/02/W09/focus-single-path/` | `1-project/focus-single-path/` | 프로젝트 완료 — Focus 단일 경로 통합 |
| `archive/2026/02/W09/os-collection/` | `1-project/os-collection/` | 프로젝트 완료 — Collection facade 구현 |
| `archive/2026/02/W09/os-hygiene/` | `1-project/os-hygiene/` | 프로젝트 완료 — OS 코드 위생 정리 |
| `archive/2026/02/W09/os-page/` | `1-project/os-page/` | 프로젝트 완료 — OS Page 헤드리스 테스트 인프라 |
| `archive/2026/02/W09/projection-checkpoint/` | `1-project/projection-checkpoint/` | 프로젝트 완료 — Projection 체크포인트 |
| `archive/2026/02/W09/todo-dogfooding/` | `1-project/todo-dogfooding/` | 프로젝트 완료 — Todo 앱 독푸딩 완료 |
| `archive/2026/02/W09/01-naming-convention.md` | `2-area/80-cross-cutting/82-standards/01-naming-convention.md` | 🪦 superseded — `os-new/`, Zustand, Sensor/Intent 패턴 전면 소멸 |
| `archive/2026/02/W09/08-focus-recovery.md` | `2-area/20-os/22-focus/08-focus-recovery.md` | 🪦 superseded — FocusSync, resolveRecovery 소멸. 현행: resolveItemFallback in focusStackOps.ts |

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
| `docs/3-resource/09-project-meta/2026-0212-1402-[analysis]-mermaid-rendering-failure.md` | mermaid 렌더링 버그 분석 — `docviewer-mermaid-error` 이슈 닫힘 (02-19), 역사 기록 | 02-20 |

