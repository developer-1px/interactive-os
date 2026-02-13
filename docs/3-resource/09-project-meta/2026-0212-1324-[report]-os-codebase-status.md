# Interactive-OS 코드베이스 현황판

> **작성일**: 2026-02-12  
> **분석 범위**: `src/`, `packages/`, `e2e/`, `docs/`

---

## 1. 개요 (Overview)

Interactive-OS는 **브라우저 기반 OS 시뮬레이션 프레임워크**로, 커널 중심의 커맨드-디스패치 아키텍처 위에 선언적 UI 프리미티브들을 제공합니다.

| 항목 | 수치 |
|---|---|
| **총 TS/TSX 파일** | 265개 (src: 241, packages: 24) |
| **총 코드 라인** | ~28,540줄 (src: 25,854 / packages: 2,686) |
| **OS 코어 (`os-new`)** | 96 파일 / 7,064줄 |
| **커널 엔진 (`createKernel.ts`)** | 604줄 |
| **앱** | 2개 (Todo, Builder) |
| **E2E 테스트 스위트** | 4개 (aria-showcase, builder, focus-showcase, smoke) |

### 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | TanStack Router |
| Styling | Tailwind CSS 4 |
| State | Custom Kernel (Zustand-style closures) |
| Testing | Playwright E2E |
| Linting | Biome + ESLint |
| Language | TypeScript 5.9 |

---

## 2. 아키텍처 구조

### 2.1 레이어 맵

```
┌─────────────────────────────────────────────────────┐
│  Apps (Todo, Builder)                                │
├─────────────────────────────────────────────────────┤
│  Pages (TodoPage, BuilderPage, DocsPage, KernelLab) │
├─────────────────────────────────────────────────────┤
│  OS Layer (src/os-new)                               │
│  ┌───────────────────────────────────────────────┐   │
│  │  6-components  UI 프리미티브                   │   │
│  │  5-hooks       React 커스텀 훅                 │   │
│  │  4-effects     사이드이펙트 핸들러             │   │
│  │  3-commands    커맨드 핸들러 (14개 모듈)       │   │
│  │  2-contexts    컨텍스트 정의                   │   │
│  │  1-listeners   이벤트 리스너 (3개)             │   │
│  │  schema/       타입·설정·도메인 스키마         │   │
│  │  middleware/    히스토리 미들웨어               │   │
│  │  keymaps/      키맵 설정                       │   │
│  │  registry/     존 레지스트리                   │   │
│  └───────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Kernel (packages/kernel) — 604줄                    │
│  ┌───────────────────────────────────────────────┐   │
│  │  createKernel: State, Dispatch, Effects,       │   │
│  │  Scoping (StateLens), Middleware Pipeline,      │   │
│  │  Transaction Recording + Time Travel,           │   │
│  │  React useSyncExternalStore binding             │   │
│  └───────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Surface (packages/surface)                          │
│  layout, theme, tokens, typography, reset, lint      │
└─────────────────────────────────────────────────────┘
```

### 2.2 커널 핵심 기능

| 기능 | 설명 |
|---|---|
| `createKernel()` | Zustand-style 클로저 기반 커널 팩토리 |
| `dispatch()` | 커맨드 디스패치 + 버블 패스 라우팅 |
| `processCommand()` | 핸들러 매칭 + 미들웨어 파이프라인 실행 |
| `StateLens` | 스코프별 상태 격리 (소유권 스코핑) |
| `defineContext()` | DI 컨텍스트 토큰 정의 |
| `defineEffect()` | 사이드이펙트 핸들러 등록 |
| `recordTransaction()` | 트랜잭션 기록 + 타임트래블 |
| `useComputed()` | React 선택적 구독 훅 |
| `registerMiddleware()` | 미들웨어 체인 등록 |
| `group()` / `createGroup()` | 스코프 기반 커맨드 그룹 |

### 2.3 OS 프리미티브 (`AntigravityOS.tsx`)

