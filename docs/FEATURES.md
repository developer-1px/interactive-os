# Feature Matrix

> **이 문서의 목적**: Interactive OS의 모든 기능을 한 눈에 본다.
>
> **상태 범례**: ✅ 구현 완료 · 🔧 부분 구현 · 📋 제안/미착수 · 🚧 진행 중
>
> **구조**: concept-map 18개 카테고리 = 이 문서의 섹션.
> 각 기능이 `docs/1-project/`의 프로젝트나 `docs/5-backlog/os-gaps.md`와 연결되면 링크한다.
>
> **갱신 규칙**: 기능이 추가/변경되면 이 문서를 갱신한다. `/status`는 프로젝트 현황, 이 문서는 기능 현황.

---

## Discovery Table — Browser API × OS Concept

> **발견 도구**: Y축 = 브라우저가 제공하는 API (완전한 목록, 고정).
> X축 = OS가 추상화하는 개념 (ZIFT에서 시작, 오른쪽으로 발견).
>
> **읽는 법**: ZIFT 열에 매핑되는 부분을 빼면, 남는 것이 새 개념의 핵심이다.
> "?" = 아직 이름 없는 개념. 이 칸이 로드맵이다.
>
> ✅ 구현 완료 · 🔧 부분 구현 · 📋 미착수

### Conquered — ZIFT가 정복한 영역

| Browser API | Zone | Item | Field | Trigger |
|---|---|---|---|---|
| **KeyboardEvent** | inputmap ✅ | navigation ✅ | editing ✅ | activation ✅ |
| **PointerEvent** | zone activation ✅ | — | — | click ✅ |
| **FocusEvent** | active zone ✅ | focus tracking ✅ | — | — |
| **InputEvent** | — | — | value change ✅ | — |
| **CompositionEvent** | — | — | IME guard ✅ | — |

### Discovered — ZIFT를 관통하며 새 차원을 추가한 패턴

| Browser API | Zone | Item | Field | Trigger | Pattern (ZIFT 밖의 새 차원) |
|---|---|---|---|---|---|
| **ClipboardEvent** | paste bubbling ✅ | copied items ✅ | — | Ctrl+C/V ✅ | **Clipboard** (transfer buffer) ✅ |
| **History API** | — | — | — | — | **Routing** (URL ↔ state sync) 🔧 |
| **localStorage** | — | — | — | — | **Persistence** (state ↔ storage sync) ✅ |
| **setTimeout** | — | — | — | — | **History** (undo stack, noise filter) ✅ |

### Frontier — 아직 정복하지 않은 Browser API

| Browser API | Zone | Item | Field | Trigger | Pattern (ZIFT 밖, 발견 대상) |
|---|---|---|---|---|---|
| **DragEvent** | source/target 📋 | dragged item 📋 | — | drag handle 📋 | **DnD** (drop position, visual feedback) 📋 |
| **TouchEvent** | touch zone 📋 | — | — | tap/swipe 📋 | **Gesture** (recognition, multi-touch) 📋 |
| **WheelEvent** | scroll zone 📋 | visible item 📋 | — | — | **Viewport** (virtual list, scroll position) 📋 |
| **scroll** | scroll zone 📋 | visible item 📋 | — | — | **Viewport** 📋 |
| **IntersectionObserver** | — | visibility 📋 | — | — | **Viewport** 📋 |
| **ResizeObserver** | zone resize 📋 | — | — | — | **Responsive** (breakpoint, layout rule) 📋 |
| **matchMedia** | — | — | — | — | **Preference** (reduced-motion, dark mode) 📋 |
| **Animation API** | — | — | — | — | **Transition** (state → visual feedback) 📋 |
| **Selection API** | — | — | text range 📋 | — | **TextRange** (text selection ≠ item selection) 📋 |
| **Web Audio** | — | — | — | — | **Sound** (auditory feedback) 📋 |

### 발견 요약

ZIFT 4개 프리미티브가 정복한 Browser API: **5종** (Keyboard, Pointer, Focus, Input, Composition)
ZIFT + Pattern으로 정복한 API: **+4종** (Clipboard, History, localStorage, setTimeout)
**미정복 API: 10종** → 여기서 새 OS 개념이 탄생한다:

| 미정복 API 묶음 | 발견된 이름 | 핵심 (ZIFT로 설명 안 되는 것) |
|---|---|---|
| Drag | **DnD** | drop position, visual drag feedback |
| Touch | **Gesture** | intent recognition, multi-touch |
| Wheel + Scroll + Intersection | **Viewport** | visible range, virtual list, scroll anchor |
| Resize + matchMedia | **Responsive** | breakpoint, layout adaptation |
| Animation API | **Transition** | state change → motion |
| Selection API | **TextRange** | sub-item text selection |
| Web Audio | **Sound** | auditory feedback |
| matchMedia(prefers-*) | **Preference** | user system settings |

---

## 1. Topology (공간 구조)

**Why** — 웹에는 "영역"이라는 개념이 없다. `<div>` 안에 버튼 10개를 넣어도, 그것이 하나의 리스트인지 독립 버튼 10개인지 브라우저는 모른다. 방향키로 이동하려면 개발자가 "이 10개는 하나의 그룹이고, 세로로 배치되어 있다"를 직접 코딩해야 한다.

