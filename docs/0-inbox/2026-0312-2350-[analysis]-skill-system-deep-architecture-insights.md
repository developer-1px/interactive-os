# 스킬 시스템 심층 아키텍처 분석 — 컴파일러, 타입 시스템, 면역 체계

| 항목 | 내용 |
|------|------|
| **원문** | 이 관점에서 우리 스킬을 다시 한번 심도있게 분석해서 인사이트 보고서를 작성해줘 |
| **내(AI)가 추정한 의도** | **경위**: I/O 함수 매핑 문서(doc 35)를 작성한 직후, AI가 "이 시스템은 컴파일러다 / 타입 시스템이다 / 서버리스 상태관리다"라는 통찰을 제시했다. **표면**: 그 관점으로 더 깊이 분석하라. **의도**: 표면적 I/O 매핑을 넘어, 시스템의 구조적 성질(동형성, 패턴, 약점)을 발견하여 다음 진화 방향을 도출하고 싶다. |
| **날짜** | 2026-03-12 |
| **상태** | 분석 완료 |

---

## 1. 개요

48개 스킬 + 3개 Hook + `_middleware`로 구성된 이 시스템을 **세 가지 렌즈**로 분석한다:

1. **컴파일러 동형성** — 스킬 파이프라인과 컴파일러 페이즈의 구조적 대응
2. **타입 시스템** — I/O 타입 매핑에서 드러나는 타입 에러와 암묵적 캐스팅
3. **생물학적 유비** — 면역 체계, 가비지 컬렉션, 신경계로서의 크로스커팅 관심사

각 렌즈가 동일한 시스템을 다른 각도에서 비추며, **겹치는 영역에서 가장 깊은 통찰**이 나온다.

---

## 2. 분석

### 2-1. 컴파일러 동형성 — "소프트웨어를 만드는 과정의 컴파일"

#### 페이즈 매핑

| 컴파일러 페이즈 | 스킬 | Input → Output | 핵심 변환 |
|----------------|------|---------------|----------|
| **Lexer** (토큰화) | `/inbox` | UserRequest → InboxReport | 비정형 자연어를 정형 토큰(분류, 의도, Cynefin)으로 분해 |
| **Parser** (구조화) | `/discussion` | Topic → Claim + Knowledge + Routing | 토큰들을 Toulmin 논증 트리로 조립 |
| **Semantic Analysis** (의미 검증) | `/conflict`, `/divide`, `/solve` | 탈출 밸브 | 구문은 맞지만 의미가 모순인 경우를 잡아냄 |
| **IR Generation** (중간 표현) | `/project` → `/plan` | Claim → BOARD.md → TaskMap | 고수준 의도를 실행 가능한 중간 표현으로 변환 |
| **Optimization** | `/spec` | Task → BDD + DecisionTable | 명세 최적화 — 무엇을 검증할지 결정 |
| **Code Generation** | `/red` → `/green` → `/bind` | Spec → Test → Code → UI | 실제 코드 생산 |
| **Peephole Optimization** | `/doubt`, `/refactor` | Code → ReducedCode | 생산된 코드의 불필요한 부분 제거 |
| **Linker** | `/verify` | Code → VerificationResult | 모든 참조가 해결되고 빌드가 되는지 확인 |
| **Symbol Table** | `/archive` → `2-area/`, `rules.md` | Project → ArchivedKnowledge | 컴파일 결과의 심볼을 영구 테이블에 등록 |

#### 이 매핑에서 드러나는 통찰

**통찰 1: Front-end는 대화형이고, Back-end는 자동화되어 있다.**

컴파일러에서 front-end(lexer→parser→semantic)는 소스코드에 의존하고, back-end(codegen→optimization→linking)는 IR만 있으면 자동 실행된다. 우리 시스템도 동일하다:

- **Front-end** (`/inbox` → `/discussion` → `/project`): 사용자와 대화형. 입력이 비정형이라 자동화 한계.
- **Back-end** (`/plan` → `/red` → `/green` → ... → `/archive`): BOARD.md(=IR)만 있으면 `/go`가 자동 실행.

이것이 `/auto`가 가능한 이유다. **`/auto`는 back-end만 자동 실행하는 것**이다. front-end를 자동화하려면 사용자 의도를 자동으로 파싱해야 하는데, 이게 바로 G2(triage) 빈칸이 가리키는 곳이다.

**통찰 2: `/wip`은 JIT 컴파일러다.**

