# Spec — 인라인 편집 (Inline Editing)

> Source: builder-mvp (W08 archive), builder-os-panel-binding (W07 archive)
> Verified: Production code, 826 tests pass

## 1. 편집 진입/종료

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 편집 진입 | F2 (OS 표준), Enter (onAction) | Field가 contentEditable 활성화 |
| 편집 저장 | Enter | `onCommit` → `updateField` command → state 갱신 |
| 편집 취소 | Escape | 원래 값 복원, 편집 모드 종료 |

## 2. 패널 ↔ 캔버스 양방향 동기화

```
캔버스 수정:  OS.Field onCommit → updateField command → state 갱신
패널 수정:    input onChange → updateFieldByDomId command → state 갱신
패널 읽기:    BuilderApp.useComputed((s) => s.data.blocks)
캔버스 읽기:  BuilderApp.useComputed((s) => s.data.blocks)
```

**동일한 state + 동일한 command** = 자연스러운 양방향 동기화. 추가 동기화 코드 불필요.

## 3. Field 주소 해석

`resolveFieldAddress(domId, blocks)` — DOM ID → `{ section: Block, field: string }`

예: `"ncp-hero-title"` → `{ section: Block{id:"ncp-hero"}, field: "title" }`

## 4. 상태 머신

| 상태 | 설명 | 진입 | 탈출 |
|------|------|------|------|
| Browsing | 탐색 중 | 앱 시작, 편집 완료 | 요소 포커스 |
| Selected | 요소 선택됨 | 클릭/Arrow키 | 다른 요소 선택, 편집 시작 |
| Editing | 인라인 편집 중 | F2/Enter | Enter(저장), Escape(취소) |
| PanelEditing | 패널 편집 중 | 패널 input 포커스 | blur, 다른 요소 선택 |

## 5. BDD Scenarios (진실의 원천)

> Source: builder-mvp PRD (W08). 테스트와 코드는 이 시나리오에서 파생된다.

### 5.1 인라인 편집 진입/종료

```gherkin
Scenario: Enter로 인라인 편집 진입
  Given 캔버스의 텍스트 요소 "ncp-hero-title"에 포커스가 있다
  When Enter를 누른다
  Then 해당 필드가 편집 가능 상태가 된다
    And OS Field가 포커스를 받는다

Scenario: Enter로 편집 저장
  Given "ncp-hero-title" 필드가 편집 중이다
    And 텍스트를 "새로운 제목"으로 변경했다
  When Enter를 누른다
  Then state의 해당 block fields 값이 "새로운 제목"으로 갱신된다
    And 편집 모드가 종료된다

Scenario: Escape로 편집 취소
  Given "ncp-hero-title" 필드가 편집 중이다
    And 원래 값은 "AI 시대를 위한 가장 완벽한 플랫폼"이다
    And 텍스트를 "임시 수정"으로 변경했다
  When Escape를 누른다
  Then state의 해당 block fields 값이 원래 값으로 유지된다
    And 편집 모드가 종료된다
```

### 5.2 패널 양방향 동기화

```gherkin
Scenario: 캔버스 선택 → 패널 데이터 표시
  Given 캔버스에서 "ncp-hero-title" 요소를 선택했다
  When 패널을 확인한다
  Then 패널에 "ncp-hero-title"의 현재 텍스트 값이 표시된다

Scenario: 패널 수정 → 캔버스 반영
  Given "ncp-hero-title"이 선택되어 패널에 표시 중이다
  When 패널에서 텍스트를 "변경된 제목"으로 수정한다
  Then 캔버스의 "ncp-hero-title" 요소도 "변경된 제목"을 표시한다

Scenario: 캔버스 인라인 편집 → 패널 반영
  Given "ncp-hero-title"이 선택되어 패널에 표시 중이다
  When 캔버스에서 인라인 편집으로 텍스트를 "인라인 수정"으로 변경한다
  Then 패널의 텍스트 필드도 "인라인 수정"으로 갱신된다

Scenario: 다른 요소 선택 시 패널 전환
  Given "ncp-hero-title"(text)이 선택되어 패널에 표시 중이다
  When "ncp-hero-cta"(button)를 선택한다
  Then 패널이 "ncp-hero-cta"의 데이터로 전환된다
```

### 5.3 키보드 네비게이션

```gherkin
Scenario: 수직 이동
  Given 캔버스의 "ncp-hero-title"에 포커스가 있다
  When ArrowDown을 누른다
  Then 다음 아이템으로 포커스가 이동한다

Scenario: 계층 탐색 — drill-down
  Given Section 레벨에서 "services"에 포커스가 있다
  When Enter를 누른다
  Then Group 레벨의 첫 번째 아이템으로 포커스가 이동한다

Scenario: 계층 탐색 — drill-up
  Given Group 레벨의 아이템에 포커스가 있다
  When Backslash(\)를 누른다
  Then Section 레벨로 포커스가 복귀한다
```
