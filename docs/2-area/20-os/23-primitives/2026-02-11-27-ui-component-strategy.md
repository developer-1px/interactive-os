# 27종 UI 컴포넌트 전략 제안서 — Layer 1 Only vs Layer 2 도입

> **Date**: 2026-02-11  
> **Topic**: LLM의 학습 비용을 최소화하면서 27종 UI를 커버하는 방법

---

## 1. 문제 정의

Radix/MUI 스타일 Layer 2를 도입하면 LLM이 **27종 × 4~6 서브 = 100개 이상** 컴포넌트를 학습해야 한다.

```
Dialog, AlertDialog, DropdownMenu, ContextMenu, Tooltip,
Popover, HoverCard, Select, NavigationMenu, Menubar,
Combobox, Toast, Accordion, Collapsible, Tabs,
RadioGroup, ToggleGroup, Switch, Checkbox, Slider,
Toolbar, Avatar, Progress, ScrollArea, Separator,
AspectRatio, ...
```

당신의 목표: **학습을 없애고 싶다.**

---

## 2. 선택지

### Option A: Layer 2 도입 (27종 Named Components)

```tsx
// LLM이 27개 이름을 알아야 함
<Dialog>...</Dialog>
<Menu>...</Menu>
<Tooltip>...</Tooltip>
<Select>...</Select>
<Popover>...</Popover>
// ... × 27
```

| 장점 | 단점 |
|:---|:---|
| LLM이 이름을 이미 암 (MUI/Radix 선례) | 27종 × 서브컴포넌트 = 100개+ |
| 자동완성 즉시 작동 | 새 overlay 종류 추가 시 컴포넌트 작성 필요 |
| | **학습이 0이 아님 — 그냥 이미 학습된 것을 활용하는 것** |

### Option B: Layer 1 Only (6개로 전부 커버)

```tsx
// LLM이 6개만 알면 됨: Zone, Item, Field, Trigger, Trigger.Portal, Trigger.Dismiss

<Trigger role="dialog">...</Trigger>     // Dialog
<Trigger role="menu">...</Trigger>       // Menu
<Trigger role="tooltip">...</Trigger>    // Tooltip
<Trigger role="select">...</Trigger>     // Select
<Trigger role="popover">...</Trigger>    // Popover
// ... role만 바꾸면 됨
```

| 장점 | 단점 |
|:---|:---|
| **6개 학습이면 27종 전부 커버** | LLM이 "Trigger role=dialog"를 Dialog로 인식해야 함 |
| 새 종류 추가 = role 값 하나 추가 (코드 변경 아님) | CLAUDE.md에 "role=dialog = Dialog" 매핑 필요 |
| 컴포넌트 수가 극단적으로 적음 | 자동완성에 role 값 목록이 필요 |
| | 비-overlay (Tabs, Accordion)도 같은 패턴으로 통일 가능? |

### Option C: Hybrid — Layer 2는 Alias일 뿐

```tsx
// Layer 2가 존재하되, 단순 alias
const Dialog = (props) => <Trigger role="dialog" {...props} />;
Dialog.Content = Trigger.Portal;
Dialog.Close = Trigger.Dismiss;

// LLM은 둘 다 사용 가능
<Dialog>...</Dialog>              // ← 아는 이름
<Trigger role="dialog">...</Trigger>  // ← 같은 것
```

| 장점 | 단점 |
|:---|:---|
| LLM이 아는 이름 사용 가능 | alias를 유지/관리해야 함 |
| Layer 1만 알아도 됨 (순서적 학습) | "두 가지 방법"이 존재 → 혼란 가능 |
| alias는 1줄짜리라 구현 비용 0 | |

---

## 3. 수량 비교

### 27종을 ZIFT Layer 1로 분류하면

**Overlay (Trigger role 기반)** — 10종

| UI | ZIFT Layer 1 |
|:---|:---|
| Dialog | `Trigger role="dialog"` + `Trigger.Portal` + Zone |
| AlertDialog | `Trigger role="alertdialog"` + `Trigger.Portal` + Zone |
| Dropdown Menu | `Trigger role="menu"` + `Trigger.Portal` + Zone |
| Context Menu | `Trigger role="contextmenu"` + `Trigger.Portal` + Zone |
| Tooltip | `Trigger role="tooltip"` + `Trigger.Portal` |
| Popover | `Trigger role="popover"` + `Trigger.Portal` + Zone |
| Hover Card | `Trigger role="hovercard"` + `Trigger.Portal` |
| Select | `Trigger role="select"` + `Trigger.Portal` + Zone |
| Nav Menu | `Zone role="menubar"` + `Trigger role="menu"` (조합) |
| Menubar | `Zone role="menubar"` + `Trigger role="menu"` (조합) |

→ `Trigger role="..."` 8종의 role 값으로 커버

**Non-Overlay (Zone/Item/Trigger 기반)** — 8종

| UI | ZIFT Layer 1 |
|:---|:---|
| Tabs | `Zone role="tablist"` + Item |
| Accordion | `Zone role="tree"` + Item |
| Radio Group | `Zone role="radiogroup"` + Item |
| Toggle Group | `Zone role="toolbar"` + Trigger |
| Toolbar | `Zone role="toolbar"` + Trigger |
| Switch | `Trigger` (toggle) |
| Checkbox | `Trigger` (toggle) |
| Slider | `Zone` (range) - 향후 |

→ `Zone role="..."` 4종 + Trigger

**Command-Overlay** — 1종

| UI | ZIFT Layer 1 |
|:---|:---|
| Toast | `dispatch(OS_TOAST)` |

**ZIFT 밖** — 5종

