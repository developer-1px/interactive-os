# Headless Test 개념 확립 — 테스팅 패러다임 정의

| 항목 | 내용 |
|------|------|
| **원문** | 우리는 일단 이 새로운 테스팅 개념을 확립하는게 제일 먼저야. headless test 라고 부르고 있었어. |
| **내(AI)가 추정한 의도** | **경위**: 백로그 현황 보고에서 테스트 도메인 4개 프로젝트가 전부 Stale, 32 FAIL, 7 TODO, OS Gap 8건이 드러남. **표면**: headless test라는 이름으로 불리는 테스팅 개념을 문서화하고 확립하라. **의도**: 흩어진 테스팅 프로젝트(headless-simulator, test-observability, replay, apg-suite)를 하나의 비전으로 묶는 상위 개념을 정의하여, 이후 작업의 방향과 우선순위를 확정하고 싶다. |
| **날짜** | 2026-03-10 |
| **상태** | 분석 완료 — 의사결정 대기 |

---

## 1. 개요

Interactive OS의 테스팅 시스템은 **Headless Test**라는 고유한 패러다임 위에 구축되어 있다. 핵심 아이디어는:

> **하나의 TestScript가 3개 환경에서 동형(isomorphic)으로 실행된다.**

```
TestScript (write once)
    │
    ├─ 1. Headless  — createHeadlessPage()  — vitest, 순수 함수, <1ms
    ├─ 2. Browser   — createBrowserPage()   — Inspector, PointerEvent + 시각화
    └─ 3. Playwright — native page           — E2E, shim 0 lines
```

이것이 가능한 이유는 OS가 **모든 상태를 Kernel에서 관리**하기 때문이다. DOM이 없어도 커널 상태만으로 ARIA 속성, 포커스, 선택 상태를 계산할 수 있다. 이 속성을 **Zero Drift**라고 부른다: headless 테스트 통과 = DOM 동일 동작.

---

## 2. 분석 — Naming Key Pool

### 2.1 범위

`packages/os-devtool/src/testing/` 전체 (11개 소스 파일 + 20개 APG 스크립트)

### 2.2 Key Pool 표

#### Prefix / Adjective

| Key | Meaning | Appears In |
|-----|---------|------------|
| `Headless` | DOM 없이 커널만으로 실행 | `createHeadlessPage`, `HeadlessZoneOptions`, `registerHeadlessZone`, `createHeadlessEffects` |
| `Browser` | Inspector에서 실제 DOM으로 실행 | `createBrowserPage`, `BrowserPage`, `BrowserPageOptions`, `BrowserStep` |
| `Test` | 테스트 관련 | `TestScript`, `TestScenario`, `TestInstance`, `TestBotRegistry` |
| `Diagnostic` | 진단 정보 | `DiagnosticKernel`, `formatDiagnostics`, `dumpDiagnostics` |
| `APG` | W3C ARIA Practices Guide | `apgAccordionScript`, `apgListboxSingleScript`, ... (20개) |

#### Verb

| Verb | Meaning (naming.md 기준) | Appears In |
|------|--------------------------|------------|
| `create` | 새 인스턴스 반환 | `createHeadlessPage`, `createBrowserPage`, `createAppPage`, `createNegatedLocator`, `createPositiveLocator`, `createHeadlessEffects`, `createVisualEffects` |
| `simulate` | 사용자 상호작용 재현 (test only) | `simulateKeyPress`, `simulateClick` |
| `register` | 런타임 레지스트리에 추가 | `registerHeadlessZone` |
| `build` | 여러 조각을 조립 | `buildKeyboardInput` |
| `resolve` | 입력→커맨드 결정 | `resolveClipboardShim` |
| `extract` | 원시 데이터에서 구조 추출 | `extractScenarios` |
| `get` | 레지스트리/컬렉션에서 조회 | `getZoneItems` |
| `format` | 데이터→사람 읽기 문자열 변환 | `formatDiagnostics` |
| `run` | 실행 트리거 | `runScenarios` |
| `set` | 값 직접 설정 | `setInteractionObserver` |
| `dispatch` | 커맨드를 커널에 전달 | `dispatchResult` |
| `reset` | 초기 상태로 복원 | `resetFocusState` |
| `dump` | 진단 출력 (side-effect) | `dumpDiagnostics` |

