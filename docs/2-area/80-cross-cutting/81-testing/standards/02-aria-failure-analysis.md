# ARIA Showcase TestBot 실패 분석 보고서

> **작성일**: 2026-02-08  
> **테스트 결과**: 51 suites — **37 passed ✅ / 14 failed ❌**

---

## 1. 개요

`/aria-showcase` 페이지에서 TestBot을 실행하여 14개의 실패를 발견했습니다. 실패 원인을 **5가지 루트 카테고리**로 분류했습니다.

---

## 2. 실패 분류

### 카테고리 A: `onActivate` 미구현 — Enter/Click이 상태를 토글하지 않음

| Suite | 실패 Step | 에러 | 원인 |
|:--|:--|:--|:--|
| Menu: Checkbox Toggle | #3 | `aria-checked="true"`, got `"false"` | Enter → `onClick` 미호출 |
| Toolbar: Toggle Buttons | #4 | `aria-pressed="false"`, got `"true"` | Enter 미반응 |
| Toolbar: Click Toggle | #2 | `aria-pressed="true"`, got `"false"` | 순수 click에서 상태 안 바뀜 |
| Toolbar: Multiple Toggles | #3 | `aria-pressed="true"`, got `"false"` | 연쇄 Enter → 상태 불일치 |

**분석**: 컴포넌트는 `onClick` 핸들러로 토글 로직을 구현하고 있지만, `FocusItem`이 keyboard Enter/Space를 `onClick`으로 중계하는지 확인 필요. TestBot의 `press("Enter")`는 `KeyboardEvent`만 dispatch하고 `click` 이벤트는 발생시키지 않음 → **button의 implicit `click` dispatch가 작동하지 않을 가능성**.

> [!TIP]
> `<button>` 요소는 네이티브로 Enter → click을 발생시키지만, `FocusItem`이 `as="button"`으로 렌더링할 때 이벤트 전파가 올바른지 확인 필요.

---

### 카테고리 B: Tabs — `aria-selected`가 포커스를 따라가지 않음

| Suite | 실패 Step | 에러 |
|:--|:--|:--|
| Tabs: Horizontal Navigation | #6 | `aria-selected="true"`, got `"false"` |

**분석**: 테스트는 W3C APG "Automatic Activation" 패턴을 기대합니다 — ArrowRight로 포커스가 이동하면 해당 탭이 자동 선택되어야 함. 그러나 현재 구현은 `onClick`만으로 `selectedTab` 상태를 변경합니다:

```tsx
// index.tsx:80 — 클릭만 탭 선택을 변경
onClick={() => setSelectedTab("tab-account")}
```

`navigate`가 focus만 이동하고 `onClick`을 트리거하지 않으므로, ArrowKey 이동 시 `aria-selected`가 갱신되지 않음. W3C APG에 따르면 Tabs는 **automatic activation**(포커스 이동 = 선택) 또는 **manual activation**(Enter/Space = 선택) 중 하나를 선택해야 함.

> [!IMPORTANT]
> **해결책**: `select={{ mode: "single", followFocus: true }}`를 FocusGroup에 추가하거나, `onFocusChange` 콜백에서 `setSelectedTab`을 호출.

---

### 카테고리 C: Listbox — `aria-selected="false"` 대신 `null` 반환

| Suite | 실패 Step | 에러 |
|:--|:--|:--|
| Listbox: Click Selection | #7 | `aria-selected="false"`, got `"null"` |
| Listbox: Selection Follows Focus | #5 | `aria-selected="false"`, got `"null"` |
| Listbox: Home/End Navigation | #6 | `aria-selected="true"`, got `"null"` |

**분석**: `FocusItem`에 `aria-selected` props가 명시적으로 전달되지 않음. FocusGroup의 `select={{ mode: "single", followFocus: true }}` 설정이 있지만, 이 상태가 DOM `aria-selected` 속성으로 반영되는지 확인 필요.

```tsx
// index.tsx:244-256 — FocusItem에 aria-selected 명시적 바인딩 없음
<FocusItem id={`user-${i}`} role="option" ...>
  {name}
</FocusItem>
```

W3C APG Listbox: `role="option"` 요소에는 **반드시** `aria-selected`가 명시적으로 `"true"` 또는 `"false"`로 설정되어야 함. 현재 Focus Pipeline의 select 시스템이 DOM attribute를 자동 설정하는지, 또는 사용자가 수동으로 바인딩해야 하는지 확인 필요.

> [!IMPORTANT]
> **핵심 의문**: FocusGroup `select` 옵션이 자식 FocusItem에 `aria-selected`를 자동으로 렌더링하는가? 아니면 사용자 코드에서 바인딩이 필요한가?

---

### 카테고리 D: Dialog/AlertDialog — 포커스 복원 실패

| Suite | 실패 Step | 에러 |
|:--|:--|:--|
| Dialog: Escape to Close | #3 | `#btn-dialog-trigger` focused, got `BODY` |
| AlertDialog: Cancel Action | #3 | `#btn-alert-trigger` focused, got `BODY` |

