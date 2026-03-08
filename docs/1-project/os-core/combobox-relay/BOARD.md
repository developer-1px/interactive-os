# combobox-relay

## Context

Claim: QuickPick.tsx의 12건 L2 위반(os.dispatch 6, os.getState 1, onClick 1, onKeyDown 1, document.querySelector 1)의 근본 원인은 `resolveKeyboard.ts:88`의 `if (isCombobox) return EMPTY` — OS가 combobox input의 키보드를 의도적으로 차단하여 앱이 수동 dispatch할 수밖에 없는 구조.

Before → After:
- `resolveKeyboard.ts:88`: 전체 차단 → nav key만 layer chain 통과 (3줄)
- `QuickPick.tsx`: os.dispatch 6건 + os.getState 1건 + querySelector 1건 → 0건
- `roleRegistry.ts`: combobox inputmap 없음 → Enter/click → OS_ACTIVATE 추가

Risks:
- virtualFocus + preventDefault에서 click→activate 경로 미검증 (구현 시 확인)
- Tab typeahead가 OS_TAB과 충돌 가능 (input의 onKeyDown에서 preventDefault로 해소)

규모: Light

## Now

- [ ] T1: resolveKeyboard combobox nav key relay
- [ ] T2: roleRegistry combobox inputmap + QuickPick zone options
- [ ] T3: QuickPick overlay lifecycle → useOverlay
- [ ] T4: QuickPick handler 제거 (onKeyDown/onClick/getState/querySelector)
- [ ] T5: CommandPalette isOpen prop 제거
- [ ] T6: headless test command-palette

## Done

## Unresolved

- Shift+Shift multi-tap keybinding (register.ts) → 별도 backlog

## Ideas

- combobox role을 APG showcase에 추가
- aria-activedescendant 자동 투영 (virtualFocus Zone)
