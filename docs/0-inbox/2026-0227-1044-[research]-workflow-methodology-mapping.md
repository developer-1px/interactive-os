# Workflow × Professional Methodology MECE 매핑

| 항목 | 내용 |
|------|------|
| **원문** | 우리 일하는 방식(워크플로 or skill)과 해당하는 전문방식 혹은 용어나 도구들을 mece하게 매칭하는 표를 만들고 그 도구를 사용하는 목적과 또 생각해보면 좋을 것을 표로 만들어줘 |
| **내가 추정한 의도** | |
| 　경위 | 40+개 워크플로우가 축적되면서, 각각이 어떤 전문 방법론에 근거하는지 한눈에 보기 어려워졌다 |
| 　표면 | 워크플로우 ↔ 전문 방법론/도구의 MECE 매핑표 |
| 　의도 | 워크플로우 체계의 이론적 근거를 가시화하여, 빠진 영역(blind spot)과 중복을 발견하고, 새 팀원(또는 미래 LLM)의 온보딩 비용을 줄이려는 것 |
| **날짜** | 2026-02-27 |
| **상태** | 📥 Inbox |

---

## 1. 개요

이 프로젝트의 40+개 워크플로우(slash skill)를 **활동 목적(Why)**으로 MECE 분류하고, 각 워크플로우가 차용한 **전문 방법론/프레임워크**를 1:N으로 매핑한다.

---

## 2. MECE 분류: 활동 목적 × 워크플로우 × 방법론

### 범례
- **카테고리**: 활동의 근본 목적 (MECE 7개)
- **워크플로우**: 해당 카테고리에 속하는 skill
- **핵심 방법론**: 워크플로우가 차용하는 전문 프레임워크
- **목적**: 이 워크플로우를 쓰는 이유 (한 줄)
- **생각해볼 것**: 확장·개선·위험 포인트

---

### A. 탐색 & 의사결정 (Explore & Decide)

> 문제 공간을 이해하고, 무엇을 할지 결정한다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/discussion` | **Toulmin Argumentation**, Cynefin, Steel-manning, Pre-mortem | 숨은 의도를 추출하고 합의된 Claim에 도달 | Toulmin의 Rebuttal 단계가 실제로 작동하는지 — 에이전트가 자기 논증을 진정으로 반박할 수 있는가? |
| `/inbox` | Cynefin 도메인 판정, Epistemic Status | 요청을 정형화하여 라우팅 가능한 보고서로 변환 | 인텐트 추정(3줄)의 정확도를 추적하는 피드백 루프가 없음 |
| `/elicit` | **SECI (Nonaka & Takeuchi)** — Externalization, Laddering, Teach-back, Critical Decision Method | 잘못된 의사결정에서 암묵지를 추출하여 명시화 | Knowledge Elicitation 기법 중 Repertory Grid, Card Sort는 미사용 — 필요한가? |
| `/conflict` | **Design Tensions (Christopher Alexander)**, 변증법(Dialectic) | 코드베이스 내 대립하는 가치·패턴을 가시화 | Resolution 전략 제안 후 실제 해소율 측정이 없음 |

---

### B. 분해 & 설계 (Decompose & Design)

> 결정된 방향을 실행 가능한 단위로 나눈다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/divide` | **Backward Chaining** (AI/Logic), Problem Framing, Empiricism (Scrum) | Goal에서 역추적하여 Work Package 도출 | WP의 적정 크기 기준이 암묵적 — "한 세션에 끝낼 수 있는가?"를 명시화하면 좋을 것 |
| `/blueprint` | **TOC Thinking Process (Goldratt)** — CRT, EC, FRT, PRT, TT (5 tools 전부) | 코드 수정 전 제약 기반 실행 설계도 | TOC 5 tools를 매번 전부 거치는 오버헤드 vs. Light 프로젝트에선 EC+TT만 쓰는 축약판? |
| `/plan` | **MECE (McKinsey)**, Cynefin per-row | Clear 판정 후 실행 전 변환 명세표 | `/blueprint`와 역할 경계가 미묘 — blueprint=Why, plan=What으로 충분히 구분되는가? |
| `/project` | Toulmin → BOARD 매핑, Cynefin (Heavy/Light/Meta) | Discussion 결론을 프로젝트 스캐폴드로 전환 | 프로젝트 규모 판정(Heavy/Light)의 기준이 주관적 — LOC나 WP 수로 객관화 가능? |
| `/naming` | **Ubiquitous Language (DDD, Eric Evans)** | 구현 전 이름 설계 — 이름이 아키텍처 | 네이밍 충돌 검사(grep)는 있지만, 의미 충돌(동음이의)은 감지 불가 |
| `/spec` | **BDD (Given/When/Then)**, Decision Table | 기능 명세서 — 테스트의 입력 | Decision Table의 행 수가 폭발할 때 조합 축소 전략(Pairwise)이 없음 |
| `/stories` | **User Story (Connextra)**, **INVEST**, Decision Table | 제품 계층의 사용자 스토리 관리 | `/spec`과 `/stories`의 언어 계층 분리(user vs system)가 잘 지켜지는지 감시 필요 |

