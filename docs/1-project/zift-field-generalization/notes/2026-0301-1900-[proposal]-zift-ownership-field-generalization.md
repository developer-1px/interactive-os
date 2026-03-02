# ZIFT 소유권 정렬 — Field 일반화 + computeItem 분해

| 항목 | 내용 |
|------|------|
| **원문** | ZIFT 이상 아키텍처 제안서: computeItem 분해 + Field 일반화 + createField API |
| **내(AI)가 추정한 의도** | **경위**: APG 에이전트 POC에서 Switch를 Zone+Item으로 잘못 구현. Discussion에서 "Switch는 Field" 발견 → ARIA 53개 MECE 검증 → ZIFT 소유권 불일치 발견. **표면**: computeItem이 Field·Trigger 속성까지 소유하는 구조를 분해하고, Field를 boolean/number까지 일반화하는 설계 제안. **의도**: ZIFT 4분류가 코드 아키텍처에도 1:1로 반영되게 하여, OS의 이론과 구현을 일치시킨다. |
| **날짜** | 2026-03-01 |
| **선행 문서** | `docs/0-inbox/2026-0301-1830-[research]-aria-zift-mece-mapping.md` |

---

## 1. 개요

### 문제

ZIFT 이론: **Zone이 영역을, Item이 데이터를, Field가 값을, Trigger가 액션을 소유한다.**

현실: **Item(computeItem)이 거의 모든 것을 소유한다.**

```
computeItem이 현재 투영하는 ARIA 속성:
├── Item의 것 (맞음):  aria-selected, aria-disabled, aria-current
├── Field의 것 (위반): aria-checked, aria-valuenow/min/max
└── Trigger의 것 (위반): aria-expanded, aria-controls
```

키보드 해석도 동일한 문제:

```
resolveItemKey가 현재 처리하는 키:
├── Item의 것 (맞음):  radio Space → OS_SELECT
├── Field의 것 (위반): switch Space/Enter → OS_CHECK
│                      slider Arrow/Home/End → OS_VALUE_CHANGE
│                      checkbox Space → OS_CHECK
└── Trigger의 것 (논쟁): button Space → OS_ACTIVATE
                         treeitem Arrow → OS_EXPAND
```

### Before → After

| 측면 | Before | After |
|------|--------|-------|
| **ARIA 투영** | computeItem 1개가 전부 | computeItem(Item) + computeField(Field) + computeTrigger(Trigger) |
| **키보드 해석** | resolveItemKey가 Field 키도 처리 | resolveFieldKey가 toggle/slider 키 소유 |
| **FieldRegistry** | string only (text) | string \| boolean \| number |
| **Zone config** | check axis + value axis (Field의 것이 Zone에) | Field config로 이동 |
| **defineApp API** | createZone + createTrigger | + **createField** |
| **Switch 앱 코드** | `onAction: (cursor) => OS_CHECK(...)` | `bind({ role: "switch" })` 또는 `createField({ role: "switch" })` |

---

## 2. 현재 상태 (코드 기반 분석)

### 2.1 computeItem — 비대한 단일 함수

`src/os/headless/compute.ts:58-152`

```typescript
// computeItem이 투영하는 속성들:

// ── Item의 것 (정당) ──
attrs.id = itemId;
attrs.role = childRole;
attrs.tabIndex = isFocused ? 0 : -1;
attrs["aria-selected"] = isSelected;        // Item 상태
attrs["aria-disabled"] = true;              // Item 상태
attrs["aria-current"] = "true";             // Item 상태

// ── Field의 것 (여기 있으면 안 됨) ──
attrs["aria-checked"] = isSelected;         // boolean value → Field
attrs["aria-valuenow"] = currentValue;      // number value → Field
attrs["aria-valuemin"] = valueConfig.min;   // number constraint → Field
attrs["aria-valuemax"] = valueConfig.max;   // number constraint → Field

// ── Trigger의 것 (여기 있으면 안 됨) ──
attrs["aria-expanded"] = isExpanded;        // action result → Trigger
attrs["aria-controls"] = `panel-${itemId}`; // action target → Trigger
```

### 2.2 resolveItemKey — Field 키를 Item이 처리

`src/os/keymaps/resolveItemKey.ts:122-130`

