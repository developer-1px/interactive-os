# Interactive OS — Vision

> **Status**: Working Draft  
> **Date**: 2026-02-18  
> **Editor**: @1px

---

## Abstract

Interactive OS는 웹 애플리케이션을 위한 **상호작용 인프라**(Interaction Infrastructure)다.

데스크탑에는 AppKit이 있고, 모바일에는 UIKit이 있다. 웹에는 없다.  
Interactive OS가 그 자리를 채운다.

모든 기능은 모듈로 제공되며, 앱은 필요한 모듈만 설치해서 가져간다.

---

## 1. Problem — 웹에는 상호작용 인프라가 없다

데스크탑 운영체제는 **UI 툴킷**을 제공한다. macOS의 AppKit, Windows의 Win32, iOS의 UIKit — 이들은 "앱이 사용자와 상호작용하는 방법"을 시스템 수준에서 보장한다.

어떤 macOS 앱을 열어도:

- Tab은 예측 가능하게 움직인다
- Cmd+C는 항상 복사한다
- Escape는 항상 닫는다
- VoiceOver는 항상 동작한다

사용자는 새 앱을 배우는 것이 아니라, **이미 아는 행동을 새 맥락에 적용**한다.

**웹에는 이 계약이 존재하지 않는다.** HTML은 구조를 제공하고, CSS는 표현을 제공하지만, **상호작용(Interaction)**은 각 앱이 처음부터 만들어야 한다. React 앱은 빈 캔버스다. `<div>` 위에 포커스, 키보드 네비게이션, 선택, 접근성을 모두 직접 구현해야 한다.

그 결과:

- **모든 앱이 같은 문제를 다르게 해결한다.** 포커스 관리, 키보드 네비게이션, 선택 로직 — 앱마다 작동 방식이 다르다.
- **접근성이 누락된다.** ARIA는 1,000페이지 스펙이다. 대부분의 개발자가 올바르게 구현하지 못한다.
- **키보드 사용자가 고립된다.** 마우스 중심 설계에서 키보드는 사후 보강이 되고, 일관성 없는 단축키가 사용자를 혼란시킨다.
- **코드가 중복된다.** `onKeyDown` 핸들러, `useState(selectedIndex)`, 포커스 복원 로직 — 매 앱, 매 컴포넌트에서 반복된다.

---

## 2. Vision — 보편적 상호작용 계약

Interactive OS는 **사용자의 의도(Intent)와 앱의 반응(Response) 사이의 보편적 계약**을 제공한다.

앱 개발자는 **"이 영역은 리스트처럼 행동한다"**고 선언하기만 하면, Interactive OS가 나머지를 보장한다:

- 방향키로 탐색할 수 있다
- Tab으로 영역을 넘나들 수 있다
- Enter로 활성화할 수 있다
- 스크린 리더가 올바르게 읽는다
- 선택, 삭제, 복사가 시스템 규칙대로 동작한다

**앱은 의도를 선언하고, OS가 실행을 보장한다.**

---

## 3. Core Principle — 행동은 형태에 종속되지 않는다

Interactive OS는 **컴포넌트 라이브러리가 아니다.**

| 접근 | 제공하는 것 | 한계 |
|------|-----------|------|
| 컴포넌트 라이브러리 (Radix, Headless UI) | "이 Dialog 컴포넌트를 쓰세요" | 행동이 형태에 갇힌다. 라이브러리의 컴포넌트를 쓰지 않으면 행동도 없다 |
| 훅 라이브러리 (React Aria) | "이 useListBox 훅을 쓰세요" | 패턴별 분리. 시스템 수준 통합 없음. 프레임워크 종속 |
| **Interactive OS** | "당신의 UI가 행동하게 해줄게요" | 행동이 형태에 독립적. 어떤 `<div>`든 리스트, 메뉴, 다이얼로그처럼 행동할 수 있다 |

행동(Behavior)이 형태(Appearance)에 종속되면 보편성을 잃는다. Interactive OS는 행동만 제공하고, 형태는 앱이 결정한다.

---

## 4. Architecture — Intent → Response Pipeline

사용자의 의도가 앱의 반응으로 변환되는 과정은 4단계 파이프라인으로 구성된다.

