# ZIFT Overlay 설계 — Radix Primitives 완전 커버리지 비교

> **Date**: 2026-02-11  
> **Topic**: Trigger.Portal + Trigger.Dismiss 구조로 Radix 컴포넌트를 MECE하게 커버할 수 있는가?

---

## 1. 핵심 구조 요약

### ZIFT Overlay API

```tsx
<Trigger role="[overlay-type]">
  <트리거_요소 />
  <Trigger.Portal>
    <Zone role="[focus-behavior]">
      <Item id="...">...</Item>
      <Trigger.Dismiss>Close</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

| 구성 요소 | 역할 |
|:---|:---|
| `Trigger role="..."` | **어떻게** 열리는가 (click, hover, contextmenu) |
| `Trigger.Portal` | **무엇이** 열리는가 (overlay content, co-located) |
| `Zone role="..."` | **내부 포커스**를 어떻게 관리하는가 |
| `Trigger.Dismiss` | **닫기** (가장 가까운 부모 overlay) |

### 설계 원칙

- **Passive Primitive**: 앱은 선언만, 관리는 OS
- **ONE Prescribed Way**: `Trigger.Portal`(열기) + `Trigger.Dismiss`(닫기) — 커맨드 이름 불필요
- **Facade/Core**: 앱 개발자는 Facade, 고급 사용은 `OS_DISMISS("id")` Core 커맨드

---

## 2. MECE 분류 — Radix 전체 컴포넌트

### 카테고리 A: Trigger-Overlay (Trigger.Portal로 커버)

ZIFT의 `Trigger role + Trigger.Portal`로 표현 가능한 컴포넌트.

### 카테고리 B: Non-Overlay (기존 ZIFT Zone/Item으로 커버)

Overlay가 아닌 일반 UI 컴포넌트.

### 카테고리 C: Command-Overlay (dispatch로 커버)

사용자 Trigger 없이 시스템이 발생시키는 overlay.

### 카테고리 D: Layout/Utility (ZIFT 범위 밖)

포커스/상호작용과 무관한 순수 레이아웃 컴포넌트.

| # | Radix 컴포넌트 | 카테고리 | ZIFT 대응 |
|:---|:---|:---|:---|
| 1 | Dialog | A | `Trigger role="dialog"` |
| 2 | AlertDialog | A | `Trigger role="alertdialog"` |
| 3 | Dropdown Menu | A | `Trigger role="menu"` |
| 4 | Context Menu | A | `Trigger role="contextmenu"` |
| 5 | Tooltip | A | `Trigger role="tooltip"` |
| 6 | Popover | A | `Trigger role="popover"` |
| 7 | Hover Card | A | `Trigger role="hovercard"` |
| 8 | Select | A | `Trigger role="select"` |
| 9 | Navigation Menu | A | `Trigger role="menu"` (variant) |
| 10 | Menubar | A+B | `Zone role="menubar"` + `Trigger role="menu"` |
| 11 | Combobox | A+B | `Field` + `Trigger role="listbox"` |
| 12 | Toast | C | `dispatch(OS_TOAST({...}))` |
| 13 | Accordion | B | `Zone role="tree"` 변형 |
| 14 | Collapsible | B | `Trigger` + Zone 조건부 |
| 15 | Tabs | B | `Zone role="tablist"` |
| 16 | Radio Group | B | `Zone role="radiogroup"` |
| 17 | Toggle / Toggle Group | B | `Trigger` / `Zone role="toolbar"` |
| 18 | Switch | B | `Trigger` (toggle) |
| 19 | Checkbox | B | `Trigger` (toggle) |
| 20 | Slider | B | `Zone` (range) |
| 21 | Scroll Area | D | ZIFT 밖 |
| 22 | Separator | D | ZIFT 밖 |
| 23 | Aspect Ratio | D | ZIFT 밖 |
| 24 | Avatar | D | ZIFT 밖 |
| 25 | Progress | D | ZIFT 밖 |

**커버리지 요약**:
- **A (Trigger-Overlay)**: 11개 → `Trigger.Portal` 패턴
- **B (Non-Overlay)**: 8개 → 기존 `Zone/Item/Trigger`
- **C (Command-Overlay)**: 1개 → `dispatch(OS_TOAST)`
- **D (ZIFT 밖)**: 5개 → 순수 CSS/레이아웃

---

## 3. 카테고리 A — Trigger-Overlay 코드 예시

### 3.1 Dialog (Modal)

````
Radix:
```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Description>Configure your app</Dialog.Description>
      <Dialog.Close>Cancel</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

