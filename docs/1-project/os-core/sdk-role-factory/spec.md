# Spec — sdk-role-factory (Phase 1)

> bind() 시그니처를 `bind(role, config)`로 변경하고, role이 config 타입을 결정하게 한다.
> 런타임 행동 변경 없음. 타입 안전성만 추가.

## 1. 기능 요구사항

### 1.1 defineRole — Role 객체 생성

**Story**: OS 개발자로서, role을 객체로 정의하고 싶다. 그래야 OCP를 지키면서 role별 config 타입을 강제할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. `defineRole(name, ariaSchema, preset)` 호출
2. `Role<TConfig>` 객체 반환 — phantom type으로 config 형태를 carry
3. 기존 `resolveRole()` 함수가 `Role` 객체에서 preset을 추출

**Scenarios:**

Scenario: role 객체 생성
  Given defineRole이 import 가능할 때
  When `defineRole("listbox", { containerRole: "listbox", itemRole: "option", attrs: ["aria-selected"] }, preset)` 호출
  Then `Role<ListboxConfig>` 타입의 객체가 반환된다

Scenario: 기존 resolveRole 호환
  Given listboxRole이 defineRole로 생성되었을 때
  When `resolveRole(listboxRole)` 호출 (또는 내부적으로 role.preset 접근)
  Then 기존과 동일한 FocusGroupConfig가 반환된다

### 1.2 role별 config 타입 — 잘못된 조합 tsc 거부

**Story**: LLM으로서, listbox에 getTreeLevels를 넘기면 컴파일 에러가 나길 원한다. 그래야 실수를 런타임 전에 잡을 수 있기 때문이다.

**Scenarios:**

Scenario: listbox에 유효한 config
  Given listboxRole이 정의되어 있을 때
  When `bind(listboxRole, { getItems, onAction, onSelect, onDelete })` 작성
  Then tsc 통과

Scenario: listbox에 무효한 config — tree 전용
  Given listboxRole이 정의되어 있을 때
  When `bind(listboxRole, { getTreeLevels: () => new Map() })` 작성
  Then tsc 컴파일 에러 (getTreeLevels는 listbox config에 없음)

Scenario: tree에 유효한 config
  Given treeRole이 정의되어 있을 때
  When `bind(treeRole, { getItems, getTreeLevels, getExpandableItems })` 작성
  Then tsc 통과

Scenario: dialog에 무효한 config — collection 전용
  Given dialogRole이 정의되어 있을 때
  When `bind(dialogRole, { getItems: () => [] })` 작성
  Then tsc 컴파일 에러

Scenario: field/triggers는 모든 role에서 허용
  Given 임의의 role이 정의되어 있을 때
  When `bind(anyRole, { field: { name: "x" }, triggers: { ... } })` 작성
  Then tsc 통과 (field, triggers는 role과 무관한 OS 고유 관심사)

### 1.3 bind() 시그니처 변경

**Story**: 앱 개발자(LLM)로서, role을 config 밖으로 빼서 첫 인자로 넘기고 싶다. 그래야 role에 따른 타입 추론이 작동하기 때문이다.

**Scenarios:**

Scenario: 새 시그니처로 bind 호출
  Given createZone으로 zone을 만들었을 때
  When `zone.bind(listboxRole, { getItems, onAction })` 호출
  Then BoundComponents가 반환된다 (Zone, Item, Field, When)

Scenario: 기존 시그니처(role in config)는 tsc 에러
  Given createZone으로 zone을 만들었을 때
  When `zone.bind({ role: "listbox", getItems, onAction })` 작성
  Then tsc 컴파일 에러 (첫 인자가 Role 객체여야 함)

### 1.4 기존 동작 보존

**Story**: 앱 사용자로서, 이 리팩토링 후에도 모든 앱이 동일하게 동작하길 원한다.

**Scenarios:**

Scenario: 기존 전체 테스트 통과
  Given Phase 1 마이그레이션이 완료되었을 때
  When `npm run typecheck && vitest run` 실행
  Then tsc 0 에러, 기존 전체 테스트 PASS

Scenario: 런타임 행동 무변경
  Given bind(listboxRole, config) 로 전환된 앱이 있을 때
  When 사용자가 ↑↓ 탐색, 선택, 삭제 수행
  Then 기존과 동일하게 동작 (포커스, ARIA, 커맨드 모두)

## 2. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| (없음 — 이 프로젝트는 새 상태를 추가하지 않음) | | | |

> 런타임 상태 변경 없음. 타입 시스템만 변경.

## 3. 범위 밖 (Out of Scope)

- Phase 2 (role 팩토리 — `listbox(app, "list", config)` → 단일 컴포넌트)
- getItems 제거 (Phase 2에서)
- Zone/Item 컴포넌트 구조 변경
- 런타임 행동 변경
- ZIFT props-spread 리팩토링 (별도 프로젝트)

## 4. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-03-11 | 초판 작성 |
