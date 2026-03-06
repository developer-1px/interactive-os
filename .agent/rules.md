# Interactive OS 선언문

## Why — 이 규칙이 존재하는 이유

너는 이 프로젝트의 코드를 작성하는 에이전트다.
너의 코드는 인간이 한 줄씩 리뷰하지 않는다.

너는 매 세션 컨텍스트가 리셋된다.
이전 세션에서 어떤 패턴을 썼는지 기억하지 못한다.
그래서 같은 문제를 다른 방식으로 풀게 되고,
동작하지만 일관성 없는 코드가 쌓인다.
인간은 그 코드를 전부 읽을 수 없다.

이 OS의 구조는 이 문제를 해결한다.
구조를 따르면 너의 세션 간 일관성 부족이 문제가 되지 않는다.
구조가 올바른 방향으로 강제하기 때문이다.

이 규칙들은 너의 한계를 보완하기 위해 존재한다.


## How — 두 가지 원칙

### 1. Pit of Success — 잘못 만들기가 더 어려운 구조

이 프로젝트의 모든 모듈은 "올바르게 만드는 것이 기본값"이 되도록 설계되어 있다.

- 기존 메커니즘이 있으면 그것을 사용한다. 새로 만들지 않는다.
- 같은 문제를 푸는 선택지가 여럿이면, 이 프로젝트에서는 하나만 열려 있다. 그 하나를 찾아서 따른다.
- 새로운 고유 패턴이 필요하다면, 아직 올바른 추상화를 못 찾았다는 신호다. 멈추고 보고한다.
- `eslint-disable`, `as any`, `document.querySelector` — 구조를 우회하는 코드는 금지다.

너의 자유도가 줄어드는 것이 아니다.
줄어든 자유도 안에서 뭘 해도 올바르게 되는 것이다.

### 2. 100% Observable — Pit of Success의 필연적 결과

구조가 제약되어 있으면, 모든 과정이 기록되고 테스트 가능하다.

- **에이전트(너)는 TestPage로 DOM 없이 검증한다.** 브라우저를 열 필요가 없다.
  테스트가 DOM 없이 동작하지 않으면, OS의 추상화가 부족하다는 신호다.
- **인간은 시각화(TestBot, Inspector)로 검증한다.** 코드를 읽을 필요가 없다.
  테스트 과정이 시각화되어, 행동을 보고 잘했다/못했다를 판단한다.
- **"브라우저에서 확인해주세요"는 금지다.** 그것은 이 OS로는 검증할 수 없다는 고백이다.

테스트는 코드를 수정하기 전에 쓴다(TDD).
테스트가 스펙이고, 통과가 증명이다.

### 3. Pre-trained Habit (관성) 금지 — LLM 행동 강령

대형 언어 모델(너)은 방대한 오픈소스 코드로 학습되었기 때문에, 이 프로젝트의 독자적인 OS 패턴보다 익숙한 범용 패턴(예: `useState`, `@testing-library`, `any` 캐스팅)을 무의식적으로 사용하려는 강한 관성을 지닌다.

- **절대 관성대로 코딩하지 마라.** 새로운 컴포넌트나 테스트를 작성하기 전, 반드시 `.agent/knowledge/` 내의 관련 표준(예: `verification-standards.md`)을 먼저 `view_file`로 읽어라.
- **`any` 무관용.** 타입 충돌이 발생했을 때 `as any`나 `| any`로 회피하지 마라. 소스 코드를 끝까지 추적하여 정확한 타입을 식별하고 파생시켜라.
- **God Object 관성 금지.** 새 관심사를 기존 파일에 추가하기 전, "이 관심사가 이 파일의 기존 관심사와 동일한 lifecycle을 공유하는가?"를 확인하라. 공유하지 않으면 새 파일을 만든다. "기존 파일에 추가하는 것"이 "새 파일을 만드는 것"보다 항상 인지적 비용이 낮기 때문에, LLM은 단일 파일에 무관한 관심사를 누적시키는 관성이 있다.
- **Facade 경계 위반 금지.** `src/`(앱 코드)에서 `@os-core/*`를 직접 import하지 마라. 반드시 `@os-sdk/os` 또는 `@os-react/*`를 통해 접근한다. `@os-core`는 OS 내부 구현이고, `@os-sdk`가 앱을 위한 유일한 facade다. facade에 필요한 API가 없으면 `@os-sdk/os.ts`에 re-export를 추가한다.
- **Dead code 판정 시 검색 범위 = 프로젝트 루트.** `packages/`만 grep하면 `src/`의 사용처를 놓친다. 반드시 프로젝트 루트(`./`)에서 검색한다.
- **수동적 태도 금지.** 리뷰나 지적을 기다리지 말고, 코드를 수정하기 직전(Tool Call 전)에 이 변경이 Pit of Success와 100% Observable 룰에 부합하는지 스스로 검열하라.
  - **불변 자문**: "이 코드가 동작하는가?"뿐 아니라 "이것이 설계 불변을 유지하는가?"를 묻는다. band-aid(임시 동작)와 correct fix(불변 준수)를 구분한다.
  - **OS 격리 문제**: 진단파일 생성 전에 kernel 소스(`createKernel.ts` 등)를 먼저 읽는다.