ZIFT:
```tsx
<Trigger role="dialog">
  <button>Open</button>
  <Trigger.Portal title="Settings" description="Configure your app">
    <Zone role="dialog">
      <Item id="theme">Theme</Item>
      <Item id="lang">Language</Item>
      <Trigger.Dismiss onPress={Save()}>Save</Trigger.Dismiss>
      <Trigger.Dismiss>Cancel</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Radix: 6개 컴포넌트 (Root, Trigger, Portal, Overlay, Content, Close)
- ZIFT: 기존 프리미티브 재사용 (Trigger, Zone, Item) + 서브 컴포넌트 2개

---

### 3.2 AlertDialog

````
Radix:
```tsx
<AlertDialog.Root>
  <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>삭제 확인</AlertDialog.Title>
      <AlertDialog.Description>되돌릴 수 없습니다.</AlertDialog.Description>
      <AlertDialog.Cancel>취소</AlertDialog.Cancel>
      <AlertDialog.Action>삭제</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

ZIFT:
```tsx
<Trigger role="alertdialog">
  <button>Delete</button>
  <Trigger.Portal title="삭제 확인" description="되돌릴 수 없습니다.">
    <Zone role="alertdialog">
      <Trigger.Dismiss>취소</Trigger.Dismiss>
      <Trigger.Dismiss onPress={Delete()}>삭제</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- `alertdialog`는 ESC로 닫을 수 없음 (Zone preset에서 처리)
- Radix의 Cancel vs Action 구분 → ZIFT는 `Trigger.Dismiss` + `onPress` 유무로 구분

---

### 3.3 Dropdown Menu

````
Radix:
```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger>⋯</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Edit</DropdownMenu.Item>
      <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Delete</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

ZIFT:
```tsx
<Trigger role="menu">
  <button>⋯</button>
  <Trigger.Portal>
    <Zone role="menu">
      <Item id="edit" onAction={Edit()}>Edit</Item>
      <Item id="dup" onAction={Duplicate()}>Duplicate</Item>
      <hr />
      <Item id="del" onAction={Delete()}>Delete</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Menu Item 클릭 시 자동 닫힘 = Zone `role="menu"` preset
- `Trigger.Dismiss` 불필요 — menu는 Item 선택 시 자동 dismiss

---

### 3.4 Context Menu

````
Radix:
```tsx
<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div>Right-click me</div>
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Item>Cut</ContextMenu.Item>
      <ContextMenu.Item>Copy</ContextMenu.Item>
      <ContextMenu.Item>Paste</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

ZIFT:
```tsx
<Trigger role="contextmenu">
  <div>Right-click me</div>
  <Trigger.Portal>
    <Zone role="menu">
      <Item id="cut" onAction={Cut()}>Cut</Item>
      <Item id="copy" onAction={Copy()}>Copy</Item>
      <Item id="paste" onAction={Paste()}>Paste</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Trigger `role="contextmenu"` → 우클릭 / ⇧F10으로 열림
- 내부 Zone은 `role="menu"` (dropdown과 동일한 포커스 동작)
- Radix는 별도 패키지 (`@radix-ui/react-context-menu`), ZIFT는 role만 변경

---

### 3.5 Tooltip

````
Radix:
```tsx
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <button>?</button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content>
        <Tooltip.Arrow />
        도움말 텍스트
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

ZIFT:
```tsx
<Trigger role="tooltip">
  <button>?</button>
  <Trigger.Portal>
    도움말 텍스트
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Tooltip은 포커스 관리 불필요 → `Zone` 없음, `Trigger.Dismiss` 없음
- `Trigger.Portal` 안에 텍스트만 — 가장 단순한 형태
- Radix: 5개 컴포넌트 (Provider, Root, Trigger, Portal, Content) → ZIFT: 2개

---

### 3.6 Popover

````
Radix:
```tsx
<Popover.Root>
  <Popover.Trigger>Settings</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content>
      <Popover.Close>×</Popover.Close>
      <label>Width</label>
      <input type="number" />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

ZIFT:
```tsx
<Trigger role="popover">
  <button>Settings</button>
  <Trigger.Portal>
    <Zone role="dialog">
      <Field name="width" value={width} mode="immediate" onChange={SetWidth()} />
      <Trigger.Dismiss>×</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Popover = Dialog와 거의 동일, 차이는 위치(앵커 상대) + backdrop 없음
- `role="popover"` → 앵커 상대 위치, backdrop 없음 (Trigger role preset)
- 내부는 `Zone role="dialog"` (포커스 trap)

---

### 3.7 Hover Card

````
Radix:
```tsx
<HoverCard.Root>
  <HoverCard.Trigger>
    <a href="/user/john">@john</a>
  </HoverCard.Trigger>
  <HoverCard.Portal>
    <HoverCard.Content>
      <img src={avatar} />
      <p>John Doe — Developer</p>
    </HoverCard.Content>
  </HoverCard.Portal>
