# Decision Table: docs-section-nav (T1)

## Zone: docs-reader (role: feed)

### 1차 분기 — OS 조건

| # | Zone        | 물리적 입력   | OS 조건              | → 의도         |
|---|-------------|--------------|---------------------|----------------|
| 1 | docs-reader | Space        | isEditing=false      | next_section   |
| 2 | docs-reader | Shift+Space  | isEditing=false      | prev_section   |
| 3 | docs-reader | Space        | isEditing=true       | (field owns)   |

### 2차 분기 — App 조건

| # | 의도           | App 조건 | → 커맨드              | → Effect                    |
|---|---------------|---------|----------------------|----------------------------|
| 1 | next_section  | (none)  | DOCS_NEXT_SECTION    | scrollSection("next")       |
| 2 | prev_section  | (none)  | DOCS_PREV_SECTION    | scrollSection("prev")       |

### Full Path 테스트 시나리오

| # | Zone        | Given                            | When               | Then                                              |
|---|-------------|----------------------------------|--------------------|----------------------------------------------------|
| 1 | docs-reader | activeZone=docs-reader           | press("Space")     | DOCS_NEXT_SECTION dispatched, scrollSection("next") effect 호출 |
| 2 | docs-reader | activeZone=docs-reader           | press("Shift+Space")| DOCS_PREV_SECTION dispatched, scrollSection("prev") effect 호출 |
| 3 | docs-reader | press("Space") 후                | press("Space")     | scrollSection("next") effect 2번째 호출 (1회가 아님)           |
| 4 | docs-reader | press("Space") 3회               | —                  | scrollSection("next") effect 정확히 3회 호출                  |

### 경계 케이스

- Space 연속 3회 → effect 3회 호출 (1회에 멈추면 안 됨)
- Shift+Space은 OS_SELECT가 아닌 DOCS_PREV_SECTION으로 해석
- Space는 OS_SELECT(toggle)가 아닌 DOCS_NEXT_SECTION으로 해석
