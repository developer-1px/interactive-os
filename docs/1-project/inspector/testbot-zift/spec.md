# Spec -- testbot-zift

> TestBot panel의 ZIFT 버전. accordion(suite list) + toolbar(actions). headless 검증 가능.

## 1. 기능 요구사항

### 1.1 Suite Accordion

**Story**: 개발자로서, suite 목록을 키보드로 탐색하고 펴기/접기를 원한다. 그래야 headless page로 검증 가능하기 때문이다.

**Use Case -- 주 흐름:**
1. 패널이 마운트되면 현재 TestBot suites가 accordion Items으로 표시된다
2. ArrowDown/Up으로 suite 간 이동
3. Enter/Space로 suite 펴기/접기 (aria-expanded)
4. 펼쳐진 suite는 step timeline을 표시

**Scenarios:**

Scenario: S1 — 초기 상태
  Given TestBot에 3개 suite가 planned 상태
  When accordion zone에 포커스
  Then 3개 Item이 존재하고 모두 aria-expanded="false"

Scenario: S2 — ArrowDown 탐색
  Given 첫 번째 suite에 포커스
  When ArrowDown
  Then 두 번째 suite에 포커스

Scenario: S3 — Enter로 펴기
  Given 첫 번째 suite에 포커스, aria-expanded="false"
  When Enter
  Then aria-expanded="true"

Scenario: S4 — Enter로 접기
  Given 첫 번째 suite에 포커스, aria-expanded="true"
  When Enter
  Then aria-expanded="false"

Scenario: S5 — 경계 clamp
  Given 마지막 suite에 포커스
  When ArrowDown
  Then 마지막 suite에 포커스 유지 (accordion은 loop=false)

Scenario: S6 — Home/End
  Given 중간 suite에 포커스
  When Home
  Then 첫 번째 suite에 포커스
  When End
  Then 마지막 suite에 포커스

### 1.2 Action Toolbar

**Story**: 개발자로서, Run All / Quick Run 을 키보드로 실행하고 싶다. 그래야 headless에서 toolbar onAction을 검증할 수 있기 때문이다.

**Use Case -- 주 흐름:**
1. toolbar zone에 Run All, Quick 아이템이 있다
2. 포커스 후 Enter로 활성화 -> onAction callback 호출

**Scenarios:**

Scenario: T1 — toolbar 아이템 탐색
  Given toolbar에 포커스
  When ArrowRight
  Then 다음 버튼으로 이동 (toolbar은 horizontal)

Scenario: T2 — Run All 활성화
  Given Run All 버튼에 포커스
  When Enter
  Then executeAll이 호출됨

### 1.3 Inspector 등록

**Story**: 개발자로서, Inspector에서 V1과 V2를 전환하며 비교하고 싶다.

Scenario: R1 — 두 패널 공존
  Given Inspector에 TESTBOT과 TESTBOT_V2가 등록됨
  When TESTBOT_V2 탭 선택
  Then V2 패널이 렌더됨 (V1은 숨김)

## 2. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| suites[] | TestBotState.suites (kernel) | initSuites dispatch | 새 initSuites |
| accordion expanded | aria-expanded per item | Enter/Space/Click | Enter/Space/Click |
| toolbar focus | activeDescendant | ArrowLeft/Right | Tab out |

## 3. 범위 밖

- 기존 TestBotPanel.tsx 수정
- executeAll/executeSuite 로직 변경
- TestBot runner 개선
- step timeline의 ZIFT화 (accordion content 내부는 읽기 전용)
- testBotGlobalApi 변경