---

### C. 구현 & 검증 (Implement & Verify)

> 코드를 작성하고 증명한다. TDD 사이클의 핵심.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/red` | **TDD Red phase (XP/Kent Beck)** | 실패하는 테스트 작성 — 스펙의 실행 가능한 인코딩 | Tier 1(kernel) / Tier 2(app) 구분은 좋지만, 어느 tier를 써야 하는지 판단 기준을 자동화할 수 있는가? |
| `/green` | **TDD Green phase** | 최소 구현으로 Red를 통과 | "최소"의 기준이 에이전트마다 다를 수 있음 — YAGNI 위반 감지 게이트? |
| `/bind` | **Hexagonal Architecture / Ports & Adapters (Cockburn)** | Headless 로직을 UI에 연결 | bind 단계에서 발견되는 OS 갭이 `/audit`까지 미뤄지는 경우가 있음 |
| `/fix` | Intent-preserving well-formedness (자체 정의) | LLM 산출물의 형식 오류만 교정 | `as any` 금지는 좋지만, `as unknown as T` 같은 우회는 감지하는가? |
| `/verify` | **Quality Gate** (CI/CD 관행) | tsc → lint → test → build 순차 게이트 | Gate 간 병렬화 가능 여부 — tsc와 lint는 독립적 |
| `/coverage` | Code Coverage Analysis, TDD | 커버리지 갭 분석 후 자동 TDD 루프 | Line coverage vs Branch coverage 구분이 명시되지 않음 |
| `/design` | HTML + TailwindCSS prototype | 프로덕션 코드 없이 디자인 프로토타입만 제작 | 프로토타입 → 프로덕션 전환 경로가 수동 — `/bind`와 연결 가능? |

---

### D. 품질 감시 & 교정 (Monitor & Correct)

> 이미 만들어진 것이 기준에 맞는지 감시하고, 벗어나면 교정한다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/review` | **Conventional Comments** (conventionalcomments.org) | 철학 준수 + 코드 품질 리뷰 | 리뷰 결과의 재발률 추적이 없음 — 같은 위반이 반복되면 `/rules`로 승격하는 자동 트리거? |
| `/audit` | Red Team 계약 검사, AUDITBOOK | OS 계약 위반 전수 검사 + LLM 실수/OS 갭/정당 예외 분류 | AUDITBOOK이 커지면 검색 비용 증가 — 카테고리별 분리 시점? |
| `/redteam` | **Red Team / Blue Team** (보안 차용) | 적대적 설계 검증 | Red Team이 Blue Team 없이 끝나는 경우, 지적만 쌓이고 해소 안 됨 |
| `/reflect` | Direction check (자체 정의) | 의도와 결과 일치 여부 경량 점검 | 너무 가벼워서 스킵되기 쉬움 — `/go` 파이프라인에서 강제 삽입 지점이 있는가? |
| `/perf` | Measurement-first Performance (자체 정의) | 증상이 아닌 근본 원인에서 성능 해결 | 측정 도구가 `performance.now()` + DOM count 수준 — Profiler flame graph 연동은? |

