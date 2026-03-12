# Spec — auto-zone-entry

> activeZoneId가 null일 때 OS_TAB/OS_NAVIGATE가 DOM_ZONE_ORDER 첫 Zone으로 자동 진입하도록 regression 수정

## 1. 기능 요구사항

### 1.1 Tab 자동 진입

**Story**: 사용자로서, 페이지 로드 후 클릭 없이 Tab을 누르면 첫 Zone의 첫 아이템에 포커스가 가기를 원한다. 그래야 키보드만으로 앱을 조작할 수 있기 때문이다.

**Scenarios:**

Scenario: T1-1 — Tab 첫 키에서 첫 Zone 자동 진입
  Given activeZoneId가 null (페이지 로드 직후)
  And getItems()가 있는 Zone이 1개 이상 등록됨
  When Tab을 누른다
  Then DOM_ZONE_ORDER 첫 Zone의 첫 아이템에 포커스된다
  And activeZoneId가 해당 Zone으로 설정된다

Scenario: T1-2 — Zone이 없으면 무반응
  Given activeZoneId가 null
  And 등록된 Zone이 0개
  When Tab을 누른다
  Then 아무 변화 없다 (기존 동작 유지)

Scenario: T1-3 — activeZoneId가 이미 있으면 기존 동작
  Given activeZoneId가 "docs-sidebar"
  When Tab을 누른다
  Then 기존 OS_TAB 로직대로 동작한다 (regression 없음)

### 1.2 Navigate 자동 진입

**Story**: 사용자로서, 페이지 로드 후 클릭 없이 화살표 키를 누르면 첫 Zone에서 네비게이션이 시작되기를 원한다.

**Scenarios:**

Scenario: T2-1 — ArrowDown 첫 키에서 첫 Zone 자동 진입
  Given activeZoneId가 null
  And getItems()가 있는 Zone이 1개 이상 등록됨
  When ArrowDown을 누른다
  Then DOM_ZONE_ORDER 첫 Zone의 첫 아이템에 포커스된다

Scenario: T2-2 — activeZoneId가 이미 있으면 기존 동작
  Given activeZoneId가 "docs-sidebar"
  When ArrowDown을 누른다
  Then 기존 OS_NAVIGATE 로직대로 동작한다

## 2. 범위 밖 (Out of Scope)

- 특정 Zone을 우선 포커스 대상으로 지정하는 기능 (autofocus priority)
- Shift+Tab 역방향 자동 진입 (T1과 동일 패턴이므로 자동 커버)
- 브라우저 native Tab과의 interop (이미 tab.behavior="native"로 분기됨)
