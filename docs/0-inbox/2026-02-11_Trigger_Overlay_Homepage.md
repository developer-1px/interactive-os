# Trigger — Declarative Overlay Primitive

> **어떤 overlay든 하나의 패턴으로.** Dialog, Menu, Tooltip, Popover — 전부 `Trigger`로 시작합니다.

---

## Overview

`Trigger`는 사용자 상호작용으로 열리는 모든 overlay를 **하나의 선언적 패턴**으로 표현합니다.

- **`role`** 하나로 overlay 종류를 결정
- **`Trigger.Portal`** 로 overlay content를 co-locate
- **`Trigger.Dismiss`** 로 닫기를 선언
- **`useState` 없음, `useEffect` 없음, `onClick` 없음**

```tsx
import { Trigger, Zone, Item } from "@anthropic-os/primitives";

<Trigger role="dialog">
  <button>Open Settings</button>
  <Trigger.Portal title="Settings">
    <Zone role="dialog">
      <Item id="theme">Theme</Item>
      <Item id="lang">Language</Item>
      <Trigger.Dismiss onPress={Save()}>Save</Trigger.Dismiss>
      <Trigger.Dismiss>Cancel</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

열기, 닫기, backdrop, focus trap, ESC, focus 복원 — **전부 OS가 처리합니다.**  
앱 코드에 로직은 **0줄**입니다.

---

## Installation

```bash
npm install @anthropic-os/primitives
```

---

## Anatomy

모든 overlay는 3개의 부품으로 구성됩니다:

```tsx
<Trigger role="...">         {/* 1. 열기 — role이 방식을 결정 */}
  <button>Trigger</button>
  <Trigger.Portal>            {/* 2. 내용물 — overlay에 렌더링 */}
    <Zone role="...">
      <Trigger.Dismiss />     {/* 3. 닫기 — 가장 가까운 overlay를 닫음 */}
    </Zone>
  </Trigger.Portal>
</Trigger>
```

| Part | 역할 |
|:---|:---|
| `Trigger` | overlay를 여는 트리거. `role`이 방식(click, hover, contextmenu)을 결정 |
| `Trigger.Portal` | overlay content 영역. OS가 top-layer에 렌더링 |
| `Trigger.Dismiss` | overlay를 닫는 버튼. 가장 가까운 부모 overlay를 닫음 |

---

## API Reference

### Trigger

| Prop | Type | Description |
|:---|:---|:---|
| `role` | `"dialog" \| "alertdialog" \| "menu" \| "contextmenu" \| "tooltip" \| "popover" \| "hovercard" \| "select"` | overlay 종류. 트리거 이벤트, 위치, backdrop 여부를 결정 |
| `id` | `string` | 선택. overlay 식별자 (원격 제어 시 사용) |
| `children` | `ReactNode` | 트리거 요소 + `Trigger.Portal` |

### Trigger.Portal

| Prop | Type | Description |
|:---|:---|:---|
| `title` | `string` | `aria-labelledby` 자동 연결 |
| `description` | `string` | `aria-describedby` 자동 연결 |
| `children` | `ReactNode` | overlay content. 보통 `Zone` + `Item` 조합 |

### Trigger.Dismiss

| Prop | Type | Description |
|:---|:---|:---|
| `onPress` | `Command` | 선택. 닫기 전에 실행할 command |
| `children` | `ReactNode` | 버튼 레이블 |

---

## Role Presets

`role` 하나로 overlay의 모든 동작이 결정됩니다:

| Role | 트리거 | 위치 | Backdrop | Focus | 닫힘 |
|:---|:---|:---|:---|:---|:---|
| `dialog` | click | 화면 중앙 | ✅ | trap + autoFocus | ESC · Dismiss · backdrop |
| `alertdialog` | click | 화면 중앙 | ✅ | trap + autoFocus | Dismiss만 (ESC ❌) |
| `menu` | click | 앵커 하단 | ❌ | trap | Item 선택 · ESC |
| `contextmenu` | 우클릭 / ⇧F10 | 커서 위치 | ❌ | trap | Item 선택 · ESC |
| `select` | click | 앵커 하단 | ❌ | trap | Item 선택 · ESC |
| `popover` | click | 앵커 상대 | ❌ | trap | ESC · Dismiss |
| `tooltip` | hover + delay | 앵커 상대 | ❌ | none | hover out |
| `hovercard` | hover + delay | 앵커 상대 | ❌ | none | hover out |

---

## Examples

### Dialog

가장 기본적인 Modal dialog.

```tsx
<Trigger role="dialog">
  <button>Delete File</button>
  <Trigger.Portal title="삭제 확인" description="되돌릴 수 없습니다.">
    <Zone role="dialog">
      <p>정말 삭제하시겠습니까?</p>
      <Trigger.Dismiss onPress={DeleteFile()}>삭제</Trigger.Dismiss>
      <Trigger.Dismiss>취소</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- ESC → 자동 닫힘