Ahead-of-Time 컴파일(=/go)은 전체 소스를 한 번에 처리한다. JIT 컴파일(=/wip)은 실행 시점에 필요한 부분만 컴파일한다. `/wip`이 백로그에서 랜덤 1개를 골라 "이거 지금 컴파일 가능한가?"(=Clear인가?)를 판단하는 것은 JIT의 "이 hot path를 지금 최적화할 가치가 있는가?" 판단과 동형이다.

**통찰 3: `/simplify` 빈칸은 "Register Allocation" 부재다.**

컴파일러에서 code generation 직후, register allocation이 코드를 "실제 하드웨어에 맞게" 정리한다. `/green`(codegen) 직후 `/simplify`(register allocation)가 "실제 프로젝트 맥락에 맞게" 코드를 정리해야 하지만, 이 슬롯이 파이프라인에 없다. `/doubt`는 Dead Code Elimination(불필요한 것 제거)이지, register allocation(재배치/정리)이 아니다.

---

### 2-2. 타입 시스템 — "스킬 간 계약을 타입으로 검증"

#### I/O를 타입으로 정형화

doc 35에서 비공식 라벨로 붙인 타입명을 좀 더 엄밀하게 분석한다.

```
type UserRequest    = string  // 비정형
type InboxReport    = { title, intent, analysis, cynefin, questions }
type Topic          = string  // 비정형
type Claim          = { statement, warrants[], knowledge[] }
type RoutingDecision = "project" | "backlog" | "stories" | "resource"
type BOARDContext   = { claim, before, after, risk, size, unresolved[] }
type TaskMap        = { tasks: Task[], order: number[] }
type Task           = { id, title, size: "S"|"M", spec?: Spec }
type Spec           = { scenarios: BDD[], decisionTable: DT[] }
type FailingTest    = { file: string, testCount: number, allFail: true }
type PassingCode    = { file: string, testCount: number, allPass: true }
type WorkingUI      = PassingCode & { component: string }
type ViolationReport = { violations: Violation[], classified: boolean }
type ReducedCode    = PassingCode & { removedLines: number }
type VerifyResult   = { tsc: 0, lint: 0, test: "PASS", build: "OK" }
type QAJudgment     = { gates: Gate4[], overall: "PASS"|"FAIL" }
type KPT            = { keep[], problem[], try[] }
type ArchivedKnowledge = { rules: Rule[], area: AreaDoc[], archive: string }
```

#### 타입 에러 발견

| # | 위치 | 에러 유형 | 설명 |
|---|------|----------|------|
| **TE1** | `/inbox` → `/discussion` | **Widening** (타입 손실) | `InboxReport`(정형)이 `Topic`(string)으로 넓어진다. 정형화된 cynefin 판정, 분석 데이터가 소실. `/discussion`이 InboxReport를 직접 받으면 더 풍부한 시작점 |
| **TE2** | `/wip` → `/project` | **Shape mismatch** | `/project`는 `Claim`(Toulmin)을 기대. `/wip`은 `PrerequisiteTree` + `CynefinJudgment`를 생산. 이걸 `Claim`으로 변환하는 어댑터가 암묵적 |
| **TE3** | `/green` → `/bind` | **Missing intermediate** | `PassingCode`(headless)에서 `WorkingUI`(React)로의 변환에 `ReviewedCode` 단계가 없음. `PassingCode`가 직접 `bind`에 들어감 |
| **TE4** | `_middleware` → `/knowledge` → `/archive` | **Union without discriminator** | 세 곳이 모두 `Knowledge[]`를 생산하지만, 어느 경로로 온 지식인지(세션 메모 / 명시적 영속화 / 프로젝트 환류) 구분자가 없음 |
| **TE5** | `/retrospect` → `/archive` | **Implicit dependency** | `/archive`가 `/retrospect`를 필수 게이트로 요구하지만, I/O 타입에 이 의존성이 표현되지 않음. `KPT`가 `/archive`의 input에 포함되어야 함 |

#### 암묵적 캐스팅 (Implicit Cast) — 위험하지만 작동하는 것

| 위치 | Cast | 왜 작동하는가 |
|------|------|-------------|
| `/discussion` → `/project` | `Claim + Knowledge` → `BOARDContext` | `/project` SKILL.md에 Toulmin→BOARD 매핑 테이블이 명시되어 있음 |
| `/spec` → `/red` | `Spec(BDD+DT)` → `FailingTest` | `/red`가 DT 행을 순회하며 테스트 생성. 변환 로직이 `/red` 내부에 있음 |
| `/qa` FAIL → loop back | `QAJudgment` → 수정 지시 | `/go`가 QA 리포트를 읽고 해당 스킬로 재라우팅. 판단이 `/go` 안에 있음 |

