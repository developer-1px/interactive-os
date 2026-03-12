# Spec — zone-typing-entry

> 한 줄 요약: Zone에 `typingEntry: true` 옵션을 추가하여 printable character 입력 시 `onAction` 자동 트리거

## 1. 기능 요구사항

### 1.1 typingEntry 자동 트리거

**Story**: Builder 사용자로서, canvas에서 문자를 타이핑하면 바로 편집 모드에 진입하고 싶다. 그래야 Enter를 먼저 누를 필요 없이 빠르게 편집할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. Zone에 `typingEntry: true` 설정
2. 사용자가 navigating 상태에서 printable character(a-z, 0-9) 입력
3. OS가 `onAction` 콜백 호출 (= 편집 모드 진입)

**Scenarios:**

Scenario S1: printable character triggers onAction
  Given typingEntry: true인 zone에 아이템 "box1"이 focused
  When 사용자가 "a"를 입력
  Then onAction이 호출됨 (focusId = "box1")

Scenario S2: non-printable key does NOT trigger onAction
  Given typingEntry: true인 zone에 아이템 "box1"이 focused
  When 사용자가 ArrowDown을 입력
  Then onAction이 호출되지 않음 (일반 네비게이션 동작)

Scenario S3: typingEntry false (기본값) — 문자 입력 무시
  Given typingEntry 미설정인 zone에 아이템 "box1"이 focused
  When 사용자가 "a"를 입력
  Then onAction이 호출되지 않음

Scenario S4: digit triggers onAction
  Given typingEntry: true인 zone에 아이템 "box1"이 focused
  When 사용자가 "5"를 입력
  Then onAction이 호출됨

Scenario S5: Enter still triggers onAction (기존 동작 보존)
  Given typingEntry: true인 zone에 아이템 "box1"이 focused
  When 사용자가 Enter를 입력
  Then onAction이 호출됨 (기존 OS_ACTIVATE 동작)

Scenario S6: modifier+key does NOT trigger typingEntry
  Given typingEntry: true인 zone에 아이템 "box1"이 focused
  When 사용자가 Ctrl+a를 입력
  Then onAction이 호출되지 않음 (modifier가 있으면 skip)

## 2. Decision Table

| # | Zone typingEntry | Key | Modifier | Expected |
|---|-----------------|-----|----------|----------|
| DT1 | true | "a" (printable) | none | onAction 호출 |
| DT2 | true | "5" (digit) | none | onAction 호출 |
| DT3 | true | ArrowDown | none | 일반 네비게이션 (onAction 안 함) |
| DT4 | true | Enter | none | OS_ACTIVATE → onAction (기존 동작) |
| DT5 | true | "a" | Ctrl | onAction 안 함 |
| DT6 | true | "a" | Shift | onAction 호출 (Shift+letter = 대문자, 여전히 printable) |
| DT7 | false / 미설정 | "a" | none | 무반응 (기존 동작) |
| DT8 | true | Space | none | onAction 안 함 (Space = OS_CHECK/OS_ACTIVATE, typingEntry 대상 아님) |

## 3. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| navigating | zone 내 아이템 탐색 중 | zone focus | field 진입 or zone 탈출 |
| editing | field 편집 중 | onAction → FIELD_START_EDIT | Escape or Enter commit |

## 4. 범위 밖 (Out of Scope)

- 타이핑된 문자를 field에 자동 전달하는 것 (앱이 onAction에서 처리)
- Space 키 처리 (기존 OS_CHECK/OS_ACTIVATE와 충돌)
- 특수문자 (!, @, # 등) — 확장은 가능하나 1차 스코프에서 a-z + 0-9만
