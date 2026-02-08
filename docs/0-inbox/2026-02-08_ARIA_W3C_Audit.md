# ARIA Role Registry & 테스트 명세 W3C 감사 보고서

> **작성일**: 2026-02-08  
> **대상**: `roleRegistry.ts` + 14개 테스트 파일  
> **기준**: [W3C WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

## 1. 개요

`roleRegistry.ts`의 역할 프리셋 설정과 ARIA showcase 테스트 파일의 기대값을 W3C APG와 대조 감사한 결과, **설정 오류 3건**과 **테스트 명세 오류 5건**을 발견했습니다.

---

## 2. Role Registry 설정 오류

### 2-1. `tablist` — 올바름 ✅ (구현 문제)

```typescript
// roleRegistry.ts:181-186
tablist: {
  navigate: { orientation: "horizontal", loop: true, entry: "selected" },
  select: { mode: "single", followFocus: true, disallowEmpty: true },
  activate: { mode: "automatic" },
  tab: { behavior: "escape" },
},
```

**W3C APG**: "Optionally, activates the newly focused tab" — auto-activation은 선택적 모드로 유효.

> [!NOTE]
> roleRegistry 설정은 올바릅니다. 실패 원인은 aria-showcase 페이지의 `index.tsx`에서 `FocusGroup`에 `select` prop을 전달하지 않고 수동으로 `onClick`만 사용한 것이 문제입니다.

---

### 2-2. `toolbar` — ❌ 설정 불완전

```typescript
// roleRegistry.ts:191-194
toolbar: {
  navigate: { orientation: "horizontal", loop: true, entry: "restore" },
  tab: { behavior: "escape" },
},
```

**W3C APG**: 툴바 자체는 selection/activation을 정의하지 않음. 개별 button이 자체 상태를 관리. 그러나:
- `select: { mode: "none" }` 명시 없음 → 기본값이 적용될 수 있음
- `activate` 설정도 없으므로, Enter/Space가 `onClick`을 트리거하는지 기본 동작에 의존

**영향**: 툴바 내 버튼의 `aria-pressed` 토글이 Enter/Space에서 동작하지 않을 수 있음.

> [!IMPORTANT]
> **수정 제안**: `select: { mode: "none" }`을 명시적으로 추가하여 의도치 않은 선택 동작 방지. 실제 `aria-pressed` 토글은 `activate` 모드가 아닌 네이티브 `<button>` click 동작에 의존해야 할 수 있음.

---

### 2-3. `menu` — ⚠️ Enter vs Space 구분 필요

```typescript
// roleRegistry.ts:146-157
menu: {
  navigate: { orientation: "vertical", loop: true, entry: "first" },
  select: { mode: "none" },
  activate: { mode: "automatic" },
  dismiss: { escape: "close" },
  tab: { behavior: "trap" },
  project: { autoFocus: true },
},
```

**W3C APG 키보드 인터랙션**:
| 키 | `menuitem` | `menuitemcheckbox` |
|:--|:--|:--|
| **Enter** | 활성화하고 **메뉴를 닫음** | 활성화하고 **메뉴를 닫음** |
| **Space** | 활성화하고 **메뉴를 닫음** | 상태 변경, **메뉴를 닫지 않음** |

현재 `activate: { mode: "automatic" }`는 Enter/Space를 구분하지 않음. W3C 명세에 따르면 **menuitemcheckbox에서 Space는 특수 처리**(닫지 않고 토글)해야 합니다.

**영향**: 우리 aria-showcase는 독립형 menu(popup이 아님)라서 "닫기" 동작은 해당 없으나, `menuitemcheckbox`에서 Enter/Space가 `onClick`을 올바르게 트리거하는지는 확인 필요.

---

### 2-4. `grid` — ✅ 설정 올바름

```typescript
// roleRegistry.ts:199-203
grid: {
  navigate: { orientation: "both", loop: false },
  select: { mode: "multiple", range: true, toggle: true, followFocus: false },
  tab: { behavior: "escape" },
},
```

**W3C APG**: 2D 네비게이션, edge에서 멈춤 (no loop), 별도 선택 모드. 설정 올바름.

---

### 2-5. `dialog` / `alertdialog` — ✅ 설정 올바름

```typescript
dialog: {
  tab: { behavior: "trap", restoreFocus: true },
  dismiss: { escape: "close", outsideClick: "close" },
  project: { autoFocus: true },
},
alertdialog: {
  tab: { behavior: "trap", restoreFocus: true },
  dismiss: { escape: "close", outsideClick: "none" },
  project: { autoFocus: true },
},
```

**W3C APG**: Tab 트랩, 자동 포커스, Escape로 닫기, focus 복원 — 모두 올바름. `alertdialog`는 외부 클릭 비허용도 올바름.

> [!NOTE]
> 설정은 올바르지만, `restoreFocus: true`가 실제로 DOM unmount 전에 포커스를 복원하는지는 구현 레벨 확인 필요. 이것은 설정이 아닌 파이프라인 버그 가능성.

---

### 2-6. `listbox` — ✅ 설정 올바름

```typescript
listbox: {
  navigate: { orientation: "vertical", loop: false, typeahead: true, entry: "selected" },
  select: { mode: "single", followFocus: true },
  tab: { behavior: "escape" },
},
```

**W3C APG**: 수직 네비게이션, followFocus 선택적, typeahead 권장, 선택된 아이템 진입 — 모두 올바름.

---

## 3. 테스트 명세 오류

### 3-1. ❌ Grid: Home/End — **테스트가 W3C 명세와 불일치**

**현재 테스트** ([GridTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/GridTest.tsx#L180-L196)):
```typescript
// cell-5에서 Home → cell-0 (전체 첫 번째) 기대
await t.press("Home");
await t.expect("#cell-0").focused();  // ❌ 틀림

// Home → cell-11 (전체 마지막) 기대  
await t.press("End");
await t.expect("#cell-11").focused(); // ❌ 틀림
```

**W3C APG Grid 명세**:
| 키 | 동작 |
|:--|:--|
| **Home** | 현재 **행**의 첫 번째 셀 |
| **End** | 현재 **행**의 마지막 셀 |
| **Ctrl+Home** | 그리드 첫 번째 셀 (전체) |
| **Ctrl+End** | 그리드 마지막 셀 (전체) |

**수정 필요**: cell-5 (row 2, col 2)에서:
- `Home` → `#cell-4` (row 2의 첫 번째)
- `End` → `#cell-7` (row 2의 마지막)
- `Ctrl+Home` → `#cell-0`
- `Ctrl+End` → `#cell-11`

---

### 3-2. ❌ Grid: Diagonal — **존재하지 않는 셀 참조**

**현재 테스트** ([GridTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/GridTest.tsx#L202-L224)):
```
Grid: Diagonal Navigation — 실패 메시지: Expected #grid-cell-12 focused
```

그리드는 12개 셀(0-11)만 존재. `#cell-12`은 없음 → 이 실패는 테스트 로직 오류거나 실행 중 어긋난 것.

실제로 테스트 코드를 보면 `#cell-12`을 직접 참조하지 않으므로, 이전 스텝의 포커스 상태가 어긋나서 연쇄 실패한 것으로 보임. 테스트 자체는 올바르지만, **Grid의 Home/End가 행 단위가 아닌 전체 단위로 동작하면서 후속 diagonal 테스트의 출발점이 달라진 것**이 원인.

---

### 3-3. ❌ Menu: Checkbox Toggle — **Enter 대신 Space 사용해야**

**현재 테스트** ([MenuTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/MenuTest.tsx#L49-L77)):
```typescript
// Enter로 체크 상태 토글 기대
await t.press("Enter");
await t.expect("#menu-ruler").toHaveAttr("aria-checked", "false");
```

**W3C APG**:
- **Enter** on `menuitem`: "activates the item and **closes the menu**" (popup menu인 경우)
- **Space** on `menuitemcheckbox`: "changes the state **without closing** the menu"

> [!IMPORTANT]
> `menuitemcheckbox`에서 상태 토글은 **Space** 키가 표준입니다. Enter는 활성화 + 닫기 동작. 우리 showcase가 독립형 menu(닫기 없음)라도, **명세에 맞게 Space를 사용**하는 것이 정확합니다.

**수정**: `t.press("Enter")` → `t.press(" ")` 또는 `t.press("Space")`

---

### 3-4. ⚠️ Tabs: Horizontal Navigation — **테스트 기대값은 명세에 부합하나 구현 미흡**

**현재 테스트** ([TabsTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/TabsTest.tsx#L14-L46)):
```typescript
await t.press("ArrowRight");
await t.expect("#tab-security").toHaveAttr("aria-selected", "true"); // auto-activation
```

**W3C APG**: "**Optionally**, activates the newly focused tab"

우리 roleRegistry는 `tablist`에 `select: { followFocus: true }`와 `activate: { mode: "automatic" }`를 설정했으므로, 테스트가 auto-activation을 기대하는 것은 **우리 설정에 맞음**. 다만 aria-showcase `index.tsx`에서 `FocusGroup`에 이 설정을 전달하지 않고 수동 `onClick`만 사용해서 실패.

**결론**: 테스트 명세 ✅, 페이지 구현 ❌

---

### 3-5. ⚠️ Combobox: Trigger Focus — **초기 상태와 충돌**

**현재 테스트** ([ComplexPatternsTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/ComplexPatternsTest.tsx#L33-L37)):
```typescript
await t.click("#combo-trigger");
await t.expect("#combo-trigger").toHaveAttr("aria-expanded", "true");
```

**문제**: `index.tsx`에서 `useState(true)` → combobox가 이미 열린 상태. 클릭하면 `!isComboOpen` = `false`로 닫아버림.

**W3C APG**: Combobox trigger 클릭 시 popup이 열려야 함. 초기 상태가 닫힌 상태(`false`)에서 시작해야 테스트가 올바름.

**수정**: `useState(true)` → `useState(false)`로 변경 후, 테스트 기대값은 유지.

---

### 3-6. ⚠️ Combobox: Listbox Navigation — **분리된 FocusGroup**

**현재 테스트** ([ComplexPatternsTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/aria-showcase/tests/ComplexPatternsTest.tsx#L39-L52)):
```typescript
await t.click("#combo-trigger");
await t.press("ArrowDown");
await t.expect("#combo-opt-0").focused(); // trigger에서 listbox로 이동 기대
```

**W3C APG**: "Down Arrow: If the popup is available, moves focus into the popup — places focus on the first focusable element in the popup."

이것은 테스트 명세는 올바르나, trigger (`combo-wrapper`)와 listbox (`combo-listbox`)가 **별도 FocusGroup**이라 ArrowDown이 교차하지 않음. 이것은 구현 아키텍처 문제.

---

## 4. 요약 매트릭스

| 구분 | 패턴 | roleRegistry | 테스트 명세 | 구현(aria-showcase) |
|:--|:--|:--|:--|:--|
| Grid Home/End | grid | ✅ | ❌ 행→전체 혼동 | N/A (테스트 수정 필요) |
| Grid Diagonal | grid | ✅ | ⚠️ 연쇄 실패 | N/A |
| Menu Checkbox | menu | ⚠️ Enter/Space 미구분 | ❌ Enter→Space | N/A |
| Tabs Selection | tablist | ✅ | ✅ | ❌ select prop 누락 |
| Listbox selected | listbox | ✅ | ✅ | ❌ aria-selected 미반영 |
| Toolbar Toggle | toolbar | ⚠️ select 기본값 | ✅ | ❌ Enter→click 미중계 |
| Combobox Trigger | combobox | ✅ | ✅ | ❌ useState(true) |
| Combobox Nav | combobox | ✅ | ✅ | ❌ 분리 FocusGroup |
| Dialog Focus | dialog | ✅ | ✅ | ❌ restoreFocus 미작동 |
| AlertDialog | alertdialog | ✅ | ✅ | ❌ restoreFocus 미작동 |

---

## 5. 즉시 수정 가능한 항목

### A. 테스트 코드 수정 (명세 오류 → 코드 변경)

1. **GridTest.tsx**: Home → 행의 첫 번째 셀, End → 행의 마지막 셀, Ctrl+Home/End 추가
2. **MenuTest.tsx**: `t.press("Enter")` → `t.press("Space")` (menuitemcheckbox 토글)

### B. Showcase 구현 수정

3. **index.tsx Combobox**: `useState(true)` → `useState(false)` 

### C. Role Registry 수정

4. **toolbar**: `select: { mode: "none" }` 명시적 추가
