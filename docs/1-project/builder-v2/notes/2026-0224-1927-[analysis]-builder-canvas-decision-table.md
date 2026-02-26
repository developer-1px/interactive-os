# Builder Canvas 결정 테이블 — 조건 분기 실증

| 항목 | 내용 |
|------|------|
| **원문** | 빌더 문제를 한번 살펴볼까? 캔버스의 방향키와 엔터 ESC \ 라는 입력만 가지고 표를 하나 만들어봐 |
| **내(AI)가 추정한 의도** | Todo 표에서 빠져 있던 "condition 열"의 조합 폭발 문제를, 실제 복잡한 앱(빌더)에서 실증하여 표의 한계와 해법을 동시에 발견하고 싶다 |
| **날짜** | 2026-02-24 |
| **상태** | 🔴 Analysis |

---

## 1. 개요

빌더 캔버스는 **3단계 계층**(section→group→item)과 **편집 모드**를 가진 grid Zone이다.
4개의 입력(`ArrowUp/Down/Left/Right`, `Enter`, `Escape`, `\`)만으로도 **조건에 따른 분기가 폭발**한다.

### 조건 축 (Condition Axes)

| 축 | 값 | 설명 |
|----|-----|------|
| **level** | `section` / `group` / `item` | 현재 포커스된 아이템의 계층 |
| **isEditing** | `true` / `false` | Field 편집 중인지 |
| **hasChildren** | `true` / `false` | 현재 아이템이 자식을 가지는지 |
| **position** | `first` / `middle` / `last` | 같은 레벨에서의 위치 (경계 케이스) |
| **selection** | `[]` / `[ids...]` | 선택된 항목이 있는지 |

- **이론적 조합**: `3 × 2 × 2 × 3 × 2 = 72가지`
- 그 중 의미 있는 조합만 추출하면 → **결정 테이블**

---

## 2. 결정 테이블 — 입력 × 조건 → 결과

### 범례

- **level**: S=section, G=group, I=item
- **결과**: 커맨드 + 상태 변화를 한 줄로 압축
- 🔴 = 경계 케이스 (무시하기 쉬운 행)

---

### 2.1 `Enter` — DrillDown / Field Commit

| # | level | isEditing | hasChildren | 결과 (커맨드 → 상태 변화) |
|---|-------|-----------|-------------|--------------------------|
| E1 | S | ❌ | ✅ children 있음 | `OS_ACTIVATE` → `drillDown` → 첫 번째 group(child)에 포커스. `focusedItemId: "ge-card-1"`, itemFilter가 group으로 전환 |
| E2 | S | ❌ | ❌ children 없음 | `OS_ACTIVATE` → `drillDown` → 첫 번째 item에 포커스(group 건너뜀). `focusedItemId: "ge-hero-service-name"` |
| E3 | G | ❌ | ✅ | `OS_ACTIVATE` → `drillDown` → 첫 번째 item에 포커스. `focusedItemId: "ge-card-1-card-title"` |
| E4 | G | ❌ | ❌ | `OS_ACTIVATE` → `drillDown` → item 없으면 no-op |
| E5 | I | ❌ | — | `OS_ACTIVATE` → `drillDown` → `OS_FIELD_START_EDIT`. `editingItemId: "ge-card-1-card-title"` |
| E6 | S/G/I | ✅ | — | `OS_FIELD_COMMIT` → `updateField(...)`. `editingItemId: null`, 필드 값 갱신 |
| 🔴 E7 | S | ❌ | ✅ 하위에 group 없이 item만 | `drillDown` → childLevel=group, 없으면 grandchildLevel=item 시도. 첫 번째 item에 직접 포커스 |

**조건 분기 3개**: `isEditing` → Field layer, `level` → drillDown 깊이, `hasChildren` → 건너뛰기

---

### 2.2 `Escape` — DrillUp / Field Cancel / Deselect

| # | level | isEditing | selection | 결과 (커맨드 → 상태 변화) |
|---|-------|-----------|-----------|--------------------------|
| X1 | S/G/I | ✅ | — | `OS_FIELD_CANCEL`. `editingItemId: null`, 텍스트 원복 |
| X2 | I | ❌ | `[]` | `drillUp` → 부모 group에 포커스. `focusedItemId: "ge-card-1"`, itemFilter→group |
| X3 | I | ❌ | `[ids]` | ⚠️ **경합 지점**: `dismiss.escape: "none"` 설정이지만 keybinding에 `drillUp` 등록. keybinding이 이김 → drillUp 실행 |
| X4 | G | ❌ | `[]` | `drillUp` → 부모 section에 포커스. `focusedItemId: "ge-features"`, itemFilter→section |
| X5 | G | ❌ | `[ids]` | X3과 동일 구조: drillUp 실행 |
| X6 | S | ❌ | `[]` | `drillUp` → level=section → `OS_ESCAPE({ force: true })` → 강제 deselect |
| X7 | S | ❌ | `[ids]` | X6과 동일: drillUp인데 section이면 OS_ESCAPE(force) → deselect |
| 🔴 X8 | I | ❌ | `[]`, group 부모 없음 | `drillUp` → parentLevel=group, 못 찾음 → section으로 fallback. `focusedItemId: "ge-hero"` |

**조건 분기 4개**: `isEditing` → Field layer 우선, `level` → drillUp 대상, `selection` → deselect vs drillUp 경합, `hasGroupParent` → fallback 경로

---

### 2.3 `\` (백슬래시) — DrillUp (Escape의 네비게이션 전용 축)

| # | level | isEditing | 결과 |
|---|-------|-----------|------|
| B1 | I | ❌ | `drillUp` → 부모 group/section에 포커스 (X2와 동일) |
| B2 | G | ❌ | `drillUp` → 부모 section에 포커스 (X4와 동일) |
| B3 | S | ❌ | `drillUp` → `OS_ESCAPE({ force: true })` → deselect (X6과 동일) |
| B4 | * | ✅ | ⚠️ `\`는 `when: undefined` (universal) → isEditing=true일 때도 활성. **Field가 `\`를 소유하면** Field가 이김. **소유 안 하면** drillUp 실행 |
| 🔴 B5 | * | ✅ (contenteditable) | `\`를 타이핑 → `fieldKeyOwnership`이 `\`를 "Field 소유"로 판정 → keybinding 무시 → 텍스트에 `\` 입력됨 |

**`\` vs `Escape`의 차이**: Escape는 Field layer에서 `OS_FIELD_CANCEL`로 해석됨. `\`는 Field가 소유하면 텍스트 입력, 안 하면 drillUp. **같은 의도(drillUp)인데 조건에 따라 다른 경로를 탐.**

---

### 2.4 `ArrowDown` — 같은 레벨 내 이동

| # | level | isEditing | isFieldActive | position | orient. | 결과 |
|---|-------|-----------|---------------|----------|---------|------|
| AD1 | S | ❌ | — | middle | corner | `OS_NAVIGATE({dir:"next"})` → 다음 section. itemFilter가 section만 보여주므로 같은 레벨 내 이동 |
| AD2 | S | ❌ | — | last | corner | `OS_NAVIGATE` → 마지막이면 no-op (grid: loop=false) |
| AD3 | G | ❌ | — | middle | corner | `OS_NAVIGATE` → 다음 group (같은 부모 section 내). itemFilter가 group 레벨만 필터 |
| AD4 | G | ❌ | — | last | corner | no-op |
| AD5 | I | ❌ | — | middle | corner | `OS_NAVIGATE` → 다음 item (같은 부모 group/section 내) |
| AD6 | I | ❌ | — | last | corner | no-op |
| AD7 | * | ✅ | ✅ (Field 소유) | — | — | **Field가 키를 소유** → OS에 안 옴. 커서가 필드 내에서 아래로 이동 (textarea) 또는 no-op (single-line) |
| AD8 | * | ✅ | ❌ (Field 해제) | — | — | Field가 키를 해제 → `OS_NAVIGATE` 실행. **편집 중이지만 다음 아이템으로 이동** (draft/search 패턴) |
| 🔴 AD9 | S | ❌ | — | middle | corner | `orientation: "corner"` → ArrowDown이 아래 방향 이동. DOM_RECTS 기반 공간 탐색으로 "아래에 있는" section 찾기 |

**조건 분기 4개**: `level` → itemFilter, `isEditing` → Field layer, `isFieldActive` → Field가 키를 소유/해제, `position` → 경계 처리

---

### 2.5 `ArrowUp` — 같은 레벨 내 역방향 이동

| # | level | isEditing | isFieldActive | position | 결과 |
|---|-------|-----------|---------------|----------|------|
| AU1 | S | ❌ | — | middle | `OS_NAVIGATE({dir:"prev"})` → 이전 section |
| AU2 | S | ❌ | — | first | no-op (loop=false) |
| AU3 | G | ❌ | — | middle/first | 이전 group / no-op |
| AU4 | I | ❌ | — | middle/first | 이전 item / no-op |
| AU5 | * | ✅ | ✅ | — | Field 소유 → 필드 내 커서 이동 |
| AU6 | * | ✅ | ❌ | — | Field 해제 → OS_NAVIGATE |

---

### 2.6 `ArrowLeft` / `ArrowRight` — 수평 이동 (grid: orientation=corner)

| # | level | isEditing | isFieldActive | 결과 |
|---|-------|-----------|---------------|------|
| AL1 | * | ❌ | — | `OS_NAVIGATE` → `orientation: "corner"` 이므로 DOM_RECTS 기반 좌측 요소 탐색 |
| AR1 | * | ❌ | — | `OS_NAVIGATE` → 우측 요소 탐색 |
| AL2 | * | ✅ | ✅ | Field 소유 → 텍스트 내 커서 좌이동 |
| AR2 | * | ✅ | ✅ | Field 소유 → 텍스트 내 커서 우이동 |
| AL3 | * | ✅ | ❌ | Field 해제 → OS_NAVIGATE |
| AR3 | * | ✅ | ❌ | Field 해제 → OS_NAVIGATE |

---

## 3. 조건 분기 요약 — 왜 복잡한가

### 같은 입력, 다른 결과 — 총 분기 수

| 입력 | 분기 수 | 핵심 분기 조건 |
|------|--------|---------------|
| `Enter` | **7** | isEditing, level, hasChildren, hasGroup |
| `Escape` | **8** | isEditing, level, selection, hasGroupParent |
| `\` | **5** | isEditing, level, fieldKeyOwnership |
| `ArrowDown` | **9** | isEditing, isFieldActive, level, position, orientation |
| `ArrowUp` | **6** | (ArrowDown과 대칭) |
| `ArrowLeft` | **3** | isEditing, isFieldActive |
| `ArrowRight` | **3** | (ArrowLeft과 대칭) |
| **합계** | **41** | |

### 조건 축 × 레이어 매핑

| 조건 | OS 레이어 | 누가 결정하는가 |
|------|----------|---------------|
| `isEditing` | 4-state (ZoneState.editingItemId) | OS — Field가 활성인가 |
| `isFieldActive` | keymaps/fieldKeyOwnership | OS — 이 키를 Field가 소유하는가 |
| `level` | 6-components (data-level attr) | App — 빌더가 아이템에 부여 |
| `hasChildren` | App state (Block.children) | App — 블록 데이터 |
| `position` | 2-contexts (DOM_ITEMS + itemFilter) | OS — 필터된 아이템 목록에서의 위치 |
| `selection` | 4-state (ZoneState.selection) | OS — 선택 상태 |

**핵심 발견: 조건 중 절반은 OS가, 절반은 App이 결정한다.** 이 때문에 테스트가 어렵다 — OS 조건만으로는 불충분하고, App 레벨의 계층 구조까지 이해해야 한다.

---

## 4. 경합 지점 (Contention Points) 🔴

표를 만들면서 발견된 **설계적으로 모호한 지점**:

| # | 지점 | 설명 | 현재 동작 | 의문 |
|---|------|------|----------|------|
| CP1 | `Escape` + selection | `dismiss.escape: "none"`으로 설정했지만, keybinding에 등록된 `drillUp`이 Escape를 잡음 | drillUp 실행 | selection이 있을 때 deselect 먼저? drillUp 먼저? |
| CP2 | `\` + editing | `\`는 universal keybinding이지만, editing 중이면 Field가 소유할 수도 | fieldKeyOwnership 판정에 의존 | contenteditable에서 `\`를 타이핑하려면 정말 Field가 소유하는지 확인 필요 |
| CP3 | `Enter` at section without group | section → drillDown → group이 없으면 item으로 건너뜀 | grandchild fallback | 건너뛰기가 맞는지, 아니면 section 자체의 field로 가야 하는지 |
| CP4 | `ArrowDown` at item level, grid corner | itemFilter가 item만 보여주는데, corner navigation은 DOM_RECTS 기반 | 같은 section 내의 item만 탐색? 다른 section의 item도? | itemFilter 범위가 부모 section에 한정되는지 전역인지 |

---

## 5. Cynefin 도메인 판정

🔴 **Complex** — 같은 입력이 4~9개 갈래로 분기하고, 조건의 절반이 App 레이어에서 온다. 표를 만들면서 경합 지점(CP1~CP4)이 발견되었으며, 이들은 코드를 봐도 답이 자명하지 않다.

## 6. 인식 한계

- `orientation: "corner"`의 정확한 공간 탐색 알고리즘은 이 분석에서 확인하지 못했다 (DOM_RECTS 기반)
- `itemFilter`의 실제 범위 — 같은 부모 section 내인지, 전체 캔버스인지 — 런타임 확인 필요
- editing 중 `\` 키의 fieldKeyOwnership 판정은 실제 Field 타입(contenteditable vs input)에 의존하며, 이 조합은 확인 필요

## 7. 열린 질문

1. **CP1**: `Escape`에서 `selection > 0`일 때 deselect가 먼저인가, drillUp이 먼저인가?
2. **CP3**: children 없는 section에서 Enter → 바로 item? 아니면 section 자체의 필드?
3. **CP4**: itemFilter가 level 기반이면, 다른 section에 있는 같은 level item도 ArrowDown으로 이동 가능한가?
4. **조건 폭발 관리**: 41개 분기를 전수 열거하는 게 현실적인가, 아니면 경합 지점(CP)만 집중하는 게 효율적인가?

---

> **한줄요약**: 빌더 캔버스에서 입력 4종(↑↓←→ Enter Esc \)만으로 조건 분기 41개가 생기고, 그 중 경합 지점 4개가 발견됨 — condition 열이 없는 표는 이 복잡성을 담을 수 없으며, 결정 테이블(decision table) 형식이 필수다.