</HoverCard.Root>
```

ZIFT:
```tsx
<Trigger role="hovercard">
  <a href="/user/john">@john</a>
  <Trigger.Portal>
    <img src={avatar} />
    <p>John Doe — Developer</p>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Hover Card = Tooltip의 리치 버전 (hover로 열림, 포커스 없음)
- Zone 없음, Dismiss 없음 — hover out 시 자동 닫힘
- Radix: 4개 컴포넌트 → ZIFT: 2개

---

### 3.8 Select

````
Radix:
```tsx
<Select.Root>
  <Select.Trigger>
    <Select.Value placeholder="Select..." />
    <Select.Icon />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Viewport>
        <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
        <Select.Item value="banana"><Select.ItemText>Banana</Select.ItemText></Select.Item>
        <Select.Item value="cherry"><Select.ItemText>Cherry</Select.ItemText></Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

ZIFT:
```tsx
<Trigger role="select">
  <button>{selected ?? "Select..."}</button>
  <Trigger.Portal>
    <Zone role="listbox" onSelect={SelectFruit()}>
      <Item id="apple">Apple</Item>
      <Item id="banana">Banana</Item>
      <Item id="cherry">Cherry</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```
````

**차이점**:
- Radix: 8개 컴포넌트 (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item, ItemText)
- ZIFT: 기존 프리미티브 3개 (Trigger, Zone, Item)
- Zone `role="listbox"` → Item 선택 시 자동 닫힘 + `onSelect` command dispatch

---

### 3.9 Combobox (Autocomplete)

````
Radix (없음, Downshift/Ariakit 참조):
```tsx
<Combobox>
  <ComboboxInput onChange={setQuery} />
  <ComboboxPopover>
    <ComboboxList>
      <ComboboxOption value="Apple" />
      <ComboboxOption value="Banana" />
    </ComboboxList>
  </ComboboxPopover>
</Combobox>
```

ZIFT:
```tsx
<Zone role="combobox">
  <Field
    name="search"
    value={query}
    mode="immediate"
    onChange={SearchFruit()}
    target="virtual"
    controls="fruit-list"
  />
  <Trigger.Portal>
    <Zone id="fruit-list" role="listbox" onSelect={SelectFruit()}>
      <Item id="apple">Apple</Item>
      <Item id="banana">Banana</Item>
    </Zone>
  </Trigger.Portal>
</Zone>
```
````

**차이점**:
- Field `target="virtual"` → 가상 포커스 (aria-activedescendant)
- Field `controls="fruit-list"` → 연결된 listbox
- dropdown은 Field 입력 시 자동 열림 (Trigger 명시 불필요)
- 이건 `Trigger role`이 아닌 **Field가 Portal을 여는** 변형 패턴

> [!WARNING]
> Combobox는 Trigger 기반이 아님. Field 입력이 dropdown을 여는 구조. 
> `Trigger.Portal`이 아닌 **Zone level Portal** 또는 별도 메커니즘이 필요할 수 있음.

---

### 3.10 Navigation Menu

````
Radix:
```tsx
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/product-a">Product A</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <NavigationMenu.Viewport />
</NavigationMenu.Root>
```

ZIFT:
```tsx
<Zone role="menubar">
  <Trigger role="menu" id="products">
    <button>Products</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="prod-a"><a href="/product-a">Product A</a></Item>
        <Item id="prod-b"><a href="/product-b">Product B</a></Item>
      </Zone>
    </Trigger.Portal>
  </Trigger>
  <Trigger role="menu" id="about">
    <button>About</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="team"><a href="/team">Team</a></Item>
      </Zone>
    </Trigger.Portal>
  </Trigger>
