# PRD — builder-clipboard

> 한 줄 요약: 빌더의 모든 노드에서 3개 보편 규칙으로 동작하는 clipboard 시스템.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 Copy (Cmd+C)

**Story**: 빌더 사용자로서, 캔버스나 사이드바에서 어떤 노드든 Cmd+C로 복사하고 싶다.
그래야 다른 위치에 붙여넣을 수 있기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 노드를 선택(포커스)한다.
2. Cmd+C를 누른다.
3. 시스템이 노드의 레벨(Section/Card/Tab/Item)을 판별한다.
4. 동적 노드면: 내부 clipboard에 해당 노드 구조 저장 + 시스템 clipboard에 toText 결과 저장.
5. 정적 노드면: 데이터 계층을 올라가 가장 가까운 동적 조상을 찾아 그것을 복사한다.

**Use Case — 대안 흐름:**
- 4a. 필드 편집 중(isFieldActive=true) → OS가 가로채지 않음 → 브라우저 네이티브 텍스트 복사
- 5a. 동적 조상이 없음 → no-op

**Scenarios:**

Scenario: 섹션 복사
  Given 캔버스에서 섹션 "ncp-hero"의 아이템 "ncp-hero-title"에 포커스
    And 편집 모드가 아님 (isFieldActive=false)
  When Cmd+C를 누름
  Then 내부 clipboard에 섹션 "ncp-hero" 전체(블록 타입 + fields + children)가 저장됨
    And 시스템 clipboard에 toText(ncp-hero) 결과가 저장됨

Scenario: 카드 복사
  Given 캔버스에서 pricing 섹션의 카드 "plan-pro"에 포커스
    And 편집 모드가 아님
  When Cmd+C를 누름
  Then 내부 clipboard에 카드 "plan-pro" 데이터가 저장됨

Scenario: 정적 아이템 복사 → 부모 버블링
  Given 캔버스에서 "ncp-hero-icon"(정적 아이템)에 포커스
    And "ncp-hero-icon"의 부모 섹션 "ncp-hero"는 동적 노드
  When Cmd+C를 누름
  Then 부모 섹션 "ncp-hero"가 복사됨 (정적 아이템 자체가 아님)

Scenario: 텍스트 편집 중 복사
  Given "ncp-hero-title" 필드를 편집 중 (isFieldActive=true)
    And 텍스트 "Hello"가 선택됨
  When Cmd+C를 누름
  Then 브라우저 네이티브 클립보드에 "Hello"가 복사됨
    And 내부 clipboard는 변경 없음

Scenario: 사이드바에서 섹션 복사
  Given 사이드바에서 "ncp-hero"에 포커스
  When Cmd+C를 누름
  Then 내부 clipboard에 섹션 "ncp-hero" 전체가 저장됨

### 1.2 Paste (Cmd+V)

**Story**: 빌더 사용자로서, 복사한 노드를 원하는 위치에 Cmd+V로 붙여넣고 싶다.
그래야 빠르게 콘텐츠를 재사용할 수 있기 때문이다.

**Use Case — 주 흐름 (Paste Bubbling):**
1. 사용자가 대상 위치에 포커스한다.
2. Cmd+V를 누른다.
3. 시스템이 현재 포커스의 데이터 계층을 올라가며 accept 가능한 동적 컬렉션을 찾는다.
4. 찾으면: clipboard 데이터를 해당 컬렉션에 삽입한다.
5. 못 찾으면: no-op.

**Use Case — 대안 흐름:**
- 2a. 필드 편집 중 → 브라우저 네이티브 텍스트 붙여넣기 (toText 결과)
- 4a. accept 거부 (타입 불일치) → 계속 상위로 버블링

**Scenarios:**

Scenario: 섹션 → 루트에 붙여넣기
  Given 내부 clipboard에 섹션 "ncp-hero" 복사본이 있음
    And 캔버스에서 "ncp-pricing" 섹션의 아이템에 포커스
  When Cmd+V를 누름
  Then 루트 섹션 목록에서 "ncp-pricing" 뒤에 새 섹션이 삽입됨
    And 새 섹션은 "ncp-hero"의 복제본 (새 ID)

Scenario: 카드 → 카드 컬렉션에 붙여넣기
  Given 내부 clipboard에 카드 "plan-pro"가 있음
    And pricing 섹션의 카드 "plan-basic"에 포커스
  When Cmd+V를 누름
  Then "plan-basic" 뒤에 새 카드가 삽입됨 (plan-pro의 복제본)

