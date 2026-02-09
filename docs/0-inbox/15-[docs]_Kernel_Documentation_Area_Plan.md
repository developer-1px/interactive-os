# Kernel 문서 관리 계획 — 2-area 구조 초안

> 날짜: 2026-02-09
> 태그: docs, PARA, kernel, area
> 상태: Draft

---

## 0. 현황

### inbox에 쌓인 커널 관련 문서 (14개)

| # | 문서 | 성격 |
|---|---|---|
| 01 | [re-frame] Core Library Architecture Proposal | 동기/영감 — re-frame에서 가져올 것 |
| 02 | [architecture] Why This Architecture in Agent Era | 철학/동기 — AI 시대 아키텍처 |
| 03 | [naming] Core API Naming Convention | 확정 — API 네이밍 |
| 04 | [core] Usage Guide | 확정 — 사용법 가이드 |
| 05 | [architecture] 3-Layer Architecture Proposal | 확정 — Kernel/OS/App 분리 |
| 06 | [naming] Glossary and Naming Unification | 확정 — 용어 통일 |
| 07 | [interface] Full Interface Specification | 확정 — 전체 인터페이스 |
| 08 | [kernel] Implementation Verification Report | 상태 보고 — 구현 검증 |
| 09 | [kernel] Store Singleton Bug Report | 버그 — 해결됨 |
| 10 | [kernel] Scope and Bubbling Proposal | 확정 — Scope 설계 |
| 11 | [kernel] defineKeybinding Layer Debate | 확정 — 레이어 결정 |
| 12 | [kernel] Scope Implementation Design Decisions | 확정 — Scope 구현 결정 |
| 13 | [kernel] Scope Final Design | 확정 — Scope 최종 설계 |
| 14 | [kernel] Type Safety Evaluation and Improvement | 확정 — 타입 안전성 |

**문제:** 커널 설계가 14개 문서에 흩어져 있고, 시간순으로 나열되어 있어 "현재 확정된 설계가 무엇인가"를 파악하기 어렵다.

### 현재 2-area 구조

```
2-area/
├── 00-core-philosophy/   ← OS 전체 철학
├── 01-command-system/    ← 레거시 커맨드 시스템 (os/ 기준)
├── 02-focus-system/      ← 포커스 파이프라인
├── 03-aria-compliance/   ← W3C ARIA
├── 04-lint-governance/   ← ESLint 규칙
└── 05-testbot/           ← TestBot
```

**01-command-system은 레거시다.** Kernel 도입으로 커맨드 시스템이 근본적으로 변경되었다.
새로운 `06-kernel/` area가 필요하고, 01은 아카이브 대상이다.

---

## 1. 제안: 2-area 신규 구조

```
2-area/
├── 00-core-philosophy/       ← 유지 (OS 전체 철학)
├── 01-command-system/        ← 아카이브 대상 → 4-archive/로 이동
├── 02-focus-system/          ← 유지 (OS 포커스 파이프라인)
├── 03-aria-compliance/       ← 유지
├── 04-lint-governance/       ← 유지
├── 05-testbot/               ← 유지
└── 06-kernel/                ← 신규
     ├── 00-overview.md
     ├── 01-architecture.md
     ├── 02-glossary.md
     ├── 03-api-reference.md
     ├── 04-scope-and-bubbling.md
     ├── 05-layer-boundary.md
     └── 06-type-system.md
```

---

## 2. 06-kernel/ 각 문서의 내용과 소스

### 00-overview.md — Kernel이란 무엇인가

**역할:** Kernel 영역의 진입점. "Kernel이 뭔지, 뭘 하는지, 뭘 모르는지"를 30초 안에 파악.

**포함 내용:**
- Kernel의 정의와 책임 범위
- Kernel이 아는 것 / 모르는 것
- 3-Layer 모델에서의 위치
- Kernel API 한눈에 (치트시트)
- 파일 구조 (`packages/kernel/src/`)

**소스 inbox 문서:**
- 05 §0-1 (왜 3-Layer인가, 각 레이어 책임)
- 04 전체 (Usage Guide — 실용적 개요)
- 01 §1-2 (동기, 핵심 설계 원칙)

### 01-architecture.md — 아키텍처 설계

**역할:** Kernel의 내부 구조와 dispatch 파이프라인. "어떻게 동작하는가".

**포함 내용:**
- Dispatch 파이프라인 (Command → Queue → Middleware → Handler → Effects → Transaction)
- re-frame Six Dominoes의 우리 버전
- State 모델 (단일 상태 트리, OS/App 분리)
- Effect 처리 모델 (선언적 EffectMap → 실행)
- Middleware 체인 (before/after)
- Context Injection 패턴