</Zone>
```
````

**차이점**:
- `Zone role="menubar"` → 가로 탐색 + 각 Trigger가 submenu를 소유
- Radix: 전용 패키지 `@radix-ui/react-navigation-menu`
- ZIFT: `Zone role="menubar"` + `Trigger role="menu"` 조합 — 새 컴포넌트 없음

---

### 3.11 Menubar

````
Radix:
```tsx
<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Portal>
      <Menubar.Content>
        <Menubar.Item>New</Menubar.Item>
        <Menubar.Item>Open</Menubar.Item>
        <Menubar.Sub>
          <Menubar.SubTrigger>Share</Menubar.SubTrigger>
          <Menubar.SubContent>
            <Menubar.Item>Email</Menubar.Item>
          </Menubar.SubContent>
        </Menubar.Sub>
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
</Menubar.Root>
```

ZIFT:
```tsx
<Zone role="menubar">
  <Trigger role="menu" id="file">
    <button>File</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="new" onAction={NewFile()}>New</Item>
        <Item id="open" onAction={OpenFile()}>Open</Item>
        <Trigger role="menu" id="share">
          <Item id="share-trigger">Share ▸</Item>
          <Trigger.Portal>
            <Zone role="menu">
              <Item id="email" onAction={ShareEmail()}>Email</Item>
            </Zone>
          </Trigger.Portal>
        </Trigger>
      </Zone>
    </Trigger.Portal>
  </Trigger>
</Zone>
```
````

**차이점**:
- Submenu = `Trigger role="menu"` 중첩 — 재귀적. 동일 패턴 반복.
- Radix: Sub, SubTrigger, SubContent 전용 컴포넌트 필요
- ZIFT: 그냥 `Trigger role="menu"`를 중첩

---

## 4. 카테고리 B — Non-Overlay (기존 ZIFT)

이 컴포넌트들은 Overlay가 아니므로 `Trigger.Portal` 없이 기존 ZIFT로 표현.

### 4.1 Tabs

````
```tsx
// Radix
<Tabs.Root defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>

// ZIFT
<Zone role="tablist" onSelect={SwitchTab()}>
  <Item id="tab1">Tab 1</Item>
  <Item id="tab2">Tab 2</Item>
</Zone>
{activeTab === "tab1" && <div>Content 1</div>}
{activeTab === "tab2" && <div>Content 2</div>}
```
````

### 4.2 Accordion

````
```tsx
// ZIFT — tree variant
<Zone role="tree">
  <Item id="section1" role="treeitem">
    Section 1
    <Zone role="group">
      <div>Accordion content 1</div>
    </Zone>
  </Item>
  <Item id="section2" role="treeitem">
    Section 2
    <Zone role="group">
      <div>Accordion content 2</div>
    </Zone>
  </Item>
</Zone>
```
````

### 4.3 Radio Group / Toggle Group / Toolbar

````
```tsx
// Radio Group
<Zone role="radiogroup" onSelect={SetSize()}>
  <Item id="sm">Small</Item>
  <Item id="md">Medium</Item>
  <Item id="lg">Large</Item>
</Zone>

// Toggle Group (Toolbar variant)
<Zone role="toolbar">
  <Trigger id="bold" onPress={Bold()}>B</Trigger>
  <Trigger id="italic" onPress={Italic()}>I</Trigger>
  <Trigger id="underline" onPress={Underline()}>U</Trigger>
</Zone>
```
````

### 4.4 Switch / Checkbox

````
```tsx
// Switch
<Trigger onPress={ToggleDarkMode()}>
  <label>Dark Mode: {isDark ? "ON" : "OFF"}</label>
</Trigger>

// Checkbox (within list)
<Zone role="listbox" select={{ mode: "multiple" }}>
  <Item id="apple">🍎 Apple</Item>
  <Item id="banana">🍌 Banana</Item>
  <Item id="cherry">🍒 Cherry</Item>
</Zone>
```
````

---

## 5. 카테고리 C — Command-Overlay

### Toast

````
```tsx
// Radix
<Toast.Provider>
  <Toast.Root>
    <Toast.Title>Saved</Toast.Title>
    <Toast.Description>Changes saved.</Toast.Description>
    <Toast.Close>×</Toast.Close>
  </Toast.Root>
  <Toast.Viewport />
</Toast.Provider>

