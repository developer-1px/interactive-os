# Spec — testbot-zift (v2 재작성)

> 한 줄 요약: TestBot panel을 ZIFT(accordion+toolbar)로 재구성하여 headless 검증 가능하게 한다.

> **v2 재작성 사유**: v1 spec은 DT 없이 OS 기본 동작만 나열하여 앱 고유 행동 8개가 전부 누락되었다.
> 개선된 `/spec` 워크플로우(이관 게이트 + DT 필수)로 재작성.

## 0. V1 행동 전수 추출 (이관 프로젝트 게이트)

V1 `TestBotPanel.tsx`에서 추출한 사용자 행동 10개:

| # | 행동 | V1 메커니즘 |
|---|------|------------|
| B1 | Run All — 전체 테스트 실행 | `onClick={runAll}` → `executeAll(false)` |
| B2 | Quick Run — headless 전체 실행 | `onClick={quickRun}` → `executeAll(true)` |
| B3 | Run Suite — 개별 suite 실행 | `onClick={() => runSuite(si)}` |
| B4 | Stop — 실행 중단 | `dispatch("testbot:allDone")` |
| B5 | Toggle Suite — accordion 접기/펴기 | `setState(Set)` |
| B6 | Copy Failures — 실패 결과 복사 | `clipboard.writeText(formatLog(suites, true))` |
| B7 | Copy Suite — 개별 suite 결과 복사 | `clipboard.writeText(formatLog([suite]))` |
| B8 | Auto-scroll to active suite | `scrollIntoView` callback ref |
| B9 | Auto-expand running/failed suite | 조건부 isExpanded |
| B10 | Script auto-discovery | `TestBotRegistry.initZoneReactive()` |

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 Suite 탐색 (Accordion Zone)

**Story**: 개발자로서, 테스트 suite 목록을 키보드로 탐색하고 접기/펴기를 원한다. 그래야 관심 있는 suite의 step 상세를 볼 수 있기 때문이다.

**Use Case — 주 흐름:**
1. TestBot panel이 열리면 suite 목록이 accordion으로 표시된다.
2. 사용자가 ArrowDown/Up으로 suite 간 이동한다.
3. Enter/Space로 suite를 펴서 step timeline을 본다.

**Scenarios:**

Scenario: S1 — Suite 접기/펴기
  Given suite "Login Flow"가 접혀 있음
  When Enter를 누름
  Then suite가 펴지고 step timeline이 보임

Scenario: S2 — Suite 접기
  Given suite "Login Flow"가 펴져 있음
  When Enter를 누름
  Then suite가 접히고 step timeline이 숨겨짐

Scenario: S3 — 다음 suite로 이동
  Given "Login Flow" suite에 포커스
  When ArrowDown
  Then 다음 suite로 포커스 이동

Scenario: S4 — 이전 suite로 이동
  Given 두 번째 suite에 포커스
  When ArrowUp
  Then 첫 번째 suite로 포커스 이동

Scenario: S5 — 첫 suite로 점프
  Given 세 번째 suite에 포커스
  When Home
  Then 첫 suite로 포커스 이동

Scenario: S6 — 마지막 suite로 점프
  Given 첫 suite에 포커스
  When End
  Then 마지막 suite로 포커스 이동

### 1.2 Suite 실행 (앱 고유)

**Story**: 개발자로서, 개별 suite를 선택하여 실행하거나 재실행하고 싶다. 그래야 실패 suite만 빠르게 재검증할 수 있기 때문이다.

**Scenarios:**

Scenario: T1 — 개별 suite 실행 (planned 상태)
  Given suite "Login Flow"가 planned 상태
  When suite에서 activate (Enter/click)
  Then executeSuite가 호출되어 해당 suite만 실행됨

Scenario: T2 — 실패 suite 재실행
  Given suite "Login Flow"가 done + failed 상태
  When suite에서 activate
  Then executeSuite가 재호출됨

Scenario: T3 — 실행 중 suite activate 무시
  Given suite "Login Flow"가 running 상태
  When suite에서 activate
  Then noop (재실행하지 않음)

### 1.3 Toolbar 액션 (앱 고유)

**Story**: 개발자로서, Run All / Quick 버튼으로 전체 테스트를 실행하고 싶다. 그래야 한 번에 전체 검증을 할 수 있기 때문이다.

**Scenarios:**

Scenario: A1 — Run All 실행
  Given 테스트가 실행 중이 아님 (idle)
  When toolbar에서 "Run All" activate
  Then executeAll(scripts, false) 호출 — 애니메이션 있는 전체 실행

Scenario: A2 — Quick Run 실행
  Given 테스트가 실행 중이 아님 (idle)
  When toolbar에서 "Quick" activate
  Then executeAll(scripts, true) 호출 — headless 전체 실행

Scenario: A3 — 실행 중 Run All/Quick 무시
  Given 테스트가 실행 중 (isRunning=true)
  When toolbar에서 "Run All" activate
  Then noop (이중 실행 방지)

Scenario: A4 — Toolbar 키보드 탐색
  Given "Run All"에 포커스
  When ArrowRight
  Then "Quick" 버튼으로 포커스 이동

### 1.4 실행 제어 (앱 고유)

