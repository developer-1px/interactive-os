Feature: Item.ExpandTrigger + Item.ExpandContent

  Background:
    Given a tree zone "test-tree" with items:
      | id          | expandable |
      | folder:api  | true       |
      | api/auth    | false      |
      | api/users   | false      |
      | folder:docs | true       |
      | docs/readme | false      |

  Scenario: ExpandTrigger click toggles expansion
    Given "folder:api" is collapsed
    When user clicks ExpandTrigger of "folder:api"
    Then "folder:api" should be expanded

  Scenario: ExpandTrigger click on expanded item collapses it
    Given "folder:api" is expanded
    When user clicks ExpandTrigger of "folder:api"
    Then "folder:api" should be collapsed

  Scenario: ExpandTrigger click does NOT dispatch onAction
    Given "folder:api" is collapsed
    When user clicks ExpandTrigger of "folder:api"
    Then onAction should NOT have been called

  Scenario: Regular item click still dispatches onAction
    Given "folder:api" is collapsed
    When user clicks "folder:api" (not on ExpandTrigger)
    Then onAction should have been called

  Scenario: ExpandContent renders only when expanded
    Given "folder:api" is collapsed
    Then ExpandContent children of "folder:api" should not be in DOM
    When "folder:api" is expanded (via ArrowRight)
    Then ExpandContent children of "folder:api" should be in DOM

  Scenario: ExpandContent unmounts when collapsed
    Given "folder:api" is expanded
    Then ExpandContent children of "folder:api" should be in DOM
    When "folder:api" is collapsed (via ArrowLeft)
    Then ExpandContent children of "folder:api" should not be in DOM

  Scenario: Keyboard expand still works (regression)
    Given focus is on "folder:api"
    When user presses ArrowRight
    Then "folder:api" should be expanded
    When user presses ArrowLeft
    Then "folder:api" should be collapsed

  Scenario: ExpandTrigger also focuses the item
    Given focus is on "folder:docs"
    When user clicks ExpandTrigger of "folder:api"
    Then focus should be on "folder:api"
    And "folder:api" should be expanded
