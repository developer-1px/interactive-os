# 비결정적 함수 패러다임: AI 협업의 컴퓨터 과학

> LLM과 함께 일하는 것은 **비결정적 함수를 프로그래밍하는 것**이다.
> 이 문서는 AI 코딩 협업에서 등장하는 개념들을 컴퓨터 과학과 소프트웨어 공학의 기존 이론으로 매핑한다.

---

## 1. 패러다임 전환: 결정적 → 비결정적

소프트웨어 개발의 기본 단위는 **함수**다.

```typescript
// 결정적 함수 — 같은 입력이면 같은 출력
function add(a: number, b: number): number {
  return a + b  // 항상 동일. 수학적으로 증명 가능.
}
```

60년간 소프트웨어 공학의 모든 도구 — 타입 시스템, 테스트, 정적 분석, 파이프라인 — 는 이 결정적 함수를 전제로 설계되었다.

LLM이 등장하면서, 개발자의 도구 상자에 새로운 종류의 함수가 추가되었다:

```typescript
// 비결정적 함수 — 같은 입력이어도 다른 출력
function llm(prompt: string): string {
  return ???  // 실행할 때마다 다르다. 증명 불가.
}
```

이것은 **Nondeterministic Finite Automaton (NFA)**의 개념과 구조적으로 동일하다. Rabin과 Scott(1959)이 정의한 NFA에서, 하나의 상태와 입력에 대해 여러 가능한 전이(transition)가 존재한다. LLM도 마찬가지다 — 하나의 프롬프트에 대해 여러 가능한 출력이 존재한다.

결정적 함수에서 비결정적 함수로의 전환이 만드는 변화:

| | 결정적 함수 | 비결정적 함수 (LLM) |
|---|---|---|
| **반환 타입** | `T` | `T \| Error \| Hallucination \| Runaway` |
| **검증** | `assert(f(x) === y)` | **출력이 계약을 만족하는가?** |
| **합성** | `g(f(x))` — 자유롭게 합성 | 합성하면 **오차가 누적** |
| **실패** | 스택 트레이스로 원인 추적 | **자기가 실패한 줄 모른다** |
| **재현** | 동일 입력 → 동일 출력 | 동일 입력 → **매번 다른 출력** |
| **신뢰 근거** | 수학적 증명, 타입 시스템 | **경험적 계약 + 사후 검증** |

이 차이 하나에서 모든 새로운 개념이 파생된다.

---

## 2. 스킬(Skill): 비결정적 함수 + 계약

### 문제: 비결정적 함수를 날것으로 쓸 수 없다

```typescript
// 날것의 LLM 호출 — 무엇이 나올지 보장할 수 없다
const result = llm("테스트를 쓰고 구현도 해줘")
// → 테스트만 나올 수도. 구현만 나올 수도. 둘 다 나오되 테스트가 엉망일 수도.
```

비결정적 함수를 날것으로 호출하면, 출력의 범위가 무한하다. 이것을 소프트웨어 공학에서는 **사양(specification) 없는 구현**이라 부른다.

### 해법: Design by Contract

Bertrand Meyer(1992)의 **Design by Contract (DbC)**는 함수의 호출자(client)와 구현자(supplier) 사이에 **계약(contract)**을 정의한다:

- **Precondition** (전제조건): 호출 전에 참이어야 하는 조건
- **Postcondition** (사후조건): 실행 후에 참이어야 하는 조건
- **Invariant** (불변조건): 실행 전후 모두 참이어야 하는 조건

이것을 Tony Hoare(1969)의 **Hoare Triple**로 표현하면:

```
{P} C {Q}

P = Precondition (전제조건)
C = Command (실행)
Q = Postcondition (사후조건)

"P가 참인 상태에서 C를 실행하면, Q가 참이 된다."
```

**스킬(Skill)**은 이 계약을 비결정적 함수에 씌운 것이다:

```typescript
// 스킬 = 비결정적 함수 + 계약
const red = defineSkill({
  name: "/red",

  // Hoare Triple: {P} C {Q}
  precondition: "spec.md가 존재한다",            // P
  command: "실패하는 테스트를 작성하라",            // C (비결정적)
  postcondition: "*.test.ts가 존재하고 FAIL한다",  // Q

  // Design by Contract
  invariant: "src/ 프로덕션 코드를 수정하지 않는다",
})
```

