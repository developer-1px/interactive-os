# APG 키보드 네비게이션 축 정리 & 우리 시스템 비교

## 1. 개요 (Overview)

APG에서 각 패턴별로 **경계 도달 시 동작**을 어떻게 서술하는지 원문 표현을 추출하고,
우리 FocusGroup 시스템의 축(axis)과 MECE하게 비교한다.

## 2. APG 원문 표현 정리

### 2-1. 경계 동작 (Boundary Behavior)

APG는 경계 동작을 명시적 속성이 아닌 **자연어 서술**로 정의한다. 반복되는 표현 패턴:

| APG 원문 표현 | 의미 | 우리 용어 |
|---|---|---|
| *"focus does not move"* | 경계에서 멈춤 | `clamp` |
| *"optionally wrapping from last to first"* | 같은 축에서 순환 | `loop` |
| *"optionally moves to the first cell in the following row"* | 다음 줄로 넘어감 | `wrap: "row"` |
| *(서술 없음 — APG에 없는 개념)* | 부모 zone으로 탈출 | `wrap: "seamless"` |

### 2-2. 패턴별 경계 동작 매트릭스

| Pattern | Role | 축 | Same-axis 경계 | Cross-axis 처리 |
|---|---|---|---|---|
| **Listbox** | `listbox` | vertical | *"focus does not move"* → **clamp** | ←→ 서술 없음 (무시) |
| **Tabs** | `tablist` | horizontal | *"moves focus to the first/last tab"* → **loop** (필수) | ↑↓ 서술 없음 (무시) |
| **Toolbar** | `toolbar` | horizontal | *"optionally wrapping"* → **loop** (선택) | ↑↓ 서술 없음 (무시) |
| **Menu** | `menu` | vertical | *"optionally wrapping"* → **loop** (선택) | ←→ → 부모 menubar로 위임 (**bubble**) |
| **Menubar** | `menubar` | horizontal | *"optionally wrapping"* → **loop** (선택) | ↓ → submenu 열기 (**drill-in**) |
| **Data Grid** | `grid` | both | *"focus does not move"* → **clamp** | N/A (both 이므로 cross-axis 없음) |
| **Layout Grid** | `grid` | both | *"optionally moves to next row"* → **wrap: "row"** | N/A (both 이므로 cross-axis 없음) |
| **Tree** | `tree` | vertical | *"focus does not move"* → **clamp** | ←→ → expand/collapse |

### 2-3. Cross-axis 동작 패턴

APG에서 cross-axis 키를 처리하는 방식은 3가지:

| Cross-axis 동작 | APG 예시 | 설명 |
|---|---|---|
| **무시 (ignore)** | listbox의 ←→, tablist의 ↑↓ | 해당 키를 소비하지 않음 |
| **부모 위임 (bubble)** | menu → menubar (←→) | 부모 컴포넌트로 포커스 이동 |
| **구조 조작 (structural)** | tree의 ←→ (expand/collapse) | 네비게이션이 아닌 구조 변경 |

> [!IMPORTANT]
> APG에서 **cross-axis bubble**을 명시적으로 정의하는 유일한 패턴은 **menu → menubar** 관계이다.
> 이것이 우리의 `seamless` 컨셉과 가장 가까운 APG 선례.

## 3. 우리 시스템과의 MECE 비교

### 3-1. 현재 구현 vs 제안 구조

| 축 | 현재 구현 | 제안 | 비고 |
|---|---|---|---|
| **방향** | `orientation: "horizontal" \| "vertical" \| "both"` | 동일 | APG `aria-orientation`과 일치 |
| **Same-axis 경계** | `loop: boolean` + `seamless: boolean` (분리) | `wrap: false \| "loop" \| "row" \| "seamless"` (통합) | 모순 조합 제거 |
| **Cross-axis** | 암시적 (orientation 불일치 → no-op → seamless 체크) | 명시적 (orientation 불일치 → 자동 bubble) | `wrap`과 독립 |
| **Tab 경계** | `tab.behavior: "trap" \| "escape" \| "flow"` | 동일 | Arrow와 독립 유지 |

### 3-2. wrap 옵션 MECE 분류

```
경계 도달 시 동작 (Same-axis boundary)
├── wrap: false          ── 멈춤 (clamp)
│                            APG: "focus does not move"
│                            예: listbox, data grid
│
├── wrap: "loop"         ── 같은 축에서 순환
│                            APG: "optionally wrapping from last to first"
│                            예: tabs, toolbar, menu
│
├── wrap: "row"          ── 다음 줄로 넘어감
│                            APG: "optionally moves to first cell in following row"
│                            예: layout grid (calendar)
│
└── wrap: "seamless"     ── 부모 zone으로 bubble
                             APG: menu→menubar 위임 패턴 (유일한 선례)
                             예: 칸반 컬럼, 빌더 섹션
```

### 3-3. Cross-axis 동작 (orientation 불일치)

```
Cross-axis 키 입력 시 (orientation이 처리 못하는 방향)
├── orientation: "both"      ── cross-axis 없음 (모든 방향 처리)
├── orientation: "vertical"  ── ←→ 자동 bubble (속성 불필요)
└── orientation: "horizontal"── ↑↓ 자동 bubble (속성 불필요)
```

> [!NOTE]
> Cross-axis bubble은 `wrap` 옵션과 독립적으로 작동한다.
> `wrap: false`여도 cross-axis 키는 부모로 올라간다 (zone이 처리할 수 없으므로).

## 4. 결론 (Conclusion)

1. **APG에 "seamless"는 없다** — 유일한 선례는 menu→menubar의 cross-axis 위임.
2. **`wrap` 통합이 타당하다** — APG도 경계 동작을 mutually exclusive하게 서술 (clamp/loop/wrap-row).
3. **Cross-axis는 자동 bubble** — APG에서도 orientation 불일치 키는 무시하거나 위임하지, 같은 축 동작을 하지 않는다.
4. **`wrap` 이름은 APG 친화적** — "wrapping"이 APG에서 일관 사용되는 경계 동작 용어.