---

### E. 문제 해결 & 디버깅 (Troubleshoot & Debug)

> 깨진 것을 진단하고 고친다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/diagnose` | **5 Whys (Toyota/Lean)**, RCA | 코드 수정 없이 원인만 분석하여 삽질 일지 작성 | 5 Whys가 인과 추론의 한계(상관 ≠ 인과)를 넘는 보완책이 없음 |
| `/solve` | **Cynefin**, RCA/5 Whys, **Decision Matrix (PMBOK)**, **Integrative Thinking (Roger Martin)**, ITIL Escalation | Complex 항목 자율 해결 4단계 래더 | Step 3(Integrative Thinking)이 LLM에게 가장 어려운 단계 — 실제 합성 성공률? |
| `/issue` | **8D Problem Solving** | 이슈 자율 처리: 분석→계획→수정→검증→재발방지 | 8D의 D3(봉쇄조치)가 소프트웨어에선 모호 — 피처 플래그 없이 어떻게 봉쇄? |
| `/why` | **5 Whys**, Context Self-Audit | LLM이 막혔을 때 자가 진단 후 정지 | 자가 진단의 정확도 — LLM이 자기 맥락 오류를 정확히 짚을 수 있는가? |
| `/ban` | **Handoff Protocol** (Incident Management) | 에이전트 긴급 중단 + 실패록 인수인계 | .patch 보존은 좋지만, 새 에이전트가 patch를 제대로 이해하는지 검증 없음 |
| `/rework` | Root Cause Classification (자체 4분류) | 거절된 "완료"를 재작업 — 원인별 분류 | REWORKBOOK 패턴에서 가장 빈번한 원인 유형을 주기적으로 집계하면 예방에 활용 가능 |

---

### F. 오케스트레이션 & 환경 (Orchestrate & Environment)

> 파이프라인을 조율하고, 개발 환경을 유지한다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/go` | **Universal Cycle** (자체 정의), Cynefin routing | 자율 실행 에이전트 루프 — 상태 복원 후 올바른 단계에서 재개 | 루프 탈출 조건이 명확한가? 무한 루프 방지 메커니즘? |
| `/refactor` | **Red-Green-Refactor** (XP) — Refactor phase | Green 후 정리 + 엔트로피 감소 검증 | 리팩토링 전후 지표 비교(cast 수, LOC 등)가 자동화되어 있는가? |
| `/ready` | **Smoke Test** (QA) | 개발 환경 정상 동작 확인 + 복구 | 서버 2개(5555, 4444)만 체크 — 향후 서비스 추가 시 확장성? |
| `/routes` | Route Registration (TanStack Router 관행) | 앱 라우트 등록/제거 + GlobalNav 동기화 | 제거 시 impact analysis가 충분한가? dead route 감지는? |
| `/workflow` | Interactive Design (자체 정의) | 워크플로우 자체를 생성/수정 | 워크플로우 간 의존 관계 그래프가 없음 — 순환 의존 가능성? |
| `/reframe` | **Professional Terminology Ladder** (GoF→Agile→Consulting→PM→Domain) | 비공식 용어를 표준 프레임워크 용어로 치환 | 치환 후 원래 의미가 미묘하게 변하는 위험 — Teach-back 검증? |
| `/rules` | Abstraction Gate (자체 정의) | 프로젝트 규칙을 원칙 수준으로 관리 | 규칙 수가 늘면 충돌 가능 — 규칙 간 우선순위 체계? |

---

### G. 지식 생명주기 (Knowledge Lifecycle)

> 지식을 생성·축적·퇴장시킨다.

