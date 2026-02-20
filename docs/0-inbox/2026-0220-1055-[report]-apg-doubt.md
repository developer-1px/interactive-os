# /doubt 결과 — APG Contract Testing Suite

> 2026-02-20 10:55 · 대상: `src/os/3-commands/tests/apg/*.apg.test.ts` (8 files, 1,754 lines, 96 tests)

## Round 1: 필터 체인

### 목록화 — 각 파일이 테스트하는 고유 커널 행동

| # | 파일 | Lines | Tests | 고유 행동 | 1차 판정 |
|:-:|------|------:|------:|-----------|:--------:|
| 1 | `listbox.apg` | 407 | 26 | vertical nav, followFocus on/off, single/multi-select, Shift+Arrow range, horizontal variant | 🟢 유지 |
| 2 | `dialog.apg` | 213 | 9 | Tab trap (wrap), Escape=close, STACK restore, nested LIFO | 🟢 유지 |
| 3 | `grid.apg` | 245 | 14 | `orientation="both"` + DOMRect, 4-directional, boundary clamp | 🟢 유지 |
| 4 | `toolbar.apg` | 180 | 9 | horizontal + loop + Tab escape + vertical ignored | 🟡 축소 |
| 5 | `combobox.apg` | 192 | 10 | **popup lifecycle** (STACK_PUSH → nav → ESCAPE → STACK_POP) | 🟡 병합 |
| 6 | `menu.apg` | 186 | 10 | popup lifecycle + **no selection** (mode=none) | 🟡 병합 |
| 7 | `tabs.apg` | 170 | 10 | horizontal + loop + **followFocus** (auto-activation) | 🔴 중복 |
| 8 | `radiogroup.apg` | 161 | 8 | vertical + loop + followFocus + **disallowEmpty** | 🟡 축소 |

### 필터 체인 상세

#### 🔴 `tabs.apg.test.ts` — **① 쓸모가 있나? → 아니오 (Lean: 과잉생산)**

Tabs 테스트가 검증하는 커널 행동:
- horizontal navigation + loop → **`toolbar.apg`과 동일 config path**
- followFocus (selection follows focus) → **`listbox.apg` (single-select followFocus=true 섹션)과 동일**
- vertical ignored → **`toolbar.apg`과 동일**
- Home/End → **모든 파일에 있음**

**Tabs가 Toolbar과 다른 유일한 점**: `select.followFocus: true`. 하지만 이것은 이미 `listbox.apg`에서 26개 테스트로 검증됨.

**Chesterton's Fence**: 왜 만들었나? → APG Tabs 패턴이 별도로 존재하니까. 그 이유가 유효한가? → APG 문서에서는 별도 패턴이지만, **커널 레벨에서는 config 조합이 동일**. 별도 파일로 존재할 이유 없음.

**결정**: 🔴 제거. Tab 고유 행동(horizontal + followFocus + loop)은 `toolbar.apg`에 `describe("APG Toolbar: Tabs Variant")` 1개 블록으로 흡수.

#### 🟡 `combobox.apg` + `menu.apg` — **④ 더 적게? → 예 (Lean: 운반)**

두 파일 모두:
1. STACK_PUSH → zone 전환 → navigation → ESCAPE → STACK_POP
2. Boundary (up at first, down at last)
3. Home/End

**차이점**: combobox는 `followFocus: true, mode: "single"`, menu는 `followFocus: false, mode: "none"`. 이 차이는 실질 1개 테스트로 검증 가능.

하지만 **Chesterton's Fence**: popup lifecycle (STACK_PUSH/POP + zone 전환) 자체는 dialog.apg에서 이미 검증. combobox/menu의 navigation 섹션은 listbox.apg의 vertical-no-loop와 동일.

**combobox/menu의 고유 가치**: popup 내부에서의 navigation이 popup 외부에서의 navigation과 동일하게 동작하는지를 증명. 이것은 실제로 가치가 있음 — zone context가 바뀌어도 navigation이 일관되어야 하니까. 하지만 10개씩 테스트할 필요는 없음.

**결정**: 🟡 병합. `combobox.apg` + `menu.apg` → `popup.apg.test.ts` 1개 파일. 공통 popup lifecycle + combobox/menu 각각의 고유 섹션으로 정리. navigation 중복 제거.

#### 🟡 `radiogroup.apg` — **③ 줄일 수 있나? → 예**

RadioGroup의 고유 행동: `loop: true + followFocus: true + disallowEmpty: true`. loop + followFocus는 tabs/toolbar와 겹침. **진짜 고유한 것은 `disallowEmpty: true` 1개 테스트뿐**.

**결정**: 🟡 축소. `listbox.apg`에 `describe("APG Listbox: RadioGroup Variant")` 추가 — `disallowEmpty + loop + followFocus` 조합을 3-4개 테스트로.

#### 🟡 `toolbar.apg` — **③ 줄일 수 있나? → 예**

Toolbar의 고유 행동: Tab escape + vertical ignored. 이것은 진짜 고유함. 하지만 Home/End section (2개)은 모든 파일에 반복됨.

**결정**: 🟡 유지하되 Home/End 중복 인정. Tabs를 흡수하면 약간 늘지만 순수 고유 테스트만 남김.

---

## Round 1 실행 계획

| 판정 | 항목 | 조치 |
|:----:|------|------|
| 🔴 제거 | `tabs.apg.test.ts` | 삭제. 고유 행동을 `toolbar.apg`에 1개 describe로 흡수 |
| 🟡 병합 | `combobox.apg` + `menu.apg` | → `popup.apg.test.ts` 1개 파일. navigation 중복 제거 |
| 🟡 축소 | `radiogroup.apg` | → `listbox.apg`에 RadioGroup variant describe 추가 후 삭제 |
| 🟢 유지 | `listbox.apg` | 핵심. 유지 |
| 🟢 유지 | `dialog.apg` | Tab trap + STACK LIFO. 고유. 유지 |
| 🟢 유지 | `grid.apg` | orientation=both + DOMRect. 유일무이. 유지 |
| 🟢 유지 | `toolbar.apg` | Tab escape + vertical ignored. 고유. Tabs variant 흡수 |

### 📊 Before → After (예상)
- 파일 수: 8 → 5
- 테스트 수: 96 → ~75 (중복 제거)
- 라인 수: 1,754 → ~1,200 (-30%)