```
사용자 의도 (Intent)
    │
    ▼
┌─────────────────────────────────────────┐
│ ① 인지 (Spatial Model)                  │
│ "사용자가 어디에 있는가"                   │
│ → Focus, Zone, Focus Stack, Window       │
├─────────────────────────────────────────┤
│ ② 해석 (Input Translation)              │
│ "사용자가 무엇을 원하는가"                 │
│ → Keyboard, Pointer, Touch, Gamepad      │
├─────────────────────────────────────────┤
│ ③ 실행 (Behavior)                        │
│ "의도에 맞는 행동을 수행한다"               │
│ → Navigate, Select, Tab, DnD, Search     │
├─────────────────────────────────────────┤
│ ④ 피드백 (Output / Perception)           │
│ "결과를 사용자에게 전달한다"                │
│ → ARIA, Animation, Sound                 │
└─────────────────────────────────────────┘
    │
    ▼
앱의 반응 (Response)
```

모든 OS 모듈은 이 파이프라인의 한 단계에 속한다. 파이프라인 아래에는 **Kernel** — 범용 커맨드 처리 엔진 — 이 기반으로 놓인다.

---

## 5. Module Ecosystem

Interactive OS는 모놀리스가 아니다. **각 기능이 독립 모듈**로 제공되며, 앱은 필요한 모듈만 설치한다.

### 5.1 Module Map — Implemented (✅)

소스코드와 테스트로 검증된 구현 완료 모듈.

| Pipeline | Module | Source | Unit Tests | E2E Tests |
|----------|--------|--------|------------|-----------|
| **Foundation** | **Kernel** `@frozen` | `packages/kernel/src/createKernel.ts` | 521 tests | — |
| **① Spatial** | **Focus** | `os/3-commands/focus/` | `navigate.test`, `recover.test`, `sync-focus.test`, `virtualFocus.test` | `focus-showcase.spec` (26) |
| | **Focus Stack** | `os/3-commands/focus/stack.ts` | `stack.test` | `focus-showcase.spec` |
| **② Input** | **Keyboard** | `os/1-listeners/KeyboardListener.tsx`, `os/keymaps/` | `keybindings.test`, `command-when.test`, `mac-fallback.test` | all E2E |
| | **Mouse/FocusIn** | `os/1-listeners/FocusListener.tsx` | `zoneRegistry.test` | all E2E |
| | **Clipboard (native)** | `os/1-listeners/ClipboardListener.tsx` | `clipboard-commands.test` | `dogfooding.spec` |
| **③ Behavior** | **Navigate** | `os/3-commands/navigate/` (7 files: resolve, strategies, entry, focusFinder, cornerNav, typeahead) | `navigate.test` (30+), `typeahead.test` (12) | `focus-showcase.spec`, `grid.spec`, `tree.spec` |
| | **Tab** | `os/3-commands/interaction/tab.ts`, `resolveTab.ts` | `tab.test` | `focus-showcase.spec` |
| | **Select** | `os/3-commands/selection/` (select, selectAll, selection) | `multi-select-commands.test`, `os-commands.test` | `focus-showcase.spec`, `listbox.spec` |
| | **Activate** | `os/3-commands/interaction/activate.ts` | `os-commands.test` | all ARIA showcase E2E |
| | **Escape / Dismiss** | `os/3-commands/interaction/escape.ts`, `resolveEscape.ts` | `escape.test` | `focus-showcase.spec`, `dialog.spec` |
| | **Expand** | `os/3-commands/expand/` | `expand.test` | `tree.spec` |
| | **Field** | `os/3-commands/field/field.ts` | `field.test` (14) | — |
| | **Overlay** | `os/3-commands/overlay/overlay.ts` | `overlay.test` (9) | `dialog.spec` |
| | **Move** | `os/3-commands/interaction/move.ts` | `os-commands.test` | `dogfooding.spec` |
| | **Undo/Redo** | `os/3-commands/interaction/undo.ts`, `redo.ts` + `os/middlewares/historyKernelMiddleware.ts` | `history.test` (13) | `dogfooding.spec` |
| **④ Output** | **ARIA** | `os/registries/roleRegistry.ts` (17 roles × 9 fields) | `rolePresets.test`, `roleHelpers.test` | all ARIA showcase E2E (9 specs) |
| | **Focus Effect** | `os/4-effects/index.ts` (focus, scroll) | — | all E2E |

### 5.2 Module Map — Proposed (📋)

