# FocusGroup 구현 네이밍 가이드

## 📦 인터페이스 / 타입

```typescript
// 메인
interface FocusGroupProps
interface FocusGroupState
interface FocusGroupContext
interface FocusGroupConfig
interface FocusGroupOptions

// 이벤트
interface FocusEvent
interface KeyboardEvent
interface PointerEvent
interface SelectionEvent
interface NavigationEvent

// 아이템
interface FocusableItem
interface FocusableElement
interface ItemDescriptor
interface ItemMetadata
interface ItemNode

// 상태
interface FocusState
interface SelectionState
interface ActivationState
interface ExpansionState

// 결과
interface NavigationResult
interface FocusResult
interface SelectionResult

// 옵션
interface MovementOptions
interface SelectionOptions
interface ActivationOptions
interface BoundaryOptions

// 유틸
interface Position
interface Rect
interface Bounds
interface Range
```

---

## 📊 변수 / 상태

### 인덱스 & 카운트
```typescript
// 현재 위치
currentIndex: number
activeIndex: number
focusedIndex: number
selectedIndex: number

// 이전 위치
prevIndex: number
previousIndex: number
lastIndex: number

// 다음 위치
nextIndex: number

// 범위
firstIndex: number
lastIndex: number
startIndex: number
endIndex: number

// 카운트
itemCount: number
totalItems: number
visibleCount: number
selectedCount: number
```

### 요소 참조
```typescript
// 단일 요소
currentElement: HTMLElement
activeElement: HTMLElement
focusedElement: HTMLElement
targetElement: HTMLElement

// 복수 요소
items: HTMLElement[]
focusableItems: HTMLElement[]
selectedItems: HTMLElement[]
visibleItems: HTMLElement[]
allItems: HTMLElement[]

// 컨테이너
container: HTMLElement
containerRef: Ref<HTMLElement>
groupRef: Ref<HTMLElement>
listRef: Ref<HTMLElement>
```

### 상태 플래그
```typescript
// 포커스
isFocused: boolean
hasFocus: boolean
isFocusVisible: boolean
isFocusWithin: boolean

// 선택
isSelected: boolean
hasSelection: boolean
isMultiSelect: boolean
isRangeSelect: boolean

// 활성화
isActive: boolean
isActivated: boolean
isExpanded: boolean
isCollapsed: boolean

// 상태
isDisabled: boolean
isEnabled: boolean
isReadOnly: boolean
isHidden: boolean
isVisible: boolean

// 진행
isLoading: boolean
isPending: boolean
isProcessing: boolean
isDragging: boolean
isHovering: boolean
```

### 맵 & 세트
```typescript
// Map
itemsMap: Map<string, HTMLElement>
stateMap: Map<string, State>
indexMap: Map<HTMLElement, number>
idMap: Map<string, number>

// Set
selectedSet: Set<string>
disabledSet: Set<number>
expandedSet: Set<string>
focusableSet: Set<HTMLElement>

// 배열
selectedIndices: number[]
selectedIds: string[]
disabledIndices: number[]
```

### 메타데이터
```typescript
// ID
id: string
itemId: string
groupId: string
activeId: string

// 키
key: string
itemKey: string
selectionKey: string

// 레이블
label: string
ariaLabel: string
describedBy: string
labelledBy: string

// 역할
role: string
itemRole: string
```

---

## 🔧 함수 / 메서드

### 포커스 관리
```typescript
// 포커스 이동
focus(index: number)
focusItem(item: HTMLElement)
focusFirst()
focusLast()
focusNext()
focusPrev()
focusAt(index: number)

// 포커스 검색
findFocusable()
findNextFocusable()
findPrevFocusable()
getFocusableElements()
getFirstFocusable()
getLastFocusable()

// 포커스 상태
setFocus(index: number)
moveFocus(direction: Direction)
updateFocus(index: number)
restoreFocus()
saveFocus()

// 포커스 쿼리
isFocusable(element: HTMLElement)
canFocus(index: number)
hasFocus()
getFocusedIndex()
getFocusedElement()
```