**소스 inbox 문서:**
- 05 §2-3 (State 분리 모델, Effect 처리 모델)
- 01 §3 (아키텍처 상세 — Six Dominoes)
- 07 (Full Interface Specification — 타입/시그니처)

### 02-glossary.md — 용어집

**역할:** "하나의 개념 = 하나의 이름". 용어 혼동 방지의 정본.

**포함 내용:**
- 확정 용어집 (개념, 함수/API, 타입)
- 변수명 규칙, 허용/금지 약어
- re-frame → 확정 매핑
- 레거시 → 확정 매핑
- 혼용 위험 3가지 (Command 이중의미, OSResult vs EffectMap, groupId vs zoneId)

**소스 inbox 문서:**
- 06 전체 (Glossary — 이 문서가 거의 그대로 이동)
- 03 §2 (핵심 매핑 테이블)

### 03-api-reference.md — API 레퍼런스

**역할:** Kernel이 export하는 모든 API의 시그니처, 설명, 예제.

**포함 내용:**
- Registration API: `defineCommand`, `defineHandler`, `defineEffect`, `defineContext`
- Dispatch API: `dispatch`
- Middleware API: `use`, `inject`
- Computed API: `defineComputed`, `useComputed`
- Store API: `getState`, `resetState`
- Inspector API: `getTransactions`, `travelTo`
- Scope API: `defineScope`, `removeScope`, `setActiveScope`, `buildBubblePath`

**소스 inbox 문서:**
- 03 §4 (전체 API 한눈에)
- 04 전체 (Usage Guide — 코드 예제)
- 07 (Full Interface Specification)
- 05 §8 (Kernel API 최종 설계)

### 04-scope-and-bubbling.md — Scope & Bubbling

**역할:** Kernel의 계층적 커맨드 해석. re-frame과의 핵심 차별점.

**포함 내용:**
- 왜 Scope가 필요한가 (flat dispatch의 한계)
- re-frame과의 차이
- Scope Tree, Bubble Path, Handler Resolution
- 버블 제어 (null, EffectMap, bubble: true)
- App Override 3패턴 (대체, 확장, 조건부)
- Passthrough 패턴이 사라지는 이유

**소스 inbox 문서:**
- 10 전체 (Scope and Bubbling Proposal)
- 12 (Scope Implementation Design Decisions)
- 13 (Scope Final Design)
- 05 §4-7 (버블링 모델, App Override, 실행 흐름)

### 05-layer-boundary.md — 레이어 경계 규칙

**역할:** Kernel/OS/App 사이의 경계선. "이것은 어느 레이어인가?"

**포함 내용:**
- 의존 규칙 (Kernel ← OS ← App, 단방향)
- defineKeybinding은 OS다 (결정 근거)
- Kernel이 모르는 것 목록 (키보드, 포커스, ARIA, 앱)
- 센서(입력 번역)는 OS의 책임
- Phase 1 (Key→Command, OS) vs Phase 2 (Command→Handler, Kernel) 분리

**소스 inbox 문서:**
- 11 전체 (defineKeybinding Layer Debate — 결론 포함)
- 05 §6, §9 (Keybinding과 Bubbling 분리, 레이어 의존)

### 06-type-system.md — 타입 시스템

**역할:** Kernel의 타입 설계와 타입 안전성 전략.

**포함 내용:**
- 핵심 타입 (Command, EffectMap, Context, CommandFn, Middleware)
- 제네릭 전략 (State 타입 파라미터)
- 타입 안전성 평가 결과
- 센서/파이프라인 타입 (KeyboardIntent, FocusIntent 등)
- Zone 관련 타입 (ZoneState, ZoneConfig, ZoneSnapshot)

**소스 inbox 문서:**
- 14 전체 (Type Safety Evaluation)
- 06 §5.3-5.8 (타입 정의)
- 07 (Full Interface Specification)

---

## 3. inbox 문서 처리 계획

### 2-area/06-kernel/로 통합 (내용 흡수 후 아카이브)