함수 자체는 여전히 비결정적이다. 같은 `spec.md`를 주어도 매번 다른 테스트 코드가 나온다. 그러나 **계약이 출력의 범위를 제한**한다:

- 출력은 반드시 `.test.ts` 파일이어야 한다 (postcondition)
- 그 파일은 반드시 실패해야 한다 (postcondition)
- 프로덕션 코드는 건드리지 않는다 (invariant)

비결정성 자체를 제거한 것이 아니다. **비결정성의 범위를 계약으로 바운딩**한 것이다.

### 스킬의 분류표

결정적 함수의 세계에서 함수가 순수 함수, 부수효과 함수, 생성자 등으로 분류되듯, 스킬도 계약의 성격에 따라 분류된다:

| 카테고리 | 스킬 예시 | Precondition (P) | Postcondition (Q) | Invariant |
|----------|----------|-------------------|--------------------|-----------| 
| **생성** | `/red` | spec.md 존재 | *.test.ts FAIL | src/ 미수정 |
| **변환** | `/green` | *.test.ts FAIL | *.test.ts PASS | 테스트 미수정 |
| **검증** | `/audit` | 코드 존재 | 감사 보고서 | 코드 미수정 |
| **분석** | `/discussion` | 질문 존재 | Warrant 목록 | 코드 미수정 |
| **분해** | `/divide` | Goal 존재 | Work Package 트리 | 코드 미수정 |
| **복구** | `/why` | 실패 상태 | WHY Report | 코드 미수정 |

주목할 점: **대부분의 스킬에 "코드 미수정" 불변조건**이 있다. 이것은 비결정적 함수의 폭발 반경(blast radius)을 제한하기 위한 설계다. 코드를 수정하는 스킬(`/green`, `/refactor`)은 소수이며, 그마저도 강한 사전/사후조건으로 바운딩된다.

---

## 3. 하네스(Harness): 비결정적 함수의 안전한 합성

### 문제: 비결정적 함수는 자유롭게 합성할 수 없다

결정적 함수의 합성은 단순하다:

```typescript
// 결정적 합성 — 각 단계의 출력 = 다음 단계의 입력. 오차 없음.
const result = pipe(parse, validate, transform, render)(input)
```

비결정적 함수의 합성은 위험하다:

```typescript
// 비결정적 합성 — 각 단계에서 오차가 발생하고, 다음 단계에서 증폭된다.
const result = pipe(llm_spec, llm_test, llm_impl, llm_verify)(input)
// → 1단계의 미묘한 오류가 4단계에서 파국이 된다.
```

이것은 항해의 **Dead Reckoning**(추측 항법)과 같다. GPS 없이 속도와 방향만으로 위치를 추정하면, 오차가 누적되어 실제 위치에서 점점 멀어진다.

### 해법: Stage-Gate + Circuit Breaker + Checkpoint

비결정적 함수를 안전하게 합성하려면 세 가지 메커니즘이 필요하다.

#### 3.1 Stage-Gate: 각 단계 사이의 품질 관문

Robert Cooper(1990)의 **Stage-Gate System**은 제품 개발을 단계(Stage)로 분할하고, 각 단계 사이에 관문(Gate)을 배치하여, 기준을 충족해야만 다음 단계로 진행할 수 있게 한다.

비결정적 함수의 합성에서 Gate는 **각 스킬의 postcondition 검증**이다:

```typescript
const harness = defineHarness([
  { skill: "/spec",   gate: () => fileExists("spec.md") },
  { skill: "/red",    gate: () => testResult("*.test.ts") === "FAIL" },
  { skill: "/green",  gate: () => testResult("*.test.ts") === "PASS" },
  { skill: "/verify", gate: () => tsc() === 0 && lint() === 0 },
])

// 각 gate를 통과해야만 다음 skill이 실행된다.
// gate 실패 → 해당 skill 재실행 또는 복구 경로로 분기.
```

결정적 합성에서 `pipe`가 무조건 다음 단계로 연결하는 반면, Stage-Gate 합성에서는 **Gate가 통과할 때만** 다음으로 진행한다. Gate가 비결정성의 누적을 매 단계에서 차단한다.

#### 3.2 Circuit Breaker: 무한 루프 차단