```typescript
const ITEM_RESOLVERS: Record<string, ItemKeyResolver> = {
  treeitem: resolveTreeItem,    // Trigger (expand/collapse)
  checkbox: resolveCheckbox,    // ← Field (boolean toggle)
  switch:   resolveSwitch,      // ← Field (boolean toggle)
  radio:    resolveRadio,       // Item (selection)
  menuitemradio: resolveRadio,  // Item (selection)
  button:   resolveButton,      // Trigger (activate)
  slider:   resolveSlider,      // ← Field (number adjust)
};
```

**Field의 키가 Item 레이어에 3개** (checkbox, switch, slider).

### 2.3 resolveFieldKey — text only

`src/os/keymaps/resolveFieldKey.ts:60-65`

```typescript
const FIELD_KEYMAPS: Record<FieldType, FieldKeymap> = {
  inline: INLINE_KEYMAP,   // Enter → commit, Escape → cancel
  tokens: TOKENS_KEYMAP,
  block:  BLOCK_KEYMAP,
  editor: EDITOR_KEYMAP,
  // boolean? → 없음
  // number?  → 없음
};
```

### 2.4 FieldRegistry — string only

`src/os/registries/fieldRegistry.ts:15-31`

```typescript
export type FieldType = "inline" | "tokens" | "block" | "editor";
// → boolean, number 없음

export interface FieldState {
  value: string;  // → string only. boolean | number 없음
}
```

### 2.5 Zone config — Field의 관심사가 Zone에

`src/os/registries/roleRegistry.ts` (switch preset):

```typescript
switch: {
  check: { mode: "check" },     // ← 이건 Field의 관심사
  activate: { mode: "manual", onClick: true },
  // ...
}
```

`src/os/schemas/` (value config):

```typescript
value: { mode: "continuous", min: 0, max: 100, step: 1, largeStep: 10 }
// ← 이것도 Field의 관심사
```

### 2.6 defineApp API — createField 부재

```typescript
interface AppHandle<S> {
  createZone(name: string): ZoneHandle<S>;           // Z ✅
  createTrigger(command: BaseCommand): React.FC;      // T ✅
  createTrigger(config: CompoundTriggerConfig): ...;  // T ✅
  // createField? → 없음                              // F ❌
}
```

---

## 3. 제안: ZIFT 소유권 정렬

### 3.1 원칙

**각 ZIFT 레이어는 자기 ARIA 속성만 소유한다.**

| ZIFT | 소유하는 ARIA 속성 | 소유하는 키 | 소유하는 상태 |
|------|-------------------|-----------|-------------|
| **Zone** | `aria-orientation`, `aria-multiselectable`, `aria-activedescendant` | navigation (Arrow, Home, End), Tab | `focusedItemId`, `selection[]` (Item 선택용) |
| **Item** | `aria-selected`, `aria-disabled`, `aria-current`, `aria-label`, `aria-level` | — (Item 고유 키 없음) | identity, position, disabled |
| **Field** | `aria-checked`, `aria-pressed`, `aria-valuenow/min/max`, `aria-invalid`, `aria-required` | toggle (Space/Enter), adjust (Arrow for slider), commit/cancel | `value: string \| boolean \| number` |
| **Trigger** | `aria-expanded`, `aria-haspopup`, `aria-controls` | activate (Space for button) | — (stateless, dispatch only) |

### 3.2 FieldType 일반화

```typescript
// Before
type FieldType = "inline" | "tokens" | "block" | "editor";

// After
type FieldType =
  | "inline" | "tokens" | "block" | "editor"  // string (기존)
  | "boolean"                                   // switch, checkbox, toggle button
  | "number";                                   // slider, spinbutton
```

각 FieldType의 키 소유권:

| FieldType | 값 유형 | 소유하는 키 | commit 방식 |
|-----------|---------|-----------|------------|
| `inline` | string | Enter → commit, Escape → cancel | explicit (Enter) |
| `tokens` | string | Enter → commit, Escape → cancel | explicit (Enter) |
| `block` | string | Escape → cancel (Enter = newline) | explicit (Escape+blur) |
| `editor` | string | Escape → cancel (Enter/Tab = content) | explicit (Escape+blur) |
| **`boolean`** | boolean | **Space/Enter → toggle** | **instant** (toggle = commit) |
| **`number`** | number | **Arrow → adjust, Home/End → min/max** | **instant** (adjust = commit) |

### 3.3 computeItem 분해