**How** — UI를 "영역(Zone)"과 "그 안의 아이템(Item)"으로 나누고, 각 영역에 방향·계층·경계 규칙을 붙이면, 모든 상호작용은 이 공간 규칙의 함수가 된다. 규칙만 선언하면 동작은 도출된다.

**What** — Zone(영역), Item(탐색 단위), Hierarchy(부모-자식), Orientation(배치 방향), Boundary(경계 행동)의 5가지 공간 프리미티브. `role: "listbox"` 한 줄이면 OS가 이 5가지를 자동으로 채운다.

**If** — 없으면: 매 컴포넌트마다 `onKeyDown`에서 "위/아래면 이동, 끝이면 멈춤" 로직을 반복 구현. 있으면: `orientation: "vertical", boundary: "wrap"` 선언 한 줄.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Zone | ✅ | zoneRegistry.test | `os-core/engine/registries/zoneRegistry.ts` | 22 role presets |
| Item | ✅ | computeItem tests | `os-core/headless/` | `Record<id, AriaItemState>` |
| Hierarchy | ✅ | tree.test, treegrid.test | `os-sdk/library/collection/treeUtils.ts` | parent-child, nested zones |
| Orientation | ✅ | navigate.test | Zone config `orientation` | horizontal, vertical, grid(2D) |
| Boundary | ✅ | navigate.test | Zone config `boundary` | wrap, stop, escape-to-parent |

---

## 2. Navigation (공간 이동)

**Why** — 키보드 사용자는 방향키로 이동한다. 그런데 리스트는 ↑↓, 탭바는 ←→, 그리드는 4방향, 트리는 ←→가 펼침/접힘이다. 패턴마다 방향키의 의미가 다르고, 이걸 앱마다 직접 구현하면 일관성이 깨진다.

**How** — 같은 방향키라도 "어떤 영역에 있느냐"에 따라 의미가 달라진다면, 영역의 role이 이동 전략을 결정해야 한다. 앱이 아니라 OS가 "이 role에서 →키는 무엇을 의미하는가"를 알고 있으면 된다.

**What** — `OS_NAVIGATE` 커맨드 하나가 7가지 전략(linear, spatial, corner, typeahead 등)을 가진다. Zone의 role과 orientation에 따라 OS가 올바른 전략을 자동 선택. Tab, Home/End, typeahead까지 포함하는 통합 이동 시스템.

**If** — 없으면: `switch(e.key) { case "ArrowDown": ... }` 패턴이 모든 컴포넌트에 반복. 있으면: role을 선언하면 올바른 키보드 이동이 자동으로 동작.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Arrow Navigation | ✅ | navigate.test (30+) | `os-core/3-commands/navigate/` | 7 strategies: linear, spatial, corner, typeahead |
| Tab Navigation | ✅ | tab.test (8+) | `os-core/3-commands/interaction/tab.ts` | Cross-zone Tab/Shift+Tab |
| Typeahead | ✅ | typeahead.test (12) | `os-core/2-resolve/typeaheadFallbackMiddleware.ts` | Single-char jump |
| Home/End | ✅ | navigate.test | osDefaults keybinding | First/last item jump |
| Page Up/Down | 🔧 | — | osDefaults keybinding | Bound but no page-size logic |
| Cross-Zone | ✅ | tab.test, focus-showcase.spec | Tab + focus delegation | |

---

## 3. Focus (초점 시스템)

**Why** — "지금 어디에 있는가"를 아는 것이 모든 상호작용의 전제다. 브라우저의 `document.activeElement`는 DOM 노드 하나만 추적한다. 모달이 열리면 뒤의 포커스를 기억해야 하고, 아이템이 삭제되면 이웃으로 복구해야 하는데, 브라우저는 이걸 모른다.

**How** — 포커스를 DOM에 맡기지 말고, OS가 가상 상태로 소유해야 한다. DOM은 그 상태의 투영일 뿐이다. 그러면 "기억, 복구, 스택"이 데이터 조작이 되어 어떤 시나리오든 대응 가능하다.

**What** — 가상 포커스(focusedItemId, activeZoneId)를 OS가 관리. Focus Stack(모달 push/pop), Focus Recovery(삭제 시 이웃 복구), Focus Sync(가상→DOM), AutoFocus(Zone 마운트 시)를 포함하는 완전한 초점 시스템.

**If** — 없으면: 모달 열 때 `useEffect`로 포커스 저장, 닫을 때 복원, 삭제 시 `nextSibling`으로 이동... 각각 직접 구현. 있으면: OS가 모든 포커스 전환을 자동으로 처리.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Focus Tracking | ✅ | sync-focus.test | `os-core/4-command/focus/` | focusedItemId, activeZoneId |
| Active Zone | ✅ | zoneRegistry.test | `os-core/engine/registries/zoneRegistry.ts` | Single active zone |
| Focus Stack | ✅ | stack.test (13) | `os-core/4-command/focus/stack.ts` | Modal push/pop |
| Focus Recovery | ✅ | recover.test | `os-core/3-commands/navigate/` | Auto-recover on item delete |
| Focus Sync | ✅ | virtualFocus.test | `os-core/4-command/focus/syncFocus.ts` | Virtual state → DOM |
| AutoFocus | ✅ | — | Zone config `autoFocus` | first/last/restore/selected |

---

## 4. Selection (선택)