Michael Nygard(2007)의 **Circuit Breaker** 패턴은 분산 시스템에서 장애가 전파되는 것을 방지한다. 세 상태로 동작한다:

| 상태 | 동작 |
|------|------|
| **Closed** (정상) | 요청을 통과시키고 실패를 모니터링 |
| **Open** (차단) | 실패 임계치 도달 → 요청을 즉시 거부하여 시스템 보호 |
| **Half-Open** (시험) | 일정 시간 후 제한적으로 요청을 허용하여 복구 확인 |

비결정적 함수에서 Circuit Breaker가 필요한 이유: **LLM은 자기가 실패한 줄 모른다.** 결정적 함수는 에러를 던지지만, LLM은 잘못된 출력을 자신있게 내놓는다. 수정 → 실패 → 다른 수정 → 실패 — 이 무한 루프를 외부에서 끊어야 한다.

```typescript
const circuitBreaker = defineCircuitBreaker({
  threshold: 3,        // 같은 패턴의 실패 3회
  timeout: "1 session", // 차단 후 다음 세션까지 대기

  onOpen: "/ban",       // 차단 시: 실패록 작성 + 인수인계
  onHalfOpen: "/why",   // 시험 시: 근본 원인 분석 후 재시도
})
```

#### 3.3 Checkpoint/Restart: 세션 경계를 넘는 상태 보존

내결함성(Fault Tolerance) 시스템에서 **Checkpoint/Restart**는 프로세스의 상태를 주기적으로 저장하여, 장애 발생 시 마지막 체크포인트에서 재개할 수 있게 한다.

LLM에서 이것이 필요한 이유는 독특하다: **LLM의 "장애"는 세션 종료(context reset)**이다. 일반 프로세스의 크래시와 달리, LLM은 매 세션 **의도적으로** 상태가 소멸한다.

```typescript
// BOARD.md = Checkpoint 파일
const checkpoint = {
  context: "TestPage가 DOM 없이 검증을 달성한다",
  completed: ["T1: 29/29 ALL GREEN", "T2: APG migrated"],
  current: ["T3: triggerRegistry", "T4: zoneContext"],
  unresolved: ["hover 이벤트 시뮬레이션 가능한가?"],
}

// 새 세션 시작 → Checkpoint에서 복원
function resume(board: Checkpoint): NextSkill {
  const firstIncomplete = board.current.find(t => !t.done)
  return route(firstIncomplete)  // 중단된 지점에서 재개
}
```

#### 하네스의 전체 구조

세 메커니즘을 합치면 하네스의 전체 구조가 나온다:

```
┌─────────────── Harness ───────────────┐
│                                        │
│   Skill₁ ──Gate──→ Skill₂ ──Gate──→ Skill₃
│      ↑                                 │
│      │         Circuit Breaker         │
│      │    (3회 실패 → Open → /ban)      │
│      │                                 │
│      └──── Recovery Path ──────────────┘
│            /why  /reflect  /redteam
│                                        │
│   ════════ Checkpoint (BOARD.md) ═════ │
│   세션 경계를 넘어 상태를 보존           │
└────────────────────────────────────────┘
```

이것은 소프트웨어 아키텍처에서 Hector Garcia-Molina와 Kenneth Salem(1987)이 제안한 **Saga 패턴**과 구조적으로 동일하다. Saga는 장기 실행 트랜잭션을 분해하고, 각 단계에 보상 트랜잭션(compensating transaction)을 정의하여, 실패 시 부분 롤백이 가능하게 한다. 하네스의 복구 경로(`/why`, `/reflect`)가 바로 보상 트랜잭션이다.

---

## 4. 오라클 문제: "맞는지 틀린지 누가 판단하는가?"

### Test Oracle Problem

소프트웨어 테스팅에서 **오라클 문제(Oracle Problem)**는 "시스템의 관찰된 동작이 올바른지를 어떻게 판단하는가?"라는 근본적 질문이다 (Barr et al., *IEEE TSE*, 2015).

결정적 함수에서 오라클은 단순하다:

```typescript
// 결정적 오라클 — 기대값과 비교하면 끝
expect(add(2, 3)).toBe(5)
```

비결정적 함수에서 오라클은 근본적으로 다르다:

```typescript
// 비결정적 오라클 — 기대값이 아니라 속성(property)을 검증
const test = llm("Button 클릭 시 드롭다운 열기 테스트를 작성하라")

// ❌ 이건 불가능 — 매번 다른 코드가 나온다
expect(test).toBe(exactExpectedCode)

// ✅ 이건 가능 — 속성(property)을 검증
expect(test).toContain(".test.ts")    // 파일 형식
expect(test).toMatch(/expect|assert/) // 단언문 포함
expect(runTest(test)).toBe("FAIL")    // 실제로 실패하는가
```

이것은 Koen Claessen과 John Hughes(2000)의 **Property-Based Testing**(QuickCheck)과 같은 접근이다. 구체적인 기대값 대신 **속성(property)**을 정의하고, 무작위 입력에 대해 속성이 항상 성립하는지를 검증한다.

### 스킬의 Gate = Property-Based Oracle

스킬의 Gate가 바로 이 Property-Based Oracle이다:

| 스킬 | Gate (Property) | 검증 방법 |
|------|-----------------|----------|
| `/red` | "테스트가 존재하고 실패한다" | `vitest run → FAIL` |
| `/green` | "테스트가 전부 통과한다" | `vitest run → PASS` |
| `/verify` | "타입 에러가 0이다" | `tsc → 0 errors` |
| `/audit` | "계약 위반이 없다" | 감사 보고서에 🔴 없음 |

이 속성들은 **출력의 구체적 내용과 무관**하다. 어떤 테스트 코드가 나왔든, "실패하는가?"만 묻는다. 비결정성을 허용하면서도 **정확성의 하한(lower bound)**을 보장하는 것이다.

### 오라클의 한계: Gödel과의 유사성

비결정적 함수의 오라클에는 근본적 한계가 있다: **LLM은 자기 출력의 품질을 자기가 평가할 수 없다.** 평가 자체도 비결정적 함수이기 때문이다.

```typescript
// 자기 참조 오라클의 불가능성
const output = llm(prompt)
const evaluation = llm("이 출력이 올바른가? " + output)
// → evaluation 자체도 비결정적. 틀린 출력을 "올바르다"고 할 수 있다.
```

이것은 Gödel의 불완전성 정리와 구조적으로 유사하다 — 충분히 강력한 체계는 자기 자신의 일관성을 증명할 수 없다. 따라서 비결정적 함수의 오라클은 항상 **외부**에 있어야 한다:

| 오라클 유형 | 예시 | 신뢰도 |
|------------|------|--------|
| 기계적 외부 오라클 | `tsc`, `vitest`, `lint` | 높음 (결정적) |
| 구조적 외부 오라클 | Gate (postcondition 속성 검증) | 중간 (속성 범위 내) |
| 인간 외부 오라클 | 코드 리뷰, 수동 승인 | 높음 (고비용) |
| **자기 참조 오라클** | **LLM이 자기 출력 평가** | **낮음 (신뢰 불가)** |

---

## 5. 외부 기억(Exocortex): 상태 없는 함수에 기억을 부여하기

### 문제: 순수 함수는 학습하지 않는다

순수 함수(pure function)는 외부 상태에 의존하지 않고, 외부 상태를 변경하지 않는다. LLM도 본질적으로 순수 함수다 — 주어진 컨텍스트(입력)에서 출력을 생성할 뿐, **자기 가중치를 변경하지 않는다.**

```typescript
// LLM = 순수 함수 (상태 없음)
function llm(context: string): string {
  // weights는 고정. context만으로 출력 결정.
  return generate(frozenWeights, context)
}

// 세션 N에서 배운 것이 세션 N+1에 전달되지 않는다.
llm(context_N)   // "createOsPage는 함정이다" 발견
llm(context_N1)  // 그 발견을 모른다. 같은 함정에 빠진다.
```

### 해법: Transactive Memory System

Daniel Wegner(1987)의 **Transactive Memory System (TMS)**은 그룹의 지식이 개인의 두뇌에 분산 저장되는 현상을 설명한다. 각 구성원은 "누가 무엇을 아는가"(메타메모리)를 공유하며, 필요할 때 해당 구성원에게 질문한다.

LLM 파이프라인에서 이것과 동일한 구조가 구현된다:

