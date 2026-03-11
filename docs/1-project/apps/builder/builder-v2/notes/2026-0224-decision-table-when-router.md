# T20 결정 테이블 — When Router Extension

## Step 1-1: Zone + 물리적 입력 열거

| Zone | 물리적 입력 | role |
|---|---|---|
| canvas | Enter, Escape, \, Arrow ↑↓←→, Meta+C/X/V, Click | grid |
| sidebar | Enter, Escape, Arrow ↑↓, Delete, Meta+C/X/V | tree |
| panel | Enter, Escape, Arrow ↑↓ | tree |

> 이 태스크의 범위: **canvas Zone의 Enter, Escape, \ 만**

## Step 1-2: 1차 분기 — Zone × 물리적 입력 × OS 조건 → 의도

| # | Zone | 물리적 입력 | OS 조건 | → 의도(intent) |
|---|------|------------|---------|---------------|
| A1 | canvas | Enter | `isEditing=false` | activate |
| A2 | canvas | Enter | `isEditing=true` | field_commit |
| A3 | canvas | Escape | `isEditing=false` | dismiss |
| A4 | canvas | Escape | `isEditing=true` | field_cancel |
| A5 | canvas | \ | `isEditing=false` | dismiss (keybinding) |
| A6 | canvas | \ | `isEditing=true, fieldActive=true` | (Field 소유 — 텍스트 입력) |
| A7 | canvas | \ | `isEditing=true, fieldActive=false` | dismiss (keybinding) |

## Step 1-3: 2차 분기 — 의도 × App 조건 → 커맨드

| # | 의도 | App 조건(when) | → 커맨드 |
|---|------|---------------|---------|
| B1 | activate | `level=section` | `drillToFirstChild` |
| B2 | activate | `level=group` | `drillToFirstChild` |
| B3 | activate | `level=item` | `startFieldEdit` |
| B4 | dismiss | `level=item` | `drillToParent` |
| B5 | dismiss | `level=group` | `drillToParent` |
| B6 | dismiss | `level=section` | `forceDeselect` |
| B7 | field_commit | (조건 없음) | `OS_FIELD_COMMIT` |
| B8 | field_cancel | (조건 없음) | `OS_FIELD_CANCEL` |

MECE:
- activate: section ∪ group ∪ item = 전체 ✅
- dismiss: section ∪ group ∪ item = 전체 ✅
- field_commit/cancel: 조건 없음 (단일 경로) ✅

## Step 1-4: 테스트 시나리오 (Full Path: 1차 × 2차 합성)

| # | Zone | Given | When | Then |
|---|------|-------|------|------|
| 1 | canvas | `focusedId: "s1", isEditing: false` (section) | `press("Enter")` | `focusedItemId() === "g1"` |
| 2 | canvas | `focusedId: "g1", isEditing: false` (group) | `press("Enter")` | `focusedItemId() === "i1"` |
| 3 | canvas | `focusedId: "i1", isEditing: false` (item) | `press("Enter")` | `editingItemId === "i1"` |
| 4 | canvas | `focusedId: "i1", isEditing: false` (item) | `press("Escape")` | `focusedItemId() === "g1"` |
| 5 | canvas | `focusedId: "g1", isEditing: false` (group) | `press("Escape")` | `focusedItemId() === "s1"` |
| 6 | canvas | `focusedId: "s1", isEditing: false` (section) | `press("Escape")` | `focusedItemId() === null` |
| 7 | canvas | `focusedId: "i1", isEditing: false` | `press("\\")` | `focusedItemId() === "g1"` |
| 8 | canvas | `focusedId: "g1", isEditing: false` | `press("\\")` | `focusedItemId() === "s1"` |
| 9 | canvas | `focusedId: "s1", isEditing: false` | `press("\\")` | `focusedItemId() === null` |
| 10 | canvas | `focusedId: "i1", isEditing: true` | `press("Enter")` | `editingItemId === null` (commit) |
| 11 | canvas | `focusedId: "i1", isEditing: true` | `press("Escape")` | `editingItemId === null` (cancel) |

## Step 1-5: 경계 케이스

| # | Zone | Given | When | Then |
|---|------|-------|------|------|
| E1 | canvas | `focusedId: "s2"` (section, NO children) | `press("Enter")` | 결정 필요: no-op? or section의 item으로? |
| E2 | canvas | `focusedId: "i1"` | `press("Escape") × 3` | `null` (cascade: i1→g1→s1→null) |
| E3 | canvas | `focusedId: "i1"` | Escape vs \ 비교 | 같은 결과 |
| E4 | canvas | `focusedId: "i1", isEditing: true` | `press("\\")` | Field가 \를 소유하면 텍스트 입력, 아니면 dismiss |
