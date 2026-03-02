# Spec — zift-field-generalization

> 한 줄 요약: FieldType에 `boolean | number`를 추가하여 Field를 Entity Property 소유자로 일반화하고, 관련 keymap과 compute 로직의 소유권을 Item에서 Field로 이전한다.

> **Zone 체크**: ❌ Zone 없음. 이 프로젝트는 OS 코어 아키텍처 리팩토링. DT 스킵.

---

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 FieldType 확장 (T1)

**Story**: OS 개발자로서, FieldType에 boolean/number를 추가하고 싶다. 그래야 switch/slider가 Field로 분류될 수 있기 때문이다.

**Use Case — 주 흐름:**
1. FieldType union에 `"boolean"` | `"number"` 추가
2. FieldState.value 타입을 `string | boolean | number`로 확장
3. 기존 string-based Field는 영향 없음

**Scenarios:**

```
Scenario: boolean FieldType 등록 가능
  Given FieldRegistry가 초기화됨
  When fieldType: "boolean"으로 Field를 등록
  Then tsc 에러 없이 컴파일
  And FieldState.value에 boolean 값 저장 가능

Scenario: number FieldType 등록 가능
  Given FieldRegistry가 초기화됨
  When fieldType: "number"으로 Field를 등록
  Then tsc 에러 없이 컴파일
  And FieldState.value에 number 값 저장 가능

Scenario: 기존 string FieldType 하위호환
  Given 기존 "inline" | "tokens" | "block" | "editor" Field 사용 코드
  When FieldType 확장 후 컴파일
  Then 기존 코드 변경 없이 tsc 0
```

---

### 1.2 resolveFieldKey 확장 (T2)

**Story**: OS 개발자로서, boolean/number Field에 적합한 키맵을 추가하고 싶다. 그래야 switch가 Space/Enter로 토글되고, slider가 Arrow로 값 조정되기 때문이다.

**Use Case — 주 흐름:**
1. FIELD_KEYMAPS에 boolean keymap 추가 (Space/Enter → OS_CHECK)
2. FIELD_KEYMAPS에 number keymap 추가 (Arrow/Home/End/PageUp/PageDown → OS_VALUE_CHANGE)
3. Field가 focus를 가진 상태에서 해당 키 입력 시 Field keymap이 처리

**Scenarios:**

```
Scenario: boolean Field — Space 토글
  Given fieldType="boolean"인 Field가 focus를 가짐
  When Space 키 입력
  Then OS_CHECK 커맨드 반환

Scenario: boolean Field — Enter 토글
  Given fieldType="boolean"인 Field가 focus를 가짐
  When Enter 키 입력
  Then OS_CHECK 커맨드 반환

Scenario: number Field — ArrowRight 증가
  Given fieldType="number"인 Field가 focus를 가짐
  When ArrowRight 키 입력
  Then OS_VALUE_CHANGE({ action: "increment" }) 커맨드 반환

Scenario: number Field — ArrowLeft 감소
  Given fieldType="number"인 Field가 focus를 가짐
  When ArrowLeft 키 입력
  Then OS_VALUE_CHANGE({ action: "decrement" }) 커맨드 반환

Scenario: number Field — Home 최솟값
  Given fieldType="number"인 Field가 focus를 가짐
  When Home 키 입력
  Then OS_VALUE_CHANGE({ action: "setMin" }) 커맨드 반환

Scenario: number Field — End 최댓값
  Given fieldType="number"인 Field가 focus를 가짐
  When End 키 입력
  Then OS_VALUE_CHANGE({ action: "setMax" }) 커맨드 반환

Scenario: 기존 text keymap 하위호환
  Given fieldType="inline"인 Field
  When 기존 키 입력
  Then 기존 동작 유지
```

---

### 1.3 resolveItemKey 정리 (T3)

**Story**: OS 개발자로서, Item resolver에서 switch/checkbox/slider 키 처리를 제거하고 싶다. 그래야 Field가 키를 소유하여 ZIFT 소유권이 정렬되기 때문이다.

**Use Case — 주 흐름:**
1. ITEM_RESOLVERS에서 `checkbox`, `switch`, `slider` 항목 제거
2. 해당 키 입력은 Field keymap(T2)이 처리

**Scenarios:**

