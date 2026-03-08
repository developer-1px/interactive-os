# Blueprint: Combobox Role — Input→Zone Keyboard Proxy

> 작성일: 2026-03-09
> 출발점: /discussion — command-palette onClick 제거 + OS gap 분석

## 1. Goal

QuickPick.tsx의 **12건 L2 위반**(os.dispatch 6, os.getState 1, onClick 1, onKeyDown 1, onChange 1, document.querySelector 1, useState 1)을 OS 메커니즘으로 대체한다. 완료 조건: QuickPick.tsx에서 `os.dispatch`, `os.getState`, `document.querySelector`가 0건.

## 2. Why

- **L2 Pure Projection 원칙 위반**: React(.tsx)에서 os.dispatch 직접 호출은 무조건 실수 (lint rule `no-dispatch-in-tsx` ERROR)
- **근본 원인**: combobox role preset이 roleRegistry에 존재하지만, `resolveKeyboard.ts:88`에서 `if (isCombobox) return EMPTY`로 **OS가 의도적으로 키보드를 차단**. 앱이 수동 dispatch할 수밖에 없는 구조
- **Pit of Success 위반**: combobox를 만들려면 OS를 우회해야 하는 구조 = 잘못 만들기가 더 쉬운 구조

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| A1. combobox input은 항상 DOM focus를 독점해야 한다 | ✅ 유효. W3C APG combobox spec 요구사항. input이 focus를 가져야 타이핑 가능 | — |
| A2. OS KeyboardListener는 Zone에 focus가 있어야 동작한다 | ✅ 현재 사실. 하지만 **변경 가능** — input에서 발생한 키를 Zone에 relay하는 경로를 추가하면 됨 | **이것이 핵심 injection point** |
| A3. input value(query)는 OS state여야 한다 | ❌ **의문**. query는 필터링 입력일 뿐 — Zone의 items가 바뀌는 트리거. OS state로 올리면 불필요한 복잡도. React local state가 적절할 수 있음 | query는 React state 유지, OS는 관여 안 함 |
| A4. overlay open/close는 외부 isOpen prop으로 제어해야 한다 | ❌ **무효화 가능**. OS overlay가 SSOT면 isOpen prop 불필요. `useOverlay(id)` + trigger로 충분 | QuickPick을 OS-managed overlay로 전환 |
| A5. 첫 아이템 autoFocus를 수동으로 해야 한다 | ❌ **무효화 가능**. OS_OVERLAY_OPEN이 이미 autoFocus 지원. combobox에서도 동일하게 동작해야 함 | combobox overlay open → 자동으로 첫 item virtualFocus |

## 4. Ideal

```
사용자가 ⌘K를 누르면:
1. OS가 command-palette overlay를 연다 (OS_OVERLAY_OPEN)
2. Zone이 combobox role로 활성화 — input에 DOM focus, 첫 item에 virtualFocus
3. 사용자가 타이핑 → React가 query state 관리 → items 필터링 (앱 책임)
4. Arrow↑↓ on input → OS가 Zone navigation 처리 (OS_NAVIGATE)
5. Enter on input → OS가 Zone activate 처리 (OS_ACTIVATE → onAction)
6. 아이템 클릭 → OS가 activate 처리 (onClick → OS_ACTIVATE → onAction)
7. Escape → OS가 overlay close + focus restore (이미 동작)
8. onAction callback에서 앱이 선택 처리 + overlay close

QuickPick.tsx에는 os.dispatch, onKeyDown(nav), onClick이 없다.
남는 것: useState(query), onChange(input), renderItem — 이것은 앱의 정당한 책임.
```

## 5. Inputs

### 기존 코드
- `packages/os-core/src/engine/registries/roleRegistry.ts:332` — combobox preset (이미 존재)
- `packages/os-core/src/1-listen/keyboard/resolveKeyboard.ts:88` — combobox 키보드 차단 (변경 대상)
- `packages/os-core/src/1-listen/keyboard/senseKeyboard.ts:77` — isCombobox 감지 (유지)
- `packages/os-core/src/4-command/overlay/overlay.ts` — OS_OVERLAY_OPEN (autoFocus 이미 지원)
- `src/command-palette/QuickPick.tsx` — 현재 구현 (마이그레이션 대상)
- `src/command-palette/register.ts` — keybinding + Shift+Shift (별도 이슈)

