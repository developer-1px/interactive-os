# Audit: React Effect Hooks 전수 조사

> 생성일: 2026-03-09 00:15
> 기원: /discussion (ZIFT+defineApp 재설계 검토)
> 목적: os-react, os-sdk 내 useEffect/useLayoutEffect 전수 조사 → 제거 가능성 판정

## 요약

**총 29건** (19 파일, 3 패키지)

| 분류 | 건수 | 의미 | 제거 가능? |
|------|------|------|-----------|
| **A: OS 상태 변경** | 7 | os.setState, dispatch, registry write | **1건 제거 대상** (Zone.tsx 초기 상태) |
| **B: DOM 효과** | 9 | el.focus, innerText, showModal, caret | 불가 — DOM이 진실 |
| **C: React 렌더링** | 1 | platform detection | 불가 — React 고유 관심사 |
| **D: 이벤트 리스너** | 9 | pointer, keyboard, clipboard, selection | 불가 — DOM 이벤트 브릿지 |
| **A+D 하이브리드** | 3 | 이벤트 → OS dispatch | 불가 — 파이프라인 입구 |

**결론: 제거 대상은 Zone.tsx의 초기 상태 블록 1건. 나머지 28건은 정당.**

---

## 제거 대상: Zone.tsx useLayoutEffect 초기 상태 (A)

### 위치
`packages/os-react/src/6-project/Zone.tsx:159-263`

### 현재 역할 (3가지를 한꺼번에 수행)
1. **Zone 등록** — `ZoneRegistry.register()` + `bindElement()` → 정당 (React mount 알림)
2. **초기 상태 3종** — `os.setState(produce(...))` for value/select/expand → **제거 대상**
3. **AutoFocus** — `os.dispatch(OS_FOCUS(...))` → **제거 대상** (초기 상태의 일부)

### 왜 제거해야 하나
- `renderToString`에서 useLayoutEffect가 **실행되지 않음**
- headless 경로에서 누락 → `seedInitialState()` 복제 → 3곳 분산
- React의 Phase 2 역할(렌더링만) 경계 위반
- **해결책**: onRegister hook (blueprint T1-T3)

---

## 정당한 효과: 상세 목록

### 1-listen (이벤트 리스너 — 파이프라인 입구, 5건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 1 | `FocusListener.tsx:31` | A+D | `focusin` → `OS_SYNC_FOCUS` dispatch | 불가 — DOM focus 이벤트 브릿지 |
| 2 | `PointerListener.tsx:55` | A+B+D | pointer events → 제스처 인식 → 12+ OS commands | 불가 — 통합 포인터 파이프라인 |
| 3 | `KeyboardListener.tsx:30` | A+D | `keydown` → `resolveKeyboard()` → OS commands | 불가 — 키보드 파이프라인 입구 |
| 4 | `ClipboardListener.tsx:44` | A+D | `copy/cut/paste` → OS_COPY/CUT/PASTE | 불가 — 클립보드 이벤트 |
| 5 | `InputListener.tsx:15` | A+D | `input` → `FieldRegistry.updateValue()` | 불가 — contentEditable 브릿지 |

**패턴**: DOM 이벤트 → OS Command. 이 5개는 **파이프라인 1단계(listen)**의 React 구현. 제거하면 입력을 받을 수 없다.

### 6-project/Zone (등록, 1건 중 정당한 부분)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 6 | `Zone.tsx:159` (등록 부분만) | C | `ZoneRegistry.register()` + `bindElement()` | 불가 — mount 알림은 React의 책임 |

### 6-project/Item (DOM 포커스, 1건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 7 | `Item.tsx:114` | B | `isActiveFocused` → `el.focus()` | 불가 — DOM focus는 DOM이 진실 |

### 6-project/field (Field 생태계, 10건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 8 | `Field.tsx:202` | A | FieldRegistry.register() | 불가 — 필드 등록 |
| 9 | `Field.tsx:254` | B | 부모 Item editing 상태 DOM 조회 | 불가 — DOM ancestry |
| 10 | `Field.tsx:284` | A | prop value → FieldRegistry 동기화 | 불가 — 외부→내부 sync |
| 11 | `Field.tsx:294` | B | 초기 innerText 설정 | 불가 — DOM 초기화 |
| 12 | `Field.tsx:306` | A+B | 편집 종료 시 값 복원 + commit | 불가 — deferred mode 상태머신 |
| 13 | `Field.tsx:350` | A+D | input/blur/keydown 리스너 → commit | 불가 — contentEditable 이벤트 |
| 14 | `FieldInput.tsx:104` | A | FieldRegistry.register() | 불가 — input 필드 등록 |
| 15 | `FieldInput.tsx:130` | A | prop value → FieldRegistry 동기화 | 불가 |
| 16 | `FieldTextarea.tsx:107` | A | FieldRegistry.register() | 불가 |
| 17 | `FieldTextarea.tsx:133` | A | prop value → FieldRegistry 동기화 | 불가 |
| 18 | `useField.ts:45` | A+D | selectionchange → caret position 추적 | 불가 — DOM Selection API |
| 19 | `useField.ts:65` | B | editing 진입 시 el.focus() + caret | 불가 — DOM focus |
| 20 | `useField.ts:101` | B | editing 전환 시 caret 복원 | 불가 — DOM caret |

**패턴**: Field는 DOM이 진실인 영역. FieldRegistry는 DOM 상태의 OS 측 미러.

### 6-project/trigger (트리거 등록, 4건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 21 | `TriggerBase.tsx:133` | A | ZoneRegistry.setItemCallback() | 불가 — 트리거 콜백 등록 |
| 22 | `TriggerDismiss.tsx:37` | A | dismiss 콜백 등록 | 불가 |
| 23 | `TriggerPortal.tsx:53` | B | isOpen → dialog.showModal()/close() | 불가 — native dialog API |
| 24 | `TriggerPortal.tsx:67` | D | dialog cancel 이벤트 → preventDefault | 불가 — native ESC 차단 |

### os-sdk (바인딩 등록, 2건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 25 | `bind.ts:96` | A | KeybindingsRegistry.registerAll() | 불가 — 키바인딩 등록 |
| 26 | `trigger.ts:102` | A | TriggerOverlayRegistry.set() | 불가 — 오버레이 매핑 |

### 기타 (유틸, 3건)

| # | 파일 | 분류 | 역할 | 제거? |
|---|------|------|------|-------|
| 27 | `use-os.ts:8` | C | platform detection (mac/win/linux) | 불가 — React 고유 |
| 28 | `ThemeProvider.tsx:30` | B | theme → body.className | 불가 — DOM class |
| 29 | `DesignLinterOverlay.tsx:43` | D | MutationObserver + resize → design lint | 불가 — devtool |

---

## 구조적 관찰

### DOM이 진실인 영역 (건드리지 않음)
- user input (키 입력, IME, 텍스트 선택)
- contentEditable (caret, innerText)
- DOM rect (스크롤, 좌표, 가시성)
- native dialog API (showModal/close)
- DOM focus (el.focus())

### OS가 진실인데 React에 묶인 영역 (제거 대상)
- **Zone 초기 상태** (value.initial, select.initial, expand.initial) — useLayoutEffect에서 os.setState()
- **Zone autoFocus** — useLayoutEffect에서 os.dispatch(OS_FOCUS)

### 다음 단계
- Blueprint "Zone Initial State Ownership" (T1-T7) 실행
- Zone.tsx useLayoutEffect에서 초기 상태 블록(#2, #3) 제거
- onRegister hook으로 이전 → 경로 무관 1회 실행