**Why** — 파일 탐색기에서 Shift+클릭으로 범위 선택, Ctrl+클릭으로 개별 토글, Ctrl+A로 전체 선택 — 이 동작은 데스크탑 OS가 보장하는 보편 계약이다. 웹에서는 이걸 매번 `useState(selectedIds)` + `onKeyDown` 조합으로 직접 만든다.

**How** — 선택은 포커스와 독립된 관심사다. "포커스가 선택을 따라가는가(follow-focus)", "독립적으로 토글하는가(multi)" — 이 정책만 선언하면 선택의 모든 변형(단일, 다중, 범위)은 정책의 함수로 도출된다.

**What** — `OS_SELECT`, `OS_SELECT_ALL`, `OS_SELECTION_CLEAR` 커맨드가 Zone의 selection mode(single/multi)에 따라 동작. 단일 선택, 다중 토글(Space), 범위 선택(Shift+Arrow), 전체(Ctrl+A), 해제(Escape)를 통합.

**If** — 없으면: 선택 상태 관리 + 키보드 이벤트 + Shift 범위 계산을 매번 구현. 있으면: `selection: "multi"` 한 줄이면 Ctrl+A, Shift+Arrow, Space toggle 전부 동작.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Single Select | ✅ | os-commands.test | `os-core/3-commands/selection/` | follow-focus mode |
| Multi Select | ✅ | multi-select-commands.test | `os-core/3-commands/selection/` | Space toggle |
| Range Select | ✅ | multi-select-commands.test | Shift+Arrow | |
| Select All | ✅ | os-commands.test | `OS_SELECT_ALL` | Ctrl+A |
| Selection Clear | ✅ | os-commands.test | `OS_SELECTION_CLEAR` | Escape |

---

## 5. Activation (활성화)

**Why** — "Enter를 누르면 실행된다"는 가장 기본적인 상호작용이다. 그런데 체크박스는 Space로 토글하고, 링크는 Enter로 열고, 스위치는 Space로 뒤집는다. 활성화 키가 role마다 다르고, 이 규칙을 앱이 알아야 한다.

**How** — "어떤 키가 활성화인가"는 앱이 아니라 role이 결정해야 한다. 앱은 "활성화되면 무엇을 할지"만 알면 된다. 활성화 수단(Enter vs Space vs Click)과 활성화 결과(앱 로직)를 분리하면 된다.

**What** — `OS_ACTIVATE`(Enter), `OS_PRESS`(Space toggle), `OS_CHECK`(체크박스 토글)가 role preset에 따라 자동 바인딩. 앱은 `onAction` 콜백만 등록. Context Menu와 Double-Click Edit는 제안 단계.

**If** — 없으면: `onKeyDown`에서 `if (key === "Enter") ...` + `if (key === " ") ...` + role별 분기. 있으면: `onAction: (cursor) => doSomething()` 콜백 하나.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Enter Activate | ✅ | os-commands.test, APG tests | `OS_ACTIVATE` | onAction callback |
| Space Toggle | ✅ | checkbox.test, switch.test | `OS_PRESS`, `OS_CHECK` | |
| Double-Click Edit | 📋 | — | — | 개념만 존재. OS 레벨 지원 없음 |
| Context Menu | 📋 | — | — | VISION.md 제안. Shift+F10, 우클릭 |

---

## 6. Field (속성 편집)

**Why** — 리스트 아이템의 이름을 바꾸려면 편집 모드에 진입하고, 수정하고, Enter로 확정하거나 Escape로 취소한다. 이 생명주기(start → edit → commit/cancel)는 인라인 텍스트, 태그, 슬라이더, 체크박스 모두에 공통이다. 그런데 각 타입마다 "언제 편집이 시작되는가", "어떤 키가 확정인가"가 다르다.

**How** — 모든 편집은 "시작 → 수정 중 → 확정/취소"라는 동일한 생명주기를 가진다. 편집 중에는 키보드 소유권이 아이템에서 필드로 넘어간다. 이 생명주기와 소유권 전환을 OS가 관리하면, 앱은 "어떤 속성을 편집할지"만 선언하면 된다.

**What** — `OS_FIELD_START_EDIT` → 편집 중 → `OS_FIELD_COMMIT/CANCEL` 생명주기. inline string, tokens, block, contentEditable, boolean, number, enum 7가지 타입. IME 안전(한글/일본어), Key Ownership(편집 중 방향키 = 커서, 편집 밖 = 아이템 이동), 경계 탈출을 포함.

**If** — 없으면: `isEditing` 상태 + `onKeyDown` 분기 + IME 가드 + 커서 위치 체크를 매 필드마다. 있으면: `fieldName: "title"` 선언이면 편집 생명주기가 자동.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Edit Lifecycle | ✅ | field.test (14) | `os-core/3-commands/field/` | start → edit → commit/cancel |
| String (inline) | ✅ | field.test | Field config `type: "string"` | |
| String (tokens) | ✅ | — | Field config | Tag-style editing |
| String (block) | ✅ | — | Field config | Multi-line |
| String (editor) | ✅ | — | Field config | contentEditable |
| Boolean | ✅ | checkbox.test, switch.test | `OS_CHECK` / `OS_PRESS` | |
| Number | ✅ | spinbutton.test, slider.test | `OS_VALUE_CHANGE` | |
| Enum | 🔧 | combobox.test | — | combobox 동작하나 OS 레벨 추상화 미완 |
| IME Safety | ✅ | — | compositionstart/end guard | CJK input safe |
| Key Ownership | ✅ | — | `fieldKeyOwnership.ts` | Field vs Item claim |
| Boundary Escape | ✅ | — | — | Cursor at edge → spatial nav |