| Workflow | 핵심 방법론 | 목적 | 생각해볼 것 |
|----------|------------|------|------------|
| `/retrospect` | **KPT (Keep/Problem/Try)**, MECE 6-category action | 세션 세 관점 회고 + 즉시 반영 | KPT가 반복되면 "Try가 다음 Keep이 됐는가?" 추적이 가치 있음 |
| `/archive` | **Knowledge Repatriation** (자체 정의), PARA | 프로젝트 완료 시 지식 환류 + 매장 | official/ 환류 품질 — 추출된 지식이 실제로 재사용되는지 측정? |
| `/retire` | **Document Lifecycle Management**, Tombstone-free | superseded 문서를 AI 컨텍스트에서 제거 | MIGRATION_MAP이 커지면 그 자체가 부채 — 주기적 정리? |
| `/status` | **Single Source of Truth** dashboard | 프로젝트 대시보드 최신 유지 | 수동 갱신 의존 — git hook으로 자동 갱신 가능 영역은? |
| `/doubt` | **Subtract (Leidy Klotz)**, **Lean 7 Muda**, **Chesterton's Fence**, Occam's Razor | 존재 정당성 검증 — 빼기의 기술 | 가장 강력한 워크플로우 중 하나이나, 적용 타이밍이 모호 — 정기 스케줄화? |

---

## 3. 방법론 역매핑: 어떤 프레임워크가 어디서 쓰이는가

| 전문 방법론 | 출처/저자 | 사용 워크플로우 | 비고 |
|------------|----------|----------------|------|
| Cynefin Framework | Dave Snowden | `/discussion` `/divide` `/solve` `/go` `/plan` `/inbox` | **가장 빈번** — 모든 라우팅 결정의 근간 |
| TDD Red-Green-Refactor | Kent Beck (XP) | `/red` `/green` `/refactor` `/solve` `/coverage` | 구현의 핵심 사이클 |
| Toulmin Argumentation | Stephen Toulmin | `/discussion` `/project` | 의사결정 구조화 |
| TOC Thinking Process | Eliyahu Goldratt | `/blueprint` | 유일하게 5 TP tools 전체 사용 |
| BDD (Given/When/Then) | Dan North | `/spec` `/stories` | 명세 계층 |
| MECE | McKinsey & Co. | `/plan` `/retrospect` `/divide` | 분해의 품질 기준 |
| Hexagonal Architecture | Alistair Cockburn | `/bind` + CLAUDE.md | Headless-first 원칙의 이론적 근거 |
| 5 Whys / RCA | Toyota (Lean) | `/diagnose` `/solve` `/why` | 디버깅 계열 공통 |
| Decision Matrix | PMBOK (PMI) | `/solve` | Complex 선택지 평가 |
| Integrative Thinking | Roger Martin | `/solve` | 대안 합성 |
| Ubiquitous Language / DDD | Eric Evans | `/naming` + CLAUDE.md | 이름 = 법 |
| Subtract | Leidy Klotz | `/doubt` | 뺄셈 편향 교정 |
| Lean 7 Muda | Taiichi Ohno | `/doubt` | 낭비 분류 |
| Chesterton's Fence | G.K. Chesterton | `/doubt` | 제거 전 이해 강제 |
| SECI (Externalization) | Nonaka & Takeuchi | `/elicit` | 암묵지→형식지 |
| KPT Retrospective | — (Agile 관행) | `/retrospect` | 세션 회고 |
| Conventional Comments | conventionalcomments.org | `/review` | 리뷰 코멘트 분류 |
| Red Team / Blue Team | 보안 (NIST 등) | `/redteam` | 적대적 검증 |
| Design Tensions | Christopher Alexander | `/conflict` | 패턴 충돌 가시화 |
| 8D Problem Solving | Ford Motor (1987) | `/issue` | 이슈 자율 해결 |
| INVEST | Bill Wake | `/stories` | 스토리 품질 게이트 |
| Backward Chaining | AI/Logic Programming | `/divide` | 역추적 분해 |
| Occam's Razor | William of Ockham | `/doubt` + CLAUDE.md | 개체 최소화 |
| Hollywood Principle | Martin Fowler | CLAUDE.md | "Don't call us, we'll call you" |
| SRP / CQS | Robert C. Martin / Bertrand Meyer | CLAUDE.md | 구조 원칙 |
| Pit of Success | Rico Mariani | CLAUDE.md | API 설계 원칙 |
| POLA | — (UI/UX 관행) | CLAUDE.md | 놀라움 최소화 |
| PARA | Tiago Forte | docs/ 전체 | 문서 토폴로지 |
| FSD (Feature-Sliced Design) | — (프론트엔드 관행) | 앱 구조 | 앱 레이어 구조 |

