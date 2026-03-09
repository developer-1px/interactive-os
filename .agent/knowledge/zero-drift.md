# Zero Drift — OS와 DOM의 경계

> headless 테스트가 통과하면 DOM도 동일하게 동작한다.
> 이것이 Zero Drift 약속이다. 이 문서는 그 경계를 정의한다.

---

## 원칙

**OS에서 닫을 수 있으면 무조건 OS가 닫는다.**
컴포넌트 개발자가 올바르게 해야 하는 것은 OS의 실패다.

---

## 경계: OS 소유 vs DOM 전용

### OS가 소유하는 것 (headless에서 100% 검증 가능)

| 관심사 | OS 메커니즘 | headless 대응 |
|--------|------------|--------------|
| ARIA 속성 투영 | `computeItem()` | 동일 함수 호출 |
| 포커스 상태 | `OS_FOCUS` → `zone.focusedItemId` | `page.focusedItemId()` |
| 선택 상태 | `OS_SELECT` → `zone.items[id]["aria-selected"]` | `page.selection()` |
| 확장 상태 | `OS_EXPAND` → `zone.items[id]["aria-expanded"]` | `page.attrs(id)` |
| 값 상태 | `OS_VALUE_CHANGE` → `zone.valueNow[id]` | `page.attrs(id)["aria-valuenow"]` |
| 키보드 해석 | `resolveKeyboard()` → Command | `page.keyboard.press()` |
| 오버레이 스택 | `OS_OVERLAY_OPEN/CLOSE` → `overlays.stack` | `page.dispatch()` |
| 탐색 순서 | `resolveNavigate()` → next item | `page.keyboard.press("ArrowDown")` |
| 초기 상태 | `goto({ initial })` / Zone config | `page.goto()` |

### DOM 전용 (headless가 모사할 수 없는 것)

이것들은 물리 세계의 관심사다. OS는 이것들을 `defineEffect`로 위임한다.

| 관심사 | 왜 DOM 전용인가 | OS 위임 메커니즘 |
|--------|----------------|-----------------|
| **DOMRect** (getBoundingClientRect) | 물리 레이아웃은 렌더 엔진이 결정 | `dom-rects` context (mock 가능) |
| **DOM focus** (el.focus()) | 브라우저 포커스 링은 물리 API | `defineEffect("focus", ...)` |
| **scroll** (scrollIntoView) | 뷰포트는 물리 개념 | `defineEffect("scroll", ...)` |
| **input.value** (contentEditable) | 텍스트 편집은 브라우저 엔진 | `FieldRegistry` + DOM sync |
| **caretRangeFromPoint** | 물리 좌표 → 텍스트 위치 | PointerListener 내 inline |
| **dialog.showModal()** | native modal은 브라우저 API | `useEffect` (Trigger.Portal) |

**핵심**: DOM 전용 목록은 **닫힌 집합**이다. 여기에 없으면 OS가 소유한다.

---

## Drift가 발생하는 3개 레이어

### Layer 1: 초기화 타이밍 (Initialization Gap)

| | headless | browser |
|--|---------|---------|
| 동작 | `page.goto()` → 즉시 `setState` | Zone mount → useLayoutEffect → 자식 mount → useEffect |
| 성격 | 동기, 원자적 | 비동기, 다단계 |

**증상**: 컴포넌트가 `useEffect`에서 `OS_VALUE_CHANGE` dispatch → Zone 미등록 상태에서 실행 → 값 손실.

**OS 해결**: 선언적 초기화. Zone config 또는 role preset에 `initial` 선언 → Zone 등록 시점에 원자 적용. `useEffect` dispatch 금지 (설계 원칙 #32, #33).

### Layer 2: 렌더 사이클 (Render Cycle Gap)

| | headless | browser |
|--|---------|---------|
| 동작 | 상태 변경 → 즉시 assertion | 상태 변경 → re-render → 조건부 mount → useEffect |
| 성격 | 0프레임 | 최소 2프레임 |

**증상**: `OS_OVERLAY_OPEN` → Popover 조건부 렌더 → Zone mount → Item mount → autoFocus. 여러 렌더 사이클에 걸쳐 발생. headless에서는 존재하지 않는 과정.

**OS 해결**: focus intent를 상태에 저장. `OS_OVERLAY_OPEN`의 `entry: "first" | "last"` 필드를 Zone mount 시점에 소비하여 즉시 focus. Overlay의 autoFocus를 OS 상태 기반으로 전환.

### Layer 3: 이벤트 전파 (Event Propagation Gap)

| | headless | browser |
|--|---------|---------|
| 동작 | `simulateKeyPress` → 단일 경로 | keydown → OS dispatch + native synthetic click |
| 성격 | 1 경로 | N 경로 (브라우저가 추가 이벤트 생성) |

**증상**: `<button>` 위에서 Enter → KeyboardListener가 OS_EXPAND dispatch + 브라우저가 synthetic click 생성 → PointerListener가 inputmap["click"]으로 OS_EXPAND 재실행 → 이중 toggle.

**OS 해결**: 두 가지 선택지:
1. **OS가 막는다**: inputmap["click"]이 있는 role에서 Enter 처리 시 synthetic click 무시 가드
2. **headless가 모사한다**: `simulateKeyPress("Enter")` 시 inputmap["click"]도 실행

원칙에 따라 **1번**(OS가 막는다)이 맞다. 이중 실행은 컴포넌트 개발자의 실수가 아니라 브라우저의 동작이므로, OS가 구조적으로 방어해야 한다.

---

## Items 단일 경로 원칙

> **Items 해석 경로는 하나여야 한다: ZoneRegistry.getItems().**

headless와 browser가 서로 다른 getItems 함수를 호출하면 drift가 발생한다.
테스트 전용 getItems(scenario.getItems, 수동 getSidebarItems 등)는 금지.

- `runScenarios`는 `getZoneItems(zoneId)` → ZoneRegistry에서 items 해석
- browser TestBot도 동일한 `ZoneRegistry.getItems()` 경로
- binding-provided getItems와 projection getItems 모두 ZoneRegistry를 경유

**위반 증상**: headless N PASS / browser M FAIL — 같은 스크립트가 다른 items를 받아 다른 결과.

---

## 검증 기준

Zero Drift가 지켜지고 있는지 판단하는 체크리스트:

1. headless 테스트에 `setTimeout`, `await tick()`, `waitFor` 등 타이밍 코드가 있으면 drift 신호
2. 컴포넌트에서 `useEffect` + `os.dispatch`로 초기값을 설정하면 drift 신호
3. TestBot 스크립트가 headless 테스트와 다른 assertion을 가지면 drift 신호
4. DOM 전용 목록(위 표) 외의 것이 headless에서 동작하지 않으면 OS gap
5. testbot 파일에 수동 getItems/items 상수가 있으면 drift 신호 — ZoneRegistry 경로를 사용해야 함
