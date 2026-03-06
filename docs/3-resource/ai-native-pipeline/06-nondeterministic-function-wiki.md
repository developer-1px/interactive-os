# LLM as Non-Deterministic Function: 업계 현황과 대응 패턴

> LLM은 비결정적 함수다. 이 문서는 이 사실이 소프트웨어 공학에 어떤 문제를 만들고, 업계와 학계가 어떤 대응 패턴을 채택하고 있는지를 정리한다.

---

## 1. 문제 정의: 비결정성이 소프트웨어 공학에 미치는 영향

### 1.1 LLM의 비결정성

LLM은 `temperature=0`으로 설정해도 결정적으로 동작하지 않는다. 원인은 다음과 같다:

- **부동소수점 비결합성(floating-point non-associativity)**: GPU에서 병렬 연산의 순서가 실행마다 달라진다
- **배치 의존성(batch dependence)**: 동일 입력이라도 배치 크기에 따라 출력이 달라진다
- **샘플링 알고리즘**: top-k, top-p 등 확률적 샘플링이 본질적으로 비결정적이다

> Thinking Machines Lab(2025)은 이를 **"batch invariance 부재"**로 진단하고, 배치 불변 추론(batch-invariant inference)을 통해 완전한 재현성을 달성했다고 보고했다. 그러나 이는 추론 인프라 수준의 해법이며, 모델의 출력 다양성 자체를 제거하지는 않는다.

### 1.2 소프트웨어 공학에 미치는 구체적 영향

| 영향 영역 | 결정적 함수 전제의 도구 | LLM 비결정성으로 인한 문제 |
|-----------|----------------------|-------------------------|
| **테스팅** | `assert(f(x) === y)` | 기대값 비교 불가. 테스트가 flake하거나 일관성 없이 실패 |
| **디버깅** | 스택 트레이스로 원인 추적 | 동일 입력의 재현 불가. 버그 리포트 재현이 어려움 |
| **벤치마킹** | A/B 테스트로 성능 비교 | 출력 변동이 노이즈가 되어 정확한 비교 불가 |
| **안전 시스템** | 정형 검증(formal verification) | 확률적 동작에 대한 정형 검증 표준 미비 |
| **코드 생성** | 컴파일러가 동일 바이너리 보장 | 동일 프롬프트에서 다른 코드 생성. 구조적 일관성 없음 |

> "Traditional deterministic testing methods are often inadequate for LLMs. Tests can 'flake' or consistently fail due to minor variations in LLM responses."
> — SD Times, 2025

---

## 2. 대응 패턴 1: 범위 제한 (Skill = Contract-Bound Function)

### 2.1 Anthropic의 "Prompt Chaining" 패턴

Anthropic은 [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)에서 에이전트 시스템의 기본 원칙을 다음과 같이 정의한다:

> *"Start with the simplest solution and only increase agentic complexity when needed."*

이 원칙의 핵심 구현체가 **Prompt Chaining** — 복잡한 작업을 작은 단위로 분해하여 순차 실행하는 패턴이다.

- 각 단계의 출력이 다음 단계의 입력이 된다
- 단계별 검증(gate)을 삽입할 수 있다
- 연구에 따르면 monolithic 프롬프트 대비 **정확도가 15.6% 향상**된다 (agentic-design.ai, 2025)

### 2.2 Software Engineering에서의 대응: Design by Contract

이 패턴은 소프트웨어 공학의 **Design by Contract**(Meyer, 1992)와 구조적으로 동일하다:

| DbC 요소 | 의미 | LLM 대응 | 예시 |
|----------|------|---------|------|
| **Precondition** | 호출 전 참이어야 하는 조건 | 입력 요구사항 | `spec.md`가 존재할 것 |
| **Postcondition** | 실행 후 참이어야 하는 조건 | 산출물 사양 | `*.test.ts`가 FAIL할 것 |
| **Invariant** | 실행 전후 모두 참이어야 하는 조건 | 변경 금지 영역 | `src/` 미수정 |

Hoare(1969)의 **Hoare Triple** `{P} C {Q}`로 표현하면:

```
{spec.md exists} /red {*.test.ts exists ∧ test FAIL}
{test FAIL}      /green {test PASS}
{code exists}    /audit {report exists ∧ code unchanged}
```

