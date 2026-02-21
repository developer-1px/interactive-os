# Spec — Todo CRUD & Interactions

> Source: 테스트 코드 역산 (todo.test.ts, paste-integration.test.ts)
> Verified: 826 tests pass

## 1. BDD Scenarios

### 1.1 CRUD

```gherkin
Feature: Todo CRUD

Scenario: 할 일 추가
  Given draft에 "새 할 일"을 입력한다
  When addTodo를 실행한다
  Then todos에 "새 할 일"이 추가된다
    And todoOrder에 새 id가 추가된다

Scenario: 빈 텍스트로 추가 — no-op
  Given draft가 빈 문자열이다
  When addTodo를 실행한다
  Then todos에 변화 없다

Scenario: 할 일 삭제
  Given todos에 3개 항목이 있다
  When 두 번째 항목을 deleteTodo한다
  Then todos에 2개 항목이 남는다
    And todoOrder에서도 제거된다

Scenario: 할 일 완료 토글
  Given todo가 completed: false이다
  When toggleTodo를 실행한다
  Then completed가 true가 된다
  When 다시 toggleTodo를 실행한다
  Then completed가 false로 돌아간다

Scenario: 완료된 항목 일괄 삭제
  Given 5개 중 2개가 completed이다
  When clearCompleted를 실행한다
  Then completed된 2개만 삭제된다
    And 나머지 3개는 유지된다
```

### 1.2 편집

```gherkin
Feature: Todo 인라인 편집

Scenario: 편집 시작 → 수정 → 저장
  Given todo "기존 텍스트"에 포커스가 있다
  When startEdit를 실행한다
    And 텍스트를 "수정된 텍스트"로 변경한다
    And updateTodoText를 실행한다
  Then todo의 text가 "수정된 텍스트"로 갱신된다
    And editingId가 null이 된다

Scenario: 편집 취소 → 원래 값 유지
  Given todo를 편집 중이다
  When cancelEdit를 실행한다
  Then todo의 text가 원래 값 그대로 유지된다
    And editingId가 null이 된다

Scenario: 편집 중이 아닐 때 cancelEdit — 가드에 의해 차단
  Given editingId가 null이다 (편집 중 아님)
  When cancelEdit를 시도한다
  Then isEditing 가드에 의해 실행이 차단된다
```

### 1.3 순서 이동

```gherkin
Feature: Todo 순서 이동

Scenario: 위로 이동
  Given todoOrder가 ["a", "b", "c"]이다
  When "b"를 moveItemUp한다
  Then todoOrder가 ["b", "a", "c"]가 된다

Scenario: 아래로 이동
  Given todoOrder가 ["a", "b", "c"]이다
  When "b"를 moveItemDown한다
  Then todoOrder가 ["a", "c", "b"]가 된다

Scenario: 첫 번째 → 위로 이동 — no-op
  Given "a"가 첫 번째이다
  When moveItemUp한다
  Then 순서 변화 없다

Scenario: 카테고리 순서 이동
  Given categoryOrder가 ["personal", "work", "urgent"]이다
  When "work"를 moveCategoryUp한다
  Then categoryOrder가 ["work", "personal", "urgent"]가 된다
```

### 1.4 클립보드

```gherkin
Feature: Todo 클립보드

Scenario: 단일 복제
  Given todo "할 일 A"가 있다
  When duplicateTodo를 실행한다
  Then 같은 text의 새 todo가 생성된다 (다른 id)

Scenario: 단일 복사 → 붙여넣기
  Given todo를 copyTodo한다
  When pasteTodo를 실행한다
  Then 같은 text의 새 todo가 삽입된다

Scenario: 잘라내기 → 붙여넣기
  Given todo를 cutTodo한다
  Then 원본이 삭제된다
  When pasteTodo를 실행한다
  Then 원본과 같은 내용이 복원된다

Scenario: 클립보드 없이 붙여넣기 — no-op
  Given 클립보드가 비어있다
  When pasteTodo를 실행한다
  Then 변화 없다

Scenario: 새 복사가 이전 클립보드를 덮어쓴다
  Given "A"를 복사한 후 "B"를 복사한다
  When pasteTodo를 실행한다
  Then "B"가 붙여넣어진다

Scenario: 배치 복사 3개 → 붙여넣기
  Given 3개의 todo를 한 번에 copyTodo한다
  When pasteTodo를 실행한다
  Then 3개 모두 붙여넣어진다

Scenario: 배치 잘라내기 → 붙여넣기
  Given 3개의 todo를 cutTodo한다
  Then 3개 모두 삭제된다
  When pasteTodo를 실행한다
  Then 3개 모두 복원된다

Scenario: 붙여넣기 후 포커스
  Given todo를 복사한 후 붙여넣기한다
  When paste가 완료된다
  Then 새로 생성된 아이템에 포커스가 이동한다
    And 새 아이템이 선택된다
```

### 1.5 셀렉터 & 조건

```gherkin
Feature: 셀렉터 & 조건

Scenario: visibleTodos — 카테고리 필터링
  Given "personal" 카테고리가 선택되어 있다
  When visibleTodos를 조회한다
  Then categoryId="personal"인 todo만 반환된다

Scenario: categories — 순서 유지
  Given 3개 카테고리가 있다
  When categories를 조회한다
  Then categoryOrder 순서대로 반환된다

Scenario: stats — 정확한 카운트
  Given 5개 중 2개가 completed이다
  When stats를 조회한다
  Then total=5, active=3, completed=2이다

Scenario: canUndo — 초기 false
  Given 앱이 방금 시작되었다
  Then canUndo는 false이다

Scenario: isEditing — 편집 상태 반영
  Given editingId가 null이다
  Then isEditing은 false이다
  When startEdit를 실행한다
  Then isEditing은 true이다
```
