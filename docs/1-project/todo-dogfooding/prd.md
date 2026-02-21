# PRD — Todo Dogfooding: OS 완전성 증명

> Source: Discussion 2026-0221-1359
> Scope: Todo 앱에 8개 OS 패턴 추가

## 원칙

**앱 개발자가 해야 할 일 = 데이터 스키마 정의 + Zone bind 선언**
나머지는 OS가 보장한다.

---

## Feature 1: Dialog (삭제 확인)

### Why
"3개의 항목을 삭제합니다. 되돌릴 수 없습니다." — 파괴적 액션에 확인을 요청하는 것은 당연한 기능.
OS는 Dialog의 포커스 트랩, Escape 닫기, Return Focus를 보장해야 한다.

### Data Schema
```ts
// 스키마 변경 없음 — Dialog는 UI 상태
// OS가 관리하는 overlay 패턴
```

### OS 검증 포인트
- [ ] `alertdialog` role 자동 적용
- [ ] Dialog 열릴 때 포커스가 Dialog 안으로 이동
- [ ] Tab 순환이 Dialog 안에 갇힘 (포커스 트랩)
- [ ] Escape → Dialog 닫기 + 원래 포커스 복원
- [ ] 확인 버튼 → 커맨드 실행 + Dialog 닫기

### BDD Scenarios
```gherkin
Feature: 삭제 확인 Dialog

Scenario: 삭제 시 확인 Dialog 표시
  Given 할 일 목록에 항목이 있다
  When 항목에서 Delete를 누른다
  Then "삭제하시겠습니까?" Dialog가 표시된다
    And 포커스가 Dialog의 "취소" 버튼으로 이동한다

Scenario: Dialog에서 확인 → 삭제 실행
  Given 삭제 확인 Dialog가 열려있다
  When "삭제" 버튼을 누른다
  Then 해당 항목이 삭제된다
    And Dialog가 닫힌다
    And 포커스가 원래 위치로 복원된다

Scenario: Dialog에서 취소 또는 Escape
  Given 삭제 확인 Dialog가 열려있다
  When Escape를 누른다 (또는 "취소" 클릭)
  Then Dialog가 닫힌다
    And 항목은 삭제되지 않는다
    And 포커스가 원래 위치로 복원된다

Scenario: 다중 선택 후 삭제 → Dialog에 개수 표시
  Given 3개의 항목이 선택되어 있다
  When Delete를 누른다
  Then "3개의 항목을 삭제하시겠습니까?" Dialog가 표시된다
```

---

## Feature 2: Context Menu (우클릭 메뉴)

### Why
우클릭 → 컨텍스트 메뉴는 모든 데스크탑 앱의 기본. OS가 메뉴의 포커스 관리,
키보드 네비게이션(Arrow Up/Down, Enter, Escape), 외부 클릭 닫기를 보장해야 한다.

### Data Schema
```ts
// 스키마 변경 없음 — 메뉴는 기존 커맨드의 UI 재노출
// Context menu items = 이미 존재하는 커맨드의 매핑
```

### OS 검증 포인트
- [ ] `menu` / `menuitem` role 자동 적용
- [ ] 우클릭 시 메뉴 팝업 + 포커스 이동
- [ ] Arrow Up/Down 메뉴 항목 네비게이션
- [ ] Enter → 해당 커맨드 실행 + 메뉴 닫기
- [ ] Escape → 메뉴 닫기 + 원래 포커스 복원
- [ ] 메뉴 외부 클릭 → 메뉴 닫기

