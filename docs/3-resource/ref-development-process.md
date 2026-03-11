# Development Process Reference

> 코드를 작성하고 검증하는 개발 프로세스 기법 모음.

---

## TDD — Test-Driven Development (Red-Green-Refactor)

> 테스트를 먼저 쓰고(Red), 최소 구현으로 통과시키고(Green), 정리한다(Refactor). 이 세 단계를 빠르게 반복하는 개발 기법.

**출처**: Kent Beck (Test-Driven Development: By Example, 2002, Extreme Programming)

**우리의 용법**: OS 개발의 근간. "테스트가 먼저다. 코드를 쓰기 전에 테스트를 쓴다. 테스트가 스펙이고, 통과가 증명이다" (검증 #1). `/go`의 라우팅 테이블이 TDD 사이클을 구현: G3(Red 테스트 없음 → `/red`) → G4(Red 테스트 FAIL → `/green`) → G5(모든 테스트 PASS → `/refactor`). `/solve`의 TDD Execution Protocol에서 Clear/Complicated 항목은 반드시 이 프로토콜로 실행. "완료"의 유일한 정의는 Red→Green 증명 (검증 #17).

| 단계 | 워크플로우 | 산출물 |
|------|----------|--------|
| Red | `/red` | 🔴 FAIL하는 .test.ts |
| Green | `/green` | 🟢 PASS하는 구현 코드 |
| Refactor | `/refactor` | 정리된 코드 + git commit |

**참조**: `CLAUDE.md` 검증 #1, #17, `/red`, `/green`, `/refactor`, `/go` 라우팅 테이블, `/solve` TDD Execution Protocol

---

## BDD — Behavior-Driven Development / Gherkin

> 비즈니스 이해관계자가 읽을 수 있는 자연어(Given/When/Then)로 기대 동작을 기술하는 개발 기법.

**출처**: Dan North (Introducing BDD, 2006), Gherkin 문법은 Cucumber 프로젝트(Aslak Hellesøy)

**우리의 용법**: `/spec`과 `/stories`의 핵심 포맷. User Story의 Acceptance Criteria는 사용자 언어로, spec의 Scenario는 시스템 언어로 Given/When/Then을 작성한다. Decision Table의 각 행이 하나의 BDD Scenario로 번역된다. `/red`에서 테스트 코드의 `it()` 블록 안에 `// Given`, `// When`, `// Then` 주석으로 구조를 명시.

```
User Story (사용자 언어)     ← /stories
    ↓ AC를 번역
Spec Scenario (시스템 언어)  ← /spec
    ↓ Scenario를 인코딩
Red Test (.test.ts)          ← /red
```

**참조**: `/spec` Step 2~3, `/stories` 포맷, `/red` Step 2, `/archive` b-1 (BDD 시나리오 누적)

---

## Spec-First, Enumerate-All

> 알려진 상호작용을 구현할 때, 구현 전에 모든 케이스를 전수 열거하고, 열거된 케이스를 테스트로 인코딩한 뒤, 코드를 작성하는 원칙.

**출처**: 이 프로젝트의 자체 원칙 (플랫폼 상호작용 설계의 경험적 교훈에서 도출)

**우리의 용법**: 검증 #14. Clipboard, Drag-and-Drop, Tree Navigation 등 30년간 확립된 플랫폼 상호작용에 적용. 순서: ① macOS/Windows/Figma 등 기존 플랫폼에서 전체 동작 표 작성 → ② 모든 행을 테스트로 선언 → ③ 코드 작성. "한 케이스만 구현하고 '동작하네'로 넘어가는 것은 금지." LLM의 습관적 누락(한두 개만 구현하고 넘어감)을 방지하는 가드레일.

**사례**: Tree Clipboard — `paste(container)` → child 삽입, `paste(nested leaf)` → 같은 부모 안 다음 형제 삽입, `paste(root node)` → root 형제 삽입. 세 케이스를 한 번에 설계.

**참조**: `CLAUDE.md` 검증 #14, `.agent/rules.md` 검증 #14, `docs/2-area/praxis/llm-behavior.md`

---

## XP Spike (Extreme Programming Spike)

> 지식을 얻기 위한 시간 제한 실험. 산출물은 코드가 아니라 지식이다.

**출처**: Kent Beck, Ward Cunningham (Extreme Programming, 1996)

**우리의 용법**: `/divide`의 정체성. `/divide`는 "Technical Spike"이며, 코드를 수정하지 않고 Issue Tree만 산출한다. "No code changes. No user interaction mid-process. Minimum 3 iterations." 산출물은 모든 리프가 Clear인 Issue Tree와 각 리프의 Hypothesis Statement. 코드 수정은 `/solve`나 `/go`가 담당.

**참조**: `/divide` Theoretical Basis, `/divide` Definition of Done ("No user interaction during spike")

---

## Empiricism (경험주의)

> 의사결정은 관찰 가능한 증거에 기반해야 한다. 추측이 아닌 실험과 데이터로 판단한다.

**출처**: Scrum Guide (Ken Schwaber, Jeff Sutherland, 2020 — Scrum의 3기둥: Transparency, Inspection, Adaptation)

**우리의 용법**: `/divide`와 `/solve`의 기본 자세. "/divide: Every assessment must be evidence-based — no speculation." "/solve: Assertion without evidence violates Empiricism — no execution without a test." 코드를 실제로 읽지 않고 추측하는 것을 금지하며, 매 iteration마다 실제 코드 읽기(Evidence recorded)를 포함해야 한다.

**참조**: `/divide` Theoretical Basis, `/solve` 서문

---

## Lazy Resolution (지연 해석)

> 참조는 쓸 때 보존하고, 읽을 때 해석한다. 삭제·이동 시 참조 ID를 즉시 교체하지 않고, 소비 시점에 현재 컬렉션 기준으로 해석한다.

**출처**: 이 프로젝트의 자체 원칙 (Undo/Redo 설계 실패에서 도출, 함수형 프로그래밍의 lazy evaluation과 유사)

**우리의 용법**: 검증 #15. Write-time Recovery(삭제 시 참조 즉시 교체)는 원본을 영구 파괴하여 undo 시 복귀 불가. Read-time Resolution은 원본 참조를 불변으로 보존하고, `resolve(storedId, currentItems)` 순수함수 하나로 소비 시점에 해석. undo/redo가 자동으로 원래 위치를 복원. 복구 전용 상태·커맨드를 별도로 두지 않아 시스템 개념 수가 줄어든다 (Occam's Razor와 연결).

**참조**: `CLAUDE.md` 검증 #15, `.agent/rules.md` 검증 #15