---

## 7. Overlay (레이어)

**Why** — 모달, 메뉴, 툴팁, 토스트는 "기존 화면 위에 떠있는 레이어"다. 모달은 포커스를 가두고(trap), 메뉴는 바깥 클릭에 닫히고, 툴팁은 hover에 뜨고, 토스트는 시간이 지나면 사라진다. 이 열기/닫기 + 포커스 관리 + 해제 조건의 조합이 레이어마다 다르다.

**How** — 레이어는 "포커스 컨텍스트의 중첩"이다. 열면 현재 포커스를 저장하고 새 컨텍스트로 진입, 닫으면 이전 컨텍스트로 복귀 — 이 push/pop을 OS가 소유하면 모든 레이어 타입이 같은 메커니즘 위에 올라간다.

**What** — `OS_OVERLAY_OPEN/CLOSE`가 Focus Stack과 연동. Dialog(modal trap), AlertDialog(확인 필요), Popover(비모달), Menu(popup), Tooltip(정보), Toast(알림), Dismiss(Escape + outside click 통합 해제)를 포함하는 레이어 시스템.

**If** — 없으면: 모달마다 `createPortal` + `useEffect(trapFocus)` + `onKeyDown(Escape)` + `useClickOutside`. 있으면: `role: "dialog"` 선언이면 focus trap + Escape 닫기 + 포커스 복원 자동.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Dialog | ✅ | overlay.test (9) | `OS_OVERLAY_OPEN/CLOSE` | Modal focus trap |
| AlertDialog | ✅ | — | role preset | 확인 필요 modal |
| Popover | ✅ | — | role preset | Non-modal overlay |
| Menu | ✅ | menu.test | role preset + overlay | Popup menu |
| Tooltip | ✅ | tooltip.test | role preset | hover/focus info |
| Toast | 🔧 | — | `OS_NOTIFY` | aria-live 동작. 자동 해제 타이머 미구현 |
| Dismiss | 🔧 | escape.test | `resolveEscape.ts` | Escape 동작. outsideClick은 앱 레벨 [OG-015](5-backlog/os-gaps.md) |

---

## 8. Expansion (펼침/접힘)

**Why** — 트리 노드를 펼치고, 아코디언 패널을 열고, 디스클로저를 토글하고, 탭을 전환하는 것은 모두 "콘텐츠의 가시성을 전환"하는 같은 행위다. 그런데 트리는 →키로 펼치고, 아코디언은 Enter로 토글하고, 탭은 자동/수동 활성화가 있다.

**How** — "펼침/접힘"은 하나의 상태(expanded)다. 이걸 토글하는 키가 role마다 다를 뿐이다. role이 "어떤 키로 토글하는가"를 결정하고, OS가 `expanded` 상태를 관리하면, 앱은 그 상태에 따라 콘텐츠를 보여주기만 하면 된다.

**What** — `OS_EXPAND` 커맨드가 role preset의 inputmap에 따라 올바른 키에 자동 바인딩. Tree expand(→/←), Accordion(다중 패널), Disclosure(단일 토글), Tabs(패널 전환)를 하나의 확장 모델로 통합. `aria-expanded` 상태를 OS가 관리.

**If** — 없으면: `isOpen` 상태 + `aria-expanded` 수동 부착 + 키보드 바인딩 패턴별 구현. 있으면: role이 expand 동작과 ARIA 상태를 자동으로 결정.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Tree Expand | ✅ | expand.test, tree.test | `OS_EXPAND` | Right/Left arrow |
| Accordion | ✅ | accordion.test | role preset + expand | Single/multi panel |
| Disclosure | ✅ | disclosure.test | role preset + expand | |
| Tabs | ✅ | tabs.test | role preset `tablist` | Manual/auto activation |

---

## 9. Drag & Drop (물리적 이동)

**Why** — Kanban 보드에서 카드를 끌어서 옮기고, 파일 탐색기에서 파일을 폴더에 넣고, 리스트에서 아이템 순서를 바꾸는 것. 마우스/터치로 끌기는 시각적이고 직관적이지만, 키보드 접근성과 드롭 위치 판단까지 포함하면 구현 복잡도가 급격히 올라간다.

**How** — 드래그는 "선택된 아이템을 다른 위치로 이동"이다. 마우스든 키보드(Alt+Arrow)든 의도는 같다. 이동 의도를 커맨드로 추상화하면, 입력 수단에 무관하게 같은 결과를 보장할 수 있다.

**What** — 키보드 기반 재정렬(`OS_MOVE_UP/DOWN`, Alt+Arrow)은 구현 완료. Visual DnD(DRAG_START/MOVE/END/DROP), Cross-Zone Transfer, Drop Position(before/after/inside) 판단은 미착수.

**If** — 없으면: `react-dnd` 같은 라이브러리를 직접 통합하되, OS의 포커스/선택 시스템과 충돌. 있으면: DnD가 OS 커맨드로 통합되어 포커스/선택/접근성이 일관.

