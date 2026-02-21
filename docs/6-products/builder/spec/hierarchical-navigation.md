# Spec — 계층 탐색 (Hierarchical Navigation)

> Source: 테스트 코드 역산 (hierarchical-navigation.test.ts)
> Verified: 826 tests pass

## 1. 계층 구조

```
Section (data-level="section")
  └── Group (data-level="group")
       └── Item (data-level="item")
```

## 2. BDD Scenarios

```gherkin
Feature: 계층 탐색

Scenario: drill-down — Section → Group
  Given Section 레벨의 아이템에 포커스가 있다
  When Enter를 실행한다 (onAction)
  Then 해당 Section의 첫 번째 Group으로 포커스가 이동한다

Scenario: drill-down — Group → Item
  Given Group 레벨의 아이템에 포커스가 있다
  When Enter를 실행한다
  Then 해당 Group의 첫 번째 Item으로 포커스가 이동한다

Scenario: drill-down — Item에서 → 편집 진입
  Given Item 레벨의 아이템에 포커스가 있다
  When Enter를 실행한다
  Then OS_FIELD_START_EDIT가 실행된다 (인라인 편집 진입)

Scenario: drill-down — 알 수 없는 레벨 → no-op
  Given data-level이 없는 아이템에 포커스가 있다
  When Enter를 실행한다
  Then 아무 일도 일어나지 않는다

Scenario: drill-up — Item → Group
  Given Item 레벨의 아이템에 포커스가 있다
  When Backslash(\)를 실행한다
  Then 해당 Item을 포함하는 Group으로 포커스가 이동한다

Scenario: drill-up — Group → Section
  Given Group 레벨의 아이템에 포커스가 있다
  When Backslash(\)를 실행한다
  Then 해당 Group을 포함하는 Section으로 포커스가 이동한다

Scenario: 아이템 필터링 — 레벨별
  Given canvas에 Section, Group, Item 혼재된 아이템이 있다
  When createCanvasItemFilter를 적용한다
  Then 현재 레벨(기본: section)에 해당하는 아이템만 네비게이션 대상이 된다

Scenario: 하위 탐색 — 재귀적 검색
  Given Section 안에 Group이 없고 직접 Item이 있다
  When Section에서 drill-down한다
  Then 재귀적으로 첫 번째 하위 아이템을 찾아 포커스한다
```

## 3. item query 유틸

```gherkin
Feature: Item Attribute Query

Scenario: data-level 읽기
  Given 아이템에 data-level="section" 속성이 있다
  When getItemAttribute(itemId, "data-level")을 호출한다
  Then "section"을 반환한다

Scenario: 알 수 없는 아이템 → null
  Given 존재하지 않는 itemId이다
  When getItemAttribute를 호출한다
  Then null을 반환한다
```
