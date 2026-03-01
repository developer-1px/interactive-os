# Spec — inspector-dogfooding

> 한 줄 요약: UnifiedInspector의 React Local State를 OS Store와 Command 기반 뷰 투영 아키텍처로 100% 마이그레이션한다.

## 1. 개요
현재 T1 진행 중: App 수준의 Store 모델링 및 검색/토글 필드 연동

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 검색 필터링 상태 연동 (Search Field)

**Story**: 개발자로서, 인스펙터 검색창에 텍스트를 입력하면 OS의 파이프라인(Command)을 거쳐 App Store의 검색어 상태가 갱신되어야 한다. 그래야 로컬 `useState` 없이 OS의 단방향 데이터 흐름을 탈 수 있기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 검색창(Textbox Field)에 타이핑한다.
2. `OS_UPDATE_FIELD` 커맨드가 발급된다.
3. App Store의 `inspectorSearchQuery` 상태가 업데이트된다.
4. View가 새로운 Store 상태를 구독하여 리렌더링된다.

**Scenarios:**

Scenario: 검색어 입력 시 Store 갱신
  Given 인스펙터 검색창 Field가 렌더링되어 있다
  When 사용자가 검색창에 "click" 텍스트를 입력한다
  Then `OS_UPDATE_FIELD` 커맨드가 dispatch된다
  And App Store의 `searchQuery`가 "click"으로 변경된다

Scenario: 검색창 지우기 (Clear)
  Given 검색어 "click"이 입력되어 있다
  When 사용자가 검색창 안의 X 버튼을 클릭하여 지운다
  Then `OS_UPDATE_FIELD` 커맨드가 dispatch되어 검색어가 빈 문자열 `""`로 변경된다

### 2.2 패널 그룹 필터 칩 토글 (Group Filter)

**Story**: 개발자로서, 인스펙터 그룹 필터 버튼을 클릭하면 커스텀 앱 커맨드를 통해 App Store의 비활성화된 그룹 목록이 갱신되어야 한다.

**Use Case — 주 흐름:**
1. 사용자가 상단의 그룹 태그 버튼(예: "kernel")을 클릭한다.
2. `INSPECTOR_TOGGLE_GROUP` 커맨드가 발급된다.
3. App Store의 `disabledGroups`에 "kernel"이 추가되거나 제거된다.

**Scenarios:**

Scenario: 활성화된 그룹 토글 (비활성화)
  Given "kernel" 그룹이 활성화 상태(disabledGroups에 없음)이다
  When "kernel" 그룹 버튼을 클릭한다
  Then App Store의 `disabledGroups` 세트에 "kernel"이 추가된다

Scenario: 비활성화된 그룹 토글 (재활성화)
  Given "kernel" 그룹이 비활성화 상태(disabledGroups에 있음)이다
  When "kernel" 그룹 버튼을 클릭한다
  Then App Store의 `disabledGroups` 세트에서 "kernel"이 제거된다

## 3. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 초기값 | 변경 경로 |
|------|------|--------|----------|
| `searchQuery` | 검색 필터 문자열 | `""` | `OS_UPDATE_FIELD` |
| `disabledGroups` | 비활성화된 트랜잭션 그룹 Set | `new Set()` | `INSPECTOR_TOGGLE_GROUP` |

## 4. 범위 밖 (Out of Scope)
- T1에서는 검색어와 필터 토글에 따른 "실제 트랜잭션 필터링 및 그룹핑(파생 상태) 연산 재작성"은 수행하지 않는다. (T2의 책임)
- T1에서는 **React `useState`를 걷어내고 App Store 연결 기반 마련 + 검색 및 토글 UI의 트리거를 Command Dispatch로 교체하는 것**까지만 증명한다.

## 5. Decision Table (T1 인터랙션 매핑)

| Zone | When (Action) | Command Dispatch | State Transition |
|------|---------------|------------------|------------------|
| `inspector-search` | `keyboard.type` | `OS_UPDATE_FIELD` | `searchQuery = payload.value` |
| `inspector-search` | `click(clearBtn)` | `OS_UPDATE_FIELD` | `searchQuery = ""` |
| `inspector-filters` | `click(groupBtn)` | `INSPECTOR_TOGGLE_GROUP` | `disabledGroups.toggle(groupName)` |