**분석**: W3C APG Dialog 패턴은 닫힐 때 trigger 요소로 포커스를 복원해야 함. 현재 구현에서는 React 상태를 false로 변경하여 Dialog를 unmount하지만, **unmount 시점에서 포커스 복원 로직이 실행되지 않는 것으로 보임**.

```tsx
// Escape → setIsDialogOpen(false) → React unmount → DOM 제거 → 포커스 = BODY
```

이는 두 가지 문제 중 하나:
1. Focus Pipeline이 Dialog unmount 시 focus stack에서 이전 포커스를 pop하지 않음
2. React가 DOM을 제거한 후 `document.activeElement`가 `body`로 fallback

> [!CAUTION]
> 포커스 복원은 DOM 제거 **이전에** 발생해야 하므로, `useEffect cleanup` 또는 `beforeunmount` 시점에서 처리해야 합니다.

---

### 카테고리 E: Grid Home/End — 전체 그리드 범위가 아닌 행 범위로 이동

| Suite | 실패 Step | 에러 |
|:--|:--|:--|
| Grid: Home/End Navigation | #8 | `#grid-cell-1` focused, got `#grid-cell-3` |
| Grid: Diagonal Navigation | #14 | `#grid-cell-12` focused, got `#grid-cell-11` |

**분석**: W3C APG Grid 패턴은 `Home`/`End` 키에 대해 두 가지 행동을 정의합니다:
- **Home**: 현재 행의 첫 번째 셀 (행 내 이동)
- **Ctrl+Home**: 그리드의 첫 번째 셀 (전체 이동)

테스트는 `Home` = 전체 첫 번째 셀(`#cell-0`)로 이동을 기대하지만, 현재 NAVIGATE 커맨드가 Home을 전체 리스트의 첫 번째 아이템으로 처리하고 있어, Grid에서는 **행 단위 Home/End가 아닌 전체 Home/End**로 동작할 가능성.

실패 메시지(`got #grid-cell-3`)를 보면, cell-5에서 Home 시 cell-3(아마 아래 행?)이 아닌 cell-0로 가야 하는데 cell-3으로 갔음 → Grid의 `orientation: "both"` 일 때 Home/End의 의미가 모호한 상태.

> [!NOTE]
> Grid: Diagonal Navigation 실패(`#grid-cell-12 expected, got #grid-cell-11`)는 12개 cell 그리드(0-11)에서 `#cell-12`가 존재하지 않음 — **테스트 자체의 오류 가능성**.

---

### 카테고리 F: Combobox — 별도 FocusGroup 간 이동 불가

| Suite | 실패 Step | 에러 |
|:--|:--|:--|
| Combobox: Trigger Focus | #3 | `aria-expanded="true"`, got `"false"` |
| Combobox: Listbox Navigation | #3 | `#combo-opt-0` focused, got `#combo-trigger` |

**분석**: Combobox의 trigger와 listbox가 **별도의 FocusGroup**으로 되어 있음:

```tsx
<FocusGroup id="combo-wrapper">
  <FocusItem id="combo-trigger" ... /> {/* trigger 클릭 → isComboOpen 토글 */}
</FocusGroup>

{isComboOpen && (
  <FocusGroup id="combo-listbox" ...>  {/* 별도 FocusGroup */}
    <FocusItem id="combo-opt-0" ... />
  </FocusGroup>
)}
```

1. **Trigger Focus 실패**: TestBot `click` → `onClick` → `setIsComboOpen(!true)` = false로 닫아버림 (이미 `useState(true)`로 열려 있기 때문)
2. **Listbox Navigation 실패**: ArrowDown이 `combo-wrapper` FocusGroup 내에서만 동작하므로 `combo-listbox`로 넘어가지 않음

> [!TIP]
> Combobox는 W3C APG에서 특수 패턴 — trigger와 listbox가 하나의 인터랙션 단위여야 함. 단일 FocusGroup으로 통합하거나, `seamless` 네비게이션으로 연결 필요.

---

## 3. 우선순위 제안

| 우선순위 | 카테고리 | 영향도 | 수정 범위 |
|:--|:--|:--|:--|
| 🔴 P0 | C: Listbox `aria-selected` | 3개 Suite | FocusItem 또는 Select 파이프라인 |
| 🔴 P0 | A: `onActivate` | 4개 Suite | FocusItem Enter→click 중계 확인 |
| 🟡 P1 | D: Dialog 포커스 복원 | 2개 Suite | Focus Stack / unmount 로직 |
| 🟡 P1 | B: Tabs auto-activation | 1개 Suite | FocusGroup select prop 또는 콜백 |
| 🟢 P2 | E: Grid Home/End | 2개 Suite | NAVIGATE grid 분기 + 테스트 수정 |
| 🟢 P2 | F: Combobox 구조 | 2개 Suite | FocusGroup 통합 또는 seamless |

---

## 4. 결론

14개 실패 중 **테스트 코드 오류**(Grid Diagonal #cell-12)와 **초기 상태 충돌**(Combobox `useState(true)`)이 일부 포함되어 있고, 나머지는 **FocusGroup/FocusItem 파이프라인의 기능 갭**입니다. 가장 큰 영향을 미치는 것은 **Listbox `aria-selected` 자동 관리**와 **Enter→onClick 중계** 문제입니다.