### BDD Scenarios
```gherkin
Feature: Todo Context Menu

Scenario: 항목 우클릭 → 컨텍스트 메뉴
  Given 할 일 항목에 포커스가 있다
  When 우클릭한다
  Then 컨텍스트 메뉴가 표시된다
    And 메뉴에 [편집, 복사, 삭제, 카테고리 이동] 항목이 있다

Scenario: 메뉴 키보드 네비게이션
  Given 컨텍스트 메뉴가 열려 있다
  When ArrowDown을 누른다
  Then 다음 메뉴 항목으로 포커스가 이동한다

Scenario: 메뉴에서 커맨드 실행
  Given 컨텍스트 메뉴에서 "삭제"에 포커스가 있다
  When Enter를 누른다
  Then 해당 항목이 삭제된다
    And 메뉴가 닫힌다

Scenario: 키보드로 컨텍스트 메뉴 열기 (Shift+F10)
  Given 할 일 항목에 포커스가 있다
  When Shift+F10을 누른다
  Then 컨텍스트 메뉴가 표시된다
```

---

## Feature 3: Toast / Undo Feedback

### Why
파괴적 액션 후 "되돌리기" 기회를 제공하는 토스트는 현대 SaaS의 표준 패턴.
OS가 `aria-live` 영역 관리, 자동 해제 타이머, 토스트 스택을 제공해야 한다.

### Data Schema
```ts
// 스키마 변경 없음 — Toast는 OS 레벨 UI
// Undo 커맨드는 이미 존재 (undoCommand)
```

### OS 검증 포인트
- [ ] `role="status"` 또는 `aria-live="polite"` 자동 적용
- [ ] 삭제 후 "N개 삭제됨. 되돌리기" 토스트 표시
- [ ] "되돌리기" 클릭 → Undo 실행
- [ ] 5초 후 자동 해제
- [ ] 다중 토스트 스택 관리

### BDD Scenarios
```gherkin
Feature: Undo Toast

Scenario: 삭제 후 Undo 토스트 표시
  Given 할 일 "장보기"를 삭제한다
  When 삭제가 완료된다
  Then "1개 삭제됨. 되돌리기" 토스트가 표시된다

Scenario: 토스트에서 되돌리기
  Given "1개 삭제됨. 되돌리기" 토스트가 표시되어 있다
  When "되돌리기"를 클릭한다
  Then 삭제된 항목이 복원된다
    And 토스트가 사라진다

Scenario: 토스트 자동 해제
  Given 토스트가 표시된 후 5초가 지난다
  Then 토스트가 자동으로 사라진다

Scenario: 연속 삭제 → 토스트 스택
  Given "항목 A"를 삭제하고 토스트가 표시된다
  When "항목 B"를 삭제한다
  Then 두 번째 토스트가 첫 번째 위에 쌓인다
```

---

## Feature 4: Search / Combobox

### Why
목록에서 원하는 항목을 빠르게 찾는 것은 기본. 검색 입력 + 결과 필터링은
ARIA combobox 패턴이며, OS가 이를 보장해야 한다.

### Data Schema
```ts
interface AppState {
  // 기존 필드에 추가
  ui: {
    searchQuery: string;  // NEW — 검색어
    // ... existing fields
  }
}
```

### OS 검증 포인트
- [ ] `combobox` role 자동 적용 (또는 검색 Field + listbox 연결)
- [ ] 입력 시 실시간 필터링 (visibleTodos selector 확장)
- [ ] Cmd+F (또는 /) → 검색 필드로 포커스 이동
- [ ] Escape → 검색 해제 + 리스트로 포커스 복원
- [ ] 검색 결과가 0건일 때 빈 상태 표시

### BDD Scenarios
```gherkin
Feature: Todo Search

Scenario: 검색어 입력 → 필터링
  Given 5개의 할 일이 있다
  When 검색 필드에 "장보기"를 입력한다
  Then "장보기"가 포함된 할 일만 표시된다

Scenario: 검색어 지우기 → 전체 표시
  Given 검색으로 필터링된 상태이다
  When 검색어를 모두 지운다
  Then 모든 할 일이 다시 표시된다

Scenario: 검색 단축키 (Cmd+F)
  Given 리스트에 포커스가 있다
  When Cmd+F를 누른다
  Then 검색 필드로 포커스가 이동한다

Scenario: 검색 중 Escape → 검색 해제
  Given 검색 필드에 "회의"가 입력되어 있다
  When Escape를 누른다
  Then 검색어가 지워진다
    And 포커스가 리스트로 돌아간다
```