#### Noun

| Noun | Meaning | Appears In |
|------|---------|------------|
| `Page` | Playwright Page interface (3-tier) | `Page`, `createHeadlessPage`, `createBrowserPage`, `createAppPage` |
| `Locator` | 요소 탐색+assertion API | `Locator`, `LocatorAssertions`, `LocatorResult`, `LocatorLike`, `ExpectLocator` |
| `Script` | 단일 테스트 케이스 | `TestScript`, `listboxScript`, `toolbarScript`, ... |
| `Scenario` | Script를 묶는 zone 컨텍스트 | `TestScenario` |
| `Zone` | ZIFT 영역 단위 | `registerHeadlessZone`, `HeadlessZoneOptions`, `setupZone`, `getZoneItems`, `ZoneOrderEntry` |
| `Effects` | 시각 피드백 (Browser only) | `VisualEffects`, `createHeadlessEffects`, `createVisualEffects` |
| `Step` | 브라우저 실행 기록 단위 | `BrowserStep` |
| `Observer` | 상호작용 관찰 콜백 | `InteractionObserver`, `setInteractionObserver` |

#### Suffix

| Suffix | Meaning (naming.md 기준) | Appears In |
|--------|--------------------------|------------|
| `-Options` | 선택적 오버라이드 설정 | `HeadlessZoneOptions`, `BrowserPageOptions` |
| `-Result` | 함수 반환 계산 결과 | `LocatorResult`, `LocatorAssertionResult` |
| `-Entry` | 레지스트리 저장 단위 | `ZoneOrderEntry`, `ZoneBindingEntry` |
| `-Assertions` | 검증 메서드 집합 | `LocatorAssertions` |

### 2.3 이상 패턴 리포트

#### 🔴 동의어 충돌

| # | Key A | Key B | 의미 | 판정 |
|---|-------|-------|------|------|
| 1 | `setup` (`setupZone`) | `goto` (Playwright 표준) | zone 초기화 | **과도기 동의어**. `setupZone`은 legacy, `goto`가 target. apg-suite WP2에서 `setupZone` 제거 예정 → 해소 경로 있음 |
| 2 | `format` (`formatDiagnostics`) | `dump` (`dumpDiagnostics`) | 진단 출력 | **역할 분리**: `format` = 순수 함수 (string 반환), `dump` = side-effect (console 출력). 이름은 정확하나 나란히 놓으면 혼동 가능 |
| 3 | `LocatorAssertions` | `LocatorAssertionResult` | assertion 타입 | `Asserti**o**n` vs `Asserti**o**n` — 스펠링은 같지만 접미사가 다름: `-Assertions` (interface) vs `-Result` (구현). `Result`는 naming.md 기준 "함수 반환값"인데 여기선 assertion 구현체 → **의미 혼용** |

#### 🟡 고아 Key

| Key | 출현 | 판정 |
|-----|------|------|
| `dump` | `dumpDiagnostics` 1회 | `format`의 side-effect 래퍼. 통합 검토 대상 |
| `Shim` | `resolveClipboardShim` 1회 | clipboard headless 브릿지. 임시 패턴 표시 |
| `reset` | `resetFocusState` 1회 | BrowserPage 전용 초기화. 범위 한정 |
| `Bot` | `TestBotRegistry` 1회 | Inspector 시각 테스트 도구. 독립 개념 |

#### 🟣 의미 과적

| Key | 의미 1 | 의미 2 | 비고 |
|-----|--------|--------|------|
| `Page` | Playwright `Page` interface (types.ts) | headless/browser 구현체 (page.ts) | 인터페이스와 구현이 같은 이름. Playwright 호환성 위해 의도적 |
| `expect` | vitest `expect` | testing `expect` (Playwright shim) | 테스트 파일에서 import 경로로 구분. 이름 충돌 위험 |