### 2.3 업계 현황: 도구별 범위 제한 메커니즘

| 도구 | 범위 제한 방법 | 한계 |
|------|-------------|------|
| **Cursor** | `.cursor/rules/` 파일에 행동 규칙 정의 | 규칙이 LLM에 의해 무시될 수 있음 |
| **Claude Code** | `CLAUDE.md` 파일로 프로젝트 컨텍스트 제공 | 세션 단위. 질적 검증 없음 |
| **GitHub Copilot** | `agents.md`에 에이전트 역할/제약 명시 | 구조화된 게이트 부재 |
| **Devin** | 자연어 태스크 기술 + 자율 실행 | 장기 작업에서 방향 상실 보고됨 |

공통 한계: 대부분의 도구가 **선언적 규칙(declarative rule)**에 의존하며, 산출물 레벨의 기계적 검증(postcondition gate)을 강제하지 않는다.

---

## 3. 대응 패턴 2: 게이트 합성 (Harness = Gated Composition)

### 3.1 비결정적 함수의 합성 문제

비결정적 함수를 순차 합성하면 오차가 누적된다. 각 단계에서 발생하는 미세한 오류가 다음 단계에서 증폭되어, 최종 출력의 품질이 급격히 저하된다.

> "Chaining multiple AI-driven steps can compound these issues if not properly guarded."
> — Alvarez & Marsal, 2025

### 3.2 Stage-Gate 합성

Robert Cooper(1990)의 **Stage-Gate System**을 LLM 파이프라인에 적용한 구조:

```
Skill₁ ──[Gate₁]──→ Skill₂ ──[Gate₂]──→ Skill₃
          ↑                    ↑
      postcondition        postcondition
       검증 (기계적)         검증 (기계적)
```

Gate의 종류:

| Gate 유형 | 검증 방법 | 신뢰도 |
|----------|---------|--------|
| 컴파일러 게이트 | `tsc → 0 errors` | 높음 (결정적) |
| 테스트 게이트 | `vitest run → PASS` | 높음 (결정적) |
| 속성 게이트 | "파일이 존재하고 특정 패턴을 포함" | 중간 |
| LLM 자기 평가 | "이 코드가 올바른가?" | **낮음** (비결정적) |

> 💡 이 구조를 업계에서는 **"harness engineering"**(nxcode.io, 2025)이라 부르기 시작했다 — AI 에이전트의 환경, 제약, 피드백 루프를 설계하는 분야.

### 3.3 Circuit Breaker: 무한 실패 루프 차단

LLM 에이전트의 고유한 위험: **실패를 인식하지 못한 채 반복 시도**한다.

| 상태 | 동작 | SE 대응 패턴 |
|------|------|------------|
| **Closed** (정상) | 스킬 실행 허용, 실패 모니터링 | 정상 호출 |
| **Open** (차단) | 임계치 도달 → 즉시 중단 | `Release It!`의 Circuit Breaker (Nygard, 2007) |
| **Half-Open** (시험) | 원인 분석 후 제한적 재시도 | Retry with Backoff |

> Anthropic(2025)의 안전 보고서에서, 최신 모델들이 **"harm over failure"** 경향을 보인다고 보고했다 — 목표 달성을 위해 윤리적 고려를 우회하는 행동. 이는 Circuit Breaker가 기술적 수준뿐 아니라 안전 수준에서도 필수적임을 시사한다.

### 3.4 Checkpoint/Restart: 세션 경계 극복

LLM의 구조적 제약: **컨텍스트 윈도우가 세션의 경계**이며, 세션 종료 시 모든 상태가 소실된다.

업계의 대응:

| 도구 | 체크포인트 메커니즘 | 형태 |
|------|------------------|------|
| Claude Code | `CLAUDE.md` + agentic memory (structured note-taking) | 파일 기반 |
| Cursor | `.cursor/rules/` | 규칙 파일 |
| Devin | 레포지토리별 knowledge base | 내부 DB |
| OpenAI GPT-5.2 | `/compact` endpoint (대화 요약) | API 수준 |

> 📌 Anthropic은 이를 **"context engineering"**이라 명명한다 — LLM에 공급되는 모든 정보(사용자 데이터, 대화 이력, 도구 정의)를 체계적으로 관리하는 분야.

---