## 6. T2: 파생 데이터 연산 분리 (FilteredTx)

### 6.1 파생 상태 (Selector) 연동

**Story**: 개발자로서, 필터링된 트랜잭션 목록(`filteredTx`)을 컴포넌트 내부 렌더링 사이클이 아닌 분리된 함수로 취급하길 원한다. 그래야 뷰 레이어가 렌더링에만 집중하고, 복잡한 필터 연산을 뷰에서 덜어내어 도메인 레이어(App)로 이전할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. OS 파이프라인(검색어 변경, 그룹 토글, 새 트랜잭션 수신)이 작동하여 App/OS State가 변경되거나 트랜잭션이 추가된다.
2. `filterTransactions(transactions, disabledGroups, searchQuery)` 같은 순수 함수나 파생 상태가 재계산된다.
3. `UnifiedInspector`는 이 결과물만 활용하여 렌더링한다.

**Scenarios (Given/When/Then):**

Scenario: 검색어에 따른 트랜잭션 필터링
  Given 트랜잭션 데이터가 존재하고 App Store 검색어 상태가 "dispatch"이다
  When 필터링 로직을 통과시킨다
  Then "dispatch" 문자열을 속성이나 타입에 포함하는 트랜잭션만 포함된 배열이 반환된다

Scenario: 비활성화 그룹에 따른 트랜잭션 필터링
  Given App Store의 `disabledGroups`에 "kernel"이 들어 있다
  When 필터링 로직을 통과시킨다
  Then `.group === "kernel"`인 트랜잭션이 제외된 배열이 반환된다

### 6.2 상태 인벤토리 (T2 추가)

| 상태 연산 | 설명 | 의존성 |
|-----------|------|--------|
| `filteredTx` | 검색어 및 그룹 필터가 적용된 트랜잭션 배열 | `transactions` (from OS), `searchQuery`, `disabledGroups` (from App) |

### 6.3 범위 밖 (Out of Scope)
- T2에서는 필터링 최적화/캐싱 로직을 극한으로 튜닝하지 않는다. (순수 함수나 selector로 분리하는 구조적 decoupling에 집중)
- 새로운 종류의 필터를 추가하지 않는다. (기존 로직 유지)

## 7. T3: 명시적 `OS_SCROLL` 커맨드 구축

### 7.1 스크롤 상태 연동 (Auto Scroll)

**Story**: 개발자로서, 새 트랜잭션 수신 시 자동으로 맨 아래로 스크롤되는 동작이 React의 `useEffect` 생명주기에 숨겨져 있지 않고, 명시적인 OS Command(`OS_SCROLL` 또는 App Command)로 통제되기를 원한다. 조건부 스크롤(사용자가 위로 스크롤 중일 때는 멈춤 등)의 판단 책임은 App이 지고, View는 오직 내려오는 Command에 따라 물리적 DOM 스크롤만 수행해야 한다.

**Use Case — 주 흐름:**
1. OS로부터 새로운 트랜잭션이 App Store로 들어온다.
2. App 로직이 현재 사용자의 스크롤 상태(`isUserScrolled`)와 검색어 상태(`searchQuery`)를 평가한다.
3. 자동 스크롤 조건에 부합하면 `OS_SCROLL` (또는 `INSPECTOR_SCROLL_TO_BOTTOM`) 커맨드를 dispatch한다.
4. UI 렌더러 측의 ZIFT Handler가 해당 커맨드를 수신하여 물리적 DOM API(`scrollIntoView` 등)를 실행한다.

**Scenarios:**

Scenario: 새 트랜잭션 수신 시 자동 스크롤
  Given 사용자가 위로 스크롤하지 않았고(`isUserScrolled == false`), 검색어가 없는 상태이다
  When 새 트랜잭션이 App Store에 추가된다
  Then App은 `INSPECTOR_SCROLL_TO_BOTTOM` 커맨드를 dispatch한다
  And View 레이어의 핸들러가 이를 감지하여 목록의 맨 마지막 요소로 스크롤한다