> 📋 [VISION.md §5.2](2-area/official/VISION.md) 제안 모듈

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Keyboard Reorder | ✅ | os-commands.test | `OS_MOVE_UP/DOWN` | Alt+Arrow |
| Visual DnD | 📋 | — | — | DRAG_START/MOVE/END/DROP 커맨드 |
| Cross-Zone Transfer | 📋 | — | — | Zone A → Zone B 이동 |
| Drop Position | 📋 | — | — | before/after/inside 판단 |

---

## 10. Clipboard (클립보드)

**Why** — Ctrl+C로 복사하고 Ctrl+V로 붙여넣는 것은 데스크탑 OS의 보편 행위다. 웹에서는 텍스트 복사는 브라우저가 하지만, "리스트에서 아이템 3개를 선택해서 복사 → 다른 리스트에 붙여넣기"는 앱이 직접 만들어야 한다.

**How** — 클립보드는 "선택 상태의 스냅샷을 다른 위치에 적용"하는 것이다. 선택 시스템이 이미 "무엇이 선택되었는가"를 알고 있으므로, 복사는 선택 읽기, 붙여넣기는 커서 위치에 삽입이면 된다. Zone 계층에서 처리 못 하면 상위로 버블링.

**What** — `OS_COPY/CUT/PASTE` 커맨드가 Zone의 선택 상태를 읽어서 동작. Cut은 삭제 마킹(실제 삭제는 Paste 시), Paste는 커서 위치에 삽입. Paste Bubbling(하위→상위 Zone). 네이티브 클립보드 이벤트와 OS 커맨드의 브릿지.

**If** — 없으면: 클립보드 상태 관리 + Ctrl+C/V 바인딩 + 위치 결정 로직을 매번 구현. 있으면: Zone의 `onCopy/onPaste` 콜백만 등록하면 전체 파이프라인 동작.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Copy | ✅ | clipboard-commands.test | `OS_COPY` | Ctrl+C / Cmd+C |
| Cut | ✅ | clipboard-commands.test | `OS_CUT` | Cut marking |
| Paste | ✅ | clipboard-commands.test | `OS_PASTE` | Position-aware |
| Paste Bubbling | ✅ | — | `pasteBubbling.ts` | Child → parent zone |

---

## 11. History (시간 여행)

**Why** — 실수로 삭제했을 때 Ctrl+Z 한 번이면 복구된다 — 데스크탑에서는 당연한 기능이 웹에서는 거의 없다. Undo/Redo를 직접 구현하려면 모든 상태 변경을 기록하고, 탐색(방향키 이동) 같은 "의미 없는 행위"는 필터링해야 한다.

**How** — 모든 상태 변경이 이미 하나의 디스패치 경로를 통과한다(Command 시스템). 이 경로에 미들웨어를 끼우면 기록이 자동이다. "의미 있는 변경"만 골라 기록하면 된다.

**What** — `historyKernelMiddleware`가 커널 디스패치를 가로채서 상태 스냅샷 기록. Navigate 같은 비의미 커맨드는 자동 필터링(Noise Filtering). 시스템 정리 동작도 제외(Housekeeping Silence). Undo(Ctrl+Z), Redo(Ctrl+Shift+Z).

**If** — 없으면: 상태 히스토리 스택 관리 + 어떤 액션을 기록할지 판단 + 키바인딩을 직접 구현. 있으면: `modules: [history()]` 한 줄이면 앱에 Undo/Redo 자동 장착.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Undo | ✅ | history.test (13) | `OS_UNDO` | Ctrl+Z |
| Redo | ✅ | history.test | `OS_REDO` | Ctrl+Shift+Z |
| Noise Filtering | ✅ | history.test | `historyKernelMiddleware.ts` | Navigate 등 비의미 행위 제외 |
| Housekeeping Silence | ✅ | history.test | middleware option | 시스템 정리 기록 제외 |

---

## 12. Data (데이터 구조)

**Why** — 할일 목록, 파일 트리, 스프레드시트는 모두 "id를 가진 아이템의 모음"이다. 그런데 리스트는 1D, 그리드는 2D, 트리는 부모-자식 관계가 있다. 이 구조를 각각 다르게 관리하면 CRUD, 선택, 정렬 로직이 구조마다 중복된다.

**How** — 리스트, 그리드, 트리는 표현이 다를 뿐 본질은 같다: "id로 식별되는 엔티티의 정렬된 모음". 하나의 정규화된 구조(`{ entities, order }`)로 통합하면, 그 위의 CRUD·선택·정렬이 구조에 무관하게 재사용된다.

**What** — `NormalizedCollection`(`{ entities, order }`)이 기반. Tree는 `parentId/childIds`, Grid는 `rows × columns`로 확장. View Transform(filter, sort)이 원본 불변으로 투영. 4가지 패턴(listbox, grid, tree, treegrid)이 하나의 구조 위에서 동작.

