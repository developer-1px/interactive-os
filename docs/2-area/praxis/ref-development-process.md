# 개발 프로세스 레퍼런스

> 워크플로우와 규칙에서 참조되는 개발 프로세스 기법 6건의 정의·출처·용법.

---

## TDD (Test-Driven Development) — Red-Green-Refactor

> 1) 실패하는 테스트를 먼저 쓰고(Red), 2) 테스트를 통과하는 최소 코드를 쓰고(Green), 3) 중복을 제거한다(Refactor). 이 세 단계를 짧은 주기로 반복한다.

**출처**: Kent Beck, *Test-Driven Development: By Example* (2002)
**우리의 용법**: 전체 개발 사이클의 골격. `/red` → `/green` → `/refactor`가 이 3단계의 워크플로우 구현. "완료"는 Red→Green 증명이다(검증#17). Red 없이 Green만 있으면 반증 가능성이 없어 진짜 검증이 아니다. `/go`의 상태 라우팅이 이 순서를 강제한다.
**참조**: `red.md`, `green.md`, `refactor.md`, `go.md`, `rules.md` 검증#1, 검증#17

---

## BDD (Behavior-Driven Development) / Gherkin

> 비즈니스 행동을 Given(전제)-When(행위)-Then(결과) 형식으로 기술하는 개발 방법론. 기술자와 비기술자가 같은 언어로 요구사항을 정의한다.

**출처**: Dan North (2006), *Introducing BDD*; Gherkin syntax from Cucumber project
**우리의 용법**: `/spec`의 BDD 시나리오 섹션. 기능을 구현하기 전에 Given/When/Then으로 행동을 명세한다. 이 시나리오가 `/red`에서 테스트로 인코딩되는 입력이 된다. `/archive`에서 프로젝트 완료 시 BDD 시나리오를 `6-products/spec/`에 누적하는 것이 Product 지식 환류의 핵심.
**참조**: `spec.md`, `red.md`, `archive.md`, `stories.md`

---

## Spec-First, Enumerate-All

> 알려진 상호작용(Clipboard, DnD, Tree Navigation 등)을 구현하기 전에 모든 케이스를 전수 열거한다. 구현 전에 플랫폼 선례(macOS, Windows, Figma)에서 전체 동작 표를 작성한다.

**출처**: Interactive OS 자체 원칙 (기존 플랫폼 관행의 체계화)
**우리의 용법**: "한 케이스만 구현하고 '동작하네'로 넘어가는 것은 금지." `/spec`에서 Decision Table로 모든 조합을 열거하고, `/red`에서 각 행을 테스트로 인코딩한다. 사례: Tree Clipboard — `paste(container)`, `paste(nested leaf)`, `paste(root node)` 세 케이스를 한 번에 설계.
**참조**: `rules.md` 검증#14, `spec.md`, `red.md`

---

## XP Spike

> 불확실한 기술적 질문에 답하기 위한 시간 제한된(time-boxed) 탐색적 실험. 프로덕션 코드가 아니라 학습이 산출물이다.

**출처**: Kent Beck, *Extreme Programming Explained* (1999)
**우리의 용법**: `/solve`에서 Complex 항목을 탐침(Probe)할 때 사용. 전체를 구현하기 전에 핵심 불확실성을 작은 실험으로 해소한다. Spike의 결과는 코드가 아니라 "이 접근이 가능한가?"에 대한 판단. Cynefin Complex 도메인의 Probe-Sense-Respond 전략의 구체적 실행 방법.
**참조**: `solve.md`

---

## Empiricism (Scrum)

> 경험주의. 투명성(Transparency), 검사(Inspection), 적응(Adaptation) 세 기둥으로 복잡한 환경에서 진행한다. 계획보다 피드백 루프를 신뢰한다.

**출처**: Ken Schwaber & Jeff Sutherland, *Scrum Guide* (2020)
**우리의 용법**: "가장 빠른 피드백부터 잡는다"(Working#6). 순수함수 → 커맨드 → E2E 순서로 검증하는 것은 피드백 루프를 빠르게 돌리기 위함. `/retrospect`의 KPT 회고가 Inspection + Adaptation 구현. `/verify`가 Transparency 구현.
**참조**: `rules.md` Working#6, `retrospect.md`, `verify.md`

---

## Lazy Resolution

> 참조(reference)를 쓸 때(write-time)가 아니라 읽을 때(read-time) 해석한다. 원본 참조를 불변으로 보존하고, 소비 시점에 현재 상태 기준으로 해석한다.

**출처**: Interactive OS 자체 원칙 (CQRS Read Model, Event Sourcing에서 파생)
**우리의 용법**: 삭제·이동 시 참조 ID를 즉시 교체(Write-time Recovery)하면 undo 시 복귀 불가. 원본 참조를 보존하고 `resolve(storedId, currentItems)` 순수함수로 소비 시점에 해석하면 undo/redo가 자동 복원. 복구 전용 상태·커맨드를 별도로 두지 않아 엔트로피가 줄어든다.
**참조**: `rules.md` 검증#15