Scenario: 사용자가 위로 스크롤 중일 때 자동 스크롤 방지
  Given 사용자가 목록을 위로 스크롤하여 `isUserScrolled == true` 상태이다
  When 새 트랜잭션이 App Store에 추가된다
  Then App은 커맨드를 dispatch하지 않는다 (자동 스크롤 중지)

Scenario: 맨 아래로 수동 스크롤
  Given 사용자가 목록을 위로 스크롤한 상태이다
  When 사용자가 "맨 아래로" 버튼을 클릭한다
  Then `INSPECTOR_SCROLL_TO_BOTTOM` 커맨드가 dispatch된다
  And View가 맨 아래로 스크롤되며, `isUserScrolled` 상태가 `false`로 리셋된다

### 7.2 상태 인벤토리 (T3 추가)

| 상태 | 설명 | 초기값 | 변경 경로 |
|------|------|--------|----------|
| `isUserScrolled` | 사용자가 수동으로 위로 스크롤했는지 여부 | `false` | 스크롤 이벤트 핸들러 또는 `scrollToBottom` 호출 시 갱신 |

- 전역 `OS_SCROLL` 패러다임 완벽 구축보다는, Inspector App 내에서의 Command 기반 스크롤 제어 증명에 초점을 맞춘다.

## 8. T4: 임시 시각적 하이라이트 레이어 투영 (`HighlightOverlay`)

### 8.1 하이라이트 투영 상태 연동

**Story**: 개발자로서, UnifiedInspector에서 특정 트랜잭션의 Trigger나 노드에 마우스를 올렸을 때 대상 엘리먼트가 하이라이트되는 동작이, 직접적인 DOM 조작(imperative mutation)이 아닌 OS 상태 패러다임을 통해 투영(projection)되기를 원한다. 그래야 ZIFT 아키텍처의 단방향 데이터 흐름 원칙을 준수하고, UI 구성요소들이 순수 투영기로 동작할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. UnifiedInspector 엘리먼트에 마우스가 Hover된다 (`onMouseEnter`).
2. 해당 이벤트에서 뷰가 DOM을 조작하는 대신 `INSPECTOR_SET_HIGHLIGHT` 커맨드를 dispatch한다.
3. App Store는 `highlightedElementId` 상태를 업데이트한다.
4. 독립적인 `<HighlightOverlay />` 컴포넌트(튜영기)가 이 상태를 구독하고, 대상 엘리먼트의 좌표(혹은 Data Attribute)를 기반으로 시각적 하이라이트를 렌더링한다.
5. 마우스가 영역을 벗어나면 (`onMouseLeave`) `null` 값으로 커맨드를 다시 dispatch하여 하이라이트를 해제한다.

**Scenarios:**

Scenario: 엘리먼트 Hover 시 하이라이트 상태 설정
  Given UnifiedInspector가 렌더링되어 있다
  When 사용자가 트랜잭션 Trigger(예: `elementId`가 "foo"인 노드)에 마우스를 올린다
  Then `INSPECTOR_SET_HIGHLIGHT` 커맨드가 `document.querySelector`용 id("foo")와 함께 dispatch된다
  And App Store의 `highlightedNodeId` 상태가 "foo"로 변경된다

Scenario: Hover 해제 시 하이라이트 상태 해제
  Given `highlightedNodeId`가 "foo"로 설정되어 있다
  When 사용자가 해당 Trigger에서 마우스를 벗어난다 (`onMouseLeave`)
  Then `INSPECTOR_SET_HIGHLIGHT` 커맨드가 `null` (혹은 `undefined`)과 함께 dispatch된다
  And App Store의 `highlightedNodeId` 상태가 초기화된다

### 8.2 상태 인벤토리 (T4 추가)

| 상태 | 설명 | 초기값 | 변경 경로 |
|------|------|--------|----------|
| `highlightedNodeId` | 현재 하이라이트되어야 할 대상 엘리먼트의 ID 또는 식별자 | `null` | `INSPECTOR_SET_HIGHLIGHT` 커맨드 |

### 8.3 범위 밖 (Out of Scope)
- 하이라이트 오버레이의 극단적인 성능 최적화(ResizeObserver를 통한 실시간 트래킹 등)보다, 명령-상태-투영의 순방향 데이터 흐름을 확립하는 데 초점을 맞춘다.