**핵심 통찰: 암묵적 캐스팅이 `/go`에 집중되어 있다.** `/go`는 파이프라인 라우터이면서 동시에 **타입 변환기(adapter)**다. 이것은 의도적 설계인가, 우발적 결합인가? 컴파일러 관점에서 `/go`는 "Driver"(gcc처럼 각 phase를 호출하는 orchestrator)인데, Driver가 type conversion까지 담당하면 Driver의 복잡도가 올라간다.

---

### 2-3. 세 가지 실행 모델의 공존

이 시스템은 하나의 실행 모델이 아니라 **세 가지가 계층적으로 공존**한다:

| 계층 | 모델 | 구현 | 비유 |
|------|------|------|------|
| **L0: Sequential Pipeline** | 명시적 순서, 동기 실행 | `/go` #0→#15 | 어셈블리 라인 |
| **L1: Event-Driven** | 외부 이벤트가 흐름을 변경 | Stop Hook (`go-loop.sh`), Session Hook | 인터럽트 핸들러 |
| **L2: Aspect-Oriented** | 모든 실행에 암묵적 적용 | `_middleware`, `/reflect` | 크로스커팅 관심사 |

**통찰 4: L0은 잘 정의되어 있고, L1은 최소한이며, L2는 발견 단계다.**

- **L0** (pipeline): `/go` SKILL.md에 15단계가 명시. 가장 성숙.
- **L1** (event): Hook이 3개뿐 (`session-start`, `audit-log`, `go-loop`). Stop Hook은 `/auto`를 위한 단일 목적. 이벤트 모델이 아직 원시적.
- **L2** (aspect): `_middleware`가 유일한 공식 aspect. `/reflect`는 "삽입 가능한" cross-cutting이지만 자동 삽입이 아닌 수동 호출. **aspect 계층이 가장 미성숙.**

**이 세 계층의 미성숙도가 정확히 빈칸들과 대응한다:**

| 빈칸 | 계층 부재 |
|------|----------|
| G1 (simplify 슬롯) | L0 미완성 — 파이프라인에 슬롯 누락 |
| G2 (triage) | L1 미완성 — "inbox에 새 보고서 도착" 이벤트에 반응하는 핸들러 없음 |
| G3 (post-archive next) | L1 미완성 — "archive 완료" 이벤트에 반응하는 핸들러 없음 |
| G6 (지식 3경로) | L2 미완성 — knowledge aspect의 생명주기(수집→영속화→환류)가 미정형화 |

---

### 2-4. 면역 체계 — 실패를 다루는 스킬들의 구조

일반적인 소프트웨어 파이프라인에 없고 이 시스템에만 있는 것: **LLM의 실패에 대응하는 전용 스킬 군**.

```
감지(Detection)          진단(Diagnosis)          대응(Response)
─────────────           ─────────────           ─────────────
/reflect                /why                    /fix (형식 오류)
(방향 이탈 감지)         (근본 원인 분석)         /refactor (구조 개선)

/audit                  /diagnose               /ban (회복 불가 → 세션 종료)
(계약 위반 감지)         (설계 부채 추적)

_middleware             /redteam                /backlog (나중으로 미루기)
(지식 수집)             (외부 관점 검증)
```

**통찰 5: 이건 면역 체계다.**

- **선천 면역** (innate): `_middleware`(항상 작동), `/verify`(기계적 게이트) — 비특이적, 항상 on.
- **적응 면역** (adaptive): `/why`(원인 학습), `/diagnose`(패턴 인식), `/retrospect`(항체 생산=KPT) — 특이적, 경험 기반.
- **자가면역 방지**: `/ban` — 면역 체계가 자기를 공격할 때(에이전트가 잘못된 맥락을 고집) 세션을 종료하여 피해 차단.
- **면역 기억**: `knowledge/`, `rules.md` — 한번 겪은 문제를 다음 세션이 기억.

**이 면역 체계에서 빠진 것:**

