# Spec — Todo 키보드 & 마우스 인터랙션

> Source: osDefaults.ts, app.ts zone bindings, 실제 브라우저 테스트
> Scope: 사용자의 물리적 입력 → OS 커맨드 → 앱 상태 변화

기존 `crud-and-interactions.md`가 **커맨드 레벨** BDD라면,
이 문서는 **사용자 입력 레벨** BDD다. "어떤 키를 누르면 무슨 일이 일어나야 하는가?"

---

## 1. List Zone (role: listbox)

### 1.1 키보드 네비게이션

```gherkin
Feature: 리스트 키보드 네비게이션

Scenario: ArrowDown — 다음 항목으로 포커스 이동
  Given 리스트에 3개 항목 [A, B, C]이 있다
    And A에 포커스가 있다
  When ArrowDown을 누른다
  Then B에 포커스가 이동한다
    And A는 포커스를 잃는다
    And data-focused="true"가 B에 적용된다

Scenario: ArrowUp — 이전 항목으로 포커스 이동
  Given B에 포커스가 있다
  When ArrowUp을 누른다
  Then A에 포커스가 이동한다

Scenario: ArrowDown at bottom — 경계에서 멈춤
  Given C(마지막)에 포커스가 있다
  When ArrowDown을 누른다
  Then C에 포커스가 유지된다 (wrap 하지 않음)

Scenario: ArrowUp at top — 경계에서 멈춤
  Given A(첫 번째)에 포커스가 있다
  When ArrowUp을 누른다
  Then A에 포커스가 유지된다

Scenario: Home — 첫 번째 항목으로
  Given C에 포커스가 있다
  When Home을 누른다
  Then A에 포커스가 이동한다

Scenario: End — 마지막 항목으로
  Given A에 포커스가 있다
  When End를 누른다
  Then C에 포커스가 이동한다
```

### 1.2 키보드 선택 (Shift+Arrow)

```gherkin
Feature: 리스트 키보드 범위 선택

Scenario: Shift+ArrowDown — 선택 확장
  Given A에 포커스가 있다 (선택 없음)
  When Shift+ArrowDown을 누른다
  Then A와 B가 선택된다
    And B에 포커스가 이동한다
    And selectionAnchor가 A이다

Scenario: Shift+ArrowDown 연속 — 범위 확장
  Given A에 앵커, B에 포커스 (A,B 선택됨)
  When Shift+ArrowDown을 한번 더 누른다
  Then A, B, C가 모두 선택된다
    And C에 포커스가 이동한다

Scenario: Shift+ArrowUp — 선택 축소
  Given A에 앵커, C에 포커스 (A,B,C 선택됨)
  When Shift+ArrowUp을 누른다
  Then A, B만 선택된다
    And B에 포커스가 이동한다

Scenario: Space — 토글 선택
  Given B에 포커스가 있다
  When Space를 누른다
  Then B의 completed가 토글된다 (onCheck)

Scenario: Cmd+A — 전체 선택
  Given 리스트에 5개 항목이 있다
  When Cmd+A를 누른다
  Then 5개 모두 선택된다

Scenario: Escape — 선택 해제
  Given 3개 항목이 선택되어 있다
  When Escape를 누른다
  Then 모든 선택이 해제된다
```

### 1.3 키보드 액션

```gherkin
Feature: 리스트 키보드 액션

Scenario: Enter — 인라인 편집 시작
  Given B에 포커스가 있다 (네비게이팅 모드)
  When Enter를 누른다
  Then B의 텍스트 필드가 편집 모드로 전환된다 (startEdit)
    And editingId가 B의 id가 된다
    And 모드가 "editing"으로 전환된다

Scenario: Backspace — 삭제 다이얼로그
  Given B에 포커스가 있다
  When Backspace를 누른다
  Then 삭제 확인 Dialog가 열린다
    And pendingDeleteIds에 B의 id가 설정된다

Scenario: Delete — 삭제 다이얼로그 (Backspace와 동일)
  Given B에 포커스가 있다
  When Delete를 누른다
  Then 삭제 확인 Dialog가 열린다

Scenario: 다중 선택 후 Backspace — 배치 삭제
  Given A, B, C가 선택되어 있다
  When Backspace를 누른다
  Then Dialog에 "3개 항목 삭제" 메시지가 표시된다
    And pendingDeleteIds에 [A, B, C] id가 설정된다

Scenario: Cmd+ArrowUp — 순서 위로 이동
  Given todoOrder가 [A, B, C]이다
    And B에 포커스가 있다
  When Cmd+ArrowUp을 누른다
  Then todoOrder가 [B, A, C]가 된다

Scenario: Cmd+ArrowDown — 순서 아래로 이동
  Given B에 포커스가 있다
  When Cmd+ArrowDown을 누른다
  Then todoOrder가 [A, C, B]가 된다

Scenario: Cmd+Z — 실행 취소
  Given 방금 할 일을 삭제했다
  When Cmd+Z를 누른다
  Then 삭제된 할 일이 복원된다

Scenario: Cmd+Shift+Z — 다시 실행
  Given 방금 Undo를 실행했다
  When Cmd+Shift+Z를 누른다
  Then Undo가 취소된다 (삭제가 다시 적용된다)

Scenario: F2 — 편집 시작 (OS 표준)
  Given B에 포커스가 있다
  When F2를 누른다
  Then B가 편집 모드로 진입한다
```

