# PRD — Builder MVP

> Todo의 `createZone` + `bind` 패턴을 Builder(CMS) 도메인에 적용하여 defineApp의 범용성을 검증하는 개밥먹기 MVP.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 createZone + bind 마이그레이션

**Story**: OS 개발자로서, Builder의 `createWidget`을 `createZone` + `bind`로 전환하고 싶다. 그래야 Todo와 동일한 패턴에서 빌더가 작동하는지 검증할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. `BuilderCanvas`의 `createWidget` → `createZone("canvas")` + `canvasZone.command(...)` + `canvasZone.bind(...)` 로 전환
2. 기존 `updateField`, `selectElement` 커맨드를 zone.command로 재정의
3. `BuilderCanvas.Zone` 패턴이 `<CanvasZone.Zone>` 형태로 동작
4. 기존 unit 테스트 27개 + E2E 11개 모두 통과

**Scenarios:**

```
Scenario: createZone 전환 후 기존 테스트 통과
  Given Builder app.ts가 createZone + bind 패턴으로 전환되었다
  When vitest와 playwright를 실행한다
  Then 기존 unit 27개, E2E 11개 모두 통과한다

Scenario: Zone bind 선언에 role: "grid" 유지
  Given BuilderCanvas가 canvasZone.bind로 전환되었다
  When bind 선언을 확인한다
  Then role은 "grid"이고 spatial navigation 설정이 유지된다

Scenario: dispatch API 호환
  Given BuilderApp.create()로 테스트 인스턴스를 생성한다
  When app.dispatch.updateField({ name: "title", value: "new" })를 호출한다
  Then state.data.fields["title"]이 "new"로 변경된다
```

### 1.2 캔버스 인라인 편집

**Story**: 빌더 사용자로서, 캔버스의 텍스트 요소를 키보드로 직접 편집하고 싶다. 그래야 패널을 오가지 않고 빠르게 콘텐츠를 수정할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 Arrow 키로 텍스트 요소에 포커스를 이동한다
2. Enter를 눌러 편집 모드에 진입한다
3. 텍스트를 수정한다
4. Enter를 눌러 저장한다 (또는 Escape로 취소)
5. 수정된 텍스트가 BuilderApp 상태에 반영된다

**Use Case — 대안 흐름:**
- 4a. Escape를 누르면 수정이 취소되고 원래 값이 유지된다
- 2a. 이미 편집 중인 상태에서 다른 요소를 클릭하면, 현재 편집이 저장(또는 취소)되고 새 요소가 선택된다

**Scenarios:**

```
Scenario: Enter로 인라인 편집 진입
  Given 캔버스의 텍스트 요소 "ncp-hero-title"에 포커스가 있다
  When Enter를 누른다
  Then 해당 필드가 편집 가능 상태가 된다 (contentEditable 또는 input 활성화)
    And OS Field가 포커스를 받는다

Scenario: Enter로 편집 저장
  Given "ncp-hero-title" 필드가 편집 중이다
    And 텍스트를 "새로운 제목"으로 변경했다
  When Enter를 누른다
  Then BuilderApp 상태의 fields["ncp-hero-title"]이 "새로운 제목"으로 갱신된다
    And 편집 모드가 종료된다

Scenario: Escape로 편집 취소
  Given "ncp-hero-title" 필드가 편집 중이다
    And 원래 값은 "AI 시대를 위한\n가장 완벽한 플랫폼"이다
    And 텍스트를 "임시 수정"으로 변경했다
  When Escape를 누른다
  Then BuilderApp 상태의 fields["ncp-hero-title"]이 원래 값으로 유지된다
    And 편집 모드가 종료된다

Scenario: 빈 문자열로 저장 시도
  Given "ncp-hero-title" 필드가 편집 중이다
    And 텍스트를 빈 문자열로 변경했다
  When Enter를 누른다
  Then 빈 문자열이 저장되거나, 원래 값이 유지된다 (정책 결정 필요)
```

### 1.3 패널 양방향 동기화

**Story**: 빌더 사용자로서, 우측 프로퍼티 패널에서 선택된 요소의 속성을 편집하면 캔버스에 즉시 반영되길 원한다. 그래야 WYSIWYG 경험이 완성되기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 캔버스에서 요소를 클릭(또는 키보드로 포커스)한다
2. 우측 패널에 해당 요소의 현재 속성(텍스트, 타입 등)이 표시된다
3. 패널에서 텍스트를 수정한다
4. 캔버스의 해당 요소가 즉시 갱신된다

**Scenarios:**

```
Scenario: 캔버스 선택 → 패널 데이터 표시
  Given 캔버스에서 "ncp-hero-title" 요소를 클릭했다
  When 패널을 확인한다
  Then 패널에 "ncp-hero-title"의 현재 텍스트 값이 표시된다
    And 타입이 "text"로 표시된다

Scenario: 패널 수정 → 캔버스 반영
  Given "ncp-hero-title"이 선택되어 패널에 표시 중이다
    And 현재 값은 "AI 시대를 위한\n가장 완벽한 플랫폼"이다
  When 패널에서 텍스트를 "변경된 제목"으로 수정한다
  Then 캔버스의 "ncp-hero-title" 요소도 "변경된 제목"을 표시한다

Scenario: 캔버스 인라인 편집 → 패널 반영
  Given "ncp-hero-title"이 선택되어 패널에 표시 중이다
  When 캔버스에서 인라인 편집으로 텍스트를 "인라인 수정"으로 변경한다
  Then 패널의 텍스트 필드도 "인라인 수정"으로 갱신된다

Scenario: 선택 해제 시 패널 비우기
  Given "ncp-hero-title"이 선택되어 패널에 표시 중이다
  When Escape를 누르거나 빈 영역을 클릭한다
  Then 패널이 빈 상태("요소를 선택하세요")로 돌아간다

Scenario: 다른 요소 선택 시 패널 전환
  Given "ncp-hero-title"(text)이 선택되어 패널에 표시 중이다
  When "ncp-hero-cta"(button)를 클릭한다
  Then 패널이 "ncp-hero-cta"의 데이터로 전환된다
    And 타입이 "button"으로 표시된다
```