### 네비게이션
```typescript
// 방향 이동
moveNext()
movePrev()
moveFirst()
moveLast()
moveUp()
moveDown()
moveLeft()
moveRight()

// 계산
getNextIndex()
getPrevIndex()
getNextFocusable()
getPrevFocusable()
calculateNext(current: number)
calculatePrev(current: number)

// 경계
handleBoundary(index: number)
checkBoundary(index: number)
isAtStart()
isAtEnd()
shouldLoop()
shouldWrap()

// 검색
search(query: string)
typeahead(char: string)
findByChar(char: string)
matchItem(item: HTMLElement, query: string)
```

### 선택 관리
```typescript
// 선택
select(index: number)
selectItem(item: HTMLElement)
selectAll()
selectRange(start: number, end: number)
toggleSelection(index: number)

// 해제
deselect(index: number)
deselectAll()
clearSelection()

// 상태
setSelected(index: number, selected: boolean)
updateSelection(indices: number[])
isSelected(index: number)
getSelectedIndices()
getSelectedItems()
getSelection()

// 다중 선택
addToSelection(index: number)
removeFromSelection(index: number)
toggleInSelection(index: number)
selectMultiple(indices: number[])
```

### 활성화
```typescript
// 활성화
activate(index: number)
activateItem(item: HTMLElement)
deactivate()
toggleActivation(index: number)

// 확장/축소
expand(index: number)
collapse(index: number)
toggleExpand(index: number)
expandAll()
collapseAll()

// 실행
execute(index: number)
trigger(index: number)
invoke(index: number)
perform(action: Action)
```

### 이벤트 핸들러
```typescript
// 키보드
handleKeyDown(event: KeyboardEvent)
handleKeyUp(event: KeyboardEvent)
onKeyDown(event: KeyboardEvent)
onKeyPress(event: KeyboardEvent)

// 포인터
handlePointerDown(event: PointerEvent)
handlePointerUp(event: PointerEvent)
handleClick(event: MouseEvent)
handleDoubleClick(event: MouseEvent)
onPointerDown(event: PointerEvent)
onClick(event: MouseEvent)

// 포커스
handleFocus(event: FocusEvent)
handleBlur(event: FocusEvent)
onFocus(event: FocusEvent)
onFocusIn(event: FocusEvent)
onFocusOut(event: FocusEvent)

// 호버
handleMouseEnter(event: MouseEvent)
handleMouseLeave(event: MouseEvent)
onMouseEnter(event: MouseEvent)
onHover(event: MouseEvent)

// 기타
handleEscape(event: KeyboardEvent)
handleTab(event: KeyboardEvent)
handleOutsideClick(event: MouseEvent)
```

### 유틸리티
```typescript
// 인덱스 유틸
clampIndex(index: number)
normalizeIndex(index: number)
wrapIndex(index: number)
constrainIndex(index: number)
isValidIndex(index: number)

// 요소 유틸
getItemAt(index: number)
getItemById(id: string)
getIndexOf(element: HTMLElement)
findItem(predicate: Predicate)
filterItems(predicate: Predicate)

// 상태 유틸
isDisabled(index: number)
isHidden(index: number)
isVisible(index: number)
shouldSkip(index: number)

// DOM 유틸
scrollIntoView(element: HTMLElement)
ensureVisible(index: number)
getRect(element: HTMLElement)
getBounds()
```

### 초기화 & 정리
```typescript
// 초기화
init()
initialize()
setup()
mount()
create()

// 업데이트
update()
refresh()
sync()
recompute()
rebuild()

// 정리
cleanup()
destroy()
dispose()
unmount()
reset()
clear()
```

---

## 🎯 이벤트 & 콜백