| 면역 기능 | 현재 상태 | 빈칸 |
|----------|----------|------|
| **백신** (예방적 주입) | `/ready`가 환경 검증. 하지만 "이전 세션에서 어떤 문제가 있었는지" 사전 브리핑 없음 | 세션 시작 시 최근 `/ban` 보고서 + `/retrospect` Problem 목록 자동 로딩? |
| **증상 모니터링** | `/reflect`가 수동 호출. 자동 트리거 없음 | `/go` 파이프라인 내 자동 reflect 삽입 (매 N단계마다)? |
| **항체 공유** | `knowledge/`가 지식을 저장하지만, "실패 패턴"과 "성공 패턴"이 같은 형식 | `knowledge/` 내 hazards 전용 섹션이 이미 있음 (testing-hazards.md 등). 충분할 수 있음 |

---

### 2-5. 지식의 가비지 컬렉션

`_middleware` → `/knowledge` → `/archive`의 3경로를 GC 관점에서 보면:

| GC 개념 | 대응 | 메커니즘 |
|---------|------|----------|
| **Allocation** | `_middleware` 📝 누적 | 세션 중 실시간. 힙에 할당 |
| **Reference counting** | `/knowledge` 영속화 | 참조(=활용 가능성)가 있는 것만 `rules.md`/`knowledge/`에 저장 |
| **Mark & Sweep** | `/archive` 환류 | 프로젝트 종료 시 전수 스캔. 살아있는 지식 → 2-area. 죽은 것 → 4-archive(=free) |
| **Generational** | 2-area(old gen) vs 0-inbox(young gen) | 오래 살아남은 지식이 old gen(2-area)으로 승격 |

**통찰 6: PARA 구조가 Generational GC다.**

- **Young generation**: `0-inbox/`, `5-backlog/` — 빈번히 생성, 대부분 단명
- **Old generation**: `2-area/`, `rules.md`, `knowledge/` — 승격된 지식, 장기 생존
- **Permanent generation**: `.agent/rules.md` — 헌법. GC 대상 아님
- **Finalized**: `4-archive/` — 참조 없음. 시간순 매장. 부활 불가 (git에서는 가능)

빈칸 G6(지식 3경로 경계)의 해소: **이 GC 모델을 명문화하면 된다.** `_middleware`=allocation, `/knowledge`=reference counting, `/archive`=mark & sweep. 세 경로는 중복이 아니라 GC 단계다.

---

### 2-6. 스케줄러 부재 — 모든 빈칸의 공통 근인

doc 35의 빈칸 3개(G1, G2, G3)와 이 분석의 추가 발견(TE1, TE2)이 모두 **같은 구조적 약점**을 가리킨다:

> **이 시스템에는 파이프라인(what to do in order)은 있지만, 스케줄러(what to do next)가 없다.**

| 기능 | 현재 | 이상 |
|------|------|------|
| **파이프라인 내 순서** | `/go`가 15단계 결정 | ✅ 충분 |
| **파이프라인 진입 판단** | 사용자 수동 | ⚠️ `/wip`이 부분 커버 |
| **파이프라인 간 전환** | 사용자 수동 | ❌ 없음 |
| **우선순위 판단** | 사용자 수동 | ❌ 없음 |

OS 커널로 치면: 프로세스(=/go pipeline)는 잘 정의되어 있지만, **프로세스 스케줄러**가 없다. 현재는 사용자가 수동으로 "다음은 이거"라고 지정한다. `/auto`가 "현재 프로세스를 끝까지 실행"은 해주지만, "다음 프로세스를 고르는" 것은 못 한다.

**이것이 "Scheduler Skill" 빈칸으로 통합되는 모습:**

```
/inbox → [?Triage/Scheduler] → /discussion → /project → /go → /archive → [?Scheduler] → ...
          ^^^^^^^^^^^^^^^^                                                 ^^^^^^^^^^^^
          G2 빈칸                                                          G3 빈칸
```

하나의 스케줄러가 두 빈칸을 동시에 메운다. input: `STATUS.md`(현재 상태) + `5-backlog/`(대기열) + `0-inbox/`(신규 요청). output: `NextAction`(어떤 스킬을 어떤 대상에 실행할지).

---

## 3. 결론 / 제안

### 아키텍처 성숙도 진단

