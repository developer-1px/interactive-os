# PARA 문서 구조 재편 제안서

> **작성일**: 2026-02-08
> **대상**: `docs/` 전체 (44+ 문서)
> **목적**: 변하지 않을 Area/Resource 식별 및 폴더 구조 최적화

---

## 1. 개요 (Overview)

현재 `docs/` 디렉토리는 PARA(Projects-Areas-Resources-Archives) 구조를 따르고 있으나, 일부 문서가 **성격에 맞지 않는 카테고리에 배치**되어 있고, Area/Resource 간 경계가 모호한 부분이 있습니다. 이 제안서는 전체 문서를 분석하여:

1. **변하지 않을 Area** (지속적으로 관리해야 하는 책임 영역)를 식별
2. **변하지 않을 Resource** (참조용 지식 자료)를 식별
3. **최적화된 폴더 구조**를 제안합니다.

---

## 2. 분석 (Analysis)

### 2.1 현재 구조 문제점

| 문제 | 구체적 사례 |
|------|------------|
| **Area 내 중복** | `00-core-standards/`와 `01-architecture/`가 모두 아키텍처를 다룸 → 경계 불명확 |
| **Resource의 성격 혼재** | `03-red-team-audit-report.md`는 일회성 감사 보고서 → Archive가 적절 |
| **Resource에 분석 문서** | `02-focus-pipeline-invariants.md`는 구현 스펙 → Area 성격 |
| **Area의 느슨한 파일** | `aria-compliance-checklist.md`가 최상위에 배치 → 서브폴더 필요 |
| **번호 접두사 과다** | `00-`, `01-`, `02-` 등 순서 접두사가 탐색을 어렵게 함 |
| **Inbox 문서 미정리** | 2건의 분석 문서가 inbox에 체류 중 |

### 2.2 현재 전체 문서 인벤토리 (44개)

```
docs/
├── 0-inbox/                          (2건)
│   ├── 2026-02-08_Runner_Architecture.md        → Project 또는 Area
│   └── 2026-02-08_TestBot_LLM_RedTeam_Review.md → Area/TestBot
│
├── 1-project/                        (10건, 4 subdirs)
│   ├── architecture-decisions/       (1건) → 완료 시 Archive
│   ├── focus-recovery/               (5건) → 완료 시 Archive
│   ├── stream-inspector/             (2건) → 완료 시 Archive
│   └── todo-app/                     (2건) → 진행 중
│
├── 2-area/                           (24건, 5 subdirs + 1 loose)
│   ├── 00-core-standards/ (7건)      ← 01-architecture 일부와 중복
│   ├── 01-architecture/   (7건)      ← 분석문서 혼재 (archive 성격 포함)
│   ├── 02-focus-system/   (7건)      ✅ 잘 구성됨
│   ├── 03-lint-governance/ (1건)     ✅ 적절
│   ├── 04-testbot/        (1건)      ✅ 적절 (but 확장 필요)
│   └── aria-compliance-checklist.md  → 서브폴더 필요
│
├── 3-resource/                       (9건, 2 subdirs + 2 loose)
│   ├── 00-guides/     (3건)          ✅ 적절
│   ├── 01-focus/      (4건)          ⚠️ 분석 보고서 혼재
│   ├── 02-focus-pipeline-invariants.md  → Area로 이동
│   └── 03-red-team-audit-report.md     → Archive로 이동
│
└── 4-archive/                        (9건) ✅ 적절
```

---

## 3. 변하지 않을 Area (Stable Areas)

> Area = 프로젝트가 끝나도 **지속적으로 유지·업데이트** 해야 하는 책임 영역

### ✅ A1. `core-philosophy` — 핵심 철학 & 원칙

| 포함 문서 | 현재 위치 |
|----------|----------|
| 00-Overview.md (Interaction OS 철학) | `2-area/00-core-standards/` |
| 04-Standards.md (코딩 & 아키텍처 표준) | `2-area/00-core-standards/` |
| 05-AI-Native-Architecture.md | `2-area/00-core-standards/` |

**이유**: 프로젝트의 **정체성 문서**. 구현이 바뀌어도 철학과 원칙은 변하지 않음.

---

### ✅ A2. `command-system` — 커맨드 & 아키텍처 시스템

