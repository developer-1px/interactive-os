# Spec — eliminate-layout-dispatch

> 한 줄 요약: useLayoutEffect 내 kernel dispatch를 config 선언형으로 대체한다.

## T1: Zone disallowEmpty — useLayoutEffect OS_INIT_SELECTION 제거

### 1.1 기능명: Config-driven initial selection

**Story**: OS 개발자로서, Zone mount 시 useLayoutEffect에서 OS_INIT_SELECTION을 dispatch하지 않고도 disallowEmpty가 올바르게 동작하기를 원한다. 그래야 headless/UI 완전 동치이고, mount 타이밍 함정이 없기 때문이다.

**Use Case — 주 흐름:**
1. Zone이 `select.disallowEmpty: true` config로 등록된다 (예: tablist, radiogroup)
2. ensureZone 시점에 items가 존재하면, 첫 번째 아이템이 자동 선택된다
3. computeItem이 해당 아이템에 `aria-selected: true`를 투영한다

**Scenarios (Given/When/Then):**

Scenario: tablist — mount 시 첫 번째 탭 자동 선택
  Given tablist role, items=[tab-1, tab-2, tab-3], disallowEmpty=true
  When Zone이 등록된다
  Then tab-1의 aria-selected=true

Scenario: radiogroup — mount 시 첫 번째 라디오 자동 선택
  Given radiogroup role, items=[r-1, r-2], disallowEmpty=true
  When Zone이 등록된다
  Then r-1의 aria-selected=true (또는 aria-checked=true)

Scenario: disallowEmpty=false — 자동 선택 안 함
  Given listbox role, items=[opt-1, opt-2], disallowEmpty=false
  When Zone이 등록된다
  Then 어떤 아이템도 aria-selected=true가 아니다

Scenario: 이미 선택이 있는 Zone — 중복 선택 안 함
  Given tablist role, items=[tab-1, tab-2], disallowEmpty=true, tab-2가 이미 선택됨
  When Zone이 등록된다
  Then tab-2의 aria-selected=true 유지 (tab-1으로 덮어쓰지 않음)

Scenario: headless 동치 — TestPage에서도 동일 동작
  Given headless page, tablist role, items=[tab-1, tab-2], disallowEmpty=true
  When page.goto() 호출
  Then tab-1의 aria-selected=true (UI와 동일)

## 2. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `zone.items[id]["aria-selected"]` | 아이템 선택 상태 | ensureZone + disallowEmpty | OS_SELECT or OS_CHECK |
| `select.disallowEmpty` | Zone config 플래그 | resolveRole(tablist/radiogroup) | config 변경 |

## 3. 범위 밖 (Out of Scope)

- T2 (autoFocus) — 별도 태스크
- T3 (STACK_PUSH/POP) — 별도 태스크
- T4 (Field auto-commit) — 별도 태스크
- initial.focusedItemId — T1은 selection만. focus는 T2.
- UI 테스트 — T1은 headless 검증만. UI 검증은 기존 테스트로 regression 확인.
