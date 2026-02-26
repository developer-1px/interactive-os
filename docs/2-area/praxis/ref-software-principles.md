# 소프트웨어 원칙 레퍼런스

> 워크플로우와 규칙에서 참조되는 소프트웨어 설계 원칙 11건의 정의·출처·용법.

---

## Single Responsibility Principle (SRP)

> 모듈(클래스, 함수, 파일)은 변경의 이유가 하나여야 한다. 두 가지 이유로 변경되는 모듈은 분리한다.

**출처**: Robert C. Martin, *Agile Software Development* (2002)
**우리의 용법**: OS 파이프라인의 설계 근간. "번역기는 번역만 한다" — 입력 해석(Listener)과 커맨드 실행(Command)이 분리된 이유. 커맨드가 다른 커맨드를 암묵적으로 호출(hijacking)하는 것을 금지하는 규칙의 근거. `/audit`에서 SRP 위반을 "LLM 실수"로 분류.
**참조**: `rules.md` Project#5, 검증#13, `audit.md`

---

## Command-Query Separation (CQS)

> 상태를 변경하는 행위(Command)와 상태를 읽는 행위(Query)를 분리한다. 하나의 함수가 읽기와 쓰기를 동시에 하면 부작용을 추적할 수 없다.

**출처**: Bertrand Meyer, *Object-Oriented Software Construction* (1988)
**우리의 용법**: "모든 변경은 하나의 문을 통과한다." 상태 변경 경로가 둘이면 버그 경로도 둘이다. kernel의 `dispatch`(Command)와 `getState`/`subscribe`(Query) 분리. `defineCommand`는 순수 상태 변환만, `defineEffect`는 부수효과만.
**참조**: `rules.md` Project#6, `CLAUDE.md` Project#5

---

## Principle of Least Astonishment (POLA)

> 시스템은 사용자(인간 또는 에이전트)가 기대하는 대로 동작해야 한다. 놀라움은 학습 비용이다.

**출처**: 소프트웨어 공학 일반 원칙, Unix Philosophy에서 유래
**우리의 용법**: "학습 비용을 0으로 만든다." 이전 앱에서 배운 패턴이 다음 앱에서도 동일하게 동작해야 한다. Config-driven 행동 모델의 근거 — 같은 Config를 주면 같은 행동이 보장된다. `/naming`에서 이름의 일관성을 강제하는 근거.
**참조**: `CLAUDE.md` Goal#6, `rules.md` Goal#6, `naming.md`

---

## Pit of Success

> API는 올바른 사용법으로 "떨어지게" 설계한다. 잘못 쓰기가 더 어려운 API가 좋은 API다.

**출처**: Rico Mariani (Microsoft), Brad Abrams
**우리의 용법**: "편의보다 명시적." 같은 목적을 달성하는 경로가 여럿 열려 있으면 에이전트는 매번 판단해야 한다. `defineApp` API가 Config를 강제하는 이유, ESLint 커스텀 규칙 6개가 잘못된 패턴을 차단하는 이유. `/review`에서 API 설계를 평가하는 기준.
**참조**: `CLAUDE.md` Project#7, `rules.md` Project#7, `review.md`

---

## Hollywood Principle

> "Don't call us, we'll call you." 프레임워크가 앱을 호출하지, 앱이 프레임워크를 호출하지 않는다. Inversion of Control(IoC)의 구체적 표현.

**출처**: Martin Fowler, *Inversion of Control*; Sweet, *Design Patterns* (1994)
**우리의 용법**: "앱은 의도를 선언하고, OS가 실행을 보장한다." 앱 코드에 useState, useEffect, onClick이 0줄인 세계의 근거. 앱은 Config로 무엇을 원하는지 선언하고, 어떻게 실행할지는 OS가 결정한다. `/bind`에서 로직↔UI 연결도 이 원칙을 따른다.
**참조**: `CLAUDE.md` Goal#7, `rules.md` Goal#7, `bind.md`

---

## Occam's Razor

> 같은 현상을 설명하는 가설이 여럿이면 가정이 적은 쪽이 우선한다. 불필요한 복잡성을 경계한다.