| UI | 비고 |
|:---|:---|
| ScrollArea | CSS |
| Separator | CSS |
| AspectRatio | CSS |
| Avatar | CSS |
| Progress | CSS/HTML native |

**특수** — 1종

| UI | 비고 |
|:---|:---|
| Combobox | Field + Trigger.Portal (별도 설계 필요) |

### 요약

```
┌─────────────────────────────────────────────────┐
│  27종 UI를 커버하기 위해 LLM이 알아야 하는 것     │
│                                                 │
│  Option A (Layer 2):  27개 컴포넌트 이름          │
│  Option B (Layer 1):  6개 프리미티브 + 12개 role  │
│  Option C (Hybrid):   6개 + 12개 + 27개 alias    │
└─────────────────────────────────────────────────┘
```

---

## 4. 핵심 질문 — 6 + 12가 진짜로 27보다 적은가?

숫자로는 적다. 하지만 **인지 부하**로 측정하면:

```
27개 이름:
  → 각자 독립적. "Dialog가 뭔지"를 알면 Dialog를 씀
  → 다른 컴포넌트와의 관계를 몰라도 됨
  → LLM은 이 이름들을 이미 학습함

6 + 12:
  → 규칙을 이해해야 함: "Trigger role=dialog → Dialog와 같다"
  → 조합법을 알아야 함: Trigger + Portal + Zone + Dismiss
  → LLM은 이 규칙을 새로 학습해야 함
```

> [!IMPORTANT]
> **27개 이름을 아는 것 vs 6개의 조합 규칙을 아는 것**  
> 전자는 "사전(dictionary)", 후자는 "문법(grammar)".  
> LLM은 사전에 강하고, 문법은 예시가 충분하면 학습한다.

---

## 5. 제안 — Option B+: Layer 1 Only + CLAUDE.md 매핑 테이블

### 전략

```
Layer 2는 만들지 않는다.
Layer 1(6개 프리미티브 + role)이 전부.
CLAUDE.md에 "이 UI를 만들려면 이 role을 써라" 매핑 테이블을 제공.
```

### CLAUDE.md에 추가할 내용

```markdown
## UI Component → ZIFT Mapping

| 만들고 싶은 것 | 사용할 패턴 |
|:---|:---|
| Modal / Dialog | `<Trigger role="dialog">` + `<Trigger.Portal>` + `<Zone role="dialog">` |
| Confirm Dialog | `<Trigger role="alertdialog">` + `<Trigger.Portal>` + `<Zone role="alertdialog">` |
| Dropdown Menu | `<Trigger role="menu">` + `<Trigger.Portal>` + `<Zone role="menu">` |
| Context Menu | `<Trigger role="contextmenu">` + `<Trigger.Portal>` + `<Zone role="menu">` |
| Tooltip | `<Trigger role="tooltip">` + `<Trigger.Portal>` |
| Popover | `<Trigger role="popover">` + `<Trigger.Portal>` + `<Zone role="dialog">` |
| Select | `<Trigger role="select">` + `<Trigger.Portal>` + `<Zone role="listbox">` |
| Tabs | `<Zone role="tablist">` + `<Item>` |
| Accordion | `<Zone role="tree">` + `<Item role="treeitem">` |
| Radio Group | `<Zone role="radiogroup">` + `<Item>` |
| Toolbar | `<Zone role="toolbar">` + `<Trigger>` |
| Toggle/Switch | `<Trigger>` (toggle) |
| Toast | `dispatch(OS_TOAST({...}))` |
```

### 이 접근이 유효한 이유

1. **CLAUDE.md는 LLM이 매 세션마다 읽는다** — 매핑 테이블이 곧 사전
2. **6개만 구현하면 된다** — 27개 컴포넌트 구현/유지 비용 제거
3. **새 UI 종류 추가 = role 값 + 매핑 테이블 1줄 추가** — 코드 변경 0
4. **LLM이 Trigger 패턴을 한 번 배우면 모든 overlay에 적용** — 문법 학습

### 리스크

| 리스크 | 대응 |
|:---|:---|
| LLM이 매핑을 무시하고 옛 패턴(MUI) 사용 | `no-handler-in-app` lint가 차단 |
| 조합 실수 (잘못된 role 조합) | TypeScript union type으로 role 값 제한 |
| CLAUDE.md가 너무 길어짐 | 매핑 테이블 별도 파일로 분리 가능 |

---

## 6. 최종 결론

```
┌─────────────────────────────────────────────────────┐
│  제안: Layer 1 Only (Option B+)                      │
│                                                     │
│  • 만드는 것: 6개 프리미티브 (이미 4개 있음 + 2개 추가) │
│  • 안 만드는 것: 27개 Layer 2 컴포넌트                 │
│  • LLM 학습: CLAUDE.md 매핑 테이블 1개                │
│  • 새 UI 추가 비용: role 값 1개 + 테이블 1줄           │
│                                                     │
│  결과: 최소 구현, 최대 커버리지                        │
└─────────────────────────────────────────────────────┘
```

> [!TIP]
> **Layer 2는 "필요해지면 그때 만든다".**  
> 지금은 Layer 1 + CLAUDE.md 매핑으로 시작하고,  
> LLM이 반복적으로 실수하는 UI가 있으면 그때 해당 UI만 Layer 2 alias로 제공.
> 
> 이것이 **점진적 추상화** — 필요가 만드는 추상화.

---

> **Next Action**: 
> 1. `Trigger.Portal` + `Trigger.Dismiss` 구현 (Layer 1 완성)
> 2. CLAUDE.md에 UI → ZIFT 매핑 테이블 추가
> 3. LLM 코드 생성 테스트 → 실수 패턴 관찰 → 필요한 경우만 Layer 2 추가