| inbox 문서 | 흡수 대상 | 처리 |
|---|---|---|
| 03-[naming] | 02-glossary, 03-api-reference | → 4-archive |
| 04-[core] Usage Guide | 00-overview, 03-api-reference | → 4-archive |
| 05-[architecture] 3-Layer | 00-overview, 01-architecture, 04-scope, 05-layer | → 4-archive |
| 06-[naming] Glossary | 02-glossary | → 4-archive |
| 07-[interface] | 03-api-reference, 06-type-system | → 4-archive |
| 10-[kernel] Scope | 04-scope-and-bubbling | → 4-archive |
| 11-[kernel] Keybinding Debate | 05-layer-boundary | → 4-archive |
| 12-[kernel] Scope Design Decisions | 04-scope-and-bubbling | → 4-archive |
| 13-[kernel] Scope Final | 04-scope-and-bubbling | → 4-archive |
| 14-[kernel] Type Safety | 06-type-system | → 4-archive |

### 다른 영역으로 이동

| inbox 문서 | 이동 대상 | 이유 |
|---|---|---|
| 01-[re-frame] | 3-resource/04-re-frame-guide.md 옆 | 참고 자료. 확정 설계가 아닌 영감 원천 |
| 02-[architecture] AI 시대 | 2-area/00-core-philosophy/ | Kernel 특화가 아닌 전체 철학 |

### inbox에 잔류 (커널 외 문서)

| inbox 문서 | 이유 |
|---|---|
| 08-[kernel] Implementation Verification | 일시적 보고서. 구현 완료 시 삭제 |
| 09-[kernel] Store Singleton Bug | 해결된 버그. 삭제 또는 4-archive |

---

## 4. 기존 2-area 영향

### 01-command-system/ → 4-archive/로 이동

현재 01-command-system의 내용:

```
01-command-system/
├── 00-architecture.md         ← 레거시 커맨드 엔진 (CommandEngineStore)
├── 01-zift-primitives.md      ← Zone/Item/Field/Trigger
├── 02-zift-primitives-detail.md
├── 03-keyboard-governance.md  ← 키보드 시스템 (레거시 해석 파이프라인)
├── 04-pure-payload-architecture.md
└── 05-naming-convention.md    ← 레거시 네이밍
```

**00, 03, 05는 Kernel 도입으로 대체되었다.** → 4-archive
**01, 02, 04는 OS 레이어 문서다.** → 02-focus-system에 통합하거나 별도 OS 영역 생성

### 00-core-philosophy/ → inbox 02 문서 흡수

02-[architecture] Why This Architecture in Agent Era를 `00-core-philosophy/03-ai-native-kernel.md`로 추가.

---

## 5. 최종 구조 (예상)

```
docs/
├── 0-inbox/               ← 처리 후 대부분 비워짐
├── 1-project/             ← 유지
├── 2-area/
│   ├── 00-core-philosophy/
│   │   ├── 00-overview.md
│   │   ├── 01-standards.md
│   │   ├── 02-ai-native-architecture.md
│   │   └── 03-ai-native-kernel.md          ← inbox 02 흡수
│   ├── 01-command-system/                   ← 4-archive로 이동
│   ├── 02-focus-system/                     ← 유지 (OS 포커스)
│   ├── 03-aria-compliance/                  ← 유지
│   ├── 04-lint-governance/                  ← 유지
│   ├── 05-testbot/                          ← 유지
│   └── 06-kernel/                           ← 신규
│       ├── 00-overview.md
│       ├── 01-architecture.md
│       ├── 02-glossary.md
│       ├── 03-api-reference.md
│       ├── 04-scope-and-bubbling.md
│       ├── 05-layer-boundary.md
│       └── 06-type-system.md
├── 3-resource/
│   └── 04-re-frame-guide.md                ← inbox 01 옆에 배치
└── 4-archive/
    └── 01-command-system-legacy/            ← 2-area/01에서 이동
```

---

## 6. 작업 순서

```
Phase 1: 06-kernel/ 뼈대 생성
  □ 00-overview.md 작성 (inbox 04, 05에서 추출)
  □ 02-glossary.md 작성 (inbox 06을 정제)

Phase 2: 핵심 설계 문서
  □ 01-architecture.md 작성 (inbox 01, 05, 07 통합)
  □ 04-scope-and-bubbling.md 작성 (inbox 10, 12, 13 통합)

Phase 3: 참조 문서
  □ 03-api-reference.md 작성 (inbox 03, 04, 07 통합)
  □ 05-layer-boundary.md 작성 (inbox 11에서 추출)
  □ 06-type-system.md 작성 (inbox 14, 06§5, 07 통합)

Phase 4: 정리
  □ inbox 문서들을 4-archive/로 이동
  □ 2-area/01-command-system/ → 4-archive/로 이동
  □ inbox 02 → 00-core-philosophy/에 흡수
  □ inbox 01 → 3-resource/에 배치
```