Scenario: 타입 불일치 → 버블링
  Given 내부 clipboard에 섹션이 있음
    And pricing 섹션의 카드 "plan-basic"에 포커스 (카드 컬렉션은 accept: Card)
  When Cmd+V를 누름
  Then 카드 컬렉션은 섹션을 accept하지 않음 → 버블
    And 루트 섹션 목록이 섹션을 accept → 삽입

Scenario: 카드 → 탭 컬렉션에 붙여넣기 (타입 불일치)
  Given 내부 clipboard에 카드 "plan-pro"가 있음
    And tab-container의 탭 "tab-1"에 포커스
  When Cmd+V를 누름
  Then 탭 컬렉션은 카드를 accept하지 않음 → 버블
    And 루트 섹션 목록도 카드를 accept하지 않음 → no-op

Scenario: 텍스트 편집 중 붙여넣기
  Given 내부 clipboard에 섹션이 있음 (toText = "NCP Hero")
    And "ncp-hero-title" 필드를 편집 중
  When Cmd+V를 누름
  Then 브라우저 네이티브 붙여넣기 → "NCP Hero" 텍스트가 필드에 삽입됨

Scenario: cross-collection 카드 붙여넣기
  Given 내부 clipboard에 섹션A의 카드가 있음
    And 섹션B의 카드 컬렉션에 포커스
    And 섹션B의 카드 컬렉션이 accept: Card
  When Cmd+V를 누름
  Then 섹션B의 카드 컬렉션에 카드가 삽입됨

### 1.3 Cut (Cmd+X)

**Story**: 빌더 사용자로서, 노드를 잘라내서 다른 위치로 이동하고 싶다.

**Use Case — 주 흐름:**
1. Copy와 동일하게 노드를 clipboard에 저장
2. 원본 노드를 삭제
3. 포커스를 이전/다음 형제로 이동

**Use Case — 대안 흐름:**
- 정적 아이템은 cut 불가 → no-op (템플릿 파괴 방지)
- 필드 편집 중 → 브라우저 네이티브 텍스트 잘라내기

**Scenarios:**

Scenario: 섹션 잘라내기
  Given 사이드바에서 "ncp-pricing" 섹션에 포커스
  When Cmd+X를 누름
  Then "ncp-pricing"이 내부 clipboard에 저장됨
    And "ncp-pricing"이 섹션 목록에서 삭제됨
    And 포커스가 이전/다음 섹션으로 이동

Scenario: 카드 잘라내기
  Given pricing 섹션의 카드 "plan-pro"에 포커스
  When Cmd+X를 누름
  Then "plan-pro"가 clipboard에 저장됨
    And "plan-pro"가 카드 목록에서 삭제됨

Scenario: 정적 아이템 잘라내기 → no-op
  Given "ncp-hero-title"(정적 아이템)에 포커스
    And 편집 모드가 아님
  When Cmd+X를 누름
  Then 아무 일도 일어나지 않음 (정적 아이템은 삭제 불가)

### 1.4 Duplicate (Cmd+D)

**Story**: 빌더 사용자로서, 선택한 노드를 즉시 복제하고 싶다.

**Scenarios:**

Scenario: 섹션 복제
  Given 사이드바에서 "ncp-hero"에 포커스
  When Cmd+D를 누름
  Then "ncp-hero" 뒤에 "ncp-hero (copy)"가 삽입됨

Scenario: 카드 복제
  Given pricing 카드 "plan-pro"에 포커스
  When Cmd+D를 누름
  Then "plan-pro" 뒤에 복제본이 삽입됨

Scenario: 정적 아이템 복제 → no-op
  Given "ncp-hero-title"(정적 아이템)에 포커스
  When Cmd+D를 누름
  Then 아무 일도 일어나지 않음

### 1.5 Paste Bubbling (OS 메커니즘)

**Story**: OS로서, 앱이 accept 함수만 선언하면 paste 대상을 자동으로 찾아주고 싶다.
그래야 앱이 paste 로직을 직접 구현하지 않아도 되기 때문이다.

**Use Case — 주 흐름:**
1. OS가 Cmd+V를 감지한다.
2. 현재 포커스된 아이템의 부모 컬렉션이 clipboard 데이터를 accept하는지 확인한다.
3. accept하면: 해당 컬렉션에 삽입.
4. 거부하면: 상위 계층으로 올라가 반복.
5. 루트까지 올라가고도 accept 안 되면: no-op.