---

## 3. 결론 / 제안

### 3.1 Headless Test 개념 정의 (제안)

Domain Glossary `§8. Testing Layer`에 다음을 추가:

| 용어 | 정의 |
|------|------|
| **Headless Test** | DOM 없이 커널 상태만으로 UI 상호작용을 검증하는 테스트 패러다임. Vitest에서 <1ms로 실행되며, 같은 TestScript가 Browser/Playwright에서도 동형으로 실행된다. |
| **Zero Drift** | Headless 테스트 통과 = DOM 동일 동작이라는 아키텍처 보장. Kernel의 순수 함수 계산이 이를 가능하게 한다. |
| **3-Tier Execution** | 하나의 TestScript가 실행되는 3개 환경: (1) Headless (vitest), (2) Browser (Inspector), (3) Playwright (E2E). |

### 3.2 Naming 이상 패턴 정리 (제안)

| 이슈 | 제안 조치 | 우선순위 |
|------|----------|---------|
| `setupZone` ↔ `goto` 동의어 | apg-suite WP2에서 `setupZone` 제거 시 자동 해소 | Backlog (기존 계획) |
| `LocatorAssertionResult` 접미사 혼용 | `-Result` → `-Impl` 또는 내부화 (export 제거) | P2 |
| `Page` 의미 과적 | Playwright 호환성 의도적 → 감수. 내부 `AppPage`만 구분 유지 | 수용 |
| `expect` 이름 충돌 | import 경로 분리로 충분. 추가 조치 불필요 | 수용 |

### 3.3 테스팅 프로젝트 통합 방향 (제안)

4개 Stale 프로젝트를 **Headless Test** 상위 개념으로 묶기:

```
Headless Test (개념)
    │
    ├─ headless-simulator  — 인프라: Adapter 얇게 → 거짓 GREEN 근절
    ├─ test-observability   — DX: 실패 시 자동 진단
    ├─ replay              — 시각화: 테스트 재생 도구
    └─ apg-suite           — 커버리지: W3C APG 전수 검증
```

---

## 4. Cynefin 도메인 판정

🟡 **Complicated** — "Headless Test"라는 이름과 3-tier 모델은 이미 코드에 구현되어 있고, 사용자도 이 이름으로 부르고 있다. 새로운 개념을 발명하는 것이 아니라 **이미 존재하는 것을 공식화**하는 작업. 분석하면 답이 좁혀진다.

---

## 5. 인식 한계

- Key Pool은 `packages/os-devtool/src/testing/` 범위만 분석. `tests/` 폴더의 테스트 파일 내부 식별자는 수집하지 않았다.
- `LocatorAssertionResult`의 접미사 혼용이 실제 사용자(AI 에이전트)에게 혼동을 유발하는지는 런타임 사례 확인이 필요하다.
- Zero Drift 보장의 실제 위반 사례(OG-025 Trigger focus drift 등)가 있어, 보장이 100%는 아닌 현재 상태.

---

## 6. 열린 질문

1. **Glossary 반영 범위**: `domain-glossary.md §8`에 위 3개 용어를 추가하는 것으로 충분한가, 아니면 별도 `headless-test.md` 문서를 만들 것인가?
2. **프로젝트 통합**: 4개 Stale 프로젝트를 하나의 epic으로 묶어 STATUS.md를 재편할 것인가?

---

> **3줄 요약**
> Headless Test = DOM 없이 커널만으로 UI를 검증하는 패러다임. 3-Tier(Headless/Browser/Playwright) 동형 실행 + Zero Drift 보장이 핵심.
> Naming Key Pool 분석 결과, 동의어 충돌 3건(setup↔goto 등) + 의미 과적 2건(Page, expect) 발견. 대부분 의도적이거나 해소 경로 있음.
> 4개 Stale 테스팅 프로젝트를 "Headless Test" 개념 아래 통합하여 방향 확정이 필요.