- Backdrop 클릭 → 자동 닫힘
- 열릴 때 첫 번째 Item에 autoFocus
- 닫힐 때 트리거 버튼으로 focus 복원

### Dropdown Menu

```tsx
<Trigger role="menu">
  <button>⋯</button>
  <Trigger.Portal>
    <Zone role="menu">
      <Item id="edit" onAction={Edit()}>✏️ Edit</Item>
      <Item id="dup" onAction={Duplicate()}>📋 Duplicate</Item>
      <hr />
      <Item id="del" onAction={Delete()}>🗑️ Delete</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- Item 선택 시 자동 닫힘 (menu preset)
- `Trigger.Dismiss` 불필요

### Context Menu

```tsx
<Trigger role="contextmenu">
  <div className="canvas">
    Right-click anywhere
  </div>
  <Trigger.Portal>
    <Zone role="menu">
      <Item id="cut" onAction={Cut()}>Cut</Item>
      <Item id="copy" onAction={Copy()}>Copy</Item>
      <Item id="paste" onAction={Paste()}>Paste</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- 우클릭 또는 ⇧F10으로 열림
- 커서 위치에 표시

### Nested Menu (Submenu)

```tsx
<Trigger role="menu">
  <button>File</button>
  <Trigger.Portal>
    <Zone role="menu">
      <Item id="new" onAction={NewFile()}>New</Item>
      <Item id="open" onAction={OpenFile()}>Open</Item>
      <Trigger role="menu">
        <Item id="share">Share ▸</Item>
        <Trigger.Portal>
          <Zone role="menu">
            <Item id="email" onAction={ShareEmail()}>Email</Item>
            <Item id="link" onAction={ShareLink()}>Link</Item>
          </Zone>
        </Trigger.Portal>
      </Trigger>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- 같은 패턴의 재귀적 중첩 — 새 컴포넌트 불필요

### Select

```tsx
<Trigger role="select">
  <button>{selected ?? "Choose a fruit..."}</button>
  <Trigger.Portal>
    <Zone role="listbox" onSelect={SetFruit()}>
      <Item id="apple">🍎 Apple</Item>
      <Item id="banana">🍌 Banana</Item>
      <Item id="cherry">🍒 Cherry</Item>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- Item 선택 시 `onSelect` command dispatch + 자동 닫힘

### Tooltip

```tsx
<Trigger role="tooltip">
  <button aria-label="Help">?</button>
  <Trigger.Portal>
    키보드 단축키: ⌘+S로 저장
  </Trigger.Portal>
</Trigger>
```

- hover + 300ms delay 후 표시
- Zone 없음, Dismiss 없음 — 가장 단순한 형태

### Popover

```tsx
<Trigger role="popover">
  <button>🎨 Color</button>
  <Trigger.Portal>
    <Zone role="dialog">
      <Field name="hex" value={color} mode="immediate" onChange={SetColor()} />
      <Zone role="radiogroup" onSelect={SetPreset()}>
        <Item id="red">🔴</Item>
        <Item id="blue">🔵</Item>
        <Item id="green">🟢</Item>
      </Zone>
      <Trigger.Dismiss>Done</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- 앵커(버튼) 상대 위치에 표시
- backdrop 없음, ESC로 닫힘

### Hover Card

```tsx
<Trigger role="hovercard">
  <a href="/user/john">@john</a>
  <Trigger.Portal>
    <div className="user-card">
      <img src={avatar} alt="John" />
      <h4>John Doe</h4>
      <p>Senior Developer · Seoul</p>
    </div>
  </Trigger.Portal>
</Trigger>
```

- hover 시 표시, hover out 시 자동 닫힘
- 포커스 관리 없음

### Nested Dialogs

```tsx
<Trigger role="dialog">
  <button>Settings</button>
  <Trigger.Portal title="Settings">
    <Zone role="dialog">
      <Item id="account">Account</Item>
      <Item id="privacy">Privacy</Item>

      {/* 중첩 dialog */}
      <Trigger role="alertdialog">
        <Item id="reset">⚠️ Reset All</Item>
        <Trigger.Portal title="경고" description="모든 설정이 초기화됩니다.">
          <Zone role="alertdialog">
            <Trigger.Dismiss onPress={ResetAll()}>초기화</Trigger.Dismiss>
            <Trigger.Dismiss>취소</Trigger.Dismiss>
          </Zone>
        </Trigger.Portal>
      </Trigger>

      <Trigger.Dismiss>Close</Trigger.Dismiss>
    </Zone>
  </Trigger.Portal>
