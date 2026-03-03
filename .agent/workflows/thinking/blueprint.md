---
description: 코드 수정 전 TOC 기반 실행 설계도. Goal → Why → Challenge → Ideal → Inputs → Gap → Divide.
---

## /blueprint — 실행 설계도

> **이론적 기반**: TOC Thinking Process (Goldratt)
> 코드를 한 줄 수정하기 전에, 문제를 완전히 이해하고 설계를 마친다.
> /divide가 "무엇을 나누는가"라면, /blueprint는 "왜 나누고, 어디로 가는가".

### 시점

`/go` 보편 사이클 Step 7. /divide 후, /naming 전에 실행.

### 산출물

단일 마크다운 문서. 저장 위치:
- 프로젝트 → `docs/1-project/{project}/blueprint-{slug}.md`
- 이슈   → `docs/1-project/{project}/issues/blueprint-{slug}.md`
- 기타   → `docs/0-inbox/YYYY-MMDD-HHmm-blueprint-{slug}.md`

### 절차

#### 1. Goal — 무엇을 달성하는가? (CRT: Undesirable Effects → Goal)

현재 상태의 UDE(Undesirable Effects)를 나열하고, 최종 도달 상태를 한 문장으로 정의한다.
- 이슈 수정이든, 신규 개발이든, 리팩토링이든 — **완료 조건(Done Criteria)**을 명확히.
- "무엇이 끝나면 이 작업이 끝인가?"

#### 2. Why — 왜 해야 하는가? (CRT: Root Cause Analysis)

`rules.md`와 프로젝트 원칙에 의거하여:
- 이 변경이 필요한 **근본 원인(Root Cause)**을 식별한다.
- 원칙 위반인가? 기술 부채인가? 사용자 가치인가?
- 근거 없는 변경은 여기서 기각된다.

#### 3. Challenge — 꼭 이 방식이어야 하나? (EC: Evaporating Cloud)

표면적 Goal 뒤의 **숨은 충돌(Hidden Conflict)**을 분석한다.
- 전제(Assumption)를 하나씩 나열하고, 각각 "정말 그런가?" 질문.
- 무효화할 수 있는 전제를 찾으면 → **진짜 Goal**이 드러난다.
- "더 단순한 해법은 없는가? 안 하는 것이 답은 아닌가?"

#### 4. Ideal — 이상적 결과 (FRT: Future Reality Tree)

해결 완료 후의 **바람직한 상태**를 구체적으로 기술한다.
- UX/DX 관점에서 "이렇게 동작해야 한다" 시나리오.
- 부정적 분기(Negative Branch)가 있으면 함께 기록.

#### 5. Inputs — 필요한 모든 입력 (PRT: Prerequisite Tree)

Ideal에 도달하기 위해 필요한 모든 전제 조건:
- 관련 파일, 모듈, 패턴, 지식(KI), 외부 레퍼런스
- 참조해야 할 rules, PRD, 기존 구현
- 필요하지만 아직 없는 것도 명시

#### 6. Gap — 현실과 이상 사이 (NBR: Negative Branch Reservation)

현재 인프라 대비 MECE 갭 분석:
- **Have**: 지금 있는 것 (코드, 패턴, 인프라)
- **Need**: Ideal에 필요한 것
- **Gap**: Have와 Need의 차이 → 실제 작업 범위
- 각 Gap에 영향도(High/Med/Low)와 의존 관계 표시

#### 7. Execution Plan — 실행 설계 (TT: Transition Tree → /divide)

Gap을 `/divide` 방식으로 분해하여 실행 순서를 설계한다.
- 각 Gap → Cynefin 도메인 판단 (Clear/Complicated/Complex)
- Clear/Complicated → 바로 실행 단위로
- Complex → 추가 분해 또는 실험(Probe) 설계
- 의존 관계에 따른 실행 순서 결정
- 결과물: 순서가 매겨진 실행 항목 목록

### 템플릿

```
# Blueprint: {title}

## 1. Goal
-

## 2. Why
-

## 3. Challenge
| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|

## 4. Ideal
-

## 5. Inputs
-

## 6. Gap
| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|

## 7. Execution Plan
| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
```