**출처**: William of Ockham (14세기), 과학 철학 일반 원칙
**우리의 용법**: "해결 = 엔트로피 감소." 같은 문제를 푸는 선택지가 여럿이면, 개체(concept)가 적은 쪽이 정답. `eslint-disable`, `as any`, 새로운 유일한 패턴 추가 — 전부 엔트로피 증가의 냄새. `/doubt`에서 "줄일 수 있나?"의 판단 기준.
**참조**: `CLAUDE.md` Project#1, `rules.md` Project#1, `doubt.md`

---

## Convention over Configuration (CoC)

> 명시적 설정 없이도 합리적 기본값(convention)으로 동작하게 한다. 설정은 convention에서 벗어날 때만 필요하다.

**출처**: David Heinemeier Hansson (DHH), Ruby on Rails (2004)
**우리의 용법**: Occam's Razor와 함께 Project#1에서 참조. 파일 네이밍 규칙(`.tsx`=PascalCase, `.ts`=camelCase), 폴더 구조(`tests/unit/`, `tests/e2e/`), 앱 정의(`app.ts` 고정) 등이 Convention. 에이전트가 "어떤 이름을 써야 하지?"를 추론하지 않게 한다.
**참조**: `CLAUDE.md` Project#1, `rules.md` 네이밍, `naming.md`

---

## Make Illegal States Unrepresentable

> 타입 시스템으로 잘못된 상태를 표현 자체가 불가능하게 만든다. 런타임 검증 대신 컴파일 타임 보장.

**출처**: Yaron Minsky, *Effective ML* (2011), Jane Street
**우리의 용법**: "100% 타입. 타입은 문서가 아니라 가드레일이다." `as unknown as` 캐스팅이 필요한 API는 타입이 현실을 반영하지 못하고 있다는 신호. FocusGroupConfig의 타입 설계, ContextToken wrapper 패턴이 이 원칙의 구현. `/review`에서 `as any` 사용을 부채로 분류.
**참조**: `CLAUDE.md` Goal#4, `rules.md` Goal#4, 검증#7

---

## Ubiquitous Language (DDD)

> 코드, 문서, 대화에서 같은 개념을 같은 이름으로 부른다. 이름의 번역 비용이 0이어야 한다.

**출처**: Eric Evans, *Domain-Driven Design* (2003)
**우리의 용법**: "이름은 법이다." 하나의 개념에 하나의 이름, grep 한 번이면 모든 연결이 보여야 한다. Zone, Item, Field, Trigger, Config — 코드와 문서에서 같은 용어. `/naming`의 존재 이유.
**참조**: `CLAUDE.md` Project#9, `rules.md` Project#9, `naming.md`

---

## Hexagonal Architecture / Ports & Adapters

> 코어(비즈니스 로직)가 먼저 존재하고, 외부 세계(UI, DB, API)는 어댑터로 연결될 뿐이다. 코어는 어댑터 없이도 테스트 가능해야 한다.

**출처**: Alistair Cockburn (2005)
**우리의 용법**: "로직이 먼저, 뷰는 바인딩이다." 상태→조건→커맨드→뷰 바인딩 순서. OS 파이프라인의 `3-commands`(코어)가 `6-components`(어댑터) 없이 headless로 테스트 가능한 이유. `createPage`/`createOsPage`로 브라우저 없이 검증하는 패턴의 근거.
**참조**: `CLAUDE.md` Project#2, `rules.md` Project#2, `red.md`, `green.md`

---

## Chesterton's Fence

> 어떤 것이 왜 존재하는지 이해하기 전에 제거하지 마라. 이유를 모른 채 제거하면 그것이 방지하던 문제가 재발한다.

**출처**: G.K. Chesterton, *The Thing* (1929)
**우리의 용법**: `/doubt`에서 "쓸모가 있나?"를 물을 때의 안전장치. 코드·문서·워크플로우를 제거하기 전에 "왜 존재하는지"를 먼저 파악한다. `/retire`에서 superseded 문서를 아카이브할 때도 교차 검증(MIGRATION_MAP, 소스코드 실존 여부)을 하는 이유.
**참조**: `doubt.md`, `retire.md`