**If** — 없으면: 패턴마다 다른 데이터 구조 + 중복된 CRUD 로직. 있으면: `createCollectionZone()`이 데이터 구조와 상호작용(선택, 삭제, 재정렬)을 한번에 바인딩.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Entity | ✅ | — | `NormalizedCollection.ts` | `{ id, ...fields }` |
| Collection | ✅ | collection tests (33) | `createCollectionZone.ts` | `{ entities, order }` |
| Tree | ✅ | tree tests (7) | `treeUtils.ts` | parentId, childIds |
| Flat List | ✅ | listbox tests (10) | — | 1D ordered |
| Grid | ✅ | grid tests (8) | — | 2D (rows x columns) |
| View Transform | 🔧 | — | `collectionView.ts` | filter/sort 존재, group/pagination 미완 |
| Master-Detail | 📋 | — | — | 선택 → 상세 연동. 패턴만 존재 |

---

## 13. CRUD (데이터 조작)

**Why** — 아이템 추가, 조회, 수정, 삭제, 순서 변경은 데이터 앱의 근본 동작이다. 문제는 이것이 키보드 단축키(Delete, Ctrl+N), UI 피드백(삭제 후 toast), 포커스 관리(삭제 후 이웃으로 이동)와 엮인다는 것이다.

**How** — CRUD 각각은 단순하다. 복잡한 건 "삭제 후 포커스 복구 + toast + undo"처럼 여러 관심사가 엮이는 것이다. 각 관심사가 이미 OS 모듈(Focus, History, Overlay)로 존재하면, CRUD는 이 모듈들을 하나의 콜백으로 연결하는 것이면 된다.

**What** — `collectionBindings()`가 Zone의 `onDelete/onCreate/onReorder` 콜백을 OS 커맨드에 자동 연결. Create(추가/삽입/복제), Read(selector), Update(Field 편집), Delete(삭제+undo toast+포커스 복구), Reorder(Alt+Arrow)를 통합.

**If** — 없으면: Delete키 바인딩 + 삭제 확인 + undo 구현 + 포커스 복구를 매번 직접. 있으면: `collectionBindings({ onDelete: (ids) => removeItems(ids) })` 한 줄이면 Delete키 → 삭제 → toast → undo → 포커스 복구 전체 파이프라인 동작.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Create | ✅ | collection tests | collectionBindings `onCreate` | add, insert, duplicate |
| Read | ✅ | — | selector system | |
| Update | ✅ | field.test | Field edit pipeline | |
| Delete | ✅ | collection tests | `OS_DELETE` + undo toast | |
| Reorder | ✅ | os-commands.test | `OS_MOVE_UP/DOWN` | Keyboard-based |

---

## 14. Command (명령 시스템)

**Why** — 키보드를 눌렀을 때, 마우스를 클릭했을 때, 테스트에서 시뮬레이션했을 때 — 입력 방법은 달라도 의도는 같다. "삭제해라", "이동해라", "선택해라". 이 의도를 코드 여기저기에 흩뿌리면 추적도 테스트도 불가능하다.

**How** — 의도를 이벤트 핸들러에 흩뿌리지 말고, 이름이 있는 데이터 객체로 만들어서, 하나의 경로를 통과시키면 된다. 그러면 그 경로에서 로깅, undo, 테스트, 디버깅이 전부 가능해진다.

**What** — 모든 의도가 커맨드 객체(`{ type: "OS_DELETE", payload }`)로 표현되어 `os.dispatch()` 단일 경로로 실행. Scope(앱/Zone 격리), 순수 핸들러(state → nextState), `when:` 가드, OS/앱 커맨드 분리. 커널(521 tests)이 기반.

**If** — 없으면: `onClick={() => setState(...)}` 산재. 로깅, undo, 테스트 모두 별도 구현. 있으면: 모든 상태 변경이 하나의 파이프라인을 통과하므로 로깅/undo/테스트/디버깅이 자동.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Command Type | ✅ | kernel tests (521) | `defineCommand()` | Named intent |
| Command Scoping | ✅ | — | `appState.ts` | App + Zone isolation |
| Command Dispatch | ✅ | kernel tests | `os.dispatch()` | Single entry point |
| Command Handler | ✅ | kernel tests | `state → nextState` | Pure function |
| Condition Guard | ✅ | command-when.test | `when:` predicate | |
| App vs OS Command | ✅ | — | Scope chain | Zone → App → GLOBAL fallback |

---

## 15. Pipeline (처리 흐름)

**Why** — 키보드를 누르면 즉시 상태가 바뀌는 것이 아니다. 먼저 물리 이벤트를 감지하고, 키를 의미로 변환하고, 컨텍스트에 따라 계산하고, 상태를 적용하고, DOM에 반영하고, 무결성을 검증한다. 이 과정이 하나의 함수 안에 뭉쳐있으면 어디서 잘못됐는지 알 수 없다.

**How** — 입력에서 출력까지의 과정을 명시적 단계로 분리하면, 각 단계를 독립적으로 테스트하고 교체할 수 있다. "물리 이벤트 → 의미 → 계산 → 적용 → 동기화 → 검증"이라는 고정된 흐름이 있으면 모든 상호작용이 같은 경로를 탄다.

**What** — P1 Sense(이벤트 캡처) → P2 Intent(키 매핑) → P3 Resolve(상태 계산) → P4 Commit(원자적 적용) → P5 Sync(DOM 동기화) → P6 Audit(무결성 검증). 6단계 파이프라인. OS의 처리 척추.