// ZIFT — OS Command
dispatch(OS_TOAST({
  title: "Saved",
  description: "Changes saved.",
  duration: 3000,
}));
// Kernel이 toast stack 관리 + 자동 렌더링 + 타이머 처리
```
````

**Toast는 Trigger-Overlay가 아닌 Command-Overlay** — content가 serializable data.

---

## 6. 커버리지 매트릭스

| Radix 컴포넌트 | ZIFT 패턴 | 필요 프리미티브 | 새 요소 |
|:---|:---|:---|:---|
| Dialog | `Trigger role="dialog"` + `Trigger.Portal` | Z, I, T | Portal, Dismiss |
| AlertDialog | `Trigger role="alertdialog"` + `Trigger.Portal` | Z, I, T | Portal, Dismiss |
| Dropdown Menu | `Trigger role="menu"` + `Trigger.Portal` | Z, I, T | Portal |
| Context Menu | `Trigger role="contextmenu"` + `Trigger.Portal` | Z, I, T | Portal |
| Tooltip | `Trigger role="tooltip"` + `Trigger.Portal` | T | Portal |
| Popover | `Trigger role="popover"` + `Trigger.Portal` | Z, I, F, T | Portal, Dismiss |
| Hover Card | `Trigger role="hovercard"` + `Trigger.Portal` | T | Portal |
| Select | `Trigger role="select"` + `Trigger.Portal` | Z, I, T | Portal |
| Navigation Menu | `Zone role="menubar"` + `Trigger role="menu"` | Z, I, T | Portal |
| Menubar | `Zone role="menubar"` + nested `Trigger role="menu"` | Z, I, T | Portal |
| Combobox | `Field` + `Trigger.Portal` | Z, I, F | ⚠️ Field→Portal |
| Toast | `dispatch(OS_TOAST)` | — | Command |
| Tabs | `Zone role="tablist"` | Z, I | — |
| Accordion | `Zone role="tree"` | Z, I | — |
| Radio Group | `Zone role="radiogroup"` | Z, I | — |
| Toggle/Toolbar | `Zone role="toolbar"` + `Trigger` | Z, T | — |
| Switch/Checkbox | `Trigger` (toggle) | T | — |

### 결론

```
┌─────────────────────────────────────────────┐
│  Radix 25개 컴포넌트                         │
│                                             │
│  ✅ ZIFT 기존 원형으로 커버:  8개 (카테고리 B) │
│  ✅ Trigger.Portal로 커버:  10개 (카테고리 A) │
│  ✅ OS Command로 커버:       1개 (Toast)      │
│  ⚠️  변형 필요:              1개 (Combobox)   │
│  ➖ ZIFT 범위 밖:            5개 (카테고리 D) │
│                                             │
│  총 커버리지: 20/20 (ZIFT 관련 범위 내)       │
│  새 프리미티브: 0개                           │
│  새 서브 컴포넌트: 2개 (Portal, Dismiss)      │
│  미결: Combobox Field→Portal 연결 방식        │
└─────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **ZIFT의 4개 원형(Zone, Item, Field, Trigger)은 유지된다.**  
> Trigger의 서브 컴포넌트 2개(`Trigger.Portal`, `Trigger.Dismiss`)만 추가하면  
> Radix가 25개 패키지로 제공하는 것을 모두 커버할 수 있다.

---

## 7. 미결 사항

### 7.1 Combobox — Field가 Portal을 여는 패턴

Combobox는 `Trigger`가 아닌 `Field` 입력이 dropdown을 엽니다.

```tsx
// 가능한 접근:
<Field name="search" mode="immediate" portal="fruit-list">
  ...
</Field>
```

또는 Zone 레벨에서 처리:

```tsx
<Zone role="combobox" portal>
  <Field ... />
  <Zone id="dropdown" role="listbox">...</Zone>
</Zone>
```

→ 별도 논의 필요.

### 7.2 Trigger role preset 정의

각 role의 정확한 동작(이벤트 바인딩, 위치, backdrop 여부 등):

| Role | 트리거 이벤트 | 위치 | Backdrop | 자동 닫힘 |
|:---|:---|:---|:---|:---|
| `dialog` | click | 화면 중앙 | ✅ | ESC / Dismiss |
| `alertdialog` | click | 화면 중앙 | ✅ | Dismiss만 (ESC ❌) |
| `menu` | click | 앵커 하단 | ❌ | Item 선택 / ESC |
| `contextmenu` | contextmenu / ⇧F10 | 커서 위치 | ❌ | Item 선택 / ESC |
| `tooltip` | hover + delay | 앵커 상대 | ❌ | hover out |
| `popover` | click | 앵커 상대 | ❌ | ESC / Dismiss |
| `hovercard` | hover + delay | 앵커 상대 | ❌ | hover out |
| `select` | click | 앵커 하단 | ❌ | Item 선택 / ESC |

→ 각 preset의 상세 동작을 specification으로 확정 필요.

---

> **Next Action**: 
> 1. Combobox Field→Portal 패턴 설계
> 2. Trigger role preset specification 확정
> 3. `Trigger.Portal` / `Trigger.Dismiss` 구현 계획 → `1-project` 승격
