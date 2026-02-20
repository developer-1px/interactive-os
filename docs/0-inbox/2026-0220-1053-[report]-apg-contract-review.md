# Code Review — APG Contract Testing Design

> 2026-02-20 10:53 · 보고서 모드
> 대상: `src/os/3-commands/tests/apg/*.apg.test.ts` (8 files, 96 tests) + `createTestKernel.ts`

---

## 🏆 Praise

1. **[Praise] APG-first TDD 구현 성공.** Rule #10 ("APG가 스펙이다")을 정확히 따름. 각 테스트 파일 상단에 W3C 출처 URL이 JSDoc으로 명시되어 있어 "왜 이 테스트가 존재하는가"가 자명함.
2. **[Praise] createTestKernel 재사용성.** 8개 패턴 모두 동일한 인프라 위에서 동작. DOMRect mock(Grid), STACK_PUSH/POP(Dialog/Combobox/Menu) 등 확장이 자연스럽게 이루어짐.
3. **[Praise] 96 tests in 56ms.** Headless kernel의 가치를 증명. DOM 없이 행동 검증이 가능하다는 것을 실증.

---

## 🔴 철학 위반

### 1. [Blocker] Config 정의가 테스트마다 중복 — DRY 위반 + 동기화 위험

```
combobox.apg.test.ts  → POPUP_CONFIG.navigate.orientation = "vertical"
listbox.apg.test.ts   → singleSelectConfig.navigate.orientation = "vertical"
menu.apg.test.ts      → MENU_CONFIG.navigate.orientation = "vertical"
radiogroup.apg.test.ts → RADIO_CONFIG.navigate.orientation = "vertical"
```

**문제**: 같은 navigate config가 4개 파일에 중복. `FocusGroupConfig` 프리셋이 변경되면 4곳을 모두 수정해야 함. 이것은 Rule #11 ("복제본을 동기화하려는 순간이 '왜 복제본이 있는가?'를 물어야 하는 순간") 위반.

**권고**: `createTestKernel`에 **rollPreset** (preset: `"listbox" | "dialog" | "grid" | "toolbar" | "menu" | "combobox" | "tabs" | "radiogroup"`) 를 넣어 config를 프리셋화. 또는 `apg/helpers/` 폴더에 공유 프리셋 파일을 만들어 config를 한 곳에서 정의.

### 2. [Blocker] Combobox/Menu의 ESCAPE + STACK_POP이 2-dispatch 패턴

```typescript
// combobox.apg.test.ts
t.dispatch(t.ESCAPE());
t.dispatch(t.STACK_POP());  // 수동 연결 필요
```

**문제**: `ESCAPE()`가 popup을 닫지만 `STACK_POP()`은 별도 수동 호출. 실제 프로덕션에서는 `onDismiss` 콜백이 `STACK_POP`을 자동 연결하는데, 테스트에서는 이 연결이 없음. 이는 **계약의 불완전한 모델링**. 
실제 앱에서 `ESCAPE()` 후 `STACK_POP()`을 잊으면 포커스가 복원되지 않음 — 이 갭을 테스트가 보호하지 못함.

**권고**: `createTestKernel`에 `ZoneRegistry.register()` mock을 추가하여 `onDismiss: STACK_POP` 연결을 테스트 레벨에서 재현. 또는 이 갭을 Layer B 테스트로 명시적으로 분리.

---

## 🟡 네이밍/구조

### 3. [Suggest] 파일명 `.apg.test.ts` — 네이밍 컨벤션 검토 필요

rules.md 네이밍:
- 단위 테스트: `kebab-case.test.ts` → `navigate.test.ts`
- E2E: `kebab-case.spec.ts` → `todo.spec.ts`

현재 APG 테스트: `listbox.apg.test.ts` (점 구분)

**판단**: 이것은 기존 컨벤션에 **없는 새 범주**. `.apg.` 점 구분자가 `vitest.config.ts`의 include 패턴 (`src/**/tests/apg/**/*.test.ts`)과 일치하므로 기술적으로 문제없음. 다만, rules.md에 이 범주를 명문화하면 향후 에이전트가 헤매지 않음.

**권고**: rules.md에 행 추가: `| APG 계약 테스트 | kebab-case.apg.test.ts | listbox.apg.test.ts |`

### 4. [Nitpick] import 경로 — 상대 경로 깊이 3

```typescript
import { createTestKernel } from "../integration/helpers/createTestKernel";
```

이것은 `apg/` → `integration/helpers/`로 2단계 상대 경로. rules.md "import 경로: alias 사용, 상대 경로 깊이 3 이상 금지" 기준에 걸리지는 않지만(깊이 2), alias가 있으면 더 깔끔함.

**판단**: 비용 대비 효과 낮음. 유지.

---

## 🔵 개선 제안

### 5. [Suggest] Negative Test Cases 부재

현재 96개 테스트는 모두 **"이것을 해야 한다" (positive)**. APG는 **"이것을 하면 안 된다" (negative)**도 정의.

예시:
- Toolbar: "Tab does NOT move between buttons" (currently untested)
- Dialog: "Tab does NOT escape the dialog" (tested implicitly via trap, but not explicitly)
- Menu: "Typing does NOT select items" (no typeahead test)

**권고**: 각 파일에 `describe("APG X: Forbidden Interactions")` 섹션 추가. 실제 APG 위반 방지에 더 효과적.

### 6. [Suggest] Grid: Home/End 행위가 APG와 다를 수 있음

```typescript
// grid.apg.test.ts
it("Home: moves focus to first cell in the grid", () => {
  // APG says: "Home: moves focus to the first cell in the row"
  // 현재 구현: Home → first item in 1D list (r0c0), not first in current row
```

**APG Grid 스펙**: "Home: moves focus to the first cell **in the row that contains focus**."
**현재 동작**: Home → 전체 grid의 첫 번째 셀 (r0c0)

이것은 잠재적 APG 위반. 실제로는 OS의 Home이 1D 리스트 기준으로 동작하기 때문에, row-aware Home이 아닌 전체 Home으로 동작. Grid에서 row-aware Home이 필요하면 별도 구현 필요.

**권고**: 테스트 코멘트에 이 차이를 명시. 향후 Grid row-aware navigation 구현 시 테스트 업데이트.

### 7. [Thought] 8개 패턴의 config 조합이 OS의 구성 매트릭스를 증명

현재 8개 APG 패턴이 사실상 OS의 **config 매트릭스**를 간접 검증하고 있음:

| Config | Listbox | Dialog | Grid | Toolbar | Combobox | Menu | Tabs | Radio |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| orientation | V | V | both | H | V | V | H | V |
| loop | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| followFocus | ✓/✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| tab.behavior | escape | trap | escape | escape | trap | trap | escape | escape |
| dismiss.escape | deselect | close | — | — | close | close | — | — |

이 매트릭스가 rules.md나 official/ 문서에 없음. 기록하면 "어떤 config 조합이 APG 검증되었는가"가 한눈에 보임.

---

## 요약

| 심각도 | 건수 | 조치 |
|--------|------|------|
| 🔴 Blocker | 2 | Config 중복 프리셋화, ESCAPE+STACK_POP 연결 모델링 |
| 🟡 Suggest | 1 | rules.md에 APG 테스트 네이밍 컨벤션 추가 |
| 🟡 Nitpick | 1 | 상대 import — 유지 |
| 🔵 Suggest | 3 | Negative tests, Grid Home/End 차이 명시, Config 매트릭스 문서화 |

**🔴 항목 즉시 수정 여부를 확인합니다.**