```typescript
// Knowledge Middleware = Transactive Memory System
const middleware = defineMiddleware({
  // 시작: 관련 지식을 외부 메모리에서 로딩 (encoding)
  onStart: (skill) => {
    const topics = skill.relatedTopics  // /red → testing-hazards.md
    return loadKnowledge(topics)         // 이전 세션의 발견 로딩
  },

  // 실행 중: 새 발견을 누적 (storage)
  onDiscover: (discovery) => {
    classify(discovery)  // Pattern | Hazard | Definition | Principle
    stage(discovery)     // 영구 반영 대기열에 추가
  },

  // 종료: 영구 반영 (retrieval 준비)
  onEnd: (staged) => {
    persist(staged)  // knowledge/*.md에 저장
    // → 다음 세션의 onStart에서 자동 로딩됨
  },
})
```

이것이 만드는 순환:

```
세션 N:   load(knowledge) → execute(skill) → discover(new) → save(knowledge)
                                                                    ↓
세션 N+1: load(knowledge) → execute(skill) → discover(new) → save(knowledge)
                                                                    ↓
세션 N+2: ...
```

**핵심 통찰**: LLM 자체는 학습하지 않는다(순수 함수). 그러나 **외부 메모리가 변한다.** LLM의 입력(context)에 외부 메모리가 포함되므로, 입력이 달라져 출력이 달라진다. 함수의 정의를 바꾸지 않고 **환경(environment)을 바꿔서 행동을 변경**하는 것이다 — 이것은 함수형 프로그래밍에서 클로저(closure)가 자유 변수(free variable)를 캡처하는 것과 같은 메커니즘이다.

```typescript
// 클로저 비유: 함수는 같지만 환경이 다르다
function createSession(knowledge: Knowledge) {
  // knowledge = 자유 변수 (외부 메모리)
  return function llm(prompt: string): string {
    return generate(frozenWeights, knowledge + prompt)
    //                             ^^^^^^^^^ 환경이 다르면 출력이 다르다
  }
}

const session1 = createSession(knowledge_v1)  // testing-hazards 3건
const session2 = createSession(knowledge_v2)  // testing-hazards 5건 (2건 추가)
// session1과 session2는 같은 함수지만, 다른 knowledge를 캡처했으므로 다르게 동작한다.
```

J.C.R. Licklider(1960)는 *Man-Computer Symbiosis*에서 인간의 인지를 외부 시스템으로 확장하는 개념을 제안했다. 이 아이디어는 이후 **Exocortex**(외부 두뇌)라는 이름으로 발전했다. Knowledge Middleware는 LLM을 위한 Exocortex — 비결정적 함수에 외부 기억을 부여하여, 세션 간 일관성을 확보하는 메커니즘이다.

### 기억의 생명주기: Garbage Collection

외부 기억은 쌓이기만 하면 해가 된다. 오래된 정보가 새 세션의 컨텍스트를 오염시키면, 비결정적 함수의 출력이 과거의 유효하지 않은 패턴에 끌린다.

이것은 프로그래밍 언어의 **Garbage Collection (GC)**과 같은 문제다. 더 이상 참조되지 않는 객체를 회수하듯, 더 이상 유효하지 않은 지식을 제거해야 한다.

```typescript
const gc = defineKnowledgeGC({
  retire: (doc) => !doc.isReferencedByActiveProject,  // 참조 없음 → 제거
  archive: (doc) => doc.age > threshold,               // 일정 기간 경과 → 보관
  compact: (docs) => dedup(docs),                      // 중복 제거
})
```

---

## 6. 자기 유사성(Self-Similarity): 같은 패턴이 모든 스케일에서 반복된다

### 프랙탈 구조

비결정적 함수 패러다임에서 발견되는 가장 흥미로운 속성은 **자기 유사성(self-similarity)**이다. 같은 문제와 같은 해법이 스케일을 바꿔 반복된다.

| 스케일 | 비결정적 함수 | 문제 | 해법 |
|--------|-------------|------|------|
| **Micro** (단일 호출) | 하나의 스킬 | 출력 불확실 | 계약(DbC) |
| **Meso** (세션) | 스킬의 합성 | 오차 누적 | Gate + Circuit Breaker |
| **Macro** (프로젝트) | 세션의 합성 | 상태 소실 | Checkpoint + Exocortex |

세 스케일에서 **동일한 처방**이 적용된다:

| 처방 | Micro | Meso | Macro |
|------|-------|------|-------|
| **분리** | 하나의 스킬 = 하나의 산출물 | 세션 경계로 스킬 격리 | 프로젝트 경계로 컨텍스트 격리 |
| **게이트** | Postcondition | Stage-Gate | Audit + Doubt |
| **복구** | 재실행 | Circuit Breaker | Checkpoint/Restart |

이것은 **Sherry Brown과 Kathleen Eisenhardt(1997)**가 조직 이론에서 발견한 Self-similar Organization (자기 유사 조직)과 같은 구조다 — 스타트업의 팀 구조와 대기업의 사업부 구조가 같은 원리로 동작하는 것처럼, 비결정적 함수를 다루는 원리도 스케일에 무관하게 동일하다.

### 보편 불변(Universal Invariant)

모든 스케일에서 성립하는 하나의 불변조건:

> **비결정적 함수의 합성에서, 각 단계의 출력은 검증 없이 다음 단계의 입력이 될 수 없다.**

이것은 결정적 함수 세계의 `pipe(f, g, h)`가 비결정적 함수 세계에서는 `pipe(f, gate, g, gate, h, gate)`로 변환됨을 의미한다. 자유로운 합성이 **게이트 합성(gated composition)**으로 대체된다.

---

## 종합: 패러다임 대비표

| 개념 | 결정적 함수 세계 | 비결정적 함수 세계 (LLM) | 이론적 근거 |
|------|-----------------|------------------------|------------|
| **기본 단위** | 함수 `f(x) = y` | 스킬 `f(x) = {y₁...yₙ} ∩ Contract` | NFA (Rabin & Scott, 1959) |
| **사양** | 타입 시그니처 | Hoare Triple `{P} C {Q}` | Hoare (1969), Meyer (1992) |
| **합성** | `pipe` (자유) | Gate 합성 (검증 필수) | Stage-Gate (Cooper, 1990) |
| **장애 차단** | `try/catch` | Circuit Breaker | Nygard (2007) |
| **트랜잭션** | ACID | Saga (보상 트랜잭션으로 복구) | Garcia-Molina & Salem (1987) |
| **검증** | `assert(x === y)` | Property-Based Testing | Claessen & Hughes (2000) |
| **오라클** | 기대값 비교 | 속성 검증 (외부 오라클 필수) | Barr et al. (2015) |
| **기억** | 변수, DB | Exocortex (외부 메모리) | Wegner (1987), Licklider (1960) |
| **파이프라인** | CI/CD | 하네스 (Gate + Checkpoint + Recovery) | Saga + Stage-Gate 합성 |
| **스케일** | 계층화 (module → package → system) | 자기 유사 (같은 패턴, 다른 스케일) | Brown & Eisenhardt (1997) |

---

## References

1. Rabin, M.O. & Scott, D. "Finite Automata and Their Decision Problems." *IBM Journal of Research and Development*, 3(2), 114-125, 1959.
2. Hoare, C.A.R. "An Axiomatic Basis for Computer Programming." *Communications of the ACM*, 12(10), 576-580, 1969.
3. Meyer, Bertrand. "Applying Design by Contract." *IEEE Computer*, 25(10), 40-51, 1992.
4. Cooper, Robert G. "Stage-Gate Systems: A New Tool for Managing New Products." *Business Horizons*, 33(3), 44-54, 1990.
5. Nygard, Michael T. *Release It! Design and Deploy Production-Ready Software.* Pragmatic Bookshelf, 2007.
6. Garcia-Molina, Hector & Salem, Kenneth. "Sagas." *ACM SIGMOD Record*, 16(3), 249-259, 1987.
7. Claessen, Koen & Hughes, John. "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs." *ICFP*, 2000.
8. Barr, Earl T. et al. "The Oracle Problem in Software Testing: A Survey." *IEEE Transactions on Software Engineering*, 41(5), 507-525, 2015.
9. Wegner, Daniel M. "Transactive Memory: A Contemporary Analysis of the Group Mind." *Theories of Group Behavior*, 185-208, 1987.
10. Licklider, J.C.R. "Man-Computer Symbiosis." *IRE Transactions on Human Factors in Electronics*, HFE-1, 4-11, 1960.
11. Brown, Sherry L. & Eisenhardt, Kathleen M. "The Art of Continuous Change: Linking Complexity Theory and Time-Paced Evolution in Relentlessly Shifting Organizations." *Administrative Science Quarterly*, 42(1), 1-34, 1997.