구현되지 않았으나 파이프라인 분석에서 도출된 다음 단계 모듈.

#### ① Spatial: Window Management

> **Status**: 📋 Proposal

**Problem**: 현재 OS는 하나의 평면(flat surface)만 관리한다. 실제 앱은 여러 패널, 윈도우, 레이어가 중첩된다. 어느 윈도우가 "위"에 있는지(Z-order), 활성 윈도우가 무엇인지 시스템이 모른다.

**Proposed Scope**:
- Z-order를 시스템 상태로 관리
- 활성 윈도우 추적 (Focus의 상위 개념)
- 윈도우 간 포커스 전환
- 최소화/최대화/타일링 상태 관리

**Dependency**: Focus, Focus Stack

---

#### ② Input: Pointer Unification

> **Status**: 📋 Proposal

**Problem**: 현재 마우스 입력은 `FocusListener`의 `mousedown`/`focusin` 이벤트로 처리된다. 터치, 펜, 트랙패드는 별도 추상화가 없다. 동일한 "클릭" 의도가 입력 장치에 따라 다른 코드 경로를 탄다.

**Proposed Scope**:
- `PointerEvent` 기반 통합 입력 처리 (mouse + touch + pen)
- 제스처 인식: tap, double-tap, long-press
- Hover 상태 관리 (터치 디바이스에서는 hover가 없음)
- `FocusListener`의 마우스 로직을 Pointer 모듈로 흡수

**Dependency**: Focus

---

#### ② Input: Touch Gesture

> **Status**: 📋 Proposal

**Problem**: 모바일/태블릿 환경에서 스와이프로 네비게이션, 핀치로 줌, 롱프레스로 컨텍스트 메뉴 — 이런 제스처가 키보드 커맨드와 동등한 의미를 가져야 한다. 현재 OS는 터치 제스처를 인식하지 못한다.

**Proposed Scope**:
- 스와이프 → `NAVIGATE({ direction })` 매핑
- 롱프레스 → `CONTEXT_MENU()` 또는 `SELECT(toggle)` 매핑
- 핀치 → 줌/확대 커맨드 매핑
- 제스처와 키보드 커맨드의 1:1 대응 테이블

**Dependency**: Pointer Unification, Navigate, Select

---

#### ③ Behavior: Drag & Drop

> **Status**: 📋 Proposal

**Problem**: 아이템 재배치(reordering), 영역 간 이동(cross-zone transfer), 파일 업로드 등의 드래그 앤 드롭은 대부분의 프로덕션 앱에서 필수다. 현재 OS의 `OS_MOVE_UP/DOWN` 커맨드는 키보드 기반 재배치만 지원하며, DnD의 시각적 피드백과 드롭 타겟 관리가 없다.

**Proposed Scope**:
- `DRAG_START`, `DRAG_MOVE`, `DRAG_END`, `DROP` 커맨드
- 드래그 중 포커스/선택 상태 보존
- 드롭 타겟 하이라이트 (시각적 피드백)
- 키보드 DnD (방향키 + modifier로 아이템 이동)
- 접근성: `aria-grabbed`, `aria-dropeffect`
- 영역 간 이동 (Zone A → Zone B)

**Dependency**: Focus, Select, ARIA

---

#### ③ Behavior: Context Menu

> **Status**: 📋 Proposal

**Problem**: 우클릭/롱프레스로 컨텍스트 메뉴를 여는 패턴은 보편적이다. 현재 OS의 `menu` role preset은 메뉴의 키보드 동작(방향키, Enter, Escape)을 지원하지만, "메뉴를 여는 트리거"는 앱이 직접 관리해야 한다.

**Proposed Scope**:
- `CONTEXT_MENU_OPEN({ position, items })` 커맨드
- 우클릭 + 롱프레스 입력을 일관된 커맨드로 변환
- 현재 선택된 아이템에 따른 동적 메뉴 구성
- 기존 `menu` role preset과 통합

**Dependency**: Overlay, ARIA, Select

---

#### ③ Behavior: Search / Filter

> **Status**: 📋 Proposal

**Problem**: 리스트/트리/그리드에서 "타이핑으로 검색"은 보편적 패턴이다. 현재 `typeaheadFallbackMiddleware`가 단일 문자 매칭을 하지만, 다중 문자 검색, 필터링, 하이라이트는 지원하지 않는다.