### 1.4 키보드 클립보드

```gherkin
Feature: 리스트 키보드 클립보드

Scenario: Cmd+C — 복사
  Given B에 포커스가 있다
  When Cmd+C를 누른다
  Then B의 Todo 객체가 클립보드에 복사된다
    And B는 제거되지 않는다

Scenario: Cmd+X — 잘라내기
  Given B에 포커스가 있다
  When Cmd+X를 누른다
  Then B가 클립보드에 복사된다
    And B가 리스트에서 제거된다

Scenario: Cmd+V — 붙여넣기
  Given 클립보드에 Todo가 있다
    And A에 포커스가 있다
  When Cmd+V를 누른다
  Then 새 Todo가 리스트에 추가된다
    And 현재 카테고리가 적용된다

Scenario: Cmd+D — 복제 (앱 키바인딩)
  Given B에 포커스가 있다
  When Cmd+D를 누른다
  Then B와 같은 텍스트의 새 Todo가 생성된다

Scenario: 다중 선택 후 Cmd+C — 배치 복사
  Given A, B가 선택되어 있다
  When Cmd+C를 누른다
  Then 2개의 Todo 객체가 클립보드에 복사된다

Scenario: 다중 선택 후 Cmd+V — 배치 붙여넣기
  Given 클립보드에 2개의 Todo가 있다
  When Cmd+V를 누른다
  Then 2개 모두 현재 카테고리에 추가된다
```

### 1.5 마우스 인터랙션

```gherkin
Feature: 리스트 마우스 인터랙션

Scenario: 항목 클릭 → 포커스 + 선택
  Given 할 일 B가 있다
  When B를 마우스 클릭한다
  Then B에 포커스가 이동한다
    And B가 선택된다 (replace 모드)
    And 이전 선택은 해제된다

Scenario: 체크박스 클릭 → 완료 토글
  Given B의 체크박스 트리거가 있다
  When 체크박스를 클릭한다
  Then B의 completed가 토글된다

Scenario: 검색 X 버튼 클릭 → 검색 초기화
  Given 검색어 "회의"가 입력되어 있다
  When X 버튼을 클릭한다
  Then searchQuery가 ""로 초기화된다
    And 모든 할 일이 다시 표시된다

Scenario: Bulk Action Bar 삭제 클릭
  Given 3개 항목이 선택되어 Action Bar가 표시된다
  When "Delete" 버튼을 클릭한다
  Then 삭제 확인 Dialog가 열린다
    And pendingDeleteIds에 3개 id가 설정된다

Scenario: Bulk Action Bar 완료 클릭
  Given 3개 항목이 선택되어 있다
  When "Complete" 버튼을 클릭한다
  Then 3개 모두 completed=true가 된다
```

---

## 2. Edit Zone (role: textbox)

```gherkin
Feature: 편집 모드 키보드

Scenario: Enter (편집 중) → 저장
  Given 할 일 "기존"을 편집 중이다
    And 필드에 "수정됨"이 입력되어 있다
  When Enter를 누른다
  Then todo.text가 "수정됨"으로 갱신된다
    And editingId가 null이 된다
    And 네비게이팅 모드로 복귀한다

Scenario: Escape (편집 중) → 취소
  Given 할 일을 편집 중이다
    And 필드에 "임시"를 입력했다
  When Escape를 누른다
  Then todo.text가 원래 값으로 유지된다
    And editingId가 null이 된다
    And 네비게이팅 모드로 복귀한다

Scenario: 편집 중 ArrowDown — 네비게이션 차단
  Given 할 일을 편집 중이다 (editing 모드)
  When ArrowDown을 누른다
  Then 포커스가 이동하지 않는다 (OS 네비게이션 비활성)
    And 커서가 필드 내에서 이동한다

Scenario: 편집 중 Backspace — 텍스트 삭제 (OS_DELETE 아님)
  Given 편집 중이다
  When Backspace를 누른다
  Then 필드의 텍스트가 삭제된다
    And 삭제 Dialog가 열리지 않는다 (when: "editing"이므로)
```