### 참조 패턴
- `src/pages/layer-showcase/patterns/ListboxDropdownPattern.tsx` — 가장 유사한 확정 패턴 (trigger → popup listbox)
- `src/pages/apg-showcase/combobox/` — APG combobox showcase (있다면)
- W3C APG Combobox Pattern spec

### 지식
- 5개 overlay role(dialog, alertdialog, menu, listbox, popover) 확정, headless 테스트 증명
- `zone.overlay(id, { role })` — trigger prop-getter 생성 메커니즘
- `activate: { onClick: true }` — Zone built-in click activate

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | input Arrow→Zone OS_NAVIGATE | `isCombobox → return EMPTY` (키보드 차단) | resolveKeyboard에 combobox relay layer 추가 | 🔴 High | — |
| G2 | input Enter→Zone OS_ACTIVATE | 같은 차단 | G1과 동일 해결 | 🔴 High | G1 |
| G3 | item click→Zone onAction | onClick prop 수동 전달 | `activate: { onClick: true }` 활성화 | 🟡 Med | — |
| G4 | overlay lifecycle OS-managed | isOpen prop + useEffect dispatch | QuickPick을 trigger→overlay 패턴으로 전환 | 🟡 Med | — |
| G5 | autoFocus on overlay open | setTimeout + querySelector + OS_FOCUS | OS_OVERLAY_OPEN의 기존 autoFocus가 combobox에서도 동작 확인 | 🟡 Med | G4 |
| G6 | Shift+Shift keybinding | window.addEventListener 수동 | OS keybinding multi-tap 지원 | 🟠 Low | — (별도 이슈) |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | combobox keyboard relay | Complicated | — | `resolveKeyboard`에서 isCombobox일 때 Arrow/Enter/Escape를 Zone에 relay하는 layer 추가. `return EMPTY` 대신 combobox-specific resolution |
| T2 | combobox activate onClick | Clear | — | combobox role preset에 `activate: { onClick: true }` 추가 또는 QuickPick zone options에 명시 |
| T3 | overlay lifecycle 전환 | Clear | T1 | QuickPick에서 isOpen prop + useEffect dispatch 제거. trigger→OS_OVERLAY_OPEN 패턴으로 전환. CommandPalette의 `useOverlay`가 이미 있으므로 이를 SSOT로 |
| T4 | autoFocus 검증 | Clear | T3 | OS_OVERLAY_OPEN의 autoFocus가 combobox virtualFocus에서 동작하는지 확인. 안 되면 overlay command에 combobox 분기 추가 |
| T5 | QuickPick 마이그레이션 | Clear | T1-T4 | onKeyDown(nav), onClick, os.dispatch, os.getState, document.querySelector 제거. Zone onAction + combobox role로 대체 |
| T6 | headless test | Clear | T5 | command-palette overlay lifecycle + keyboard nav + item select headless test 작성 |
| T7 | Shift+Shift (별도) | Complex | — | OS keybinding multi-tap 지원. 이 blueprint 범위 밖. backlog 등록 |

### 의존 그래프

```
T1 (keyboard relay) ─┐
T2 (onClick)         ├→ T5 (마이그레이션) → T6 (test)
T3 (overlay) ────────┤
T4 (autoFocus) ──────┘
                      T7 (Shift+Shift) → backlog
```

### 핵심 판단

**T1이 유일한 Complicated task**. `resolveKeyboard`의 `isCombobox → EMPTY` 차단을 해제하되, combobox input의 타이핑(문자 키)은 OS가 가로채면 안 된다. **relay 대상은 navigation keys(Arrow, Enter, Escape)만**. 이것이 설계의 핵심 결정.
