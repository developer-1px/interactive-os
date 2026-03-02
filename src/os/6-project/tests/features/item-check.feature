Feature: Item.CheckTrigger

  Background:
    Given a list zone "todo-list" with onCheck registered
    And items: ["todo-1", "todo-2", "todo-3"]
    And focused on "todo-1"

  Scenario: CheckTrigger click dispatches onCheck with correct itemId
    When user clicks CheckTrigger of "todo-1"
    Then onCheck should be called with focusId = "todo-1"

  Scenario: CheckTrigger click does NOT dispatch onAction
    When user clicks CheckTrigger of "todo-1"
    Then onAction should NOT have been called

  Scenario: CheckTrigger click also focuses the item
    Given focus is on "todo-2"
    When user clicks CheckTrigger of "todo-1"
    Then focus should be on "todo-1"
    And onCheck should be called with focusId = "todo-1"

  Scenario: Space key still triggers onCheck (regression)
    Given focus is on "todo-1"
    When user presses Space
    Then onCheck should be called with focusId = "todo-1"

  Scenario: Regular item click triggers onAction, not onCheck
    When user clicks "todo-1" (not on CheckTrigger)
    Then onAction should be called
    And onCheck should NOT have been called
