# T1 결정 테이블 — Tab State (tablist activate → aria-selected)

> APG Tabs 패턴 참조: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

## Step 1-1: Zone + 물리적 입력

| Zone | 물리적 입력 | role |
|------|-----------|------|
| tablist | ArrowLeft, ArrowRight, Enter, Click, Home, End | tablist |

## Step 1-2: 1차 분기 — Zone × 물리적 입력 × OS 조건 → 의도

| # | Zone | 물리적 입력 | OS 조건 | → 의도 |
|---|------|-----------|---------|--------|
| A1 | tablist | ArrowRight | — | navigate(right) |
| A2 | tablist | ArrowLeft | — | navigate(left) |
| A3 | tablist | Enter | — | activate |
| A4 | tablist | Click | — | activate |
| A5 | tablist | Home | — | navigate(home) |
| A6 | tablist | End | — | navigate(end) |

> tablist은 editing 모드가 없다. 1차 분기 단순.

## Step 1-3: 2차 분기 — 의도 × App 조건 → 커맨드

| # | 의도 | App 조건 | → 커맨드 | 효과 |
|---|------|---------|---------|------|
| B1 | navigate | — | `OS_NAVIGATE` | focusedItemId 변경, `aria-selected` 불변 (manual activation) |
| B2 | activate | — | `OS_ACTIVATE` | 해당 탭 `aria-selected=true`, 다른 탭 `aria-selected=false` (단일 선택) |

> 2차 분기 없음. tablist은 App 조건에 의한 분기가 없다. OS가 전부 처리.

## Step 1-4: 테스트 시나리오 (Full Path)

| # | Zone | Given | When | Then |
|---|------|-------|------|------|
| 1 | tablist | `items: [tab-0, tab-1, tab-2], focused: tab-0` | (초기) | `attrs(tab-0).ariaSelected === "true"` |
| 2 | tablist | `focused: tab-0` | `press("ArrowRight")` | `focusedItemId === "tab-1"`, `attrs(tab-0).ariaSelected === "true"` (불변) |
| 3 | tablist | `focused: tab-1` (ArrowRight 후) | `press("Enter")` | `attrs(tab-1).ariaSelected === "true"`, `attrs(tab-0).ariaSelected === "false"` |
| 4 | tablist | `focused: tab-0` | `click("tab-2")` | `attrs(tab-2).ariaSelected === "true"`, `attrs(tab-0).ariaSelected === "false"` |
| 5 | tablist | `focused: tab-0` | `press("Right") × 2 + press("Enter")` | `attrs(tab-2).ariaSelected === "true"`, 나머지 false |
| 6 | tablist | `focused: tab-2` | `press("ArrowRight")` | `focusedItemId === "tab-0"` (wrap) |

## Step 1-5: 경계 케이스

| # | Given | When | Then |
|---|-------|------|------|
| E1 | tablist 1개 탭만 | `press("ArrowRight")` | `focusedItemId` 변경 없음 (wrap to self) |
| E2 | tab-2 selected, tab-0 focused | `press("Enter")` | tab-0 selected, tab-2 deselected |

## APG Manual vs Automatic Activation

- **Manual activation** (이 구현): ArrowKey로 포커스만 이동, Enter/Space/Click으로 활성화
- **Automatic activation**: ArrowKey로 포커스 이동 시 자동 활성화

> 이 OS는 **Manual activation**을 기본으로 한다. Automatic은 config 옵션으로 확장 가능.