</Trigger>
```

- focus stack 자동 관리 — 내부 dialog 닫히면 외부 dialog로 focus 복원
- Kernel이 `overlays.stack`으로 중첩 순서 추적

### Menubar (Application Menu)

```tsx
<Zone role="menubar">
  <Trigger role="menu" id="file">
    <button>File</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="new" onAction={NewFile()}>New ⌘N</Item>
        <Item id="open" onAction={OpenFile()}>Open ⌘O</Item>
        <Item id="save" onAction={SaveFile()}>Save ⌘S</Item>
      </Zone>
    </Trigger.Portal>
  </Trigger>
  <Trigger role="menu" id="edit">
    <button>Edit</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="undo" onAction={Undo()}>Undo ⌘Z</Item>
        <Item id="redo" onAction={Redo()}>Redo ⇧⌘Z</Item>
      </Zone>
    </Trigger.Portal>
  </Trigger>
  <Trigger role="menu" id="view">
    <button>View</button>
    <Trigger.Portal>
      <Zone role="menu">
        <Item id="zoom-in" onAction={ZoomIn()}>Zoom In</Item>
        <Item id="zoom-out" onAction={ZoomOut()}>Zoom Out</Item>
      </Zone>
    </Trigger.Portal>
  </Trigger>
</Zone>
```

- `Zone role="menubar"` → 가로 키보드 탐색
- 각 `Trigger role="menu"` → 세로 dropdown

---

## Comparison with Radix

### Component Count

```
Radix:  25 packages × 4~6 sub-components = 100+ components
ZIFT:   Trigger + Trigger.Portal + Trigger.Dismiss = 3 parts
        + Zone (already exists) + Item (already exists)
```

### Code Comparison — Dialog

```diff
- <Dialog.Root>
-   <Dialog.Trigger>Open</Dialog.Trigger>
-   <Dialog.Portal>
-     <Dialog.Overlay />
-     <Dialog.Content>
-       <Dialog.Title>Settings</Dialog.Title>
-       <Dialog.Description>Configure</Dialog.Description>
-       <Dialog.Close>×</Dialog.Close>
-     </Dialog.Content>
-   </Dialog.Portal>
- </Dialog.Root>

+ <Trigger role="dialog">
+   <button>Open</button>
+   <Trigger.Portal title="Settings" description="Configure">
+     <Zone role="dialog">
+       <Trigger.Dismiss>×</Trigger.Dismiss>
+     </Zone>
+   </Trigger.Portal>
+ </Trigger>
```

### Switching Types

Radix에서 Dialog를 Menu로 바꾸려면 **패키지 교체 + 전체 리팩터링**.

ZIFT에서는 **role 한 단어 변경**:

```diff
- <Trigger role="dialog">
+ <Trigger role="menu">
```

---

## Design Philosophy

### Passive Primitive

Trigger, Portal, Dismiss는 **구조만 선언**합니다. 어떤 상태도 관리하지 않습니다.

```
앱이 하는 것:  구조 선언 (JSX)
OS가 하는 것:  상태, lifecycle, 포커스, 렌더링 — 전부
```

### Role-Driven

overlay의 종류는 **`role` 한 단어**로 결정됩니다. 이 role은 W3C WAI-ARIA 명세에 정의되어 있어, 별도 학습 없이 접근성까지 자동으로 보장됩니다.

### Co-location

Trigger와 overlay content는 **같은 곳에 선언**됩니다. "이 버튼을 누르면 뭐가 열리지?"를 추적할 필요가 없습니다.

```
❌ Trigger는 위에, Modal은 아래에 — 수백 줄 떨어져 있음
✅ Trigger 안에 Portal — 바로 옆에 있음
```

---

## Toast (Command-Overlay)

Toast는 사용자 Trigger가 아닌 **시스템 이벤트**로 발생하므로, Trigger 패턴 대신 **OS Command**를 사용합니다:

```tsx
// 어디서든 dispatch
dispatch(OS_TOAST({
  title: "저장 완료",
  description: "모든 변경사항이 저장되었습니다.",
  duration: 3000,
}));
```

- Kernel이 toast stack 관리
- 타이머 자동 처리
- 위치, 애니메이션은 OS 설정