```
Scenario: switch의 Space/Enter는 Field가 처리
  Given role="switch" 컨텍스트에서
  When resolveItemKey("Space") 호출
  Then null 반환 (Item이 처리하지 않음)
  And resolveFieldKey("Space", "boolean")이 OS_CHECK 반환

Scenario: slider의 Arrow는 Field가 처리
  Given role="slider" 컨텍스트에서
  When resolveItemKey("ArrowRight") 호출
  Then null 반환
  And resolveFieldKey("ArrowRight", "number")이 OS_VALUE_CHANGE 반환

Scenario: 비-Field Item의 키 처리 유지
  Given role="listbox"의 option 컨텍스트에서
  When resolveItemKey("Enter") 호출
  Then 기존 동작 유지 (OS_ACTIVATE 등)
```

---

### 1.4 computeItem 내부 추출 (T4)

**Story**: OS 개발자로서, computeItem의 Field 관련 로직을 내부 함수로 분리하고 싶다. 그래야 소유권이 명확해지고, 향후 외부 승격이 가능하기 때문이다.

**Use Case — 주 흐름:**
1. `computeFieldAttrs()` 내부 함수 추출 (aria-checked, aria-valuenow/min/max)
2. computeItem이 `computeFieldAttrs()`를 호출하여 결과를 merge
3. computeItem의 외부 시그니처 불변

**Scenarios:**

```
Scenario: computeItem 반환값 불변
  Given 기존 switch zone (role="switch", check.mode="check")
  When computeItem 호출
  Then aria-checked 속성이 기존과 동일하게 반환

Scenario: computeItem 반환값 불변 — slider
  Given 기존 slider zone (role="slider", value config)
  When computeItem 호출
  Then aria-valuenow/min/max 속성이 기존과 동일하게 반환

Scenario: 기존 테스트 100% 유지
  Given 모든 기존 headless compute 테스트
  When computeFieldAttrs 추출 후 실행
  Then 전체 통과 (내부 리팩토링, 외부 동작 불변)
```

---

### 1.5 fieldKeyOwnership 확장 (T5)

**Story**: OS 개발자로서, boolean/number Field의 Zone passthrough 규칙을 추가하고 싶다. 그래야 Field 편집 중에도 필요한 키가 Zone/OS로 전달되기 때문이다.

**Scenarios:**

```
Scenario: boolean Field의 Escape는 Zone으로 passthrough
  Given fieldType="boolean"인 Field가 편집 중
  When Escape 키 입력
  Then Zone 레이어에 전달

Scenario: number Field의 Escape는 Zone으로 passthrough
  Given fieldType="number"인 Field가 편집 중
  When Escape 키 입력
  Then Zone 레이어에 전달

Scenario: number Field의 Tab은 Zone으로 passthrough
  Given fieldType="number"인 Field가 편집 중
  When Tab 키 입력
  Then Zone 레이어에 전달
```

---

### 1.6 KI + 문서 갱신 (T6)

**Story**: OS 개발자로서, KI와 공식 문서의 Field 정의를 갱신하고 싶다. 그래야 "Field = Text Conduit" drift가 교정되기 때문이다.

**Scenarios:**

```
Scenario: KI Field 정의 갱신
  Given ZIFT Standard Specification KI
  When Field 설명 확인
  Then "Entity Property를 편집하는 1:1 인터페이스"로 정의
  And FieldType에 boolean, number 포함

Scenario: overview.md 갱신
  Given ZIFT overview
  When Field 섹션 확인
  Then string만이 아닌 boolean/number 예시 포함
```

---

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `FieldType` | `"inline" \| "tokens" \| "block" \| "editor" \| "boolean" \| "number"` | 기존 4 + 신규 2 | — |
| `FieldState.value` | `string \| boolean \| number` | Field 등록 시 | — |
| `FIELD_KEYMAPS["boolean"]` | Space/Enter → OS_CHECK | boolean Field focus 시 | — |
| `FIELD_KEYMAPS["number"]` | Arrow/Home/End/Page → OS_VALUE_CHANGE | number Field focus 시 | — |

## 3. 범위 밖 (Out of Scope)

- `createField` API — Phase 2
- enum / enum[] FieldType — Phase 2
- computeFieldAttrs 외부 승격 (computeItem에서 완전 분리) — Phase 2
- Field 컴포넌트 (Field.tsx) 변경 — boolean/number는 contentEditable 아님. 별도 UI 컴포넌트 필요하며 Phase 2 scope
- Zone selection ↔ Field value 동기화 메커니즘 — Phase 2

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-03-01 | 초안 작성 (T1~T6) |
