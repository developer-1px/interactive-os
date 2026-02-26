# 의사결정 프레임워크 레퍼런스

> 워크플로우와 규칙에서 참조되는 의사결정 기법 8건의 정의·출처·용법.

---

## Cynefin Framework

> 문제의 본질에 따라 대응 전략을 선택하는 상황 인식 프레임워크. 4개 도메인(Clear, Complicated, Complex, Chaotic)으로 분류한다.

**출처**: Dave Snowden (1999), Cynefin Centre
**우리의 용법**: 모든 판단 분기의 1차 게이트. 코드를 고치기 전에 Cynefin 도메인을 판단하고, 도메인에 따라 행동 전략이 달라진다. Clear→증명+실행, Complicated→분석→실행, Complex→탐침(Probe)→감지→대응, Chaotic→봉쇄→분석. `/discussion`의 `🚀 Next` 판정, `/divide`의 분해 기준, `/inbox`의 분류 기준으로 사용.
**참조**: `CLAUDE.md` 부록, `rules.md` Working#1, `discussion.md`, `divide.md`, `go.md`, `inbox.md`, `solve.md`

### 도메인별 전략 매핑

| 도메인 | 전략 패턴 | 워크플로우 행동 |
|--------|----------|----------------|
| Clear | Sense → Categorize → Respond | `/go` 직행 |
| Complicated | Sense → Analyze → Respond | `/divide`로 분해 |
| Complex | Probe → Sense → Respond | `/discussion` 계속 |
| Chaotic | Act → Sense → Respond | `/fix` 즉시 봉쇄 |

---

## MECE (Mutually Exclusive, Collectively Exhaustive)

> 항목들이 서로 겹치지 않으면서(ME) 전체를 빠짐없이 포괄(CE)하는 분류 원칙.

**출처**: Barbara Minto, *The Minto Pyramid Principle* (1987), McKinsey & Company
**우리의 용법**: `/divide`에서 Work Package를 분해할 때 MECE 검증을 한다. 겹치는 WP는 에이전트가 같은 작업을 두 번 하게 만들고, 빠진 WP는 나중에 발견되어 스코프를 흔든다. `/spec`의 BDD 시나리오 열거, `/plan`의 변환 명세표에서도 MECE를 적용한다.
**참조**: `divide.md`, `plan.md`, `spec.md`

---

## Issue Tree

> 핵심 질문(Key Question)을 MECE 하위 질문으로 재귀 분해하는 구조화 기법. 최종 잎(leaf)이 검증 가능한 가설이 된다.

**출처**: McKinsey Problem Solving framework, Barbara Minto
**우리의 용법**: `/divide`에서 Goal → Sub-goal → Work Package로 분해할 때 Issue Tree 구조를 따른다. 각 잎 노드가 하나의 `/go` 실행 단위가 된다. "왜 안 되지?"를 구조화할 때 `/why`에서도 사용.
**참조**: `divide.md`, `why.md`

---

## Decision Matrix (PMBOK)

> 선택지를 기준(criteria)별로 점수화하여 비교하는 의사결정 도구. 가중치를 부여하여 정량적 비교가 가능하다.

**출처**: PMI, *A Guide to the Project Management Body of Knowledge* (PMBOK Guide)
**우리의 용법**: `/discussion`에서 여러 선택지가 나왔을 때, 감으로 고르지 않고 기준별 비교표를 작성한다. 검증 제안서(`verification-level-up`)의 우선순위 매트릭스가 Decision Matrix 형태. `/spec`의 Decision Table도 이 계열.
**참조**: `discussion.md`, `spec.md`

---

## Integrative Thinking

> 대립하는 두 모델의 장점을 취하면서 양쪽의 단점을 해소하는 제3의 해법을 창조하는 사고법.

**출처**: Roger Martin, *The Opposable Mind* (2007)
**우리의 용법**: `/conflict`에서 대립하는 가치·패턴·방향이 발견됐을 때, "A냐 B냐"의 이분법에서 벗어나 통합 해법을 모색한다. 예: "앱 자유도 vs OS 통제" 갈등에서 "Config 선언으로 앱이 의도를 표현하고, OS가 실행을 보장"하는 통합.
**참조**: `conflict.md`, `discussion.md`

---

## Problem Reframing

> 주어진 문제의 프레이밍 자체를 의심하고, 다른 관점에서 재정의하는 기법. "올바른 문제를 풀고 있는가?"를 검증한다.

**출처**: Thomas Wedell-Wedellsborg, *What's Your Problem?* (2020); Tversky & Kahneman (Framing Effect)
**우리의 용법**: `/discussion`의 Expert Toolkit 중 "Reframing" 기법. 논의가 한 관점에 고착됐을 때 사용. `/elicit`에서 사용자의 표면 요청 뒤의 숨겨진 의도를 추출할 때 문제 자체를 재정의한다. `/why`에서 "왜 막혔나?"를 "정말 이 문제를 풀어야 하나?"로 전환.
**참조**: `discussion.md`, `elicit.md`, `why.md`

---

## Probe-Sense-Respond (Complex 전략)

> Cynefin Complex 도메인의 대응 전략. 먼저 안전한 실험(Probe)을 하고, 결과를 감지(Sense)한 뒤, 적응(Respond)한다.

**출처**: Dave Snowden, Cynefin Framework (1999)
**우리의 용법**: Complex로 판정된 항목에서 "분석만으로는 답이 안 나올 때" 사용. `/solve`에서 XP Spike로 작은 실험을 먼저 하고, 결과를 보고 방향을 정한다. `/discussion`에서 `🚀 Next`가 계속 Complex이면 Probe 질문을 던진다.
**참조**: `CLAUDE.md` 부록 Cynefin, `solve.md`, `discussion.md`

---

## Sense-Analyze-Respond (Complicated 전략)

> Cynefin Complicated 도메인의 대응 전략. 상황을 감지(Sense)하고, 전문가적 분석(Analyze)을 한 뒤, 적절히 대응(Respond)한다.

**출처**: Dave Snowden, Cynefin Framework (1999)
**우리의 용법**: Complicated로 판정된 항목에서 "선택지가 있지만 분석하면 좁혀진다"일 때 사용. `/divide`로 분해하거나 `/discussion`에서 분석적 논의를 통해 Clear까지 좁힌다. `/spec`에서 Decision Table로 선택지를 분석하는 것이 이 전략의 구체화.
**참조**: `CLAUDE.md` 부록 Cynefin, `divide.md`, `discussion.md`, `spec.md`