| 관심사 | 성숙도 | 근거 |
|--------|--------|------|
| **Sequential Pipeline** (L0) | ★★★★☆ | 15단계 Code + 13단계 Meta. `/simplify` 슬롯 1개 누락 |
| **Event-Driven** (L1) | ★★☆☆☆ | Hook 3개. `/auto` 전용. 범용 이벤트 모델 없음 |
| **Aspect-Oriented** (L2) | ★★☆☆☆ | `_middleware` 1개. `/reflect` 수동. 자동 aspect 삽입 없음 |
| **Type Safety** (I/O 계약) | ★☆☆☆☆ | I/O 타입이 어디에도 명시되지 않음. 암묵적 캐스팅이 `/go`에 집중 |
| **Scheduling** | ★☆☆☆☆ | 파이프라인 내 순서만 존재. 파이프라인 간 전환/우선순위 없음 |
| **Immune System** | ★★★☆☆ | 감지·진단·대응 모두 존재. 예방(백신)과 자동 모니터링 미완 |
| **Knowledge GC** | ★★★☆☆ | 3단계(alloc/refcount/mark-sweep) 존재. Generational 모델 미명문화 |

### 우선순위 제안

| 순위 | 제안 | 영향 | 난이도 |
|------|------|------|--------|
| **1** | **I/O 타입 명세를 SKILL.md frontmatter에 추가** | 모든 스킬의 계약이 명시적. 새 스킬 작성 시 타입 체크 가능 | S — frontmatter 필드 추가 |
| **2** | **`/simplify` SKILL.md 작성 + `/go` #6.5 슬롯** | L0 파이프라인 완성 | S — 기존 패턴 따르기 |
| **3** | **지식 GC 모델 명문화** (`_middleware` SKILL.md에 추가) | G6 해소. 3경로의 역할 구분 명확화 | S — 문서 추가 |
| **4** | **Scheduler Skill 설계** | G2+G3 동시 해소. 자율 실행의 핵심 | L — 새 개념 도입, `/wip` 확장 필요 |
| **5** | **Event Model 확장** (L1 성숙화) | Hook 기반 반응형 동작. aspect 자동 삽입 | L — 아키텍처 변경 |

---

## 4. Cynefin 도메인 판정

🟡 **Complicated**

근거: 시스템의 구조는 이미 존재하며 잘 작동한다. 분석하면 개선점이 좁혀진다. 하지만 "Scheduler Skill"과 "Event Model 확장"은 새로운 개념 도입이 필요하여 일부 Complex 요소가 섞여 있다. 제안 1-3은 Clear, 제안 4-5는 Complicated~Complex.

---

## 5. 인식 한계 (Epistemic Status)

- 이 분석은 **SKILL.md 정적 분석**에 기반한다. 실제 `/auto` 실행 로그에서 빈칸으로 인한 실패 사례를 확인하지 못했다.
- 컴파일러/GC/면역 체계 유비는 **구조적 동형성**을 주장하는 것이지, 이 시스템이 그것들을 의도적으로 모방했다는 주장이 아니다. 유비가 과도하게 적용되면 실체와 괴리될 수 있다.
- `/wip`이 실제로 Clear에 도달한 사례가 git log에 있는지 확인하지 않았다. TE2(wip→project 포맷 불일치)는 이론적 가능성이다.
- 제안된 "Scheduler Skill"은 개념 수준이다. 구체적인 스케줄링 알고리즘(priority queue? round-robin? deadline-driven?)은 별도 설계 필요.

---

## 6. 열린 질문 (Complex Questions)

1. **Scheduler의 판단 기준은 무엇이어야 하는가?** — STATUS.md의 Active Focus? 백로그 항목의 age? 사용자가 설정한 priority? 이것은 "운영체제의 스케줄링 정책" 선택과 동일한 문제다.
2. **I/O 타입을 강제할 메커니즘이 필요한가?** — frontmatter에 타입을 적는 것은 문서화일 뿐이다. 실제로 "이 스킬의 output이 다음 스킬의 input 타입과 맞는지" 검증하는 메커니즘(=타입 체커)을 만들 것인가, 문서화만으로 충분한가?
3. **Event Model을 확장하면 Hook의 복잡도가 관리 가능한가?** — 현재 Hook 3개는 단순하다. 이벤트를 늘리면 Hook 간 상호작용, 실행 순서, 에러 처리가 급격히 복잡해질 수 있다.

---

> **3줄 요약**
> 48개 스킬 시스템은 컴파일러(순차 변환), 타입 시스템(I/O 계약), 면역 체계(실패 대응), GC(지식 생명주기)의 네 가지 구조적 동형성을 가진다.
> 모든 빈칸(G1-G6)의 공통 근인은 "스케줄러 부재" — 파이프라인 내 순서는 완벽하지만 파이프라인 간 전환 판단이 없다.
> 가장 ROI 높은 개선: (1) I/O 타입 frontmatter 명세, (2) /simplify 슬롯 추가, (3) 지식 GC 모델 명문화.