| 포함 문서 | 현재 위치 |
|----------|----------|
| 01-Architecture.md (커맨드 시스템) | `2-area/00-core-standards/` |
| 02-Components.md (ZIFT 프리미티브 요약) | `2-area/00-core-standards/` |
| 03-core-primitives.md (ZIFT 상세) | `2-area/00-core-standards/` |
| 02-Keyboard_Governance.md | `2-area/01-architecture/` |
| 03-Pure_Payload_Architecture.md | `2-area/01-architecture/` |

**이유**: OS의 핵심 런타임 계약. Command, ZIFT 프리미티브, 키보드 거버넌스는 시스템의 **불변 인터페이스**.

---

### ✅ A3. `focus-system` — 포커스 파이프라인

| 포함 문서 | 현재 위치 |
|----------|----------|
| 00-개요_및_아키텍처.md | `2-area/02-focus-system/` |
| 01-Pipeline-Spec.md | `2-area/02-focus-system/` |
| 02-ZIFT_Specification.md | `2-area/02-focus-system/` |
| 03-FocusGroup-Architecture.md | `2-area/02-focus-system/` |
| escape-dismiss-cohesion.md | `2-area/02-focus-system/` |
| nested-zone-focus.md | `2-area/02-focus-system/` |
| pipeline-embedded-logging.md | `2-area/02-focus-system/` |
| focus-pipeline-invariants.md | `3-resource/` → **여기로 이동** |

**이유**: 시스템의 **가장 핵심적이고 복잡한 서브시스템**. 파이프라인 5-Phase 구조는 불변.

---

### ✅ A4. `aria-compliance` — ARIA 적합성

| 포함 문서 | 현재 위치 |
|----------|----------|
| aria-compliance-checklist.md | `2-area/` (루트, 느슨) |
| 2026-02-07_ARIA_Full_Spec_Reference.md | `2-area/00-core-standards/` |

**이유**: WAI-ARIA 표준 준수는 프로젝트 수명 전체에 걸친 **품질 책임 영역**. 체크리스트는 지속적으로 업데이트됨.

---

### ✅ A5. `lint-governance` — 린트 거버넌스

| 포함 문서 | 비고 |
|----------|------|
| 00-ZIFT-Lint-Rules.md | 유일한 문서이나, 규칙 추가 시 확장 예정 |

**이유**: ZIFT 파이프라인 준수를 **기계적으로 강제**하는 규칙. 앱이 추가될 때마다 업데이트 필요.

---

### ✅ A6. `testbot` — TestBot 시스템

| 포함 문서 | 현재 위치 |
|----------|----------|
| LLM-Friendly-TestBot-Spec.md | `2-area/04-testbot/` |
| TestBot_LLM_RedTeam_Review.md | `0-inbox/` → **여기로 이동** |

**이유**: TestBot은 **모든 앱의 품질 검증 인프라**. LLM 친화성은 AI-Native 아키텍처의 핵심 관심사.

---

## 4. 변하지 않을 Resource (Stable Resources)

> Resource = 프로젝트와 무관하게 **참조용으로 존재**하는 지식 자료

### ✅ R1. `guides` — 개발자 가이드

| 포함 문서 | 비고 |
|----------|------|
| 00-developer-usage.md | 커맨드 패턴 개발 가이드 |
| 01-usage-guide.md | Smart Core, Dumb App 가이드 |
| 02-debugging.md | 디버깅 & 관찰 가능성 |

**이유**: 신규 개발자/AI가 시스템에 온보딩할 때 **반드시 참조**하는 불변 가이드.

---

### ✅ R2. `focus-reference` — 포커스 참조 자료

| 포함 문서 | 비고 |
|----------|------|
| 00-reference.md | ARIA/키보드/포커스 용어 총정리 (640줄) |
| 01-naming-pool.md | FocusGroup 구현 네이밍 가이드 (830줄) |

**이유**: 용어 사전 및 네이밍 풀. 구현과 독립적인 **참조 데이터**.

---

### ✅ R3. `analysis-reports` — 분석 보고서

| 포함 문서 | 현재 위치 → 행선지 |
|----------|------------------|
| 02-Field-Navigation-MECE.md | `3-resource/01-focus/` ✅ |
| 03-Focus-Showcase-MECE-Audit.md | `3-resource/01-focus/` ✅ |

**이유**: MECE 분석은 **방법론적 참조 자료**. 구현이 바뀌어도 분석 프레임워크는 유효.

---

## 5. 제안: 새 폴더 구조

> **넘버링 원칙**: 변하지 않을 Area/Resource 폴더와 문서 모두에 `00-` 접두사를 부여하여 파일 탐색기에서 **의도한 읽기 순서**를 보장합니다. Project/Archive는 날짜 기반이므로 넘버링 불필요.