**Scenarios:**

Scenario: 1단계 버블링
  Given clipboard에 카드가 있음
    And 포커스가 카드 컬렉션의 카드 아이템에 있음
  When Cmd+V를 누름
  Then 카드 컬렉션이 accept → 바로 삽입 (버블링 0회)

Scenario: 2단계 버블링
  Given clipboard에 섹션이 있음
    And 포커스가 pricing 카드의 정적 필드에 있음
  When Cmd+V를 누름
  Then 카드 내부(정적) → pass
    Then 카드 컬렉션(accept: Card) → 섹션은 Card 아님 → pass
    Then 루트 섹션 목록(accept: Section) → accept → 삽입

Scenario: 전체 거부
  Given clipboard에 정적 아이템이 있음
    And 포커스가 아무 곳에나 있음
  When Cmd+V를 누름
  Then 어떤 컬렉션도 accept하지 않음 → no-op

### 1.6 Accept 함수

**Story**: 앱 개발자로서, 각 동적 컬렉션이 어떤 타입의 데이터를 받을 수 있는지 선언하고 싶다.

**Use Case:**
1. 앱이 createCollectionZone에 accept 설정을 전달한다.
2. 기본값: structural typing (필드명 교집합 있으면 호환)
3. 커스텀: 앱이 accept 함수를 오버라이드

**Scenarios:**

Scenario: 기본 accept (structural typing)
  Given 카드 컬렉션에 accept 설정 없음 (기본값)
    And clipboard에 카드 데이터 (fields: {title, price})가 있음
    And 대상 컬렉션의 기존 카드가 {title, price, badge} 필드를 가짐
  When paste 시도
  Then 필드명 교집합 {title, price}이 있음 → accept

Scenario: 커스텀 accept (엄격)
  Given 카드 컬렉션에 accept: (data) => data.type === "pricing-card" 설정
    And clipboard에 type: "service-card" 데이터가 있음
  When paste 시도
  Then accept 함수가 false 반환 → 거부 → 다음 레벨로 버블

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| clipboard 비어있음 | 초기 상태 | 앱 시작 | copy 또는 cut 수행 |
| clipboard에 데이터 있음 | 복사/잘라낸 노드 보유 | copy/cut 수행 | 다음 copy/cut으로 덮어쓰기 |
| 필드 편집 중 | isFieldActive=true | Enter/클릭으로 편집 진입 | Escape/blur로 편집 종료 |
| 탐색 중 | isFieldActive=false | 편집 종료 또는 기본 상태 | Enter로 편집 진입 |

### 노드 분류

| 노드 타입 | 컬렉션 | 동적/정적 | Cut 가능 | Duplicate 가능 |
|-----------|--------|---------|---------|--------------|
| Section | root 섹션 목록 | 동적 | ✅ | ✅ |
| Card | 카드 컬렉션 (pricing 등) | 동적 | ✅ | ✅ |
| Tab | 탭 컬렉션 (tab-container) | 동적 | ✅ | ✅ |
| Item (title, icon 등) | 섹션/카드 내부 | 정적 | ❌ | ❌ |

## 3. 비기능 요구사항

- **접근성**: clipboard 조작은 표준 단축키 (Cmd+C/X/V/D)를 사용한다.
- **성능**: 복사 시 structuredClone으로 deep copy, 지연 없이 즉시 반영.
- **시스템 클립보드 연동**: 구조 데이터 복사 시 toText 결과도 시스템 클립보드에 저장하여, 외부 앱에 텍스트 붙여넣기 가능.

## 4. 범위 밖 (Out of Scope)

- cross-app clipboard (빌더 → 다른 앱)
- 붙여넣기 미리보기 (ghost preview)
- 다중 선택 clipboard (현재: 단일 노드만, collection의 multi-select는 기존 기능)
- 이미지/파일 paste
- Undo/Redo 통합 (기존 history middleware로 자동 지원)

## 3개 보편 규칙 (Quick Reference)

```
규칙 1: isFieldActive → 네이티브 clipboard (브라우저)
규칙 2: !isFieldActive → paste bubbling (데이터 계층 올라가며 accept 찾기)  
규칙 3: 정적 아이템은 구조적 연산(cut/delete/duplicate) 불가
```