**If** — 없으면: `onKeyDown` 핸들러 안에 감지+해석+계산+적용+DOM 동기화가 한 덩어리. 디버깅 시 추적 불가. 있으면: 각 단계를 독립 검증. 문제가 P2에 있는지 P3에 있는지 즉시 분리.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| P1 Sense | ✅ | — | `1-listen/` (4 listeners) | keyboard, mouse, pointer, clipboard |
| P2 Intent | ✅ | keybindings.test | `2-resolve/` | Key → command mapping |
| P3 Resolve | ✅ | — | `3-commands/` | Context-aware computation |
| P4 Commit | ✅ | kernel tests | `dispatch()` | Atomic state apply |
| P5 Sync | ✅ | sync-focus.test | `syncFocus.ts` | Virtual → DOM |
| P6 Audit | ✅ | — | Post-dispatch checks | Focus integrity |

---

## 16. ARIA (접근성 투영)

**Why** — WAI-ARIA 스펙은 1,000페이지다. `aria-selected`, `aria-expanded`, `aria-activedescendant`, `role` — 스크린 리더가 올바르게 읽으려면 이 속성들이 정확해야 한다. 대부분의 개발자가 이걸 올바르게 구현하지 못한다. 빠뜨리거나, 잘못된 값을 넣거나, 상태 변경 시 갱신을 잊는다.

**How** — ARIA 속성은 OS 상태(선택됨, 펼쳐짐, 포커스됨)의 투영이다. OS가 이미 이 상태를 관리하고 있으므로, role별로 "어떤 상태를 어떤 ARIA 속성으로 투영할지"만 정의하면 접근성은 상태의 자동 파생이 된다.

**What** — 22개 Role Presets이 각 role에 필요한 ARIA 속성을 자동 계산. `computeItem()`이 Zone 상태에서 `aria-selected`, `aria-expanded` 등을 파생. State Projection(동적), Property(정적 관계), Live Region(동적 알림), Landmark(페이지 구조, 미착수).

**If** — 없으면: 컴포넌트마다 `aria-selected={isSelected}`, `aria-expanded={isOpen}` 수동 부착 + 스펙 참조. 있으면: role을 선언하면 ARIA 속성이 상태에서 자동 계산. 스크린 리더가 올바르게 읽는 것이 기본값.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| Role Presets | ✅ | rolePresets.test | `roleRegistry.ts` | 22 roles, 9 preset fields each |
| State Projection | ✅ | APG tests | `computeItem` | aria-selected, expanded, checked, pressed... |
| Property | ✅ | — | Zone metadata | labelledby, describedby, controls |
| Live Region | ✅ | — | `ariaLive` | alert, status, polite |
| Landmark | 📋 | — | — | navigation, main, complementary — OS 레벨 관리 없음 |

---

## 17. App Framework (앱 프레임워크)

**Why** — OS가 아무리 좋아도, 앱 개발자가 "어떻게 쓰는지" 모르면 소용없다. Zone 생성, 상태 정의, 커맨드 등록, 키바인딩, 테스트 인스턴스 — 이것들을 각각 호출하면 실수하기 쉽다. 진입점이 여러 개면 빠뜨리거나 순서를 틀릴 수 있다.

**How** — "하나의 진입점에서 모든 것을 선언"하면 OS가 올바른 순서로 조립한다. 앱 개발자의 자유도를 줄이는 것이 아니라, 잘못될 수 있는 경로를 제거하는 것이다. Pit of Success.

**What** — `defineApp()`이 앱 정의의 유일한 진입점. State(초기 상태), Selector(파생), Condition(조건), Zone Handle(영역 생성), Bind(커맨드 연결), Modules(history, persistence 등 플러그인), TestInstance(headless 테스트)를 선언.

**If** — 없으면: OS API를 개별 호출하며 조립. 순서 실수, 누락, 중복 위험. 있으면: `defineApp({ state, zones, modules })` 하나로 앱이 OS 위에 올바르게 올라가는 것이 보장.

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| defineApp | ✅ | integration tests | `os-sdk/app/defineApp/` | Unique entry point |
| State | ✅ | — | `initialState` config | |
| Selector | ✅ | — | `defineSelector()` | State derivation |
| Condition | ✅ | — | `defineCondition()` | Reusable predicates |
| Zone Handle | ✅ | — | `createZone()` | Zone factory + bind |
| Bind | ✅ | — | `zone.bind()` | 8 callback types |
| Modules | ✅ | — | `os-sdk/app/modules/` | history, persistence, deleteToast, router |
| TestInstance | ✅ | all headless tests | `app.create()` | Headless test API |

---

## 18. Verification (검증)

**Why** — "브라우저에서 확인해주세요"는 AI 에이전트에게 불가능한 요청이다. 1,000개 상호작용을 사람이 눈으로 검증하는 것도 불가능하다. DOM 없이 상호작용을 검증할 수 있어야 자동화와 신뢰가 가능하다.

**How** — OS가 상태를 가상으로 소유하고 있다면(Focus, Selection, ARIA — 전부 데이터), DOM 없이도 "클릭 → 상태 변경 → ARIA 속성 확인"이 가능하다. 브라우저는 최종 투영일 뿐, 검증에는 불필요하다.

**What** — HeadlessPage가 Playwright와 동일한 API(`click`, `press`, `locator`, `attrs`)를 DOM 없이 제공. `computeItem()`이 Zone 상태에서 ARIA 속성을 직접 계산. Inspector(TestBot)가 인간을 위한 시각적 검증 제공. 이중 검증 시스템.