```
docs/
├── 0-inbox/                               ← 미분류 임시 보관소
│
├── 1-project/                             ← 진행 중인 프로젝트 (넘버링 없음, 날짜 기반)
│   ├── todo-app/
│   └── runner-architecture/               ← inbox에서 이동
│
├── 2-area/                                ← 지속 관리 영역 (폴더·문서 모두 넘버링)
│   │
│   ├── 00-core-philosophy/                ← 철학, 원칙, AI-Native
│   │   ├── 00-overview.md                    (Interaction OS 철학)
│   │   ├── 01-standards.md                   (코딩 & 아키텍처 표준)
│   │   └── 02-ai-native-architecture.md      (AI-Native 개발 원칙)
│   │
│   ├── 01-command-system/                 ← 커맨드, ZIFT, 키보드
│   │   ├── 00-architecture.md                (커맨드 시스템 개요)
│   │   ├── 01-zift-primitives.md             (ZIFT 요약)
│   │   ├── 02-zift-primitives-detail.md      (ZIFT 상세 스펙)
│   │   ├── 03-keyboard-governance.md         (키보드 거버넌스)
│   │   └── 04-pure-payload-architecture.md   (순수 페이로드 아키텍처)
│   │
│   ├── 02-focus-system/                   ← 포커스 파이프라인
│   │   ├── 00-overview.md                    (개요 및 아키텍처)
│   │   ├── 01-pipeline-spec.md               (파이프라인 스펙)
│   │   ├── 02-zift-specification.md          (ZIFT 명세)
│   │   ├── 03-focusgroup-architecture.md     (FocusGroup 아키텍처)
│   │   ├── 04-pipeline-invariants.md         (파이프라인 불변 법칙) ← resource에서 이동
│   │   ├── 05-escape-dismiss-cohesion.md     (Escape/Dismiss 응집)
│   │   ├── 06-nested-zone-focus.md           (중첩 Zone 포커스)
│   │   └── 07-pipeline-embedded-logging.md   (파이프라인 임베디드 로깅)
│   │
│   ├── 03-aria-compliance/                ← ARIA 적합성
│   │   ├── 00-checklist.md                   (ARIA 준수 체크리스트) ← 루트에서 이동
│   │   └── 01-full-spec-reference.md         (ARIA 전체 스펙 참조) ← core-standards에서 이동
│   │
│   ├── 04-lint-governance/                ← 린트 거버넌스
│   │   └── 00-zift-lint-rules.md             (ZIFT 린트 규칙)
│   │
│   └── 05-testbot/                        ← TestBot 시스템
│       ├── 00-llm-friendly-spec.md           (LLM 친화 인터페이스 스펙)
│       └── 01-llm-redteam-review.md          (LLM Red Team 검토) ← inbox에서 이동
│
├── 3-resource/                            ← 참조 자료 (폴더·문서 모두 넘버링)
│   │
│   ├── 00-guides/                         ← 개발자 가이드
│   │   ├── 00-developer-usage.md             (커맨드 패턴 개발 가이드)
│   │   ├── 01-app-architecture-usage.md      (Smart Core, Dumb App 가이드)
│   │   └── 02-debugging.md                   (디버깅 & 관찰 가능성)
│   │
│   ├── 01-focus-reference/                ← 포커스 참조 자료
│   │   ├── 00-terminology-reference.md       (ARIA/키보드/포커스 용어 총정리)
│   │   └── 01-naming-pool.md                 (FocusGroup 구현 네이밍 가이드)
│   │
│   └── 02-analysis-reports/               ← 분석 보고서
│       ├── 00-field-navigation-mece.md       (Field + Navigation MECE 분석)
│       └── 01-focus-showcase-mece-audit.md   (포커스 쇼케이스 MECE 감사)
│
└── 4-archive/                             ← 완료/폐기된 문서 (넘버링 없음, 날짜 기반)
    ├── (기존 9건 유지)
    ├── architecture-debate-summary.md        ← 결정 완료, area에서 이동
    ├── unified-navigation-architecture.md    ← 결정 완료, area에서 이동
    ├── focus-architecture-analysis.md        ← 일회성, area에서 이동
    ├── testbot-architecture-analysis.md      ← 일회성, area에서 이동
    ├── zustand-architecture-analysis.md      ← 일회성, area에서 이동
    ├── red-team-audit-report.md              ← 일회성, resource에서 이동
    └── clipboard-vs-history-separation.md    ← 결정 완료, project에서 이동
```