### 이벤트 이름
```typescript
// 포커스
'focus'
'blur'
'focusin'
'focusout'
'focus-change'
'focus-visible'

// 선택
'select'
'selection-change'
'select-all'
'clear-selection'

// 활성화
'activate'
'deactivate'
'expand'
'collapse'

// 네비게이션
'navigate'
'move'
'boundary-reach'
'edge'

// 기타
'dismiss'
'escape'
'outside-click'
'update'
'change'
```

### 콜백 함수
```typescript
// on 접두사
onFocusChange(current: number, prev: number)
onSelectionChange(selected: number[])
onActivate(index: number)
onNavigate(from: number, to: number)
onBoundary(edge: Edge)
onDismiss(reason: Reason)

// handle 접두사
handleFocusChange(current: number)
handleSelection(indices: number[])

// 리스너
addFocusListener(callback: Callback)
removeFocusListener(callback: Callback)
addEventListener(event: string, callback: Callback)
```

---

## 🔤 상수 / Enum

```typescript
// 방향
enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Next = 'next',
  Prev = 'prev',
  First = 'first',
  Last = 'last'
}

// 키
enum Key {
  Enter = 'Enter',
  Space = ' ',
  Escape = 'Escape',
  Tab = 'Tab',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Home = 'Home',
  End = 'End',
  PageUp = 'PageUp',
  PageDown = 'PageDown'
}

// 모드
enum SelectionMode {
  None = 'none',
  Single = 'single',
  Multiple = 'multiple'
}

enum ActivationMode {
  Manual = 'manual',
  Auto = 'auto',
  Hover = 'hover'
}

enum TabindexStrategy {
  Roving = 'roving',
  Managed = 'managed',
  Natural = 'natural'
}

// 상태
enum FocusState {
  Idle = 'idle',
  Focusing = 'focusing',
  Focused = 'focused',
  Blurred = 'blurred'
}

// 경계
enum Boundary {
  Start = 'start',
  End = 'end',
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right'
}

// 방향성
enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Both = 'both',
  Grid = 'grid'
}

// 상수
const KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  // ...
}

const SELECTORS = {
  FOCUSABLE: '[data-focusable]',
  SELECTED: '[aria-selected="true"]',
  DISABLED: '[aria-disabled="true"]'
}

const DEFAULTS = {
  TYPEAHEAD_TIMEOUT: 1000,
  HOVER_DELAY: 300,
  LONG_PRESS_DURATION: 500
}
```

---

## 🏗️ 클래스 / 모듈

```typescript
// 메인 클래스
class FocusGroup
class FocusManager
class SelectionManager
class NavigationController
class ActivationController

// 유틸 클래스
class FocusTracker
class SelectionTracker
class KeyboardHandler
class PointerHandler
class TypeaheadSearch

// 스토어
class FocusStore
class SelectionStore
class StateStore

// 전략 패턴
interface NavigationStrategy
class LinearNavigation implements NavigationStrategy
class GridNavigation implements NavigationStrategy
class TreeNavigation implements NavigationStrategy

interface SelectionStrategy
class SingleSelection implements SelectionStrategy
class MultipleSelection implements SelectionStrategy

// 빌더
class FocusGroupBuilder
class ConfigBuilder
```

---

## ⚛️ React/Vue Hooks/Composables

### React Hooks
```typescript
// 메인
useFocusGroup()
useFocusManager()
useRovingTabindex()

// 포커스
useFocus(ref)
useFocusVisible()
useFocusWithin()
useFocusTrap()
useAutoFocus()

// 선택
useSelection(options)
useMultiSelect()
useRangeSelect()

// 네비게이션
useNavigation(orientation)
useTypeahead()
useArrowKeys()

// 이벤트
useKeyboardHandler()
usePointerHandler()
useOutsideClick()

// 상태
useFocusState()
useSelectionState()
useActiveDescendant()

// 유틸
useControllable(value, onChange)
useId()
useCallbackRef()
```

