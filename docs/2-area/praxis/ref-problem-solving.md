# 문제 해결 기법 레퍼런스

> 워크플로우와 규칙에서 참조되는 문제 해결 기법 10건의 정의·출처·용법.

---

## 5 Whys / Root Cause Analysis (RCA)

> 증상에서 출발하여 "왜?"를 반복적으로 물어 근본 원인(Root Cause)에 도달하는 기법. 보통 5번이면 근본에 닿지만 횟수는 고정이 아니다.

**출처**: Sakichi Toyoda, Toyota Production System (1930s)
**우리의 용법**: `/why`의 핵심 기법. "왜 막혔나?"에서 출발하여 근본 원인을 찾고, 그 원인을 해소해야 진짜 해결이다. `/issue`의 D4(Root Cause Analysis)에서 RCA 리포트를 명시적 산출물로 강제. `/diagnose`에서도 "왜 실패했나?"를 구조화.
**참조**: `why.md`, `issue.md`, `diagnose.md`, `rules.md` Working#13

---

## 8D Problem Solving

> Ford가 개발한 8단계 문제 해결 프레임워크. D0(준비) → D1(팀 구성) → D2(문제 정의) → D3(봉쇄) → D4(근본원인) → D5(시정조치) → D6(검증) → D7(재발방지) → D8(축하).

**출처**: Ford Motor Company (1987), *Global 8D*
**우리의 용법**: `/issue`의 전체 구조가 8D를 따른다. D1(컨텍스트 수집) → D2(문제 정의) → D3(봉쇄) → D4(RCA) → D5(시정) → D6(검증) → D7(재발방지) → D8(보고). 에이전트가 이슈를 자율적으로 처리하되, 각 단계의 산출물이 다음 단계의 입력이 되어 건너뛸 수 없게 한다.
**참조**: `issue.md`

---

## Scientific Debugging

> 버그를 과학적 방법(가설 → 실험 → 관찰 → 결론)으로 접근하는 디버깅 기법. 직감이 아닌 체계적 절차.

**출처**: Andreas Zeller, *Why Programs Fail* (2005)
**우리의 용법**: `/diagnose`의 근간. 코드를 수정하지 않고 원인만 분석하여 "삽질 일지"를 작성한다. 가설을 세우고, 실험(테스트 실행, 로그 확인)으로 검증하고, 결과를 기록한다. "왜 깨졌는지"를 모르면 또 깨진다(Working#2).
**참조**: `diagnose.md`, `rules.md` Working#2

---

## Falsifiability (반증 가능성)

> 과학적 이론은 반증 가능해야 한다. 반증할 수 없는 주장은 과학이 아니다. 테스트가 실패할 수 있는 조건을 명시해야 진짜 검증이다.

**출처**: Karl Popper, *The Logic of Scientific Discovery* (1959)
**우리의 용법**: Red-Green-Refactor의 "Red가 먼저"인 이유. 실패하는 테스트 없이 통과만 하면 "이 코드가 맞다"를 증명할 수 없다. `/red`에서 반드시 FAIL하는 테스트를 먼저 쓰는 것은 반증 가능성을 확보하는 행위. "증명 없는 통과는 통과가 아니다"(검증#4).
**참조**: `red.md`, `rules.md` 검증#4, 검증#17

---

## Theory of Constraints (TOC) — 전체 체계

> 시스템의 성능은 가장 약한 고리(제약)에 의해 결정된다. 제약을 찾아 해소하면 전체 시스템이 개선된다.

**출처**: Eliyahu M. Goldratt, *The Goal* (1984)

TOC의 사고 도구(Thinking Processes)는 6개로 구성된다:

### Current Reality Tree (CRT)

> 현재 시스템의 인과 관계를 트리로 그려 핵심 문제(Core Problem)를 찾는다. "왜 이 증상들이 나타나는가?"

**우리의 용법**: `/why`에서 여러 증상이 동시에 나타날 때 공통 원인을 찾는 도구. 5 Whys가 단일 체인이라면, CRT는 여러 증상의 인과 네트워크를 그린다.
**참조**: `why.md`

### Evaporating Cloud (EC)

> 대립하는 두 요구의 근저에 있는 공통 목표를 찾아, 대립 자체를 해소하는 기법.

**우리의 용법**: `/conflict`에서 대립하는 가치·패턴을 다룰 때 사용. "A vs B"가 아닌 "A와 B가 공유하는 목표는 무엇인가?"를 찾아 제3의 해법을 도출.
**참조**: `conflict.md`

### Future Reality Tree (FRT)

> 제안된 해법을 적용했을 때의 미래 상태를 인과 트리로 예측한다. 부정적 가지(Negative Branch)를 사전에 식별.

**우리의 용법**: `/redteam`의 Blue Team이 해법을 제시한 후, Red Team이 "이렇게 하면 어떤 문제가 생기나?"를 FRT로 검증. Pre-mortem과 유사한 역할.
**참조**: `redteam.md`

### Prerequisite Tree (PRT)

> 목표에 도달하기 위한 중간 목표(prerequisite)와 장애물을 순서대로 나열한다.

**우리의 용법**: `/divide`에서 Goal → Work Package로 분해할 때, 각 WP 사이의 의존 관계와 장애물을 식별하는 도구.
**참조**: `divide.md`

### Negative Branch Reservation (NBR)

> FRT에서 발견된 부정적 결과를 사전에 차단하는 대책을 수립한다.

**우리의 용법**: `/redteam`에서 Red Team이 발견한 위험을 Blue Team이 NBR로 대응책을 마련한다. `/spec`의 edge case 열거에도 적용.
**참조**: `redteam.md`, `spec.md`

### Transition Tree (TT)

> 현재 상태에서 목표 상태까지의 구체적 행동 단계를 순서대로 기술한다.

**우리의 용법**: `/plan`의 변환 명세표가 TT의 구체화. 현재 상태 → 목표 상태 → 각 행의 변환 단계가 명시적으로 기술된다.
**참조**: `plan.md`