---

## 6. 넘버링 원칙

| 대상 | 넘버링 | 사유 |
|------|--------|------|
| **Area 폴더** | `00-` ~ `05-` | 철학→커맨드→포커스→ARIA→린트→테스트 순으로 추상→구체 읽기 흐름 |
| **Area 문서** | `00-` ~ `0N-` | 폴더 내 문서도 개요→상세→부록 순서 보장 |
| **Resource 폴더** | `00-` ~ `02-` | 가이드→참조→분석 순서 보장 |
| **Resource 문서** | `00-` ~ `0N-` | 폴더 내 문서도 순서 보장 |
| **Project 폴더** | ❌ 없음 | 프로젝트는 생성·종료가 빈번 → 날짜 기반 |
| **Archive 파일** | ❌ 없음 | 아카이브는 날짜 접두사로 정렬 |

---

## 7. 이동 대상 요약

### Inbox → 정리

| 파일 | 행선지 | 사유 |
|------|--------|------|
| `Runner_Architecture.md` | `1-project/runner-architecture/` | 진행 중인 설계 제안 |
| `TestBot_LLM_RedTeam_Review.md` | `2-area/05-testbot/` | TestBot 영구 관리 문서 |

### Area → Archive (결정 완료된 토론/분석)

| 파일 | 사유 |
|------|------|
| `00-Architecture_Debate_Summary.md` | 결정 완료 (✅ 마킹됨), 역사적 참고용 |
| `01-Unified_Navigation_Architecture.md` | 구현 완료된 아키텍처 제안 |
| `focus-architecture-analysis.md` | 일회성 분석 스냅샷 |
| `testbot-architecture-analysis.md` | 일회성 분석 스냅샷 |
| `zustand-architecture-analysis.md` | 일회성 분석 스냅샷 |
| `Clipboard_vs_History_Separation.md` | 결정 완료된 프로젝트 문서 |

### Resource → Area (스펙 성격)

| 파일 | 행선지 | 사유 |
|------|--------|------|
| `02-focus-pipeline-invariants.md` | `2-area/02-focus-system/04-pipeline-invariants.md` | 파이프라인 불변 법칙 = 시스템 스펙 |

### Resource → Archive (일회성)

| 파일 | 사유 |
|------|------|
| `03-red-team-audit-report.md` | 2026-02-05 일회성 감사, 결과는 area에 반영됨 |

### Area 내부 재배치

| 파일 | From → To | 사유 |
|------|-----------|------|
| `aria-compliance-checklist.md` | 루트 → `03-aria-compliance/00-checklist.md` | 서브폴더로 정리 |
| `ARIA_Full_Spec_Reference.md` | `core-standards/` → `03-aria-compliance/01-full-spec-reference.md` | ARIA 관련 문서 그룹화 |

---

## 8. 네이밍 컨벤션 제안

| 항목 | 현행 | 제안 |
|------|------|------|
| 폴더 넘버링 | 일부만 적용 | **Area/Resource 폴더 전체에 `XX-` 접두사** |
| 문서 넘버링 | 일부만 적용 | **Area/Resource 문서 전체에 `XX-` 접두사** |
| 날짜 접두사 | `2026-02-07_` | **Project, Archive에서만 사용** |
| 파일명 | 한영 혼재 | **영문 kebab-case 통일** (내용은 한글 OK) |

---

## 9. 결론 (Conclusion)

### 핵심 발견

1. **6개의 안정 Area** 식별: 핵심 철학, 커맨드 시스템, 포커스 시스템, ARIA 적합성, 린트 거버넌스, TestBot
2. **3개의 안정 Resource** 식별: 가이드, 포커스 참조, 분석 보고서
3. **6건의 Area → Archive 이동** 대상: 결정 완료된 토론/일회성 분석
4. **2건의 Inbox 정리** 대상
5. **1건의 Resource → Area 이동** 대상: 파이프라인 불변 법칙

### 기대 효과

- **탐색성 향상**: Area 이름만으로 책임 범위 파악 가능
- **유지보수 부담 감소**: Archive로 이동하면 "이건 아직 유효한가?" 판단 불필요
- **AI 에이전트 효율**: 문서 탐색 시 context window 낭비 감소
- **일관된 네이밍**: 파일명만으로 내용 추정 가능