| 프리미티브 | 역할 |
|---|---|
| `OS.Root` | OS 루트 컨테이너 |
| `OS.Zone` | 포커스 존 (FocusGroup) |
| `OS.Item` | 포커스 가능한 아이템 |
| `OS.Field` | 입력 필드 (8KB — 가장 복잡한 프리미티브) |
| `OS.Trigger` | 클릭/키보드 액션 트리거 (13KB) |
| `OS.Modal` | 모달 다이얼로그 |
| `OS.Dialog` | HTML dialog 기반 래퍼 |
| `OS.Kbd` | 키보드 단축키 표시 |

### 2.4 커맨드 시스템

```
commands/
├── activate.ts      OS_ACTIVATE — 아이템 활성화
├── escape.ts        OS_ESCAPE — 포커스 해제/오버레이 닫기
├── field.ts         OS_FIELD_* — 필드 편집 커맨드
├── focus.ts         OS_FOCUS — 포커스 이동
├── navigate/        OS_NAVIGATE_* — 방향 탐색 (6개 하위 모듈)
├── expand/          OS_EXPAND — 트리 확장/축소
├── overlay.ts       OVERLAY_* — 오버레이 열기/닫기
├── recover.ts       OS_RECOVER — 포커스 복구
├── select.ts        OS_SELECT — 단일 선택
├── selection.ts     OS_SELECTION_* — 다중 선택
├── stack.ts         STACK_* — 포커스 스택 관리
├── syncFocus.ts     DOM 포커스 동기화
└── tab.ts           OS_TAB — 탭 네비게이션
```

### 2.5 리스너

| 리스너 | 크기 | 역할 |
|---|---|---|
| `FocusListener` | 8.2KB | DOM focus/blur 이벤트 → 커널 커맨드 |
| `KeyboardListener` | 2.1KB | 키보드 이벤트 → 키맵 매칭 → 디스패치 |
| `ClipboardListener` | 1.7KB | 복사/붙여넣기 이벤트 처리 |

---

## 3. 앱 현황

### Todo App (`src/apps/todo`)

```
todo/
├── app.ts          앱 슬라이스 등록
├── bridge/         OS ↔ Todo 브릿지 (커맨드 매핑)
├── features/       기능 모듈 (8개 하위)
├── logic/          비즈니스 로직
├── model/          도메인 모델 (2개)
├── tests/          테스트
└── widgets/        UI 위젯 (7개)
```

- `registerAppSlice()`로 커널에 상태 등록
- 스코프 기반 상태 격리 (StateLens)
- 퍼시스턴스 미들웨어로 LocalStorage 연동

### Builder App (`src/apps/builder`)

```
builder/
└── primitives/     프리미티브 컴포넌트 (7개)
```

- 초기 단계 — 프리미티브 컴포넌트만 존재

---

## 4. 인프라 & 도구

### Inspector (`src/inspector`)

| 모듈 | 파일 수 | 역할 |
|---|---|---|
| `panels/` | 13 | 인스펙터 패널 UI |
| `testbot/` | 33 | E2E 테스트 자동화 봇 |
| `stores/` | 6 | 인스펙터 상태 관리 |
| `shell/` | 3 | 인스펙터 셸 UI |

### E2E 테스트 (`e2e/`)

| 스위트 | 파일 수 | 대상 |
|---|---|---|
| `aria-showcase/` | 9 | ARIA 접근성 패턴 검증 |
| `builder/` | 1 | 빌더 앱 |
| `focus-showcase/` | 1 | 포커스 탐색 |
| `smoke.spec.ts` | 1 | 기본 스모크 테스트 |

### 기타

| 모듈 | 역할 |
|---|---|
| `command-palette/` | 커맨드 팔레트 UI (5개 파일) |
| `docs-viewer/` | 독립 Markdown 뷰어 (3개 파일) |
| `vite-plugins/` | 커스텀 Vite 플러그인 (8개 파일) |

---

## 5. 문서 현황 (PARA)

### Projects (`docs/1-project/`) — 8개 프로젝트