### Vue Composables
```typescript
// 메인
useFocusGroup()
useFocusManager()

// 포커스
useFocus(target)
useFocusVisible()
useFocusWithin(target)
useFocusTrap(target)

// 선택
useSelection(options)
useMultiSelect()

// 이벤트
useEventListener(target, event, handler)
useKeyPress(keys, handler)

// Ref
useTemplateRef(name)
useElementRef()
```

---

## 🎨 CSS 클래스

```typescript
// 상태 클래스
'.focus-group'
'.focus-group__item'
'.focus-group__item--focused'
'.focus-group__item--selected'
'.focus-group__item--active'
'.focus-group__item--disabled'
'.focus-group__item--hidden'

// BEM
'.fg'                    // block
'.fg__item'              // element
'.fg__item--focused'     // modifier
'.fg__item--selected'
'.fg--horizontal'        // block modifier
'.fg--vertical'

// 데이터 속성
'[data-focus-group]'
'[data-focusable]'
'[data-focused]'
'[data-selected]'
'[data-disabled]'
'[data-index]'
'[data-orientation]'
```

---

## 📋 Props / Attributes

```typescript
// Props
props: {
  role: string
  orientation: Orientation
  loop: boolean
  disabled: boolean
  autoFocus: boolean
  defaultIndex: number
  selectedIndex: number
  onFocusChange: Function
  onSelectionChange: Function
}

// Data Attributes
'data-focus-group'
'data-focusable'
'data-focus-visible'
'data-focused'
'data-selected'
'data-active'
'data-disabled'
'data-index'
'data-orientation'
'data-role'

// ARIA Attributes
'aria-orientation'
'aria-activedescendant'
'aria-multiselectable'
'aria-selected'
'aria-checked'
'aria-pressed'
'aria-expanded'
'aria-disabled'
'aria-labelledby'
'aria-describedby'
```

---

## 🎲 기타 네이밍 패턴

### Get/Set 패턴
```typescript
getFocusedIndex() / setFocusedIndex(index)
getSelectedItems() / setSelectedItems(items)
getCurrentState() / setCurrentState(state)
getActiveElement() / setActiveElement(element)
```

### Is/Has/Can 패턴
```typescript
isFocusable(element)
isSelected(index)
isDisabled(index)
isVisible(element)

hasFocus()
hasSelection()
hasChildren(index)

canFocus(index)
canSelect(index)
canNavigate(direction)
```

### Check/Validate 패턴
```typescript
checkBoundary(index)
checkFocusable(element)
validateIndex(index)
validateSelection(indices)
```

### Find/Filter/Map 패턴
```typescript
findFocusable()
findNextFocusable()
findItemByIndex(index)

filterFocusable(items)
filterSelected(items)
filterVisible(items)

mapIndicesToItems(indices)
mapItemsToIndices(items)
```

### Create/Build 패턴
```typescript
createFocusGroup(options)
buildNavigation(config)
makeSelectable(element)
initFocus(index)
```

### Update/Sync 패턴
```typescript
updateFocus(index)
updateSelection(indices)
syncTabindex()
syncARIA()
refreshItems()
```

---

## 💡 네이밍 원칙

1. **일관성**: 같은 개념은 같은 용어 사용
    - `current` vs `active` vs `focused` 중 하나로 통일

2. **명확성**: 축약하지 않기
    - `idx` ❌ → `index` ✅
    - `sel` ❌ → `selected` ✅

3. **동사 우선**: 함수는 동사로 시작
    - `focus()`, `select()`, `navigate()`

4. **상태는 형용사**: 불린은 is/has/can
    - `isSelected`, `hasFocus`, `canNavigate`

5. **복수형 일관성**: 배열/컬렉션은 복수형
    - `items`, `selectedIndices`, `focusableElements`

6. **접두사 활용**:
    - `on`: 이벤트 핸들러 (`onFocusChange`)
    - `handle`: 내부 핸들러 (`handleKeyDown`)
    - `get/set`: getter/setter
    - `is/has/can`: 불린 쿼리

이 네이밍 가이드로 일관성 있는 API를 설계할 수 있다.