**Proposed Scope**:
- `SEARCH({ query })` 커맨드
- Zone 내 아이템 필터링 (DOM 기반)
- 검색어 하이라이트 (mark/highlight)
- 기존 typeahead의 상위 호환
- Command Palette(`QuickPick`)과의 통합

**Dependency**: Focus, Navigate

---

#### ④ Output: Transition

> **Status**: 📋 Proposal

**Problem**: 포커스 이동, 선택 변경, 오버레이 열기-닫기 등 상태 변경 시 시각적 전환 효과를 시스템 수준에서 관리할 필요가 있다. 현재는 CSS만으로 처리하며, OS가 전환 타이밍/종류를 제어하지 않는다.

**Proposed Scope**:
- 상태 변경 → 전환 유형 매핑 테이블 (focus-move → instant, overlay-open → slide-up 등)
- `prefers-reduced-motion` 시스템 설정 자동 반영
- 전환 중 상호작용 잠금 (전환 완료 전 입력 대기)
- 전환 효과의 선언적 정의 (앱이 커스터마이즈 가능)

**Dependency**: ARIA (전환 상태를 live region으로 전달)

---

#### ④ Output: Sound

> **Status**: 📋 Proposal

**Problem**: 데스크탑 OS는 상호작용에 사운드 피드백을 제공한다(삭제 시 휴지통 소리, 오류 시 경고음). 웹 앱은 이 피드백이 없어 시각 장애인에게 특히 불리하다.

**Proposed Scope**:
- 커맨드 → 사운드 매핑 테이블 (delete → crumple, error → alert 등)
- Web Audio API 기반 저지연 재생
- 볼륨/음소거 시스템 설정
- `prefers-reduced-motion` 연동 (모션 감소 시 사운드도 감소)

**Dependency**: 독립 (Foundation 위에서 동작)

---

### 5.3 Composition

모듈은 조합 가능하다. 조합이 앱의 성격을 결정한다.

| 앱 유형 | 필요한 모듈 |
|---------|-----------|
| 간단한 리스트 | Focus + Navigate + ARIA |
| 선택 가능한 리스트 | Focus + Navigate + Select + ARIA |
| Kanban 보드 | Focus + Navigate + Select + DnD + ARIA |
| 텍스트 에디터 | Focus + Keyboard + Field + Clipboard + ARIA |
| 이메일 클라이언트 | Focus + Navigate + Select + Tab + Overlay + Clipboard + Search + ARIA |

---

## 6. Design Decisions

### 6.1 행동 우선, 형태 후순

OS는 행동(Behavior)을 제공한다. 형태(Appearance)는 앱이 결정한다. `<div>`든 `<canvas>`든 `<custom-element>`든, 행동은 동일하게 적용된다.

### 6.2 선언적 계약

앱은 `role`을 선언한다. OS가 그 role에 맞는 행동을 실행한다. 앱 코드에 `addEventListener`, `useState`, `useEffect`가 0줄인 세계를 지향한다.

### 6.3 Kernel 위의 모든 것

모든 모듈은 Kernel의 커맨드 파이프라인 위에서 동작한다. 입력이 무엇이든(키보드, 마우스, 테스트 봇) 동일한 커맨드로 변환되고, 동일한 파이프라인을 통과한다.

### 6.4 점진적 채택

전부 쓸 필요 없다. Focus만 필요하면 Focus만 설치한다. 나중에 Selection이 필요하면 추가한다. 모듈 간 결합도를 최소화하여 점진적 채택을 보장한다.

---

## References

- [W3C WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Apple Human Interface Guidelines — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [re-frame: Effects as Data](https://day8.github.io/re-frame/)
- [Nielsen Norman Group — Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

---

## Status of This Document

이 문서는 **Working Draft**다. Interactive OS의 비전과 방향을 기술하며, 구현이 진행됨에 따라 갱신된다. 안정화되면 **Candidate Recommendation** → **Recommendation**으로 승격된다.

| Maturity Level | 의미 |
|---------------|------|
| **Working Draft (WD)** | 작성 중. 구조와 방향이 변경될 수 있음 |
| **Candidate Recommendation (CR)** | 구현으로 검증 중. 큰 방향은 확정 |
| **Recommendation (REC)** | 확정. 구현이 이 문서를 따름 |