---

## 4. 결론 & 제안

### 강점
1. **Cynefin이 보편 라우터** — 거의 모든 판단 분기에서 도메인 분류를 거친다. 일관된 의사결정 프레임.
2. **TDD + Hexagonal이 구현 척추** — Red→Green→Bind→Refactor 파이프라인이 방법론적으로 탄탄.
3. **뺄셈 워크플로우(`/doubt`)의 존재** — 대부분의 팀이 빠뜨리는 "줄이기"가 명시적으로 존재.
4. **실패 경로가 풍부** — `/ban`, `/why`, `/rework`, `/diagnose` — 실패를 인정하고 학습하는 경로가 4개.

### 빈 곳 (Blind Spots)

| 빈 영역 | 설명 | 후보 방법론 |
|---------|------|------------|
| **정량 피드백 루프** | 워크플로우 자체의 효과를 측정하는 메타 메트릭이 없음 | Cycle Time, Lead Time (Kanban), DORA Metrics |
| **위험 관리** | `/redteam`은 설계 검증이지, 프로젝트 위험 식별이 아님 | Risk Register (PMBOK), Pre-mortem (Gary Klein) |
| **사용자 검증** | BDD/TDD는 시스템 검증. 실제 사용자 관점 검증 부재 | Usability Heuristic Evaluation (Nielsen), Cognitive Walkthrough |
| **의존성 관리** | WP 간 의존은 `/divide`가 하지만, 워크플로우 간 의존 그래프 없음 | DSM (Design Structure Matrix) |
| **조합 테스트** | Decision Table 행 폭발 시 축소 전략 없음 | Pairwise Testing (Combinatorial) |

---

## 5. Cynefin 도메인 판정

🟢 **Clear**

이 요청은 이미 존재하는 워크플로우와 방법론을 정리하는 작업이다. 정답(현재 상태의 팩트)이 있고, 분류 기준(MECE)도 자명하다. 분석과 판단이 필요하지만 불확실성은 없다.

---

## 6. 인식 한계 (Epistemic Status)

- 각 워크플로우의 `.md` 정의 파일을 기반으로 분석. 실제 사용 빈도나 효과는 측정하지 못함.
- "생각해볼 것"은 구조적 관찰에서 도출한 가설이며, 실제 문제로 확인된 것은 아님.
- 방법론 매핑은 워크플로우 텍스트에서 명시적으로 언급된 것 + 구조적으로 유추한 것을 포함.

---

## 7. 열린 질문 (Complex Questions)

1. **워크플로우 효과 측정**: 어떤 워크플로우가 실제로 시행착오 비용을 줄였는지 측정할 방법이 있는가? (예: `/diagnose` 후 `/fix` 성공률 vs 직접 `/fix` 성공률)
2. **워크플로우 간 의존 그래프**: `/go`가 오케스트레이션하지만, 비선형 경로(예: `/audit`에서 `/red`로 돌아가기)가 늘면 DAG 시각화가 필요한가?
3. **Blind Spots 중 우선 해소 대상**: 위의 5개 빈 영역 중 지금 가장 아픈 곳은?

---

> **3줄 요약**
> 40+개 워크플로우를 7개 MECE 카테고리(탐색/분해/구현/감시/디버그/오케스트레이션/지식)로 분류하고 30+개 전문 방법론과 1:N 매핑했다.
> 강점: Cynefin 보편 라우터, TDD+Hexagonal 구현 척추, `/doubt` 뺄셈 워크플로우, 실패 경로 4종.
> 빈 곳: 정량 피드백 루프, 위험 관리, 사용자 검증, 워크플로우 간 의존 그래프, 조합 테스트 축소.