---

## Feature 5: Bulk Action Bar (다중 선택 액션)

### Why
다중 선택 후 "N개 선택됨 | 삭제 | 카테고리 이동 | 완료" 플로팅 바는
Linear, Notion 등 모든 SaaS에 있는 패턴. 선택 상태에 따라 자동으로 나타나고 사라져야 한다.

### Data Schema
```ts
// 스키마 변경 없음 — selection은 OS가 관리
// Bulk action은 기존 커맨드의 배치 실행
```

### OS 검증 포인트
- [ ] `toolbar` role 자동 적용
- [ ] selection.length > 1이면 Action Bar 자동 표시
- [ ] Action Bar 내 버튼은 기존 커맨드의 배치 바인딩
- [ ] 선택 해제 시 Action Bar 자동 숨김

### BDD Scenarios
```gherkin
Feature: Bulk Action Bar

Scenario: 다중 선택 시 Action Bar 표시
  Given 리스트에서 Shift+Arrow로 3개를 선택한다
  Then "3개 선택됨" Action Bar가 하단에 표시된다
    And [삭제, 완료, 카테고리 이동] 버튼이 있다

Scenario: 일괄 삭제
  Given 3개가 선택되어 Action Bar가 표시되어 있다
  When Action Bar의 "삭제" 버튼을 누른다
  Then 3개 모두 삭제된다
    And Action Bar가 사라진다

Scenario: 일괄 완료 토글
  Given 3개가 선택되어 있다 (2개 미완료, 1개 완료)
  When "완료" 버튼을 누른다
  Then 3개 모두 완료 상태가 된다

Scenario: 선택 해제 → Action Bar 숨김
  Given Action Bar가 표시되어 있다
  When Escape를 눌러 선택을 해제한다
  Then Action Bar가 사라진다
```

---

## Feature 6: Drag & Drop (순서 변경)

### Why
키보드 Alt+Arrow로 순서 변경은 되지만, 마우스 드래그는 지원하지 않는다.
실제 사용자의 90%는 마우스 드래그로 순서를 바꾼다. OS가 DnD의
ghost element, drop indicator, 포커스 연동을 보장해야 한다.

### Data Schema
```ts
// 스키마 변경 없음 — 순서(todoOrder)는 이미 존재
// DnD는 순서 변경의 다른 입력 수단일 뿐
```

### OS 검증 포인트
- [ ] 드래그 시작 → ghost element (드래그 미리보기)
- [ ] 드래그 중 → drop indicator (삽입 위치 표시)
- [ ] 드롭 → todoOrder 업데이트
- [ ] 드래그 취소 (Escape) → 원래 위치 복원
- [ ] 드롭 후 포커스가 이동한 아이템에 위치
- [ ] 키보드 DnD (Alt+Arrow로 이미 구현됨)와 동일한 결과

### BDD Scenarios
```gherkin
Feature: Drag & Drop Reorder

Scenario: 마우스로 항목 드래그 이동
  Given todoOrder가 [A, B, C]이다
  When B를 드래그하여 A 위에 드롭한다
  Then todoOrder가 [B, A, C]가 된다
    And B에 포커스가 위치한다

Scenario: 드래그 취소
  Given B를 드래그 중이다
  When Escape를 누른다
  Then 순서 변화 없다
    And B가 원래 위치로 돌아간다

Scenario: 카테고리 간 드래그 이동
  Given "장보기"가 "개인" 카테고리에 있다
  When "장보기"를 "업무" 카테고리 영역으로 드래그한다
  Then "장보기"의 categoryId가 "업무"로 변경된다
```

---

## Feature 7: Date Picker (마감일)

