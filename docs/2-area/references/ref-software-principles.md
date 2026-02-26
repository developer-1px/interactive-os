# Software Principles Reference

> OS 설계와 코드 품질의 근간이 되는 소프트웨어 원칙 모음.

---

## Single Responsibility Principle (SRP)

> 모듈(클래스, 함수)의 변경 이유는 하나여야 한다.

**출처**: Robert C. Martin (Clean Architecture, SOLID 원칙의 S)

**우리의 용법**: "번역기는 번역만 한다" (Project #5). 입력을 커맨드로 바꾸는 자와 커맨드를 실행하는 자는 서로를 모른다. 입력 해석이 변해도 실행은 변하지 않고, 실행이 변해도 입력 해석은 변하지 않는다. 검증 #13에서도 적용: 커맨드가 암묵적 프록시가 되어 다른 커맨드를 하이재킹하면 SRP 위반. `/solve`의 Green 단계에서 SRP 준수를 검증.

**참조**: `CLAUDE.md` Project #5, `.agent/rules.md` 검증 #13, `/solve` TDD Execution Protocol

---

## Command-Query Separation (CQS)

> 상태를 바꾸는 행위(Command)와 상태를 읽는 행위(Query)를 분리한다. 하나의 함수가 읽기와 쓰기를 동시에 하면 부작용을 추적할 수 없다.

**출처**: Bertrand Meyer (Object-Oriented Software Construction, 1988)

**우리의 용법**: "모든 변경은 하나의 문을 통과한다" (Project #6). 상태 변경 경로가 둘이면 버그 경로도 둘이다. OS의 커맨드 파이프라인이 이 원칙의 구현체: dispatch(Command)와 getState(Query)가 완전히 분리. CQRS Read Model 패턴으로 확장하여 도메인(Write)과 UI(Read)를 분리하고, Transform이 독립성을 보장 (Project #3).

**참조**: `CLAUDE.md` Project #6, `.agent/rules.md` Project #3

---

## Principle of Least Astonishment (POLA)

> 시스템은 사용자가 예상하는 대로 동작해야 한다. 놀라움은 학습 비용이다.

**출처**: 소프트웨어 공학 일반 원칙 (1970년대 IBM Human Factors 연구에서 유래)

**우리의 용법**: "학습 비용을 0으로 만든다" (Goal #6). 이전 앱에서 배운 패턴이 다음 앱에서도 동일하게 동작해야 한다. OS가 포커스, 네비게이션, 접근성을 시스템 수준에서 보장하는 이유. 앱마다 다른 키보드 동작은 POLA 위반이다.

**참조**: `CLAUDE.md` Goal #6, `.agent/rules.md` Goal #6

---

## Pit of Success

> API는 올바른 사용법으로 자연스럽게 "떨어지게" 설계한다. 잘못 쓰기가 더 어려워야 한다.

**출처**: Rico Mariani (Microsoft, .NET 설계 철학)

**우리의 용법**: "편의보다 명시적" (Project #7). 같은 목적을 달성하는 경로가 여럿 열려 있으면, 에이전트는 매번 어느 길이 맞는지 판단해야 한다. 워크플로우의 판단 분기에도 적용: 주관적 형용사 대신 체크리스트, 숫자, 분류 기준 등 검증 가능한 기준을 사용한다. `/doubt`의 Occam Gate도 이 원칙의 구현: 새 개념 도입 전 3가지 필수 질문으로 잘못된 길을 차단.

**참조**: `CLAUDE.md` Project #7, `.agent/rules.md` Project #7, `/doubt` Occam Gate

---

## Hollywood Principle

> "Don't call us, we'll call you." 프레임워크가 앱을 호출하지, 앱이 프레임워크를 호출하지 않는다.

**출처**: Martin Fowler (Inversion of Control, GoF Design Patterns에서도 Template Method로 구현)

**우리의 용법**: "앱은 의도를 선언하고, OS가 실행을 보장한다" (Goal #7). 앱 코드에 useState, useEffect, onClick이 0줄인 세계가 목표. 앱은 OS에게 무엇을 원하는지 선언하고, 어떻게 실행할지는 OS가 결정한다. `/audit`에서 useState/onClick/useEffect 사용을 OS 계약 위반으로 탐지하는 근거.

**참조**: `CLAUDE.md` Goal #7, `.agent/rules.md` Goal #7, `/go` 핵심 원칙

---

## Occam's Razor

> 같은 문제를 푸는 선택지가 여럿이면, 개체(concept)가 적은 쪽이 정답이다.

**출처**: William of Ockham (14세기 논리학), 소프트웨어에서는 KISS(Keep It Simple, Stupid)와 동의어

**우리의 용법**: "해결 = 엔트로피 감소" (Project #1). 변경 후 시스템의 고유 패턴 수가 늘었으면 해결이 아니라 악화. 기존 메커니즘을 재사용하거나 여러 특수 사례를 하나의 범용 메커니즘으로 대체해야 해결이다. `/doubt`의 Occam Gate가 실행 계층 구현: "기존 메커니즘으로 해결 가능한가?" → "이 변경이 시스템의 개념 수를 줄이는가, 늘리는가?"

**참조**: `CLAUDE.md` Project #1, `/doubt` Occam Gate

---

## Convention over Configuration (CoC)

> 관례를 따르면 설정이 필요 없다. 개발자는 관례에서 벗어날 때만 명시한다.

**출처**: David Heinemeier Hansson (DHH, Ruby on Rails, 2004)

**우리의 용법**: Project #1에서 Occam's Razor와 함께 인용. 네이밍 규칙이 대표 사례: 파일 케이스는 확장자가 법이고(`.tsx` → PascalCase, `.ts` → camelCase), 폴더는 업계 관행이 법이다. "표준이 있으면 발명하지 않는다." 앱 구조는 FSD, OS는 파이프라인, 문서는 토폴로지 — 각 영역의 관례를 따르면 학습 비용이 0.

**참조**: `CLAUDE.md` Project #1, 네이밍 섹션

---

## Make Illegal States Unrepresentable

> 잘못된 상태를 타입 시스템으로 표현 자체를 불가능하게 만든다.

**출처**: Yaron Minsky (Jane Street, "Effective ML" 발표, 2011)

**우리의 용법**: "100% 타입. 타입은 문서가 아니라 가드레일이다" (Goal #4). 가드레일이 없으면 에이전트가 추락한다. `as unknown as` 캐스팅이 필요한 API는 타입이 현실을 반영하지 못하고 있다는 신호. 브랜드 타입(BaseCommand 등)으로 커맨드 계약을 타입 수준에서 강제하는 것이 OS의 구현.

**참조**: `CLAUDE.md` Goal #4, `.agent/rules.md` Goal #4, 검증 #7

---

## Ubiquitous Language

> 코드, 문서, 대화에서 같은 개념을 같은 이름으로 부른다. 이름의 번역 비용이 0이어야 한다.

**출처**: Eric Evans (Domain-Driven Design, 2003)

**우리의 용법**: "이름은 법이다" (Project #9). 하나의 개념에 하나의 이름. grep 한 번이면 모든 연결이 보여야 한다. 코드의 `OS_FOCUS`, 문서의 "FOCUS 커맨드", 대화의 "포커스" — 모두 같은 것을 가리켜야 한다. `/naming` 워크플로우가 구현 전 이름 설계를 강제하는 근거.

**참조**: `CLAUDE.md` Project #9, `.agent/rules.md` Project #9

---

## Hexagonal Architecture / Ports & Adapters

> 코어(도메인 로직)가 먼저 존재하고, 어댑터(UI, DB, API)는 코어에 연결될 뿐이다. 코어는 어댑터 없이도 테스트 가능해야 한다.

**출처**: Alistair Cockburn (2005)

**우리의 용법**: "로직이 먼저, 뷰는 바인딩이다" (Project #2). 상태→조건→커맨드→뷰 바인딩 순서로 하향 정의. 뷰가 로직을 가져다 쓰는 것이 아니라, 로직이 뷰에 바인딩되는 것. 코어는 어댑터 없이도 테스트 가능(Headless). `/red`와 `/green`에서 headless 테스트가 가능한 것이 이 아키텍처의 증명. `/bind`가 headless 로직을 UI에 연결하는 어댑터 계층.

**참조**: `CLAUDE.md` Project #2, `.agent/rules.md` Project #2, `/red`, `/green`, `/bind`

---

## Chesterton's Fence

> 울타리가 왜 세워졌는지 이해하기 전에는 울타리를 허물지 마라.

**출처**: G. K. Chesterton (The Thing, 1929)

**우리의 용법**: `/doubt`의 안전장치. 제거/축소 후보(🔴/🟡)에 대해 "왜 만들었는지 아는가?" → "그 이유가 아직 유효한가?"를 반드시 확인한 후에만 제거를 확정한다. 이유를 모르면 git log, 대화 히스토리, 문서를 조사하여 이유를 먼저 파악한다. 빼는 것(Subtract)의 균형추.

**참조**: `/doubt` Step 3 (Chesterton's Fence)
