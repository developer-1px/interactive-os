# 결정 테이블: Draft Field Input → Todo 생성

> 2026-02-25 | field-headless-input T1–T3

## Step 1-1: Zone + 물리적 입력 열거

| Zone | 물리적 입력 |
|---|---|
| draft | keyboard.type("text"), Enter |

## Step 1-2: 1차 분기 — Zone × 물리적 입력 × OS 조건 → 의도

| # | Zone | 물리적 입력 | OS 조건 | → 의도 |
|---|---|---|---|---|
| 1 | draft | keyboard.type("text") | field active | text_input |
| 2 | draft | Enter | field active, trigger=enter, !isComposing | field_commit |
| 3 | draft | Enter | field active, isComposing=true | no-op (IME 진행 중) |

## Step 1-3: 2차 분기 — 의도 × App 조건 → 커맨드

| # | 의도 | App 조건 | → 커맨드 |
|---|---|---|---|
| 1 | text_input | — | FieldRegistry.updateValue(fieldId, text) |
| 2a | field_commit | schema valid (min 1 char) | addTodo({ text }) |
| 2b | field_commit | schema invalid (empty) | setError, no-op |
| 3 | no-op | isComposing | — |

## Step 1-4: 테스트 시나리오 (Full Path)

| # | Zone | Given | When | Then |
|---|---|---|---|---|
| 1 | draft | draft zone focused, field empty | `keyboard.type("Buy milk")` | FieldRegistry value === "Buy milk" |
| 2 | draft | draft zone focused, field has "Buy milk" | `keyboard.press("Enter")` | todoOrder.length +1, field reset to "" |
| 3 | draft | draft zone focused, field empty | `keyboard.press("Enter")` | todoOrder.length unchanged (schema reject) |
| 4 | draft | draft zone focused, field has "Buy milk" | `keyboard.type("Buy milk") → keyboard.press("Enter")` | Full path: type + commit in sequence |

## Step 1-5: 경계 케이스

- 빈 문자열 Enter → schema reject (min 1)
- 공백만 입력 후 Enter → create()에서 trim 후 null 반환 (no-op)
- resetOnSubmit 후 field value === ""
- commit 후 focus가 draft zone에 유지