**If** — 없으면: Playwright로 브라우저를 띄워서 E2E 테스트. 느리고, CI 환경에서 불안정. 있으면: vitest에서 ms 단위로 상호작용을 검증. Vercel agent-browser가 93% 토큰을 절약했다면, 우리는 DOM 자체가 없으므로 100%.

> 관련 프로젝트: [`1-project/testing/`](1-project/testing/)

| Feature | Status | Tests | Source | Notes |
|---------|--------|-------|--------|-------|
| HeadlessPage | ✅ | 41 test files | `os-devtool/testing/page.ts` | Playwright subset API |
| Headless Compute | ✅ | — | `computeItem`, `computeAttrs` | DOM-free ARIA calc |
| Headless Simulate | ✅ | — | `simulate.ts` | click, press, type |
| Cross-Zone Test | 🔧 | — | — | Single zone only. [OG-018](5-backlog/os-gaps.md) |
| Inspector (TestBot) | ✅ | browser E2E | `TestBotRegistry.ts` | Visual verification |

---

## Proposed Modules (미착수)

> 출처: [VISION.md §5.2](2-area/official/VISION.md)

| Module | Pipeline | Dependency | Priority | Notes |
|--------|----------|------------|----------|-------|
| Window Management | Spatial | Focus, Focus Stack | — | Z-order, multi-panel |
| Pointer Unification | Input | Focus | — | mouse + touch + pen 통합 |
| Touch Gesture | Input | Pointer | — | swipe, pinch, long-press |
| Drag & Drop | Behavior | Focus, Select, ARIA | — | Visual DnD + keyboard DnD |
| Context Menu | Behavior | Overlay, ARIA, Select | — | Right-click / Shift+F10 |
| Search / Filter | Behavior | Focus, Navigate | — | Multi-char, highlight |
| Transition | Output | ARIA | — | Animation + reduced-motion |
| Sound | Output | (독립) | — | Web Audio feedback |

---

## OS Gaps (알려진 결함)

> 전체 목록: [`5-backlog/os-gaps.md`](5-backlog/os-gaps.md)

| ID | Category | Summary | Status |
|----|----------|---------|--------|
| OG-004 | Builder | data-drag-handle 수동 부착 | Pending |
| OG-005 | Builder | 커서 메타 등록 API 없음 | Pending |
| OG-009 | os-core | Modifier keybindings 하드코딩 | Pending |
| OG-010 | os-core | Trigger → inputmap 흡수 | Pending |
| OG-013 | os-core | trigger:"change" headless commit | Pending |
| OG-014 | os-core | Cross-zone editingItemId | Pending |
| OG-015 | os-core | Overlay Escape dismiss (headless) | Pending |
| OG-016 | os-core | Dialog Tab trap (headless) | Pending |
| OG-017 | os-core | Dialog Enter confirm (headless) | Pending |
| OG-018 | os-core | Cross-zone headless test | Pending |

---

## APG Pattern Coverage

> 관련 프로젝트: [`1-project/apg/apg-suite/`](1-project/apg/apg-suite/)

| Pattern | Component | Test | Headless Green | Notes |
|---------|-----------|------|----------------|-------|
| accordion | ✅ | ✅ | 🚧 | |
| button | ✅ | ✅ | 🚧 | |
| carousel | ✅ | ✅ | 🚧 | |
| checkbox | ✅ | ✅ | 🚧 | |
| combobox | ✅ | ✅ | 🚧 | App export 없음 |
| dialog | ✅ | ✅ | 🚧 | App export 없음 |
| disclosure | ✅ | ✅ | 🚧 | |
| dropdown-menu | ✅ | ✅ | 🚧 | App export 없음 |
| feed | ✅ | ✅ | 🚧 | |
| listbox | ✅ | ✅ | 🚧 | App export 없음 |
| menu | ✅ | ✅ | 🚧 | App export 없음 |
| menu-button | ✅ | ✅ | 🚧 | |
| meter | ✅ | ✅ | 🚧 | |
| navtree | ✅ | ✅ | 🚧 | App export 없음 |
| radiogroup | ✅ | ✅ | 🚧 | |
| slider | ✅ | ✅ | 🚧 | |
| spinbutton | ✅ | ✅ | 🚧 | |
| switch | ✅ | ✅ | 🚧 | |
| tabs | ✅ | ✅ | 🚧 | |
| toolbar | ✅ | ✅ | 🚧 | App export 없음 |
| tooltip | ✅ | ✅ | 🚧 | |
| tree | ✅ | ✅ | 🚧 | |
| treegrid | ✅ | ✅ | 🚧 | |

> **22/22** 패턴 컴포넌트+테스트 존재. Headless Green 진행 중 ([apg-suite](1-project/apg/apg-suite/BOARD.md))

---

## Packages

| Package | Purpose | Entry |
|---------|---------|-------|
| `@kernel` | Command dispatch engine | `packages/kernel/` |
| `@os-core` | OS commands, registries, headless | `packages/os-core/` |
| `@os-react` | React listeners, ZIFT components | `packages/os-react/` |
| `@os-sdk` | App framework (defineApp, collection, modules) | `packages/os-sdk/` |
| `@os-devtool` | Testing (HeadlessPage, TestBot) | `packages/os-devtool/` |
| `@surface` | Surface rendering (TBD) | `packages/surface/` |