### 1.4 Spatial 네비게이션 유지

**Story**: 빌더 사용자로서, Arrow 키로 캔버스 요소 간 2D 이동이 자연스럽게 계속 작동하길 원한다.

**Scenarios:**

```
Scenario: 수직 이동 (기존 E2E 유지)
  Given 캔버스의 "ncp-hero-title"에 포커스가 있다
  When ArrowDown을 누른다
  Then "ncp-hero-sub"로 포커스가 이동한다

Scenario: 수평 이동 (기존 E2E 유지)
  Given "ncp-hero-brand"에 포커스가 있다
  When ArrowRight를 누른다
  Then "nav-login"으로 포커스가 이동한다

Scenario: 크로스 존 이동 (기존 E2E 유지)
  Given "ncp-hero-cta"에 포커스가 있다
  When ArrowDown을 누른다
  Then "ncp-news-title"로 포커스가 이동한다
```

### 1.5 개밥먹기 보고서

**Story**: OS 설계자로서, Builder 개밥먹기에서 발견한 패턴 적합성과 마찰점을 기록하고 싶다. 그래야 defineApp API를 개선하고, 다음 앱 개발에 반영할 수 있기 때문이다.

**Scenarios:**

```
Scenario: 보고서 산출
  Given Builder MVP 개발이 완료되었다
  When 개밥먹기 보고서를 작성한다
  Then 다음 항목이 포함된다:
    And 1. Todo와 Builder의 구조적 차이 (엔티티 vs flat key-value)
    And 2. createZone + bind 패턴의 적합성 평가
    And 3. OS.Field 인라인 편집의 마찰점
    And 4. 패널 동기화 패턴의 자연스러움
    And 5. defineApp API 개선 제안
```

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| Browsing | 캔버스에서 요소를 탐색 중 | 앱 시작, 편집 취소/저장 후 | 요소 선택 또는 편집 시작 |
| Selected | 특정 요소가 선택됨 (포커스) | 클릭 또는 Arrow 키 | 다른 요소 선택, 편집 시작, 선택 해제 |
| Editing | 선택된 요소를 인라인 편집 중 | Enter 키 (Action) | Enter(저장), Escape(취소) |
| PanelEditing | 패널에서 선택된 요소 속성 편집 중 | 패널 input 포커스 | 패널 blur, 다른 요소 선택 |

## 3. 비기능 요구사항 (Non-Functional Requirements)

- **성능**: 필드 값 변경 시 캔버스 + 패널 리렌더가 16ms 이내
- **접근성**: 모든 요소가 키보드만으로 접근 가능 (spatial nav + Enter/Escape)
- **테스트**: Unit ≥ 27개 유지, E2E ≥ 11개 유지 + 인라인 편집/패널 동기화 시나리오 추가

## 4. 범위 밖 (Out of Scope)

- 블록 추가/삭제/정렬 (구조 변경)
- Undo/Redo (history middleware 연동)
- 이미지 업로드, 미디어 편집
- 드래그 & 드롭
- 반응형 프리뷰 기능 개선 (뷰포트 전환은 이미 있음)
- 블록 간 네비게이션 최적화 (Tab 존 분리)

## 5. 핵심 질문 — 개밥먹기로 답해야 할 것

| # | 질문 | Todo 답변 | Builder에서 검증 |
|---|------|----------|----------------|
| 1 | `createZone` + `bind`가 엔티티 CRUD 외 도메인에도 자연스러운가? | Todo: ✅ listbox, textbox, toolbar 3개 zone 성공 | grid zone + 2D spatial에서도 통하는가? |
| 2 | `zone.command`의 `(ctx, payload) => result` 시그니처가 flat key-value 업데이트에 적합한가? | Todo: ✅ todos[id] 업데이트 자연스러움 | fields[name] 업데이트도 동일한가? |
| 3 | `zone.bind`의 `onAction`이 인라인 편집 트리거로 작동하는가? | Todo: ✅ Enter → startEdit (editingId set) | Builder: Enter → field edit mode도 같은 패턴? |
| 4 | 패널과 캔버스가 같은 커맨드를 공유하는 것이 자연스러운가? | N/A (Todo에 패널 없음) | Builder 고유 검증 포인트 |
| 5 | `OS.Field`의 `onCommit`/`onChange` 콜백이 CMS 인라인 편집에 충분한가? | Todo: ✅ draft/edit 분리 | Builder: 다수의 독립 field에서도 작동하는가? |

## 변경 이력

| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2026-02-16 | 초안 작성 | 프로젝트 시작 |