### Why
할 일에 마감일을 설정하는 것은 Todo 앱의 필수 기능.
OS 관점에서 네이티브 `<input type="date">`과 ZIFT의 경계,
또는 커스텀 캘린더 위젯의 grid 네비게이션을 검증할 수 있다.

### Data Schema
```ts
interface Todo {
  // 기존 필드에 추가
  dueDate?: string;  // NEW — ISO date string (YYYY-MM-DD)
  // ... existing fields
}
```

### OS 검증 포인트
- [ ] 날짜 입력 UI (네이티브 input 또는 커스텀 캘린더)
- [ ] 캘린더 grid의 Arrow 네비게이션 (2D)
- [ ] 마감일 기준 정렬 옵션
- [ ] 만료된 항목 시각적 표시

### BDD Scenarios
```gherkin
Feature: Due Date

Scenario: 마감일 설정
  Given 할 일 "보고서 작성"이 있다
  When 마감일을 2026-03-01로 설정한다
  Then 항목에 "3/1" 마감일이 표시된다

Scenario: 마감일 기준 정렬
  Given 마감일이 다른 3개의 항목이 있다
  When 마감일 순 정렬을 선택한다
  Then 가까운 마감일부터 표시된다

Scenario: 만료된 항목 강조
  Given 마감일이 어제인 항목이 있다
  Then 해당 항목이 빨간색으로 강조된다
```

---

## Feature 8: Export / Import (데이터 내보내기/가져오기)

### Why
사용자 데이터의 소유권은 사용자에게 있다. JSON/CSV 내보내기-가져오기는
로컬 앱의 기본 의무. File API와 OS의 연동을 검증한다.

### Data Schema
```ts
// 스키마 변경 없음 — 기존 AppState를 직렬화/역직렬화
```

### OS 검증 포인트
- [ ] 내보내기 → JSON 파일 다운로드
- [ ] 가져오기 → 파일 선택 → 데이터 병합 또는 대체
- [ ] 가져오기 실패 시 에러 피드백 (Toast 연동)

### BDD Scenarios
```gherkin
Feature: Export / Import

Scenario: JSON 내보내기
  Given 5개의 할 일이 있다
  When "내보내기" 버튼을 누른다
  Then todos.json 파일이 다운로드된다
    And 파일에 5개의 할 일 데이터가 포함된다

Scenario: JSON 가져오기
  Given todos.json 파일을 선택한다
  When "가져오기"가 완료된다
  Then 파일의 할 일이 현재 목록에 추가된다

Scenario: 잘못된 파일 가져오기 → 에러
  Given 유효하지 않은 JSON 파일을 선택한다
  When "가져오기"를 시도한다
  Then "파일 형식이 올바르지 않습니다" 토스트가 표시된다
```

---

## 우선순위 매트릭스

| Feature | OS 의존도 | 구현 복잡도 | 개밥먹기 가치 | 순서 |
|---------|----------|-----------|------------|------|
| F1: Dialog | 🔴 OS 필요 | Medium | ★★★★★ | 1 |
| F4: Search | 🟢 앱만으로 가능 | Low | ★★★★ | 2 |
| F5: Bulk Action | 🟢 앱만으로 가능 | Low | ★★★★ | 3 |
| F3: Toast | 🔴 OS 필요 | Medium | ★★★★ | 4 |
| F2: Context Menu | 🔴 OS 필요 | High | ★★★★★ | 5 |
| F6: Drag & Drop | 🔴 OS 필요 | High | ★★★ | 6 |
| F7: Date Picker | 🟡 혼합 | Medium | ★★★ | 7 |
| F8: Export/Import | 🟢 앱만으로 가능 | Low | ★★ | 8 |

**전략**: 앱만으로 가능한 것(F4, F5, F8)을 먼저 처리하여 즉시 가치를 증명하고,
OS primitive가 필요한 것(F1, F2, F3, F6)은 OS 구현과 병행한다.