```typescript
// compute.ts — 분해 후

export function computeItem(kernel, itemId, zoneId, overrides): ItemResult {
  // Item의 것만 남긴다
  return {
    attrs: {
      id, role, tabIndex,
      "data-focus-item": true,
      "data-item-id": itemId,
      "data-focused": isActiveFocused || undefined,
      "data-anchor": isAnchor || undefined,
      "aria-selected": isSelected,        // Item 소유
      "aria-disabled": isDisabled,        // Item 소유
      "aria-current": isActiveFocused,    // Item 소유
    },
    state: { isFocused, isActiveFocused, isAnchor, isSelected },
  };
}

export function computeField(kernel, itemId, zoneId): FieldAttrs {
  // Field의 것만
  const fieldType = resolveFieldType(zoneId, itemId);

  if (fieldType === "boolean") {
    return { "aria-checked": isChecked };
  }
  if (fieldType === "number") {
    return { "aria-valuenow": value, "aria-valuemin": min, "aria-valuemax": max };
  }
  return {}; // text Field는 DOM input이 직접 관리
}

export function computeTrigger(kernel, itemId, zoneId): TriggerAttrs {
  // Trigger의 것만
  if (expandable) {
    return { "aria-expanded": isExpanded, "aria-controls": `panel-${itemId}` };
  }
  return {};
}
```

### 3.4 resolveFieldKey 확장

```typescript
// resolveFieldKey.ts — 확장 후

const BOOLEAN_KEYMAP: FieldKeymap = {
  Space: () => OS_CHECK({ targetId: activeItemId }),
  Enter: () => OS_CHECK({ targetId: activeItemId }),
};

const NUMBER_KEYMAP: FieldKeymap = {
  ArrowRight: () => OS_VALUE_CHANGE({ action: "increment" }),
  ArrowUp:    () => OS_VALUE_CHANGE({ action: "increment" }),
  ArrowLeft:  () => OS_VALUE_CHANGE({ action: "decrement" }),
  ArrowDown:  () => OS_VALUE_CHANGE({ action: "decrement" }),
  Home:       () => OS_VALUE_CHANGE({ action: "setMin" }),
  End:        () => OS_VALUE_CHANGE({ action: "setMax" }),
  PageUp:     () => OS_VALUE_CHANGE({ action: "incrementLarge" }),
  PageDown:   () => OS_VALUE_CHANGE({ action: "decrementLarge" }),
};

const FIELD_KEYMAPS: Record<FieldType, FieldKeymap> = {
  inline:  INLINE_KEYMAP,
  tokens:  TOKENS_KEYMAP,
  block:   BLOCK_KEYMAP,
  editor:  EDITOR_KEYMAP,
  boolean: BOOLEAN_KEYMAP,   // NEW
  number:  NUMBER_KEYMAP,    // NEW
};
```

**이 변경으로 resolveItemKey에서 switch/checkbox/slider가 제거된다.**

### 3.5 defineApp.createField

```typescript
// 이상적 API

// 독립 boolean Field (Zone 밖)
const DarkMode = App.createField({ role: "switch" });
// <DarkMode id="dark-mode">Dark Mode</DarkMode>
// → role="switch", aria-checked="false", Space/Enter/Click 토글

// Zone 안의 boolean Field (그룹)
const UI = settingsZone.bind({ role: "group" });
// <UI.Zone>
//   <UI.Field type="boolean" id="dark-mode">Dark Mode</UI.Field>
// </UI.Zone>
// → Zone이 navigation 제공, Field가 toggle 소유

// 독립 number Field
const Volume = App.createField({ role: "slider", min: 0, max: 100 });
// <Volume id="volume">Volume</Volume>
// → role="slider", aria-valuenow, Arrow 조정
```

### 3.6 결과: Switch의 Pit of Success

```typescript
// Before (workaround — OS_CHECK import + onAction callback)
const SwitchUI = switchZone.bind({
  role: "switch",
  onAction: (cursor) => OS_CHECK({ targetId: cursor.focusId }),
});

// After (Pit of Success — Accordion과 동일한 수준)
const DarkMode = App.createField({ role: "switch" });
// 끝. import 0개, callback 0개.
```

---

## 4. 영향 범위

### 4.1 변경 대상 파일

