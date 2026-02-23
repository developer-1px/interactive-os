# Dialog 구현 계획서 — Radix Interface on ZIFT Kernel

> **Date**: 2026-02-11  
> **Goal**: Radix Dialog 인터페이스를 ZIFT Kernel 위에 구축. 기존 `OS.Modal` 대체.

---

## 설계 원칙 (8가지)

1. **Passive Primitive** — 앱 코드에 `useState`, `useEffect`, `onClick` 0줄
2. **Kernel 상태 소유** — overlay on/off는 Kernel의 `overlays.stack`이 유일한 진실
3. **매직 금지** — 모든 의도는 명시적 마커 (`Trigger.Portal`, `Trigger.Dismiss`)
4. **W3C 기준** — 명세에 있으면 role, 없으면 컴포넌트
5. **ONE prescribed way** — 닫기는 `Trigger.Dismiss` 하나만. 커맨드 이름 노출 금지
6. **Radix 인터페이스 계승** — Dialog compound 구조와 네이밍을 그대로
7. **Bottom-up** — Kernel → Trigger 확장 → Dialog (Layer 2) 순서
8. **Facade/Core 분리** — 앱은 `Dialog.Close`, 내부는 `OVERLAY_CLOSE(id)`

---

## Phase 1: Kernel Overlay State

### [MODIFY] [OSState.ts](file:///Users/user/Desktop/interactive-os/src/os-new/state/OSState.ts)

`overlays` slice 추가:

```ts
export interface OverlayEntry {
  id: string;
  type: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip";
}

export interface OSState {
  focus: { ... };
  overlays: {
    stack: OverlayEntry[];
  };
}
```

### [MODIFY] [initial.ts](file:///Users/user/Desktop/interactive-os/src/os-new/state/initial.ts)

```ts
export const initialOSState: OSState = {
  focus: { ... },
  overlays: { stack: [] },
};
```

### [NEW] [overlay.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/overlay.ts)

```ts
OVERLAY_OPEN(id, type) → stack.push({ id, type })
OVERLAY_CLOSE(id) → stack에서 id 제거 (없으면 stack.pop())
```

### [MODIFY] [commands/index.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/index.ts)

`OVERLAY_OPEN`, `OVERLAY_CLOSE` export 추가.

---

## Phase 2: Layer 1 — Trigger Extension

### [MODIFY] [Trigger.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Trigger.tsx)

현재 `Trigger`는 `forwardRef` 컴포넌트. namespace merge로 확장:

```tsx
// 기존 Trigger function 유지
export const Trigger = forwardRef<...>(...);

// namespace merge로 서브 컴포넌트 추가
export namespace Trigger {
  // role prop을 받는 overlay trigger
  export type OverlayRole = "dialog" | "alertdialog" | "menu" | ...;
  
  // Portal — overlay content 마커
  export function Portal(props: PortalProps) { ... }
  
  // Dismiss — 가장 가까운 overlay 닫기
  export function Dismiss(props: DismissProps) { ... }
}
```

> **주의**: `forwardRef` 반환값은 object이므로 `namespace` merge가 안 될 수 있음.
> 대안: `Object.assign` 패턴 또는 wrapper function.

**구현 세부**:
- `Trigger.Portal`: Context (`OverlayContext`)로 overlay ID를 children에 전달.  
  내부적으로 `<dialog ref>` 렌더링. `kernel.useComputed`로 open 상태 구독.
  open 시 `dialog.showModal()`, close 시 `dialog.close()`.
- `Trigger.Dismiss`: `OverlayContext`에서 overlay ID 읽고, click 시 `OVERLAY_CLOSE(id)` dispatch.
- Trigger에 `role` prop 추가: overlay role이면 click 시 `OVERLAY_OPEN(id)` dispatch.

---

## Phase 3: Layer 2 — Dialog Component

### [NEW] [Dialog.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/Dialog.tsx)

Radix 인터페이스의 thin wrapper:

```tsx
// Dialog.Root = Trigger role="dialog" wrapper
// Dialog.Trigger = trigger element (asChild pattern)
// Dialog.Portal = Trigger.Portal
// Dialog.Content = Trigger.Portal + Zone role="dialog" 
// Dialog.Close = Trigger.Dismiss

<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content title="Settings">
    <Item id="ok">OK</Item>
    <Dialog.Close>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog>
```

### [MODIFY] [OS.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/OS.tsx)

`Dialog` export 추가. `Modal`은 deprecated annotation.

---

## Phase 4: Refactor FocusStackTest

### [MODIFY] [FocusStackTest.tsx](file:///Users/user/Desktop/interactive-os/src/pages/focus-showcase/tests/FocusStackTest.tsx)

Before:
```tsx
const [modal1Open, setModal1Open] = useState(false);
<button onClick={() => setModal1Open(true)}>Open</button>
<Modal open={modal1Open} onClose={() => setModal1Open(false)}>
  <FocusGroup role="dialog" onDismiss={() => setModal1Open(false)}>
```

After:
```tsx
// useState 0줄, onClick 0줄
<Dialog>
  <Dialog.Trigger>Open Modal</Dialog.Trigger>
  <Dialog.Content title="Modal 1">
    <Item id="modal1-1">Modal Item A</Item>
    <Dialog.Close>Close</Dialog.Close>
  </Dialog.Content>
</Dialog>
```

---

## Verification Plan

### Automated Tests

1. **Smoke Test** (Runtime):
   ```bash
   npm run dev  # 이미 실행 중이면 skip
   npx playwright test e2e/smoke.spec.ts
   ```
   - `/focus-showcase` 라우트가 에러 없이 렌더되는지 확인

2. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```

3. **Build**:
   ```bash
   npm run build
   ```

### Manual Verification

사용자에게 요청:
- `/focus-showcase` 페이지에서 "Open Modal" 클릭 → Dialog 열림 확인
- ESC → Dialog 닫힘 + focus 복원 확인
- Nested dialog (Open Sub-Modal) → 중첩 Dialog 열림 확인
- 내부 Dialog 닫힘 → 외부 Dialog로 focus 복원 확인
