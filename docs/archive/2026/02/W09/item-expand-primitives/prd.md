# PRD — Item.ExpandTrigger + Item.ExpandContent

## 기능 요구사항

### FR1: ItemContext
- Item component가 children을 `<ItemContext.Provider value={{ zoneId, itemId }}>`로 감싼다
- ExpandTrigger와 ExpandContent가 parent Item의 identity를 읽을 수 있다

### FR2: Item.ExpandTrigger
- `<Item.ExpandTrigger>` 클릭 시 parent Item의 expand 상태를 토글한다
- `asChild` 지원 — child element에 클릭 핸들러 merge
- DOM에 `data-expand-trigger` 투사 (Component 내부, 관습 아님)
- resolveMouse가 `[data-expand-trigger]` 인식 시 expand 토글 (onAction 억제)
- `Object.assign(Item, { ExpandTrigger })` namespace merge

### FR3: Item.ExpandContent
- `<Item.ExpandContent>` children은 parent Item이 expanded일 때만 렌더
- collapsed이면 null 반환 (React unmount)
- `Object.assign(Item, { ExpandContent })` namespace merge

### FR4: resolveMouse 확장
- 클릭 대상이 `[data-expand-trigger]` 내부이면:
  - Item 포커스 (기존)
  - Expand 토글 (새)
  - onAction 억제 (새)
- 클릭 대상이 `[data-expand-trigger]` 외부이면:
  - 기존 동작 유지 (OS_CLICK → onAction)

### FR5: Backward Compatibility
- 기존 render prop 패턴 `{({ isFocused, isExpanded }) => ...}` 계속 동작
- ExpandTrigger/ExpandContent는 선택적 사용

## 엣지 케이스

- Item이 expandable이 아닌데 ExpandTrigger를 사용한 경우 → noop (경고?)
- nested ExpandTrigger → 가장 가까운 parent Item의 expand 토글
- ExpandContent 없이 ExpandTrigger만 사용 → 유효 (수동 렌더 유지)

## BDD 시나리오

```gherkin
Feature: Item.ExpandTrigger

  Scenario: Click toggles expansion
    Given a tree zone with expandable item "folder:api"
    When user clicks ExpandTrigger of "folder:api"
    Then "folder:api" should be expanded
    And onAction should NOT be dispatched

  Scenario: Click collapsed item expands it
    Given "folder:api" is collapsed
    When user clicks ExpandTrigger of "folder:api"
    Then "folder:api" should be expanded

  Scenario: Click expanded item collapses it
    Given "folder:api" is expanded
    When user clicks ExpandTrigger of "folder:api"
    Then "folder:api" should be collapsed

  Scenario: ExpandContent renders only when expanded
    Given "folder:api" is collapsed
    Then ExpandContent children should not be rendered
    When "folder:api" is expanded
    Then ExpandContent children should be rendered

  Scenario: Keyboard expand still works
    Given focus is on "folder:api"
    When user presses ArrowRight
    Then "folder:api" should be expanded
    (existing behavior — no regression)
```

## Glossary

| 개념 | 코드 이름 | 패턴 |
|------|----------|------|
| 클릭→expand 토글 | `Item.ExpandTrigger` | `[Prim].[Intent][Role]` |
| expanded 조건 렌더 | `Item.ExpandContent` | `[Prim].[Intent][Role]` |
| parent Item scope | `ItemContext` | `[Prim]Context` |
| OS 커맨드 | `OS_TOGGLE_EXPAND` | `OS_[ACTION]` |
| DOM 마킹 | `data-expand-trigger` | Component 투사 |