| 파일 | 변경 | 크기 |
|------|------|------|
| `src/os/headless/compute.ts` | computeItem 분해 → computeItem + computeField + computeTrigger | L |
| `src/os/keymaps/resolveFieldKey.ts` | boolean/number keymap 추가 | M |
| `src/os/keymaps/resolveItemKey.ts` | switch/checkbox/slider resolver 제거 | S |
| `src/os/registries/fieldRegistry.ts` | FieldType 확장, FieldState.value 일반화 | M |
| `src/os/6-components/6-project/Item.tsx` | computeField + computeTrigger attrs 병합 | M |
| `src/os/defineApp.ts` | createField 구현 | M |
| `src/os/defineApp.types.ts` | createField 타입 | S |
| `src/os/defineApp.bind.ts` | BoundComponents에 Field type prop 추가 | S |
| `src/os/keymaps/resolveKeyboard.ts` | Field 판별 로직 확장 (boolean/number 인식) | M |
| Role presets | check/value axis → Field config으로 이동 | M |

### 4.2 하위 호환

| 기존 패턴 | 영향 |
|-----------|------|
| Accordion (expand) | 변경 없음 — computeTrigger가 aria-expanded 투영 |
| Listbox (select) | 변경 없음 — computeItem이 aria-selected 투영 |
| Tree (expand + navigate) | 변경 없음 — treeitem expand는 Trigger |
| **Switch (check)** | **개선** — onAction workaround 제거 가능 |
| **Slider (value)** | **개선** — resolveFieldKey로 이동 |
| **Checkbox (check)** | **개선** — resolveFieldKey로 이동 |
| Text Field (inline/block) | 변경 없음 — 기존 FieldType 유지 |
| Dialog (overlay) | 변경 없음 |

### 4.3 Responder Chain 변경

```
// Before
Field (text only)  →  Item (toggle + expand + activate)  →  Zone  →  Global

// After
Field (text + boolean + number)  →  Item (radio select)  →  Zone  →  Global
                                    Trigger (expand, activate)
```

**주의**: treeitem의 expand/collapse와 button의 activate가 Item layer에 남는지, Trigger로 이동하는지는 별도 판단 필요. 이 제안에서는 **Field 키 이동만** 다루고, Trigger 분리는 후속으로 남긴다.

---

## 5. Cynefin 도메인 판정

**🟡 Complicated** — 방향은 명확하다 (ZIFT 소유권 정렬). 하지만 구현 순서, 하위 호환, 테스트 전략에 분석이 필요하다. computeItem 분해는 OS 핵심 경로를 건드리므로 regression 위험이 크다. Probe가 아닌 Analyze로 접근 가능.

---

## 6. 인식 한계

- computeItem 분해 시 **성능 영향**을 분석하지 않았다. 현재 단일 함수 호출이 3개로 나뉘면 오버헤드가 생길 수 있다 (매 렌더 Item마다 호출).
- **Zone config에서 Field config으로의 마이그레이션 경로**가 구체화되지 않았다. check.mode와 value.mode를 어떻게 Field 쪽으로 옮기는지 상세 설계 필요.
- **Trigger 분리** (aria-expanded 등)는 이 제안의 범위 밖이다. Item vs Trigger 경계는 별도 논의가 필요.
- **createField의 상태 관리** — 독립 Field(Zone 밖)가 checked state를 어디에 저장하는지 미정. 현재 checked는 Zone의 `selection[]`에 의존하므로, Zone 없이 checked를 관리하는 새 메커니즘이 필요할 수 있다.

---

## 7. 열린 질문

1. **Trigger 분리 범위**: `aria-expanded`와 `aria-controls`도 computeItem에서 분리할 것인가? 아니면 Field만 먼저 분리하고 Trigger는 후속인가?

2. **독립 Field의 상태**: `createField({ role: "switch" })`의 checked 상태를 어디에 저장하는가? 옵션:
   - (a) FieldRegistry에 boolean state 추가
   - (b) 암묵적 Zone을 내부에 생성 (현재 Trigger가 overlay용으로 하는 것처럼)
   - (c) kernel state에 새 슬롯 (os.fields)

3. **Zone config 마이그레이션**: `check.mode`와 `value.mode`를 Zone에서 제거하면 기존 role preset이 깨진다. 점진적 마이그레이션 전략은?

---

> **ZIFT 이론(Z=영역, I=데이터, F=prop, T=액션)과 OS 구현이 불일치한다. computeItem이 Field(aria-checked, aria-valuenow)과 Trigger(aria-expanded) 속성까지 소유하고, resolveItemKey가 Field 키(switch toggle, slider adjust)를 처리한다.**
> **제안: computeItem 분해(Item/Field/Trigger), resolveFieldKey 확장(boolean/number), FieldType 일반화, createField API 추가.**
> **Switch가 `createField({ role: "switch" })` 한 줄로 동작하는 것이 목표. 현재 onAction workaround + OS_CHECK import가 사라진다.**