---

## 3. Draft Zone (role: textbox)

```gherkin
Feature: 새 할 일 입력

Scenario: 텍스트 입력 후 Enter → 추가
  Given draft 필드에 포커스가 있다
  When "장보기"를 입력하고 Enter를 누른다
  Then todos에 "장보기"가 추가된다
    And draft 필드가 초기화된다 (resetOnSubmit)

Scenario: 빈 텍스트로 Enter — 차단
  Given draft 필드가 비어있다
  When Enter를 누른다
  Then 아무것도 추가되지 않는다 (schema validation: min(1))

Scenario: draft 필드에서 Escape — 포커스 해제
  Given draft 필드에 포커스가 있다
  When Escape를 누른다
  Then draft 필드의 포커스가 해제된다
```

---

## 4. Search Zone (role: textbox)

```gherkin
Feature: 검색 키보드

Scenario: 타이핑 → 실시간 필터링
  Given 검색 필드에 포커스가 있다
  When "회의"를 입력한다
  Then searchQuery가 "회의"가 된다 (trigger: "change")
    And visibleTodos가 "회의" 포함 항목만 반환한다

Scenario: Escape → 검색 해제
  Given 검색 필드에 "회의"가 입력되어 있다
  When Escape를 누른다
  Then searchQuery가 ""로 초기화된다 (onCancel: clearSearch)
    And 포커스가 검색 필드에서 벗어난다

Scenario: 검색 결과 0건 → 빈 상태
  Given 검색 필드에 "존재하지않는"을 입력한다
  When 필터링이 완료된다
  Then visibleTodos가 빈 배열이다
    And 빈 상태 메시지가 표시된다
```

---

## 5. Sidebar Zone (role: listbox)

```gherkin
Feature: 사이드바 키보드

Scenario: ArrowDown — 카테고리 간 이동
  Given 사이드바에 [Inbox, Work, Personal]이 있다
    And Inbox에 포커스가 있다
  When ArrowDown을 누른다
  Then Work에 포커스가 이동한다
    And followFocus=true이므로 selectedCategoryId가 Work으로 변경된다

Scenario: ArrowUp — 카테고리 위로
  Given Work에 포커스가 있다
  When ArrowUp을 누른다
  Then Inbox에 포커스가 이동한다
    And selectedCategoryId가 Inbox으로 변경된다

Scenario: Enter — 카테고리 선택 (onAction)
  Given Work에 포커스가 있다
  When Enter를 누른다
  Then selectedCategoryId가 Work으로 설정된다

Scenario: Cmd+ArrowUp — 카테고리 순서 위로
  Given categoryOrder가 [Inbox, Work, Personal]이다
    And Work에 포커스가 있다
  When Cmd+ArrowUp을 누른다
  Then categoryOrder가 [Work, Inbox, Personal]이 된다

Scenario: Cmd+ArrowDown — 카테고리 순서 아래로
  Given Work에 포커스가 있다
  When Cmd+ArrowDown을 누른다
  Then categoryOrder가 [Inbox, Personal, Work]가 된다

Scenario: 마우스 클릭 → 카테고리 선택
  Given 사이드바에 3개 카테고리가 있다
  When Personal을 클릭한다
  Then selectedCategoryId가 Personal으로 변경된다
    And 리스트가 Personal 카테고리 항목만 표시한다
```

---

## 6. Dialog 키보드

```gherkin
Feature: Dialog 키보드 인터랙션

Scenario: Dialog 내 Tab — 포커스 트랩
  Given 삭제 확인 Dialog가 열려있다
    And "취소" 버튼에 포커스가 있다
  When Tab을 누른다
  Then "삭제" 버튼으로 포커스가 이동한다
  When Tab을 한번 더 누른다
  Then "취소" 버튼으로 순환한다 (Dialog 밖으로 나가지 않음)

Scenario: Dialog 내 Escape → 닫기
  Given 삭제 확인 Dialog가 열려있다
  When Escape를 누른다
  Then Dialog가 닫힌다
    And pendingDeleteIds가 []로 초기화된다
    And 포커스가 원래 항목으로 복원된다

Scenario: Dialog 확인 버튼 Enter
  Given 삭제 확인 Dialog가 열려있다
    And "삭제" 버튼에 포커스가 있다
  When Enter(또는 Click)를 누른다
  Then 대상 항목이 삭제된다
    And Dialog가 닫힌다
    And "N개 삭제됨" Toast가 표시된다

Scenario: Dialog 확인 후 Toast Undo 클릭
  Given "1개 삭제됨 · 되돌리기" Toast가 표시되어 있다
  When "되돌리기"를 클릭한다
  Then 삭제된 항목이 복원된다
    And Toast가 사라진다
```