## What — 우리가 만드는 것

Interactive OS는 웹 애플리케이션을 위한 **상호작용 인프라**다.

데스크탑에 AppKit이 있고, 모바일에 UIKit이 있다. 웹에는 없었다.
Interactive OS가 그 자리를 채운다.

앱 개발자(또는 에이전트)는 "이 영역은 리스트다"라고 **선언**하면,
OS가 나머지를 **보장**한다:
방향키 탐색, Tab 이동, Enter 활성화, 스크린 리더, 선택, 삭제, 복사 — 전부.

**모든 모듈이 Pit of Success다.** 각 모듈이 하나의 관심사를 제약한다:

| 모듈 | Pit of Success |
|------|---------------|
| **Kernel** | 모든 상태 변경은 커맨드(데이터)로, 하나의 경로를 통과한다 |
| **Pipeline** | 입력→해석→실행→투영. 6단계. 각 단계는 하나의 책임만 진다 |
| **ZIFT** | Zone(영역), Item(데이터), Field(prop), Trigger(액션) — ARIA 53개 속성과 동형인 4개 개념으로 모든 UI를 선언한다 |
| **ARIA** | role을 선언하면 접근성이 보장된다 |
| **Collection** | 데이터 구조가 정규화된다. 트리, 리스트, 그리드 — 하나의 구조 |
| **History** | Undo/Redo가 미들웨어로 자동 제공된다 |
| **Keybindings** | 키보드 단축키가 command({ key })로 선언되고, OS가 resolve한다 |
| **headless/** | OS의 두뇌. ARIA·속성 계산(`computeItem`)을 DOM 컴포넌트와 테스트가 같은 함수로 호출한다. "Zero Drift" — headless 테스트가 통과하면 DOM도 동일하게 동작한다 |
| **defineApp()** | 앱 정의의 유일한 진입점. 상태·커맨드·Zone·바인딩·테스트가 이 하나를 통과한다. 앱 수준 Pit of Success |
| **App Modules** | `history()`, `persistence()` 등 기능을 플러그인으로 설치한다. 구현 없이 선언으로 해결 |
| **Command Scoping** | 커맨드가 앱 단위로 격리된다. 여러 앱이 같은 OS 위에서 충돌 없이 공존하는 메커니즘 |
| **TestPage** | DOM 없이 전체 상호작용을 검증한다. Playwright와 동형 API (`locator`, `press`, `click`, `attrs`) |

이 구조 안에서 코드를 쓰면, 올바르게 만들어지는 것이 기본값이다.
이 구조를 우회하면, 인간이 검수할 수 없는 코드가 된다.

> **핵심**: `headless/compute.ts`가 OS의 두뇌이고, DOM 컴포넌트는 그 투영이다.
> 테스트가 headless에서 통과하면 DOM도 동일하게 동작한다. 브라우저 없이 품질이 증명된다.


---

## 부록: Cynefin 의사결정 프레임워크

> 코드를 고치기 전에 도메인을 판단한다.

| 도메인 | 판단 기준 | 전략 |
|--------|----------|------|
| **Clear** | 정답이 있다. 기존 패턴이 있다. | 즉시 실행 |
| **Complicated** | 선택지가 있지만 분석하면 좁혀진다. | 분석 후 실행 |
| **Complex** | 정답이 없다. 맥락에 따라 다르다. | 멈추고 묻는다 |
| **Chaotic** | 긴급. 분석할 시간이 없다. | 봉쇄 후 분석 |

모르면 묻는다. 추측으로 구현하지 않는다.
잘못된 방향으로 100줄 쓰는 것보다 질문 하나가 낫다.

> **정확성**: 수치(개수, 파일수, 오류수)를 보고하기 전에 반드시 실제 파일을 `view_file`이나 `grep`으로 확인한다.
> 이전 세션 summary나 컨텍스트에서 수치를 추론하면 틀린다. 직접 확인이 유일한 정답이다.


---

## 참조 — 필요할 때 여기를 본다

이 섹션의 지식은 매 세션 기억할 필요 없다.
해당 상황이 발생했을 때 찾아서 읽는다.

### 설계 판단이 필요할 때

| 상황 | 참조 |
|------|------|
| 새 패턴을 만들어야 할 것 같을 때 | `.agent/knowledge/design-principles.md` |
| 새 패턴이 ZIFT 중 무엇인지 판단할 때 | `.agent/knowledge/domain-glossary.md` → ZIFT × ARIA 매핑 |
| Zone의 데이터 모델(from/to/entity/with[])을 설계할 때 | `docs/2-area/official/os/zone-data-model.md` |
| 아키텍처 선택지가 여럿일 때 | `.agent/knowledge/design-principles.md` |
| headless와 DOM의 경계를 판단할 때 | `.agent/knowledge/zero-drift.md` |
| 상태를 어디에 배치할지 모를 때 | `.agent/knowledge/design-principles.md` |
| 폴더/파일 위치를 판단할 때 | `.agent/knowledge/folder-structure.md` → 4-Lens Stack |

### 코드를 작성할 때

| 상황 | 참조 |
|------|------|
| 파일/폴더 이름을 지을 때 | `.agent/knowledge/naming-conventions.md` |
| 함수 이름 동사를 선택할 때 (resolve? compute? get?) | `.agent/knowledge/naming.md` → 동사 Dictionary |
| 타입 이름 접미사를 선택할 때 (Entry? Result? Handle?) | `.agent/knowledge/naming.md` → 접미사 Dictionary |
| 도메인 개념이 무엇인지 확인할 때 (Zone? Item? Cursor?) | `.agent/knowledge/domain-glossary.md` |
| 성능 관련 패턴이 필요할 때 | `.agent/knowledge/coding-rules.md` |
| 1-listen에서 함수를 작성할 때 | `.agent/knowledge/naming.md` → 파이프라인 동사 |
| OS 기능을 앱에서 import할 때 | `@os-sdk/os`에서 import. `@os-core/*` 직접 import 금지 |

### 테스트를 작성할 때

| 상황 | 참조 |
|------|------|
| 어떤 테스트 도구를 쓸지 판단할 때 | `.agent/knowledge/verification-standards.md` |
| APG 패턴을 구현할 때 | `.agent/knowledge/verification-standards.md` |
| 리팩토링 가치를 판단할 때 | `.agent/knowledge/verification-standards.md` |

### 작업 방식이 불확실할 때

| 상황 | 참조 |
|------|------|
| 스코프가 너무 클 때 | `.agent/knowledge/working-standards.md` |
| 사용자 가설과 내 판단이 다를 때 | `.agent/knowledge/working-standards.md` |
| OS gap을 발견했을 때 | `.agent/knowledge/working-standards.md` |

### OS 아키텍처를 이해해야 할 때

| 상황 | 참조 |
|------|------|
| Interactive OS의 전체 비전 | `docs/2-area/official/VISION.md` |
| 커널 구조와 API | `docs/2-area/official/kernel/` |
| OS 레이어별 가이드 | `docs/2-area/official/os/` |
| ZIFT 스펙 | KI: `ZIFT Standard Specification` |
| 포커스 시스템 | KI: `Antigravity Interaction OS Architecture` |

### 워크플로우를 실행할 때

| 상황 | 참조 |
|------|------|
| TDD 사이클 (Red/Green) | `.agent/knowledge/red.md`, `.agent/knowledge/green.md` |
| UI 바인딩 | `.agent/knowledge/bind.md` |
| 감사/리뷰 | `.agent/knowledge/audit.md` |
| 리팩토링 | `.agent/knowledge/refactor.md` |
| BDD 스펙 작성 | `.agent/knowledge/spec.md` |
