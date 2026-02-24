Feature: Field-layer keybindings — ZIFT 키보드 계층 순회

  Background:
    Given OS의 resolveKeyboard가 ZIFT 계층을 순회한다
    And 각 FieldType은 자기 기본 키맵을 가진다

  # ═══════════════════════════════════════
  # T1: Field-layer key resolution
  # ═══════════════════════════════════════

  Scenario: inline Field에서 Enter → OS_FIELD_COMMIT
    Given FieldRegistry에 "title" 필드가 fieldType "inline"으로 등록
    When resolveFieldKey("title", "Enter") 호출
    Then OS_FIELD_COMMIT 커맨드를 반환한다

  Scenario: inline Field에서 Escape → OS_FIELD_CANCEL
    Given FieldRegistry에 "title" 필드가 fieldType "inline"으로 등록
    When resolveFieldKey("title", "Escape") 호출
    Then OS_FIELD_CANCEL 커맨드를 반환한다

  Scenario: block Field에서 Enter → null (newline, Field가 소유)
    Given FieldRegistry에 "description" 필드가 fieldType "block"으로 등록
    When resolveFieldKey("description", "Enter") 호출
    Then null을 반환한다 (OS가 처리하지 않음)

  Scenario: block Field에서 Escape → OS_FIELD_CANCEL
    Given FieldRegistry에 "description" 필드가 fieldType "block"으로 등록
    When resolveFieldKey("description", "Escape") 호출
    Then OS_FIELD_CANCEL 커맨드를 반환한다

  Scenario: 미등록 필드(plain textarea)에서 Enter → null
    Given FieldRegistry에 등록되지 않은 요소에서 키 입력
    When resolveFieldKey(null, "Enter") 호출
    Then null을 반환한다

  Scenario: Field에서 ArrowDown → null (Zone에 위임)
    Given FieldRegistry에 "title" 필드가 fieldType "inline"으로 등록
    When resolveFieldKey("title", "ArrowDown") 호출
    Then null을 반환한다 (inline은 ArrowDown을 Zone에 위임)

  # ═══════════════════════════════════════
  # T2: Item-layer key resolution
  # ═══════════════════════════════════════

  Scenario: treeitem에서 ArrowRight(collapsed) → OS_EXPAND
    Given focusedItem의 role이 "treeitem"
    And aria-expanded가 "false"
    When resolveItemKey("treeitem", "ArrowRight", { expanded: false }) 호출
    Then OS_EXPAND 커맨드를 반환한다

  Scenario: treeitem에서 ArrowLeft(expanded) → OS_COLLAPSE
    Given focusedItem의 role이 "treeitem"
    And aria-expanded가 "true"
    When resolveItemKey("treeitem", "ArrowLeft", { expanded: true }) 호출
    Then OS_EXPAND({ action: "collapse" }) 커맨드를 반환한다

  Scenario: checkbox에서 Space → OS_CHECK
    Given focusedItem의 role이 "checkbox"
    When resolveItemKey("checkbox", "Space", {}) 호출
    Then OS_CHECK 커맨드를 반환한다

  Scenario: listbox item에서 ArrowRight → null (Item 레이어에 없음)
    Given focusedItem의 role이 "option"
    When resolveItemKey("option", "ArrowRight", {}) 호출
    Then null을 반환한다

  # ═══════════════════════════════════════
  # T3: ZIFT 계층 순회 통합
  # ═══════════════════════════════════════

  Scenario: editing Field + Enter → Field 레이어가 먼저 처리
    Given "title" 필드가 editing 상태 (fieldType: "inline")
    When Enter 키 입력
    Then resolveKeyboard가 OS_FIELD_COMMIT을 반환
    And Zone/Global 레이어는 조회하지 않는다

  Scenario: editing block Field + Enter → 아무 커맨드도 안 발동
    Given "description" 필드가 editing 상태 (fieldType: "block")
    When Enter 키 입력
    Then resolveKeyboard가 빈 결과를 반환 (브라우저 기본 동작 = 줄바꿈)

  Scenario: non-editing treeitem + ArrowRight → Item 레이어 처리
    Given editing 상태가 아님
    And focusedItem role이 "treeitem" (collapsed)
    When ArrowRight 키 입력
    Then resolveKeyboard가 OS_EXPAND를 반환

  Scenario: non-editing listbox + ArrowDown → Zone 레이어 처리
    Given editing 상태가 아님
    And focusedItem role이 "option"
    When ArrowDown 키 입력
    Then resolveKeyboard가 OS_NAVIGATE(down)을 반환

  Scenario: 미등록 textarea + Enter → 아무 커맨드도 안 발동
    Given FieldRegistry에 미등록인 plain textarea가 focus
    When Enter 키 입력
    Then resolveKeyboard가 빈 결과를 반환 (브라우저 기본 = 줄바꿈)
    And OS_FIELD_COMMIT이 발동하지 않는다
