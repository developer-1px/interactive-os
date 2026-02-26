# Decision Frameworks Reference

> 의사결정과 문제 분류에 사용하는 프레임워크 모음.

---

## Cynefin Framework

> 문제의 복잡도 도메인을 분류하여 적절한 대응 전략을 선택하는 의사결정 프레임워크.

**출처**: Dave Snowden (1999, Cognitive Edge)

**우리의 용법**: 모든 판단 분기의 최상위 게이트. 코드를 고치기 전에 Cynefin 도메인을 먼저 판단한다 (Working #1). Clear/Complicated면 증명하고 실행, Complex면 나누거나 묻는다, Chaotic면 봉쇄 후 분석. `/discussion`의 `🚀 Next` 판정, `/inbox`의 Cynefin 도메인 판정, `/plan`의 전행 Clear 게이트 등 워크플로우 전반에서 라우팅 기준으로 사용한다.

| 도메인 | 판단 기준 | 전략 |
|--------|----------|------|
| **Clear** | 정답이 있다. 업계 표준, 자명한 해법. | Sense → Categorize → Respond |
| **Complicated** | 선택지가 있지만 분석하면 답이 좁혀진다. | Sense → Analyze → Respond |
| **Complex** | 정답이 없다. 프로젝트 맥락에 따라 다르다. | Probe → Sense → Respond |
| **Chaotic** | 긴급. 분석할 시간이 없다. | Act → Sense → Respond |

**참조**: `CLAUDE.md` 부록, `.agent/rules.md` Working #1, `/divide`, `/solve` Step 1, `/discussion`, `/inbox`, `/go`, `/plan`

---

## Probe-Sense-Respond (PSR)

> Complex 도메인에서 사용하는 Cynefin의 대응 사이클. 먼저 탐색(Probe)하고, 결과를 관찰(Sense)한 뒤, 적응(Respond)한다.

**출처**: Dave Snowden (Cynefin Framework의 Complex 도메인 전략)

**우리의 용법**: `/divide`에서 Complex 노드를 만났을 때의 조사 프로토콜. `probe → view_file_outline`로 구조를 파악하고, `sense → MECE 분해 차원을 선택`하고, `respond → Issue Tree를 분기하여 자식 노드를 큐에 넣는다`. Complex 문제를 바로 풀려 하지 않고 작은 실험으로 정보를 얻는 전략.

**참조**: `/divide` Code Investigation Protocol (Complex 행), `.agent/rules.md` 부록

---

## Sense-Analyze-Respond (SAR)

> Complicated 도메인에서 사용하는 Cynefin의 대응 사이클. 현상을 감지(Sense)하고, 전문가적 분석(Analyze)을 거친 뒤, 결론을 내린다(Respond).

**출처**: Dave Snowden (Cynefin Framework의 Complicated 도메인 전략)

**우리의 용법**: `/divide`에서 Complicated 노드를 만났을 때의 조사 프로토콜. `sense → grep_search`로 코드 경로를 추적하고, `analyze → view_file`로 로직을 확인한 뒤, `respond → Clear로 재분류하고 Hypothesis Statement를 기록`한다. 분석하면 답이 좁혀지는 문제에 전문가적 조사를 적용.

**참조**: `/divide` Code Investigation Protocol (Complicated 행), `.agent/rules.md` 부록

---

## MECE (Mutually Exclusive, Collectively Exhaustive)

> 분해의 각 조각이 상호 배제(겹치지 않음)이고 전체 포괄(빠짐없음)인 분류 원칙.

**출처**: Barbara Minto (McKinsey, The Pyramid Principle, 1973)

**우리의 용법**: `/divide`의 Issue Tree 분해 기준. 분해 차원(module / responsibility / layer / state)이 MECE여야 하며, 최종 리프 노드가 문제를 전체 포괄하는지 검증한다. `/plan`의 변환 명세표에서 CE(모든 행을 실행하면 목표 달성?) → ME(중복 행?) → No-op(Before=After?) 3단계 자기 점검. `/retrospect`의 액션 아이템을 MECE 카테고리로 분류.

**참조**: `/divide` Theoretical Basis, `/plan` Step 4, `/retrospect` Step 4, `.agent/workflows/reframe.md`

---

## Issue Tree

> 문제를 재귀적으로 분기하여 구조화하는 전략 컨설팅 기법. 각 분기가 MECE를 만족해야 한다.

**출처**: 전략 컨설팅 (McKinsey, BCG 등)

**우리의 용법**: `/divide`의 핵심 산출물. 초기 문제를 루트 노드로 놓고, Complex 노드는 PSR로 분기하고, Complicated 노드는 SAR로 Clear까지 좁힌다. 최종 보고서는 모든 리프가 Clear인 Issue Tree (Work Package 수준). `/solve`에서 Complex 항목을 분해할 때도 암묵적으로 사용.

**참조**: `/divide` Report Format, `/solve`

---

## Decision Matrix

> 선택지를 평가 기준별로 점수화하여 구조적으로 비교하는 의사결정 도구.

**출처**: PMI PMBOK (Project Management Body of Knowledge)

**우리의 용법**: `/solve` Step 2에서 Complex 항목의 선택지(A, B, C...)를 열거한 뒤, 각 선택지의 트레이드오프를 구조적으로 평가한다. 하나의 선택지가 압도적 우위(overwhelming advantage)를 가지면 선택하고, 그렇지 않으면 Step 3(Integrative Thinking)으로 진행.

**참조**: `/solve` Theoretical Basis, `/solve` Step 2

---

## Integrative Thinking

> 대립하는 두 선택지의 의도(Why)를 추출하여, 양쪽을 동시에 만족하는 제3의 선택지를 합성하는 사고법.

**출처**: Roger Martin (The Opposable Mind, 2007, Rotman School of Management)

**우리의 용법**: `/solve` Step 3에서 Decision Matrix로 결론이 나지 않을 때 사용. 선택지 A와 B의 대립하는 의도(Why)를 추출하고, 두 의도를 동시에 충족하는 제3의 선택지 C를 탐색한다. C를 찾으면 TDD Protocol로 실행하고, 찾지 못하면 Step 4(Escalation)로 넘어간다.

**참조**: `/solve` Theoretical Basis, `/solve` Step 3

---

## Problem Reframing

> 모든 선택지가 복잡해 보일 때, 선택지를 평가하는 대신 문제 정의 자체를 재구성하는 기법.

**출처**: Design Thinking (IDEO, Stanford d.school 전통)

**우리의 용법**: `/solve` Step 2의 Complexity Guard. 모든 선택지가 Complex로 보이면 "문제가 잘못 정의된 것"으로 판단하고, 선택지 평가를 중단한다. 대신 문제 정의 자체에 5 Whys를 적용하여 인과 사슬 끝에서 더 단순한 해법을 찾는다. "풀 수 없다"가 아니라 "아직 올바른 추상화를 못 찾았다" (Project #1)와 연결.

**참조**: `/solve` Step 2 Complexity Guard