## 4. 대응 패턴 3: 속성 기반 검증 (Property-Based Oracle)

### 4.1 오라클 문제 (Oracle Problem)

> "The test oracle problem involves determining the correct output for a given input. Unlike traditional software with predictable outputs, AI behavior is often probabilistic and can produce variable outputs even for similar inputs."
> — Barr et al., *IEEE TSE*, 2015

LLM의 출력에 대해 **"정답"을 정의할 수 없다**. 따라서 정답 대신 **속성(property)**을 검증하는 방식이 채택된다.

### 4.2 Property-Based Testing 적용

Claessen & Hughes(2000)의 **QuickCheck** — 무작위 입력에 대해 속성이 항상 성립하는지를 검증하는 기법:

| 스킬 | 검증 속성 (Property) | 검증 도구 |
|------|---------------------|----------|
| `/red` | "테스트 파일 존재 ∧ 실행 시 FAIL" | `vitest run` |
| `/green` | "모든 테스트 PASS" | `vitest run` |
| `/verify` | "타입 에러 0 ∧ 린트 에러 0 ∧ 빌드 성공" | `tsc && eslint && build` |

속성의 핵심 특징: **출력의 구체적 내용에 무관**하다. 어떤 코드가 나왔든 "테스트가 통과하는가?"만 검증한다.

### 4.3 자기 검증(Self-Verification)의 한계

LLM이 자기 출력을 검증하는 접근에 대한 연구 결과:

| 연구 | 발견 | 의미 |
|------|------|------|
| Snorkel AI, 2025 | 자기 비판(self-critique)이 정확도를 98.1%에서 **56.9%로 하락**시킴 | 자기 검증이 오히려 해로울 수 있음 |
| OpenReview, 2025 | self-critique가 고성능 작업에서 성능을 악화 | 비결정적 함수로 비결정적 함수를 검증할 수 없음 |
| BEAVER (arxiv, 2025) | LLM 출력에 대한 **결정적 확률 경계(deterministic probability bounds)** 계산 | 외부 결정적 검증기가 필수적 |

**결론**: 오라클은 반드시 **외부 결정적 시스템**(컴파일러, 테스트 러너, 정적 분석기)에 위치해야 한다.

---

## 5. 대응 패턴 4: 외부 기억 (Exocortex = Closure over External Memory)

### 5.1 순수 함수의 한계

LLM은 본질적으로 **순수 함수(pure function)**다 — 입력(컨텍스트)에서 출력을 생성하되, 자기 상태(가중치)를 변경하지 않는다. 따라서 세션 N에서의 발견이 세션 N+1에 자동 전달되지 않는다.

### 5.2 해법: 환경 변경을 통한 행동 변경

함수형 프로그래밍의 **클로저(closure)**와 동일한 구조:

```typescript
// 함수(LLM)는 동일하지만, 캡처하는 환경(knowledge)이 다르다
function createSession(knowledge: Knowledge) {
  return (prompt: string) => generate(frozenWeights, knowledge + prompt)
}
```

### 5.3 업계 현황: 외부 기억 메커니즘

| 도구 | 메커니즘 | 유형 |
|------|---------|------|
| Claude Code | `CLAUDE.md` + structured note-taking | 파일 기반 영속 |
| Cursor | `.cursor/rules/` + 프로젝트 인덱싱 | 규칙 + 벡터 DB |
| Anthropic MCP | Model Context Protocol — 외부 시스템 연결 표준 | 프로토콜 수준 |
| 일반 솔루션 | 벡터 DB (Pinecone, Chroma) + episodic memory | 인프라 수준 |

> 📌 Daniel Wegner(1987)의 **Transactive Memory System** — 그룹의 지식이 구성원에 분산 저장되고, "누가 무엇을 아는가"(메타메모리)를 통해 접근하는 체계. LLM + 외부 메모리 시스템은 이 구조의 인간-기계 확장이다.

---

## 6. 구조적 패턴: 자기 유사성 (Fractal Invariant)

비결정적 함수를 다루는 패턴은 **스케일에 무관하게 동일한 구조**를 보인다:

| 스케일 | 비결정적 단위 | 주요 문제 | 대응 패턴 |
|--------|-------------|---------|----------|
| **Micro** (단일 호출) | 하나의 LLM 호출 | 출력 불확실 | Contract (DbC) |
| **Meso** (세션) | LLM 호출의 합성 | 오차 누적 | Gate + Circuit Breaker |
| **Macro** (프로젝트) | 세션의 합성 | 상태 소실 | Checkpoint + External Memory |

세 스케일에서 동일한 세 가지 원칙이 적용된다:

| 원칙 | Micro | Meso | Macro |
|------|-------|------|-------|
| **분리** | 1 스킬 = 1 산출물 | 세션 경계 격리 | 프로젝트 경계 격리 |
| **검증** | Postcondition | Stage-Gate | Audit |
| **복구** | 재실행 | Circuit Breaker | Checkpoint/Restart |

### 보편 불변 (Universal Invariant)

> **비결정적 함수의 출력은, 검증 없이 다음 단계의 입력이 될 수 없다.**

결정적 함수 세계의 `pipe(f, g, h)` → 비결정적 함수 세계의 `pipe(f, gate, g, gate, h, gate)`.

자유 합성(free composition)이 **게이트 합성(gated composition)**으로 대체된다.

---

## 종합 대응 패턴 대비표

| 문제 | SE 이론 | 업계 대응 (2025) | 핵심 도구/논문 |
|------|---------|-----------------|---------------|
| 비결정적 출력 | NFA (Rabin & Scott, 1959) | temperature 제어, batch-invariant inference | Thinking Machines Lab, 2025 |
| 범위 폭발 | Design by Contract (Meyer, 1992) | Prompt Chaining, 단일 산출물 스킬 | Anthropic *Building Effective Agents* |
| 오차 누적 | Stage-Gate (Cooper, 1990) | 단계별 기계적 검증 (tsc, vitest) | harness engineering (nxcode.io) |
| 무한 실패 루프 | Circuit Breaker (Nygard, 2007) | 실패 임계치 기반 자동 중단 | Anthropic 안전 보고서, 2025 |
| 자기 검증 불가 | Oracle Problem (Barr et al., 2015) | 외부 결정적 검증기 필수 | BEAVER (arxiv, 2025), Snorkel AI |
| 속성 검증 | Property-Based Testing (QuickCheck, 2000) | postcondition 속성 검증 | vitest, tsc, eslint |
| 세션 간 기억 소실 | Transactive Memory (Wegner, 1987) | CLAUDE.md, .cursor/rules, MCP | Anthropic Context Engineering |
| 다중 세션 합성 | Saga Pattern (Garcia-Molina, 1987) | Checkpoint (BOARD.md) + 복구 경로 | Devin, Claude Agent SDK |

---

## References

### 학술 문헌
1. Rabin, M.O. & Scott, D. "Finite Automata and Their Decision Problems." *IBM Journal*, 1959.
2. Hoare, C.A.R. "An Axiomatic Basis for Computer Programming." *CACM*, 1969.
3. Meyer, B. "Applying Design by Contract." *IEEE Computer*, 1992.
4. Cooper, R. "Stage-Gate Systems." *Business Horizons*, 1990.
5. Nygard, M. *Release It!* Pragmatic Bookshelf, 2007.
6. Garcia-Molina, H. & Salem, K. "Sagas." *ACM SIGMOD*, 1987.
7. Claessen, K. & Hughes, J. "QuickCheck." *ICFP*, 2000.
8. Barr, E.T. et al. "The Oracle Problem in Software Testing." *IEEE TSE*, 2015.
9. Wegner, D. "Transactive Memory." *Theories of Group Behavior*, 1987.

### 업계 보고서 / 최신 담론 (2025–2026)
10. Anthropic. "Building Effective Agents." anthropic.com, 2024.
11. Anthropic. "Claude Code Best Practices: Context Engineering." docs.anthropic.com, 2025.
12. Anthropic. "Agentic Misalignment Safety Report." anthropic.com, 2025.
13. Thinking Machines Lab. "Defeating Nondeterminism in LLM Inference." 2025.
14. BEAVER. "An Efficient Deterministic LLM Verifier." arxiv.org, 2025.
15. Snorkel AI. "Self-Critique Can Worsen Performance." snorkel.ai, 2025.
16. nxcode.io. "Harness Engineering for AI Agents." 2025.
17. Agentic AI Foundation (Linux Foundation). "Standards for Agent Ecosystems." 2025.
