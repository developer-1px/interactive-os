# Plan — Phase 2: Trigger Wrapper 전면 무효화

> 작성일: 2026-03-09
> 근거: Discussion 2026-03-09 "Wrapper를 제거하고 props-spread로 전면 전환"
> 원칙: L0(headless)=행동, L1(data-attr)=contract, L2(React)=투영. 행동이 L2에 있으면 아키텍처 위반.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-sdk/defineApp/trigger.ts:createCompoundTrigger` | 7-part compound factory (Root,Trigger,Portal,Popover,Content,Dismiss,Confirm) | 삭제. `zone.overlay()` → `OverlayHandle { overlayId, trigger }` | Clear | — | tsc 0, trigger test 유지 | 소비자 10곳 일괄 변경 |
| 2 | `os-react/trigger/TriggerBase.tsx` (228줄) | overlay ARIA + cloneElement + Portal 분리 | 삭제. overlay ARIA는 L0 compute.ts에서 투영 | Clear | →#1 | tsc 0 | Portal/Popover/Dismiss 함께 삭제 |
| 3 | `os-react/trigger/TriggerPortal.tsx` | `<dialog>` + Zone + showModal 동기화 | **독립 분리** → `<ModalPortal overlayId role>`. Trigger 의존 제거 | Clear | →#1 | dialog 테스트 PASS | L2 렌더링 관심사로 유지 |
| 4 | `os-react/trigger/TriggerPopover.tsx` | `<Zone>` + conditional render | **독립 분리** → `<PopoverPortal overlayId role>`. Trigger 의존 제거 | Clear | →#1 | menu 테스트 PASS | 동일 |
| 5 | `os-react/trigger/TriggerDismiss.tsx` | Item + ZoneRegistry + useOverlayContext | 삭제. dismiss = `bind({ triggers: { Dismiss: () => OS_OVERLAY_CLOSE({id}) } })` | Clear | →#1 | dismiss 테스트 PASS | — |
| 6 | `os-react/trigger/OverlayContext.tsx` | React Context overlayId 전파 | 삭제. overlayId는 명시적 인자 | Clear | →#5 | tsc 0 | — |
| 7 | `os-react/trigger/index.ts` | barrel: Trigger compound namespace | 삭제 | Clear | →#2~6 | 0 import | — |
| 8 | `src/apps/builder/LocaleSwitcher.tsx` | `<Trigger role="menu">` + Portal + Dismiss | `bind({ triggers })` + `<PopoverPortal>` + prop-getter | Clear | →#1,4,5 | 기존 동작 유지 | 마지막 구형 Wrapper |
| 9 | `src/pages/layer-showcase/` (Menu,Popover,ListboxDropdown,Tooltip) | compound `.Root > .Trigger() > .Popover` | trigger prop-getter + `<PopoverPortal>` 직접 | Clear | →#1,4 | layer 테스트 PASS | 4파일 |
| 10 | `src/pages/layer-showcase/` (Dialog,AlertDialog,Nested) + `os-test-suite/OverlayPattern` | compound `.Root > .Trigger() > .Content` | trigger prop-getter + `<ModalPortal>` 직접 | Clear | →#1,3 | dialog 테스트 PASS | 4파일 |
| 11 | `src/apps/todo/app.ts` + `TodoToolbar.tsx` | `listCollection.overlay()` → ClearDialog compound | trigger prop-getter + `<ModalPortal>` + dismiss/confirm prop-getter | Clear | →#1,3,5 | todo 테스트 PASS | — |
| 12 | `src/pages/apg-showcase/MenuButtonPattern.tsx` | `triggerZone.overlay()` → ActionsMenu compound | trigger prop-getter + `<PopoverPortal>` | Clear | →#1,4 | APG menu-button 테스트 PASS | — |
| 13 | `tests/os-sdk/trigger.test.ts` + `zone-trigger-api.test.ts` | CompoundTriggerComponents 검증 | 새 OverlayHandle API 검증 | Clear | →#1 | 테스트 PASS | — |
| 14 | `os-sdk/defineApp/index.ts:overlay()` + `types.ts` | `createCompoundTrigger()` → CompoundTriggerComponents 반환 | `OverlayHandle { overlayId, trigger }` 반환, TriggerOverlayRegistry 등록 | Clear | →#1 | tsc 0 + trigger test PASS | API breaking change |

## 새 API 설계

### `zone.overlay()` 반환

```ts
interface OverlayHandle {
  overlayId: string;
  trigger: <T extends HTMLElement>(payload?: string) => React.HTMLAttributes<T>;
  // Portal/Popover는 반환하지 않음 — 소비자가 직접 <ModalPortal>/<PopoverPortal> 사용
}
```

### 소비자 Before/After 예시 (Menu)

```tsx
// BEFORE
const MenuTrigger = triggerZone.overlay("layer-menu", { role: "menu" });

<MenuTrigger.Root>
  <button {...MenuTrigger.Trigger()}>Edit</button>
  <MenuTrigger.Popover aria-label="Edit Actions" className="...">
    <Item id="cut">Cut</Item>
  </MenuTrigger.Popover>
</MenuTrigger.Root>

// AFTER
const menu = triggerZone.overlay("layer-menu", { role: "menu" });

<button {...menu.trigger()}>Edit</button>
<PopoverPortal overlayId="layer-menu" role="menu" aria-label="Edit Actions" className="...">
  <Item id="cut">Cut</Item>
</PopoverPortal>
```

### 소비자 Before/After 예시 (Dialog)

```tsx
// BEFORE
<ClearDialog.Root>
  <button {...ClearDialog.Trigger()}>Delete</button>
  <ClearDialog.Content title="Confirm?">
    <ClearDialog.Dismiss><button>Cancel</button></ClearDialog.Dismiss>
    <ClearDialog.Confirm><button>OK</button></ClearDialog.Confirm>
  </ClearDialog.Content>
</ClearDialog.Root>

// AFTER
<button {...clearDialog.trigger()}>Delete</button>
<ModalPortal overlayId="todo-clear-dialog" role="alertdialog" title="Confirm?">
  <button {...dismissTrigger()}>Cancel</button>
  <button {...confirmTrigger()}>OK</button>
</ModalPortal>
```

## 라우팅
승인 후 → /go (기존 프로젝트 action-centric-trigger Phase 2) — Wrapper 전면 제거 + Portal 독립 분리