---

## 7. Zone 간 포커스 전환

```gherkin
Feature: Zone 간 포커스 이동

Scenario: 사이드바 → 리스트 (Tab 또는 ArrowRight)
  Given 사이드바에 포커스가 있다
  When Tab을 누른다 (또는 ArrowRight)
  Then 리스트 Zone으로 포커스가 이동한다
    And activeZoneId가 "list"로 변경된다

Scenario: 리스트에서 Tab → 다음 Zone
  Given 리스트에 포커스가 있다
  When Tab을 누른다
  Then 다음 탭 순서의 Zone으로 포커스가 이동한다

Scenario: 리스트 아이템 더블클릭 → 편집 모드
  Given B에 포커스가 있다
  When B를 더블클릭한다 (또는 Enter)
  Then editingId가 B가 된다
    And 편집 필드가 나타난다
    And 모드가 "editing"으로 전환된다
    And 편집 필드에 현재 텍스트가 채워진다
```

---

## 8. 모드 전환 (navigating ↔ editing)

```gherkin
Feature: 모드 전환

Scenario: navigating → editing 전환
  Given 리스트에서 B에 포커스 (navigating 모드)
  When Enter(또는 F2)를 누른다
  Then editing 모드로 전환된다
    And ArrowUp/Down이 네비게이션이 아닌 커서 이동으로 동작한다
    And Backspace가 삭제 Dialog가 아닌 텍스트 삭제로 동작한다
    And Space가 체크 토글이 아닌 공백 입력으로 동작한다

Scenario: editing → navigating 전환 (Enter)
  Given editing 모드이다
  When Enter를 누른다
  Then navigating 모드로 전환된다
    And ArrowUp/Down이 네비게이션으로 동작한다

Scenario: editing → navigating 전환 (Escape)
  Given editing 모드이다
  When Escape를 누른다
  Then navigating 모드로 전환된다
    And 편집 변경사항이 취소된다
```

---

## ARIA 속성 검증

```gherkin
Feature: ARIA 속성

Scenario: 리스트 ARIA
  Given 리스트 Zone이 렌더된다
  Then role="listbox"가 적용된다
    And 각 Item에 role="option"이 적용된다
    And 포커스된 Item에 aria-selected="true"이다
    And 완료된 Item에 aria-checked="true"이다

Scenario: Dialog ARIA
  Given 삭제 확인 Dialog가 열린다
  Then role="alertdialog"가 적용된다
    And aria-modal="true"이다

Scenario: Toast ARIA
  Given Toast가 표시된다
  Then aria-live="polite"가 적용된다
    And aria-atomic="true"이다

Scenario: 사이드바 ARIA
  Given 사이드바 Zone이 렌더된다
  Then role="listbox"가 적용된다
    And 선택된 카테고리에 aria-selected="true"이다
```

---

## 키바인딩 매트릭스 (요약)

| 키 | navigating (리스트) | editing | 검색 필드 |
|----|-------------------|---------|----------|
| ArrowDown | 다음 항목 포커스 | 커서 이동 | — |
| ArrowUp | 이전 항목 포커스 | 커서 이동 | — |
| Enter | startEdit (onAction) | 저장 (commit) | — |
| Escape | 선택 해제 | 편집 취소 | 검색 초기화 |
| Backspace | 삭제 Dialog | 텍스트 삭제 | 텍스트 삭제 |
| Delete | 삭제 Dialog | — | — |
| Space | 완료 토글 (onCheck) | 공백 입력 | 공백 입력 |
| Cmd+Z | Undo | — | — |
| Cmd+Shift+Z | Redo | — | — |
| Cmd+C | 복사 | — | — |
| Cmd+X | 잘라내기 | — | — |
| Cmd+V | 붙여넣기 | — | — |
| Cmd+A | 전체 선택 | 전체 텍스트 선택 | — |
| Cmd+↑ | 순서 위로 | — | — |
| Cmd+↓ | 순서 아래로 | — | — |
| F2 | 편집 시작 | — | — |
| Home | 첫 항목으로 | 커서 맨 앞 | — |
| End | 마지막 항목으로 | 커서 맨 뒤 | — |
| Tab | 다음 Zone | 다음 Zone | 다음 Zone |
| Shift+↓ | 범위 선택 확장 | — | — |
| Shift+↑ | 범위 선택 축소 | — | — |
