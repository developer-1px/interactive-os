# Spec — Collection CRUD & Clipboard

> Source: 테스트 코드 역산 (builder-canvas-clipboard, builder-paste, sidebar-commands)
> Verified: 826 tests pass

## 1. 사이드바 섹션 관리

### BDD Scenarios

```gherkin
Feature: 섹션 CRUD

Scenario: 섹션 삭제
  Given blocks에 ["hero", "news", "services", "footer"]가 있다
  When "news" 섹션을 삭제한다
  Then blocks에 ["hero", "services", "footer"]만 남는다
    And 나머지 섹션의 순서가 유지된다

Scenario: 존재하지 않는 섹션 삭제 — no-op
  Given blocks에 3개 섹션이 있다
  When 존재하지 않는 id로 삭제를 시도한다
  Then state가 변경되지 않는다

Scenario: 섹션 복제
  Given blocks에 ["hero", "news"]가 있다
  When "hero"를 복제한다
  Then blocks에 ["hero", "hero-copy", "news"] 순서로 3개가 된다
    And 복제본은 원본 바로 다음에 위치한다

Scenario: 섹션 위로 이동
  Given blocks에 ["hero", "news", "services"]가 있다
  When "news"를 위로 이동한다
  Then blocks 순서가 ["news", "hero", "services"]가 된다

Scenario: 첫 번째 섹션 위로 이동 — no-op
  Given "hero"가 첫 번째 섹션이다
  When "hero"를 위로 이동한다
  Then 순서가 변하지 않는다

Scenario: 섹션 아래로 이동
  Given blocks에 ["hero", "news", "services"]가 있다
  When "news"를 아래로 이동한다
  Then blocks 순서가 ["hero", "services", "news"]가 된다

Scenario: 마지막 섹션 아래로 이동 — no-op
  Given "footer"가 마지막 섹션이다
  When "footer"를 아래로 이동한다
  Then 순서가 변하지 않는다
```

## 2. 캔버스 클립보드

### BDD Scenarios

```gherkin
Feature: 캔버스 클립보드

Scenario: 동적 아이템(섹션) 복사 → 구조 복사
  Given 캔버스에서 섹션 아이템에 포커스가 있다
  When 복사(Ctrl+C)를 실행한다
  Then 블록 구조 전체가 클립보드에 저장된다

Scenario: 정적 아이템(필드) 복사 → 텍스트 값 복사
  Given 캔버스에서 필드 아이템에 포커스가 있다
  When 복사(Ctrl+C)를 실행한다
  Then 필드의 텍스트 값이 클립보드에 저장된다

Scenario: 정적 아이템(필드) 잘라내기 → no-op
  Given 캔버스에서 필드(정적) 아이템에 포커스가 있다
  When 잘라내기(Ctrl+X)를 실행한다
  Then 아무 변화 없다 (정적 아이템은 잘라낼 수 없음)

Scenario: 동적 아이템(섹션) 잘라내기 → 구조 제거
  Given 캔버스에서 섹션 아이템에 포커스가 있다
  When 잘라내기(Ctrl+X)를 실행한다
  Then 해당 섹션이 blocks에서 제거된다
    And 구조가 클립보드에 저장된다

Scenario: 정적 아이템에 텍스트 붙여넣기 → 필드 값 교체
  Given 필드 아이템에 포커스가 있다
    And 클립보드에 텍스트가 있다
  When 붙여넣기(Ctrl+V)를 실행한다
  Then 해당 필드의 값이 클립보드 텍스트로 교체된다

Scenario: 동적 항목 복사 후 부모 섹션 뒤에 붙여넣기
  Given 그룹 레벨 아이템에 포커스가 있다
    And 클립보드에 섹션 블록이 있다
  When 붙여넣기를 실행한다
  Then 포커스된 아이템의 부모 섹션 뒤에 블록이 삽입된다

Scenario: 연속 붙여넣기 — 고유 ID
  Given 섹션을 복사했다
  When 3회 연속 붙여넣기를 실행한다
  Then 3개의 새 블록이 모두 다른 id를 가진다

Scenario: 컨테이너 블록 붙여넣기 — children ID 재생성
  Given children이 있는 컨테이너 블록을 복사했다
  When 붙여넣기를 실행한다
  Then 부모와 모든 children의 id가 새로 생성된다
```

## 3. Undo/Redo

### BDD Scenarios

```gherkin
Feature: Undo/Redo

Scenario: 초기 상태에서 undo 불가
  Given 앱이 방금 시작되었다
  Then canUndo는 false이다

Scenario: 삭제 후 undo → 복원
  Given 섹션을 삭제했다
  When undo를 실행한다
  Then 삭제된 섹션이 원래 위치에 복원된다

Scenario: undo 후 redo → 재실행
  Given 삭제 후 undo했다
  When redo를 실행한다
  Then 섹션이 다시 삭제된다

Scenario: 이동 후 undo → 원래 순서 복원
  Given 섹션을 위로 이동했다
  When undo를 실행한다
  Then 원래 순서로 돌아간다

Scenario: 필드 수정 후 undo → 원래 값 복원
  Given 필드 값을 변경했다
  When undo를 실행한다
  Then 필드 값이 원래 값으로 돌아간다

Scenario: 여러 번 undo → 순차 복원
  Given 3개의 변경을 순서대로 실행했다
  When undo를 3번 실행한다
  Then 역순으로 모든 변경이 복원된다

Scenario: 새 액션 실행 → redo 이력 소멸
  Given undo 후 redo 가능한 상태이다
  When 새로운 변경을 실행한다
  Then redo 이력이 비워진다
```