**Story**: 개발자로서, 실행 중인 테스트를 중단하고 싶다. 그래야 잘못된 실행을 빠르게 멈출 수 있기 때문이다.

**Scenarios:**

Scenario: C1 — Stop 실행
  Given 테스트가 실행 중 (isRunning=true)
  When Stop 버튼 activate
  Then isRunning=false로 전환, 실행 중단

### 1.5 결과 복사 (앱 고유)

**Story**: 개발자로서, 테스트 결과를 클립보드에 복사하고 싶다. 그래야 실패 리포트를 공유할 수 있기 때문이다.

**Scenarios:**

Scenario: R1 — 실패 결과 복사
  Given 실행 완료 + failCount > 0
  When "Copy Failures" 버튼 activate
  Then 실패 suite들의 포맷된 로그가 클립보드에 복사됨

Scenario: R2 — 개별 suite 결과 복사
  Given suite "Login Flow"가 done 상태
  When 해당 suite의 Copy 버튼 activate
  Then 해당 suite의 포맷된 로그가 클립보드에 복사됨

### 1.6 자동 UX (시스템)

**Scenarios:**

Scenario: X1 — 실행 중 active suite 자동 스크롤
  Given suite 3이 running 상태
  When 화면에 보이지 않음
  Then 자동으로 suite 3이 viewport에 스크롤됨

Scenario: X2 — 실패 suite 자동 펼침
  Given 실행 완료, suite 2가 failed
  When 실행 종료 시점
  Then suite 2가 자동으로 펴져서 step 상세가 보임

Scenario: X3 — Script 자동 발견
  Given TestBot panel이 마운트됨
  When zone-reactive manifest가 활성 scripts를 감지
  Then suites가 자동 초기화됨 (initSuites)

## 2. Decision Table

### DT-1: Suites Accordion (Zone: testbot-suites)

| # | 상태 | 입력 | Command | 결과 | Scenario |
|---|------|------|---------|------|----------|
| 1 | suite 접힘 | Enter/Space | OS_EXPAND | 펴짐 | S1 |
| 2 | suite 펴짐 | Enter/Space | OS_EXPAND | 접힘 | S2 |
| 3 | any suite | ArrowDown | OS_NAVIGATE | 다음 포커스 | S3 |
| 4 | any suite | ArrowUp | OS_NAVIGATE | 이전 포커스 | S4 |
| 5 | any suite | Home | OS_NAVIGATE | 첫 포커스 | S5 |
| 6 | any suite | End | OS_NAVIGATE | 끝 포커스 | S6 |
| 7 | **planned** | **activate** | **onAction** | **executeSuite** | **T1** |
| 8 | **done+fail** | **activate** | **onAction** | **executeSuite** | **T2** |
| 9 | **running** | **activate** | **—** | **noop** | **T3** |

### DT-2: Toolbar (Zone: testbot-toolbar)

| # | 상태 | 입력 | Item | Command | 결과 | Scenario |
|---|------|------|------|---------|------|----------|
| 1 | idle | activate | tb-run-all | **onAction** | executeAll(false) | A1 |
| 2 | idle | activate | tb-quick | **onAction** | executeAll(true) | A2 |
| 3 | running | activate | tb-run-all | — | noop | A3 |
| 4 | running | activate | tb-quick | — | noop | A3 |
| 5 | any | ArrowRight | — | OS_NAVIGATE | 다음 버튼 | A4 |
| 6 | any | ArrowLeft | — | OS_NAVIGATE | 이전 버튼 | A4 |

### DT-3: 앱 고유 행동 (Zone 외)

| # | 상태 | 트리거 | 결과 | Scenario |
|---|------|--------|------|----------|
| 1 | running | Stop activate | isRunning=false | C1 |
| 2 | finished+fail>0 | Copy Failures | clipboard write | R1 |
| 3 | suite done | Copy Suite | clipboard write | R2 |
| 4 | suite running | 자동 | scroll into view | X1 |
| 5 | finished+!passed | 자동 | auto expand | X2 |
| 6 | mount | zone-reactive | initSuites | X3 |

## 3. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| suites[] | suite 목록 (SuiteState[]) | initSuites dispatch | 다음 initSuites |
| isRunning | 실행 중 여부 | startRun | allDone |
| currentIndex | 현재 실행 suite 인덱스 | suiteStart | allDone |
| SuiteStatus: planned | 실행 대기 | initSuites | suiteStart |
| SuiteStatus: running | 실행 중 | suiteStart | suiteDone |
| SuiteStatus: done | 실행 완료 | suiteDone | 다음 startRun |
| expandedSuites | 펴진 suite 집합 | toggle/auto-expand | toggle |

## 4. 범위 밖 (Out of Scope)

- Progress bar 렌더링 상세 (순수 UI, 행동 아님)
- Group header 렌더링 (순수 UI)
- Step timeline 내부 렌더링 상세 (순수 UI)
- TestBotRegistry 내부 구현
- Global API (registerTestBotGlobalApi)

---

## 변경 이력

| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-03-08 | v1 작성 | 초기 spec (DT 없음, OS 기본 동작만) |
| 2026-03-08 | **v2 재작성** | `/spec` 워크플로우 개선 후 검증. DT 3개 추가, 앱 고유 시나리오 8개 식별 |