| 프로젝트 | 파일 수 | 상태 |
|---|---|---|
| `os-core-refactoring` | 15 | 🔥 적극 진행 중 |
| `focus-recovery` | 5 | 진행 중 |
| `focus-showcase` | 1 | 진행 중 |
| `todo-app` | 2 | 진행 중 |
| `stream-inspector` | 3 | 진행 중 |
| `tanstack-router` | 3 | 진행 중 |
| `runner-architecture` | 1 | 초기 단계 |
| `command-palette` | 0 | 빈 프로젝트 |

### Areas (`docs/2-area/`) — 8개 영역

| 영역 | 파일 수 | 관심사 |
|---|---|---|
| `00-principles` | 2 | 설계 원칙 |
| `01-command-pipeline` | 3 | 커맨드 파이프라인 |
| `02-focus-navigation` | 8 | 포커스 탐색 |
| `03-zift-primitives` | 4 | ZIFT 프리미티브 |
| `04-aria` | 4 | ARIA 접근성 |
| `05-kernel` | 3 | 커널 설계 |
| `06-testing` | 9 | 테스팅 전략 |
| `07-code-standards` | 3 | 코드 표준 |

### Inbox (`docs/0-inbox/`) — 8개 분석 리포트

최근 이슈: Kernel Scope Isolation, History MW Safety, AnyCommand Type, App Migration Gaps, Focus Code Structure, Effect Syscall Model, ARIA E2E Failure Analysis, OS Legacy Audit

---

## 6. 최근 개발 방향 (Git Log)

```
17bb393 refactor: unify 1-listeners naming + extract keymaps/
1ce003f fix: resolve 50+ tsc -b type errors in kernel + Todo app
7925913 refactor: remove store/ and lib/ — colocate to consumers
ff1260f refactor: colocate lib/ and shared/ files to consumers
a3c6bdf refactor: delete os-new/core/ — migrate FocusData to kernel/ZoneRegistry
387d47f refactor: Phase 3 — remove legacy CommandEngineStore pipeline
6d2164b fix: resolve broken imports after legacy middleware removal
8d9f6fb refactor: removal of legacy middleware and dependencies
03eb1ae chore: remove spike demos and routes
fd7bf11 fix: resolve import failures and TS4111 errors
```

> **핵심 흐름**: 레거시 OS 코드 제거 → 커널 중심 아키텍처로 통합 → 타입 안전성 확보 → 리스너/키맵 정리

---

## 7. 결론 및 현재 포지션

### ✅ 완료된 것

- 커널 코어 설계 (`createKernel`) — 상태, 디스패치, 이펙트, 스코핑, 미들웨어, 트랜잭션
- OS 프리미티브 8종 (Root, Zone, Item, Field, Trigger, Modal, Dialog, Kbd)
- 커맨드 시스템 14개 모듈
- appSlice 팩토리 (앱별 상태 격리)
- Todo 앱 커널 통합
- 레거시 OS 코드 대부분 제거
- PARA 기반 문서 체계 (121개 문서)

### 🔄 현재 진행 중

- 리스너 네이밍 표준화 및 키맵 분리
- 50+ 타입 에러 수정 (커널 + Todo)
- `dispatchToZone` → 커널 이펙트 시스템으로 전환
- ARIA E2E 테스트 안정화

### ⏳ 남은 과제

- Builder 앱은 프리미티브만 존재 — 본격 개발 필요
- `defineResource` (서버 상태 추상화) — 설계 단계
- Command Palette 프로젝트 — 비어 있음
- Inspector TestBot ↔ 커널 완전 통합
- History 미들웨어 안전성 개선
- `AnyCommand` 타입 정리

### 📊 건강도 요약

| 지표 | 상태 | 비고 |
|---|---|---|
| 아키텍처 | 🟢 양호 | 커널 중심 구조 확립 |
| 타입 안전성 | 🟡 개선 중 | 50+ 에러 수정 후 안정화 중 |
| 테스트 | 🟡 부분적 | E2E 존재하나 ARIA 일부 실패 |
| 문서화 | 🟢 우수 | PARA 체계로 121개 문서 관리 중 |
| 코드 품질 | 🟢 양호 | Biome + ESLint + lint-staged |
| 레거시 부채 | 🟡 개선 중 | 대부분 제거, 일부 잔여 |
