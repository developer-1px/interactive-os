# 🔍 Code Review — 철학 준수 + 네이밍/구조

> **Date**: 2026-02-11  
> **Scope**: `src/os-new/`, `src/command-palette/`  
> **기준**: `.agent/rules.md` 9대 원칙 + 5대 검사 축

---

## 통계 요약

| 검사 항목 | 🔴 Critical | 🟡 Warning | 🔵 Info |
|---|---|---|---|
| 커맨드 원칙 | 2 | 1 | — |
| 커널 상태 원칙 | — | — | — |
| 표준 인터페이스 | 1 | — | — |
| Type-Strict | 2 | 3 | — |
| Declarative | 2 | 2 | 1 |
| 네이밍/구조 | — | 1 | 1 |
| **합계** | **7** | **7** | **2** |

---

## 🔴 Critical — 즉시 수정 필요

### C1. `onDismiss: () => void` — 커맨드 원칙 위반

**원칙**: 모든 인터랙션 prop은 `BaseCommand` 브랜드 타입

| 파일 | 라인 | 현재 |
|---|---|---|
| [FocusGroup.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/primitives/FocusGroup.tsx#L133) | 133 | `onDismiss?: () => void` |
| [Zone.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Zone.tsx#L63) | 63 | `onDismiss?: () => void` |

**문제**: 다른 모든 인터랙션 prop (`onAction`, `onSelect`, `onCopy` 등)은 `BaseCommand`인데, `onDismiss`만 유일하게 콜백. DOM element에 `__onDismiss` ref를 몰래 붙이는 해킹도 동반.

**수정안**: `onDismiss?: BaseCommand` + `escape.ts`에서 `kernel.dispatch(command)` 호출

---

### C2. `Modal.onClose: () => void` — 커맨드 원칙 위반

| 파일 | 라인 | 현재 |
|---|---|---|
| [Modal.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Modal.tsx#L29) | 29 | `onClose: () => void` |

**문제**: Dialog는 커널의 `OVERLAY_CLOSE`를 사용하는데, Modal은 콜백을 받음. 동일 개념에 다른 인터페이스 — 규칙 11번 "하나의 개념 = 하나의 이름" 위반.

**수정안**: Modal을 Dialog의 thin wrapper로 통합하거나, `onClose`를 커널 커맨드로 교체.

---

### C3. `(el as any).__onDismiss` — 비표준 인터페이스 + Type 위반

| 파일 | 라인 | 현재 |
|---|---|---|
| [FocusGroup.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/primitives/FocusGroup.tsx#L292) | 292 | `(el as any).__onDismiss = onDismissRef` |
| [escape.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/escape.ts#L41) | 41 | `const dismissRef = (zoneEl as any)?.__onDismiss` |

**문제**: DOM element에 private property를 몰래 붙이는 패턴. `as any` 필수, 타입 안전성 0, LLM이 이해 불가능한 자체 발명 프로토콜.

**수정안**: C1 수정 시 자동 해결. `onDismiss`를 `BaseCommand`로 바꾸면 커널 상태를 통해 전달.

---

### C4. `escape.ts` — `setTimeout` 타이밍 해킹

| 파일 | 라인 | 현재 |
|---|---|---|
| [escape.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/escape.ts#L44) | 44 | `setTimeout(() => dismissRef.current?.(), 0)` |

**문제**: "React가 상태 업데이트를 처리하도록 defer" — 이건 커널 파이프라인이 해결해야 할 문제를 setTimeout으로 우회. 100% Declarative 위반.

**수정안**: C1 수정 시 자동 해결. 커널 `dispatch`의 effect로 처리하면 타이밍 문제 없음.

---

### C5. `focusData.ts` — `setTimeout` + `Promise.all` + 동적 import

| 파일 | 라인 | 현재 |
|---|---|---|
| [focusData.ts](file:///Users/user/Desktop/interactive-os/src/os-new/core/focus/lib/focusData.ts#L284) | 284 | `setTimeout(() => { ... }, 50)` |
| [focusData.ts](file:///Users/user/Desktop/interactive-os/src/os-new/core/focus/lib/focusData.ts#L299-L303) | 299-303 | `Promise.all([import(...), import(...)]).then(...)` |

**문제**: `popAndRestoreFocus()`에서 50ms setTimeout + 동적 import로 커널 커맨드 실행. 커널 파이프라인 원칙 완전 우회.

**수정안**: 이 로직을 커널 커맨드(`STACK_POP`)의 effect로 통합.

---

### C6. `CommandPalette.tsx` — `document.querySelector` 직접 사용

| 파일 | 라인 | 현재 |
|---|---|---|
| [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L94) | 94 | `document.querySelector('[data-zone-id="command-palette-list"]')` |

**문제**: input의 ↑↓ 키를 Zone으로 전달하기 위해 DOM을 직접 쿼리하고, `new KeyboardEvent`를 합성해서 dispatch. 100% Declarative 위반 + 비표준 인터페이스.

**수정안**: 커널 커맨드 `NAVIGATE({ zoneId, direction })` 직접 dispatch.

---

### C7. `CommandPalette.tsx` — `onAction={{ type: "..." } as any}`

| 파일 | 라인 | 현재 |
|---|---|---|
| [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L159) | 159 | `onAction={{ type: "COMMAND_PALETTE_ACTION" } as any}` |

**문제**: 브랜드 타입 `BaseCommand`를 `as any`로 우회. 등록되지 않은 커맨드 문자열을 사용. Type-Strict 위반.

**수정안**: `kernel.defineCommand("COMMAND_PALETTE_ACTION", ...)`으로 정식 등록 후 사용.

---

## 🟡 Warning — 리팩토링 권장

### W1. `as any` 다수 사용 — `EXPAND`, `SELECT` dispatch

| 파일 | 라인 |
|---|---|
| [select.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/select.ts#L37) | 37 |
| [activate.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/activate.ts#L23) | 23 |
| [FocusSensor.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/1-listeners/focus/FocusSensor.tsx#L90-L101) | 90-101 |

**문제**: 커맨드 간 dispatch 시 `as any` 필수 — 커맨드 타입 시스템이 cross-command dispatch를 지원하지 못함.

**수정안**: `EffectMap`의 `dispatch` 필드 타입을 `BaseCommand`로 확장.

---

### W2. `register.ts` — `OVERLAY_CLOSE/OPEN as any`

| 파일 | 라인 |
|---|---|
| [register.ts](file:///Users/user/Desktop/interactive-os/src/command-palette/register.ts#L26) | 26 |
| [register.ts](file:///Users/user/Desktop/interactive-os/src/command-palette/register.ts#L35) | 35 |

**문제**: `dispatch` 반환값에서 `as any` — EffectMap 타입이 다른 커맨드의 반환 타입을 수용하지 못함. W1과 동일 근본 원인.

---

### W3. `hydrateState.ts` — `as any` 8회

| 파일 | 라인 |
|---|---|
| [hydrateState.ts](file:///Users/user/Desktop/interactive-os/src/os-new/core/persistence/hydrateState.ts#L31-L37) | 31-37 |

**문제**: `initialState`와 `loaded`의 타입을 제네릭으로 풀지 못하고 `as any`로 속성 접근.

---

### W4. `focusGroupStore.ts` — `setTimeout`으로 store cleanup

| 파일 | 라인 |
|---|---|
| [focusGroupStore.ts](file:///Users/user/Desktop/interactive-os/src/os-new/store/focusGroupStore.ts#L95) | 95 |

**문제**: unmount 시 store를 바로 삭제하지 않고 setTimeout으로 지연 — 재마운트 시 재사용 패턴이지만 Declarative 원칙에 어긋남.

---

### W5. `Field.tsx` — `(innerRef as any).current`

| 파일 | 라인 |
|---|---|
| [Field.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Field.tsx#L216-L255) | 216, 253, 255 |

**문제**: ref 머지 로직에서 `as any` 3회. Generic callback ref 유틸이 필요.

---

### W6. `useRouteList.ts` — `as any`로 Route tree traversal

| 파일 | 라인 |
|---|---|
| [useRouteList.ts](file:///Users/user/Desktop/interactive-os/src/command-palette/useRouteList.ts#L47-L53) | 47, 53 |

**문제**: TanStack Router의 내부 route tree 타입이 public이 아니라서 `as any` 필수. 외부 라이브러리 한계이므로 `biome-ignore`으로 문서화 권장.

---

### W7. `osCommand.ts` — `setTimeout` call reset timer

| 파일 | 라인 |
|---|---|
| [osCommand.ts](file:///Users/user/Desktop/interactive-os/src/os-new/core/focus/pipeline/core/osCommand.ts#L272) | 272 |

**문제**: 타이밍 해킹으로 call count 리셋. 레거시 파이프라인 잔재.

---

## 🔵 Info — 개선 제안

### I1. `Trigger.tsx`/`Dialog.tsx` — `(child.type as any) === Component` 패턴

| 파일 | 라인 |
|---|---|
| [Trigger.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Trigger.tsx#L145) | 145 |
| [Dialog.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Dialog.tsx#L92) | 92 |

**참고**: React의 `child.type` 비교는 React 내부 API에 의존. `displayName` 기반 매칭이나 Context 기반 통신이 더 type-safe.

---

### I2. `1-listeners/` — `addEventListener` 사용

**OK**: `1-listeners/`는 규칙상 "Listener = DOM → 커널 번역기"이므로 `addEventListener`는 이 레이어에서만 허용. spike 폴더의 사용은 레거시이므로 마이그레이션 시 정리.

---

## 우선순위 정리

| 순위 | 항목 | 영향 범위 | 난이도 |
|---|---|---|---|
| 1 | **C1+C3+C4** `onDismiss` → `BaseCommand` | FocusGroup, Zone, Dialog, escape.ts | 중 |
| 2 | **C6** CommandPalette `querySelector` 제거 | CommandPalette | 소 |
| 3 | **C7** `onAction` 정식 커맨드 등록 | CommandPalette | 소 |
| 4 | **C2** Modal.onClose 통합 | Modal.tsx | 소 |
| 5 | **C5** `popAndRestoreFocus` 커널 통합 | focusData.ts, STACK_POP | 중 |
| 6 | **W1+W2** EffectMap dispatch 타입 확장 | kernel 패키지 | 대 |
