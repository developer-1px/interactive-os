# PRD: /go 재설계 + OS 런북

## 문제

`/go`의 실행 품질이 점진적으로 저하되었다. 근본 원인 3가지:

1. **역할 중복**: 생각 단계(Step 2~8)가 `/discussion` + `/project`와 중복. 실제 흐름은 `/discussion → /project → /go`인데 go.md가 또 `/discussion`부터 시작하라고 강제
2. **핵심 단계 뭉개짐**: "만들기"가 `/tdd`, `/solve`, `/refactor` 3줄로 축소. Headless OS 설계, 벤치마크 학습, BDD 시나리오 설계 등 핵심 과정이 없음
3. **OS 온보딩 부재**: LLM이 매 세션 새로 태어나는데, OS 사용법을 숙지하는 절차가 없어 매번 `useState + onClick`으로 회귀

## 핵심 원칙

> **모든 프로젝트의 목적은 앱의 완성이 아니라 OS의 완성이다.**
> 앱은 OS가 제대로 동작하는지 증명하는 수단이다.

## 산출물 정의

### T1: OS 런북 (`docs/official/os/RUNBOOK.md`)

LLM이 OS 위에서 앱을 만들 때 매 세션 읽는 통합 매뉴얼.

**구조**:

```markdown
# OS Runbook — 앱을 OS 위에서 만드는 법

## 0. 이 OS가 존재하는 이유
- rules.md Goal 요약 (3줄)
- "기능 구현이 아니라 OS 증명이다"

## 1. OS의 구조
- 5-Phase Pipeline 요약도 (SPEC.md에서 발췌)
- ZIFT 프리미티브 한눈 요약 (Zone, Item, Field, Trigger)

## 2. 앱 만드는 5단계
- Step 1: defineApp으로 앱 선언
- Step 2: 상태(State) 설계 — 도메인 데이터 + UI 상태
- Step 3: 커맨드(Command) 정의 — (ctx) => (payload) => EffectMap
- Step 4: Zone 바인딩 — createZone → bind({ role, options, onAction, ... })
- Step 5: 뷰(Widget) 바인딩 — Zone/Item/Field로 UI 투사

## 3. 벤치마크: Todo 앱 해부
- app.ts 구조 (defineApp → selector → collection → bind)
- 핵심 패턴: createCollectionZone, collectionBindings
- 테스트 패턴: createPage → pressKey/click/attrs

## 4. 절대 하지 않는 것 (Anti-patterns)
- ❌ useState, useEffect, onClick을 앱 레이어에 쓰지 않는다
- ❌ document.querySelector로 DOM을 직접 조작하지 않는다
- ❌ 브라우저에서만 확인 가능한 코드를 만들지 않는다
- ✅ 모든 인터랙션은 커맨드로, 모든 상태는 커널로, 모든 검증은 headless로

## 5. Headless 검증 패턴
- createPage(App, Widget) 사용법
- pressKey/click/attrs API
- Red→Green 사이클
```

**제약**: 200줄 이내. LLM 컨텍스트 예산을 위해 간결하게. 상세는 SPEC.md/커널 문서로 링크.

### T2: /go 재설계 (`.agent/workflows/go.md`)

**새 구조 — 4 Phase**:

```
Phase 0: 부팅
  - rules.md 읽기
  - BOARD.md에서 상태 복원
  - /reflect (이전 세션 점검)

Phase 1: 숙지
  - OS 런북(RUNBOOK.md) 읽기
  - "이 태스크를 OS로 어떻게 표현하는가?" 질문
  - 관련 벤치마크 앱 패턴 확인
  ⛔ Gate: "OS 관점 설계 메모" 산출물 없으면 다음 Phase 금지

Phase 2: 설계
  - /divide — 태스크 분해
  - /blueprint — 실행 설계도  
  - /naming — Zone, Item, Command 이름 설계
  - /tdd — BDD 시나리오 (.feature) 설계
  - /reflect — 시나리오 커버리지 점검
  ⛔ Gate: .feature 없으면 코드 금지
  ⛔ Gate: headless 테스트 설계 없으면 구현 금지

Phase 3: 실행 + 검증
  - Red 테스트 (headless OS 방식: createPage)
  - Green 구현 (app.ts 선언 → widget 바인딩)
  - /refactor → /review → /fix → /doubt → /cleanup
  - /verify (Red→Green + regression 없음)
  - /changelog → /ready

Phase 4: 회고 (프로젝트 완료 시 1회)
  - /retrospect → /coverage → /para → /archive
```

**각 Phase에 필수 요소**:
- **읽어야 할 문서** (고정 목록)
- **산출물(Noun)** — 없으면 다음 Phase 금지
- **게이트 조건** — 통과 기준

### T3: /project 인터페이스 조정

- `/project`의 마지막 줄 "초기화 완료 → `/go` [판정된 프리셋] 자동 진입" → Phase 1(숙지)로 진입하도록 명시
- Heavy/Light 판정이 `/go`의 Phase 2 깊이에 영향:
  - Heavy: divide + blueprint + naming 전부 필수
  - Light: divide만 (blueprint/naming은 선택)
